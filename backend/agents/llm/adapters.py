"""
Lightweight async httpx wire adapters for Gemini, OpenAI-compatible APIs
(OpenAI, DeepSeek, Qwen, GLM, Groq, OpenRouter), and Anthropic Claude.
"""
from typing import Optional
import httpx
from agents.llm.config import LLMConfig
from agents.llm.registry import (
    PROVIDER_REGISTRY,
    get_alternate_base_url,
    resolve_base_url,
)

REASONING_MODEL_HINTS = (
    "o1",
    "o3",
    "o4",
    "gpt-5",
    "deepseek-reasoner",
    "reasoner",
    "qwq",
    "glm-z1",
    "-r1",
    "/r1",
)


class LLMProviderError(Exception):
    """Structured error raised by provider adapters without leaking API keys."""

    def __init__(
        self,
        user_message: str,
        error_code: str = "UPSTREAM_ERROR",
        status_code: int = 500,
        retryable: bool = False,
    ):
        super().__init__(user_message)
        self.user_message = user_message
        self.error_code = error_code
        self.status_code = status_code
        self.retryable = retryable


def _is_reasoning_model(model_id: str) -> bool:
    m = model_id.lower()
    return any(
        m == hint or m.startswith(f"{hint}-") or hint in m
        for hint in REASONING_MODEL_HINTS
    )


def _extract_upstream_detail(resp: httpx.Response) -> str:
    try:
        data = resp.json()
        if isinstance(data, dict):
            err = data.get("error")
            if isinstance(err, dict):
                return str(err.get("message") or err.get("code") or "")[:240]
            if isinstance(err, str):
                return err[:240]
            if "message" in data:
                return str(data["message"])[:240]
    except Exception:
        pass
    return (resp.text or "")[:200]


def _classify_http_error(provider_name: str, model: str, resp: httpx.Response) -> LLMProviderError:
    status = resp.status_code
    detail = _extract_upstream_detail(resp)
    detail_lower = detail.lower()

    if status in (401, 403):
        if any(k in detail_lower for k in ("insufficient", "balance", "credit", "billing", "quota")):
            return LLMProviderError(
                f"{provider_name} reported insufficient credits or quota: {detail or 'Check your billing/plan.'}",
                error_code="INSUFFICIENT_QUOTA",
                status_code=status,
                retryable=False,
            )
        return LLMProviderError(
            f"Invalid or unauthorized {provider_name} API key. {detail}".strip(),
            error_code="INVALID_KEY",
            status_code=status,
            retryable=False,
        )

    if status == 404 or (
        status == 400
        and any(
            phrase in detail_lower
            for phrase in ("model not found", "does not exist", "not found", "unknown model", "invalid model")
        )
    ):
        return LLMProviderError(
            f"Model '{model}' was not found or is not accessible on {provider_name}. {detail}".strip(),
            error_code="MODEL_NOT_FOUND",
            status_code=status,
            retryable=False,
        )

    if status == 429:
        if any(k in detail_lower for k in ("insufficient_quota", "insufficient balance", "balance")):
            return LLMProviderError(
                f"{provider_name} account quota/balance exhausted: {detail}",
                error_code="INSUFFICIENT_QUOTA",
                status_code=429,
                retryable=False,
            )
        return LLMProviderError(
            f"{provider_name} rate limit reached ({model}). {detail}".strip(),
            error_code="RATE_LIMITED",
            status_code=429,
            retryable=True,
        )

    if status in (500, 502, 503, 504, 529):
        return LLMProviderError(
            f"{provider_name} is temporarily overloaded (HTTP {status}). {detail}".strip(),
            error_code="PROVIDER_OVERLOADED",
            status_code=status,
            retryable=True,
        )

    return LLMProviderError(
        f"{provider_name} returned HTTP {status}: {detail or 'Unexpected error'}",
        error_code="BAD_REQUEST" if status == 400 else "UPSTREAM_ERROR",
        status_code=status,
        retryable=False,
    )


