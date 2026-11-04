# Ustaad frontend

The Ustaad frontend provides the CV upload and Target Job Description intake, real-time parallel pipeline workspace, interactive 30/60/90-day learning roadmap, configurable mock interview simulator, browser-only 8-provider BYOK studio and printable single-column ATS resume view. It is built with Next.js 16.4.4 (App Router), React 19.3.1, TypeScript and Tailwind CSS v4.

## Routes and views

- **`/` (`app/page.tsx`):** Drag-and-drop PDF CV intake, Pakistani city selector, experience/education controls, optional Target Job Description tailoring input, optional Proof-of-Work GitHub/portfolio inputs, recent-session history modal and BYOK status indicator.
- **`/dashboard/[sessionId]` (`app/dashboard/[sessionId]/page.tsx`):** Live Server-Sent Events progress tracker, KPI summary strip, Proof-of-Work technical audit card, live Pakistani job matches, statutory PKR FBR net-take-home tax estimator, verified 30/60/90-day roadmap with RFC 5545 `.ics` calendar export, revised CV re-audit modal with score delta strip, and session-link sharing.
- **`/interview/[sessionId]` (`app/interview/[sessionId]/page.tsx`):** Configurable Mock Interview 2.0 loop supporting four modes (`sprint_5`, `technical`, `behavioral_hr`, `full_15`), three difficulty tiers (`fresh_grad`, `junior`, `mid_senior`), word-count guidance, per-answer coaching + clarity scoring, adaptive interviewer drill-down follow-up probes, early finish and full transcript review.
- **`/resume/[sessionId]` (`app/resume/[sessionId]/page.tsx`):** Single-column, standard-heading ATS resume preview synthesized from `profile_data` and `cv_rewrite_data`, styled with `@media print` A4 rules for browser `Save as PDF` export.
- **`/dossier/[sessionId]` (`app/dossier/[sessionId]/page.tsx`):** Executive Career Dossier summary and one-click ReportLab PDF download.
- **`/about` (`app/about/page.tsx`):** Multi-agent architecture overview, technology stack and locally cached team profile cards.

## Requirements

Use **Node.js 22** (`.nvmrc` specifies `22`; Next.js 16 requires `>=20.9.0`). Configure and run the FastAPI backend separately as described in the [project README](../README.md) and [deployment guide](../docs/DEPLOYMENT.md).

Install locked dependencies from `frontend/`:

```bash
npm ci
```

## Environment configuration

Copy `.env.example` to `.env.local` on a fresh setup:

```bash
cp .env.example .env.local
```

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Base URL of the FastAPI backend (`http://localhost:8000` locally; `https://api.ustaad.systems` in production) |

`NEXT_PUBLIC_API_URL` is embedded into client bundles at build time; rebuild after changing it. Never place `SUPABASE_SERVICE_KEY`, `GEMINI_API_KEY` or `SERPER_API_KEY` in `frontend/.env.local`.

## Browser-only BYOK state and client utilities

- **`lib/llmConfig.ts` & `lib/api.ts`:** User-supplied API keys and custom model selections are stored under `localStorage["ustaad_byok_v2"]` (automatically migrating legacy `localStorage["gemini_api_key"]` entries) and synchronized across components with React's `useSyncExternalStore`. When BYOK mode is active, `lib/api.ts` attaches `X-LLM-Provider`, `X-LLM-Model`, `X-LLM-API-Key` and optional `X-LLM-Region` headers on requests to the FastAPI backend. Switching back to **Free Server Default** omits user key headers while keeping saved provider profiles locally until explicitly cleared.
- **`lib/resourceLinks.ts`:** Resolves 30/60/90-day roadmap tasks against a curated directory of canonical free courses (CS50, Full Stack Open, Kaggle Learn, SQLBolt, NeetCode, FastAPI, React, Next.js, System Design Primer) with deterministic platform search fallbacks (`0` dead links and `0` Serper credits), and exports twice-weekly study blocks as an RFC 5545 `.ics` calendar file.
- **`components/ProofOfWorkCard.tsx`:** Renders side-by-side GitHub activity metrics, standout repositories and 4-point personal portfolio health checks (HTTPS, OpenGraph tags, contact CTA, prerendered HTML vs. empty SPA shell).

## Development and production scripts

```bash
npm test           # Run native Node.js unit tests (tests/lib.test.mjs)
npm run dev        # Start local Next.js development server on http://localhost:3000
npm run typecheck  # Run strict TypeScript check (tsc --noEmit)
npm run lint       # Run ESLint 9 flat-config check
npm run build      # Create optimized production build
npm run start      # Serve production build
```

## Related documentation

- [Project architecture and quickstart](../README.md)
- [LLM providers and BYOK security model](../docs/PROVIDERS_AND_BYOK.md)
- [Supabase setup](../docs/SUPABASE_SETUP.md)
- [VPS and Vercel deployment](../docs/DEPLOYMENT.md)
- [Verification evidence](../docs/VERIFICATION.md)
- [Licensing and team avatar sources](../docs/LICENSING.md)
