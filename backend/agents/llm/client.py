"""
Unified LLM execution client with secret redaction, exponential backoff,
secondary Kaggle failover (for server-default mode only), and 4-layer JSON recovery.
"""
import ast
import asyncio
import json
import logging
import os
import re
from typing import Optional
import httpx

from agents.llm.adapters import (
    LLMProviderError,
    call_anthropic_adapter,
    call_gemini_adapter,
    call_openai_compat_adapter,
)
from agents.llm.config import LLMConfig, build_default_llm_config
from agents.llm.registry import PROVIDER_REGISTRY

logger = logging.getLogger("ustaad.agents")

_SECRET_PATTERNS = [
    re.compile(r"AIza[0-9A-Za-z_-]{20,}"),
    re.compile(r"sk-[0-9A-Za-z_-]{16,}"),
    re.compile(r"gsk_[0-9A-Za-z_-]{16,}"),
]


def redact_secrets(text: str, *explicit_keys: Optional[str]) -> str:
    """Scrub API keys from exception strings and log messages."""
    if not text:
        return ""
    scrubbed = str(text)
    for key in explicit_keys:
        if key and len(key.strip()) >= 8:
            scrubbed = scrubbed.replace(key.strip(), "[REDACTED_KEY]")
    for pat in _SECRET_PATTERNS:
        scrubbed = pat.sub("[REDACTED_KEY]", scrubbed)
    return scrubbed


def strip_thinking_blocks(text: str) -> str:
    """Strip <think>...</think> blocks emitted by DeepSeek-R1, QwQ, Qwen3, or GLM-Z1."""
    cleaned = re.sub(r"<think>[\s\S]*?</think>", "", text, flags=re.IGNORECASE).strip()
    if "</think>" in cleaned:
        cleaned = cleaned.split("</think>")[-1].strip()
    return cleaned


def parse_llm_json(text: str) -> dict:
    """
    Parse JSON from any LLM response using a 4-layer fallback pipeline:
    1. Direct json.loads after <think> stripping
    2. Markdown code-fence stripping + outermost {...} / [...] extraction
    3. Trailing comma cleanup via regex
    4. Python ast.literal_eval fallback for single-quoted dicts
    """
    cleaned_input = strip_thinking_blocks(text or "")

    # 1. Direct parse
    try:
        parsed = json.loads(cleaned_input.strip())
        if isinstance(parsed, (dict, list)):
            return parsed
    except json.JSONDecodeError:
        pass

    # Strip markdown fences
    clean = re.sub(r"```(?:json)?\s*", "", cleaned_input, flags=re.IGNORECASE).strip()
    clean = clean.rstrip("`").strip()

    # 2. Extract JSON object or array
    for start_char, end_char in [("{", "}"), ("[", "]")]:
        start_idx = clean.find(start_char)
        end_idx = clean.rfind(end_char)
        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            block = clean[start_idx : end_idx + 1]

            try:
                return json.loads(block)
            except json.JSONDecodeError:
                pass

            # 3. Trailing commas cleanup
            try:
                cleaned_block = re.sub(r",(\s*[\]}])", r"\1", block)
                return json.loads(cleaned_block)
            except json.JSONDecodeError:
                pass

            # 4. ast.literal_eval fallback
            try:
                block_py = (
                    block.replace("true", "True")
                    .replace("false", "False")
                    .replace("null", "None")
                )
                evaluated = ast.literal_eval(block_py)
                if isinstance(evaluated, (dict, list)):
                    return evaluated
            except Exception:
                pass

    try:
        clean_py = (
            clean.replace("true", "True")
            .replace("false", "False")
            .replace("null", "None")
        )
        evaluated = ast.literal_eval(clean_py)
        if isinstance(evaluated, (dict, list)):
            return evaluated
    except Exception:
        pass

    logger.error("JSON parsing failed on model output (%d chars).", len(text or ""))
    return json.loads(clean)


