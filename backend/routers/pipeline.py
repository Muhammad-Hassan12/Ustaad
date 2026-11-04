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
    consume_daily_quota,
    create_session,
    get_daily_quota,
    get_public_session,
    get_session,
)
from security import pipeline_start_limit
import settings
from tools.cv_parser import (
    CVParseError,
    extract_cv_contact,
    extract_cv_links,
    extract_cv_text,
)

router = APIRouter(prefix="/api/pipeline")

# Multi-subscriber, replay-safe event bus for real-time status
class PipelineEventBus:
    def __init__(self):
        self.history: list[dict] = []
        self.subscribers: set[asyncio.Queue] = set()
        self.is_done: bool = False

    def emit(self, event: dict):
        self.history.append(event)
        for q in list(self.subscribers):
            try:
                q.put_nowait(event)
            except Exception:
                pass

    def close(self):
        self.is_done = True
        for q in list(self.subscribers):
            try:
                q.put_nowait(None)
            except Exception:
                pass


_event_buses: dict[str, PipelineEventBus] = {}
# Backwards-compatible queue adapter for run_pipeline
status_queues: dict[str, asyncio.Queue] = {}

ALLOWED_TYPES = ["application/pdf"]


async def increment_daily_quota() -> None:
    """Enforce shared server-default daily cap. Raises 429 when exhausted."""
    allowed = await consume_daily_quota(limit=settings.daily_session_limit())
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail=(
                "The shared free daily analysis quota has been reached for today. "
                "Please configure your personal API key in BYOK mode for unlimited access, "
                "or try again after 00:00 UTC."
            ),
            headers={"Retry-After": "86400"},
        )


def _setup_session_bus(session_id: str) -> tuple[PipelineEventBus, asyncio.Queue]:
    bus = PipelineEventBus()
    _event_buses[session_id] = bus

    # Adapter queue to pipe events from run_pipeline into bus
    adapter_queue: asyncio.Queue = asyncio.Queue()
    status_queues[session_id] = adapter_queue

    async def _forwarder():
        while True:
            item = await adapter_queue.get()
            if item is None:
                bus.close()
                status_queues.pop(session_id, None)
                # Keep bus in history for 5 minutes for late reconnects
                await asyncio.sleep(300)
                _event_buses.pop(session_id, None)
                break
            bus.emit(item)

    asyncio.create_task(_forwarder())
    return bus, adapter_queue


