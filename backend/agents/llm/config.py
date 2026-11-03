"""
Request-scoped LLMConfig resolution and strict server-default guardrails.
"""
from dataclasses import dataclass
import os
import re
from typing import Optional
from fastapi import Header, HTTPException
from agents.llm.registry import (
    PROVIDER_REGISTRY,
    SERVER_DEFAULT_MODEL,
    SERVER_DEFAULT_PROVIDER,
)

MODEL_ID_REGEX = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$")
VALID_REGIONS = {"intl", "cn"}


@dataclass(frozen=True)
class LLMConfig:
    provider: str = SERVER_DEFAULT_PROVIDER
    model: str = SERVER_DEFAULT_MODEL
    api_key: Optional[str] = None
    region: Optional[str] = None
    is_byok: bool = False

    @property
    def provider_name(self) -> str:
        spec = PROVIDER_REGISTRY.get(self.provider)
        return spec.name if spec else self.provider

    @property
    def short_label(self) -> str:
        spec = PROVIDER_REGISTRY.get(self.provider)
        short = spec.short_name if spec else self.provider
        return f"{short} · {self.model}"


def validate_model_id(model_id: str) -> str:
    """Validate and sanitize a preset or user-entered custom model identifier."""
    cleaned = model_id.strip()
    if not cleaned:
        raise HTTPException(status_code=400, detail="Model ID cannot be empty.")
    if ".." in cleaned or not MODEL_ID_REGEX.match(cleaned):
        raise HTTPException(
            status_code=400,
            detail="Invalid custom model ID format. Use letters, numbers, '.', '-', '_', ':', or '/'.",
        )
    return cleaned


def build_default_llm_config() -> LLMConfig:
    """Return the locked server-default Gemini 3.1 Flash Lite configuration."""
    return LLMConfig(
        provider=SERVER_DEFAULT_PROVIDER,
        model=SERVER_DEFAULT_MODEL,
        api_key=os.getenv("GEMINI_API_KEY"),
        region=None,
        is_byok=False,
    )


def resolve_llm_config_from_values(
    x_llm_api_key: Optional[str] = None,
    x_gemini_api_key: Optional[str] = None,
    x_llm_provider: Optional[str] = None,
    x_llm_model: Optional[str] = None,
    x_llm_region: Optional[str] = None,
) -> LLMConfig:
    """
    Core resolver shared by FastAPI routes and legacy api_key callers.

    STRICT INVARIANT:
    If no user API key is supplied, ANY provider or custom model header is
    completely ignored and the locked server default (Gemini 3.1 Flash Lite) is used.
    """
    user_key = (x_llm_api_key or "").strip() or (x_gemini_api_key or "").strip()
    if not user_key:
        return build_default_llm_config()

    # Determine provider (legacy X-Gemini-API-Key without X-LLM-Provider defaults to gemini)
    provider = (x_llm_provider or "").strip().lower() or "gemini"
    if provider not in PROVIDER_REGISTRY:
        supported = ", ".join(PROVIDER_REGISTRY.keys())
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported LLM provider '{provider}'. Supported providers: {supported}.",
        )

    spec = PROVIDER_REGISTRY[provider]
    raw_model = (x_llm_model or "").strip()
    resolved_model = validate_model_id(raw_model) if raw_model else spec.default_model

    clean_region: Optional[str] = None
    if x_llm_region and x_llm_region.strip():
        r = x_llm_region.strip().lower()
        if r not in VALID_REGIONS:
            raise HTTPException(status_code=400, detail="Invalid region header. Expected 'intl' or 'cn'.")
        clean_region = r

    return LLMConfig(
        provider=provider,
        model=resolved_model,
        api_key=user_key,
        region=clean_region,
        is_byok=True,
    )


async def resolve_llm_config(
    x_llm_api_key: Optional[str] = Header(default=None),
    x_gemini_api_key: Optional[str] = Header(default=None),
    x_llm_provider: Optional[str] = Header(default=None),
    x_llm_model: Optional[str] = Header(default=None),
    x_llm_region: Optional[str] = Header(default=None),
) -> LLMConfig:
    """FastAPI dependency injecting isolated per-request LLMConfig."""
    return resolve_llm_config_from_values(
        x_llm_api_key=x_llm_api_key,
        x_gemini_api_key=x_gemini_api_key,
        x_llm_provider=x_llm_provider,
        x_llm_model=x_llm_model,
        x_llm_region=x_llm_region,
    )
