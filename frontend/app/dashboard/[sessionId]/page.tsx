"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PipelineProgress from "@/components/PipelineProgress";
import MarketSnapshot from "@/components/MarketSnapshot";
import GapReport from "@/components/GapReport";
import RoadmapTimeline from "@/components/RoadmapTimeline";
import CVComparison from "@/components/CVComparison";
import { subscribeToPipeline } from "@/lib/sse";
import { getPipelineResults, getDossierUrl } from "@/lib/api";
import { MessageSquare, Download, Loader2 } from "lucide-react";
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

  // Fetch updated results from DB
  const refreshResults = async () => {
    try {
      const data = await getPipelineResults(sessionId);
      if (data) {
        setSessionData(data);
        if (data.status) setStatus(data.status);
        if (data.agents_completed) setCompletedAgents(data.agents_completed);
        if (data.current_agent) setCurrentAgent(data.current_agent);
        if (data.error_message) setErrorMessage(data.error_message);
      }
    } catch (err) {
      console.error("Failed to load results:", err);
    }
  };

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
            const next = [...prev];
            if (event.agent && !next.includes(event.agent)) {
              next.push(event.agent);
            }
            return next;
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
        // SSE connection closed
        refreshResults();
      }
    );

    return () => unsubscribe();
  }, [sessionId]);

  const handleStartInterview = () => {
    router.push(`/interview/${sessionId}`);
  };

  const handleDownloadDossier = () => {
    window.open(getDossierUrl(sessionId), "_blank");
  };

  return (
    <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full transition-all duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side Stepper (Span 4) */}
        <div className="lg:col-span-4 sticky top-20 flex flex-col gap-6">
          <PipelineProgress
            completedAgents={completedAgents}
            currentAgent={currentAgent}
            status={status}
            errorMessage={errorMessage}
          />

          {status === "complete" && (
            <div className="flex flex-col gap-3">
              <button
                onClick={handleStartInterview}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center justify-center gap-2 shadow-md shadow-indigo-500/10 cursor-pointer transition-all"
              >
                <MessageSquare size={16} /> Start Mock Interview
              </button>
              <button
                onClick={handleDownloadDossier}
                className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all"
              >
                <Download size={16} /> Download Career Dossier
              </button>
            </div>
          )}
        </div>

        {/* Right Side Analysis Panels (Span 8) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {completedAgents.length === 0 && status !== "error" && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center justify-center py-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
                <h3 className="font-semibold text-sm text-slate-850 dark:text-slate-200">
                  Warming up Career OS...
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                  Ustaad is parsing your profile and fetching live job market insights.
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
