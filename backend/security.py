"""
Abuse protection for endpoints that spend the operator's LLM / search credits.

* `SlidingWindowLimiter` - in-process per-client request limiter.
* `rate_limit(...)`       - FastAPI dependency factory that returns HTTP 429.
* `enforce_server_interview_quota` - UTC-daily cap on server-default interview calls.

All state is process-local, which matches the documented single-worker deployment.
"""
import ipaddress
import threading
import time
from collections import deque
from datetime import datetime, timezone
from typing import Callable, Optional

from fastapi import HTTPException, Request

import settings


class SlidingWindowLimiter:
    """Thread-safe sliding-window counter keyed by (scope, client)."""

    _PRUNE_THRESHOLD = 5000

    def __init__(self) -> None:
        self._hits: dict[str, deque[float]] = {}
        self._lock = threading.Lock()

    def check(self, key: str, limit: int, window_seconds: int, now: Optional[float] = None) -> tuple[bool, int]:
        """Record a hit. Returns (allowed, retry_after_seconds)."""
        current = time.monotonic() if now is None else now
        cutoff = current - window_seconds
        with self._lock:
            bucket = self._hits.setdefault(key, deque())
            while bucket and bucket[0] <= cutoff:
                bucket.popleft()
            if len(bucket) >= limit:
                retry_after = max(int(bucket[0] + window_seconds - current) + 1, 1)
                return False, retry_after
            bucket.append(current)
            if len(self._hits) > self._PRUNE_THRESHOLD:
                self._prune(cutoff)
            return True, 0

    def _prune(self, cutoff: float) -> None:
        for k in [k for k, v in self._hits.items() if not v or v[-1] <= cutoff]:
            self._hits.pop(k, None)

    def reset(self) -> None:
        with self._lock:
            self._hits.clear()


limiter = SlidingWindowLimiter()


def client_identity(request: Request) -> str:
    """
    Best-effort client identifier. `X-Forwarded-For` is only honoured when the
    operator opted in (TRUST_PROXY_HEADERS=true) because it is otherwise spoofable.
    """
    if settings.trust_proxy_headers():
        forwarded = request.headers.get("x-forwarded-for", "")
        if forwarded:
            candidate = forwarded.split(",")[0].strip()
            try:
                return str(ipaddress.ip_address(candidate))
            except ValueError:
                pass
    return request.client.host if request.client else "unknown"


def rate_limit(scope: str, limit_getter: Callable[[], int]) -> Callable:
    """Build a FastAPI dependency that enforces `limit_getter()` hits per window per client."""

    async def dependency(request: Request) -> None:
        allowed, retry_after = limiter.check(
            f"{scope}:{client_identity(request)}",
            limit_getter(),
            settings.rate_limit_window_seconds(),
        )
        if not allowed:
            raise HTTPException(
                status_code=429,
                detail=f"Too many requests. Please retry in {retry_after} seconds.",
                headers={"Retry-After": str(retry_after)},
            )

    return dependency


pipeline_start_limit = rate_limit("pipeline-start", settings.rate_limit_pipeline_starts)
interview_call_limit = rate_limit("interview", settings.rate_limit_interview_calls)
key_validation_limit = rate_limit("key-validate", settings.rate_limit_key_validations)


# ── Daily cap on server-default interview LLM calls ──────────────────────────
_interview_lock = threading.Lock()
_interview_counter: dict[str, object] = {"date": None, "count": 0}


def _seconds_until_utc_midnight() -> int:
    now = datetime.now(timezone.utc)
    midnight = now.replace(hour=0, minute=0, second=0, microsecond=0)
    return max(int(86400 - (now - midnight).total_seconds()), 1)


def enforce_server_interview_quota(is_byok: bool) -> None:
    """Consume one unit of the shared daily interview budget (server-default mode only)."""
    if is_byok:
        return
    today = datetime.now(timezone.utc).date().isoformat()
    with _interview_lock:
        if _interview_counter["date"] != today:
            _interview_counter["date"] = today
            _interview_counter["count"] = 0
        count = int(_interview_counter["count"] or 0)
        if count >= settings.daily_interview_call_limit():
            raise HTTPException(
                status_code=429,
                detail=(
                    "The shared free interview quota for today is exhausted. "
                    "Add your own API key (BYOK) or try again after 00:00 UTC."
                ),
                headers={"Retry-After": str(_seconds_until_utc_midnight())},
            )
        _interview_counter["count"] = count + 1


def reset_interview_quota() -> None:
    with _interview_lock:
        _interview_counter["date"] = None
        _interview_counter["count"] = 0

