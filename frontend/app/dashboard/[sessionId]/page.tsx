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

interface SessionData {
  status?: "pending" | "running" | "complete" | "error";
  agents_completed?: string[];
  current_agent?: string;
  error_message?: string;
  market_data?: Parameters<typeof MarketSnapshot>[0]["data"];
  gap_data?: Parameters<typeof GapReport>[0]["data"];
  roadmap_data?: Parameters<typeof RoadmapTimeline>[0]["data"];
  cv_rewrite_data?: Parameters<typeof CVComparison>[0]["data"];
  cv_text?: string;
  [key: string]: unknown;
}

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [status, setStatus] = useState<"pending" | "running" | "complete" | "error">("running");
  const [completedAgents, setCompletedAgents] = useState<string[]>([]);
  const [currentAgent, setCurrentAgent] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);

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
    refreshResults();

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
    <main className="flex-1 py-10 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto w-full bg-ink">
      {/* Status banner */}
      {status === "running" && currentAgent && (
        <div className="mb-8 px-5 py-3.5 rounded-sm bg-teal/10 border-l-4 border-teal text-parchment flex items-center gap-3 text-sm font-body animate-fadeInUp">
          <Loader2 className="w-4 h-4 text-teal animate-spin shrink-0" />
          <span>
            <span className="font-semibold text-teal font-mono uppercase tracking-wider">Career OS Active</span> — AI agents are analyzing your profile in real-time.
          </span>
        </div>
      )}
      {status === "complete" && (
        <div className="mb-8 px-5 py-3.5 rounded-sm bg-brass/10 border-l-4 border-brass text-parchment flex items-center gap-3 text-sm font-body animate-fadeInUp">
          <Sparkles className="w-4 h-4 text-brass shrink-0" />
          <span>
            <span className="font-semibold text-brass font-mono uppercase tracking-wider">Analysis Complete</span> — All agents finished. Proceed to your AI mock interview or download your dossier.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Top/Left Column — Pipeline Stepper & Quick Actions (Span 4) */}
        <div className="lg:col-span-4 sticky top-24 flex flex-col gap-5">
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
                className="w-full py-3.5 px-4 rounded-sm bg-brass text-ink font-body font-semibold flex items-center justify-center gap-2.5 hover:bg-brass/90 transition-colors shadow-md cursor-pointer text-sm"
              >
                <MessageSquare size={16} /> Start AI Mock Interview
              </button>
              <button
                onClick={handleDownloadDossier}
                className="w-full py-3.5 px-4 rounded-sm border border-brass/40 text-brass bg-transparent font-body font-semibold flex items-center justify-center gap-2.5 hover:bg-brass/10 transition-colors shadow-sm cursor-pointer text-sm"
              >
                <Download size={16} /> Download Career Dossier (PDF)
              </button>
            </motion.div>
          )}
        </div>

        {/* Main Analysis Column (Span 8) */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          {completedAgents.length === 0 && status !== "error" && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center justify-center py-16 bg-parchment text-ink border border-brass/40 rounded-sm p-8 text-center shadow-lg relative">
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-brass z-10 pointer-events-none" />
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-brass z-10 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-brass z-10 pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-brass z-10 pointer-events-none" />
                <Loader2 className="w-8 h-8 text-brass animate-spin mb-4" />
                <h3 className="font-display text-2xl text-ink">
                  Initializing Career OS...
                </h3>
                <p className="font-body text-xs text-ink/70 mt-2 max-w-sm leading-relaxed">
                  Ustaad is parsing your profile and querying real-time Pakistani tech job listings. This process takes 2–4 minutes.
                </p>
              </div>
            </div>
          )}

          {/* Render Cards Progressively as agents complete */}
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
                originalSummary={sessionData.cv_text || null}
              />
            </motion.div>
          )}
        </div>
      </div>
    </main>
  );
}
