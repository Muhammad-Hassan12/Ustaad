"use client";

import { Check, Loader2, Circle, AlertCircle } from "lucide-react";

interface PipelineProgressProps {
  completedAgents: string[];
  currentAgent: string | null;
  status: "pending" | "running" | "complete" | "error";
  errorMessage: string | null;
}

const steps = [
  { id: "profile",    label: "CV Profile Agent",         desc: "Parsing resume information",                 color: "text-violet-500",  bg: "bg-violet-500" },
  { id: "market",     label: "Market Intelligence Agent", desc: "Searching live Pakistani job listings",       color: "text-blue-500",    bg: "bg-blue-500" },
  { id: "gap",        label: "Gap Analysis Agent",        desc: "Evaluating skill gaps vs market",             color: "text-amber-500",   bg: "bg-amber-500" },
  { id: "roadmap",    label: "Roadmap Agent",             desc: "Structuring 30/60/90 learning path",         color: "text-indigo-500",  bg: "bg-indigo-500" },
  { id: "cv_rewrite", label: "CV Rewrite Agent",          desc: "ATS optimization & keyword placement",       color: "text-emerald-500", bg: "bg-emerald-500" },
];

export default function PipelineProgress({
  completedAgents,
  currentAgent,
  status,
  errorMessage,
}: PipelineProgressProps) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Pipeline Orchestration
        </h3>
        {status === "complete" && (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-100/30 dark:border-emerald-900/30">
            Done
          </span>
        )}
        {status === "running" && (
          <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider border border-indigo-100/30 dark:border-indigo-900/30 animate-pulse">
            Running
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 mb-6 overflow-hidden">
        <div
          className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-1 rounded-full transition-all duration-700"
          style={{ width: `${(completedAgents.length / steps.length) * 100}%` }}
        />
      </div>

      <div className="flex flex-col gap-5 relative">
        {/* Vertical connecting line */}
        <div className="absolute top-4 left-[15px] bottom-4 w-[1px] bg-slate-100 dark:bg-slate-800 -z-0" />

        {steps.map((step, index) => {
          const isCompleted = completedAgents.includes(step.id);
          const isCurrent = currentAgent === step.id && status === "running";
          const isPending = !isCompleted && !isCurrent;

          return (
            <div
              key={step.id}
              className="flex gap-3.5 items-start z-10"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              {/* Step icon */}
              <div className="shrink-0 flex items-center justify-center">
                {isCompleted ? (
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                    <Check size={14} strokeWidth={3} />
                  </div>
                ) : isCurrent ? (
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/30">
                    {/* Bug fix: animate the icon, not the container */}
                    <Loader2 size={14} className="animate-spin-icon" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                    <Circle size={8} className="text-slate-300 dark:text-slate-600 fill-current" />
                  </div>
                )}
              </div>

              {/* Step info */}
              <div className="flex-1 min-w-0 pt-0.5">
                <p className={`text-xs font-bold transition-colors duration-300 truncate ${
                  isCompleted
                    ? "text-slate-800 dark:text-slate-200"
                    : isCurrent
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-slate-400 dark:text-slate-600"
                }`}>
                  <span className="text-[10px] font-semibold opacity-60 mr-1">A{index + 1}:</span>
                  {step.label}
                </p>
                <p className={`text-[10px] mt-0.5 transition-colors duration-300 ${
                  isCurrent
                    ? "text-indigo-500 dark:text-indigo-500 font-medium"
                    : isCompleted
                    ? "text-emerald-500 dark:text-emerald-500 font-medium"
                    : "text-slate-400 dark:text-slate-600"
                }`}>
                  {isCurrent ? "Analyzing..." : isCompleted ? "✓ Completed" : step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {status === "error" && errorMessage && (
        <div className="mt-5 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-xs text-rose-600 dark:text-rose-400 leading-relaxed">
          <div className="flex items-center gap-1.5 font-bold mb-1">
            <AlertCircle size={12} /> Pipeline Exception
          </div>
          <span className="font-mono text-[10px] break-all opacity-80">{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
