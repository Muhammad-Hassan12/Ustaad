import asyncio
from supabase import create_client, Client
from dotenv import load_dotenv
import os

load_dotenv()

supabase_url = os.getenv("SUPABASE_URL", "")
if supabase_url.endswith("/rest/v1/"):
    supabase_url = supabase_url[:-9]
elif supabase_url.endswith("/rest/v1"):
    supabase_url = supabase_url[:-8]

supabase: Client = create_client(
    supabase_url,
    os.getenv("SUPABASE_SERVICE_KEY")
)

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
    completed = session.get("agents_completed", []) or []
    if agent_name not in completed:
        completed.append(agent_name)
    supabase.table("sessions").update({
        f"{agent_name}_data": data,
        "agents_completed": completed,
        "current_agent": agent_name
    }).eq("id", session_id).execute()

async def mark_agent_complete(session_id: str, agent_name: str, data: dict):
    """Store agent output and append agent name to completed list."""
    await asyncio.to_thread(_mark_agent_complete_sync, session_id, agent_name, data)