async def call_gemini_adapter(
    system_instruction: str,
    prompt: str,
    config: LLMConfig,
    max_tokens: Optional[int] = None,
) -> str:
    """Call Google Gemini Generative Language REST API using header auth (no key in URL)."""
    if not config.api_key:
        raise LLMProviderError("No Gemini API key configured.", error_code="NO_KEY", status_code=401)

    base_url = resolve_base_url("gemini")
    clean_model = config.model.removeprefix("models/")
    url = f"{base_url}/models/{clean_model}:generateContent"
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": config.api_key,
    }

    gen_cfg: dict = {
        "responseMimeType": "application/json",
        "temperature": 0.7,
    }
    if max_tokens is not None:
        gen_cfg["maxOutputTokens"] = max_tokens

    payload: dict = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": gen_cfg,
    }
    if system_instruction:
        payload["system_instruction"] = {"parts": [{"text": system_instruction}]}

    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(url, json=payload, headers=headers)

        # Compatibility fallback for custom/Gemma models on Gemini API that reject
        # responseMimeType="application/json" or system_instruction.
        if resp.status_code == 400:
            detail_lower = _extract_upstream_detail(resp).lower()
            if any(k in detail_lower for k in ("responsemimetype", "mime", "system_instruction", "developer instruction")):
                merged_prompt = (
                    f"{system_instruction}\n\nIMPORTANT: Output ONLY valid raw JSON.\n\n{prompt}"
                    if system_instruction
                    else prompt
                )
                fallback_cfg: dict = {"temperature": 0.7}
                if max_tokens is not None:
                    fallback_cfg["maxOutputTokens"] = max_tokens
                fallback_payload = {
                    "contents": [{"role": "user", "parts": [{"text": merged_prompt}]}],
                    "generationConfig": fallback_cfg,
                }
                resp = await client.post(url, json=fallback_payload, headers=headers)

    if resp.status_code != 200:
        raise _classify_http_error("Google Gemini", clean_model, resp)

    data = resp.json()
    candidates = data.get("candidates") or []
    if not candidates:
        block_reason = (data.get("promptFeedback") or {}).get("blockReason")
        raise LLMProviderError(
            f"Gemini returned an empty response{f' ({block_reason})' if block_reason else ''}.",
            error_code="EMPTY_RESPONSE",
            status_code=502,
            retryable=True,
        )

    parts = ((candidates[0].get("content") or {}).get("parts")) or []
    # Skip internal 'thought' parts emitted by Gemini 2.5/3.1 thinking models
    text_chunks = [
        p.get("text", "")
        for p in parts
        if isinstance(p, dict) and not p.get("thought") and p.get("text")
    ]
    if not text_chunks:
        text_chunks = [p.get("text", "") for p in parts if isinstance(p, dict) and p.get("text")]

    result_text = "\n".join(text_chunks).strip()
    if not result_text:
        raise LLMProviderError(
            "Gemini returned empty text content.",
            error_code="EMPTY_RESPONSE",
            status_code=502,
            retryable=True,
        )
    return result_text


