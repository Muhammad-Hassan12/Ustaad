"use client";

import { useState, useEffect } from "react";
import {
  getProvidersCatalog,
  getQuotaStatus,
  KeyValidationResult,
  validateKey,
} from "@/lib/api";
import {
  BYOKStorageState,
  clearAllBYOKKeys,
  CUSTOM_MODEL_SENTINEL,
  FALLBACK_PROVIDERS,
  LLMProviderId,
  loadBYOKState,
  ProviderSpec,
  saveBYOKState,
  SERVER_DEFAULT_MODEL,
  StoredProviderProfile,
} from "@/lib/llmConfig";
import {
  X,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Loader2,
  Trash2,
  Lock,
  Sparkles,
  ExternalLink,
  Cpu,
} from "lucide-react";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyUpdated?: () => void;
}

export default function ApiKeyModal({
  isOpen,
  onClose,
  onKeyUpdated,
}: ApiKeyModalProps) {
  if (!isOpen) return null;
  return <ApiKeyModalContent onClose={onClose} onKeyUpdated={onKeyUpdated} />;
}

function ApiKeyModalContent({
  onClose,
  onKeyUpdated,
}: Omit<ApiKeyModalProps, "isOpen">) {
  const [initialStored] = useState<BYOKStorageState>(() => loadBYOKState());
  const initialSpec =
    FALLBACK_PROVIDERS.find((p) => p.id === initialStored.activeProvider) ||
    FALLBACK_PROVIDERS[0];
  const initialProf = initialStored.profiles[initialStored.activeProvider];

  const [providers, setProviders] = useState<ProviderSpec[]>(FALLBACK_PROVIDERS);
  const [modeTab, setModeTab] = useState<"server_default" | "byok">(initialStored.mode);
  const [selectedProvider, setSelectedProvider] = useState<LLMProviderId>(
    initialStored.activeProvider
  );
  const [profiles, setProfiles] = useState<
    Partial<Record<LLMProviderId, StoredProviderProfile>>
  >(initialStored.profiles);

  const [keyInput, setKeyInput] = useState(initialProf?.apiKey || "");
  const [selectedModel, setSelectedModel] = useState<string>(
    initialProf?.selectedModel || initialSpec.default_model || SERVER_DEFAULT_MODEL
  );
  const [customModelId, setCustomModelId] = useState(initialProf?.customModelId || "");
  const [region, setRegion] = useState<"intl" | "cn">(
    initialProf?.region || (initialStored.activeProvider === "glm" ? "cn" : "intl")
  );

  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusResult, setStatusResult] = useState<KeyValidationResult | null>(null);
  const [quotaInfo, setQuotaInfo] = useState<{
    remaining: number;
    limit: number;
    status: "healthy" | "low";
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const hydrateProviderFields = (
    providerId: LLMProviderId,
    allProfiles: Partial<Record<LLMProviderId, StoredProviderProfile>>,
    catalog: ProviderSpec[]
  ) => {
    const spec =
      catalog.find((p) => p.id === providerId) ||
      FALLBACK_PROVIDERS.find((p) => p.id === providerId) ||
      FALLBACK_PROVIDERS[0];
    const prof = allProfiles[providerId];
    setKeyInput(prof?.apiKey || "");
    setSelectedModel(prof?.selectedModel || spec.default_model);
    setCustomModelId(prof?.customModelId || "");
    setRegion(prof?.region || (providerId === "glm" ? "cn" : "intl"));
    setShowKey(false);
    setErrorMsg(null);
  };

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      getProvidersCatalog().catch(() => null),
      validateKey().catch(() => null),
      getQuotaStatus().catch(() => null),
    ])
      .then(([catRes, valRes, qRes]) => {
        if (cancelled) return;
        if (catRes && catRes.providers?.length) {
          setProviders(catRes.providers);
          hydrateProviderFields(
            initialStored.activeProvider,
            initialStored.profiles,
            catRes.providers
          );
        }
        if (valRes) setStatusResult(valRes);
        if (qRes) setQuotaInfo(qRes);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [initialStored]);

  const currentSpec =
    providers.find((p) => p.id === selectedProvider) ||
    FALLBACK_PROVIDERS.find((p) => p.id === selectedProvider) ||
    FALLBACK_PROVIDERS[0];

  const handleSelectProvider = (providerId: LLMProviderId) => {
    // Keep unsaved edits in memory while switching provider pills
    const updatedProfiles: Partial<Record<LLMProviderId, StoredProviderProfile>> = {
      ...profiles,
      [selectedProvider]: {
        apiKey: keyInput,
        selectedModel,
        customModelId,
        region: currentSpec.has_regions ? region : undefined,
      },
    };
    setProfiles(updatedProfiles);
    setSelectedProvider(providerId);
    hydrateProviderFields(providerId, updatedProfiles, providers);
  };

  const handleActivateServerDefault = async () => {
    setLoading(true);
    setErrorMsg(null);
    const nextState: BYOKStorageState = {
      mode: "server_default",
      activeProvider: selectedProvider,
      profiles,
    };
    saveBYOKState(nextState);

    try {
      const res = await validateKey({ forceServerDefault: true });
      setStatusResult(res);
      if (onKeyUpdated) onKeyUpdated();
    } catch {
      // Non-fatal
    } finally {
      setLoading(false);
    }
  };

  const handleValidateAndSaveBYOK = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedKey = keyInput.trim();
    if (!trimmedKey) {
      setErrorMsg(`Please enter your ${currentSpec.name} API key.`);
      return;
    }

    const effectiveModel =
      selectedModel === CUSTOM_MODEL_SENTINEL
        ? customModelId.trim()
        : selectedModel.trim() || currentSpec.default_model;

    if (!effectiveModel) {
      setErrorMsg("Please enter a custom model ID or choose a preset model.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await validateKey({
        provider: selectedProvider,
        model: effectiveModel,
        apiKey: trimmedKey,
        region: currentSpec.has_regions ? region : undefined,
      });
      setStatusResult(res);

      if (res.valid) {
        const finalRegion = res.detected_region || (currentSpec.has_regions ? region : undefined);
        if (res.detected_region) {
          setRegion(res.detected_region);
        }
        const nextProfiles: Partial<Record<LLMProviderId, StoredProviderProfile>> = {
          ...profiles,
          [selectedProvider]: {
            apiKey: trimmedKey,
            selectedModel,
            customModelId: selectedModel === CUSTOM_MODEL_SENTINEL ? effectiveModel : customModelId,
            region: finalRegion,
          },
        };
        setProfiles(nextProfiles);

        const nextState: BYOKStorageState = {
          mode: "byok",
          activeProvider: selectedProvider,
          profiles: nextProfiles,
        };
        saveBYOKState(nextState);
        if (onKeyUpdated) onKeyUpdated();
      } else {
        setErrorMsg(res.message || `Could not verify ${currentSpec.short_name} key or model.`);
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Failed to reach key validation endpoint."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveProviderKey = async () => {
    const nextProfiles = { ...profiles };
    delete nextProfiles[selectedProvider];
    setProfiles(nextProfiles);
    setKeyInput("");
    setShowKey(false);
    setErrorMsg(null);

    const hasOtherKey = Object.values(nextProfiles).some((p) => p?.apiKey?.trim());
    const nextMode = hasOtherKey ? modeTab : "server_default";
    saveBYOKState({
      mode: nextMode === "byok" && !nextProfiles[selectedProvider] ? "server_default" : nextMode,
      activeProvider: selectedProvider,
      profiles: nextProfiles,
    });
    if (!hasOtherKey) {
      setModeTab("server_default");
    }

    setLoading(true);
    try {
      const res = await validateKey({ forceServerDefault: true });
      setStatusResult(res);
      if (onKeyUpdated) onKeyUpdated();
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    clearAllBYOKKeys();
    setProfiles({});
    setKeyInput("");
    setCustomModelId("");
    setModeTab("server_default");
    setErrorMsg(null);
    if (onKeyUpdated) onKeyUpdated();
    try {
      const res = await validateKey({ forceServerDefault: true });
      setStatusResult(res);
    } catch {
      // Ignore
    }
  };

  const savedState = loadBYOKState();
  const isByokCurrentlyActive =
    savedState.mode === "byok" &&
    !!savedState.profiles[savedState.activeProvider]?.apiKey?.trim();
  const savedKeysCount = Object.values(profiles).filter((p) => p?.apiKey?.trim()).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-parchment text-ink rounded-sm border border-brass/50 p-5 sm:p-7 shadow-2xl z-10 flex flex-col gap-5 paper-grain my-auto max-h-[92vh] overflow-y-auto">
        {/* Brass corner ticks */}
        <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-brass z-10 pointer-events-none" />
        <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-brass z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-brass z-10 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-brass z-10 pointer-events-none" />

        {/* Modal Header */}
        <div className="flex flex-col gap-1.5 border-b border-ink/15 pb-3.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-sm bg-brass/20 text-brass flex items-center justify-center border border-brass/40 shrink-0">
                <Key size={17} />
              </div>
              <div>
                <h3 className="font-display text-xl sm:text-2xl text-ink leading-tight">
                  AI Provider &amp; Model Settings
                </h3>
                <p className="font-body text-xs text-ink/65">
                  Use Ustaad&apos;s free default engine or bring your own API key to unlock multi-model routing.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-ink/60 hover:text-ink transition-colors p-1 rounded-sm hover:bg-ink/5 shrink-0 cursor-pointer"
              aria-label="Close settings"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-sm bg-ink/[0.06] border border-ink/15">
          <button
            type="button"
            onClick={() => {
              setModeTab("server_default");
              setErrorMsg(null);
            }}
            className={`py-2.5 px-3 rounded-sm font-mono text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              modeTab === "server_default"
                ? "bg-ink text-parchment shadow-sm border border-brass/50"
                : "text-ink/70 hover:text-ink"
            }`}
          >
            <ShieldCheck size={14} className="text-brass shrink-0" />
            <span>Free Server Default</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setModeTab("byok");
              setErrorMsg(null);
            }}
            className={`py-2.5 px-3 rounded-sm font-mono text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              modeTab === "byok"
                ? "bg-ink text-parchment shadow-sm border border-teal/60"
                : "text-ink/70 hover:text-ink"
            }`}
          >
            <Sparkles size={14} className="text-teal shrink-0" />
            <span>Bring Your Own Key (Multi-API)</span>
          </button>
        </div>

        {/* Active Live Status Banner */}
        {loading ? (
          <div className="flex items-center gap-2 p-3 bg-brass/10 border border-brass/30 rounded-sm text-xs font-mono text-ink">
            <Loader2 size={14} className="animate-spin text-brass shrink-0" />
            <span>Verifying provider &amp; model configuration...</span>
          </div>
        ) : isByokCurrentlyActive ? (
          <div className="flex items-center justify-between gap-2 p-3 rounded-sm bg-teal/10 border border-teal/40 text-teal text-xs font-body">
            <div className="flex items-start gap-2">
              <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block font-mono uppercase tracking-wider">
                  BYOK Active: {savedState.activeProvider.toUpperCase()} ·{" "}
                  {statusResult?.source === "user_key" && statusResult.model
                    ? statusResult.model
                    : savedState.profiles[savedState.activeProvider]?.selectedModel ===
                      CUSTOM_MODEL_SENTINEL
                    ? savedState.profiles[savedState.activeProvider]?.customModelId
                    : savedState.profiles[savedState.activeProvider]?.selectedModel}
                </span>
                <span className="text-ink/75 text-[11px]">
                  Private browser-only key active for all pipeline &amp; interview agents.
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2.5 p-3 rounded-sm bg-brass/15 border border-brass/40 text-ink text-xs font-body">
            <ShieldCheck size={16} className="shrink-0 mt-0.5 text-brass" />
            <div className="flex-1">
              <span className="font-semibold block font-mono uppercase tracking-wider text-ink">
                Server Default Active (Gemini 3.1 Flash Lite)
              </span>
              <span className="text-ink/75 text-[11px]">
                {quotaInfo?.status === "low"
                  ? "Shared daily free quota is running low — switch to BYOK for uninterrupted access."
                  : `Shared free tier healthy${
                      quotaInfo ? ` (${quotaInfo.remaining}/${quotaInfo.limit} daily sessions remaining)` : ""
                    }.`}
              </span>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-sm bg-critical-red/10 border-l-4 border-critical-red text-critical-red text-xs font-body flex items-start gap-2">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* TAB 1: SERVER DEFAULT VIEW (LOCKED) */}
        {modeTab === "server_default" ? (
          <div className="flex flex-col gap-4">
            <div className="p-4 rounded-sm border border-ink/15 bg-ink/[0.03] flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu size={14} className="text-brass" /> Default Engine Configuration
                </span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-sm bg-ink/10 text-ink/70 flex items-center gap-1">
                  <Lock size={10} /> Locked on Free Tier
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                <div className="p-3 rounded-sm bg-parchment border border-ink/15">
                  <span className="text-[10px] text-ink/50 uppercase block mb-0.5">Provider</span>
                  <span className="font-semibold text-ink">Google Gemini (Shared Key)</span>
                </div>
                <div className="p-3 rounded-sm bg-parchment border border-ink/15">
                  <span className="text-[10px] text-ink/50 uppercase block mb-0.5">Model</span>
                  <span className="font-semibold text-brass">{SERVER_DEFAULT_MODEL}</span>
                </div>
              </div>

              <p className="font-body text-xs text-ink/70 leading-relaxed">
                To keep Ustaad 100% free for every student, the shared server key is strictly locked to{" "}
                <code className="font-mono text-[11px] bg-ink/10 px-1 py-0.5 rounded-sm">
                  {SERVER_DEFAULT_MODEL}
                </code>
                . Want to use <strong>Claude, ChatGPT, DeepSeek, Qwen, GLM, Groq</strong>, or a{" "}
                <strong>custom model</strong>? Switch to the{" "}
                <button
                  type="button"
                  onClick={() => setModeTab("byok")}
                  className="text-teal font-semibold underline cursor-pointer"
                >
                  Bring Your Own Key
                </button>{" "}
                tab above.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              {savedKeysCount > 0 ? (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="w-full sm:w-auto px-3.5 py-2 rounded-sm border border-critical-red/30 text-critical-red hover:bg-critical-red/10 text-xs font-body font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 size={13} /> Clear Saved Browser Keys ({savedKeysCount})
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-sm text-ink/70 hover:text-ink text-xs font-body font-semibold cursor-pointer"
                >
                  Close
                </button>
                {isByokCurrentlyActive && (
                  <button
                    type="button"
                    onClick={handleActivateServerDefault}
                    disabled={loading}
                    className="px-5 py-2.5 rounded-sm bg-brass text-ink font-body font-semibold hover:bg-brass/90 text-xs shadow-md cursor-pointer disabled:opacity-50"
                  >
                    Switch Back to Server Default
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* TAB 2: MULTI-PROVIDER BYOK STUDIO */
          <form onSubmit={handleValidateAndSaveBYOK} className="flex flex-col gap-4">
            {/* Step 1: Select Provider */}
            <div className="flex flex-col gap-2">
              <label className="font-mono text-[11px] font-semibold text-ink/80 uppercase tracking-wider">
                1. Choose AI Provider
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {providers.map((prov) => {
                  const isSelected = prov.id === selectedProvider;
                  const hasSaved = !!profiles[prov.id]?.apiKey?.trim();
                  return (
                    <button
                      key={prov.id}
                      type="button"
                      onClick={() => handleSelectProvider(prov.id)}
                      className={`p-2.5 rounded-sm border text-left transition-all cursor-pointer flex flex-col gap-1 relative ${
                        isSelected
                          ? "border-brass bg-brass/15 shadow-sm"
                          : "border-ink/15 bg-ink/[0.02] hover:border-brass/50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-display text-sm font-semibold text-ink truncate">
                          {prov.short_name}
                        </span>
                        {hasSaved && (
                          <span
                            className="w-2 h-2 rounded-full bg-teal shrink-0"
                            title="Key saved on this browser"
                          />
                        )}
                      </div>
                      <span
                        className={`font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm self-start ${
                          prov.free_tier
                            ? "bg-teal/15 text-teal font-semibold"
                            : "bg-ink/10 text-ink/60"
                        }`}
                      >
                        {prov.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: API Key + Optional Region */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <label className="font-mono text-[11px] font-semibold text-ink/80 uppercase tracking-wider">
                  2. {currentSpec.name} API Key
                </label>
                <a
                  href={currentSpec.docs_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-teal hover:underline font-body inline-flex items-center gap-1"
                >
                  <span>Get {currentSpec.short_name} key</span>
                  <ExternalLink size={11} />
                </a>
              </div>

              <div className="relative flex items-center">
                <input
                  type={showKey ? "text" : "password"}
                  placeholder={currentSpec.key_placeholder}
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  className="w-full bg-transparent border-2 border-ink/20 rounded-sm py-2.5 pl-3 pr-10 font-mono text-xs text-ink focus:border-brass focus:outline-none transition-colors placeholder:text-ink/30"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2.5 text-ink/50 hover:text-ink transition-colors p-1 cursor-pointer"
                  title={showKey ? "Hide key" : "Show key"}
                >
                  {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {currentSpec.has_regions && (
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="font-mono text-[10px] text-ink/65 uppercase">
                    Endpoint Region:
                  </span>
                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    <button
                      type="button"
                      onClick={() => setRegion("intl")}
                      className={`px-2.5 py-1 rounded-sm border cursor-pointer ${
                        region === "intl"
                          ? "border-brass bg-brass/20 text-ink font-semibold"
                          : "border-ink/15 text-ink/60"
                      }`}
                    >
                      {selectedProvider === "glm" ? "Z.ai (Global)" : "International (DashScope-Intl)"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegion("cn")}
                      className={`px-2.5 py-1 rounded-sm border cursor-pointer ${
                        region === "cn"
                          ? "border-brass bg-brass/20 text-ink font-semibold"
                          : "border-ink/15 text-ink/60"
                      }`}
                    >
                      {selectedProvider === "glm" ? "BigModel.cn" : "China Mainland"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Model Selection (Preset + Custom) */}
            <div className="flex flex-col gap-2">
              <label className="font-mono text-[11px] font-semibold text-ink/80 uppercase tracking-wider">
                3. Select Model (or Enter Custom Model ID)
              </label>

              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-parchment border-2 border-ink/20 rounded-sm py-2.5 px-3 font-mono text-xs text-ink focus:border-brass focus:outline-none transition-colors cursor-pointer"
              >
                {currentSpec.preset_models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label} ({m.id}){m.tag ? ` — ${m.tag}` : ""}
                  </option>
                ))}
                <option value={CUSTOM_MODEL_SENTINEL}>
                  ✦ Custom Model ID (Enter any {currentSpec.short_name} model string)...
                </option>
              </select>

              {selectedModel === CUSTOM_MODEL_SENTINEL && (
                <div className="flex flex-col gap-1 pt-1">
                  <input
                    type="text"
                    placeholder={`e.g. ${currentSpec.default_model}`}
                    value={customModelId}
                    onChange={(e) => setCustomModelId(e.target.value)}
                    className="w-full bg-transparent border-2 border-brass/60 rounded-sm py-2 px-3 font-mono text-xs text-ink focus:border-brass focus:outline-none placeholder:text-ink/35"
                  />
                  <span className="font-body text-[11px] text-ink/60">
                    Enter the exact model identifier from {currentSpec.name}&apos;s API documentation.
                  </span>
                </div>
              )}
            </div>

            {/* Security Assurance */}
            <div className="p-2.5 bg-ink/5 border border-ink/10 rounded-sm flex items-start gap-2 text-[11px] font-body text-ink/70 leading-relaxed">
              <ShieldCheck size={14} className="shrink-0 mt-0.5 text-brass" />
              <span>
                <strong>Zero-Persistence Privacy:</strong> Keys live strictly in your browser&apos;s{" "}
                <code>localStorage</code> and travel over encrypted HTTPS headers. Never stored in Supabase or server logs.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              {profiles[selectedProvider]?.apiKey || keyInput.trim() ? (
                <button
                  type="button"
                  onClick={handleRemoveProviderKey}
                  disabled={loading}
                  className="w-full sm:w-auto px-3.5 py-2.5 rounded-sm border border-critical-red/30 text-critical-red hover:bg-critical-red/10 transition-colors text-xs font-body font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 size={13} /> Remove {currentSpec.short_name} Key
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-sm text-ink/70 hover:text-ink text-xs font-body font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-sm bg-brass text-ink font-body font-semibold hover:bg-brass/90 transition-colors text-xs shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : null}
                  <span>Validate &amp; Activate BYOK</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
