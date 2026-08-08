"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPipelineResults, getDossierUrl } from "@/lib/api";
import {
  Download, Share2, ArrowLeft, Loader2, AlertCircle, FileText,
  Star, Target, User, MapPin
} from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";
import AnimatedCounter from "@/components/AnimatedCounter";

interface GapDetail {
  skill: string;
  reason: string;
}

interface ProjectRewrite {
  name: string;
  rewritten: string;
}

interface RoadmapTask {
  task: string;
  resource: string;
}

interface RoadmapWeek {
  week: number;
  focus: string;
  tasks?: RoadmapTask[];
}

interface DossierSessionData {
  target_role?: string;
  target_city?: string;
  error?: string;
  profile_data?: {
    name?: string;
    location?: string;
    summary?: string;
    education?: string;
    experience_years?: number;
    skills?: string[];
  };
  market_data?: {
    market_demand_level?: string;
    salary_range_pkr?: { min: number; max: number };
    remote_percentage?: string;
    market_summary?: string;
  };
  gap_data?: {
    overall_readiness_score?: number;
    summary?: string;
    critical_gaps?: GapDetail[];
  };
  roadmap_data?: {
    thirty_day_plan?: RoadmapWeek[];
  };
  cv_rewrite_data?: {
    ats_score_estimate?: number;
    rewritten_summary?: string;
    rewritten_projects?: ProjectRewrite[];
  };
  [key: string]: unknown;
}

