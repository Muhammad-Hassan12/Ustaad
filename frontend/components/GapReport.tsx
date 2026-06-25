"use client";

import { Award, AlertOctagon, AlertTriangle, ShieldCheck, CheckCircle } from "lucide-react";

interface GapDetail {
  skill: string;
  priority: string;
  reason: string;
}

interface GapReportProps {
  data: {
    overall_readiness_score: number;
    critical_gaps: GapDetail[];
    moderate_gaps: GapDetail[];
    minor_gaps: GapDetail[];
    strengths_to_highlight: string[];
    portfolio_gaps?: string[];
    certification_gaps?: string[];
    summary: string;
  } | null;
}

export default function GapReport({ data }: GapReportProps) {
  if (!data) return null;

  const score = data.overall_readiness_score;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col gap-6 transition-all duration-300">
      <div className="flex flex-col md:flex-row items-center gap-6 border-b border-slate-100 dark:border-slate-800 pb-6">
        {/* Circular Progress Gauge */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          <svg className="absolute w-full h-full transform -rotate-90">
            <circle
              cx="48"
              cy="48"
              r="40"
              className="stroke-slate-100 dark:stroke-slate-800"
              strokeWidth="8"
              fill="transparent"
            />
            <circle
              cx="48"
              cy="48"
              r="40"
              className="stroke-indigo-500 transition-all duration-1000 ease-out"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={251.2}
              strokeDashoffset={251.2 - (251.2 * score) / 100}
            />
          </svg>
          <span className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
            {score}%
          </span>
        </div>

        <div className="flex-1 text-center md:text-left">
          <h3 className="text-lg font-semibold text-slate-950 dark:text-slate-100 flex items-center justify-center md:justify-start gap-2">
            <Award className="w-5 h-5 text-indigo-500" /> Readiness Analysis
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
            {data.summary}
          </p>
        </div>
      </div>

      {/* Critical Gaps */}
      {data.critical_gaps && data.critical_gaps.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-rose-500 dark:text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <AlertOctagon className="w-4 h-4" /> Critical Skill Gaps (High Priority)
          </h4>
          <div className="flex flex-col gap-2.5">
            {data.critical_gaps.map((gap, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-rose-100 dark:border-rose-950/20 bg-rose-50/20 dark:bg-rose-950/5 text-xs text-slate-700 dark:text-slate-300"
              >
                <strong className="text-rose-600 dark:text-rose-400 block mb-1">
                  {gap.skill}
                </strong>
                {gap.reason}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Moderate Gaps */}
      {data.moderate_gaps && data.moderate_gaps.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-amber-500 dark:text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" /> Moderate Skill Gaps
          </h4>
          <div className="flex flex-col gap-2.5">
            {data.moderate_gaps.map((gap, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-amber-100 dark:border-amber-950/20 bg-amber-50/20 dark:bg-amber-950/5 text-xs text-slate-700 dark:text-slate-300"
              >
                <strong className="text-amber-600 dark:text-amber-400 block mb-1">
                  {gap.skill}
                </strong>
                {gap.reason}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strengths */}
      {data.strengths_to_highlight && data.strengths_to_highlight.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Verified Strengths
          </h4>
          <div className="flex flex-wrap gap-2">
            {data.strengths_to_highlight.map((strength) => (
              <span
                key={strength}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100/20 dark:border-emerald-900/10 font-medium"
              >
                <CheckCircle size={10} className="text-emerald-500" /> {strength}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
