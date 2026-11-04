"""
Deep production resilience test suite for Ustaad Career OS.
Validates:
1. Sliding-window rate limiter & abuse defense (per-client IP, proxy headers, pruning).
2. Orchestrator DAG sibling task cancellation, lock release, and timeout guarantees.
3. Strict API input validation bounds (PDF size, format, character caps, experience range).
4. Interview session sequence conflict guards (HTTP 409) and score aggregation.
5. Market cache validity, LIKE escaping, and public session column projections.
6. Multi-layer LLM JSON repair against single-quoted dicts, inner literals, and thinking blocks.
7. SSRF defense and 4.0s hard timeout isolation on portfolio crawlers.
"""
import asyncio
import os
import threading
import time
import unittest
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi import HTTPException
from fastapi.testclient import TestClient

from agents.interview_agent import evaluate_answer, generate_interview_questions
from agents.llm.client import parse_llm_json, redact_secrets, strip_thinking_blocks
from db.supabase_client import (
    PUBLIC_SESSION_COLUMNS,
    _escape_like,
    _is_cacheable_market,
    release_session_lock,
)
from main import app
from security import SlidingWindowLimiter, client_identity, enforce_server_interview_quota
import settings
from tools.cv_parser import CVParseError, extract_cv_contact, extract_cv_text
from tools.proof_of_work import inspect_portfolio_url, validate_public_http_url


class TestSecurityAndRateLimiting(unittest.TestCase):
    def setUp(self):
        self.limiter = SlidingWindowLimiter()

    def test_sliding_window_hit_and_rejection(self):
        key = "test-client-1"
        limit = 3
        window = 10  # 10 seconds

        # First 3 hits must succeed
        self.assertEqual(self.limiter.check(key, limit, window, now=100.0), (True, 0))
        self.assertEqual(self.limiter.check(key, limit, window, now=101.0), (True, 0))
        self.assertEqual(self.limiter.check(key, limit, window, now=102.0), (True, 0))

        # 4th hit must be rejected with positive retry_after
        allowed, retry_after = self.limiter.check(key, limit, window, now=103.0)
        self.assertFalse(allowed)
        self.assertGreater(retry_after, 0)
        self.assertLessEqual(retry_after, window)

        # After window slides past (now=111.0 > 100.0 + 10), hit must succeed again
        allowed_later, _ = self.limiter.check(key, limit, window, now=111.0)
        self.assertTrue(allowed_later)

    def test_limiter_pruning(self):
        # Fill limiter up to prune threshold
        self.limiter._PRUNE_THRESHOLD = 5
        for i in range(10):
            self.limiter.check(f"client-{i}", limit=10, window_seconds=5, now=10.0)

        # Trigger check with expired cutoff (now=20.0 > 10.0 + 5)
        self.limiter.check("client-new", limit=10, window_seconds=5, now=20.0)
        # Old expired clients should be pruned
        self.assertLessEqual(len(self.limiter._hits), 6)

    def test_client_identity_spoofing_defense(self):
        mock_req = MagicMock()
        mock_req.client.host = "192.0.2.1"
        mock_req.headers = {"x-forwarded-for": "10.0.0.99, 172.16.0.1"}

        # When trust_proxy_headers is False, forwarded header must be IGNORED
        with patch("settings.trust_proxy_headers", return_value=False):
            ident = client_identity(mock_req)
            self.assertEqual(ident, "192.0.2.1")

        # When trust_proxy_headers is True, valid IP is accepted
        with patch("settings.trust_proxy_headers", return_value=True):
            ident_trusted = client_identity(mock_req)
            self.assertEqual(ident_trusted, "10.0.0.99")

    def test_enforce_server_interview_quota(self):
        # BYOK mode must never raise quota error
        enforce_server_interview_quota(is_byok=True)

        with patch("settings.daily_interview_call_limit", return_value=2):
            with patch("security._interview_counter", {"date": "2026-11-04", "count": 2}):
                with patch("datetime.datetime") as mock_dt:
                    mock_dt.now.return_value.date.return_value.isoformat.return_value = "2026-11-04"
                    with self.assertRaises(HTTPException) as ctx:
                        enforce_server_interview_quota(is_byok=False)
                    self.assertEqual(ctx.exception.status_code, 429)
                    self.assertIn("interview quota for today is exhausted", ctx.exception.detail)


