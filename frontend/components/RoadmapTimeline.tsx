"use client";

import { useState } from "react";
import { Map, Zap, FolderKanban, Clock, ExternalLink, CheckCircle2 } from "lucide-react";
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
}

export default function RoadmapTimeline({ data }: RoadmapTimelineProps) {
  const [activeTab, setActiveTab] = useState<"30" | "60" | "90">("30");

  if (!data) return null;

  const currentPlan =
    activeTab === "30"
      ? data.thirty_day_plan
      : activeTab === "60"
      ? data.sixty_day_plan
      : data.ninety_day_plan;

  const checkpoints: LedgerCheckpoint[] = (currentPlan || []).map((week) => ({
    label: `Week ${week.week}: ${week.focus}`,
    status: "pending",
  }));

  return (
    <div className="bg-parchment text-ink rounded-sm border border-brass/30 p-8 relative flex flex-col gap-6 shadow-md card-hover paper-grain">
      {/* Ledger corner ticks */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-brass z-10 pointer-events-none" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-brass z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-brass z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-brass z-10 pointer-events-none" />

      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-ink/15 pb-4 gap-4">
        <h3 className="font-display text-2xl text-ink flex items-center gap-2.5">
          <Map className="w-5 h-5 text-teal" /> Learning Roadmap
        </h3>

        {/* Tab Row */}
        <div className="flex gap-2 font-mono text-xs">
          {(["30", "60", "90"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-sm border transition-colors ${
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

      {/* Vertical Ledger Line for Week Timeline */}
      {checkpoints.length > 0 && (
        <div className="py-2 px-2">
          <LedgerLine orientation="vertical" checkpoints={checkpoints} />
        </div>
      )}

      {/* Week Plan Task Cards */}
      <div className="flex flex-col gap-6">
        {currentPlan && currentPlan.length > 0 ? (
          currentPlan.map((week, idx) => (
            <div key={`week-${activeTab}-${idx}`} className="border-l-2 border-brass pl-4 py-1 flex flex-col gap-3">
              <div>
                <span className="font-mono text-xs font-bold text-brass uppercase">Week {week.week}</span>
                <h4 className="font-display text-lg text-ink">{week.focus}</h4>
              </div>

              <div className="flex flex-col gap-2">
                {week.tasks.map((task, tidx) => (
                  <div
                    key={`task-${activeTab}-${idx}-${tidx}`}
                    className="p-3.5 rounded-sm border border-ink/15 bg-ink/[0.03] flex items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <CheckCircle2 size={15} className="text-teal shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="font-body text-xs font-semibold text-ink leading-tight">{task.task}</p>
                        <p className="font-mono text-[11px] text-ink/60 flex items-center gap-1.5 mt-1">
                          <ExternalLink size={10} />
                          {task.resource} · {task.platform}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-xs text-brass font-semibold shrink-0 flex items-center gap-1 bg-ink/5 px-2.5 py-1 rounded-sm">
                      <Clock size={10} /> {task.estimated_hours}h
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <p className="font-body text-xs text-ink/60 italic text-center py-6">No tasks found for this phase.</p>
        )}
      </div>

      {/* Quick Wins */}
      {data.quick_wins && data.quick_wins.length > 0 && (
        <div className="border-t border-ink/15 pt-5">
          <h4 className="font-mono text-xs font-semibold text-brass uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-brass" /> Quick Wins (Under 1 Week)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.quick_wins.map((win, idx) => (
              <div
                key={`qw-${idx}`}
                className="p-3.5 rounded-sm border border-brass/30 bg-brass/10 flex flex-col gap-1.5"
              >
                <p className="font-body text-xs font-bold text-ink">{win.action}</p>
                <div className="flex justify-between items-center font-mono text-[11px] text-ink/70">
                  <span className="flex items-center gap-1"><Clock size={10} /> {win.time_required}</span>
                  <span className="font-semibold text-teal">Impact: {win.impact}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Portfolio Projects */}
      {data.portfolio_projects_to_build && data.portfolio_projects_to_build.length > 0 && (
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
                  <h5 className="font-display text-base text-ink">{project.project_name}</h5>
                  <span className="font-mono text-xs bg-ink/10 text-ink border border-ink/20 px-2.5 py-0.5 rounded-sm shrink-0">
                    ~{project.estimated_days}d
                  </span>
                </div>
                <p className="font-body text-xs text-ink/70 leading-relaxed">{project.description}</p>
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
