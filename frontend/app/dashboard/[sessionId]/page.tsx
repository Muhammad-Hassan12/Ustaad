"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import PipelineProgress from "@/components/PipelineProgress";
import MarketSnapshot from "@/components/MarketSnapshot";
import GapReport from "@/components/GapReport";
import RoadmapTimeline from "@/components/RoadmapTimeline";
import CVComparison from "@/components/CVComparison";
import { subscribeToPipeline } from "@/lib/sse";
import { getPipelineResults, getDossierUrl } from "@/lib/api";
import { MessageSquare, Download, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { CardSkeleton } from "@/components/Skeleton";

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [status, setStatus] = useState<"pending" | "running" | "complete" | "error">("running");
  const [completedAgents, setCompletedAgents] = useState<string[]>([]);
  const [currentAgent, setCurrentAgent] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);

  // Fetch updated results from DB — stable reference with useCallback
  const refreshResults = useCallback(async () => {
    try {
      const data = await getPipelineResults(sessionId);
      if (data && !data.error) {
        setSessionData(data);
        if (data.status) setStatus(data.status);
        if (data.agents_completed) setCompletedAgents(data.agents_completed);
        if (data.current_agent) setCurrentAgent(data.current_agent);
        if (data.error_message) setErrorMessage(data.error_message);
      }
    } catch (err) {
      console.error("Failed to load results:", err);
    }
  }, [sessionId]);

  useEffect(() => {
    // Initial fetch to capture current state if page reloads
    refreshResults();

    // Subscribe to SSE updates
    const unsubscribe = subscribeToPipeline(
      sessionId,
      (event) => {
        if (event.event === "agent_start") {
          setCurrentAgent(event.agent || null);
          setStatus("running");
        } else if (event.event === "agent_complete") {
          setCompletedAgents((prev) => {
            if (event.agent && !prev.includes(event.agent)) {
              return [...prev, event.agent];
            }
            return prev;
          });
          refreshResults();
        } else if (event.event === "pipeline_complete") {
          setStatus("complete");
          setCurrentAgent(null);
          refreshResults();
        } else if (event.event === "error") {
          setStatus("error");
          setErrorMessage(event.message);
          refreshResults();
        }
      },
      () => {
        // SSE connection closed — do a final refresh
        refreshResults();
      }
    );

    return () => unsubscribe();
  }, [sessionId, refreshResults]);

  const handleStartInterview = () => {
    router.push(`/interview/${sessionId}`);
  };

  const handleDownloadDossier = () => {
    window.open(getDossierUrl(sessionId), "_blank");
  };

  return (
    <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Status banner */}
      {status === "running" && currentAgent && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-800/40 flex items-center gap-3 text-sm text-indigo-700 dark:text-indigo-300 animate-fadeInUp">
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>
            <span className="font-semibold">Career OS is running</span> — agents are analyzing your profile in real-time.
          </span>
        </div>
      )}
      {status === "complete" && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center gap-3 text-sm text-emerald-700 dark:text-emerald-300 animate-fadeInUp">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>
            <span className="font-semibold">Analysis complete!</span> All agents finished. Start your mock interview or download your career dossier.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Left Side Stepper (Span 4) */}
        <div className="lg:col-span-4 sticky top-24 flex flex-col gap-4">
          <PipelineProgress
            completedAgents={completedAgents}
            currentAgent={currentAgent}
            status={status}
            errorMessage={errorMessage}
          />

          {status === "complete" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col gap-3"
            >
              <button
                onClick={handleStartInterview}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 cursor-pointer transition-all text-sm"
              >
                <MessageSquare size={16} /> Start Mock Interview
              </button>
              <button
                onClick={handleDownloadDossier}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all text-sm"
              >
                <Download size={16} /> Download Career Dossier
              </button>
            </motion.div>
          )}
        </div>

        {/* Right Side Analysis Panels (Span 8) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {completedAgents.length === 0 && status !== "error" && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center justify-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center shadow-sm">
                <div className="relative mb-4">
                  <div className="w-14 h-14 rounded-full bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center">
                    <Loader2 className="w-7 h-7 text-indigo-500 animate-spin" />
                  </div>
                  <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 animate-ping" />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Warming up Career OS...
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 max-w-xs leading-relaxed">
                  Ustaad is parsing your profile and fetching live job market insights from Pakistan. This takes 2–4 minutes.
                </p>
              </div>
              <CardSkeleton />
              <CardSkeleton />
            </div>
          )}

          {/* Render cards progressively */}
          {completedAgents.includes("market") && sessionData?.market_data && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <MarketSnapshot data={sessionData.market_data} />
            </motion.div>
          )}

          {completedAgents.includes("gap") && sessionData?.gap_data && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
            >
              <GapReport data={sessionData.gap_data} />
            </motion.div>
          )}

          {completedAgents.includes("roadmap") && sessionData?.roadmap_data && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 }}
            >
              <RoadmapTimeline data={sessionData.roadmap_data} />
            </motion.div>
          )}

          {completedAgents.includes("cv_rewrite") && sessionData?.cv_rewrite_data && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut", delay: 0.3 }}
            >
              <CVComparison
                data={sessionData.cv_rewrite_data}
                originalSummary={sessionData.cv_text}
              />
            </motion.div>
          )}
        </div>
      </div>
    </main>
  );
}
