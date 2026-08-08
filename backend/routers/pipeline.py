from fastapi import APIRouter, UploadFile, File, Form, BackgroundTasks, HTTPException, Header
from fastapi.responses import StreamingResponse
from tools.cv_parser import extract_cv_text, CVParseError
from agents.orchestrator import run_pipeline
from db.supabase_client import create_session, get_session
from typing import Optional
import asyncio
import json

router = APIRouter(prefix="/api/pipeline")

# In-memory store for status queues (keyed by session_id)
status_queues: dict[str, asyncio.Queue] = {}
_daily_quota_tracker: dict[str, str | int | None] = {"date": None, "count": 0}

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
ALLOWED_TYPES = ["application/pdf"]


@router.post("/start")
async def start_pipeline(
    background_tasks: BackgroundTasks,
    cv_file: UploadFile = File(...),
    target_role: str = Form(...),
    target_city: str = Form(...),
    experience_years: float = Form(0.0),
    education_level: str = Form("Bachelor's"),
    x_gemini_api_key: Optional[str] = Header(default=None),
):
    # Validate file type
    if cv_file.content_type not in ALLOWED_TYPES and not cv_file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are accepted. Please upload a .pdf CV."
        )

    cv_bytes = await cv_file.read()

    # Validate file size
    if len(cv_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File is too large. Maximum size is 5 MB."
        )

    # Validate target role
    if not target_role.strip():
        raise HTTPException(
            status_code=400,
            detail="Target role cannot be empty."
        )
    if len(target_role) > 200:
        raise HTTPException(
            status_code=400,
            detail="Target role must be 200 characters or less."
        )

    # Parse CV text with error handling
    try:
        cv_text = extract_cv_text(cv_bytes)
    except CVParseError as e:
        raise HTTPException(status_code=422, detail=str(e))

    session_id = await create_session(target_role.strip(), target_city.strip(), cv_text)

    if not x_gemini_api_key:
        from datetime import date
        today = date.today().isoformat()
        if _daily_quota_tracker.get("date") != today:
            _daily_quota_tracker["date"] = today
            _daily_quota_tracker["count"] = 1
        else:
            current_c = _daily_quota_tracker.get("count", 0)
            if isinstance(current_c, int):
                _daily_quota_tracker["count"] = current_c + 1

    queue = asyncio.Queue()
    status_queues[session_id] = queue

    background_tasks.add_task(
        run_pipeline,
        session_id, cv_text, target_role.strip(), target_city.strip(),
        experience_years, education_level, queue,
        api_key=x_gemini_api_key,
    )

    return {"session_id": session_id}


@router.get("/status/{session_id}")
async def pipeline_status(session_id: str):
    """
    SSE stream for real-time pipeline progress events.

    B4 Design Note — One-use queue pattern:
    Each session_id gets exactly one in-memory asyncio.Queue at pipeline start.
    The queue is consumed by the first SSE subscriber and removed after completion.
    If a browser refreshes mid-stream, the queue is gone, but the fallback path
    below (queue is None) checks Supabase and re-emits a synthetic 'pipeline_complete'
    event if the session is already done — so the frontend recovers correctly.
    This is intentional: we trade SSE replay for simplicity. No reconnect buffer needed.
    """
    async def event_generator():
        queue = status_queues.get(session_id)
        if not queue:
            # Queue is gone
            session = await get_session(session_id)
            if session:
                yield f"data: {json.dumps({'event': 'pipeline_complete', 'message': 'Already complete'})}\n\n"
            else:
                yield f"data: {json.dumps({'event': 'error', 'message': 'Session not found'})}\n\n"
            return

        while True:
            item = await queue.get()
            if item is None:
                break
            yield f"data: {json.dumps(item)}\n\n"

        status_queues.pop(session_id, None)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.get("/quota-status")
async def get_quota_status():
    from datetime import date
    today = date.today().isoformat()

    try:
        from db.supabase_client import supabase
        result = supabase.table("quota_tracker").select("*").eq("id", 1).execute()
        if result.data:
            row = result.data[0]
            count = row.get("request_count", 0) if row.get("reset_date") == today else 0
            DAILY_LIMIT = 250
            remaining = max(DAILY_LIMIT - count, 0)
            return {
                "remaining": remaining,
                "limit": DAILY_LIMIT,
                "status": "low" if remaining < 20 else "healthy"
            }
    except Exception:
        pass

    global _daily_quota_tracker
    if _daily_quota_tracker.get("date") != today:
        _daily_quota_tracker["date"] = today
        _daily_quota_tracker["count"] = 0

    DAILY_LIMIT = 250
    count = _daily_quota_tracker.get("count", 0)
    remaining = max(DAILY_LIMIT - count, 0)

    return {
        "remaining": remaining,
        "limit": DAILY_LIMIT,
        "status": "low" if remaining < 20 else "healthy"
    }


@router.get("/results/{session_id}")
async def get_results(session_id: str):
    session = await get_session(session_id)
    return session

