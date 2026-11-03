# LLM providers and Bring Your Own Key (BYOK)

Ustaad separates **default server execution** from **client-supplied Bring Your Own Key (BYOK)** configurations through a request-scoped resolution layer in `backend/agents/llm/`.

## Server-default lock invariant

When a request omits `X-LLM-API-Key` (and legacy `X-Gemini-API-Key`), `resolve_llm_config` ignores any `X-LLM-Provider`, `X-LLM-Model` or `X-LLM-Region` headers and returns the locked server configuration:

```dotenv
GEMINI_API_KEY=YOUR_GOOGLE_AI_STUDIO_KEY
GEMINI_MODEL=gemini-3.1-flash-lite
```

This invariant prevents anonymous callers from consuming server credentials on higher-cost models or alternative providers. Shared server usage is tracked per UTC day through `quota_tracker` in Supabase (falling back to process memory if that optional table is absent). If the primary server Gemini quota returns `429` or `503` and `KAGGLE_LLM_URL` is configured, default requests can fail over to that secondary OpenAI-compatible endpoint.

BYOK requests never consume the shared server key and never fall back to `KAGGLE_LLM_URL`; provider errors on a user-supplied key fail fast and return a sanitized diagnostic message to the caller.

## Supported BYOK providers

All upstream endpoints are resolved from the server-side `PROVIDER_REGISTRY` allowlist (`backend/agents/llm/registry.py`). Caller headers select a registered provider identifier, an optional regional switch (`intl` or `cn` where supported) and a validated model identifier; arbitrary base URLs are never accepted from client requests.

| Provider ID | Adapter | Upstream base URL | Notes |
| --- | --- | --- | --- |
| `gemini` | `gemini` | `https://generativelanguage.googleapis.com/v1beta` | Uses `x-goog-api-key` header; skips `thought` parts on 2.5/3.x reasoning models |
| `openai` | `openai_compat` | `https://api.openai.com/v1` | Handles `o1`/`o3`/`o4`/`gpt-5` parameter differences (`max_completion_tokens`) |
| `anthropic` | `anthropic` | `https://api.anthropic.com/v1` | Uses `/v1/messages`, `x-api-key` and `anthropic-version: 2023-06-01` |
| `deepseek` | `openai_compat` | `https://api.deepseek.com` | Strips `<think>...</think>` blocks on `deepseek-reasoner` |
| `qwen` | `openai_compat` | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` | Optional `cn` region (`dashscope.aliyuncs.com`) with `401` region auto-retry |
| `glm` | `openai_compat` | `https://open.bigmodel.cn/api/paas/v4` | Optional `intl` region (`api.z.ai/api/paas/v4`) with `401` region auto-retry |
| `groq` | `openai_compat` | `https://api.groq.com/openai/v1` | Fast inference; omits `response_format` automatically if rejected with HTTP `400` |
| `openrouter` | `openai_compat` | `https://openrouter.ai/api/v1` | Supports namespaced custom IDs such as `deepseek/deepseek-r1:free` |

## Custom model identifiers and structured JSON hardening

In BYOK mode, users may choose a curated preset from `GET /api/keys/providers` or enter a custom model identifier. Every model identifier is checked against `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$` with `..` rejected, preventing path traversal or query-string injection when constructing Gemini URL paths.

Because agent pipelines depend on structured JSON dictionaries, `backend/agents/llm/client.py` applies four safeguards across providers:

1. Native JSON mode (`response_mime_type: "application/json"` on Gemini, `response_format: {"type": "json_object"}` on compatible OpenAI endpoints) with automatic plain-prompt retry when a custom or reasoning model rejects JSON-mode parameters.
2. Extraction of text parts while ignoring Gemini `thought: true` blocks and stripping `<think>...</think>` reasoning traces.
3. Four-stage fallback parsing (`json.loads` → markdown fence extraction → trailing-comma cleanup → `ast.literal_eval` dictionary coercion).
4. A single-shot JSON self-repair prompt when initial output remains unparseable.

## Key validation and secret handling

- **Browser-only storage:** User keys live in browser `localStorage` under `ustaad_byok_v2` (migrating legacy `gemini_api_key` entries automatically) and are sent only via HTTPS request headers (`X-LLM-Provider`, `X-LLM-Model`, `X-LLM-API-Key`, optional `X-LLM-Region`).
- **Validation (`GET` / `POST /api/keys/validate`):** Preset models on providers with model-listing endpoints are checked via zero-generation `GET /models` calls. Custom model IDs and providers without a standard `/models` check (such as Zhipu GLM) use a minimal 5-token completion probe to confirm model access.
- **Redaction:** `redact_secrets()` scrubs user keys and common token prefixes (`AIza...`, `sk-...`, `sk-ant-...`, `gsk_...`) before any exception detail reaches HTTP responses, SSE events or database `error_message` fields.
- **Provider policies:** CV text, optional target job descriptions and interview answers are transmitted to whichever provider the caller selects. Review the chosen provider's data-retention and billing terms before submitting personal documents.

