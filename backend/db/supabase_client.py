import asyncio
import logging
import threading
from datetime import datetime, timedelta, timezone
from typing import Optional
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv
import os

import settings

load_dotenv(Path(__file__).resolve().parents[1] / ".env")
load_dotenv()

logger = logging.getLogger("ustaad.db")

supabase_url = os.getenv("SUPABASE_URL", "")
if supabase_url.endswith("/rest/v1/"):
    supabase_url = supabase_url[:-9]
elif supabase_url.endswith("/rest/v1"):
    supabase_url = supabase_url[:-8]

supabase: Optional[Client] = (
    create_client(supabase_url, os.getenv("SUPABASE_SERVICE_KEY", ""))
    if supabase_url and os.getenv("SUPABASE_SERVICE_KEY")
    else None
)

# Per-session asyncio locks prevent race conditions when parallel agents
# (profile + market, or roadmap + cv_rewrite) update agents_completed concurrently.
# NOTE: these locks (and the SSE event channels) are process-local, so the API
# must run as a single uvicorn worker. See docs/DEPLOYMENT.md.
_session_locks: dict[str, asyncio.Lock] = {}
_fallback_quota_tracker: dict[str, str | int | None] = {"date": None, "count": 0}
# Serialises the read-check-write quota cycle inside this process.
_quota_lock = threading.Lock()

# Columns returned to browsers. `cv_text` (full CV, PII) is deliberately absent.
PUBLIC_SESSION_COLUMNS = (
    "id,created_at,status,candidate_name,target_role,target_city,"
    "profile_data,market_data,gap_data,roadmap_data,cv_rewrite_data,"
    "agents_completed,current_agent,error_message"
)


class SupabaseNotConfiguredError(RuntimeError):
    """Raised when a database call is attempted without SUPABASE_URL / SERVICE_KEY."""


def get_client() -> Client:
    """Return the configured Supabase client or fail with a clear message."""
    if supabase is None:
        raise SupabaseNotConfiguredError(
            "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY in backend/.env."
        )
    return supabase


def is_configured() -> bool:
    return supabase is not None


def _get_session_lock(session_id: str) -> asyncio.Lock:
    lock = _session_locks.get(session_id)
    if lock is None:
        lock = asyncio.Lock()
        _session_locks[session_id] = lock
    return lock


def release_session_lock(session_id: str) -> None:
    """Clean up per-session lock once pipeline completes or errors."""
    _session_locks.pop(session_id, None)


def _utc_today() -> str:
    return datetime.now(timezone.utc).date().isoformat()


def _create_session_sync(target_role: str, target_city: str, cv_text: str) -> str:
    result = get_client().table("sessions").insert({
        "target_role": target_role,
        "target_city": target_city,
        "cv_text": cv_text,
        "status": "running"
    }).execute()
    return result.data[0]["id"]


async def create_session(target_role: str, target_city: str, cv_text: str) -> str:
    """Create a new pipeline session. Returns session_id (UUID string)."""
    return await asyncio.to_thread(_create_session_sync, target_role, target_city, cv_text)


def _update_session_sync(session_id: str, updates: dict):
    get_client().table("sessions").update(updates).eq("id", session_id).execute()


async def update_session(session_id: str, updates: dict):
    """Update any fields on a session row."""
    await asyncio.to_thread(_update_session_sync, session_id, updates)


def _get_session_sync(session_id: str, columns: str = "*") -> dict:
    result = get_client().table("sessions").select(columns).eq("id", session_id).execute()
    if result.data:
        return result.data[0]
    return {}


async def get_session(session_id: str) -> dict:
    """Fetch a full session row (server-side use only; includes cv_text)."""
    return await asyncio.to_thread(_get_session_sync, session_id)


async def get_public_session(session_id: str) -> dict:
    """Fetch a session row without the raw CV text, safe to return to browsers."""
    return await asyncio.to_thread(_get_session_sync, session_id, PUBLIC_SESSION_COLUMNS)


def _mark_agent_complete_sync(session_id: str, agent_name: str, data: dict):
    session = _get_session_sync(session_id, "agents_completed")
    completed = list(session.get("agents_completed") or [])
    if agent_name not in completed:
        completed.append(agent_name)
    updates: dict = {
        f"{agent_name}_data": data,
        "agents_completed": completed,
        "current_agent": agent_name,
    }
    if agent_name == "profile" and isinstance(data, dict) and data.get("name"):
        updates["candidate_name"] = data["name"]
    get_client().table("sessions").update(updates).eq("id", session_id).execute()


async def mark_agent_complete(session_id: str, agent_name: str, data: dict):
    """Store agent output and append agent name to completed list safely under per-session lock."""
    lock = _get_session_lock(session_id)
    async with lock:
        await asyncio.to_thread(_mark_agent_complete_sync, session_id, agent_name, data)


# ── Market cache ─────────────────────────────────────────────────────────────

def _escape_like(value: str) -> str:
    """Escape LIKE/ILIKE metacharacters so user text can never act as a wildcard."""
    return (
        value.replace("\\", "\\\\")
        .replace("%", "\\%")
        .replace("_", "\\_")
        .replace("*", "\\*")
    )


def _normalize_key(value: Optional[str]) -> str:
    return " ".join((value or "").lower().split())


def _parse_iso(value: object) -> Optional[datetime]:
    if not isinstance(value, str) or not value:
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed


def _is_cacheable_market(mdata: object, cutoff: datetime) -> bool:
    """A market payload is shareable only if it is complete, fresh, live and server-generated."""
    if not isinstance(mdata, dict):
        return False
    if not (mdata.get("top_required_skills") and mdata.get("market_summary")):
        return False
    # Never share data produced from empty/errored searches or by a user's own BYOK model.
    if mdata.get("live_data_available") is False or mdata.get("unverified"):
        return False
    if mdata.get("source_mode") != "server_default":
        return False
    generated = _parse_iso(mdata.get("generated_at"))
    return generated is not None and generated >= cutoff