async def call_kaggle_fallback(system_instruction: str, prompt: str) -> str:
    """Secondary Kaggle Qwen failover endpoint used ONLY for server-default mode."""
    kaggle_url = os.getenv("KAGGLE_LLM_URL")
    if not kaggle_url:
        raise RuntimeError("KAGGLE_LLM_URL is not configured.")

    json_instruction = (
        "IMPORTANT: You must output ONLY valid JSON format. "
        "Do not add markdown blocks like ```json or any other text before or after."
    )
    combined_prompt = (
        f"<|im_start|>system\n{system_instruction or 'You are a helpful assistant.'}\n{json_instruction}<|im_end|>\n"
        f"<|im_start|>user\n{prompt}<|im_end|>\n"
        f"<|im_start|>assistant\n"
    )
    payload = {
        "model": "qwen",
        "prompt": combined_prompt,
        "messages": [
            {"role": "system", "content": f"{system_instruction or 'You are a helpful assistant.'}\n{json_instruction}"},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.7,
        "max_tokens": 4096,
        "max_new_tokens": 4096,
    }
    headers = {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
    }

    async with httpx.AsyncClient(timeout=300.0) as client:
        response = await client.post(kaggle_url, json=payload, headers=headers)
        response.raise_for_status()
        res_data = response.json()

    if "response" in res_data:
        text = res_data["response"]
    elif "choices" in res_data and len(res_data["choices"]) > 0:
        choice = res_data["choices"][0]
        if isinstance(choice.get("message"), dict) and "content" in choice["message"]:
            text = choice["message"]["content"]
        else:
            text = choice.get("text", "")
    elif "text" in res_data:
        text = res_data["text"]
    else:
        raise RuntimeError("Unrecognized Kaggle fallback response shape.")

    return strip_thinking_blocks(text)


async def _dispatch_once(
    system_instruction: str,
    prompt: str,
    config: LLMConfig,
    max_tokens: Optional[int] = None,
) -> str:
    spec = PROVIDER_REGISTRY.get(config.provider)
    if not spec:
        raise LLMProviderError(
            f"Unsupported provider '{config.provider}'.",
            error_code="BAD_REQUEST",
            status_code=400,
        )

    if spec.adapter == "gemini":
        return await call_gemini_adapter(system_instruction, prompt, config, max_tokens=max_tokens)
    if spec.adapter == "anthropic":
        return await call_anthropic_adapter(system_instruction, prompt, config, max_tokens=max_tokens)
    return await call_openai_compat_adapter(system_instruction, prompt, config, max_tokens=max_tokens)


async def call_llm(
    system_instruction: str,
    prompt: str,
    llm_config: Optional[LLMConfig] = None,
    max_retries: Optional[int] = None,
    max_tokens: Optional[int] = None,
) -> str:
    """
    Execute an LLM request with provider-aware retries and secret scrubbing.
    - Server-default mode: up to 8 retries + KAGGLE_LLM_URL failover.
    - BYOK mode: fast-fails on invalid key / missing custom model; retries transient 429/5xx.
    """
    config = llm_config or build_default_llm_config()
    retries = max_retries if max_retries is not None else (8 if not config.is_byok else 4)
    kaggle_url = os.getenv("KAGGLE_LLM_URL") if not config.is_byok else None

    last_err: Optional[Exception] = None
    for attempt in range(retries):
        try:
            return await _dispatch_once(system_instruction, prompt, config, max_tokens=max_tokens)
        except LLMProviderError as e:
            last_err = e
            if kaggle_url:
                try:
                    logger.warning("Server default Gemini hit error (%s); attempting Kaggle failover...", e.error_code)
                    return await call_kaggle_fallback(system_instruction, prompt)
                except Exception as fb_err:
                    logger.error("Kaggle failover failed: %s", redact_secrets(str(fb_err), config.api_key))

            if e.retryable and attempt < retries - 1:
                wait = min(2 ** attempt, 15)
                logger.warning(
                    "Transient %s error (%s, attempt %d/%d). Retrying in %ds...",
                    config.provider,
                    e.error_code,
                    attempt + 1,
                    retries,
                    wait,
                )
                await asyncio.sleep(wait)
                continue

            clean_msg = redact_secrets(e.user_message, config.api_key)
            raise RuntimeError(clean_msg) from None

        except (httpx.TimeoutException, httpx.TransportError) as net_err:
            last_err = net_err
            if attempt < retries - 1:
                wait = min(2 ** attempt, 10)
                await asyncio.sleep(wait)
                continue
            clean_msg = redact_secrets(
                f"Network timeout/error connecting to {config.provider_name}: {net_err}",
                config.api_key,
            )
            raise RuntimeError(clean_msg) from None

        except Exception as e:
            last_err = e
            clean_msg = redact_secrets(str(e), config.api_key)
            raise RuntimeError(clean_msg) from None

    if kaggle_url:
        try:
            return await call_kaggle_fallback(system_instruction, prompt)
        except Exception:
            pass

    raise RuntimeError(
        redact_secrets(f"{config.provider_name} max retries exceeded: {last_err}", config.api_key)
    )


async def call_llm_json(
    system_instruction: str,
    prompt: str,
    llm_config: Optional[LLMConfig] = None,
) -> dict:
    """
    Call the configured LLM provider and parse structured JSON output.
    Includes a 1-shot JSON self-repair retry if a smaller/custom model emits malformed JSON.
    """
    config = llm_config or build_default_llm_config()
    logger.info(
        "Calling LLM [%s | model=%s | mode=%s]...",
        config.provider,
        config.model,
        "byok" if config.is_byok else "server_default",
    )

    raw = await call_llm(system_instruction, prompt, llm_config=config)
    try:
        return parse_llm_json(raw)
    except Exception:
        logger.warning("First JSON parse failed on %s/%s; attempting 1-shot JSON repair...", config.provider, config.model)
        repair_prompt = (
            f"{prompt}\n\n"
            "CRITICAL FORMATTING REQUIREMENT: Your response MUST be a single valid RFC8259 JSON object "
            "using double quotes for all keys and string values, with NO markdown fences and NO trailing commas."
        )
        raw_retry = await call_llm(system_instruction, repair_prompt, llm_config=config, max_retries=2)
        return parse_llm_json(raw_retry)

