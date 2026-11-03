"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import PipelineProgress from "@/components/PipelineProgress";
import MarketSnapshot from "@/components/MarketSnapshot";
import GapReport from "@/components/GapReport";
import RoadmapTimeline from "@/components/RoadmapTimeline";
import CVComparison from "@/components/CVComparison";
import { subscribeToPipeline } from "@/lib/sse";
import { getPipelineResults, getDossierUrl } from "@/lib/api";
import {
  MessageSquare,
  Download,
  Loader2,
  Sparkles,
  Copy,
  Check,
  Key,
  Printer,
  BookOpen,
  User,
  Cpu,
} from "lucide-react";
import { motion } from "framer-motion";

interface EducationObj {
  degree?: string | null;
  field?: string | null;
  university?: string | null;
  graduation_year?: number | null;
}

interface SessionData {
  status?: "pending" | "running" | "complete" | "error";
  agents_completed?: string[];
  current_agent?: string;
  error_message?: string;
  target_role?: string;
  target_city?: string;
  profile_data?: {
    name?: string | null;
    location?: string | null;
    summary?: string | null;
    cv_summary_original?: string | null;
    education?: EducationObj | string | null;
    experience_years?: number;
    current_skills?: string[];
    skills?: string[];
    weaknesses_detected?: string[];
    analyzed_with?: {
      provider?: string;
      model?: string;
      mode?: string;
    };
  };
  market_data?: Parameters<typeof MarketSnapshot>[0]["data"] & {
    cache_hit?: boolean;
  };
  gap_data?: Parameters<typeof GapReport>[0]["data"];
  roadmap_data?: Parameters<typeof RoadmapTimeline>[0]["data"];
  cv_rewrite_data?: Parameters<typeof CVComparison>[0]["data"];
  cv_text?: string;
  [key: string]: unknown;
}

type WorkspaceTab = "all" | "overview" | "market" | "cv" | "roadmap";

