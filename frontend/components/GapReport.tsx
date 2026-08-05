"use client";

import { Award, AlertOctagon, AlertTriangle, ShieldCheck, CheckCircle } from "lucide-react";
import AnimatedCounter from "./AnimatedCounter";

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
    <div className="bg-parchment text-ink rounded-sm border border-brass/30 p-8 relative flex flex-col gap-6 shadow-md card-hover paper-grain">
      {/* Ledger corner ticks */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-brass z-10 pointer-events-none" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-brass z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-brass z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-brass z-10 pointer-events-none" />

      {/* Header & Monospace Score */}
      <div className="flex flex-col sm:flex-row items-baseline justify-between border-b border-ink/15 pb-6 gap-4">
        <div>
          <h3 className="font-display text-2xl text-ink flex items-center gap-2.5">
            <Award className="w-5 h-5 text-brass" /> Readiness Analysis
          </h3>
          <p className="font-body text-xs text-ink/70 mt-1 max-w-xl leading-relaxed">
            {data.summary}
          </p>
        </div>

        {/* Large Monospace Score */}
        <div className="shrink-0 flex items-baseline gap-1">
          <AnimatedCounter value={score} className="font-mono text-5xl md:text-6xl font-bold text-brass" />
          <span className="font-mono text-xl text-ink/40">/100</span>
        </div>
      </div>

      {/* Critical Gaps */}
      {data.critical_gaps && data.critical_gaps.length > 0 && (
        <div className="flex flex-col gap-3">
          <h4 className="font-mono text-xs font-semibold text-critical-red uppercase tracking-wider flex items-center gap-1.5">
            <AlertOctagon className="w-4 h-4" /> Critical Gaps — High Priority
          </h4>
          <div className="space-y-2.5">
            {data.critical_gaps.map((gap, idx) => (
              <div
                key={`critical-${idx}`}
                className="border-l-2 border-critical-red pl-4 py-1 flex flex-col gap-0.5"
              >
                <span className="font-body text-sm font-semibold text-ink">{gap.skill}</span>
                <span className="font-body text-xs text-ink/70">{gap.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Moderate Gaps */}
      {data.moderate_gaps && data.moderate_gaps.length > 0 && (
        <div className="flex flex-col gap-3">
          <h4 className="font-mono text-xs font-semibold text-brass uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" /> Moderate Gaps
          </h4>
          <div className="space-y-2.5">
            {data.moderate_gaps.map((gap, idx) => (
              <div
                key={`moderate-${idx}`}
                className="border-l-2 border-brass pl-4 py-1 flex flex-col gap-0.5"
              >
                <span className="font-body text-sm font-semibold text-ink">{gap.skill}</span>
                <span className="font-body text-xs text-ink/70">{gap.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Portfolio & Certification Gaps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.portfolio_gaps && data.portfolio_gaps.length > 0 && (
          <div className="p-4 rounded-sm border border-ink/10 bg-ink/[0.03]">
            <h5 className="font-mono text-xs font-semibold text-ink/60 uppercase tracking-wider mb-2">
              Portfolio Gaps
            </h5>
            <ul className="space-y-1.5">
              {data.portfolio_gaps.map((item, i) => (
                <li key={`portfolio-${i}`} className="font-body text-xs text-ink/80 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brass shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.certification_gaps && data.certification_gaps.length > 0 && (
          <div className="p-4 rounded-sm border border-ink/10 bg-ink/[0.03]">
            <h5 className="font-mono text-xs font-semibold text-ink/60 uppercase tracking-wider mb-2">
              Certification Gaps
            </h5>
            <ul className="space-y-1.5">
              {data.certification_gaps.map((item, i) => (
                <li key={`cert-${i}`} className="font-body text-xs text-ink/80 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Verified Strengths */}
      {data.strengths_to_highlight && data.strengths_to_highlight.length > 0 && (
        <div className="border-t border-ink/15 pt-5">
          <h4 className="font-mono text-xs font-semibold text-teal uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Verified Strengths
          </h4>
          <div className="flex flex-wrap gap-2">
            {data.strengths_to_highlight.map((strength, i) => (
              <span
                key={`strength-${i}`}
                className="font-body text-xs bg-teal/15 text-teal border border-teal/40 px-3 py-1 rounded-sm flex items-center gap-1.5 font-medium"
              >
                <CheckCircle size={12} /> {strength}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
