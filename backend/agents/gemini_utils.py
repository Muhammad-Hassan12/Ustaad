"""
Backward-compatible shim preserving original gemini_utils symbols while delegating
to Ustaad's unified Multi-Provider LLM layer (agents.llm).
"""
import os
import google.generativeai as genai
import google.generativeai.client as _genai_client
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


def get_model(system_instruction: str, model_name: str = None, api_key: str = None) -> genai.GenerativeModel:
    """Legacy helper retained for backward compatibility with standalone scripts."""
    resolved_key = api_key or os.getenv("GEMINI_API_KEY")
    model = genai.GenerativeModel(
        model_name=model_name or DEFAULT_MODEL,
        system_instruction=system_instruction,
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
            temperature=0.7,
        ),
    )
    isolated_manager = _genai_client._ClientManager()
    isolated_manager.configure(api_key=resolved_key)
    model._async_client = isolated_manager.make_client("generative_async")
    model._client = isolated_manager.make_client("generative")
    return model


async def call_gemini(model: genai.GenerativeModel, prompt: str, max_retries: int = 8) -> str:
    sys_inst = getattr(model, "system_instruction", "") or ""
    cfg = LLMConfig(provider="gemini", model=DEFAULT_MODEL, api_key=os.getenv("GEMINI_API_KEY"), is_byok=False)
    return await call_llm(str(sys_inst), prompt, llm_config=cfg, max_retries=max_retries)


async def call_gemini_json(model: genai.GenerativeModel, prompt: str, max_retries: int = 8) -> dict:
    sys_inst = getattr(model, "system_instruction", "") or ""
    cfg = resolve_llm_config_from_values()
    return await call_llm_json(str(sys_inst), prompt, llm_config=cfg)
