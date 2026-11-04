import { useSyncExternalStore } from "react";

export type LLMProviderId =
  | "gemini"
  | "openai"
  | "anthropic"
  | "deepseek"
  | "qwen"
  | "glm"
  | "groq"
  | "openrouter";

export interface ModelPreset {
  id: string;
  label: string;
  tag?: string | null;
}

export interface ProviderSpec {
  id: LLMProviderId;
  name: string;
  short_name: string;
  default_model: string;
  docs_url: string;
  key_placeholder: string;
  free_tier: boolean;
  badge: string;
  has_regions: boolean;
  regions: string[];
  preset_models: ModelPreset[];
}

export interface StoredProviderProfile {
  apiKey: string;
  selectedModel: string; // preset model ID or "__custom__"
  customModelId: string;
  region?: "intl" | "cn";
}

export interface BYOKStorageState {
  mode: "server_default" | "byok";
  activeProvider: LLMProviderId;
  profiles: Partial<Record<LLMProviderId, StoredProviderProfile>>;
}

export interface ActiveBYOKConfig {
  provider: LLMProviderId;
  providerName: string;
  providerShortName: string;
  model: string;
  apiKey: string;
  region?: "intl" | "cn";
}

export const CUSTOM_MODEL_SENTINEL = "__custom__";
export const SERVER_DEFAULT_MODEL = "gemini-3.1-flash-lite";
const STORAGE_KEY = "ustaad_byok_v2";
const LEGACY_GEMINI_KEY = "gemini_api_key";
export const BYOK_UPDATED_EVENT = "ustaad-byok-updated";

