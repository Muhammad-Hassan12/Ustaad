"""
Multi-Provider BYOK Key & Custom Model Validation Router.
Supports Google Gemini, OpenAI (ChatGPT), Anthropic (Claude), DeepSeek,
Qwen (DashScope), Zhipu GLM (Z.ai / BigModel), Groq, and OpenRouter.
Keys are never echoed back, stored in any database, or written to logs.
"""
import os
from typing import Optional
import httpx
from fastapi import APIRouter, Header
from dotenv import load_dotenv

from agents.llm.adapters import (
    LLMProviderError,
    call_anthropic_adapter,
    call_openai_compat_adapter,
)
from agents.llm.client import redact_secrets
from agents.llm.config import LLMConfig, MODEL_ID_REGEX
from agents.llm.registry import (
    PROVIDER_REGISTRY,
    SERVER_DEFAULT_MODEL,
    SERVER_DEFAULT_PROVIDER,
    get_alternate_base_url,
    get_public_providers,
    resolve_base_url,
)

load_dotenv()

router = APIRouter(prefix="/api/keys")


@router.get("/providers")
async def list_supported_providers():
    """Return the server default info and BYOK provider/model catalog."""
    return {
        "default_provider": SERVER_DEFAULT_PROVIDER,
        "default_model": SERVER_DEFAULT_MODEL,
        "providers": get_public_providers(),
    }


async def _validate_gemini(config: LLMConfig) -> dict:
    base_url = resolve_base_url("gemini")
    clean_model = config.model.removeprefix("models/")
    async with httpx.AsyncClient(timeout=12.0) as client:
        resp = await client.get(
            f"{base_url}/models",
            headers={"x-goog-api-key": config.api_key or ""},
            params={"pageSize": 200},
        )

    if resp.status_code in (400, 401, 403):
        return {
            "valid": False,
            "source": "user_key",
            "provider": "gemini",
            "model": clean_model,
            "error": "INVALID_KEY",
            "message": "The provided Gemini API key is invalid or lacks permission.",
        }
    if resp.status_code != 200:
        return {
            "valid": False,
            "source": "user_key",
            "provider": "gemini",
            "model": clean_model,
            "error": f"API_ERROR_{resp.status_code}",
            "message": f"Gemini API returned unexpected status {resp.status_code}.",
        }

    models_data = resp.json().get("models") or []
    available_ids = {
        m.get("name", "").removeprefix("models/")
        for m in models_data
        if isinstance(m, dict) and m.get("name")
    }
    if available_ids and clean_model not in available_ids:
        return {
            "valid": False,
            "source": "user_key",
            "provider": "gemini",
            "model": clean_model,
            "error": "MODEL_NOT_FOUND",
            "message": f"API key is valid, but custom model '{clean_model}' was not found on Google Gemini.",
        }

    return {
        "valid": True,
        "source": "user_key",
        "provider": "gemini",
        "model": clean_model,
        "message": f"Gemini key verified. Model '{clean_model}' is ready.",
    }


async def _validate_anthropic(config: LLMConfig) -> dict:
    spec = PROVIDER_REGISTRY["anthropic"]
    preset_ids = {m.id for m in spec.preset_models}
    base_url = resolve_base_url("anthropic")
    headers = {
        "x-api-key": config.api_key or "",
        "anthropic-version": "2023-06-01",
    }

    async with httpx.AsyncClient(timeout=12.0) as client:
        resp = await client.get(f"{base_url}/models", headers=headers)

    if resp.status_code in (401, 403):
        return {
            "valid": False,
            "source": "user_key",
            "provider": "anthropic",
            "model": config.model,
            "error": "INVALID_KEY",
            "message": "The provided Anthropic Claude API key is invalid or unauthorized.",
        }

    if resp.status_code == 200:
        listed_ids = {
            m.get("id", "")
            for m in (resp.json().get("data") or [])
            if isinstance(m, dict)
        }
        # Anthropic aliases (e.g. claude-sonnet-4-5, claude-3-5-haiku-latest) map to dated IDs
        alias_matched = (
            config.model in listed_ids
            or config.model in preset_ids
            or any(lid.startswith(config.model) for lid in listed_ids)
        )
        if alias_matched:
            return {
                "valid": True,
                "source": "user_key",
                "provider": "anthropic",
                "model": config.model,
                "message": f"Anthropic key verified. Model '{config.model}' is ready.",
            }

    # Custom model ID not recognized in /v1/models list -> run minimal 5-token ping
    try:
        await call_anthropic_adapter("", 'Reply with {"ok":true}', config, max_tokens=12)
        return {
            "valid": True,
            "source": "user_key",
            "provider": "anthropic",
            "model": config.model,
            "message": f"Anthropic key and custom model '{config.model}' verified.",
        }
    except LLMProviderError as e:
        return {
            "valid": False,
            "source": "user_key",
            "provider": "anthropic",
            "model": config.model,
            "error": e.error_code,
            "message": redact_secrets(e.user_message, config.api_key),
        }


