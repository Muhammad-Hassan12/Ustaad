"use client";

import { Check, Loader, Circle } from "lucide-react";

interface PipelineProgressProps {
  completedAgents: string[];
  currentAgent: string | null;
  status: "pending" | "running" | "complete" | "error";
  errorMessage: string | null;
}

export default function PipelineProgress({
  completedAgents,
  currentAgent,
  status,
  errorMessage,
}: PipelineProgressProps) {
  const steps = [
    { id: "profile", label: "A1: CV Profile Agent", desc: "Parsing resume information" },
    { id: "market", label: "A2: Market Intelligence Agent", desc: "Searching Pakistani tech listings" },
    { id: "gap", label: "A3: Gap Analysis Agent", desc: "Evaluating skill gaps against market" },
    { id: "roadmap", label: "A4: Roadmap Agent", desc: "Structuring 30/60/90 learning path" },
    { id: "cv_rewrite", label: "A5: CV Rewrite Agent", desc: "ATS optimization and keyword placement" },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">
        Pipeline Orchestration
      </h3>

      <div className="flex flex-col gap-6 relative">
        {/* Draw vertical connecting line */}
        <div className="absolute top-3 left-4 bottom-3 w-[2px] bg-slate-200 dark:bg-slate-800 -z-10" />

        {steps.map((step, index) => {
          const isCompleted = completedAgents.includes(step.id);
          const isCurrent = currentAgent === step.id && status === "running";
          const isPending = !isCompleted && !isCurrent;

          return (
            <div key={step.id} className="flex gap-4 items-start">
              <div className="flex items-center justify-center">
                {isCompleted ? (
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                    <Check size={16} />
                  </div>
                ) : isCurrent ? (
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center animate-spin shadow-sm">
                    <Loader size={16} />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 flex items-center justify-center border border-slate-200 dark:border-slate-800">
                    <Circle size={12} fill="currentColor" className="opacity-40" />
                  </div>
                )}
              </div>
              <div>
                <p
                  className={`text-sm font-semibold transition-colors duration-300 ${
                    isCompleted
                      ? "text-slate-800 dark:text-slate-200"
                      : isCurrent
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-slate-400 dark:text-slate-600"
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
                  {isCurrent ? "Analyzing..." : isCompleted ? "Completed" : step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {status === "error" && errorMessage && (
        <div className="mt-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-xs text-rose-600 dark:text-rose-400 leading-relaxed font-mono">
          <strong>Pipeline Exception:</strong> {errorMessage}
        </div>
      )}
    </div>
  );
}
