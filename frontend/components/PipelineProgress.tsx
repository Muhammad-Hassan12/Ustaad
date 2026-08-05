"use client";

import LedgerLine, { LedgerCheckpoint } from "./LedgerLine";
import { AlertCircle } from "lucide-react";

interface PipelineProgressProps {
  completedAgents: string[];
  currentAgent: string | null;
  status: "pending" | "running" | "complete" | "error";
  errorMessage: string | null;
}

const AGENTS = [
  { key: "profile", label: "Profile" },
  { key: "market", label: "Market Intelligence" },
  { key: "gap", label: "Gap Analysis" },
  { key: "roadmap", label: "Roadmap" },
  { key: "cv_rewrite", label: "CV Rewrite" },
];

export default function PipelineProgress({
  completedAgents,
  currentAgent,
  status,
  errorMessage,
}: PipelineProgressProps) {
  const checkpoints: LedgerCheckpoint[] = AGENTS.map((agent) => {
    const isCompleted = completedAgents.includes(agent.key);
    const isActive = currentAgent === agent.key && status === "running";
    return {
      label: agent.label,
      status: isCompleted ? "complete" : isActive ? "active" : "pending",
    };
  });

  return (
    <div className="bg-ink border border-brass/30 rounded-sm p-6 relative flex flex-col gap-6">
      {/* Ledger corner ticks */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-brass z-10 pointer-events-none" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-brass z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-brass z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-brass z-10 pointer-events-none" />

      <div className="flex items-center justify-between border-b border-warm-gray/15 pb-4">
        <div>
          <h3 className="font-display text-xl text-parchment">Pipeline Orchestration</h3>
          <p className="font-body text-xs text-warm-gray mt-0.5">
            Real-time agentic execution ledger
          </p>
        </div>
        {status === "complete" && (
          <span className="font-mono text-xs text-brass border border-brass/40 px-3 py-1 rounded-sm bg-brass/10">
            ✓ Complete
          </span>
        )}
        {status === "running" && (
          <span className="font-mono text-xs text-teal border border-teal/40 px-3 py-1 rounded-sm bg-teal/10 animate-pulse">
            Analyzing...
          </span>
        )}
      </div>

      {/* LedgerLine Stepper */}
      <div className="py-2">
        <LedgerLine orientation="horizontal" checkpoints={checkpoints} />
      </div>

      {status === "error" && errorMessage && (
        <div className="p-4 rounded-sm bg-critical-red/10 border-l-4 border-critical-red text-critical-red text-xs">
          <div className="flex items-center gap-2 font-bold mb-1">
            <AlertCircle size={14} /> Pipeline Exception
          </div>
          <span className="font-mono text-[11px] break-all opacity-90">{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
