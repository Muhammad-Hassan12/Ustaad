"""
BYOK Key Validation Router
Provides a lightweight endpoint for the frontend to validate a user-supplied
Gemini API key before starting the pipeline.
The key is never echoed back, stored, or logged.
"""
import os
import httpx
from fastapi import APIRouter, Header
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/api/keys")

GEMINI_MODELS_URL = "https://generativelanguage.googleapis.com/v1beta/models"
DEFAULT_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite")


@router.get("/validate")
async def validate_gemini_key(
    x_gemini_api_key: Optional[str] = Header(default=None),
):
    """
    Validate a user-supplied Gemini API key.

    - If the header is absent  → returns info about the server default key status
    - If the header is present → tests the key against the Gemini API and returns
                                  {valid: true/false, ...}

    The key is NEVER returned, stored, or written to any log.
    """
    # No user key provided — report on the server default
    if not x_gemini_api_key:
        server_key = os.getenv("GEMINI_API_KEY")
        if server_key:
            return {
                "valid": True,
                "source": "server_default",
                "model": DEFAULT_MODEL,
                "message": "No key provided. Server default key is active.",
            }
        return {
            "valid": False,
            "source": "none",
            "error": "NO_KEY_CONFIGURED",
            "message": "No Gemini API key is configured on the server and none was provided.",
        }

    # User key provided — validate it via a cheap REST call (list models)
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                GEMINI_MODELS_URL,
                params={"key": x_gemini_api_key},
            )

        if resp.status_code == 200:
            return {
                "valid": True,
                "source": "user_key",
                "model": DEFAULT_MODEL,
                "message": "Key is valid. Your key will be used for this session.",
            }
        elif resp.status_code in (400, 403):
            return {
                "valid": False,
                "source": "user_key",
                "error": "INVALID_KEY",
                "message": "The provided API key is invalid or lacks permission.",
            }
        else:
            return {
                "valid": False,
                "source": "user_key",
                "error": f"API_ERROR_{resp.status_code}",
                "message": f"Gemini API returned an unexpected status: {resp.status_code}",
            }

    except httpx.TimeoutException:
        return {
            "valid": False,
            "source": "user_key",
            "error": "TIMEOUT",
            "message": "Request to Gemini API timed out. Please try again.",
        }
    except Exception as e:
        return {
            "valid": False,
            "source": "user_key",
            "error": "REQUEST_FAILED",
            "message": f"Could not reach Gemini API: {str(e)[:150]}",
        }