async def call_openai_compat_adapter(
    system_instruction: str,
    prompt: str,
    config: LLMConfig,
    max_tokens: Optional[int] = None,
) -> str:
    """
    Call any OpenAI-compatible Chat Completions endpoint
    (OpenAI, DeepSeek, Qwen DashScope, Zhipu GLM, Groq, OpenRouter).
    """
    spec = PROVIDER_REGISTRY[config.provider]
    if not config.api_key:
        raise LLMProviderError(f"No {spec.name} API key provided.", error_code="NO_KEY", status_code=401)

    base_url = resolve_base_url(config.provider, config.region)
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {config.api_key}",
    }
    if config.provider == "openrouter":
        headers["HTTP-Referer"] = "https://www.ustaad.systems"
        headers["X-Title"] = "Ustaad AI Career OS"

    json_guard = "IMPORTANT: Return ONLY valid JSON matching the requested schema. Do not include markdown fences or extra prose."
    sys_text = f"{system_instruction.strip()}\n\n{json_guard}" if system_instruction else json_guard

    is_reasoning = _is_reasoning_model(config.model)

    payload: dict = {
        "model": config.model,
        "messages": [
            {"role": "system", "content": sys_text},
            {"role": "user", "content": prompt},
        ],
    }

    if not is_reasoning:
        payload["temperature"] = 0.7
        if spec.supports_json_mode:
            payload["response_format"] = {"type": "json_object"}

    if max_tokens is not None:
        if is_reasoning and config.provider == "openai":
            payload["max_completion_tokens"] = max_tokens
        else:
            payload["max_tokens"] = max_tokens

    async with httpx.AsyncClient(timeout=150.0) as client:
        resp = await client.post(f"{base_url}/chat/completions", json=payload, headers=headers)

        # Auto-detect regional endpoint mismatch for Qwen / GLM when region wasn't forced
        if resp.status_code in (401, 403) and not config.region:
            alt_url = get_alternate_base_url(config.provider, base_url)
            if alt_url:
                alt_resp = await client.post(f"{alt_url}/chat/completions", json=payload, headers=headers)
                if alt_resp.status_code == 200 or alt_resp.status_code not in (401, 403):
                    resp = alt_resp
                    base_url = alt_url

        # Parameter-compatibility fallback if custom model rejects response_format, temperature, or system role
        if resp.status_code == 400:
            detail_lower = _extract_upstream_detail(resp).lower()
            if any(
                k in detail_lower
                for k in ("response_format", "json_object", "temperature", "system", "max_tokens", "unsupported")
            ):
                compat_payload: dict = {
                    "model": config.model,
                    "messages": [
                        {"role": "user", "content": f"{sys_text}\n\n{prompt}"},
                    ],
                }
                if max_tokens is not None:
                    compat_payload["max_completion_tokens" if config.provider == "openai" else "max_tokens"] = max_tokens
                resp = await client.post(f"{base_url}/chat/completions", json=compat_payload, headers=headers)

    if resp.status_code != 200:
        raise _classify_http_error(spec.name, config.model, resp)

    data = resp.json()
    choices = data.get("choices") or []
    if not choices:
        raise LLMProviderError(
            f"{spec.name} returned no completion choices.",
            error_code="EMPTY_RESPONSE",
            status_code=502,
            retryable=True,
        )

    msg = choices[0].get("message") or {}
    content = msg.get("content")
    if isinstance(content, list):
        text = "\n".join(
            block.get("text", "")
            for block in content
            if isinstance(block, dict) and block.get("type") in ("text", "output_text", None)
        ).strip()
    else:
        text = str(content or "").strip()

    if not text and choices[0].get("text"):
        text = str(choices[0]["text"]).strip()

    if not text:
        raise LLMProviderError(
            f"{spec.name} returned an empty message.",
            error_code="EMPTY_RESPONSE",
            status_code=502,
            retryable=True,
        )
    return text


async def call_anthropic_adapter(
    system_instruction: str,
    prompt: str,
    config: LLMConfig,
    max_tokens: Optional[int] = None,
) -> str:
    """Call Anthropic Messages API (/v1/messages)."""
    spec = PROVIDER_REGISTRY["anthropic"]
    if not config.api_key:
        raise LLMProviderError("No Anthropic Claude API key provided.", error_code="NO_KEY", status_code=401)

    base_url = resolve_base_url("anthropic")
    headers = {
        "Content-Type": "application/json",
        "x-api-key": config.api_key,
        "anthropic-version": "2023-06-01",
    }

    json_guard = "IMPORTANT: Return ONLY valid raw JSON matching the exact schema requested. Do not wrap in ```json markdown fences or add commentary."
    sys_text = f"{system_instruction.strip()}\n\n{json_guard}" if system_instruction else json_guard

    payload: dict = {
        "model": config.model,
        "max_tokens": max_tokens or 4096,
        "temperature": 0.7,
        "system": sys_text,
        "messages": [{"role": "user", "content": prompt}],
    }

    async with httpx.AsyncClient(timeout=150.0) as client:
        resp = await client.post(f"{base_url}/messages", json=payload, headers=headers)

    if resp.status_code != 200:
        raise _classify_http_error(spec.name, config.model, resp)

    data = resp.json()
    blocks = data.get("content") or []
    text_chunks = [
        b.get("text", "")
        for b in blocks
        if isinstance(b, dict) and b.get("type") == "text" and b.get("text")
    ]
    result_text = "\n".join(text_chunks).strip()
    if not result_text:
        raise LLMProviderError(
            "Anthropic Claude returned an empty response.",
            error_code="EMPTY_RESPONSE",
            status_code=502,
            retryable=True,
        )
    return result_text

