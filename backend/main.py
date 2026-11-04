import asyncio
from contextlib import asynccontextmanager
import logging
from pathlib import Path
import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import settings

load_dotenv(Path(__file__).resolve().parent / ".env")
load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("ustaad.main")


async def _background_sweeper():
    """Periodically reap sessions stuck at 'running' and purge past-retention records."""
    from db import supabase_client
    while True:
        try:
            await asyncio.sleep(60)
            if supabase_client.is_configured():
                # Any session running longer than pipeline_timeout + grace is deemed failed
                stale_limit = settings.pipeline_timeout_seconds() + settings.stale_session_grace_seconds()
                reaped = await supabase_client.fail_stale_sessions(max_age_seconds=stale_limit)
                if reaped > 0:
                    logger.info("Reaped %d timed-out running sessions.", reaped)

                retention = settings.session_retention_days()
                if retention > 0:
                    purged = await supabase_client.purge_old_sessions(retention_days=retention)
                    if purged > 0:
                        logger.info("Purged %d sessions older than %d days.", purged, retention)
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.warning("Session sweeper encountered error: %s", e)


@asynccontextmanager
async def lifespan(app: FastAPI):
    from db import supabase_client
    if supabase_client.is_configured():
        # Clean up any leftover running sessions from previous server crashes/restarts
        try:
            reaped = await supabase_client.fail_stale_sessions(max_age_seconds=None)
            if reaped > 0:
                logger.info("Marked %d leftover running sessions as error on startup.", reaped)
        except Exception as e:
            logger.warning("Startup session cleanup skipped: %s", e)
    else:
        logger.warning("Supabase credentials not set; database features are in fallback mode.")

    sweeper_task = asyncio.create_task(_background_sweeper())
    yield
    sweeper_task.cancel()
    try:
        await sweeper_task
    except asyncio.CancelledError:
        pass


app = FastAPI(title="Ustaad API", version="2.0.0", lifespan=lifespan)

# CORS setup: strict origins, explicit allowed headers, no cookies required
raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000")
origins = [o.strip() for o in raw_origins.split(",") if o.strip()]

if not settings.is_production():
    for port in ["3000", "3001", "3002"]:
        dev_url = f"http://localhost:{port}"
        if dev_url not in origins:
            origins.append(dev_url)

ALLOWED_CORS_HEADERS = [
    "Accept",
    "Content-Type",
    "X-LLM-Provider",
    "X-LLM-Model",
    "X-LLM-API-Key",
    "X-LLM-Region",
    "X-Gemini-API-Key",
    "ngrok-skip-browser-warning",
    "X-Forwarded-For",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=ALLOWED_CORS_HEADERS,
)

@app.get("/health")
async def health():
    return {"status": "ok", "service": "ustaad-backend"}

from routers.pipeline import router as pipeline_router
from routers.interview import router as interview_router
from routers.export import router as export_router
from routers.keys import router as keys_router

app.include_router(pipeline_router)
app.include_router(interview_router)
app.include_router(export_router)
app.include_router(keys_router)
