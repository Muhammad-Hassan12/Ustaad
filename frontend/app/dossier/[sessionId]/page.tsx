"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPipelineResults, getDossierUrl } from "@/lib/api";
import {
  Download, Share2, ArrowLeft, Loader2, AlertCircle, FileText,
  CheckCircle2, Star, Target, User, MapPin, Briefcase, GraduationCap,
  TrendingUp, Award
} from "lucide-react";

export default function DossierPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
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
      } catch (err) {
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

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-full bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center">
            <Loader2 className="w-7 h-7 text-indigo-500 animate-spin" />
          </div>
          <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 animate-ping" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-200">Loading Career Dossier...</h3>
          <p className="text-xs text-slate-500 mt-1">Fetching your full analysis report</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-200">Error Loading Dossier</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">{error}</p>
        </div>
        <button
          onClick={() => router.push(`/dashboard/${sessionId}`)}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl cursor-pointer transition-colors"
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

  const scoreColor = score >= 75
    ? "text-emerald-500"
    : score >= 50
    ? "text-amber-500"
    : "text-rose-500";

  const scoreRingColor = score >= 75
    ? "stroke-emerald-500"
    : score >= 50
    ? "stroke-amber-500"
    : "stroke-rose-500";

  return (
    <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">

      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => router.push(`/dashboard/${sessionId}`)}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </button>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleShare}
            className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
          >
            <Share2 size={12} /> {copied ? "✓ Copied!" : "Share"}
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/15 transition-colors"
          >
            {downloading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
            Download PDF
          </button>
        </div>
      </div>

      {/* Main Dossier Document */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl shadow-slate-200/60 dark:shadow-slate-950/80 overflow-hidden">

        {/* Document Header Band */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-8 md:px-12 py-8">
          <div className="flex justify-between items-start gap-6">
            <div className="flex-1">
              <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest mb-2">Career Dossier</p>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
                {profile.name || session.target_role || "Candidate"}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-indigo-100 text-sm">
                {session.target_role && (
                  <span className="flex items-center gap-1.5">
                    <Target size={13} /> {session.target_role}
                  </span>
                )}
                {session.target_city && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={13} /> {session.target_city}
                  </span>
                )}
                {profile.location && profile.location !== session.target_city && (
                  <span className="flex items-center gap-1.5 opacity-80">
                    <User size={13} /> Current: {profile.location}
                  </span>
                )}
              </div>
            </div>

            {/* Readiness Score Ring */}
            <div className="shrink-0 flex flex-col items-center">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="absolute w-full h-full -rotate-90">
                  <circle cx="48" cy="48" r="40" strokeWidth="7" fill="transparent" className="stroke-indigo-500/30" />
                  <circle
                    cx="48" cy="48" r="40" strokeWidth="7" fill="transparent"
                    className="stroke-white transition-all duration-1000"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * score) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="text-center">
                  <span className="text-2xl font-black text-white">{score}</span>
                  <p className="text-[9px] font-bold text-indigo-200 uppercase">Score</p>
                </div>
              </div>
              <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider mt-1">Readiness</p>
            </div>
          </div>
        </div>

        <div className="px-8 md:px-12 py-8 flex flex-col gap-8">

          {/* 1. Profile Summary */}
          {(profile.summary || profile.skills?.length > 0) && (
            <section className="flex flex-col gap-3">
              <h2 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <User size={13} className="text-indigo-500" /> Professional Profile
              </h2>
              {profile.summary && (
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {profile.summary}
                </p>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                {profile.education && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <GraduationCap size={14} className="text-indigo-500 shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold">Education</p>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">{profile.education}</p>
                    </div>
                  </div>
                )}
                {profile.experience_years != null && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <Briefcase size={14} className="text-indigo-500 shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold">Experience</p>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">{profile.experience_years} years</p>
                    </div>
                  </div>
                )}
                {market.market_demand_level && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <TrendingUp size={14} className="text-indigo-500 shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold">Market Demand</p>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">{market.market_demand_level}</p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* 2. Market Snapshot */}
          {market.market_summary && (
            <section className="flex flex-col gap-3">
              <h2 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <Target size={13} className="text-indigo-500" /> Market Snapshot
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <p className="text-slate-400 font-semibold mb-1">Salary Range</p>
                  <p className="font-bold text-slate-900 dark:text-slate-100">
                    PKR {market.salary_range_pkr?.min?.toLocaleString()} – {market.salary_range_pkr?.max?.toLocaleString()}
                    <span className="text-slate-400 font-normal"> /month</span>
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <p className="text-slate-400 font-semibold mb-1">Remote Work</p>
                  <p className="font-bold text-slate-900 dark:text-slate-100">{market.remote_percentage || "N/A"}</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic">
                &ldquo;{market.market_summary}&rdquo;
              </p>
            </section>
          )}

          {/* 3. Gap Analysis */}
          {gap.summary && (
            <section className="flex flex-col gap-3">
              <h2 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <AlertCircle size={13} className="text-indigo-500" /> Gap Analysis Report
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{gap.summary}</p>
              {gap.critical_gaps?.length > 0 && (
                <div className="flex flex-col gap-2">
                  {gap.critical_gaps.map((g: any, idx: number) => (
                    <div key={idx} className="text-xs text-slate-600 dark:text-slate-400 flex gap-2 items-start">
                      <span className="text-rose-500 font-bold shrink-0">✗ Critical:</span>
                      <span><strong className="text-slate-800 dark:text-slate-200">{g.skill}</strong> — {g.reason}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* 4. Optimized Resume Profile */}
          {cvRewrite.rewritten_summary && (
            <section className="flex flex-col gap-3">
              <h2 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <FileText size={13} className="text-indigo-500" /> ATS-Optimized Resume Profile
              </h2>
              {cvRewrite.ats_score_estimate && (
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ATS Score</span>
                  <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                    <div
                      className="bg-indigo-500 h-1.5 rounded-full transition-all duration-700"
                      style={{ width: `${cvRewrite.ats_score_estimate}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{cvRewrite.ats_score_estimate}/100</span>
                </div>
              )}
              <div className="p-4 rounded-xl bg-indigo-50/40 dark:bg-indigo-950/10 border border-indigo-100/30 dark:border-indigo-900/20">
                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-2">Optimized Summary</p>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{cvRewrite.rewritten_summary}</p>
              </div>
              {cvRewrite.rewritten_projects?.length > 0 && (
                <div className="flex flex-col gap-2.5 mt-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Project Descriptions</p>
                  {cvRewrite.rewritten_projects.map((proj: any, idx: number) => (
                    <div key={idx} className="flex flex-col gap-1 pl-3 border-l-2 border-indigo-200 dark:border-indigo-800">
                      <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">{proj.name}</span>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{proj.rewritten}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* 5. 30-Day Learning Path */}
          {roadmap.thirty_day_plan?.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <Star size={13} className="text-indigo-500" /> 30-Day Learning Path
              </h2>
              <div className="flex flex-col gap-4">
                {roadmap.thirty_day_plan.map((week: any, idx: number) => (
                  <div key={idx} className="flex flex-col gap-2">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      Week {week.week}: {week.focus}
                    </span>
                    <div className="flex flex-col gap-1.5 pl-3 border-l border-slate-200 dark:border-slate-800">
                      {week.tasks?.map((task: any, tidx: number) => (
                        <p key={tidx} className="text-xs text-slate-600 dark:text-slate-400">
                          <span className="text-indigo-400 mr-1.5">→</span>
                          {task.task}{" "}
                          <span className="text-slate-400">({task.resource} · {task.platform})</span>
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Footer */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex justify-between items-center">
            <p className="text-[10px] text-slate-400">Generated by Ustaad AI Career OS — AgenticEra Systems</p>
            <div className="flex items-center gap-1.5">
              <Award size={11} className="text-indigo-400" />
              <span className="text-[10px] font-bold text-indigo-500">Readiness: {score}/100</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
