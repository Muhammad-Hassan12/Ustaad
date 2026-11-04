# Supabase configuration

Ustaad uses Supabase PostgreSQL to persist pipeline session state, structured JSONB agent outputs, mock interview transcripts and daily server-quota counters. User authentication is not required; each generated `session_id` UUID acts as the capability token for retrieving that session's dashboard, interview, printable resume and dossier.

## 1. Initialize database tables

1. Create a dedicated Supabase project and keep its service-role key private.
2. Open **SQL Editor** and execute [`backend/db/schemas.sql`](../backend/db/schemas.sql) to create `sessions`, `interview_sessions` and the singleton `quota_tracker` table:

```sql
CREATE TABLE IF NOT EXISTS quota_tracker (
  id INT PRIMARY KEY DEFAULT 1,
  reset_date DATE DEFAULT CURRENT_DATE,
  request_count INT DEFAULT 0
);

INSERT INTO quota_tracker (id, reset_date, request_count)
VALUES (1, CURRENT_DATE, 0)
ON CONFLICT (id) DO NOTHING;
```

If `quota_tracker` is omitted on a legacy database, `backend/db/supabase_client.py` automatically falls back to an in-memory daily counter without failing pipeline requests.

## 2. Configure backend credentials

Place the project URL and server key exclusively in `backend/.env`:

```dotenv
SUPABASE_URL=https://PROJECT.supabase.co
SUPABASE_SERVICE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
```

Set `chmod 600 backend/.env` on shared or production hosts. Never expose `SUPABASE_SERVICE_KEY` in `frontend/.env.local` or any `NEXT_PUBLIC_` variable; the Next.js frontend communicates exclusively with the FastAPI backend and does not query Supabase directly.

## 3. JSONB data model and caching

All Ustaad 2.0 and 2.1 enhancements preserve backward compatibility with the baseline schema by storing structured fields inside existing JSONB columns (`0` SQL DDL migrations required):

| Column | Stored structure |
| --- | --- |
| `sessions.profile_data` | Candidate metadata, normalized `education` object, `current_skills`, projects, certifications, `analyzed_with` provider/model provenance, optional `target_job_description`, optional `proof_of_work` (GitHub + portfolio technical audit and `prompt_digest`) and optional `reaudit_delta` (baseline session link, readiness/ATS score deltas and resolved critical gaps) |
| `sessions.market_data` | Live Pakistani demand level, PKR salary range, required skills, hiring companies, raw job snippets, deduplicated `verified_job_links` (direct Rozee.pk / LinkedIn / Mustakbil URLs) and `cached_from_at` metadata |
| `sessions.gap_data` | `overall_readiness_score`, prioritized critical/moderate/minor gaps, portfolio/certification gaps, strengths and optional `jd_match_score` / `jd_missing_keywords` |
| `sessions.roadmap_data` | 30/60/90-day weekly milestones, free learning resources, quick wins and portfolio project blueprints |
| `sessions.cv_rewrite_data` | Rewritten summary, skills, quantified experience bullets, project rewrites, ATS score estimate and tailored LinkedIn/cover-letter outreach notes |
| `interview_sessions.questions` | Categorized technical, behavioral and HR questions alongside selected `mode` and `difficulty` |
| `interview_sessions.scores` | Per-question content scores, `clarity_score` ratings, coaching summaries and optional `probe_evaluation` entries from adaptive follow-up drill-downs |

### 48-hour market intelligence cache and zero-Serper re-audits

Before issuing four live Serper.dev Google Search queries and a market extraction LLM call, `get_cached_market_data` checks `sessions` for a completed record matching `target_role` and `target_city` (case-insensitive) created within the last 48 hours. Cache hits reuse the market snapshot and conserve third-party search credits without additional tables or Redis infrastructure. In addition, `POST /api/pipeline/reaudit/{baseline_session_id}` injects the baseline session's `market_data` directly into the orchestrator (`preloaded_market_data`), guaranteeing `0` Serper queries and `1` fewer LLM call during iterative CV revisions.

## 4. Access and retention considerations

- **Session links as bearer capabilities:** Anyone holding a session UUID can view its results via `/dashboard/{session_id}`, `/interview/{session_id}`, `/resume/{session_id}` and `/dossier/{session_id}`. Treat session links as private URLs.
- **Row Level Security (RLS) and Deny-by-Default:** `backend/db/schemas.sql` explicitly executes `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` on `sessions`, `interview_sessions` and `quota_tracker`. By design, no public `anon` policies are granted, ensuring direct PostgREST table queries from unauthorized clients are denied by default. All database reads and writes occur server-side in FastAPI using the private `SUPABASE_SERVICE_KEY`.
- **Retention:** Operators running public instances should periodically purge old rows from `sessions` (`ON DELETE CASCADE` removes associated `interview_sessions`) according to their disclosed retention policy (configurable via `SESSION_RETENTION_DAYS` in `settings.py`, defaulting to 30 days).
