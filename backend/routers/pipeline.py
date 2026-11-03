import asyncio
import json
from typing import Optional
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
)
from fastapi.responses import StreamingResponse
from agents.llm import LLMConfig, resolve_llm_config
from agents.orchestrator import run_pipeline
from db.supabase_client import (
    create_session,
    get_daily_quota,
    get_session,
    increment_daily_quota,
)
from tools.cv_parser import CVParseError, extract_cv_text

router = APIRouter(prefix="/api/pipeline")

# In-memory store for real-time status queues (keyed by session_id)
status_queues: dict[str, asyncio.Queue] = {}

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
MAX_JD_LENGTH = 8000
ALLOWED_TYPES = ["application/pdf"]


@router.post("/start")
async def start_pipeline(
    background_tasks: BackgroundTasks,
    cv_file: UploadFile = File(...),
    target_role: str = Form(...),
    target_city: str = Form(...),
    experience_years: float = Form(0.0),
    education_level: str = Form("Bachelor's"),
    job_description: Optional[str] = Form(default=None),
    llm_config: LLMConfig = Depends(resolve_llm_config),
):
    # Validate file type
    filename_lower = (cv_file.filename or "").lower()
    if cv_file.content_type not in ALLOWED_TYPES and not filename_lower.endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are accepted. Please upload a .pdf CV.",
        )

    cv_bytes = await cv_file.read()

    # Validate file size
    if len(cv_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File is too large. Maximum size is 5 MB.",
        )

    # Validate target role & city
    if not target_role.strip():
        raise HTTPException(status_code=400, detail="Target role cannot be empty.")
    if len(target_role) > 200:
        raise HTTPException(status_code=400, detail="Target role must be 200 characters or less.")
    if not target_city.strip():
        raise HTTPException(status_code=400, detail="Target city cannot be empty.")

    clean_jd = (job_description or "").strip()[:MAX_JD_LENGTH] or None

    # Parse CV text with error handling
    try:
        cv_text = extract_cv_text(cv_bytes)
    except CVParseError as e:
        raise HTTPException(status_code=422, detail=str(e))

    session_id = await create_session(target_role.strip(), target_city.strip(), cv_text)

    # Increment shared daily quota ONLY when using the server's default key
    if not llm_config.is_byok:
        await increment_daily_quota()

    queue: asyncio.Queue = asyncio.Queue()
    status_queues[session_id] = queue

    background_tasks.add_task(
        run_pipeline,
        session_id,
        cv_text,
        target_role.strip(),
        target_city.strip(),
        experience_years,
        education_level,
        queue,
        llm_config=llm_config,
        job_description=clean_jd,
    )

    return {
        "session_id": session_id,
        "provider": llm_config.provider,
        "model": llm_config.model,
        "mode": "byok" if llm_config.is_byok else "server_default",
    }


@router.get("/status/{session_id}")
async def pipeline_status(session_id: str):
    """
    SSE stream for real-time pipeline progress events.
    If a browser refreshes mid-run after the one-use queue is detached, falls back
    to lightweight DB state polling until the session completes or errors.
    """
    async def event_generator():
        queue = status_queues.get(session_id)
        if not queue:
            seen_completed: set[str] = set()
            for _ in range(120):
                session = await get_session(session_id)
                if not session:
                    yield f"data: {json.dumps({'event': 'error', 'message': 'Session not found'})}\n\n"
                    return

                for agent in (session.get("agents_completed") or []):
                    if agent not in seen_completed:
                        seen_completed.add(agent)
                        yield f"data: {json.dumps({'event': 'agent_complete', 'agent': agent, 'message': f'{agent} complete'})}\n\n"

                st = session.get("status")
                if st == "complete":
                    yield f"data: {json.dumps({'event': 'pipeline_complete', 'message': 'Analysis complete'})}\n\n"
                    return
                if st == "error":
                    err_msg = session.get("error_message") or "Pipeline encountered an error."
                    yield f"data: {json.dumps({'event': 'error', 'message': err_msg})}\n\n"
                    return

                curr = session.get("current_agent")
                if curr:
                    yield f"data: {json.dumps({'event': 'agent_start', 'agent': curr, 'message': 'Analyzing...'})}\n\n"

                await asyncio.sleep(2.0)
            return

        try:
            while True:
                item = await queue.get()
                if item is None:
                    break
                yield f"data: {json.dumps(item)}\n\n"
        finally:
            status_queues.pop(session_id, None)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.get("/quota-status")
async def get_quota_status():
    return await get_daily_quota(daily_limit=250)


@router.get("/results/{session_id}")
async def get_results(session_id: str):
    session = await get_session(session_id)
    if not session:
        return {"error": "Session not found"}
    return session
