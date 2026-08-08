from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from db.supabase_client import get_session
from tools.pdf_generator import generate_career_dossier

router = APIRouter(prefix="/api/export")

@router.get("/dossier/{session_id}")
async def export_dossier(session_id: str):
    session = await get_session(session_id)
    # Return proper HTTP 404 instead of JSON error with status 200
    if not session:
        raise HTTPException(status_code=404, detail="Session not found. The session may have expired or the ID is incorrect.")

    pdf_bytes = generate_career_dossier(session)
    # Safely get candidate name or default to candidate
    profile = session.get("profile_data") or {}
    name = profile.get("name") or "candidate"
    candidate_name = name.replace(" ", "_")

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=ustaad_dossier_{candidate_name}.pdf"}
    )