def _get_cached_market_data_sync(target_role: str, target_city: str, ttl_hours: int = 48) -> Optional[dict]:
    cutoff = datetime.now(timezone.utc) - timedelta(hours=ttl_hours)
    result = (
        get_client().table("sessions")
        .select("market_data, created_at, target_role, target_city")
        .ilike("target_role", _escape_like(target_role.strip()))
        .ilike("target_city", _escape_like(target_city.strip()))
        .gte("created_at", cutoff.isoformat())
        .order("created_at", desc=True)
        .limit(10)
        .execute()
    )
    want_role = _normalize_key(target_role)
    want_city = _normalize_key(target_city)
    for row in (result.data or []):
        # Defence in depth: re-verify the match in Python regardless of SQL pattern semantics.
        if _normalize_key(row.get("target_role")) != want_role:
            continue
        if _normalize_key(row.get("target_city")) != want_city:
            continue
        mdata = row.get("market_data")
        if _is_cacheable_market(mdata, cutoff):
            return mdata
    return None


async def get_cached_market_data(target_role: str, target_city: str, ttl_hours: int = 48) -> Optional[dict]:
    """
    Look up recent, live, server-generated Market Intelligence data for the same
    (target_role, target_city) within ttl_hours to save Serper.dev credits and LLM quota.
    The TTL is measured from the data's own `generated_at`, so cache hits never extend it.
    """
    try:
        return await asyncio.to_thread(_get_cached_market_data_sync, target_role, target_city, ttl_hours)
    except Exception:
        return None


# ── Daily shared quota (server-default key) ──────────────────────────────────

def _read_quota_count(today: str) -> tuple[int, bool]:
    """Return (count_today, from_database)."""
    try:
        res = get_client().table("quota_tracker").select("*").eq("id", 1).execute()
        if res.data:
            row = res.data[0]
            if str(row.get("reset_date")) == today:
                return int(row.get("request_count") or 0), True
            return 0, True
        return 0, True
    except Exception:
        pass

    if _fallback_quota_tracker.get("date") != today:
        _fallback_quota_tracker["date"] = today
        _fallback_quota_tracker["count"] = 0
    count = _fallback_quota_tracker.get("count", 0)
    return (count if isinstance(count, int) else 0), False


def _write_quota_count(today: str, new_count: int) -> None:
    _fallback_quota_tracker["date"] = today
    _fallback_quota_tracker["count"] = new_count
    try:
        get_client().table("quota_tracker").upsert({
            "id": 1,
            "reset_date": today,
            "request_count": new_count,
        }).execute()
    except Exception as exc:
        logger.warning("Could not persist quota counter (using in-memory fallback): %s", exc)


def _consume_daily_quota_sync(limit: int) -> bool:
    today = _utc_today()
    with _quota_lock:
        count, _ = _read_quota_count(today)
        if count >= limit:
            return False
        _write_quota_count(today, count + 1)
        return True


def _refund_daily_quota_sync() -> None:
    today = _utc_today()
    with _quota_lock:
        count, _ = _read_quota_count(today)
        if count > 0:
            _write_quota_count(today, count - 1)


async def consume_daily_quota(limit: Optional[int] = None) -> bool:
    """
    Atomically (within this process) check the shared server-default daily cap and,
    if capacity remains, consume one unit. Returns False when the cap is exhausted.
    """
    return await asyncio.to_thread(_consume_daily_quota_sync, limit or settings.daily_session_limit())


async def refund_daily_quota() -> None:
    """Give back one unit (used when a request fails after quota was consumed)."""
    await asyncio.to_thread(_refund_daily_quota_sync)


def _get_daily_quota_sync(daily_limit: int) -> dict:
    count, _ = _read_quota_count(_utc_today())
    remaining = max(daily_limit - count, 0)
    return {
        "remaining": remaining,
        "limit": daily_limit,
        "status": "low" if remaining < max(daily_limit // 12, 1) else "healthy",
    }


async def get_daily_quota(daily_limit: Optional[int] = None) -> dict:
    """Fetch shared server-default daily quota health."""
    return await asyncio.to_thread(_get_daily_quota_sync, daily_limit or settings.daily_session_limit())


# ── Lifecycle maintenance ────────────────────────────────────────────────────

def _fail_stale_sessions_sync(max_age_seconds: Optional[int]) -> int:
    """Mark `running` sessions as failed. `None` age => every running session (startup)."""
    query = (
        get_client().table("sessions")
        .update({
            "status": "error",
            "error_message": "Analysis was interrupted before it could finish. Please start a new analysis.",
        })
        .eq("status", "running")
    )
    if max_age_seconds is not None:
        cutoff = datetime.now(timezone.utc) - timedelta(seconds=max_age_seconds)
        query = query.lt("created_at", cutoff.isoformat())
    res = query.execute()
    return len(res.data or [])


async def fail_stale_sessions(max_age_seconds: Optional[int]) -> int:
    return await asyncio.to_thread(_fail_stale_sessions_sync, max_age_seconds)


def _purge_old_sessions_sync(retention_days: int) -> int:
    cutoff = datetime.now(timezone.utc) - timedelta(days=retention_days)
    res = get_client().table("sessions").delete().lt("created_at", cutoff.isoformat()).execute()
    return len(res.data or [])


async def purge_old_sessions(retention_days: int) -> int:
    """Delete sessions (and, via ON DELETE CASCADE, their interviews) older than N days."""
    return await asyncio.to_thread(_purge_old_sessions_sync, retention_days)