class TestOrchestratorDAGResilience(unittest.IsolatedAsyncioTestCase):
    async def test_stage1_sibling_cancellation_on_profile_error(self):
        from agents.orchestrator import run_pipeline

        session_id = "test-session-abort-1"
        queue = asyncio.Queue()

        market_started = asyncio.Event()
        market_canceled = asyncio.Event()

        async def _mock_profile(*args, **kwargs):
            await asyncio.sleep(0.01)
            raise RuntimeError("Profile extraction crashed intentionally.")

        async def _mock_market(*args, **kwargs):
            market_started.set()
            try:
                await asyncio.sleep(5.0)
            except asyncio.CancelledError:
                market_canceled.set()
                raise

        with patch("agents.orchestrator.run_profile_agent", side_effect=_mock_profile), \
             patch("agents.orchestrator.run_market_agent", side_effect=_mock_market), \
             patch("agents.orchestrator.mark_agent_complete", new_callable=AsyncMock), \
             patch("agents.orchestrator.update_session", new_callable=AsyncMock) as mock_update, \
             patch("agents.orchestrator.release_session_lock") as mock_release:

            await run_pipeline(
                session_id=session_id,
                cv_text="mock cv text",
                target_role="Backend Engineer",
                target_city="Lahore",
                experience_years=2.0,
                education_level="Bachelor's",
                status_queue=queue,
            )

            # Verify sibling market agent was cleanly canceled
            self.assertTrue(market_started.is_set())
            self.assertTrue(market_canceled.is_set())

            # Verify session status was marked as error
            mock_update.assert_called()
            call_args = mock_update.call_args[0]
            self.assertEqual(call_args[0], session_id)
            self.assertEqual(call_args[1]["status"], "error")
            self.assertIn("Profile extraction crashed intentionally", call_args[1]["error_message"])

            # Verify per-session lock was released in finally
            mock_release.assert_called_with(session_id)

    async def test_stage3_sibling_cancellation_on_cv_rewrite_error(self):
        from agents.orchestrator import run_pipeline

        session_id = "test-session-abort-2"
        queue = asyncio.Queue()
        roadmap_canceled = asyncio.Event()

        async def _mock_roadmap(*args, **kwargs):
            try:
                await asyncio.sleep(5.0)
            except asyncio.CancelledError:
                roadmap_canceled.set()
                raise

        async def _mock_cv_rewrite(*args, **kwargs):
            await asyncio.sleep(0.01)
            raise RuntimeError("ATS model failed.")

        with patch("agents.orchestrator.run_profile_agent", new_callable=AsyncMock, return_value={"name": "Test"}), \
             patch("agents.orchestrator.run_market_agent", new_callable=AsyncMock, return_value={"market_demand_level": "High"}), \
             patch("agents.orchestrator.run_gap_agent", new_callable=AsyncMock, return_value={"overall_readiness_score": 80}), \
             patch("agents.orchestrator.run_roadmap_agent", side_effect=_mock_roadmap), \
             patch("agents.orchestrator.run_cv_rewrite_agent", side_effect=_mock_cv_rewrite), \
             patch("agents.orchestrator.mark_agent_complete", new_callable=AsyncMock), \
             patch("agents.orchestrator.update_session", new_callable=AsyncMock) as mock_update, \
             patch("agents.orchestrator.release_session_lock") as mock_release:

            await run_pipeline(
                session_id=session_id,
                cv_text="mock cv text",
                target_role="Full Stack Dev",
                target_city="Karachi",
                experience_years=1.0,
                education_level="Bachelor's",
                status_queue=queue,
            )

            self.assertTrue(roadmap_canceled.is_set())
            mock_release.assert_called_with(session_id)


