"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Map,
  Zap,
  FolderKanban,
  Clock,
  ExternalLink,
  CheckSquare,
  Square,
  TrendingUp,
} from "lucide-react";
import LedgerLine, { LedgerCheckpoint } from "./LedgerLine";

interface TaskDetail {
  task: string;
  resource: string;
  platform: string;
  estimated_hours: number;
}

interface WeekPlan {
  week: number;
  focus: string;
  tasks: TaskDetail[];
}

interface QuickWin {
  action: string;
  impact: string;
  time_required: string;
}

interface ProjectIdea {
  project_name: string;
  description: string;
  skills_demonstrated: string[];
  estimated_days: number;
}

interface RoadmapTimelineProps {
  data: {
    thirty_day_plan: WeekPlan[];
    sixty_day_plan: WeekPlan[];
    ninety_day_plan: WeekPlan[];
    quick_wins: QuickWin[];
    portfolio_projects_to_build: ProjectIdea[];
  } | null;
  sessionId?: string;
  baseReadinessScore?: number;
}

export default function RoadmapTimeline({
  data,
  sessionId,
  baseReadinessScore,
}: RoadmapTimelineProps) {
  const [activeTab, setActiveTab] = useState<"30" | "60" | "90">("30");
  const [completedKeys, setCompletedKeys] = useState<Record<string, boolean>>({});

  const storageKey = `ustaad_roadmap_progress_${sessionId || "default"}`;

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          setCompletedKeys(parsed);
        }
      }
    } catch {
      // Ignore malformed storage
    }
  }, [storageKey]);

  const toggleItem = (key: string) => {
    setCompletedKeys((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (!next[key]) delete next[key];
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          // Ignore storage quota errors
        }
      }
      return next;
    });
  };

  const progressStats = useMemo(() => {
    if (!data) return { done: 0, total: 0, ratio: 0 };
    let total = 0;
    let done = 0;

    const plans: Array<["30" | "60" | "90", WeekPlan[] | undefined]> = [
      ["30", data.thirty_day_plan],
      ["60", data.sixty_day_plan],
      ["90", data.ninety_day_plan],
    ];

    for (const [phase, weeks] of plans) {
      (weeks || []).forEach((w, wIdx) => {
        (w.tasks || []).forEach((_, tIdx) => {
          total += 1;
          if (completedKeys[`${phase}-w${wIdx}-t${tIdx}`]) {
            done += 1;
          }
        });
      });
    }

    (data.quick_wins || []).forEach((_, qIdx) => {
      total += 1;
      if (completedKeys[`qw-${qIdx}`]) {
        done += 1;
      }
    });

    return {
      done,
      total,
      ratio: total > 0 ? done / total : 0,
    };
  }, [data, completedKeys]);

  if (!data) return null;

  const currentPlan =
    activeTab === "30"
      ? data.thirty_day_plan
      : activeTab === "60"
      ? data.sixty_day_plan
      : data.ninety_day_plan;

  let foundFirstIncomplete = false;
  const checkpoints: LedgerCheckpoint[] = (currentPlan || []).map((week, wIdx) => {
    const tasks = week.tasks || [];
    const doneInWeek = tasks.filter(
      (_, tIdx) => completedKeys[`${activeTab}-w${wIdx}-t${tIdx}`]
    ).length;
    const isAllDone = tasks.length > 0 && doneInWeek === tasks.length;

    let status: "complete" | "active" | "pending" = "pending";
    if (isAllDone) {
      status = "complete";
    } else if (!foundFirstIncomplete) {
      status = "active";
      foundFirstIncomplete = true;
    }

    return {
      label: `Week ${week.week}: ${week.focus} (${doneInWeek}/${tasks.length})`,
      status,
    };
  });

  const hasBaseScore = typeof baseReadinessScore === "number";
  const projectedScore = hasBaseScore
    ? Math.min(98, Math.round(baseReadinessScore + progressStats.ratio * 22))
    : null;

  return (
    <div className="bg-parchment text-ink rounded-sm border border-brass/30 p-8 relative flex flex-col gap-6 shadow-md card-hover paper-grain">
      {/* Ledger corner ticks */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-brass z-10 pointer-events-none" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-brass z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-brass z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-brass z-10 pointer-events-none" />

      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-ink/15 pb-4 gap-4">
        <div>
          <h3 className="font-display text-2xl text-ink flex items-center gap-2.5">
            <Map className="w-5 h-5 text-teal" /> Interactive Learning Roadmap
          </h3>
          <p className="font-body text-xs text-ink/65 mt-0.5">
            Check off completed study tasks — progress saves automatically in your browser.
          </p>
        </div>

        {/* Tab Row */}
        <div className="flex gap-2 font-mono text-xs">
          {(["30", "60", "90"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-sm border transition-colors cursor-pointer ${
                activeTab === tab
                  ? "bg-brass text-ink font-bold border-brass"
                  : "bg-ink/5 text-ink/70 border-ink/15 hover:border-brass"
              }`}
            >
              {tab}-Day Plan
            </button>
          ))}
        </div>
      </div>

      {/* Live Progress & Projected Readiness Bar */}
      {progressStats.total > 0 && (
        <div className="p-4 rounded-sm bg-ink/[0.04] border border-ink/15 flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
            <span className="text-ink/80 font-semibold flex items-center gap-1.5">
              <TrendingUp size={14} className="text-teal" />
              Roadmap Progress: {progressStats.done} / {progressStats.total} tasks (
              {Math.round(progressStats.ratio * 100)}%)
            </span>
            {projectedScore !== null && (
              <span className="text-ink font-bold bg-brass/20 border border-brass/40 px-2.5 py-0.5 rounded-sm">
                Projected Readiness: {baseReadinessScore} →{" "}
                <span className="text-teal">{projectedScore}/100</span>
              </span>
            )}
          </div>
          <div className="w-full h-2 bg-ink/10 rounded-sm overflow-hidden">
            <div
              className="h-full bg-teal transition-all duration-300"
              style={{ width: `${Math.round(progressStats.ratio * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Vertical Ledger Line for Week Timeline */}
      {checkpoints.length > 0 && (
        <div className="py-2 px-2">
          <LedgerLine
            orientation="vertical"
            variant="on-parchment"
            checkpoints={checkpoints}
          />
        </div>
      )}

      {/* Week Plan Task Cards */}
      <div className="flex flex-col gap-6">
        {currentPlan && currentPlan.length > 0 ? (
          currentPlan.map((week, idx) => (
            <div
              key={`week-${activeTab}-${idx}`}
              className="border-l-2 border-brass pl-4 py-1 flex flex-col gap-3"
            >
              <div>
                <span className="font-mono text-xs font-bold text-brass uppercase">
                  Week {week.week}
                </span>
                <h4 className="font-display text-lg text-ink">{week.focus}</h4>
              </div>

              <div className="flex flex-col gap-2">
                {week.tasks.map((task, tidx) => {
                  const itemKey = `${activeTab}-w${idx}-t${tidx}`;
                  const isChecked = !!completedKeys[itemKey];
                  return (
                    <button
                      type="button"
                      key={`task-${activeTab}-${idx}-${tidx}`}
                      onClick={() => toggleItem(itemKey)}
                      className={`p-3.5 rounded-sm border text-left flex items-center justify-between gap-4 transition-colors cursor-pointer ${
                        isChecked
                          ? "border-teal/40 bg-teal/10"
                          : "border-ink/15 bg-ink/[0.03] hover:border-brass/60"
                      }`}
                    >
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        {isChecked ? (
                          <CheckSquare size={16} className="text-teal shrink-0 mt-0.5" />
                        ) : (
                          <Square size={16} className="text-ink/40 shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0">
                          <p
                            className={`font-body text-xs font-semibold leading-tight ${
                              isChecked ? "line-through text-ink/60" : "text-ink"
                            }`}
                          >
                            {task.task}
                          </p>
                          <p className="font-mono text-[11px] text-ink/60 flex items-center gap-1.5 mt-1">
                            <ExternalLink size={10} />
                            {task.resource} · {task.platform}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-xs text-brass font-semibold shrink-0 flex items-center gap-1 bg-ink/5 px-2.5 py-1 rounded-sm">
                        <Clock size={10} /> {task.estimated_hours}h
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <p className="font-body text-xs text-ink/60 italic text-center py-6">
            No tasks found for this phase.
          </p>
        )}
      </div>

      {/* Quick Wins */}
      {data.quick_wins && data.quick_wins.length > 0 && (
        <div className="border-t border-ink/15 pt-5">
          <h4 className="font-mono text-xs font-semibold text-brass uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-brass" /> Quick Wins (Under 1 Week)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.quick_wins.map((win, idx) => {
              const qwKey = `qw-${idx}`;
              const isChecked = !!completedKeys[qwKey];
              return (
                <button
                  type="button"
                  key={qwKey}
                  onClick={() => toggleItem(qwKey)}
                  className={`p-3.5 rounded-sm border text-left flex flex-col gap-1.5 transition-colors cursor-pointer ${
                    isChecked
                      ? "border-teal/40 bg-teal/10"
                      : "border-brass/30 bg-brass/10 hover:border-brass"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {isChecked ? (
                      <CheckSquare size={14} className="text-teal shrink-0 mt-0.5" />
                    ) : (
                      <Square size={14} className="text-ink/50 shrink-0 mt-0.5" />
                    )}
                    <p
                      className={`font-body text-xs font-bold ${
                        isChecked ? "line-through text-ink/60" : "text-ink"
                      }`}
                    >
                      {win.action}
                    </p>
                  </div>
                  <div className="flex justify-between items-center font-mono text-[11px] text-ink/70 pl-5">
                    <span className="flex items-center gap-1">
                      <Clock size={10} /> {win.time_required}
                    </span>
                    <span className="font-semibold text-teal">Impact: {win.impact}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Suggested Portfolio Projects */}
      {data.portfolio_projects_to_build &&
        data.portfolio_projects_to_build.length > 0 && (
          <div className="border-t border-ink/15 pt-5">
            <h4 className="font-mono text-xs font-semibold text-ink/60 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <FolderKanban className="w-4 h-4 text-teal" /> Suggested Portfolio Projects
            </h4>
            <div className="flex flex-col gap-3">
              {data.portfolio_projects_to_build.map((project, idx) => (
                <div
                  key={`proj-${idx}`}
                  className="p-4 rounded-sm border border-ink/15 bg-ink/[0.03] flex flex-col gap-2"
                >
                  <div className="flex justify-between items-start gap-2">
                    <h5 className="font-display text-base text-ink">
                      {project.project_name}
                    </h5>
                    <span className="font-mono text-xs bg-ink/10 text-ink border border-ink/20 px-2.5 py-0.5 rounded-sm shrink-0">
                      ~{project.estimated_days}d
                    </span>
                  </div>
                  <p className="font-body text-xs text-ink/70 leading-relaxed">
                    {project.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {project.skills_demonstrated.map((sk, si) => (
                      <span
                        key={`proj-${idx}-sk-${si}`}
                        className="font-body text-[11px] bg-parchment border border-ink/15 text-ink/80 px-2 py-0.5 rounded-sm"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}
