"""
Automated regression suite for Ustaad 2.0:
- Strict Server-Default Lock invariant (Gemini 3.1 Flash Lite)
- Multi-Provider BYOK (8 providers + custom model IDs + SSRF/injection guards)
- Secret redaction across error traces
- Gemini / OpenAI-compat / Reasoning (<think>) / Anthropic adapters & 1-shot JSON self-repair
- ReportLab PDF Career Dossier resilience against None/N/A salaries & XML characters
"""
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


if __name__ == "__main__":
    unittest.main()

