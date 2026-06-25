"use client";

import { FileText, Cpu, CheckCircle2, ChevronRight } from "lucide-react";

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
  if (!data) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col gap-6 transition-all duration-300">
      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-500" /> ATS CV Optimization
        </h3>
        
        {/* ATS Score Indicator */}
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-100/20">
          Est. ATS Score: {data.ats_score_estimate}/100
        </span>
      </div>

      {/* Side by Side Summary */}
      <div className="flex flex-col gap-3">
        <h4 className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">
          Professional Summary Optimization
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-xs text-slate-500 leading-relaxed">
            <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
              Original CV
            </span>
            {originalSummary || "No original summary found."}
          </div>
          <div className="p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/10 dark:bg-indigo-950/5 text-xs text-slate-850 dark:text-slate-350 leading-relaxed relative overflow-hidden">
            {/* Background highlight */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
            <span className="font-bold text-[10px] text-indigo-500 uppercase tracking-wider block mb-1">
              Ustaad Optimized Rewrite
            </span>
            {data.rewritten_summary}
          </div>
        </div>
      </div>

      {/* Project Bullets Comparison */}
      {data.rewritten_projects && data.rewritten_projects.length > 0 && (
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">
            Project Description Enhancements
          </h4>
          <div className="flex flex-col gap-4">
            {data.rewritten_projects.map((proj, idx) => (
              <div key={idx} className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {proj.name}
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-xs text-slate-500 leading-relaxed">
                    {proj.original}
                  </div>
                  <div className="p-3.5 rounded-xl border border-emerald-100 dark:border-emerald-950/40 bg-emerald-50/5 dark:bg-emerald-950/5 text-xs text-slate-850 dark:text-slate-350 leading-relaxed">
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider block mb-1">
                      Strong Action Verbs &amp; Metrics Added
                    </span>
                    {proj.rewritten}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Keywords Added */}
      {data.keywords_added && data.keywords_added.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider mb-2.5">
            Target Keywords Injected
          </h4>
          <div className="flex flex-wrap gap-2">
            {data.keywords_added.map((kw) => (
              <span
                key={kw}
                className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-650 dark:text-slate-400 rounded-md font-semibold border border-slate-200/10"
              >
                + {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* CV Improvement Tips */}
      {data.improvement_tips && data.improvement_tips.length > 0 && (
        <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
          <h4 className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-indigo-500" /> Career OS Improvement Strategy
          </h4>
          <div className="grid grid-cols-1 gap-2.5">
            {data.improvement_tips.map((tip, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-350 leading-relaxed"
              >
                <CheckCircle2 size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
