"""
Automated regression suite for Ustaad 2.0:
- Strict Server-Default Lock invariant (Gemini 3.1 Flash Lite)
- Multi-Provider BYOK (8 providers + custom model IDs + SSRF/injection guards)
- Secret redaction across error traces
- Gemini / OpenAI-compat / Reasoning (<think>) / Anthropic adapters & 1-shot JSON self-repair
- ReportLab PDF Career Dossier resilience against None/N/A salaries & XML characters
"""
import asyncio
import unittest
from unittest.mock import AsyncMock, patch

import httpx
from fastapi import HTTPException
from fastapi.testclient import TestClient

from main import app
from agents.llm.config import (
    resolve_llm_config,
    SERVER_DEFAULT_MODEL,
    SERVER_DEFAULT_PROVIDER,
)
from agents.llm.registry import PROVIDER_REGISTRY
from agents.llm.client import call_llm_json, parse_llm_json, redact_secrets
from agents.gemini_utils import parse_gemini_json
from agents.interview_agent import DIFFICULTY_LABELS, INTERVIEW_MODES
from routers.interview import _flatten_questions
from tools.cv_parser import extract_cv_text
from tools.pdf_generator import generate_career_dossier


def _mock_response(status_code: int, json_body: dict, url: str = "https://example.com") -> httpx.Response:
    req = httpx.Request("POST", url)
    return httpx.Response(status_code=status_code, json=json_body, request=req)


