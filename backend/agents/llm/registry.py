"""
Provider registry and model catalog for Ustaad Multi-Provider BYOK.
All base URLs are resolved strictly from this server-side allowlist (SSRF-safe).
"""
from dataclasses import dataclass, field
import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

SERVER_DEFAULT_PROVIDER = "gemini"
SERVER_DEFAULT_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite")


@dataclass(frozen=True)
class ModelPreset:
    id: str
    label: str
    tag: Optional[str] = None


@dataclass(frozen=True)
class ProviderSpec:
    id: str
    name: str
    short_name: str
    adapter: str  # "gemini" | "openai_compat" | "anthropic"
    base_url: str
    default_model: str
    docs_url: str
    key_placeholder: str
    free_tier: bool
    badge: str
    preset_models: list[ModelPreset] = field(default_factory=list)
    regional_urls: dict[str, str] = field(default_factory=dict)
    supports_json_mode: bool = True


PROVIDER_REGISTRY: dict[str, ProviderSpec] = {
    "gemini": ProviderSpec(
        id="gemini",
        name="Google Gemini",
        short_name="Gemini",
        adapter="gemini",
        base_url="https://generativelanguage.googleapis.com/v1beta",
        default_model=SERVER_DEFAULT_MODEL,
        docs_url="https://aistudio.google.com/apikey",
        key_placeholder="AIzaSy...",
        free_tier=True,
        badge="Free Tier",
        preset_models=[
            ModelPreset("gemini-3.1-flash-lite", "Gemini 3.1 Flash Lite", "Fast & Default"),
            ModelPreset("gemini-2.5-flash", "Gemini 2.5 Flash", "Balanced"),
            ModelPreset("gemini-2.5-pro", "Gemini 2.5 Pro", "Reasoning"),
            ModelPreset("gemini-3.1-pro-preview", "Gemini 3.1 Pro Preview", "Frontier"),
            ModelPreset("gemini-2.5-flash-lite", "Gemini 2.5 Flash Lite", "Ultra-Light"),
        ],
    ),
    "openai": ProviderSpec(
        id="openai",
        name="OpenAI (ChatGPT)",
        short_name="OpenAI",
        adapter="openai_compat",
        base_url="https://api.openai.com/v1",
        default_model="gpt-4o-mini",
        docs_url="https://platform.openai.com/api-keys",
        key_placeholder="sk-proj-...",
        free_tier=False,
        badge="Popular",
        preset_models=[
            ModelPreset("gpt-4o-mini", "GPT-4o Mini", "Fast & Low Cost"),
            ModelPreset("gpt-4o", "GPT-4o", "Flagship"),
            ModelPreset("gpt-4.1-mini", "GPT-4.1 Mini", "Balanced"),
            ModelPreset("gpt-4.1", "GPT-4.1", "High Precision"),
            ModelPreset("o3-mini", "o3-mini", "Reasoning"),
        ],
    ),
    "anthropic": ProviderSpec(
        id="anthropic",
        name="Anthropic (Claude)",
        short_name="Claude",
        adapter="anthropic",
        base_url="https://api.anthropic.com/v1",
        default_model="claude-sonnet-4-5",
        docs_url="https://console.anthropic.com/settings/keys",
        key_placeholder="sk-ant-...",
        free_tier=False,
        badge="Best Writing",
        preset_models=[
            ModelPreset("claude-sonnet-4-5", "Claude Sonnet 4.5", "Recommended"),
            ModelPreset("claude-haiku-4-5", "Claude Haiku 4.5", "Fast"),
            ModelPreset("claude-opus-4-5", "Claude Opus 4.5", "Frontier"),
            ModelPreset("claude-3-5-sonnet-latest", "Claude 3.5 Sonnet", "Stable"),
            ModelPreset("claude-3-5-haiku-latest", "Claude 3.5 Haiku", "Light"),
        ],
    ),
    "deepseek": ProviderSpec(
        id="deepseek",
        name="DeepSeek",
        short_name="DeepSeek",
        adapter="openai_compat",
        base_url="https://api.deepseek.com/v1",
        default_model="deepseek-chat",
        docs_url="https://platform.deepseek.com/api_keys",
        key_placeholder="sk-...",
        free_tier=False,
        badge="Ultra-Low Cost",
        preset_models=[
            ModelPreset("deepseek-chat", "DeepSeek V3 (deepseek-chat)", "Recommended"),
            ModelPreset("deepseek-reasoner", "DeepSeek R1 (deepseek-reasoner)", "Reasoning"),
        ],
    ),
    "qwen": ProviderSpec(
        id="qwen",
        name="Qwen (Alibaba Model Studio)",
        short_name="Qwen",
        adapter="openai_compat",
        base_url="https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
        regional_urls={
            "intl": "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
            "cn": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        },
        default_model="qwen-plus",
        docs_url="https://modelstudio.console.alibabacloud.com/",
        key_placeholder="sk-...",
        free_tier=True,
        badge="Free Trial",
        preset_models=[
            ModelPreset("qwen-plus", "Qwen Plus", "Recommended"),
            ModelPreset("qwen-max", "Qwen Max", "Flagship"),
            ModelPreset("qwen-turbo", "Qwen Turbo", "Fastest"),
            ModelPreset("qwq-plus", "QwQ Plus", "Reasoning"),
        ],
    ),
    "glm": ProviderSpec(
        id="glm",
        name="Zhipu GLM (Z.ai / BigModel)",
        short_name="GLM",
        adapter="openai_compat",
        base_url="https://open.bigmodel.cn/api/paas/v4",
        regional_urls={
            "cn": "https://open.bigmodel.cn/api/paas/v4",
            "intl": "https://api.z.ai/api/paas/v4",
        },
        default_model="glm-4-flash",
        docs_url="https://open.bigmodel.cn/usercenter/apikeys",
        key_placeholder="id.secret...",
        free_tier=True,
        badge="Free Model",
        preset_models=[
            ModelPreset("glm-4-flash", "GLM-4-Flash", "100% Free"),
            ModelPreset("glm-4.5-flash", "GLM-4.5-Flash", "Free Tier"),
            ModelPreset("glm-4-air", "GLM-4-Air", "Balanced"),
            ModelPreset("glm-4-plus", "GLM-4-Plus", "Flagship"),
            ModelPreset("glm-z1-flash", "GLM-Z1-Flash", "Free Reasoning"),
        ],
    ),
    "groq": ProviderSpec(
        id="groq",
        name="Groq Cloud",
        short_name="Groq",
        adapter="openai_compat",
        base_url="https://api.groq.com/openai/v1",
        default_model="llama-3.3-70b-versatile",
        docs_url="https://console.groq.com/keys",
        key_placeholder="gsk_...",
        free_tier=True,
        badge="Free & Fast",
        preset_models=[
            ModelPreset("llama-3.3-70b-versatile", "Llama 3.3 70B Versatile", "Recommended (High Quota)"),
            ModelPreset("llama-3.1-8b-instant", "Llama 3.1 8B Instant", "Ultra-Fast (High Quota)"),
            ModelPreset("qwen/qwen3-32b", "Qwen3 32B (Preview)", "Low Quota Cap"),
        ],
    ),
    "openrouter": ProviderSpec(
        id="openrouter",
        name="OpenRouter",
        short_name="OpenRouter",
        adapter="openai_compat",
        base_url="https://openrouter.ai/api/v1",
        default_model="deepseek/deepseek-chat:free",
        docs_url="https://openrouter.ai/keys",
        key_placeholder="sk-or-v1-...",
        free_tier=True,
        badge="Free :free Models",
        supports_json_mode=False,
        preset_models=[
            ModelPreset("deepseek/deepseek-chat:free", "DeepSeek V3 (:free)", "Free"),
            ModelPreset("qwen/qwen-2.5-72b-instruct:free", "Qwen 2.5 72B (:free)", "Free"),
            ModelPreset("meta-llama/llama-3.3-70b-instruct:free", "Llama 3.3 70B (:free)", "Free"),
            ModelPreset("anthropic/claude-sonnet-4", "Claude Sonnet 4", "Paid Credits"),
            ModelPreset("openai/gpt-4o-mini", "GPT-4o Mini", "Paid Credits"),
        ],
    ),
}


