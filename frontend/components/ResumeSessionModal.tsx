"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, History, ArrowRight, Clock, Trash2 } from "lucide-react";

interface RecentSession {
  id: string;
  role: string;
  city: string;
  timestamp: number;
}

interface ResumeSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function readStoredRecentSessions(): RecentSession[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("ustaad_recent_sessions");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed as RecentSession[];
    }
  } catch (err) {
    console.error("Failed to parse recent sessions:", err);
  }
  return [];
}

export default function ResumeSessionModal({ isOpen, onClose }: ResumeSessionModalProps) {
  if (!isOpen) return null;
  return <ResumeSessionModalContent onClose={onClose} />;
}

function ResumeSessionModalContent({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [sessionIdInput, setSessionIdInput] = useState("");
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>(readStoredRecentSessions);
  const [now] = useState(() => Date.now());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLoadSession = (e?: React.FormEvent, targetId?: string) => {
    if (e) e.preventDefault();
    const idToLoad = (targetId || sessionIdInput).trim();

    if (!idToLoad) {
      setErrorMsg("Please enter or paste a valid Session ID.");
      return;
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(idToLoad)) {
      setErrorMsg("Invalid Session ID format. Session IDs look like: 9b1deb4d-3b7d-4b69-9672-2e1609870123");
      return;
    }

    onClose();
    router.push(`/dashboard/${idToLoad}`);
  };

  const handleClearHistory = () => {
    localStorage.removeItem("ustaad_recent_sessions");
    setRecentSessions([]);
  };

  const formatRelativeTime = (timestamp: number) => {
    const diff = Math.floor((now - timestamp) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Content Card */}
      <div className="relative w-full max-w-lg bg-parchment text-ink rounded-sm border border-brass/50 p-6 sm:p-8 shadow-2xl z-10 flex flex-col gap-6 paper-grain">
        {/* Brass corner ticks */}
        <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-brass z-10 pointer-events-none" />
        <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-brass z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-brass z-10 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-brass z-10 pointer-events-none" />

        {/* Header */}
        <div className="flex flex-col gap-1.5 border-b border-ink/15 pb-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-sm bg-brass/20 text-brass flex items-center justify-center border border-brass/40 shrink-0">
                <History size={18} />
              </div>
              <h3 className="font-display text-xl sm:text-2xl text-ink leading-tight">
                Resume Past Session
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-ink/60 hover:text-ink transition-colors p-1 rounded-sm hover:bg-ink/5 shrink-0"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
          <p className="font-body text-xs text-ink/70">
            Paste a saved Session ID or select from your recent analyses to pick up right where you left off.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-sm bg-critical-red/10 border-l-4 border-critical-red text-critical-red text-xs font-body">
            {errorMsg}
          </div>
        )}

        {/* Paste Session ID Form */}
        <form onSubmit={handleLoadSession} className="flex flex-col gap-3">
          <label className="font-mono text-xs font-semibold text-ink/80 uppercase tracking-wider">
            Enter Session ID
          </label>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="e.g. 9b1deb4d-3b7d-4b69-9672-2e1609870123"
                value={sessionIdInput}
                onChange={(e) => {
                  setSessionIdInput(e.target.value);
                  setErrorMsg(null);
                }}
                className="w-full bg-transparent border-2 border-ink/20 rounded-sm py-2.5 pl-3 pr-3 font-mono text-xs text-ink focus:border-brass focus:outline-none transition-colors placeholder:text-ink/30"
              />
            </div>
            <button
              type="submit"
              disabled={!sessionIdInput.trim()}
              className="px-5 py-2.5 rounded-sm bg-brass text-ink font-body font-semibold hover:bg-brass/90 transition-colors text-xs shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shrink-0"
            >
              <span>Load</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </form>

        {/* Recent Sessions List */}
        {recentSessions.length > 0 && (
          <div className="border-t border-ink/15 pt-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold text-ink/80 uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={13} className="text-brass" /> Recent Sessions on This Browser
              </span>
              <button
                type="button"
                onClick={handleClearHistory}
                className="text-[11px] font-mono text-critical-red hover:underline flex items-center gap-1"
              >
                <Trash2 size={11} /> Clear
              </button>
            </div>

            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
              {recentSessions.map((session) => (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => handleLoadSession(undefined, session.id)}
                  className="w-full p-3 rounded-sm border border-ink/15 bg-ink/[0.03] hover:bg-brass/10 hover:border-brass/40 text-left flex items-center justify-between transition-colors group cursor-pointer"
                >
                  <div className="flex flex-col gap-0.5 min-w-0 pr-2">
                    <span className="font-display text-sm text-ink group-hover:text-brass truncate">
                      {session.role || "Career Analysis"}
                    </span>
                    <span className="font-mono text-[11px] text-ink/60 flex items-center gap-2">
                      <span>{session.city || "Pakistan"}</span>
                      <span>·</span>
                      <span>{formatRelativeTime(session.timestamp)}</span>
                    </span>
                  </div>
                  <span className="font-mono text-xs text-brass group-hover:translate-x-0.5 transition-transform shrink-0">
                    Load →
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