async def _validate_openrouter(config: LLMConfig) -> dict:
    base_url = resolve_base_url("openrouter")
    headers = {"Authorization": f"Bearer {config.api_key}"}
    async with httpx.AsyncClient(timeout=12.0) as client:
        auth_resp = await client.get(f"{base_url}/auth/key", headers=headers)
        if auth_resp.status_code in (401, 403):
            return {
                "valid": False,
                "source": "user_key",
                "provider": "openrouter",
                "model": config.model,
                "error": "INVALID_KEY",
                "message": "Invalid OpenRouter API key.",
            }
        models_resp = await client.get(f"{base_url}/models")

    if models_resp.status_code == 200:
        available_ids = {
            m.get("id", "")
            for m in (models_resp.json().get("data") or [])
            if isinstance(m, dict)
        }
        if available_ids and config.model not in available_ids:
            return {
                "valid": False,
                "source": "user_key",
                "provider": "openrouter",
                "model": config.model,
                "error": "MODEL_NOT_FOUND",
                "message": f"OpenRouter key is valid, but model '{config.model}' was not found. Use 'vendor/model' format.",
            }

    return {
        "valid": True,
        "source": "user_key",
        "provider": "openrouter",
        "model": config.model,
        "message": f"OpenRouter key verified. Model '{config.model}' is ready.",
    }


async def _validate_openai_compat(config: LLMConfig) -> dict:
    spec = PROVIDER_REGISTRY[config.provider]
    preset_ids = {m.id for m in spec.preset_models}
    base_url = resolve_base_url(config.provider, config.region)
    detected_region = config.region
    headers = {"Authorization": f"Bearer {config.api_key}"}

    # GLM does not consistently expose /models across all key scopes; use a minimal 5-token ping
    if config.provider != "glm":
        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.get(f"{base_url}/models", headers=headers)
            if resp.status_code in (401, 403) and spec.regional_urls:
                alt_region = "cn" if (config.region or "intl") == "intl" else "intl"
                alt_url = spec.regional_urls.get(alt_region)
                if alt_url:
                    alt_resp = await client.get(f"{alt_url}/models", headers=headers)
                    if alt_resp.status_code == 200:
                        resp = alt_resp
                        detected_region = alt_region

        if resp.status_code in (401, 403):
            return {
                "valid": False,
                "source": "user_key",
                "provider": config.provider,
                "model": config.model,
                "error": "INVALID_KEY",
                "message": f"Invalid or unauthorized {spec.name} API key.",
            }

        if resp.status_code == 200:
            listed_ids = {
                m.get("id", "")
                for m in (resp.json().get("data") or [])
                if isinstance(m, dict)
            }
            if config.model in listed_ids or (not listed_ids and config.model in preset_ids):
                res_payload: dict = {
                    "valid": True,
                    "source": "user_key",
                    "provider": config.provider,
                    "model": config.model,
                    "message": f"{spec.short_name} key verified. Model '{config.model}' is ready.",
                }
                if detected_region:
                    res_payload["detected_region"] = detected_region
                return res_payload

    # Micro-ping for GLM or custom/unlisted model IDs to confirm callability
    effective_cfg = LLMConfig(
        provider=config.provider,
        model=config.model,
        api_key=config.api_key,
        region=detected_region,
        is_byok=True,
    )
    try:
        await call_openai_compat_adapter("", 'Reply with {"ok":true}', effective_cfg, max_tokens=12)
        res_payload = {
            "valid": True,
            "source": "user_key",
            "provider": config.provider,
            "model": config.model,
            "message": f"{spec.short_name} key and model '{config.model}' verified.",
        }
        if detected_region:
            res_payload["detected_region"] = detected_region
        return res_payload
    except LLMProviderError as e:
        # Check alternate region on GLM if initial ping returned 401/403
        if e.error_code == "INVALID_KEY" and spec.regional_urls:
            alt_region = "intl" if (detected_region or "cn") == "cn" else "cn"
            alt_cfg = LLMConfig(
                provider=config.provider,
                model=config.model,
                api_key=config.api_key,
                region=alt_region,
                is_byok=True,
            )
            try:
                await call_openai_compat_adapter("", 'Reply with {"ok":true}', alt_cfg, max_tokens=12)
                return {
                    "valid": True,
                    "source": "user_key",
                    "provider": config.provider,
                    "model": config.model,
                    "detected_region": alt_region,
                    "message": f"{spec.short_name} key verified on {alt_region.upper()} endpoint. Model '{config.model}' is ready.",
                }
            except LLMProviderError:
                pass

        return {
            "valid": False,
            "source": "user_key",
            "provider": config.provider,
            "model": config.model,
            "error": e.error_code,
            "message": redact_secrets(e.user_message, config.api_key),
        }


