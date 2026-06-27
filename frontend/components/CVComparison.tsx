"use client";

import { useState } from "react";
import { FileText, Cpu, CheckCircle2, ChevronDown, ChevronUp, Sparkles, Code } from "lucide-react";

interface ComparisonItem {
  original: string;
  rewritten: string;
}

interface ProjectRewrite {
  name: string;
  original: string;
  rewritten: string;
}

interface CVComparisonProps {
  data: {
    rewritten_summary: string;
    rewritten_skills_section: string[];
    rewritten_experience_bullets: ComparisonItem[];
    rewritten_projects: ProjectRewrite[];
    keywords_added: string[];
    ats_score_estimate: number;
    improvement_tips: string[];
  } | null;
  originalSummary: string | null;
}

export default function CVComparison({ data, originalSummary }: CVComparisonProps) {
  const [showOriginal, setShowOriginal] = useState(false);

  if (!data) return null;

  const score = data.ats_score_estimate ?? 0;
  const scoreColor = score >= 80
    ? "text-emerald-600 dark:text-emerald-400"
    : score >= 60
    ? "text-amber-600 dark:text-amber-400"
    : "text-rose-600 dark:text-rose-400";
  const scoreBarColor = score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : "bg-rose-500";

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all duration-300">

      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800/80 flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" />
            ATS CV Optimization
          </h3>
          <span className={`text-2xl font-black ${scoreColor}`}>
            {score}<span className="text-xs font-semibold text-slate-400">/100</span>
          </span>
        </div>

        {/* ATS Score Bar */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">ATS Score</span>
          <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className={`${scoreBarColor} h-2 rounded-full transition-all duration-1000`}
              style={{ width: `${score}%` }}
            />
          </div>
          <span className={`text-xs font-bold whitespace-nowrap ${scoreColor}`}>
            {score >= 80 ? "Excellent" : score >= 60 ? "Good" : "Needs Work"}
          </span>
        </div>

        {/* Keywords Injected */}
        {data.keywords_added && data.keywords_added.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {data.keywords_added.map((kw, i) => (
              <span
                key={`${kw}-${i}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/20 text-[10px] text-indigo-600 dark:text-indigo-400 rounded-md font-bold border border-indigo-100/30 dark:border-indigo-900/30"
              >
                <Sparkles size={8} /> {kw}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="p-6 flex flex-col gap-6">

        {/* Professional Summary — Resume Style */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Professional Summary
            </h4>
            {originalSummary && (
              <button
                onClick={() => setShowOriginal(!showOriginal)}
                className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer transition-colors"
              >
                {showOriginal ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {showOriginal ? "Hide Original" : "Show Original"}
              </button>
            )}
          </div>

          {/* Rewritten summary — main display */}
          <div className="relative rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-gradient-to-br from-indigo-50/50 to-purple-50/20 dark:from-indigo-950/10 dark:to-purple-950/5 p-5 overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
              <Sparkles size={10} /> Ustaad Optimized
            </p>
            <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
              {data.rewritten_summary}
            </p>
          </div>

          {/* Original — collapsible */}
          {showOriginal && originalSummary && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/30 p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Original CV</p>
              <p className="text-xs text-slate-500 leading-relaxed line-clamp-8">
                {originalSummary}
              </p>
            </div>
          )}
        </div>

        {/* Skills Section */}
        {data.rewritten_skills_section && data.rewritten_skills_section.length > 0 && (
          <div className="flex flex-col gap-3">
            <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Code size={12} /> Optimized Skills Profile
            </h4>
            <div className="flex flex-wrap gap-2">
              {data.rewritten_skills_section.map((skill, i) => (
                <span
                  key={`skill-${i}-${skill}`}
                  className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 font-medium border border-slate-200/50 dark:border-slate-700/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:text-indigo-700 dark:hover:text-indigo-300 hover:border-indigo-200/50 dark:hover:border-indigo-800/50 transition-colors"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Project Rewrites */}
        {data.rewritten_projects && data.rewritten_projects.length > 0 && (
          <div className="flex flex-col gap-3">
            <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Project Description Enhancements
            </h4>
            <div className="flex flex-col gap-4">
              {data.rewritten_projects.map((proj, idx) => (
                <div key={idx} className="flex flex-col gap-2 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
                  {/* Project header */}
                  <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{proj.name}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
                    {/* Before */}
                    <div className="p-4">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Before</p>
                      <p className="text-xs text-slate-500 leading-relaxed">{proj.original}</p>
                    </div>
                    {/* After */}
                    <div className="p-4 bg-emerald-50/30 dark:bg-emerald-950/5">
                      <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <CheckCircle2 size={9} /> After — Strong Action Verbs & Metrics
                      </p>
                      <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">{proj.rewritten}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Improvement Tips */}
        {data.improvement_tips && data.improvement_tips.length > 0 && (
          <div className="border-t border-slate-100 dark:border-slate-800 pt-5">
            <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-500" /> Career OS Improvement Strategy
            </h4>
            <div className="grid grid-cols-1 gap-2.5">
              {data.improvement_tips.map((tip, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed"
                >
                  <CheckCircle2 size={13} className="text-indigo-500 shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