export default function DossierPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<DossierSessionData | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getPipelineResults(sessionId);
        if (data && !data.error) {
          setSession(data);
        } else {
          setError("Failed to retrieve dossier data.");
        }
      } catch {
        setError("Error communicating with dossier server.");
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [sessionId]);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    window.open(getDossierUrl(sessionId), "_blank");
    setTimeout(() => setDownloading(false), 2000);
  };

  const handleShare = async () => {
    // Wrap clipboard write in try/catch — clipboard API may be blocked
    // on HTTP (non-HTTPS) contexts or by browser security settings.
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link to share your dossier:", window.location.href);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4 bg-ink">
        <Loader2 className="w-8 h-8 text-brass animate-spin" />
        <div>
          <h3 className="font-display text-2xl text-parchment">Loading Career Dossier...</h3>
          <p className="font-body text-xs text-warm-gray mt-1">Retrieving your full manuscript analysis</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4 bg-ink">
        <AlertCircle className="w-12 h-12 text-critical-red" />
        <div>
          <h3 className="font-display text-2xl text-parchment">Error Loading Dossier</h3>
          <p className="font-body text-xs text-warm-gray mt-1 max-w-xs">{error}</p>
        </div>
        <button
          onClick={() => router.push(`/dashboard/${sessionId}`)}
          className="px-6 py-3 bg-brass text-ink font-body font-semibold rounded-sm hover:bg-brass/90 cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const profile = session.profile_data || {};
  const market = session.market_data || {};
  const gap = session.gap_data || {};
  const roadmap = session.roadmap_data || {};
  const cvRewrite = session.cv_rewrite_data || {};
  const score = gap.overall_readiness_score || 0;

  return (
    <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full bg-ink relative">
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => router.push(`/dashboard/${sessionId}`)}
          className="flex items-center gap-2 font-body text-xs font-semibold text-warm-gray hover:text-brass transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleShare}
            className="px-4 py-2 rounded-sm bg-ink border border-warm-gray/30 text-parchment hover:border-brass text-xs font-body flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Share2 size={13} /> {copied ? "✓ Copied Link" : "Share"}
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="px-5 py-2 rounded-sm bg-brass text-ink font-body text-xs font-semibold flex items-center gap-1.5 hover:bg-brass/90 disabled:opacity-60 cursor-pointer shadow-md transition-colors"
          >
            {downloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
            Download PDF
          </button>
        </div>
      </div>

      {/* Main Bound Ledger Book Container */}
      <div className="bg-parchment text-ink rounded-sm border border-brass/40 shadow-2xl p-8 md:p-14 flex flex-col gap-10 relative paper-grain">
        {/* Ledger corner ticks */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-brass" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-brass" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-brass" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-brass" />

        {/* Document Header */}
        <header className="border-b-2 border-brass pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <span className="font-mono text-xs font-bold text-brass uppercase tracking-widest block mb-1">
              Official Career Dossier
            </span>
            <h1 className="font-display text-4xl md:text-5xl text-ink leading-tight">
              {profile.name || session.target_role || "Candidate Profile"}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 font-mono text-xs text-ink/70">
              {session.target_role && (
                <span className="flex items-center gap-1">
                  <Target size={12} className="text-teal" /> Role: {session.target_role}
                </span>
              )}
              {session.target_city && (
                <span className="flex items-center gap-1">
                  <MapPin size={12} className="text-teal" /> City: {session.target_city}
                </span>
              )}
              {profile.location && profile.location !== session.target_city && (
                <span className="flex items-center gap-1 opacity-70">
                  <User size={12} /> Current: {profile.location}
                </span>
              )}
            </div>
          </div>

          {/* Large Monospace Readiness Score */}
          <div className="shrink-0 flex items-baseline gap-1 bg-ink/5 p-4 rounded-sm border border-ink/10">
            <AnimatedCounter value={score} className="font-mono text-5xl font-bold text-brass" />
            <span className="font-mono text-lg text-ink/40">/100</span>
            <span className="font-mono text-[10px] text-ink/60 uppercase block ml-2">Readiness</span>
          </div>
        </header>

        {/* Section 1: Professional Profile */}
        {(profile.summary || (profile.skills && profile.skills.length > 0)) && (
          <AnimatedSection className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-ink/15 pb-2">
              <h2 className="font-display text-2xl text-ink flex items-center gap-2">
                <User size={18} className="text-teal" /> 1. Professional Profile
              </h2>
            </div>
            {profile.summary && (
              <p className="font-body text-sm text-ink/80 leading-relaxed">
                {profile.summary}
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
              {profile.education && (
                <div className="p-3 rounded-sm bg-ink/5 border border-ink/10 flex flex-col gap-1">
                  <span className="text-[10px] text-ink/50 uppercase">Education</span>
                  <span className="font-semibold text-ink">{profile.education}</span>
                </div>
              )}
              {profile.experience_years != null && (
                <div className="p-3 rounded-sm bg-ink/5 border border-ink/10 flex flex-col gap-1">
                  <span className="text-[10px] text-ink/50 uppercase">Experience</span>
                  <span className="font-semibold text-ink">{profile.experience_years} years</span>
                </div>
              )}
              {market.market_demand_level && (
                <div className="p-3 rounded-sm bg-ink/5 border border-ink/10 flex flex-col gap-1">
                  <span className="text-[10px] text-ink/50 uppercase">Market Demand</span>
                  <span className="font-semibold text-brass">{market.market_demand_level}</span>
                </div>
              )}
            </div>
          </AnimatedSection>
        )}

        {/* Section 2: Market Intelligence */}
        {market.market_summary && (
          <AnimatedSection className="flex flex-col gap-4 pt-2" delay={0.1}>
            <div className="flex items-center justify-between border-b border-ink/15 pb-2">
              <h2 className="font-display text-2xl text-ink flex items-center gap-2">
                <Target size={18} className="text-teal" /> 2. Market Intelligence
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
              <div className="p-3.5 rounded-sm bg-ink/5 border border-ink/10">
                <span className="text-[10px] text-ink/50 uppercase block mb-1">Salary Range (PKR)</span>
                <span className="font-bold text-base text-brass">
                  PKR {market.salary_range_pkr?.min?.toLocaleString()} – {market.salary_range_pkr?.max?.toLocaleString()} /mo
                </span>
              </div>
              <div className="p-3.5 rounded-sm bg-ink/5 border border-ink/10">
                <span className="text-[10px] text-ink/50 uppercase block mb-1">Remote Openings</span>
                <span className="font-bold text-base text-teal">{market.remote_percentage || "N/A"}</span>
              </div>
            </div>
            <p className="font-body text-xs text-ink/80 italic border-l-2 border-brass pl-4 py-1">
              &ldquo;{market.market_summary}&rdquo;
            </p>
          </AnimatedSection>
        )}

        {/* Section 3: Skill Gap Analysis */}
        {gap.summary && (
          <AnimatedSection className="flex flex-col gap-4 pt-2" delay={0.15}>
            <div className="flex items-center justify-between border-b border-ink/15 pb-2">
              <h2 className="font-display text-2xl text-ink flex items-center gap-2">
                <AlertCircle size={18} className="text-critical-red" /> 3. Skill Gap Analysis
              </h2>
            </div>
            <p className="font-body text-xs text-ink/80 leading-relaxed">{gap.summary}</p>
            {gap.critical_gaps && gap.critical_gaps.length > 0 && (
              <div className="flex flex-col gap-2.5">
                <span className="font-mono text-xs font-semibold text-critical-red uppercase tracking-wider">
                  Critical Gaps:
                </span>
                {gap.critical_gaps.map((g, idx) => (
                  <div key={idx} className="border-l-2 border-critical-red pl-4 py-1 font-body text-xs text-ink/80">
                    <strong className="text-ink">{g.skill}</strong> — {g.reason}
                  </div>
                ))}
              </div>
            )}
          </AnimatedSection>
        )}

        {/* Section 4: ATS Resume Optimization */}
        {cvRewrite.rewritten_summary && (
          <AnimatedSection className="flex flex-col gap-4 pt-2" delay={0.2}>
            <div className="flex items-center justify-between border-b border-ink/15 pb-2">
              <h2 className="font-display text-2xl text-ink flex items-center gap-2">
                <FileText size={18} className="text-brass" /> 4. ATS Resume Optimization
              </h2>
              {cvRewrite.ats_score_estimate && (
                <span className="font-mono text-xs text-brass font-bold">
                  ATS Score: {cvRewrite.ats_score_estimate}/100
                </span>
              )}
            </div>
            <div className="border-l-2 border-brass pl-4 py-1">
              <span className="font-mono text-[10px] text-brass uppercase font-semibold block mb-1">
                Optimized Executive Summary
              </span>
              <p className="font-body text-xs text-ink leading-relaxed">{cvRewrite.rewritten_summary}</p>
            </div>
            {cvRewrite.rewritten_projects && cvRewrite.rewritten_projects.length > 0 && (
              <div className="flex flex-col gap-3 mt-2">
                <span className="font-mono text-xs font-semibold text-ink/60 uppercase tracking-wider">
                  Enhanced Project Descriptions
                </span>
                {cvRewrite.rewritten_projects.map((proj, idx) => (
                  <div key={idx} className="border-l-2 border-ink/20 pl-4 py-1 flex flex-col gap-1">
                    <span className="font-display text-sm text-ink">{proj.name}</span>
                    <p className="font-body text-xs text-ink/80 leading-relaxed">{proj.rewritten}</p>
                  </div>
                ))}
              </div>
            )}
          </AnimatedSection>
        )}

        {/* Section 5: 30-Day Learning Roadmap */}
        {roadmap.thirty_day_plan && roadmap.thirty_day_plan.length > 0 && (
          <AnimatedSection className="flex flex-col gap-4 pt-2" delay={0.25}>
            <div className="flex items-center justify-between border-b border-ink/15 pb-2">
              <h2 className="font-display text-2xl text-ink flex items-center gap-2">
                <Star size={18} className="text-teal" /> 5. 30-Day Learning Roadmap
              </h2>
            </div>
            <div className="flex flex-col gap-4">
              {roadmap.thirty_day_plan.map((week, idx) => (
                <div key={idx} className="border-l-2 border-teal pl-4 py-1 flex flex-col gap-2">
                  <span className="font-mono text-xs font-bold text-teal">
                    Week {week.week}: {week.focus}
                  </span>
                  <div className="space-y-1.5">
                    {week.tasks?.map((task, tidx) => (
                      <p key={tidx} className="font-body text-xs text-ink/80 flex items-center gap-2">
                        <span className="font-mono text-teal">→</span>
                        <span>{task.task}</span>
                        <span className="font-mono text-[10px] text-ink/50">({task.resource})</span>
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </AnimatedSection>
        )}

        {/* Footer info */}
        <footer className="border-t-2 border-brass pt-4 flex flex-col sm:flex-row justify-between items-center text-xs font-mono text-ink/60 gap-2">
          <span>Ustaad AI Career OS — AgenticEra Systems © 2026</span>
          <span>Readiness Score: {score}/100</span>
        </footer>
      </div>

      {/* Floating Download PDF CTA Button */}
      <button
        onClick={handleDownloadPDF}
        disabled={downloading}
        className="fixed bottom-8 right-8 bg-brass text-ink font-body font-semibold px-6 py-3.5 rounded-sm shadow-2xl hover:bg-brass/90 transition-colors flex items-center gap-2 cursor-pointer z-50 text-sm"
      >
        {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
        <span>Download PDF Report ↓</span>
      </button>
    </main>
  );
}
