"use client";

import { useState, useEffect } from "react";
import { validateKey, KeyValidationResult, getQuotaStatus } from "@/lib/api";
import { X, Key, Eye, EyeOff, CheckCircle2, AlertCircle, ShieldCheck, Loader2, Trash2 } from "lucide-react";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyUpdated?: () => void;
}

export default function ApiKeyModal({ isOpen, onClose, onKeyUpdated }: ApiKeyModalProps) {
  const [keyInput, setKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusResult, setStatusResult] = useState<KeyValidationResult | null>(null);
  const [quotaStatus, setQuotaStatus] = useState<"healthy" | "low" | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && typeof window !== "undefined") {
      const storedKey = localStorage.getItem("gemini_api_key") || "";
      setKeyInput(storedKey);
      setShowKey(false);
      setErrorMsg(null);
      setStatusResult(null);
      setQuotaStatus(null);
      setLoading(true);
      Promise.all([
        validateKey().catch(() => null),
        getQuotaStatus().catch(() => null),
      ])
        .then(([keyRes, qRes]) => {
          if (keyRes) setStatusResult(keyRes);
          if (qRes && qRes.status) setQuotaStatus(qRes.status);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleValidateAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = keyInput.trim();

    if (!trimmed) {
      handleClearKey();
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await validateKey(trimmed);
      setStatusResult(res);

      if (res.valid) {
        localStorage.setItem("gemini_api_key", trimmed);
        if (onKeyUpdated) onKeyUpdated();
      } else {
        setErrorMsg(res.message || "Invalid Gemini API Key provided.");
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to connect to API key validation service.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearKey = async () => {
    setLoading(true);
    setErrorMsg(null);
    localStorage.removeItem("gemini_api_key");
    setKeyInput("");
    setShowKey(false);

    try {
      const res = await validateKey();
      setStatusResult(res);
      if (onKeyUpdated) onKeyUpdated();
    } catch (err) {
      console.error("Error validating fallback key:", err);
    } finally {
      setLoading(false);
    }
  };

  const isCustomKeyActive = statusResult?.valid && statusResult?.source === "user_key";
  const isServerDefaultActive = statusResult?.valid && statusResult?.source === "server_default";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      {/* Modal backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Content Card */}
      <div className="relative w-full max-w-lg bg-parchment text-ink rounded-sm border border-brass/50 p-6 sm:p-8 shadow-2xl z-10 flex flex-col gap-6 paper-grain">
        {/* Brass corner ticks */}
        <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-brass z-10 pointer-events-none" />
        <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-brass z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-brass z-10 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-brass z-10 pointer-events-none" />

        {/* Header */}
        <div className="flex flex-col gap-2 border-b border-ink/15 pb-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-sm bg-brass/20 text-brass flex items-center justify-center border border-brass/40 shrink-0">
                <Key size={18} />
              </div>
              <h3 className="font-display text-xl sm:text-2xl text-ink leading-tight">
                Gemini API Key Settings (BYOK)
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-ink/60 hover:text-ink transition-colors p-1 rounded-sm hover:bg-ink/5 shrink-0"
              aria-label="Close settings"
            >
              <X size={20} />
            </button>
          </div>

          <p className="font-body text-xs text-ink/70">
            Bring Your Own Key for unlimited private sessions.
          </p>
          <p className="font-body text-xs text-ink/60 leading-relaxed">
            Ustaad runs on a free-tier Gemini API by default, shared across all visitors with limited daily capacity. Adding your own free key gives you faster, uninterrupted access that&apos;s yours alone.
          </p>
        </div>

        {/* Status Banner */}
        {loading ? (
          <div className="flex items-center gap-2 p-3 bg-brass/10 border border-brass/30 rounded-sm text-xs font-mono text-ink">
            <Loader2 size={14} className="animate-spin text-brass" />
            <span>Validating Gemini API key...</span>
          </div>
        ) : isCustomKeyActive ? (
          <div className="flex items-start gap-2.5 p-3 rounded-sm bg-teal/10 border border-teal/40 text-teal text-xs font-body">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block font-mono uppercase tracking-wider">
                ✅ Custom Key Active ({statusResult?.model || "gemini-3.1-flash-lite"})
              </span>
              <span className="opacity-90">
                Your key will be used exclusively for your sessions on this browser.
              </span>
            </div>
          </div>
        ) : isServerDefaultActive ? (
          quotaStatus === "low" ? (
            <div className="flex items-start gap-2.5 p-3.5 rounded-sm bg-brass/20 border border-brass text-ink text-xs font-body">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-brass" />
              <div>
                <span className="font-semibold block font-mono uppercase tracking-wider text-brass">
                  ⚠️ Shared Quota Running Low
                </span>
                <span className="text-ink/90">
                  The server&apos;s shared free-tier quota resets daily and is near capacity. Add your own free key below for guaranteed access.
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 p-3 rounded-sm bg-brass/15 border border-brass/40 text-ink text-xs font-body">
              <ShieldCheck size={16} className="shrink-0 mt-0.5 text-brass" />
              <div>
                <span className="font-semibold block font-mono uppercase tracking-wider text-brass">
                  ⚡ Server Default Key Active
                </span>
                <span className="text-ink/80">
                  No custom key saved. Ustaad is using the shared server key.
                </span>
              </div>
            </div>
          )
        ) : statusResult?.valid === false ? (
          <div className="flex items-start gap-2.5 p-3 rounded-sm bg-critical-red/10 border border-critical-red/30 text-critical-red text-xs font-body">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block font-mono uppercase">
                ❌ Key Invalid or Unavailable
              </span>
              <span>{statusResult.message || "Please check your Gemini API Key."}</span>
            </div>
          </div>
        ) : null}

        {errorMsg && (
          <div className="p-3 rounded-sm bg-critical-red/10 border-l-4 border-critical-red text-critical-red text-xs font-body">
            {errorMsg}
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleValidateAndSave} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-xs font-semibold text-ink/80 uppercase tracking-wider flex justify-between items-center">
              <span>Google Gemini API Key</span>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-teal hover:underline font-normal normal-case"
              >
                Get a free key →
              </a>
            </label>

            {/* Masked Password Field with Eye Toggle */}
            <div className="relative flex items-center">
              <input
                type={showKey ? "text" : "password"}
                placeholder="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                className="w-full bg-transparent border-2 border-ink/20 rounded-sm py-2.5 pl-3 pr-10 font-mono text-xs text-ink focus:border-brass focus:outline-none transition-colors placeholder:text-ink/30"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 text-ink/50 hover:text-ink transition-colors p-1"
                title={showKey ? "Hide key" : "Show key"}
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Security Notice */}
          <div className="p-3 bg-ink/5 border border-ink/10 rounded-sm flex items-start gap-2 text-[11px] font-body text-ink/70 leading-relaxed">
            <ShieldCheck size={14} className="shrink-0 mt-0.5 text-brass" />
            <span>
              <strong>Security Assurance:</strong> Your key is stored solely in your browser&apos;s <code>localStorage</code> and passed in the encrypted HTTPS header <code>X-Gemini-API-Key</code>. It is <strong>never</strong> logged or saved to any database.
            </span>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            {keyInput.trim() || isCustomKeyActive ? (
              <button
                type="button"
                onClick={handleClearKey}
                disabled={loading}
                className="w-full sm:w-auto px-4 py-2.5 rounded-sm border border-critical-red/30 text-critical-red hover:bg-critical-red/10 transition-colors text-xs font-body font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 size={14} /> Remove Custom Key
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
                <span>Save & Validate</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
