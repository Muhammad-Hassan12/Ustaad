"""
Backward-compatible shim preserving original gemini_utils symbols while delegating
to Ustaad's unified Multi-Provider LLM layer (agents.llm) without requiring the
deprecated google-generativeai gRPC SDK.
"""
from dataclasses import dataclass
import os
from typing import Optional
from dotenv import load_dotenv

from agents.llm.client import (
    call_kaggle_fallback,
    call_llm,
    call_llm_json,
    parse_llm_json,
)
from agents.llm.config import LLMConfig, resolve_llm_config_from_values

load_dotenv()

DEFAULT_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite")
parse_gemini_json = parse_llm_json
call_kaggle_qwen = call_kaggle_fallback


@dataclass
class LegacyModelDescriptor:
    model_name: str
    system_instruction: str
    api_key: Optional[str] = None


def get_model(
    system_instruction: str,
    model_name: Optional[str] = None,
    api_key: Optional[str] = None,
) -> LegacyModelDescriptor:
    """Legacy helper retained for backward compatibility with standalone scripts."""
    return LegacyModelDescriptor(
        model_name=model_name or DEFAULT_MODEL,
        system_instruction=system_instruction,
        api_key=api_key or os.getenv("GEMINI_API_KEY"),
    )


async def call_gemini(
    model: LegacyModelDescriptor, prompt: str, max_retries: int = 8
) -> str:
    sys_inst = getattr(model, "system_instruction", "") or ""
    model_id = getattr(model, "model_name", DEFAULT_MODEL) or DEFAULT_MODEL
    key = getattr(model, "api_key", None) or os.getenv("GEMINI_API_KEY")
    cfg = LLMConfig(
        provider="gemini",
        model=model_id,
        api_key=key,
        is_byok=bool(getattr(model, "api_key", None)),
    )
    return await call_llm(str(sys_inst), prompt, llm_config=cfg, max_retries=max_retries)


async def call_gemini_json(
    model: LegacyModelDescriptor, prompt: str, max_retries: int = 8
) -> dict:
    sys_inst = getattr(model, "system_instruction", "") or ""
    key = getattr(model, "api_key", None)
    if key:
        cfg = resolve_llm_config_from_values(
            x_gemini_api_key=key,
            x_llm_provider="gemini",
            x_llm_model=getattr(model, "model_name", None),
        )
    else:
        cfg = resolve_llm_config_from_values()
    return await call_llm_json(str(sys_inst), prompt, llm_config=cfg)