def resolve_base_url(provider_id: str, region: Optional[str] = None) -> str:
    """Resolve the SSRF-safe upstream endpoint URL for a provider and optional region."""
    spec = PROVIDER_REGISTRY[provider_id]
    if region and spec.regional_urls and region in spec.regional_urls:
        return spec.regional_urls[region]
    return spec.base_url


def get_alternate_base_url(provider_id: str, current_url: str) -> Optional[str]:
    """Return alternate regional URL (e.g. intl <-> cn for Qwen/GLM) if available."""
    spec = PROVIDER_REGISTRY.get(provider_id)
    if not spec or not spec.regional_urls:
        return None
    for url in spec.regional_urls.values():
        if url != current_url:
            return url
    return None


def get_public_providers() -> list[dict]:
    """Serialize provider catalog for frontend UI consumption."""
    items = []
    for spec in PROVIDER_REGISTRY.values():
        items.append({
            "id": spec.id,
            "name": spec.name,
            "short_name": spec.short_name,
            "default_model": spec.default_model,
            "docs_url": spec.docs_url,
            "key_placeholder": spec.key_placeholder,
            "free_tier": spec.free_tier,
            "badge": spec.badge,
            "has_regions": bool(spec.regional_urls),
            "regions": list(spec.regional_urls.keys()) if spec.regional_urls else [],
            "preset_models": [
                {"id": m.id, "label": m.label, "tag": m.tag}
                for m in spec.preset_models
            ],
        })
    return items

