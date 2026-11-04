"""
Central, environment-driven runtime settings for the Ustaad backend.

Every tunable limit lives here so that routers, the orchestrator and the docs
share one source of truth. Values are read lazily (functions, not module
constants) so tests and operators can change the environment at runtime.
"""
import os


def _int_env(name: str, default: int, minimum: int = 0) -> int:
    raw = os.getenv(name)
    if raw is None or not raw.strip():
        return default
    try:
        return max(int(raw.strip()), minimum)
    except ValueError:
        return default


def _bool_env(name: str, default: bool = False) -> bool:
    raw = os.getenv(name)
    if raw is None or not raw.strip():
        return default
    return raw.strip().lower() in ("1", "true", "yes", "on")


# ── Shared server-key quota ──────────────────────────────────────────────────
def daily_session_limit() -> int:
    """Max server-default analyses (pipeline starts + re-audits) per UTC day."""
    return _int_env("DAILY_SESSION_LIMIT", 250, minimum=1)


def daily_interview_call_limit() -> int:
    """Max server-default interview LLM calls (start/answer/probe) per UTC day."""
    return _int_env("DAILY_INTERVIEW_CALL_LIMIT", 2000, minimum=1)


# ── Per-client rate limits (requests per window) ─────────────────────────────
def rate_limit_window_seconds() -> int:
    return _int_env("RATE_LIMIT_WINDOW_SECONDS", 3600, minimum=1)


def rate_limit_pipeline_starts() -> int:
    """Pipeline starts / re-audits per client per window."""
    return _int_env("RATE_LIMIT_PIPELINE_STARTS", 8, minimum=1)


def rate_limit_interview_calls() -> int:
    """Interview LLM calls per client per window."""
    return _int_env("RATE_LIMIT_INTERVIEW_CALLS", 120, minimum=1)


def rate_limit_key_validations() -> int:
    """Key-validation calls per client per window."""
    return _int_env("RATE_LIMIT_KEY_VALIDATIONS", 30, minimum=1)


def trust_proxy_headers() -> bool:
    """Trust X-Forwarded-For (only enable behind a proxy that overwrites it)."""
    return _bool_env("TRUST_PROXY_HEADERS", False)


# ── Pipeline lifecycle ───────────────────────────────────────────────────────
def pipeline_timeout_seconds() -> int:
    """Hard wall-clock limit for one full pipeline run."""
    return _int_env("PIPELINE_TIMEOUT_SECONDS", 600, minimum=30)


def stale_session_grace_seconds() -> int:
    """Extra time beyond the pipeline timeout before a `running` row is reaped."""
    return _int_env("STALE_SESSION_GRACE_SECONDS", 120, minimum=0)


def session_retention_days() -> int:
    """Delete sessions older than this many days (0 disables the purge job)."""
    return _int_env("SESSION_RETENTION_DAYS", 0, minimum=0)


# ── Input limits ─────────────────────────────────────────────────────────────
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
MAX_JD_LENGTH = 8000
MAX_ROLE_LENGTH = 200
MAX_CITY_LENGTH = 100
MAX_EDUCATION_LENGTH = 100
MAX_PORTFOLIO_URL_LENGTH = 500
MAX_GITHUB_INPUT_LENGTH = 200
MAX_EXPERIENCE_YEARS = 60.0
MAX_CV_PAGES = 12
MAX_CV_CHARS = 30000


# ── Optional secondary LLM failover (server-default mode only) ───────────────
def llm_failover_enabled() -> bool:
    """Failover must be explicitly enabled AND have an https endpoint configured."""
    if not _bool_env("ENABLE_LLM_FAILOVER", False):
        return False
    url = (os.getenv("KAGGLE_LLM_URL") or "").strip()
    return url.lower().startswith("https://")


# ── Environment / CORS ───────────────────────────────────────────────────────
def is_production() -> bool:
    return (os.getenv("APP_ENV") or "").strip().lower() in ("prod", "production")

