"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Cpu,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Code,
  Copy,
  Check,
  Briefcase,
  Printer,
  Send,
} from "lucide-react";
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
    linkedin_referral_note?: string | null;
    cover_letter_pitch?: string | null;
  } | null;
  originalSummary: string | null;
  sessionId?: string;
}

export default function CVComparison({
  data,
  originalSummary,
  sessionId,
}: CVComparisonProps) {
  const [showOriginal, setShowOriginal] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!data) return null;

  const score = data.ats_score_estimate ?? 0;

  const handleCopy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev));
      }, 1800);
    } catch {
      // Fallback ignored silently
    }
  };

  return (
    <div className="bg-parchment text-ink rounded-sm border border-brass/30 p-8 relative flex flex-col gap-6 shadow-md card-hover paper-grain">
      {/* Ledger corner ticks */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-brass z-10 pointer-events-none" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-brass z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-brass z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-brass z-10 pointer-events-none" />

      {/* Header & ATS Score */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-ink/15 pb-6 gap-4">
        <div>
          <h3 className="font-display text-2xl text-ink flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-brass" /> ATS CV Optimization
          </h3>
          <p className="font-body text-xs text-ink/70 mt-1">
            Keyword placement, quantified bullet rewrites & printable single-column ATS export
          </p>
          {sessionId && (
            <Link
              href={`/resume/${sessionId}`}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-ink text-parchment hover:bg-ink/90 border border-brass/40 font-mono text-xs font-semibold transition-colors shadow-sm"
            >
              <Printer size={13} className="text-brass" />
              <span>Open Printable ATS Resume (PDF / .md) →</span>
            </Link>
          )}
        </div>

        {/* ATS Score Numeral */}
        <div className="shrink-0 flex items-baseline gap-1">
          <AnimatedCounter
            value={score}
            className="font-mono text-5xl md:text-6xl font-bold text-brass"
          />
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="font-mono text-xs font-semibold text-ink/60 uppercase tracking-wider">
            Professional Summary
          </h4>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleCopy("summary", data.rewritten_summary)}
              className="font-mono text-[11px] text-ink/70 hover:text-brass flex items-center gap-1 cursor-pointer"
            >
              {copiedKey === "summary" ? (
                <>
                  <Check size={12} className="text-teal" />
                  <span className="text-teal">Copied</span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  <span>Copy Summary</span>
                </>
              )}
            </button>
            {originalSummary && (
              <button
                type="button"
                onClick={() => setShowOriginal(!showOriginal)}
                className="font-body text-xs text-brass hover:underline flex items-center gap-1 cursor-pointer"
              >
                {showOriginal ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {showOriginal ? "Hide Original" : "Show Original"}
              </button>
            )}
          </div>
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
            <p className="font-mono text-xs text-ink/60 uppercase font-semibold mb-1">
              Original Summary
            </p>
            <p className="font-body text-xs text-ink/70 leading-relaxed">{originalSummary}</p>
          </div>
        )}
      </div>

      {/* Optimized Skills Section */}
      {data.rewritten_skills_section && data.rewritten_skills_section.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="font-mono text-xs font-semibold text-ink/60 uppercase tracking-wider flex items-center gap-1.5">
              <Code size={12} className="text-teal" /> Optimized Skills Profile
            </h4>
            <button
              type="button"
              onClick={() =>
                handleCopy("skills", data.rewritten_skills_section.join(", "))
              }
              className="font-mono text-[11px] text-ink/70 hover:text-brass flex items-center gap-1 cursor-pointer"
            >
              {copiedKey === "skills" ? (
                <>
                  <Check size={12} className="text-teal" />
                  <span className="text-teal">Copied</span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  <span>Copy Skills</span>
                </>
              )}
            </button>
          </div>
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

      {/* Experience Bullet Rewrites */}
      {data.rewritten_experience_bullets &&
        data.rewritten_experience_bullets.length > 0 && (
          <div className="flex flex-col gap-3">
            <h4 className="font-mono text-xs font-semibold text-ink/60 uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase size={12} className="text-brass" /> Experience & Impact Bullet Rewrites
            </h4>
            <div className="flex flex-col gap-3">
              {data.rewritten_experience_bullets.map((bullet, idx) => (
                <div
                  key={`exp-bullet-${idx}`}
                  className="border border-ink/15 rounded-sm p-4 bg-ink/[0.02] flex flex-col gap-2.5"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="opacity-55">
                      <p className="font-mono text-[11px] text-ink/60 uppercase mb-1">
                        Original Bullet
                      </p>
                      <p className="font-body text-xs text-ink/75">{bullet.original}</p>
                    </div>
                    <div className="border-l-2 border-brass pl-4 flex flex-col justify-between gap-2">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="font-mono text-[11px] text-brass uppercase font-semibold flex items-center gap-1">
                            <CheckCircle2 size={11} /> ATS Rewritten
                          </p>
                          <button
                            type="button"
                            onClick={() => handleCopy(`exp-${idx}`, bullet.rewritten)}
                            className="font-mono text-[10px] text-ink/60 hover:text-brass flex items-center gap-1 cursor-pointer"
                          >
                            {copiedKey === `exp-${idx}` ? (
                              <>
                                <Check size={11} className="text-teal" />
                                <span className="text-teal">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy size={11} />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                        <p className="font-body text-xs text-ink leading-relaxed">
                          {bullet.rewritten}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
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
              <div
                key={`proj-rw-${idx}`}
                className="border border-ink/15 rounded-sm p-4 bg-ink/[0.02] flex flex-col gap-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-base font-semibold text-ink">
                    {proj.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(`proj-${idx}`, proj.rewritten)}
                    className="font-mono text-[10px] text-ink/60 hover:text-brass flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === `proj-${idx}` ? (
                      <>
                        <Check size={11} className="text-teal" />
                        <span className="text-teal">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={11} />
                        <span>Copy Rewrite</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="opacity-50">
                    <p className="font-mono text-[11px] text-ink/60 uppercase mb-1">Original</p>
                    <p className="font-body text-xs text-ink/70">{proj.original}</p>
                  </div>
                  <div className="border-l-2 border-brass pl-4">
                    <p className="font-mono text-[11px] text-brass uppercase font-semibold mb-1 flex items-center gap-1">
                      <CheckCircle2 size={11} /> Rewritten
                    </p>
                    <p className="font-body text-xs text-ink leading-relaxed">
                      {proj.rewritten}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Target JD Outreach Kit (LinkedIn Referral Note + Cover Letter Pitch) */}
      {(data.linkedin_referral_note || data.cover_letter_pitch) && (
        <div className="border-t border-ink/15 pt-5 flex flex-col gap-4">
          <h4 className="font-mono text-xs font-semibold text-teal uppercase tracking-wider flex items-center gap-1.5">
            <Send size={13} className="text-teal" /> Tailored Outreach Kit (Target JD)
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.linkedin_referral_note && (
              <div className="p-4 rounded-sm border border-teal/30 bg-teal/5 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono text-[11px] font-bold text-teal uppercase">
                      LinkedIn / Referral DM (&lt;300 chars)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy("linkedin-note", data.linkedin_referral_note || "")
                      }
                      className="font-mono text-[10px] text-ink/70 hover:text-teal flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === "linkedin-note" ? (
                        <>
                          <Check size={11} className="text-teal" />
                          <span className="text-teal">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={11} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="font-body text-xs text-ink/85 leading-relaxed">
                    {data.linkedin_referral_note}
                  </p>
                </div>
              </div>
            )}

            {data.cover_letter_pitch && (
              <div className="p-4 rounded-sm border border-brass/40 bg-brass/10 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono text-[11px] font-bold text-ink uppercase">
                      Tailored Application Pitch
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy("cover-pitch", data.cover_letter_pitch || "")
                      }
                      className="font-mono text-[10px] text-ink/70 hover:text-brass flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === "cover-pitch" ? (
                        <>
                          <Check size={11} className="text-teal" />
                          <span className="text-teal">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={11} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="font-body text-xs text-ink/85 leading-relaxed">
                    {data.cover_letter_pitch}
                  </p>
                </div>
              </div>
            )}
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
