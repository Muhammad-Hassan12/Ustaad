"use client";

import { useEffect, useRef } from "react";
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
  const circleRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    if (!data || !circleRef.current) return;
    const score = data.overall_readiness_score;
    const circumference = 251.2;
    const offset = circumference - (circumference * score) / 100;
    requestAnimationFrame(() => {
      if (circleRef.current) {
        circleRef.current.style.transition = "stroke-dashoffset 1.2s ease-out";
        circleRef.current.style.strokeDashoffset = String(offset);
      }
    });
  }, [data]);

  if (!data) return null;

  const score = data.overall_readiness_score;
  const strokeColor =
    score >= 75 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
  const scoreLabel =
    score >= 75 ? "Market Ready" : score >= 50 ? "Developing" : "Needs Work";
  const scoreLabelColor =
    score >= 75 ? "text-emerald-500" : score >= 50 ? "text-amber-500" : "text-rose-500";

  const circumference = 251.2;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col gap-6 transition-all duration-300">

      {/* Header with animated gauge */}
      <div className="flex flex-col sm:flex-row items-center gap-5 border-b border-slate-100 dark:border-slate-800 pb-6">
        {/* Circular gauge */}
        <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
          <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 96 96">
            {/* Background track */}
            <circle
              cx="48" cy="48" r="40"
              strokeWidth="8" fill="transparent"
              className="stroke-slate-100 dark:stroke-slate-800"
            />
            {/* Animated progress */}
            <circle
              ref={circleRef}
              cx="48" cy="48" r="40"
              strokeWidth="8" fill="transparent"
              stroke={strokeColor}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference} // start at 0, animates to target
            />
          </svg>
          <div className="text-center">
            <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{score}</span>
            <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">/ 100</p>
          </div>
        </div>

        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-500" /> Readiness Analysis
            </h3>
            <span className={`text-xs font-bold ${scoreLabelColor}`}>{scoreLabel}</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{data.summary}</p>
        </div>
      </div>

      {/* Critical Gaps */}
      {data.critical_gaps && data.critical_gaps.length > 0 && (
        <div>
          <h4 className="text-[10px] font-bold text-rose-500 dark:text-rose-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <AlertOctagon className="w-3.5 h-3.5" /> Critical Gaps — High Priority
          </h4>
          <div className="flex flex-col gap-2">
            {data.critical_gaps.map((gap, idx) => (
              <div
                key={`critical-${idx}`}
                className="flex items-start gap-3 p-3.5 rounded-xl border border-rose-100 dark:border-rose-950/20 bg-rose-50/30 dark:bg-rose-950/5"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                <div>
                  <strong className="text-xs text-rose-700 dark:text-rose-400">{gap.skill}</strong>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{gap.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Moderate Gaps */}
      {data.moderate_gaps && data.moderate_gaps.length > 0 && (
        <div>
          <h4 className="text-[10px] font-bold text-amber-500 dark:text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Moderate Gaps
          </h4>
          <div className="flex flex-col gap-2">
            {data.moderate_gaps.map((gap, idx) => (
              <div
                key={`moderate-${idx}`}
                className="flex items-start gap-3 p-3.5 rounded-xl border border-amber-100 dark:border-amber-950/20 bg-amber-50/30 dark:bg-amber-950/5"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <div>
                  <strong className="text-xs text-amber-700 dark:text-amber-400">{gap.skill}</strong>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{gap.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Portfolio & Certification Gaps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.portfolio_gaps && data.portfolio_gaps.length > 0 && (
          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30">
            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">Portfolio Gaps</h5>
            <ul className="flex flex-col gap-1.5">
              {data.portfolio_gaps.map((item, i) => (
                <li key={`portfolio-${i}`} className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
        {data.certification_gaps && data.certification_gaps.length > 0 && (
          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30">
            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">Certification Gaps</h5>
            <ul className="flex flex-col gap-1.5">
              {data.certification_gaps.map((item, i) => (
                <li key={`cert-${i}`} className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Strengths */}
      {data.strengths_to_highlight && data.strengths_to_highlight.length > 0 && (
        <div>
          <h4 className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Verified Strengths
          </h4>
          <div className="flex flex-wrap gap-2">
            {data.strengths_to_highlight.map((strength, i) => (
              <span
                key={`strength-${i}`}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100/30 dark:border-emerald-900/30 font-medium"
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
