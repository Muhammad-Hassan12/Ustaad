"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPipelineResults, getDossierUrl } from "@/lib/api";
import { Download, Share2, ArrowLeft, Loader2, AlertCircle, FileText, CheckCircle2, Star, Target } from "lucide-react";

export default function DossierPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getPipelineResults(sessionId);
        if (data) {
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

  const handleDownloadPDF = () => {
    window.open(getDossierUrl(sessionId), "_blank");
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
        <h3 className="text-lg font-semibold text-slate-850 dark:text-slate-200">
          Loading Career Dossier...
        </h3>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
        <h3 className="text-lg font-semibold text-slate-850 dark:text-slate-200">
          Error Loading Dossier
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">{error}</p>
        <button
          onClick={() => router.push(`/dashboard/${sessionId}`)}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl"
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

  return (
    <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full transition-all duration-300">
      
      {/* Top Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-5 mb-8">
        <button
          onClick={() => router.push(`/dashboard/${sessionId}`)}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-250 transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleShare}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-250 dark:border-slate-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Share2 size={12} /> {copied ? "Copied Link!" : "Share"}
          </button>
          <button
            onClick={handleDownloadPDF}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/10 transition-colors"
          >
            <Download size={12} /> Download PDF
          </button>
        </div>
      </div>

      {/* Dossier Document Paper */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl flex flex-col gap-8 transition-colors duration-300">
        
        {/* Document Header */}
        <div className="border-b border-slate-100 dark:border-slate-800 pb-6 flex flex-col gap-2">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-950 dark:text-slate-100 leading-tight">
                {profile.name || "Candidate Dossier"}
              </h2>
              <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mt-1">
                Target Role: {session.target_role} • {session.target_city}
              </p>
            </div>
            
            <div className="text-right">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Readiness Score
              </span>
              <span className="text-3xl font-black text-indigo-500">
                {gap.overall_readiness_score || "N/A"}/100
              </span>
            </div>
          </div>
        </div>

        {/* 1. Market Snapshot */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/80 pb-2 flex items-center gap-1.5">
            <Target size={14} className="text-indigo-500" /> Market Snapshot
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-slate-500">Demand Level:</p>
              <p className="font-semibold text-slate-850 dark:text-slate-200">{market.market_demand_level}</p>
            </div>
            <div>
              <p className="text-slate-500">Salary Range:</p>
              <p className="font-semibold text-slate-850 dark:text-slate-200">
                PKR {market.salary_range_pkr?.min?.toLocaleString()} - {market.salary_range_pkr?.max?.toLocaleString()}/month
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed mt-2 italic">
            &ldquo;{market.market_summary}&rdquo;
          </p>
        </div>

        {/* 2. Gap analysis */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/80 pb-2 flex items-center gap-1.5">
            <AlertCircle size={14} className="text-indigo-500" /> Gap Analysis Report
          </h3>
          <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed">
            {gap.summary}
          </p>
          {gap.critical_gaps && gap.critical_gaps.length > 0 && (
            <div className="flex flex-col gap-2 mt-2">
              {gap.critical_gaps.map((g: any, idx: number) => (
                <div key={idx} className="text-xs text-slate-600 dark:text-slate-350 flex gap-2">
                  <span className="text-rose-500 font-bold shrink-0">❌ [Critical]</span>
                  <span><strong>{g.skill}:</strong> {g.reason}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. CV summary optimized */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/80 pb-2 flex items-center gap-1.5">
            <FileText size={14} className="text-indigo-500" /> Optimized Resume Profile
          </h3>
          <div>
            <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
              ATS Optimized Summary
            </span>
            <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed">
              {cvRewrite.rewritten_summary}
            </p>
          </div>
          {cvRewrite.rewritten_projects && cvRewrite.rewritten_projects.length > 0 && (
            <div className="flex flex-col gap-3 mt-3">
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                Project Descriptions
              </span>
              {cvRewrite.rewritten_projects.map((proj: any, idx: number) => (
                <div key={idx} className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {proj.name}
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {proj.rewritten}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. 30-day learning path */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/80 pb-2 flex items-center gap-1.5">
            <Star size={14} className="text-indigo-500" /> 30-Day Learning Path
          </h3>
          <div className="flex flex-col gap-4">
            {roadmap.thirty_day_plan && roadmap.thirty_day_plan.length > 0 ? (
              roadmap.thirty_day_plan.map((week: any, idx: number) => (
                <div key={idx} className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-indigo-650 dark:text-indigo-400">
                    Week {week.week}: {week.focus}
                  </span>
                  <div className="flex flex-col gap-1 pl-3 border-l border-slate-200 dark:border-slate-800">
                    {week.tasks.map((task: any, tidx: number) => (
                      <p key={tidx} className="text-xs text-slate-650 dark:text-slate-450">
                        • {task.task} ({task.resource} • {task.platform})
                      </p>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400">No active path tasks found.</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
