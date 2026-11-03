import asyncio
import re
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from db.supabase_client import get_session, supabase
from tools.pdf_generator import generate_career_dossier

router = APIRouter(prefix="/api/export")


def _get_latest_interview_sync(session_id: str) -> dict | None:
    try:
        res = (
            supabase.table("interview_sessions")
            .select("*")
            .eq("session_id", session_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        return res.data[0] if res.data else None
    except Exception:
        return None


@router.get("/dossier/{session_id}")
async def export_dossier(session_id: str):
    session = await get_session(session_id)
    if not session:
        raise HTTPException(
            status_code=404,
            detail="Session not found. The session may have expired or the ID is incorrect.",
        )

    interview = await asyncio.to_thread(_get_latest_interview_sync, session_id)
    pdf_bytes = await asyncio.to_thread(generate_career_dossier, session, interview)

    profile = session.get("profile_data") or {}
    raw_name = profile.get("name") or session.get("candidate_name") or "candidate"
    safe_name = re.sub(r"[^A-Za-z0-9_-]+", "_", str(raw_name)).strip("_") or "candidate"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=ustaad_dossier_{safe_name}.pdf"},
    )
