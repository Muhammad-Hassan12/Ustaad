# Verification and test evidence

The recorded verification runs on **3 November 2026** cover the Next.js 16 / React 19 / Tailwind CSS v4 frontend, the Python 3.12 backend, the request-scoped 8-provider BYOK architecture, structured JSON hardening, SSRF-guarded Proof-of-Work auditing, zero-Serper CV re-audits, adaptive mock interview follow-up probes and ReportLab / PyMuPDF document pipelines. Results document behavior in the tested environment rather than guaranteeing third-party provider uptime, external search availability or hiring outcomes.

## Recorded results: 3 November 2026

| Check | Result and scope |
| --- | --- |
| Frontend TypeScript check (`tsc --noEmit`) | **Passed with 0 errors** across all App Router pages, components (`ProofOfWorkCard`, `MarketSnapshot`, `RoadmapTimeline`, etc.) and utilities (`resourceLinks.ts`, `llmConfig.ts`, `api.ts`) under TypeScript 5, React 19.3.1 and Next.js 16.4.4 (`"jsx": "react-jsx"`, strict mode enabled). |
| Frontend ESLint 9 check (`eslint`) | **Passed with 0 errors and 0 warnings** under flat config (`eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`), including React 19 `eslint-plugin-react-hooks` purity, immutability and effect rules. |
| Frontend production build (`next build`) | **Passed** with Next.js `16.4.4` (Turbopack) on Node `v22.21.1`. Static routes (`/`, `/about`, `/_not-found`, `/icon.png`) and dynamic session routes (`/dashboard/[sessionId]`, `/interview/[sessionId]`, `/resume/[sessionId]`, `/dossier/[sessionId]`) compiled cleanly. |
| Lockfile integrity (`npm ci --dry-run`) | **Passed** against `frontend/package-lock.json` (`lockfileVersion: 3`). |
| Backend regression suite (`unittest` / `pytest`) | **14 passed in 0.19s** on Python `3.12.3` (`fastapi 0.162.0`, `PyMuPDF 2.1`, `reportlab 5.1.0`) with zero live network or Supabase mutations (`-W default` verified free of unclosed-socket `ResourceWarning`s). |
| Team asset integrity | Both GitHub team avatars (`muhammad-hassan12.jpg`, 12,591 bytes; `abdulmannan991.png`, 86,373 bytes) verified locally under `frontend/public/images/team/` with zero external runtime avatar requests. |

## Backend regression coverage (`backend/test_v2_byok.py`)

The automated suite exercises 14 deterministic tests (`TestUstaadV2Async` and `TestUstaadV2Sync`) without requiring live paid API calls or mutating production Supabase rows:

1. **Server-default lock invariant (`test_server_default_lock_cannot_be_bypassed`):** Verifies that requests omitting `X-LLM-API-Key`—including spoofed `X-LLM-Provider: anthropic`, custom `X-LLM-Model` headers and whitespace-only keys—always resolve to `is_byok=False`, `provider="gemini"` and `model="gemini-3.1-flash-lite"`.
2. **Allowlisted BYOK routing and SSRF/injection guards (`test_byok_providers_and_injection_guards`):** Confirms resolution across all 8 registered providers (`gemini`, `openai`, `anthropic`, `deepseek`, `qwen`, `glm`, `groq`, `openrouter`) with custom namespaced models (`org/custom-model-v2:free`), and verifies HTTP `400` rejection on path traversal (`../../etc/passwd`), query injection (`gpt-4o?evil=1`), fragment injection (`m#frag`), whitespace model IDs and arbitrary URL provider strings (`http://169.254.169.254`).
3. **Provider adapters and 1-shot JSON self-repair (`test_adapters_and_json_self_repair`):** Verifies skipping `thought: true` reasoning parts on Gemini 2.5/3.x responses, stripping `<think>...</think>` blocks and markdown fences on `deepseek-reasoner`, and automatic single-shot JSON repair on malformed Anthropic responses.
4. **Portfolio HTML inspector and SPA shell detection (`test_portfolio_inspector_html_parsing`):** Verifies streamed (`<=512 KiB`) HTML parsing of `<title>`, meta descriptions, OpenGraph tags, HTTPS status, contact CTAs and empty client-side SPA root shells (`<div id="root"></div>`).
5. **Adaptive interview follow-up probe and cross-session guard (`test_interview_probe_endpoint`):** Exercises `POST /api/interview/probe`, verifies non-destructive persistence of `probe_evaluation` inside `scores` without altering `current_question_index`, and confirms HTTP `400` rejection on cross-session `session_id` mismatches.
6. **GitHub handle normalization and schema alignment (`test_github_inspector_handle_normalization_and_schema`):** Confirms rejection of path-traversal/reserved handles (`../../orgs/evil`, `settings`) with zero HTTP requests, extraction of owner handles from full repository URLs (`https://github.com/torvalds/linux?tab=readme` → `torvalds`), and full `profile_url` / `html_url` / `standout_repos` schema parity with `ProofOfWorkCard.tsx`.
7. **Re-Audit pipeline endpoint (`test_reaudit_endpoint_and_delta_calculation`):** Tests `POST /api/pipeline/reaudit/{baseline_session_id}` for missing baseline (`404`), valid re-audit launch (`200`), quota accounting and inheritance of `target_job_description` from `baseline_profile`.
8. **Orchestrator market reuse and score delta calculation (`test_orchestrator_reaudit_skips_market_agent`):** Verifies that re-audit completely bypasses `run_market_agent` (`0` Serper calls, `1` fewer LLM call) and accurately computes `readiness_delta`, `ats_delta` and `resolved_gaps`.
9. **CV link and personal domain extraction (`test_cv_link_extraction`):** Verifies extracting GitHub handles and personal portfolio URLs while avoiding domain substring false positives (`https://alex.com` vs. `x.com`) and recognizing `*.github.io` personal portfolio sites.
10. **HTTP routes, ReportLab PDF generation and PyMuPDF round-trip (`test_http_endpoints_and_pdf_dossier`):** Exercises `GET /health` and `GET /api/keys/providers`, generates a Career Dossier PDF containing XML-sensitive characters (`<`, `>`, `&`) and `None`/`"N/A"` salary fields, and round-trips the generated PDF bytes through `extract_cv_text`.
11. **Mock Interview 2.0 modes and question ordering (`test_interview_modes_and_question_flattening`):** Verifies the four interview modes (`sprint_5`, `technical`, `behavioral_hr`, `full_15`), three calibration tiers (`fresh_grad`, `junior`, `mid_senior`) and deterministic Technical → Behavioral → HR / Fit flattening.
12. **Secret redaction and fallback parsers (`test_secret_redaction_and_parsers`):** Confirms `redact_secrets()` scrubs explicit caller keys and token prefixes (`sk-proj-...`, etc.) from error strings, and verifies `parse_llm_json` / `parse_gemini_json` coercion.
13. **SSRF public URL guard (`test_ssrf_url_guard`):** Validates strict blocking of loopbacks (`127.0.0.1`), RFC1918 LAN subnets, CGNAT (`100.64.0.0/10`), cloud metadata (`169.254.169.254`), IPv4-mapped IPv6 loopbacks (`::ffff:127.0.0.1`), embedded URL credentials, non-HTTP(S) schemes and non-standard ports.
14. **Verified Pakistani job links extraction (`test_verified_job_links_extraction`):** Validates deduplicating direct job URLs (`Rozee.pk`, `LinkedIn`, `Mustakbil`) from organic Serper search results with `0` extra search queries.

## Reproducing checks locally

### Backend checks (Python 3.12)

Using the standard library test runner (requires only `backend/requirements.txt`):

```bash
cd backend
./venv/bin/python3 -m unittest -v test_v2_byok.py
```

Or with `pytest` installed via `backend/requirements-dev.txt`:

```bash
cd backend
./venv/bin/pytest -q --tb=short
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

- **Mocked upstream transports in CI:** Unit tests mock upstream `httpx.AsyncClient` and Supabase calls to validate adapter parsing, SSRF checks, retries and redaction deterministically offline. Live provider validation (`GET` / `POST /api/keys/validate`) depends on each vendor's current model catalog, quota and regional account status.
- **Heuristic readiness, salary and tax estimates:** `overall_readiness_score`, `ats_score_estimate`, `jd_match_score`, statutory FBR net-take-home calculations and interview `final_score` values are advisory decision aids grounded in extracted CV text and public search snippets, not official employer rankings or tax advice.
- **Text-based PDF requirement:** `extract_cv_text` extracts embedded PDF text streams via PyMuPDF and rejects scanned image-only PDFs yielding fewer than 50 characters (`HTTP 422`); OCR is intentionally out of scope to keep server resource usage minimal.