export const FALLBACK_PROVIDERS: ProviderSpec[] = [
  {
    id: "gemini",
    name: "Google Gemini",
    short_name: "Gemini",
    default_model: "gemini-3.1-flash-lite",
    docs_url: "https://aistudio.google.com/apikey",
    key_placeholder: "AIzaSy...",
    free_tier: true,
    badge: "Free Tier",
    has_regions: false,
    regions: [],
    preset_models: [
      { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash Lite", tag: "Fast & Default" },
      { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", tag: "Balanced" },
      { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", tag: "Reasoning" },
      { id: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro Preview", tag: "Frontier" },
      { id: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite", tag: "Ultra-Light" },
    ],
  },
  {
    id: "openai",
    name: "OpenAI (ChatGPT)",
    short_name: "OpenAI",
    default_model: "gpt-4o-mini",
    docs_url: "https://platform.openai.com/api-keys",
    key_placeholder: "sk-proj-...",
    free_tier: false,
    badge: "Popular",
    has_regions: false,
    regions: [],
    preset_models: [
      { id: "gpt-4o-mini", label: "GPT-4o Mini", tag: "Fast & Low Cost" },
      { id: "gpt-4o", label: "GPT-4o", tag: "Flagship" },
      { id: "gpt-4.1-mini", label: "GPT-4.1 Mini", tag: "Balanced" },
      { id: "gpt-4.1", label: "GPT-4.1", tag: "High Precision" },
      { id: "o3-mini", label: "o3-mini", tag: "Reasoning" },
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic (Claude)",
    short_name: "Claude",
    default_model: "claude-sonnet-4-5",
    docs_url: "https://console.anthropic.com/settings/keys",
    key_placeholder: "sk-ant-...",
    free_tier: false,
    badge: "Best Writing",
    has_regions: false,
    regions: [],
    preset_models: [
      { id: "claude-sonnet-4-5", label: "Claude Sonnet 4.5", tag: "Recommended" },
      { id: "claude-haiku-4-5", label: "Claude Haiku 4.5", tag: "Fast" },
      { id: "claude-opus-4-5", label: "Claude Opus 4.5", tag: "Frontier" },
      { id: "claude-3-5-sonnet-latest", label: "Claude 3.5 Sonnet", tag: "Stable" },
      { id: "claude-3-5-haiku-latest", label: "Claude 3.5 Haiku", tag: "Light" },
    ],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    short_name: "DeepSeek",
    default_model: "deepseek-chat",
    docs_url: "https://platform.deepseek.com/api_keys",
    key_placeholder: "sk-...",
    free_tier: false,
    badge: "Ultra-Low Cost",
    has_regions: false,
    regions: [],
    preset_models: [
      { id: "deepseek-chat", label: "DeepSeek V3 (deepseek-chat)", tag: "Recommended" },
      { id: "deepseek-reasoner", label: "DeepSeek R1 (deepseek-reasoner)", tag: "Reasoning" },
    ],
  },
  {
    id: "qwen",
    name: "Qwen (Alibaba Model Studio)",
    short_name: "Qwen",
    default_model: "qwen-plus",
    docs_url: "https://modelstudio.console.alibabacloud.com/",
    key_placeholder: "sk-...",
    free_tier: true,
    badge: "Free Trial",
    has_regions: true,
    regions: ["intl", "cn"],
    preset_models: [
      { id: "qwen-plus", label: "Qwen Plus", tag: "Recommended" },
      { id: "qwen-max", label: "Qwen Max", tag: "Flagship" },
      { id: "qwen-turbo", label: "Qwen Turbo", tag: "Fastest" },
      { id: "qwq-plus", label: "QwQ Plus", tag: "Reasoning" },
    ],
  },
  {
    id: "glm",
    name: "Zhipu GLM (Z.ai / BigModel)",
    short_name: "GLM",
    default_model: "glm-4-flash",
    docs_url: "https://open.bigmodel.cn/usercenter/apikeys",
    key_placeholder: "id.secret...",
    free_tier: true,
    badge: "Free Model",
    has_regions: true,
    regions: ["cn", "intl"],
    preset_models: [
      { id: "glm-4-flash", label: "GLM-4-Flash", tag: "100% Free" },
      { id: "glm-4.5-flash", label: "GLM-4.5-Flash", tag: "Free Tier" },
      { id: "glm-4-air", label: "GLM-4-Air", tag: "Balanced" },
      { id: "glm-4-plus", label: "GLM-4-Plus", tag: "Flagship" },
      { id: "glm-z1-flash", label: "GLM-Z1-Flash", tag: "Free Reasoning" },
    ],
  },
  {
    id: "groq",
    name: "Groq Cloud",
    short_name: "Groq",
    default_model: "llama-3.3-70b-versatile",
    docs_url: "https://console.groq.com/keys",
    key_placeholder: "gsk_...",
    free_tier: true,
    badge: "Free & Fast",
    has_regions: false,
    regions: [],
    preset_models: [
      { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B Versatile", tag: "Recommended (High Quota)" },
      { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant", tag: "Ultra-Fast (High Quota)" },
      { id: "qwen/qwen3-32b", label: "Qwen3 32B (Preview)", tag: "Low Quota Cap" },
    ],
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    short_name: "OpenRouter",
    default_model: "deepseek/deepseek-chat:free",
    docs_url: "https://openrouter.ai/keys",
    key_placeholder: "sk-or-v1-...",
    free_tier: true,
    badge: "Free :free Models",
    has_regions: false,
    regions: [],
    preset_models: [
      { id: "deepseek/deepseek-chat:free", label: "DeepSeek V3 (:free)", tag: "Free" },
      { id: "qwen/qwen-2.5-72b-instruct:free", label: "Qwen 2.5 72B (:free)", tag: "Free" },
      { id: "meta-llama/llama-3.3-70b-instruct:free", label: "Llama 3.3 70B (:free)", tag: "Free" },
      { id: "anthropic/claude-sonnet-4", label: "Claude Sonnet 4", tag: "Paid Credits" },
      { id: "openai/gpt-4o-mini", label: "GPT-4o Mini", tag: "Paid Credits" },
    ],
  },
];

export function getDefaultStorageState(): BYOKStorageState {
  return {
    mode: "server_default",
    activeProvider: "gemini",
    profiles: {},
  };
}

export function loadBYOKState(): BYOKStorageState {
  if (typeof window === "undefined") {
    return getDefaultStorageState();
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as BYOKStorageState;
      if (parsed && (parsed.mode === "server_default" || parsed.mode === "byok")) {
        return {
          mode: parsed.mode,
          activeProvider: parsed.activeProvider || "gemini",
          profiles: parsed.profiles || {},
        };
      }
    }

    // Seamless migration from v1 localStorage["gemini_api_key"]
    const legacyKey = localStorage.getItem(LEGACY_GEMINI_KEY);
    if (legacyKey && legacyKey.trim()) {
      const migrated: BYOKStorageState = {
        mode: "byok",
        activeProvider: "gemini",
        profiles: {
          gemini: {
            apiKey: legacyKey.trim(),
            selectedModel: SERVER_DEFAULT_MODEL,
            customModelId: "",
          },
        },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      localStorage.removeItem(LEGACY_GEMINI_KEY);
      return migrated;
    }
  } catch (err) {
    console.error("Failed to read BYOK config from localStorage:", err);
  }

  return getDefaultStorageState();
}

export function saveBYOKState(state: BYOKStorageState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

  // Clean up legacy key so sensitive keys are never duplicated across storage slots
  try {
    localStorage.removeItem(LEGACY_GEMINI_KEY);
  } catch {
    // Ignore storage errors
  }

  window.dispatchEvent(new Event(BYOK_UPDATED_EVENT));
}

export function clearAllBYOKKeys(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LEGACY_GEMINI_KEY);
  window.dispatchEvent(new Event(BYOK_UPDATED_EVENT));
}

export function resolveModelForProfile(
  providerSpec: ProviderSpec,
  profile?: StoredProviderProfile
): string {
  if (!profile) return providerSpec.default_model;
  if (profile.selectedModel === CUSTOM_MODEL_SENTINEL) {
    return profile.customModelId.trim() || providerSpec.default_model;
  }
  return profile.selectedModel || providerSpec.default_model;
}

export function getActiveBYOKConfig(
  providers: ProviderSpec[] = FALLBACK_PROVIDERS
): ActiveBYOKConfig | null {
  const state = loadBYOKState();
  if (state.mode !== "byok") {
    return null;
  }

  const profile = state.profiles[state.activeProvider];
  const key = profile?.apiKey?.trim();
  if (!key) {
    return null;
  }

  const spec =
    providers.find((p) => p.id === state.activeProvider) ||
    FALLBACK_PROVIDERS.find((p) => p.id === state.activeProvider) ||
    FALLBACK_PROVIDERS[0];

  const model = resolveModelForProfile(spec, profile);

  return {
    provider: spec.id,
    providerName: spec.name,
    providerShortName: spec.short_name,
    model,
    apiKey: key,
    region: profile?.region,
  };
}

let cachedByokSnapshotKey: string | null = null;
let cachedByokConfig: ActiveBYOKConfig | null = null;

function subscribeToBYOK(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  window.addEventListener(BYOK_UPDATED_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(BYOK_UPDATED_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getBYOKSnapshot(): ActiveBYOKConfig | null {
  if (typeof window === "undefined") return null;
  let rawKey = "";
  try {
    rawKey = `${localStorage.getItem(STORAGE_KEY) ?? ""}|${localStorage.getItem(LEGACY_GEMINI_KEY) ?? ""}`;
  } catch {
    return null;
  }
  if (rawKey === cachedByokSnapshotKey) {
    return cachedByokConfig;
  }
  cachedByokSnapshotKey = rawKey;
  cachedByokConfig = getActiveBYOKConfig();
  return cachedByokConfig;
}

function getServerBYOKSnapshot(): ActiveBYOKConfig | null {
  return null;
}

export function useActiveBYOKConfig(): ActiveBYOKConfig | null {
  return useSyncExternalStore(
    subscribeToBYOK,
    getBYOKSnapshot,
    getServerBYOKSnapshot
  );
}