function formatEducation(edu: EducationObj | string | null | undefined): string | null {
  if (!edu) return null;
  if (typeof edu === "string") return edu;
  const parts: string[] = [];
  if (edu.degree) parts.push(edu.degree);
  if (edu.field) parts.push(`in ${edu.field}`);
  if (edu.university) parts.push(`— ${edu.university}`);
  if (edu.graduation_year) parts.push(`(${edu.graduation_year})`);
  return parts.length > 0 ? parts.join(" ") : null;
}

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [status, setStatus] = useState<"pending" | "running" | "complete" | "error">("running");
  const [completedAgents, setCompletedAgents] = useState<string[]>([]);
  const [activeAgents, setActiveAgents] = useState<string[]>([]);
  const [currentAgent, setCurrentAgent] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("all");
  const [copied, setCopied] = useState(false);
  const sessionSavedRef = useRef(false);

  const saveToRecentSessions = useCallback(
    (role?: string, city?: string) => {
      if (typeof window === "undefined" || !sessionId) return;
      try {
        const stored = localStorage.getItem("ustaad_recent_sessions");
        let list: Array<{ id: string; role: string; city: string; timestamp: number }> = stored
          ? JSON.parse(stored)
          : [];
        list = list.filter((s) => s.id !== sessionId);
        list.unshift({
          id: sessionId,
          role: role || "Career Analysis",
          city: city || "Pakistan",
          timestamp: Date.now(),
        });
        localStorage.setItem("ustaad_recent_sessions", JSON.stringify(list.slice(0, 10)));
      } catch (e) {
        console.error("Failed to save recent session:", e);
      }
    },
    [sessionId]
  );

  const handleCopySessionId = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(sessionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const refreshResults = useCallback(async () => {
    try {
      const data = await getPipelineResults(sessionId);
      if (data && !data.error) {
        setSessionData(data);
        if (data.status) {
          setStatus(data.status);
          if (data.status === "complete" && !sessionSavedRef.current) {
            sessionSavedRef.current = true;
            saveToRecentSessions(data.target_role, data.target_city);
          }
        }
        if (data.agents_completed) setCompletedAgents(data.agents_completed);
        if (data.current_agent !== undefined) setCurrentAgent(data.current_agent);
        if (data.error_message) setErrorMessage(data.error_message);
      }
    } catch (err) {
      console.error("Failed to load results:", err);
    }
  }, [sessionId, saveToRecentSessions]);

  useEffect(() => {
    refreshResults();

    const unsubscribe = subscribeToPipeline(
      sessionId,
      (event) => {
        if (event.event === "agent_start") {
          const ag = event.agent || null;
          setCurrentAgent(ag);
          if (ag) {
            setActiveAgents((prev) => (prev.includes(ag) ? prev : [...prev, ag]));
          }
          setStatus("running");
        } else if (event.event === "agent_complete") {
          if (event.agent) {
            const finished = event.agent;
            setActiveAgents((prev) => prev.filter((a) => a !== finished));
            setCompletedAgents((prev) =>
              prev.includes(finished) ? prev : [...prev, finished]
            );
          }
          refreshResults();
        } else if (event.event === "pipeline_complete") {
          setStatus("complete");
          setCurrentAgent(null);
          setActiveAgents([]);
          refreshResults();
        } else if (event.event === "error") {
          setStatus("error");
          setActiveAgents([]);
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

  const readinessScore = sessionData?.gap_data?.overall_readiness_score;
  const atsScore = sessionData?.cv_rewrite_data?.ats_score_estimate;
  const jdMatchScore = sessionData?.gap_data?.jd_match_score;
  const demandLevel = sessionData?.market_data?.market_demand_level;
  const salaryRange = sessionData?.market_data?.salary_range_pkr;
  const analyzedWith = sessionData?.profile_data?.analyzed_with;
  const educationLine = formatEducation(sessionData?.profile_data?.education);
  const candidateSkills =
    sessionData?.profile_data?.current_skills ||
    sessionData?.profile_data?.skills ||
    [];

  const tabs: Array<{
    id: WorkspaceTab;
    label: string;
    ready: boolean;
  }> = [
    { id: "all", label: "Full Ledger", ready: completedAgents.length > 0 },
    {
      id: "overview",
      label: "Overview & Gaps",
      ready: completedAgents.includes("gap") || completedAgents.includes("profile"),
    },
    {
      id: "market",
      label: "Market Intel",
      ready: completedAgents.includes("market"),
    },
    {
      id: "cv",
      label: "ATS CV Studio",
      ready: completedAgents.includes("cv_rewrite"),
    },
    {
      id: "roadmap",
      label: "30/60/90 Roadmap",
      ready: completedAgents.includes("roadmap"),
    },
  ];

  const showProfile =
    (activeTab === "all" || activeTab === "overview") &&
    completedAgents.includes("profile") &&
    sessionData?.profile_data;
  const showGap =
    (activeTab === "all" || activeTab === "overview") &&
    completedAgents.includes("gap") &&
    sessionData?.gap_data;
  const showMarket =
    (activeTab === "all" || activeTab === "market") &&
    completedAgents.includes("market") &&
    sessionData?.market_data;
  const showCV =
    (activeTab === "all" || activeTab === "cv") &&
    completedAgents.includes("cv_rewrite") &&
    sessionData?.cv_rewrite_data;
  const showRoadmap =
    (activeTab === "all" || activeTab === "roadmap") &&
    completedAgents.includes("roadmap") &&
    sessionData?.roadmap_data;

  return (
    <main className="flex-1 py-8 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto w-full bg-ink">
      {/* Status banner */}
      {status === "running" && (
        <div className="mb-6 px-5 py-3.5 rounded-sm bg-teal/10 border-l-4 border-teal text-parchment flex items-center justify-between gap-3 text-sm font-body animate-fadeInUp">
          <div className="flex items-center gap-3">
            <Loader2 className="w-4 h-4 text-teal animate-spin shrink-0" />
            <span>
              <span className="font-semibold text-teal font-mono uppercase tracking-wider">
                Career OS Active
              </span>{" "}
              — Parallel AI agents are analyzing your profile & live job market in real time.
            </span>
          </div>
          <span className="hidden sm:inline font-mono text-xs text-teal">
            {completedAgents.length}/5 complete
          </span>
        </div>
      )}
      {status === "complete" && (
        <div className="mb-6 px-5 py-3.5 rounded-sm bg-brass/10 border-l-4 border-brass text-parchment flex flex-wrap items-center justify-between gap-3 text-sm font-body animate-fadeInUp">
          <div className="flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-brass shrink-0" />
            <span>
              <span className="font-semibold text-brass font-mono uppercase tracking-wider">
                Analysis Complete
              </span>{" "}
              — Explore your workspace tabs, export your printable ATS CV, or start your AI mock interview.
            </span>
          </div>
          {analyzedWith?.model && (
            <span className="font-mono text-[11px] text-brass border border-brass/30 bg-brass/10 px-2.5 py-0.5 rounded-sm flex items-center gap-1.5">
              <Cpu size={11} />
              {analyzedWith.provider?.toUpperCase()} · {analyzedWith.model}
            </span>
          )}
        </div>
      )}

      {/* Executive KPI Strip */}
      {sessionData && (
        <div className="mb-8 bg-ink border border-brass/30 rounded-sm p-5 relative">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 mb-4 border-b border-warm-gray/15">
            <div>
              <span className="font-mono text-[11px] text-brass uppercase tracking-widest">
                Candidate Ledger
              </span>
              <h1 className="font-display text-2xl sm:text-3xl text-parchment">
                {sessionData.profile_data?.name || sessionData.target_role || "Career Analysis"}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
              {sessionData.target_role && (
                <span className="px-3 py-1 rounded-sm bg-parchment/5 border border-warm-gray/25 text-parchment">
                  Target: {sessionData.target_role}
                </span>
              )}
              {sessionData.target_city && (
                <span className="px-3 py-1 rounded-sm bg-teal/15 border border-teal/40 text-teal">
                  {sessionData.target_city}
                </span>
              )}
              {sessionData.market_data?.cache_hit && (
                <span className="px-2.5 py-1 rounded-sm bg-brass/10 border border-brass/30 text-brass text-[11px]">
                  ⚡ Cached Market Snapshot
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-sm bg-parchment/[0.04] border border-warm-gray/20">
              <span className="font-mono text-[10px] text-warm-gray uppercase tracking-wider block">
                Readiness Score
              </span>
              <span className="font-mono text-2xl font-bold text-brass mt-1 block">
                {typeof readinessScore === "number" ? `${readinessScore}/100` : "—"}
              </span>
            </div>

            <div className="p-3.5 rounded-sm bg-parchment/[0.04] border border-warm-gray/20">
              <span className="font-mono text-[10px] text-warm-gray uppercase tracking-wider block">
                ATS CV Score
              </span>
              <span className="font-mono text-2xl font-bold text-parchment mt-1 block">
                {typeof atsScore === "number" ? `${atsScore}/100` : "—"}
              </span>
            </div>

            <div className="p-3.5 rounded-sm bg-parchment/[0.04] border border-warm-gray/20">
              <span className="font-mono text-[10px] text-warm-gray uppercase tracking-wider block">
                {typeof jdMatchScore === "number" ? "Target JD Match" : "Market Demand"}
              </span>
              <span className="font-mono text-2xl font-bold text-teal mt-1 block">
                {typeof jdMatchScore === "number"
                  ? `${jdMatchScore}%`
                  : demandLevel || "—"}
              </span>
            </div>

            <div className="p-3.5 rounded-sm bg-parchment/[0.04] border border-warm-gray/20">
              <span className="font-mono text-[10px] text-warm-gray uppercase tracking-wider block">
                Est. Salary (PKR/mo)
              </span>
              <span className="font-mono text-lg sm:text-xl font-bold text-brass mt-1 block truncate">
                {salaryRange?.min
                  ? `${Math.round(salaryRange.min / 1000)}k – ${Math.round(
                      (salaryRange.max || salaryRange.min) / 1000
                    )}k`
                  : "—"}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column — Pipeline Stepper & Quick Actions (Span 4) */}
        <div className="lg:col-span-4 lg:sticky lg:top-24 flex flex-col gap-5">
          <PipelineProgress
            completedAgents={completedAgents}
            currentAgent={currentAgent}
            activeAgents={activeAgents}
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
                onClick={() => router.push(`/interview/${sessionId}`)}
                className="w-full py-3.5 px-4 rounded-sm bg-brass text-ink font-body font-semibold flex items-center justify-center gap-2.5 hover:bg-brass/90 transition-colors shadow-md cursor-pointer text-sm"
              >
                <MessageSquare size={16} /> Start AI Mock Interview
              </button>

              <button
                onClick={() => router.push(`/resume/${sessionId}`)}
                className="w-full py-3 px-4 rounded-sm bg-teal/20 border border-teal/50 text-parchment font-body font-semibold flex items-center justify-center gap-2.5 hover:bg-teal/30 transition-colors cursor-pointer text-sm"
              >
                <Printer size={16} className="text-brass" /> Printable ATS Resume (PDF)
              </button>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => router.push(`/dossier/${sessionId}`)}
                  className="py-3 px-3 rounded-sm border border-brass/40 text-brass bg-transparent font-body font-semibold flex items-center justify-center gap-1.5 hover:bg-brass/10 transition-colors cursor-pointer text-xs"
                >
                  <BookOpen size={14} /> View Dossier
                </button>
                <button
                  onClick={() => window.open(getDossierUrl(sessionId), "_blank")}
                  className="py-3 px-3 rounded-sm border border-brass/40 text-brass bg-transparent font-body font-semibold flex items-center justify-center gap-1.5 hover:bg-brass/10 transition-colors cursor-pointer text-xs"
                >
                  <Download size={14} /> Dossier PDF
                </button>
              </div>

              {/* Copy Session ID Card */}
              <div className="bg-parchment text-ink rounded-sm border border-brass/40 p-4 flex flex-col gap-2.5 shadow-md relative paper-grain mt-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold text-brass uppercase tracking-wider flex items-center gap-1.5">
                    <Key size={13} /> Session Reference ID
                  </span>
                  <span className="font-mono text-[10px] text-ink/50 bg-ink/5 px-2 py-0.5 rounded-sm">
                    Saved
                  </span>
                </div>

                <div className="p-2 bg-ink/5 border border-ink/15 rounded-sm font-mono text-[11px] text-ink/80 truncate select-all">
                  {sessionId}
                </div>

                <button
                  onClick={handleCopySessionId}
                  className="w-full py-2 px-3 rounded-sm border border-brass/40 text-brass hover:bg-brass/10 font-mono text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check size={14} className="text-teal" />
                      <span className="text-teal">Session ID Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copy Session ID</span>
                    </>
                  )}
                </button>

                <p className="font-body text-[11px] text-ink/60 leading-tight">
                  Keep this ID to return to your dashboard, mock interview, or ATS resume anytime via &quot;Resume Session&quot;.
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Main Analysis Column (Span 8) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Workspace Tabs */}
          {completedAgents.length > 0 && (
            <div className="flex flex-wrap gap-2 bg-ink/95 backdrop-blur-sm py-2 border-b border-warm-gray/15 sticky top-[65px] z-30">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-2 rounded-sm font-mono text-xs transition-colors flex items-center gap-2 cursor-pointer border ${
                    activeTab === tab.id
                      ? "bg-brass text-ink font-bold border-brass"
                      : tab.ready
                      ? "bg-parchment/5 text-parchment border-warm-gray/25 hover:border-brass/60"
                      : "bg-transparent text-warm-gray/50 border-warm-gray/15"
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.id !== "all" && tab.ready && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        activeTab === tab.id ? "bg-ink" : "bg-teal"
                      }`}
                    />
                  )}
                </button>
              ))}
            </div>
          )}

          {completedAgents.length === 0 && status !== "error" && (
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
                Ustaad is parsing your CV and querying Pakistani tech job boards concurrently. First insights appear in seconds.
              </p>
            </div>
          )}

          {/* Tab-specific waiting placeholder when user clicks an unfinished tab */}
          {completedAgents.length > 0 &&
            activeTab !== "all" &&
            !tabs.find((t) => t.id === activeTab)?.ready &&
            status === "running" && (
              <div className="p-8 rounded-sm bg-parchment/5 border border-brass/30 text-center flex flex-col items-center gap-3">
                <Loader2 className="w-6 h-6 text-brass animate-spin" />
                <p className="font-mono text-xs text-parchment">
                  Agent is currently computing this section...
                </p>
              </div>
            )}

          {/* Extracted Candidate Profile Snapshot */}
          {showProfile && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="bg-parchment text-ink rounded-sm border border-brass/30 p-6 relative flex flex-col gap-4 shadow-md paper-grain"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/15 pb-3">
                <h3 className="font-display text-xl text-ink flex items-center gap-2">
                  <User className="w-4 h-4 text-teal" /> Extracted Candidate Snapshot
                </h3>
                {typeof sessionData?.profile_data?.experience_years === "number" && (
                  <span className="font-mono text-xs bg-ink/5 border border-ink/15 px-2.5 py-0.5 rounded-sm">
                    {sessionData.profile_data.experience_years} yrs experience
                  </span>
                )}
              </div>

              {educationLine && (
                <p className="font-mono text-xs text-ink/75">
                  <strong className="text-ink uppercase">Education:</strong> {educationLine}
                </p>
              )}

              {candidateSkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {candidateSkills.slice(0, 18).map((sk, idx) => (
                    <span
                      key={`cand-sk-${idx}`}
                      className="font-mono text-[11px] bg-ink/5 border border-ink/15 text-ink px-2.5 py-0.5 rounded-sm"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Gap Analysis */}
          {showGap && sessionData?.gap_data && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <GapReport data={sessionData.gap_data} />
            </motion.div>
          )}

          {/* Market Snapshot */}
          {showMarket && sessionData?.market_data && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <MarketSnapshot data={sessionData.market_data} />
            </motion.div>
          )}

          {/* ATS CV Rewrite */}
          {showCV && sessionData?.cv_rewrite_data && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <CVComparison
                data={sessionData.cv_rewrite_data}
                originalSummary={sessionData.profile_data?.cv_summary_original || null}
                sessionId={sessionId}
              />
            </motion.div>
          )}

          {/* 30/60/90 Roadmap */}
          {showRoadmap && sessionData?.roadmap_data && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <RoadmapTimeline
                data={sessionData.roadmap_data}
                sessionId={sessionId}
                baseReadinessScore={readinessScore}
              />
            </motion.div>
          )}
        </div>
      </div>
    </main>
  );
}
