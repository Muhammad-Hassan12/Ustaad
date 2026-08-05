"use client";

import { useState } from "react";
import { FileText, Cpu, CheckCircle2, ChevronDown, ChevronUp, Sparkles, Code } from "lucide-react";
import AnimatedCounter from "./AnimatedCounter";

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

  return (
    <div className="bg-parchment text-ink rounded-sm border border-brass/30 p-8 relative flex flex-col gap-6 shadow-md card-hover paper-grain">
      {/* Ledger corner ticks */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-brass z-10 pointer-events-none" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-brass z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-brass z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-brass z-10 pointer-events-none" />

      {/* Header & ATS Score */}
      <div className="flex flex-col sm:flex-row items-baseline justify-between border-b border-ink/15 pb-6 gap-4">
        <div>
          <h3 className="font-display text-2xl text-ink flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-brass" /> ATS CV Optimization
          </h3>
          <p className="font-body text-xs text-ink/70 mt-1">
            Keyword placement & high-impact metric rewrites
          </p>
        </div>

        {/* ATS Score Numeral */}
        <div className="shrink-0 flex items-baseline gap-1">
          <AnimatedCounter value={score} className="font-mono text-5xl md:text-6xl font-bold text-brass" />
          <span className="font-mono text-xl text-ink/40">/100</span>
          <span className="font-mono text-xs text-ink/60 block ml-2">ATS Score</span>
        </div>
      </div>

      {/* Keywords Added */}
      {data.keywords_added && data.keywords_added.length > 0 && (
        <div>
          <h4 className="font-mono text-xs font-semibold text-ink/60 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Sparkles size={12} className="text-brass" /> Injected Keywords
          </h4>
          <div className="flex flex-wrap gap-2">
            {data.keywords_added.map((kw, i) => (
              <span
                key={`${kw}-${i}`}
                className="font-body text-xs bg-brass/15 text-ink border border-brass/40 px-3 py-1 rounded-sm font-medium"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Professional Summary Comparison */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h4 className="font-mono text-xs font-semibold text-ink/60 uppercase tracking-wider">
            Professional Summary
          </h4>
          {originalSummary && (
            <button
              onClick={() => setShowOriginal(!showOriginal)}
              className="font-body text-xs text-brass hover:underline flex items-center gap-1 cursor-pointer"
            >
              {showOriginal ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {showOriginal ? "Hide Original" : "Show Original"}
            </button>
          )}
        </div>

        {/* Rewritten Summary */}
        <div className="border-l-2 border-brass pl-6 py-1">
          <p className="font-mono text-xs text-brass uppercase font-semibold mb-1">
            Ustaad Rewritten
          </p>
          <p className="font-body text-sm text-ink leading-relaxed">
            {data.rewritten_summary}
          </p>
        </div>

        {/* Original Summary */}
        {showOriginal && originalSummary && (
          <div className="opacity-60 pl-6 border-l-2 border-ink/20 py-1">
            <p className="font-mono text-xs text-ink/60 uppercase font-semibold mb-1">Original Summary</p>
            <p className="font-body text-xs text-ink/70 leading-relaxed">{originalSummary}</p>
          </div>
        )}
      </div>

      {/* Optimized Skills Section */}
      {data.rewritten_skills_section && data.rewritten_skills_section.length > 0 && (
        <div>
          <h4 className="font-mono text-xs font-semibold text-ink/60 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Code size={12} className="text-teal" /> Optimized Skills Profile
          </h4>
          <div className="flex flex-wrap gap-2">
            {data.rewritten_skills_section.map((skill, i) => (
              <span
                key={`skill-${i}-${skill}`}
                className="font-body text-xs bg-ink/5 border border-ink/15 text-ink px-3 py-1 rounded-sm"
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
          <h4 className="font-mono text-xs font-semibold text-ink/60 uppercase tracking-wider">
            Project Description Enhancements
          </h4>
          <div className="flex flex-col gap-4">
            {data.rewritten_projects.map((proj, idx) => (
              <div key={idx} className="border border-ink/15 rounded-sm p-4 bg-ink/[0.02] flex flex-col gap-3">
                <span className="font-display text-base font-semibold text-ink">{proj.name}</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="opacity-50">
                    <p className="font-mono text-[11px] text-ink/60 uppercase mb-1">Original</p>
                    <p className="font-body text-xs text-ink/70">{proj.original}</p>
                  </div>
                  <div className="border-l-2 border-brass pl-4">
                    <p className="font-mono text-[11px] text-brass uppercase font-semibold mb-1 flex items-center gap-1">
                      <CheckCircle2 size={11} /> Rewritten
                    </p>
                    <p className="font-body text-xs text-ink">{proj.rewritten}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Improvement Tips */}
      {data.improvement_tips && data.improvement_tips.length > 0 && (
        <div className="border-t border-ink/15 pt-5">
          <h4 className="font-mono text-xs font-semibold text-teal uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-teal" /> Career OS Strategy Tips
          </h4>
          <div className="space-y-2">
            {data.improvement_tips.map((tip, idx) => (
              <div key={idx} className="font-body text-xs text-ink/80 flex items-start gap-2">
                <CheckCircle2 size={14} className="text-teal shrink-0 mt-0.5" />
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
