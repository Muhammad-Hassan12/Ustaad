# Verification and test evidence

The recorded verification runs on **3 November 2026** cover the Next.js 16 / React 19 / Tailwind CSS v4 frontend upgrade, the Python 3.12 backend dependency refresh, the request-scoped 8-provider BYOK architecture, structured JSON hardening and ReportLab / PyMuPDF document pipelines. Results document behavior in the tested environment rather than guaranteeing third-party provider uptime, external search availability or hiring outcomes.

## Recorded results: 3 November 2026

| Check | Result and scope |
| --- | --- |
| Frontend TypeScript check (`tsc --noEmit`) | **Passed with 0 errors** across all App Router pages, components and BYOK state helpers under TypeScript 5.9, React 19.3.1 and Next.js 16.4.4 (`"jsx": "react-jsx"`, strict mode enabled, `ignoreBuildErrors` removed). |
| Frontend ESLint 9 check (`eslint`) | **Passed with 0 errors and 0 warnings** under flat config (`eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`), including React 19 `eslint-plugin-react-hooks` v7 purity, immutability and effect rules. |
| Frontend production build (`next build`) | **Passed** with Next.js `16.4.4` (Turbopack) on Node `v22.23.4`. Static routes (`/`, `/about`, `/_not-found`, `/icon.png`) and dynamic session routes (`/dashboard/[sessionId]`, `/interview/[sessionId]`, `/resume/[sessionId]`, `/dossier/[sessionId]`) compiled cleanly. |
| Lockfile integrity (`npm ci --dry-run`) | **Passed** against regenerated `frontend/package-lock.json` (`lockfileVersion: 3`). |
| Backend regression suite (`pytest`) | **6 passed in 0.70s** on Python `3.12.3` with latest-stable pinned packages (`fastapi==0.162.0`, `uvicorn==0.54.0`, `PyMuPDF==2.1`, `httpx==0.28.1`, `supabase==2.33.0`, `reportlab==5.1.0`, `pytest==9.2.0`). |
| Live-environment compatibility (`unittest`) | **6 passed in 0.096s** against the existing server virtual environment without modifying live running processes. |
| Team asset integrity | Both GitHub team avatars (`muhammad-hassan12.jpg`, 12,591 bytes; `abdulmannan991.png`, 86,373 bytes) verified locally under `frontend/public/images/team/` with zero external runtime avatar requests. |

## Backend regression coverage (`backend/test_v2_byok.py`)

The automated suite exercises six deterministic test groups without requiring live paid API calls or mutating production Supabase rows:

1. **Server-default lock invariant (`test_server_default_lock_cannot_be_bypassed`):** Verifies that requests omitting `X-LLM-API-Key`—including spoofed `X-LLM-Provider: anthropic`, custom `X-LLM-Model` headers and whitespace-only keys—always resolve to `is_byok=False`, `provider="gemini"` and `model="gemini-3.1-flash-lite"`.
2. **Allowlisted BYOK routing and SSRF/injection guards (`test_byok_providers_and_injection_guards`):** Confirms resolution across all 8 registered providers (`gemini`, `openai`, `anthropic`, `deepseek`, `qwen`, `glm`, `groq`, `openrouter`) with custom namespaced models (`org/custom-model-v2:free`), and verifies HTTP `400` rejection on path traversal (`../../etc/passwd`), query injection (`gpt-4o?evil=1`), fragment injection (`m#frag`), whitespace model IDs and arbitrary URL provider strings (`http://169.254.169.254`).
3. **Provider adapters and 1-shot JSON self-repair (`test_adapters_and_json_self_repair`):** Verifies skipping `thought: true` reasoning parts on Gemini 2.5/3.x responses, stripping `<think>...</think>` blocks and markdown fences on `deepseek-reasoner`, and automatic single-shot JSON repair on malformed Anthropic responses.
4. **Secret redaction and fallback parsers (`test_secret_redaction_and_parsers`):** Confirms `redact_secrets()` scrubs explicit caller keys and token prefixes (`sk-proj-...`, etc.) from error strings, and verifies `parse_llm_json` / `parse_gemini_json` coercion.
5. **HTTP routes, ReportLab PDF generation and PyMuPDF round-trip (`test_http_endpoints_and_pdf_dossier`):** Exercises `GET /health` and `GET /api/keys/providers` through FastAPI `TestClient`, generates a Career Dossier PDF containing XML-sensitive characters (`<`, `>`, `&`) and `None`/`"N/A"` salary fields, and round-trips the generated PDF bytes through `extract_cv_text` (`PyMuPDF`).
6. **Mock Interview 2.0 modes and question ordering (`test_interview_modes_and_question_flattening`):** Verifies the four interview modes (`sprint_5`, `technical`, `behavioral_hr`, `full_15`), three calibration tiers (`fresh_grad`, `junior`, `mid_senior`) and deterministic Technical → Behavioral → HR / Fit flattening.

## Reproducing checks locally

### Backend checks (Python 3.12)

```bash
python3.12 -m venv .venv
.venv/bin/pip install -r backend/requirements-dev.txt
cd backend
../.venv/bin/pytest -q --tb=short
```

### Frontend checks (Node.js 22)

```bash
cd frontend
npm ci
npm run typecheck
npm run lint
npm run build
```

## Operational and evaluation boundaries

- **Mocked provider transports in CI:** Unit tests mock upstream `httpx.AsyncClient.post` responses to validate adapter parsing, retries and redaction deterministically. Live provider validation (`GET` / `POST /api/keys/validate`) depends on each vendor's current model catalog, quota and regional account status.
- **Heuristic readiness and ATS estimates:** `overall_readiness_score`, `ats_score_estimate`, `jd_match_score` and interview `final_score` values are structured LLM assessments grounded in extracted CV text and Serper.dev market snippets, not calibrated psychometric measurements or official employer ATS rankings.
- **Text-based PDF requirement:** `extract_cv_text` extracts embedded PDF text streams via PyMuPDF and rejects scanned image-only PDFs yielding fewer than 50 characters (`HTTP 422`); OCR is intentionally out of scope to keep server resource usage minimal.

