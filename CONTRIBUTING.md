# Contributing to Ustaad

Contributions that improve career analysis quality, Pakistani job-market grounding, provider resilience, accessibility or documentation are welcome.

## Reporting issues and proposing changes

- Search existing GitHub issues before opening a duplicate report.
- For bug reports, include reproduction steps, HTTP status codes or sanitized console output, browser/OS details and whether the session used **Free Server Default** or **BYOK** (specify provider and model ID, never an API key).
- For architectural changes—such as adding new pipeline stages, database columns or LLM adapters—open an issue first to align on scope and resource constraints.

## Local environment requirements

- **Backend:** Python `3.12` (`backend/requirements-dev.txt`).
- **Frontend:** Node.js `22` (`frontend/.nvmrc`, Next.js `16.4.4`, React `19.3.1`, Tailwind CSS `v4`).
- **Services:** A Supabase project configured with [`backend/db/schemas.sql`](backend/db/schemas.sql), a Google Gemini API key and a Serper.dev API key in `backend/.env`.

See the [project README](README.md#installation) for step-by-step setup instructions.

## Engineering standards

1. **Preserve the server-default lock:** Requests without a caller-supplied API key must always resolve to `gemini` / `gemini-3.1-flash-lite` in `backend/agents/llm/config.py`. Never allow unauthenticated headers to select alternate providers or models on the server's key.
2. **Never log or persist user keys:** Any new adapter, router or error handler must pass user-facing failure strings through `redact_secrets()` and keep caller credentials strictly in request memory.
3. **Maintain backward-compatible JSONB state:** Additive fields inside `profile_data`, `market_data`, `gap_data`, `roadmap_data` and `cv_rewrite_data` must degrade gracefully when loading older sessions.
4. **Keep dependencies lean:** Ustaad is designed to run on low-cost student infrastructure without heavy local ML runtimes, Redis clusters or paid background queues.

## Verification before opening a pull request

Run both backend and frontend checks locally and ensure zero errors:

```bash
# Backend regression suite
cd backend
pytest -q --tb=short

# Frontend TypeScript, ESLint 9 and production build checks
cd ../frontend
npm run typecheck
npm run lint
npm run build
```

## License

By submitting a contribution, you agree that your contribution will be licensed under the [Apache License, Version 2.0](LICENSE).