class TestUstaadV2Async(unittest.IsolatedAsyncioTestCase):
    async def test_server_default_lock_cannot_be_bypassed(self):
        cfg0 = await resolve_llm_config(None, None, None, None, None)
        self.assertFalse(cfg0.is_byok)
        self.assertEqual(cfg0.provider, SERVER_DEFAULT_PROVIDER)
        self.assertEqual(cfg0.model, SERVER_DEFAULT_MODEL)

        # Spoofed provider + custom model WITHOUT user API key must stay locked
        cfg_spoof = await resolve_llm_config(
            x_llm_api_key=None,
            x_gemini_api_key=None,
            x_llm_provider="anthropic",
            x_llm_model="claude-opus-4-5",
            x_llm_region="cn",
        )
        self.assertFalse(cfg_spoof.is_byok)
        self.assertEqual(cfg_spoof.provider, "gemini")
        self.assertEqual(cfg_spoof.model, "gemini-3.1-flash-lite")

        # Whitespace-only API key must also stay locked
        cfg_ws = await resolve_llm_config(
            x_llm_api_key="   ",
            x_gemini_api_key="  ",
            x_llm_provider="openai",
            x_llm_model="gpt-4.1",
            x_llm_region=None,
        )
        self.assertFalse(cfg_ws.is_byok)
        self.assertEqual(cfg_ws.provider, "gemini")
        self.assertEqual(cfg_ws.model, "gemini-3.1-flash-lite")

    async def test_byok_providers_and_injection_guards(self):
        expected = ["gemini", "openai", "anthropic", "deepseek", "qwen", "glm", "groq", "openrouter"]
        for pid in expected:
            self.assertIn(pid, PROVIDER_REGISTRY)
            cfg = await resolve_llm_config(
                x_llm_api_key="user-secret-key-999999",
                x_gemini_api_key=None,
                x_llm_provider=pid,
                x_llm_model="org/custom-model-v2:free",
                x_llm_region="intl",
            )
            self.assertTrue(cfg.is_byok)
            self.assertEqual(cfg.provider, pid)
            self.assertEqual(cfg.model, "org/custom-model-v2:free")

        for bad_model in ["../../etc/passwd", "gpt-4o?evil=1", "model with space", "m#frag"]:
            with self.assertRaises(HTTPException) as ctx:
                await resolve_llm_config(
                    x_llm_api_key="sk-validkey123456789",
                    x_gemini_api_key=None,
                    x_llm_provider="openai",
                    x_llm_model=bad_model,
                    x_llm_region=None,
                )
            self.assertEqual(ctx.exception.status_code, 400)

        with self.assertRaises(HTTPException) as ssrf_ctx:
            await resolve_llm_config(
                x_llm_api_key="sk-validkey123456789",
                x_gemini_api_key=None,
                x_llm_provider="http://169.254.169.254",
                x_llm_model="gpt-4o",
                x_llm_region=None,
            )
        self.assertEqual(ssrf_ctx.exception.status_code, 400)

    async def test_adapters_and_json_self_repair(self):
        # Gemini 2.5 thought=True skipping
        cfg_gem = await resolve_llm_config(
            x_llm_api_key="AIzaFakeTestKey123456789",
            x_gemini_api_key=None,
            x_llm_provider="gemini",
            x_llm_model="gemini-2.5-pro",
            x_llm_region=None,
        )
        gem_payload = {
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {"thought": True, "text": "Internal reasoning {not json"},
                            {"text": '{"overall_readiness_score": 84}'},
                        ]
                    }
                }
            ]
        }
        with patch("httpx.AsyncClient.post", new=AsyncMock(return_value=_mock_response(200, gem_payload))):
            res = await call_llm_json("sys", "user", cfg_gem)
            self.assertEqual(res["overall_readiness_score"], 84)

        # DeepSeek Reasoner <think> stripping
        cfg_ds = await resolve_llm_config(
            x_llm_api_key="sk-deepseekfake123456789",
            x_gemini_api_key=None,
            x_llm_provider="deepseek",
            x_llm_model="deepseek-reasoner",
            x_llm_region=None,
        )
        ds_payload = {
            "choices": [{"message": {"content": '<think>chain</think>```json\n{"ats_score_estimate": 92}\n```'}}]
        }
        with patch("httpx.AsyncClient.post", new=AsyncMock(return_value=_mock_response(200, ds_payload))):
            res_ds = await call_llm_json("sys", "user", cfg_ds)
            self.assertEqual(res_ds["ats_score_estimate"], 92)

        # Anthropic + 1-shot JSON self-repair
        cfg_ant = await resolve_llm_config(
            x_llm_api_key="sk-ant-fake1234567890",
            x_gemini_api_key=None,
            x_llm_provider="anthropic",
            x_llm_model="claude-sonnet-4-5",
            x_llm_region=None,
        )
        broken = {"content": [{"type": "text", "text": "{malformed_json"}]}
        repaired = {"content": [{"type": "text", "text": '{"repaired": true}'}]}
        mock_post = AsyncMock(side_effect=[_mock_response(200, broken), _mock_response(200, repaired)])
        with patch("httpx.AsyncClient.post", new=mock_post):
            res_ant = await call_llm_json("sys", "user", cfg_ant)
            self.assertTrue(res_ant["repaired"])
            self.assertEqual(mock_post.call_count, 2)

    async def test_portfolio_inspector_html_parsing(self):
        from tools.proof_of_work import inspect_portfolio_url
        html_doc = """<!DOCTYPE html>
        <html>
          <head>
            <title>Jane Doe | AI Systems Architect</title>
            <meta name="description" content="Senior Software Engineer building scalable ML pipelines in Lahore.">
            <meta property="og:title" content="Jane Doe Portfolio">
            <meta property="og:image" content="https://janedoe.dev/og.png">
          </head>
          <body>
            <h1>Selected Work & Case Studies</h1>
            <p>Built high-throughput data processing platforms handling 10k RPS.</p>
            <a href="mailto:jane@example.com">Contact Me</a>
          </body>
        </html>"""

        with patch("tools.proof_of_work.validate_public_http_url", return_value="https://janedoe.dev"):
            mock_resp = httpx.Response(
                200,
                text=html_doc,
                headers={"content-type": "text/html; charset=utf-8"},
                request=httpx.Request("GET", "https://janedoe.dev"),
            )
            with patch("httpx.AsyncClient.send", AsyncMock(return_value=mock_resp)):
                audit = await inspect_portfolio_url("https://janedoe.dev")
                self.assertEqual(audit["status"], "ok")
                self.assertEqual(audit["title"], "Jane Doe | AI Systems Architect")
                self.assertTrue(audit["uses_https"])
                self.assertTrue(audit["has_open_graph"])
                self.assertTrue(audit["has_contact_cta"])
                self.assertFalse(audit["is_empty_spa_shell"])

        # Empty client-side SPA shell detection
        spa_doc = """<!DOCTYPE html>
        <html>
          <head><title>Vite + React</title></head>
          <body><div id="root"></div><script src="/src/main.jsx"></script></body>
        </html>"""
        mock_spa_resp = httpx.Response(
            200,
            text=spa_doc,
            headers={"content-type": "text/html; charset=utf-8"},
            request=httpx.Request("GET", "https://janedoe.dev"),
        )
        with patch("tools.proof_of_work.validate_public_http_url", return_value="https://janedoe.dev"):
            with patch("httpx.AsyncClient.send", AsyncMock(return_value=mock_spa_resp)):
                audit_spa = await inspect_portfolio_url("https://janedoe.dev")
                self.assertTrue(audit_spa["is_empty_spa_shell"])
                self.assertFalse(audit_spa["has_contact_cta"])

    async def test_interview_probe_endpoint(self):
        client = TestClient(app)
        mock_interview = {
            "id": "mock_int_123",
            "session_id": "mock_sess_123",
            "current_question_index": 2,
            "questions": {
                "technical_questions": [{"id": "t1", "question": "Explain indexing."}],
                "behavioral_questions": [{"id": "b1", "question": "Tell me about a bug."}],
            },
            "scores": [
                {"question_id": "t1", "score": 6, "feedback_summary": "Surface level"}
            ],
        }
        mock_session = {"target_role": "Backend Engineer"}
        mock_eval = {
            "score": 8,
            "max_score": 10,
            "clarity_and_structure_score": 8,
            "what_was_good": "Deep explanation of B-Trees.",
            "what_was_missing": "None",
            "feedback_summary": "Much better technical depth.",
        }

        with patch("routers.interview.get_session", AsyncMock(return_value=mock_session)):
            with patch("routers.interview._get_interview_by_id_sync", return_value=mock_interview):
                with patch("routers.interview.evaluate_answer", AsyncMock(return_value=mock_eval)):
                    with patch("routers.interview._update_interview_sync") as mock_update:
                        resp = client.post(
                            "/api/interview/probe",
                            json={
                                "session_id": "mock_sess_123",
                                "interview_id": "mock_int_123",
                                "parent_question_id": "t1",
                                "probe_question": "Which index structure handles range queries best?",
                                "answer": "B+ Trees handle range queries best due to linked leaf nodes.",
                            },
                        )
                        self.assertEqual(resp.status_code, 200)
                        data = resp.json()
                        self.assertIn("evaluation", data)
                        self.assertEqual(data["evaluation"]["score"], 8)
                        self.assertEqual(data["parent_question_id"], "t1")

                        mock_update.assert_called_once()
                        updated_args = mock_update.call_args[0]
                        self.assertEqual(updated_args[0], "mock_int_123")
                        updated_scores = updated_args[1]["scores"]
                        self.assertEqual(len(updated_scores), 1)
                        self.assertIn("probe_evaluation", updated_scores[0])
                        self.assertEqual(
                            updated_scores[0]["probe_evaluation"]["probe_answer"],
                            "B+ Trees handle range queries best due to linked leaf nodes.",
                        )

                        # Cross-session IDOR guard must reject mismatched session_id with 400
                        bad_resp = client.post(
                            "/api/interview/probe",
                            json={
                                "session_id": "different_session_999",
                                "interview_id": "mock_int_123",
                                "parent_question_id": "t1",
                                "probe_question": "Which index structure handles range queries best?",
                                "answer": "Attempted cross-session mutation.",
                            },
                        )
                        self.assertEqual(bad_resp.status_code, 400)

    async def test_github_inspector_handle_normalization_and_schema(self):
        from tools.proof_of_work import inspect_github_profile

        # Path traversal and reserved handles must be rejected with 0 network calls
        for invalid_in in ["../../orgs/evil", "https://github.com/settings", "@-badhandle-"]:
            res_bad = await inspect_github_profile(invalid_in)
            self.assertEqual(res_bad["status"], "invalid_username")

        # Full repo URL must extract owner handle ('torvalds'), not repo ('linux'), and align schema keys
        user_json = {
            "login": "torvalds",
            "name": "Linus Torvalds",
            "avatar_url": "https://avatars.githubusercontent.com/u/1024025",
            "html_url": "https://github.com/torvalds",
            "public_repos": 7,
            "followers": 200000,
            "bio": "Creator of Linux and Git",
            "blog": "",
        }
        repos_json = [
            {
                "name": "linux",
                "fork": False,
                "language": "C",
                "description": "Linux kernel source tree",
                "homepage": "https://www.kernel.org",
                "stargazers_count": 180000,
                "pushed_at": "2026-10-25T12:00:00Z",
                "html_url": "https://github.com/torvalds/linux",
            }
        ]
        mock_get = AsyncMock(
            side_effect=[
                _mock_response(200, user_json, "https://api.github.com/users/torvalds"),
                _mock_response(200, repos_json, "https://api.github.com/users/torvalds/repos"),
            ]
        )
        with patch("httpx.AsyncClient.get", new=mock_get):
            gh = await inspect_github_profile("https://github.com/torvalds/linux?tab=readme")
            self.assertEqual(gh["status"], "ok")
            self.assertEqual(gh["username"], "torvalds")
            self.assertEqual(gh["name"], "Linus Torvalds")
            self.assertEqual(gh["profile_url"], "https://github.com/torvalds")
            self.assertEqual(gh["html_url"], "https://github.com/torvalds")
            self.assertEqual(len(gh["standout_repos"]), 1)
            self.assertEqual(gh["standout_repos"][0]["url"], "https://github.com/torvalds/linux")
            self.assertEqual(gh["standout_repos"][0]["html_url"], "https://github.com/torvalds/linux")
            self.assertEqual(gh["standout_repos"][0]["homepage"], "https://www.kernel.org")

    async def test_reaudit_endpoint_and_delta_calculation(self):
        client = TestClient(app)
        mock_baseline = {
            "id": "base_sess_1",
            "target_role": "Python Engineer",
            "target_city": "Lahore",
            "market_data": {"market_demand_level": "High", "salary_range_pkr": {"min": 200000, "max": 350000}},
            "gap_data": {
                "overall_readiness_score": 65,
                "critical_gaps": [{"skill": "Docker", "priority": "Critical"}, {"skill": "Kubernetes", "priority": "Critical"}],
            },
            "cv_rewrite_data": {
                "ats_score_estimate": 70,
            },
            "profile_data": {
                "experience_years": 2.5,
                "education": {"degree": "BS Software Engineering"},
                "target_job_description": "Must know Docker, FastAPI, and PostgreSQL.",
            },
        }

        # 404 test
        with patch("routers.pipeline.get_session", AsyncMock(return_value=None)):
            r404 = client.post(
                "/api/pipeline/reaudit/nonexistent",
                files={"cv_file": ("cv.pdf", b"%PDF-1.4 mock cv", "application/pdf")},
            )
            self.assertEqual(r404.status_code, 404)

        # 200 reaudit launch test (with increment_daily_quota mocked for zero live DB calls)
        with patch("routers.pipeline.get_session", AsyncMock(return_value=mock_baseline)):
            with patch("routers.pipeline.create_session", AsyncMock(return_value="new_reaudit_sess")):
                with patch("routers.pipeline.increment_daily_quota", AsyncMock()) as mock_quota:
                    with patch("routers.pipeline.extract_cv_text", return_value="Updated CV with Docker mastery"):
                        with patch("routers.pipeline.run_pipeline", AsyncMock()) as mock_run_pipe:
                            resp = client.post(
                                "/api/pipeline/reaudit/base_sess_1",
                                files={"cv_file": ("cv.pdf", b"%PDF-1.4 updated cv", "application/pdf")},
                            )
                            self.assertEqual(resp.status_code, 200)
                            data = resp.json()
                            self.assertEqual(data["session_id"], "new_reaudit_sess")
                            self.assertEqual(data["baseline_session_id"], "base_sess_1")
                            mock_quota.assert_called_once()
                            mock_run_pipe.assert_called_once()
                            _, kwargs = mock_run_pipe.call_args
                            self.assertEqual(
                                kwargs["job_description"],
                                "Must know Docker, FastAPI, and PostgreSQL.",
                            )
                            self.assertEqual(kwargs["pow_source"], "cv_extracted")

    async def test_orchestrator_reaudit_skips_market_agent(self):
        from agents.orchestrator import run_pipeline
        mock_market_data = {"market_demand_level": "Very High", "demand_score": 90}
        mock_profile_data = {"name": "Candidate", "experience_years": 3}
        mock_gap_data = {
            "overall_readiness_score": 85,
            "critical_gaps": [{"skill": "Kubernetes"}],  # Docker resolved!
        }
        mock_roadmap_data = {"months": []}
        mock_cv_data = {"ats_score_estimate": 88}

        baseline_snapshot = {
            "gap_data": {
                "overall_readiness_score": 70,
                "critical_gaps": [{"skill": "Docker"}, {"skill": "Kubernetes"}],
            },
            "cv_rewrite_data": {
                "ats_score_estimate": 75,
            },
        }

        q = asyncio.Queue()
        with patch("agents.orchestrator.run_profile_agent", AsyncMock(return_value=mock_profile_data)):
            with patch("agents.orchestrator.run_market_agent") as mock_market_agent:
                with patch("agents.orchestrator.run_gap_agent", AsyncMock(return_value=mock_gap_data)):
                    with patch("agents.orchestrator.run_roadmap_agent", AsyncMock(return_value=mock_roadmap_data)):
                        with patch("agents.orchestrator.run_cv_rewrite_agent", AsyncMock(return_value=mock_cv_data)):
                            with patch("agents.orchestrator.mark_agent_complete", AsyncMock()):
                                with patch("agents.orchestrator.update_session", AsyncMock()) as mock_update_sess:
                                    await run_pipeline(
                                        session_id="reaudit_123",
                                        cv_text="CV text",
                                        target_role="DevOps Engineer",
                                        target_city="Lahore",
                                        experience_years=3.0,
                                        education_level="Bachelor's",
                                        status_queue=q,
                                        preloaded_market_data=mock_market_data,
                                        baseline_session_id="base_sess_1",
                                        baseline_snapshot=baseline_snapshot,
                                    )
                                    # run_market_agent must NOT have been called!
                                    mock_market_agent.assert_not_called()

                                    # Check that update_session saved reaudit_delta
                                    saved_profile = mock_update_sess.call_args[0][1]["profile_data"]
                                    delta = saved_profile.get("reaudit_delta")
                                    self.assertIsNotNone(delta)
                                    self.assertEqual(delta["previous_readiness_score"], 70)
                                    self.assertEqual(delta["new_readiness_score"], 85)
                                    self.assertEqual(delta["readiness_delta"], 15.0)
                                    self.assertEqual(delta["previous_ats_score"], 75)
                                    self.assertEqual(delta["new_ats_score"], 88)
                                    self.assertEqual(delta["ats_delta"], 13.0)
                                    self.assertIn("Docker", delta["resolved_gaps"])
                                    self.assertNotIn("Kubernetes", delta["resolved_gaps"])

    async def test_pipeline_contact_and_results_projection(self):
        client = TestClient(app)
        mock_raw_session = {
            "id": "sess_secret_1",
            "candidate_name": "Alice",
            "cv_text": "Alice Smith | alice@example.com | 03001234567 | github.com/alice",
            "target_role": "Backend Engineer",
            "target_city": "Karachi",
            "profile_data": {"name": "Alice"},
        }
        mock_public_session = {
            "id": "sess_secret_1",
            "candidate_name": "Alice",
            "target_role": "Backend Engineer",
            "target_city": "Karachi",
            "profile_data": {"name": "Alice"},
        }

        # 1. Contact endpoint extracts handles without returning full CV text
        with patch("routers.pipeline.get_session", AsyncMock(return_value=mock_raw_session)):
            res_contact = client.get("/api/pipeline/contact/sess_secret_1")
            self.assertEqual(res_contact.status_code, 200)
            contact_data = res_contact.json()
            self.assertEqual(contact_data["email"], "alice@example.com")
            self.assertEqual(contact_data["phone"], "03001234567")
            self.assertEqual(contact_data["github"], "github.com/alice")

        # 2. Results endpoint excludes cv_text
        with patch("routers.pipeline.get_public_session", AsyncMock(return_value=mock_public_session)):
            res_pub = client.get("/api/pipeline/results/sess_secret_1")
            self.assertEqual(res_pub.status_code, 200)
            pub_data = res_pub.json()
            self.assertNotIn("cv_text", pub_data)
            self.assertEqual(pub_data["candidate_name"], "Alice")


