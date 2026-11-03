# Supabase configuration

Ustaad uses Supabase PostgreSQL to persist pipeline session state, structured JSONB agent outputs, mock interview transcripts and optional daily server-quota counters. User authentication is not required; each generated `session_id` UUID acts as the capability token for retrieving that session's dashboard, interview, printable resume and dossier.

## 1. Initialize database tables

1. Create a dedicated Supabase project and keep its service-role key private.
2. Open **SQL Editor** and execute [`backend/db/schemas.sql`](../backend/db/schemas.sql) to create `sessions` and `interview_sessions`.
3. Optional: to persist shared server-default daily request counts across backend restarts, create the lightweight `quota_tracker` table:

```sql
CREATE TABLE IF NOT EXISTS quota_tracker (
  date DATE PRIMARY KEY,
  requests_count INT NOT NULL DEFAULT 0
);
ALTER TABLE quota_tracker ENABLE ROW LEVEL SECURITY;
```

If `quota_tracker` is omitted, `backend/db/supabase_client.py` automatically falls back to an in-memory daily counter without failing pipeline requests.

## 2. Configure backend credentials

Place the project URL and server key exclusively in `backend/.env`:

```dotenv
SUPABASE_URL=https://PROJECT.supabase.co
SUPABASE_SERVICE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
```

Set `chmod 600 backend/.env` on shared or production hosts. Never expose `SUPABASE_SERVICE_KEY` in `frontend/.env.local` or any `NEXT_PUBLIC_` variable; the Next.js frontend communicates exclusively with the FastAPI backend and does not query Supabase directly.

## 3. JSONB data model and caching

All Ustaad 2.0 enhancements preserve backward compatibility with the baseline two-table schema by storing structured fields inside existing JSONB columns:

| Column | Stored structure |
| --- | --- |
| `sessions.profile_data` | Candidate metadata, normalized `education` object, `current_skills`, projects, certifications and `analyzed_with` provider/model provenance |
| `sessions.market_data` | Live Pakistani demand level, PKR salary range, required skills, hiring companies, raw job snippets and `cached_from_at` metadata |
| `sessions.gap_data` | `overall_readiness_score`, prioritized gaps, strengths and optional `jd_match_score` / `jd_missing_keywords` |
| `sessions.roadmap_data` | 30/60/90-day weekly milestones, free learning resources, quick wins and portfolio project blueprints |
| `sessions.cv_rewrite_data` | Rewritten summary, skills, quantified experience bullets, project rewrites, ATS score estimate and optional outreach notes |
| `interview_sessions.questions` | Categorized technical, behavioral and HR questions alongside selected `mode` and `difficulty` |
| `interview_sessions.scores` | Per-question content scores, `clarity_score` ratings and coaching summaries |

### 48-hour market intelligence cache

Before issuing four live Serper.dev Google Search queries and a market extraction LLM call, `get_cached_market_data` checks `sessions` for a completed record matching `target_role` and `target_city` (case-insensitive) created within the last 48 hours. Cache hits reuse the market snapshot and conserve third-party search credits without additional tables or Redis infrastructure.

## 4. Access and retention considerations

- **Session links as bearer capabilities:** Anyone holding a session UUID can view its results via `/dashboard/{session_id}`, `/interview/{session_id}`, `/resume/{session_id}` and `/dossier/{session_id}`. Treat session links as private URLs.
- **Row Level Security:** Because all database reads and writes occur server-side in FastAPI using `SUPABASE_SERVICE_KEY`, keep public PostgREST access restricted rather than granting anonymous browser write policies in production deployments.
- **Retention:** Operators running public instances should periodically purge old rows from `sessions` (`ON DELETE CASCADE` removes associated `interview_sessions`) according to their disclosed retention policy.