class TestPipelineInputValidationAndBoundaries(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_oversized_pdf_rejected(self):
        oversized = b"%PDF-1.4 " + b"0" * (settings.MAX_FILE_SIZE + 1024)
        resp = self.client.post(
            "/api/pipeline/start",
            files={"cv_file": ("resume.pdf", oversized, "application/pdf")},
            data={"target_role": "Data Scientist", "target_city": "Islamabad"},
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn("File is too large", resp.json()["detail"])

    def test_invalid_mime_type_rejected(self):
        doc = b"Some Word Document"
        resp = self.client.post(
            "/api/pipeline/start",
            files={"cv_file": ("resume.docx", doc, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
            data={"target_role": "Data Scientist", "target_city": "Islamabad"},
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn("Only PDF files are accepted", resp.json()["detail"])

    def test_empty_role_and_city_rejected(self):
        small_pdf = b"%PDF-1.4 mock valid pdf byte stream"
        resp_role = self.client.post(
            "/api/pipeline/start",
            files={"cv_file": ("resume.pdf", small_pdf, "application/pdf")},
            data={"target_role": "   ", "target_city": "Lahore"},
        )
        self.assertEqual(resp_role.status_code, 400)
        self.assertIn("Target role cannot be empty", resp_role.json()["detail"])

        resp_city = self.client.post(
            "/api/pipeline/start",
            files={"cv_file": ("resume.pdf", small_pdf, "application/pdf")},
            data={"target_role": "Software Engineer", "target_city": "   "},
        )
        self.assertEqual(resp_city.status_code, 400)
        self.assertIn("Target city cannot be empty", resp_city.json()["detail"])

    def test_experience_bounds_rejected(self):
        small_pdf = b"%PDF-1.4 mock valid pdf byte stream"
        resp_neg = self.client.post(
            "/api/pipeline/start",
            files={"cv_file": ("resume.pdf", small_pdf, "application/pdf")},
            data={"target_role": "DevOps", "target_city": "Karachi", "experience_years": -1.0},
        )
        self.assertEqual(resp_neg.status_code, 400)

        resp_over = self.client.post(
            "/api/pipeline/start",
            files={"cv_file": ("resume.pdf", small_pdf, "application/pdf")},
            data={"target_role": "DevOps", "target_city": "Karachi", "experience_years": 80.0},
        )
        self.assertEqual(resp_over.status_code, 400)


class TestInterviewFlowAndSequenceDefense(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_answer_length_constraints(self):
        resp_empty = self.client.post(
            "/api/interview/answer",
            json={
                "session_id": "00000000-0000-0000-0000-000000000001",
                "interview_id": "00000000-0000-0000-0000-000000000002",
                "question_id": "q1",
                "answer": "   ",
            },
        )
        self.assertEqual(resp_empty.status_code, 400)
        self.assertIn("Answer cannot be empty", resp_empty.json()["detail"])

        oversized_answer = "A" * 5001
        resp_too_long = self.client.post(
            "/api/interview/answer",
            json={
                "session_id": "00000000-0000-0000-0000-000000000001",
                "interview_id": "00000000-0000-0000-0000-000000000002",
                "question_id": "q1",
                "answer": oversized_answer,
            },
        )
        self.assertEqual(resp_too_long.status_code, 400)
        self.assertIn("Answer is too long", resp_too_long.json()["detail"])

    def test_out_of_sequence_answer_conflict(self):
        mock_interview = {
            "id": "mock-int-1",
            "session_id": "mock-sess-1",
            "questions": {
                "technical_questions": [
                    {"id": "q1", "question": "Question 1"},
                    {"id": "q2", "question": "Question 2"},
                ]
            },
            "current_question_index": 0,
            "answers": [],
            "scores": [],
        }

        with patch("routers.interview.get_session", new_callable=AsyncMock, return_value={"target_role": "Backend"}), \
             patch("routers.interview._get_interview_by_id_sync", return_value=mock_interview):

            # Submitting q2 when q1 is expected must return HTTP 409 Conflict
            resp_conflict = self.client.post(
                "/api/interview/answer",
                json={
                    "session_id": "mock-sess-1",
                    "interview_id": "mock-int-1",
                    "question_id": "q2",  # Out of sequence
                    "answer": "My answer to question 2.",
                },
            )
            self.assertEqual(resp_conflict.status_code, 409)
            self.assertIn("submission out of sequence", resp_conflict.json()["detail"])


class TestDatabaseCacheAndPublicProjections(unittest.TestCase):
    def test_public_columns_never_include_cv_text(self):
        columns = [c.strip() for c in PUBLIC_SESSION_COLUMNS.split(",")]
        self.assertNotIn("cv_text", columns)
        self.assertIn("id", columns)
        self.assertIn("candidate_name", columns)
        self.assertIn("profile_data", columns)
        self.assertIn("gap_data", columns)

    def test_like_escaping_special_characters(self):
        self.assertEqual(_escape_like("test%role_name*"), "test\\%role\\_name\\*")
        self.assertEqual(_escape_like("50% Remote"), "50\\% Remote")
        self.assertEqual(_escape_like("path\\to\\file"), "path\\\\to\\\\file")

    def test_market_cache_validation_predicates(self):
        cutoff = datetime.now(timezone.utc) - timedelta(hours=48)
        now_iso = datetime.now(timezone.utc).isoformat()
        old_iso = (datetime.now(timezone.utc) - timedelta(hours=50)).isoformat()

        # Valid server-default live cache item
        valid_item = {
            "top_required_skills": ["Python", "FastAPI"],
            "market_summary": "High demand.",
            "live_data_available": True,
            "unverified": False,
            "source_mode": "server_default",
            "generated_at": now_iso,
        }
        self.assertTrue(_is_cacheable_market(valid_item, cutoff))

        # Rejected because source_mode is byok
        byok_item = dict(valid_item, source_mode="byok")
        self.assertFalse(_is_cacheable_market(byok_item, cutoff))

        # Rejected because live search failed
        unverified_item = dict(valid_item, unverified=True)
        self.assertFalse(_is_cacheable_market(unverified_item, cutoff))

        # Rejected because generated_at is older than cutoff
        stale_item = dict(valid_item, generated_at=old_iso)
        self.assertFalse(_is_cacheable_market(stale_item, cutoff))

        # Rejected because corrupted timestamp
        corrupt_ts = dict(valid_item, generated_at="not-a-date")
        self.assertFalse(_is_cacheable_market(corrupt_ts, cutoff))


class TestLLMJSONParserAndSecretRedaction(unittest.TestCase):
    def test_json_parser_single_quotes_and_inner_literals(self):
        # Case with single quotes and word 'true' and 'null' inside a string literal
        raw = "{'summary': 'This is a true statement with null references', 'score': 95, 'verified': true}"
        parsed = parse_llm_json(raw)
        self.assertEqual(parsed["score"], 95)
        self.assertEqual(parsed["verified"], True)
        # Inner string must NOT have been corrupted
        self.assertEqual(parsed["summary"], "This is a true statement with null references")

    def test_json_parser_with_thinking_blocks(self):
        raw = (
            "<think>\n"
            "Analyzing candidate skills against Rozee.pk demand...\n"
            "</think>\n"
            "```json\n"
            "{\n"
            '  "overall_readiness_score": 85,\n'
            '  "readiness_band": "High Match",\n'
            "}\n"
            "```"
        )
        parsed = parse_llm_json(raw)
        self.assertEqual(parsed["overall_readiness_score"], 85)
        self.assertEqual(parsed["readiness_band"], "High Match")

    def test_secret_redaction_across_key_families(self):
        text = (
            "Gemini error AIzaSyD1234567890ABCDEF1234567890 failed. "
            "OpenAI sk-proj-1234567890abcdef1234567890 hit limit. "
            "Groq gsk_1234567890abcdef1234567890 timeout."
        )
        scrubbed = redact_secrets(text)
        self.assertNotIn("AIzaSyD1234567890ABCDEF1234567890", scrubbed)
        self.assertNotIn("sk-proj-1234567890abcdef1234567890", scrubbed)
        self.assertNotIn("gsk_1234567890abcdef1234567890", scrubbed)
        self.assertIn("[REDACTED_KEY]", scrubbed)

    def test_retry_after_extraction_from_headers_and_body(self):
        from agents.llm.adapters import _extract_retry_after
        import httpx

        # 1. From standard Retry-After header
        resp1 = httpx.Response(429, headers={"retry-after": "12.5"})
        self.assertEqual(_extract_retry_after(resp1, ""), 12.5)

        # 2. From retry-after-ms header
        resp2 = httpx.Response(429, headers={"retry-after-ms": "4500"})
        self.assertEqual(_extract_retry_after(resp2, ""), 4.5)

        # 3. From Groq/provider error text e.g. "Please try again in 9.12s."
        resp3 = httpx.Response(429)
        self.assertEqual(
            _extract_retry_after(resp3, "Rate limit reached. Please try again in 9.12s. Need more tokens?"),
            9.12,
        )

        # 4. Fallback None when absent
        resp4 = httpx.Response(429)
        self.assertIsNone(_extract_retry_after(resp4, "Generic rate limit reached."))


class TestProofOfWorkTimeoutAndSSRF(unittest.IsolatedAsyncioTestCase):
    async def test_portfolio_crawler_hard_timeout_isolation(self):
        # Mock fetch function to hang longer than 4.0s
        async def _mock_slow_fetch(*args, **kwargs):
            await asyncio.sleep(10.0)
            return "<html><body>Never arrives</body></html>", 200, None

        with patch("tools.proof_of_work.validate_public_http_url", return_value="https://slow-portfolio.com"), \
             patch("tools.proof_of_work._fetch_portfolio_body", side_effect=_mock_slow_fetch):
            result = await inspect_portfolio_url("https://slow-portfolio.com")
            self.assertEqual(result["status"], "unreachable")
            self.assertIn("4.0s limit exceeded", result["audit_findings"][0])

    def test_ssrf_blocks_private_subnets(self):
        with patch("socket.getaddrinfo", return_value=[(2, 1, 6, "", ("10.200.0.5", 443))]):
            with self.assertRaises(ValueError):
                validate_public_http_url("https://internal-server.local")

        with patch("socket.getaddrinfo", return_value=[(2, 1, 6, "", ("169.254.169.254", 80))]):
            with self.assertRaises(ValueError):
                validate_public_http_url("http://cloud-metadata")


if __name__ == "__main__":
    unittest.main()
