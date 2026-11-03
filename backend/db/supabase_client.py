import asyncio
from datetime import date, datetime, timedelta, timezone
from typing import Optional
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv
import os

load_dotenv(Path(__file__).resolve().parents[1] / ".env")
load_dotenv()

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
_session_locks: dict[str, asyncio.Lock] = {}
_fallback_quota_tracker: dict[str, str | int | None] = {"date": None, "count": 0}


def _get_session_lock(session_id: str) -> asyncio.Lock:
    lock = _session_locks.get(session_id)
    if lock is None:
        lock = asyncio.Lock()
        _session_locks[session_id] = lock
    return lock


def release_session_lock(session_id: str) -> None:
    """Clean up per-session lock once pipeline completes or errors."""
    _session_locks.pop(session_id, None)


def _create_session_sync(target_role: str, target_city: str, cv_text: str) -> str:
    result = supabase.table("sessions").insert({
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
    supabase.table("sessions").update(updates).eq("id", session_id).execute()


async def update_session(session_id: str, updates: dict):
    """Update any fields on a session row."""
    await asyncio.to_thread(_update_session_sync, session_id, updates)


def _get_session_sync(session_id: str) -> dict:
    result = supabase.table("sessions").select("*").eq("id", session_id).execute()
    if result.data:
        return result.data[0]
    return {}


async def get_session(session_id: str) -> dict:
    """Fetch a full session row."""
    return await asyncio.to_thread(_get_session_sync, session_id)


def _mark_agent_complete_sync(session_id: str, agent_name: str, data: dict):
    session = _get_session_sync(session_id)
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
    supabase.table("sessions").update(updates).eq("id", session_id).execute()


async def mark_agent_complete(session_id: str, agent_name: str, data: dict):
    """Store agent output and append agent name to completed list safely under per-session lock."""
    lock = _get_session_lock(session_id)
    async with lock:
        await asyncio.to_thread(_mark_agent_complete_sync, session_id, agent_name, data)


def _get_cached_market_data_sync(target_role: str, target_city: str, ttl_hours: int = 48) -> Optional[dict]:
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=ttl_hours)).isoformat()
    result = (
        supabase.table("sessions")
        .select("market_data, created_at")
        .ilike("target_role", target_role.strip())
        .ilike("target_city", target_city.strip())
        .gte("created_at", cutoff)
        .order("created_at", desc=True)
        .limit(5)
        .execute()
    )
    for row in (result.data or []):
        mdata = row.get("market_data")
        if (
            isinstance(mdata, dict)
            and mdata.get("top_required_skills")
            and mdata.get("market_summary")
        ):
            return mdata
    return None


async def get_cached_market_data(target_role: str, target_city: str, ttl_hours: int = 48) -> Optional[dict]:
    """
    Look up recent Market Intelligence data for the same (target_role, target_city)
    within ttl_hours to save Serper.dev search credits and LLM quota.
    """
    try:
        return await asyncio.to_thread(_get_cached_market_data_sync, target_role, target_city, ttl_hours)
    except Exception:
        return None


def _increment_daily_quota_sync() -> None:
    today = date.today().isoformat()
    if _fallback_quota_tracker.get("date") != today:
        _fallback_quota_tracker["date"] = today
        _fallback_quota_tracker["count"] = 1
    else:
        curr = _fallback_quota_tracker.get("count", 0)
        _fallback_quota_tracker["count"] = (curr if isinstance(curr, int) else 0) + 1

    try:
        res = supabase.table("quota_tracker").select("*").eq("id", 1).execute()
        if res.data:
            row = res.data[0]
            new_count = (row.get("request_count", 0) + 1) if row.get("reset_date") == today else 1
            supabase.table("quota_tracker").update({
                "reset_date": today,
                "request_count": new_count,
            }).eq("id", 1).execute()
        else:
            supabase.table("quota_tracker").upsert({
                "id": 1,
                "reset_date": today,
                "request_count": 1,
            }).execute()
    except Exception:
        pass


async def increment_daily_quota() -> None:
    """Increment shared server-default daily session counter in Supabase + fallback memory."""
    await asyncio.to_thread(_increment_daily_quota_sync)


def _get_daily_quota_sync(daily_limit: int = 250) -> dict:
    today = date.today().isoformat()
    try:
        res = supabase.table("quota_tracker").select("*").eq("id", 1).execute()
        if res.data:
            row = res.data[0]
            count = row.get("request_count", 0) if row.get("reset_date") == today else 0
            remaining = max(daily_limit - count, 0)
            return {
                "remaining": remaining,
                "limit": daily_limit,
                "status": "low" if remaining < 20 else "healthy",
            }
    except Exception:
        pass

    if _fallback_quota_tracker.get("date") != today:
        _fallback_quota_tracker["date"] = today
        _fallback_quota_tracker["count"] = 0
    count = _fallback_quota_tracker.get("count", 0)
    count_int = count if isinstance(count, int) else 0
    remaining = max(daily_limit - count_int, 0)
    return {
        "remaining": remaining,
        "limit": daily_limit,
        "status": "low" if remaining < 20 else "healthy",
    }


async def get_daily_quota(daily_limit: int = 250) -> dict:
    """Fetch shared server-default daily quota health."""
    return await asyncio.to_thread(_get_daily_quota_sync, daily_limit)