class TestUstaadV2Sync(unittest.TestCase):
    def test_secret_redaction_and_parsers(self):
        raw = "Failed for key sk-proj-AbCdEfGhIjKlMnOpQrStUvWxYz123456 and custom_secret_987654321"
        scrubbed = redact_secrets(raw, "custom_secret_987654321")
        self.assertNotIn("AbCdEfGhIjKlMnOpQrStUvWxYz123456", scrubbed)
        self.assertNotIn("custom_secret_987654321", scrubbed)
        self.assertEqual(parse_gemini_json('{"a": 1}')["a"], 1)
        self.assertEqual(parse_llm_json("<think>x</think>{'b': 2}")["b"], 2)

    def test_http_endpoints_and_pdf_dossier(self):
        client = TestClient(app)
        self.assertEqual(client.get("/health").status_code, 200)

        prov = client.get("/api/keys/providers").json()
        self.assertEqual(prov["default_provider"], "gemini")
        self.assertEqual(prov["default_model"], "gemini-3.1-flash-lite")
        self.assertEqual(len(prov["providers"]), 8)

        pdf = generate_career_dossier(
            {
                "candidate_name": "Zain <Ali> & Co.",
                "target_role": "Backend & AI Engineer",
                "target_city": "Lahore",
                "profile_data": {
                    "education": {"degree": "BS", "field": "CS", "university": "NUST", "graduation_year": 2026},
                    "current_skills": ["Python", "FastAPI & SQL"],
                },
                "market_data": {"salary_range_pkr": {"min": None, "max": "N/A"}},
                "gap_data": {"overall_readiness_score": 78, "summary": "Good <base> & skills."},
                "cv_rewrite_data": {
                    "ats_score_estimate": 89,
                    "rewritten_summary": "Backend engineer.",
                    "rewritten_experience_bullets": [{"rewritten": "Scaled APIs by 3x."}],
                },
            },
            {"final_score": 82.5, "scores": [{"score": 8.5, "feedback_summary": "Solid answer."}]},
        )
        self.assertTrue(pdf.startswith(b"%PDF-"))
        self.assertGreater(len(pdf), 2000)

        # Round-trip PDF extraction through PyMuPDF
        extracted = extract_cv_text(pdf)
        self.assertIn("Backend & AI Engineer", extracted)
        self.assertIn("Lahore", extracted)

    def test_interview_modes_and_question_flattening(self):
        self.assertEqual(set(INTERVIEW_MODES.keys()), {"sprint_5", "technical", "behavioral_hr", "full_15"})
        self.assertEqual(set(DIFFICULTY_LABELS.keys()), {"fresh_grad", "junior", "mid_senior"})
        flat = _flatten_questions(
            {
                "technical_questions": [{"id": "t1", "question": "Explain ASGI"}],
                "behavioral_questions": [{"id": "b1", "question": "Describe a conflict"}],
                "hr_questions": [{"id": "h1", "question": "Salary expectation"}],
            }
        )
        self.assertEqual(len(flat), 3)
        self.assertEqual([q["category"] for q in flat], ["Technical", "Behavioral", "HR / Fit"])

    def test_verified_job_links_extraction(self):
        from agents.market_agent import _extract_verified_job_links
        raw = [
            {
                "query": "Python Developer jobs Karachi",
                "results": [
                    {"title": "Senior Python Engineer", "link": "https://www.rozee.pk/job/123", "snippet": "FastAPI & Django needed."},
                    {"title": "Backend Dev", "link": "https://pk.linkedin.com/jobs/view/456", "snippet": "Systems Ltd looking for Python."},
                    {"title": "Duplicate Link", "link": "https://www.rozee.pk/job/123/", "snippet": "Same job."},
                    {"title": "Invalid Scheme", "link": "ftp://bad.com/job", "snippet": "Skip me."},
                ]
            }
        ]
        links = _extract_verified_job_links(raw)
        self.assertEqual(len(links), 2)
        self.assertEqual(links[0]["source"], "Rozee.pk")
        self.assertEqual(links[0]["url"], "https://www.rozee.pk/job/123")
        self.assertEqual(links[1]["source"], "LinkedIn")

    def test_ssrf_url_guard(self):
        import socket
        from tools.proof_of_work import validate_public_http_url

        public_addrinfo = [(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("93.184.216.34", 443))]
        with patch("socket.getaddrinfo", return_value=public_addrinfo):
            self.assertTrue(validate_public_http_url("https://github.com/torvalds").startswith("https://github.com"))
            self.assertTrue(validate_public_http_url("http://example.com").startswith("http://example.com"))

        # Rejection of localhost, private IPs, metadata IPs, CGNAT, credentials, invalid schemes, custom ports
        for blocked in [
            "http://localhost:8000",
            "http://127.0.0.1",
            "http://169.254.169.254/latest/meta-data/",
            "http://192.168.1.1",
            "http://100.64.0.1",
            "https://user:pass@example.com",
            "ftp://example.com/file.txt",
            "https://example.com:8443",
        ]:
            with self.assertRaises(ValueError, msg=f"Expected SSRF block for {blocked}"):
                validate_public_http_url(blocked)

        mapped_ipv6 = [(socket.AF_INET6, socket.SOCK_STREAM, 6, "", ("::ffff:127.0.0.1", 443, 0, 0))]
        with patch("socket.getaddrinfo", return_value=mapped_ipv6):
            with self.assertRaises(ValueError):
                validate_public_http_url("https://rebind.example.com")

    def test_cv_link_extraction(self):
        from tools.cv_parser import extract_cv_links
        sample_text = (
            "John Doe\n"
            "Full Stack Engineer\n"
            "Check out my work at https://github.com/johndoe and my portfolio at https://johndoe.dev.\n"
            "Connect with me on https://pk.linkedin.com/in/johndoe"
        )
        links = extract_cv_links(b"%PDF-1.4 mock", sample_text)
        self.assertEqual(links["github_username"], "johndoe")
        self.assertEqual(links["portfolio_url"], "https://johndoe.dev")
        self.assertIn("https://github.com/johndoe", links["all_links"])

        # Personal domains ending in x.com (e.g. alex.com) must NOT be blocked by x.com third-party filter
        alex_links = extract_cv_links(b"", "Portfolio: https://alex.com | Social: https://x.com/alex")
        self.assertEqual(alex_links["portfolio_url"], "https://alex.com")

        # GitHub Pages (*.github.io) is a personal portfolio website, not a github.com/<user> handle
        gh_pages = extract_cv_links(b"", "Site: https://johndoe.github.io and github.com/johndoe/app")
        self.assertEqual(gh_pages["portfolio_url"], "https://johndoe.github.io")
        self.assertEqual(gh_pages["github_username"], "johndoe")

    def test_cv_contact_extraction_helper(self):
        from tools.cv_parser import extract_cv_contact
        text = "Syed Hassan | +92 300 1234567 | hassan@example.com | linkedin.com/in/hassan | github.com/hassan"
        contact = extract_cv_contact(text)
        self.assertEqual(contact["email"], "hassan@example.com")
        self.assertEqual(contact["phone"], "+92 300 1234567")
        self.assertEqual(contact["linkedin"], "linkedin.com/in/hassan")
        self.assertEqual(contact["github"], "github.com/hassan")

    def test_market_cache_like_escaping(self):
        from db.supabase_client import _escape_like, _is_cacheable_market
        from datetime import datetime, timezone, timedelta
        self.assertEqual(_escape_like("100% Remote_Dev*"), "100\\% Remote\\_Dev\\*")

        cutoff = datetime.now(timezone.utc) - timedelta(hours=48)
        # Unverified / non-server-default / missing skills must not be cached
        self.assertFalse(_is_cacheable_market({"unverified": True}, cutoff))
        self.assertFalse(_is_cacheable_market({"live_data_available": False}, cutoff))
        self.assertFalse(_is_cacheable_market({"source_mode": "byok"}, cutoff))


if __name__ == "__main__":
    unittest.main()