async def _run_validation(
    x_llm_api_key: Optional[str],
    x_gemini_api_key: Optional[str],
    x_llm_provider: Optional[str],
    x_llm_model: Optional[str],
    x_llm_region: Optional[str],
) -> dict:
    user_key = (x_llm_api_key or x_gemini_api_key or "").strip()

    # No user key provided -> report server-default status (locked to Gemini 3.1 Flash Lite)
    if not user_key:
        server_key = os.getenv("GEMINI_API_KEY")
        if server_key:
            return {
                "valid": True,
                "source": "server_default",
                "provider": SERVER_DEFAULT_PROVIDER,
                "model": SERVER_DEFAULT_MODEL,
                "message": f"Server default key is active ({SERVER_DEFAULT_MODEL}).",
            }
        return {
            "valid": False,
            "source": "none",
            "provider": SERVER_DEFAULT_PROVIDER,
            "model": SERVER_DEFAULT_MODEL,
            "error": "NO_KEY_CONFIGURED",
            "message": "No server default key is configured and no BYOK key was provided.",
        }

    provider = (x_llm_provider or "gemini").strip().lower()
    if provider not in PROVIDER_REGISTRY:
        return {
            "valid": False,
            "source": "user_key",
            "error": "INVALID_PROVIDER",
            "message": f"Unsupported provider '{provider}'.",
        }

    spec = PROVIDER_REGISTRY[provider]
    model = (x_llm_model or "").strip() or spec.default_model
    if ".." in model or not MODEL_ID_REGEX.match(model):
        return {
            "valid": False,
            "source": "user_key",
            "provider": provider,
            "model": model,
            "error": "INVALID_MODEL",
            "message": "Invalid model ID characters. Use letters, numbers, '.', '-', '_', ':', or '/'.",
        }

    region = (x_llm_region or "").strip().lower() or None
    if region and region not in ("intl", "cn"):
        region = None

    cfg = LLMConfig(
        provider=provider,
        model=model,
        api_key=user_key,
        region=region,
        is_byok=True,
    )

    try:
        if provider == "gemini":
            return await _validate_gemini(cfg)
        if provider == "anthropic":
            return await _validate_anthropic(cfg)
        if provider == "openrouter":
            return await _validate_openrouter(cfg)
        return await _validate_openai_compat(cfg)
    except httpx.TimeoutException:
        return {
            "valid": False,
            "source": "user_key",
            "provider": provider,
            "model": model,
            "error": "TIMEOUT",
            "message": f"Connection to {spec.name} timed out. Please try again.",
        }
    except Exception as e:
        return {
            "valid": False,
            "source": "user_key",
            "provider": provider,
            "model": model,
            "error": "REQUEST_FAILED",
            "message": redact_secrets(f"Could not validate key with {spec.name}: {str(e)[:150]}", user_key),
        }


@router.get("/validate")
async def validate_key_get(
    x_llm_api_key: Optional[str] = Header(default=None),
    x_gemini_api_key: Optional[str] = Header(default=None),
    x_llm_provider: Optional[str] = Header(default=None),
    x_llm_model: Optional[str] = Header(default=None),
    x_llm_region: Optional[str] = Header(default=None),
):
    return await _run_validation(
        x_llm_api_key=x_llm_api_key,
        x_gemini_api_key=x_gemini_api_key,
        x_llm_provider=x_llm_provider,
        x_llm_model=x_llm_model,
        x_llm_region=x_llm_region,
    )


@router.post("/validate")
async def validate_key_post(
    x_llm_api_key: Optional[str] = Header(default=None),
    x_gemini_api_key: Optional[str] = Header(default=None),
    x_llm_provider: Optional[str] = Header(default=None),
    x_llm_model: Optional[str] = Header(default=None),
    x_llm_region: Optional[str] = Header(default=None),
):
    return await _run_validation(
        x_llm_api_key=x_llm_api_key,
        x_gemini_api_key=x_gemini_api_key,
        x_llm_provider=x_llm_provider,
        x_llm_model=x_llm_model,
        x_llm_region=x_llm_region,
    )