@router.post("/start", dependencies=[Depends(pipeline_start_limit)])
async def start_pipeline(
    background_tasks: BackgroundTasks,
    cv_file: UploadFile = File(...),
    target_role: str = Form(...),
    target_city: str = Form(...),
    experience_years: float = Form(0.0),
    education_level: str = Form("Bachelor's"),
    job_description: Optional[str] = Form(default=None),
    github_username: Optional[str] = Form(default=None),
    portfolio_url: Optional[str] = Form(default=None),
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
    if len(cv_bytes) > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File is too large. Maximum size is {settings.MAX_FILE_SIZE // (1024 * 1024)} MB.",
        )

    # Validate target role & city
    role_clean = target_role.strip()
    if not role_clean:
        raise HTTPException(status_code=400, detail="Target role cannot be empty.")
    if len(role_clean) > settings.MAX_ROLE_LENGTH:
        raise HTTPException(status_code=400, detail=f"Target role must be {settings.MAX_ROLE_LENGTH} characters or less.")

    city_clean = target_city.strip()
    if not city_clean:
        raise HTTPException(status_code=400, detail="Target city cannot be empty.")
    if len(city_clean) > settings.MAX_CITY_LENGTH:
        raise HTTPException(status_code=400, detail=f"Target city must be {settings.MAX_CITY_LENGTH} characters or less.")

    # Validate experience years
    if experience_years < 0 or experience_years > settings.MAX_EXPERIENCE_YEARS:
        raise HTTPException(status_code=400, detail=f"Experience years must be between 0 and {int(settings.MAX_EXPERIENCE_YEARS)}.")

    edu_clean = (education_level or "Bachelor's").strip()[:settings.MAX_EDUCATION_LENGTH]
    clean_jd = (job_description or "").strip()[:settings.MAX_JD_LENGTH] or None

    # Parse CV text with error handling
    try:
        cv_text = extract_cv_text(cv_bytes)
    except CVParseError as e:
        raise HTTPException(status_code=422, detail=str(e))

    # Auto-detect proof-of-work links from CV if not explicitly supplied
    manual_gh = (github_username or "").strip()[:settings.MAX_GITHUB_INPUT_LENGTH]
    manual_port = (portfolio_url or "").strip()[:settings.MAX_PORTFOLIO_URL_LENGTH]
    pow_source = "manual_input" if (manual_gh or manual_port) else "cv_extracted"
    detected_links = extract_cv_links(cv_bytes, cv_text)
    effective_github = manual_gh or detected_links.get("github_username")
    effective_portfolio = manual_port or detected_links.get("portfolio_url")

    # Enforce shared daily quota ONLY when using the server's default key
    if not llm_config.is_byok:
        await increment_daily_quota()

    session_id = await create_session(role_clean, city_clean, cv_text)

    _, queue = _setup_session_bus(session_id)

    background_tasks.add_task(
        run_pipeline,
        session_id,
        cv_text,
        role_clean,
        city_clean,
        experience_years,
        edu_clean,
        queue,
        llm_config=llm_config,
        job_description=clean_jd,
        github_username=effective_github,
        portfolio_url=effective_portfolio,
        pow_source=pow_source,
    )

    return {
        "session_id": session_id,
        "provider": llm_config.provider,
        "model": llm_config.model,
        "mode": "byok" if llm_config.is_byok else "server_default",
    }


@router.post("/reaudit/{baseline_session_id}", dependencies=[Depends(pipeline_start_limit)])
async def reaudit_pipeline(
    baseline_session_id: str,
    background_tasks: BackgroundTasks,
    cv_file: UploadFile = File(...),
    experience_years: Optional[float] = Form(default=None),
    education_level: Optional[str] = Form(default=None),
    job_description: Optional[str] = Form(default=None),
    github_username: Optional[str] = Form(default=None),
    portfolio_url: Optional[str] = Form(default=None),
    llm_config: LLMConfig = Depends(resolve_llm_config),
):
    """
    Re-audits an updated CV against the baseline session:
    - Re-uses cached Pakistani market intel directly (0 Serper calls, 1 fewer LLM call)
    - Inherits target role, target city, and JD
    - Computes readiness score delta, ATS score delta, and resolved critical gaps
    """
    baseline = await get_session(baseline_session_id)
    if not baseline:
        raise HTTPException(status_code=404, detail="Baseline session not found.")

    # Validate file type
    filename_lower = (cv_file.filename or "").lower()
    if cv_file.content_type not in ALLOWED_TYPES and not filename_lower.endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are accepted. Please upload a .pdf CV.",
        )

    cv_bytes = await cv_file.read()

    # Validate file size
    if len(cv_bytes) > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File is too large. Maximum size is {settings.MAX_FILE_SIZE // (1024 * 1024)} MB.",
        )

    try:
        cv_text = extract_cv_text(cv_bytes)
    except CVParseError as e:
        raise HTTPException(status_code=422, detail=str(e))

    target_role = baseline.get("target_role") or "Software Engineer"
    target_city = baseline.get("target_city") or "Pakistan"
    baseline_profile = baseline.get("profile_data") or {}

    effective_exp = (
        experience_years
        if experience_years is not None
        else float(baseline_profile.get("experience_years") or 0.0)
    )
    if effective_exp < 0 or effective_exp > settings.MAX_EXPERIENCE_YEARS:
        effective_exp = 0.0

    effective_edu = education_level or (
        baseline_profile.get("education", {}).get("degree")
        if isinstance(baseline_profile.get("education"), dict)
        else str(baseline_profile.get("education") or "Bachelor's")
    )
    clean_jd = (
        (job_description or "").strip()[:settings.MAX_JD_LENGTH]
        or baseline_profile.get("target_job_description")
        or None
    )

    manual_gh = (github_username or "").strip()[:settings.MAX_GITHUB_INPUT_LENGTH]
    manual_port = (portfolio_url or "").strip()[:settings.MAX_PORTFOLIO_URL_LENGTH]
    pow_source = "manual_input" if (manual_gh or manual_port) else "cv_extracted"
    detected_links = extract_cv_links(cv_bytes, cv_text)
    effective_github = manual_gh or detected_links.get("github_username")
    effective_portfolio = manual_port or detected_links.get("portfolio_url")

    baseline_snapshot = {
        "gap_data": baseline.get("gap_data"),
        "cv_rewrite_data": baseline.get("cv_rewrite_data"),
    }

    # Increment shared daily quota ONLY when using the server's default key
    if not llm_config.is_byok:
        await increment_daily_quota()

    session_id = await create_session(target_role.strip(), target_city.strip(), cv_text)

    _, queue = _setup_session_bus(session_id)

    background_tasks.add_task(
        run_pipeline,
        session_id,
        cv_text,
        target_role.strip(),
        target_city.strip(),
        effective_exp,
        effective_edu,
        queue,
        llm_config=llm_config,
        job_description=clean_jd,
        github_username=effective_github,
        portfolio_url=effective_portfolio,
        pow_source=pow_source,
        preloaded_market_data=baseline.get("market_data"),
        baseline_session_id=baseline_session_id,
        baseline_snapshot=baseline_snapshot,
    )

    return {
        "session_id": session_id,
        "baseline_session_id": baseline_session_id,
        "provider": llm_config.provider,
        "model": llm_config.model,
        "mode": "byok" if llm_config.is_byok else "server_default",
    }


@router.get("/status/{session_id}")
async def pipeline_status(session_id: str):
    """
    SSE stream for real-time pipeline progress events.
    Supports reconnection, replays full event history, and periodically sends keepalives.
    """
    async def event_generator():
        bus = _event_buses.get(session_id)
        if not bus:
            # Fall back to database state polling for completed or resumed sessions
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

                yield ": keepalive\n\n"
                await asyncio.sleep(2.0)
            return

        client_queue = asyncio.Queue()
        bus.subscribers.add(client_queue)
        try:
            # 1. Replay past events to reconnected client
            for event in bus.history:
                yield f"data: {json.dumps(event)}\n\n"

            if bus.is_done:
                return

            # 2. Stream new live events as they arrive
            while True:
                try:
                    item = await asyncio.wait_for(client_queue.get(), timeout=15.0)
                    if item is None:
                        break
                    yield f"data: {json.dumps(item)}\n\n"
                except asyncio.TimeoutError:
                    yield ": keepalive\n\n"
        finally:
            bus.subscribers.discard(client_queue)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.get("/quota-status")
async def get_quota_status():
    return await get_daily_quota(daily_limit=settings.daily_session_limit())


@router.get("/results/{session_id}")
async def get_results(session_id: str):
    """
    Return candidate analysis results.
    Excludes raw cv_text to protect candidate PII.
    """
    session = await get_public_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    return session


@router.get("/contact/{session_id}")
async def get_contact(session_id: str):
    """
    Safely extract candidate contact handles for the printable resume view.
    Never exposes raw CV text to the client.
    """
    session = await get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    cv_text = session.get("cv_text") or ""
    return extract_cv_contact(cv_text)
