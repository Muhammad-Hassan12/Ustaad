"use client";

import { useState } from "react";
import { Map, Zap, FolderKanban, Clock, ExternalLink, CheckCircle2 } from "lucide-react";

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

  const tabColors: Record<string, string> = {
    "30": "from-indigo-500 to-indigo-600",
    "60": "from-violet-500 to-violet-600",
    "90": "from-purple-500 to-purple-600",
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col transition-all duration-300 overflow-hidden">

      {/* Header with Tab Switcher */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800/80 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Map className="w-5 h-5 text-indigo-500" /> Learning Roadmap
          </h3>
        </div>

        {/* Tab Row */}
        <div className="flex gap-2">
          {(["30", "60", "90"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab
                  ? `bg-gradient-to-r ${tabColors[tab]} text-white shadow-md`
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {tab}-Day Plan
            </button>
          ))}
        </div>
      </div>

      {/* Week Timeline */}
      <div className="p-6">
        <div className="flex flex-col gap-0">
          {currentPlan && currentPlan.length > 0 ? (
            currentPlan.map((week, idx) => (
              <div key={`week-${activeTab}-${idx}`} className="relative flex gap-4">
                {/* Timeline stem — runs between dots */}
                <div className="flex flex-col items-center">
                  {/* Dot */}
                  <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/30 border-2 border-indigo-500 flex items-center justify-center shrink-0 z-10">
                    <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400">{week.week}</span>
                  </div>
                  {/* Stem line below (not for last item) */}
                  {idx < currentPlan.length - 1 && (
                    <div className="w-0.5 flex-1 bg-indigo-100 dark:bg-indigo-900/40 mt-0" style={{ minHeight: "24px" }} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-6 min-w-0">
                  <div className="mb-3">
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Week {week.week}</span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">{week.focus}</h4>
                  </div>

                  <div className="flex flex-col gap-2">
                    {week.tasks.map((task, tidx) => (
                      <div
                        key={`task-${activeTab}-${idx}-${tidx}`}
                        className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/50 hover:border-indigo-200 dark:hover:border-indigo-800/60 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/5 transition-all group text-xs"
                      >
                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                          <CheckCircle2 size={13} className="text-slate-300 dark:text-slate-700 group-hover:text-indigo-400 shrink-0 mt-0.5 transition-colors" />
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 dark:text-slate-200 leading-tight">{task.task}</p>
                            <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <ExternalLink size={9} />
                              {task.resource}
                              <span className="text-slate-300 dark:text-slate-700">·</span>
                              {task.platform}
                            </p>
                          </div>
                        </div>
                        <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] whitespace-nowrap">
                          <Clock size={9} /> {task.estimated_hours}h
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 text-center py-8">No timeline tasks found for this period.</p>
          )}
        </div>
      </div>

      {/* Quick Wins */}
      {data.quick_wins && data.quick_wins.length > 0 && (
        <div className="px-6 pb-6 border-t border-slate-100 dark:border-slate-800 pt-5">
          <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" /> Quick Wins (Under 1 Week)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.quick_wins.map((win, idx) => (
              <div
                key={`qw-${idx}`}
                className="p-3.5 rounded-xl border border-amber-100/60 dark:border-amber-900/20 bg-amber-50/20 dark:bg-amber-950/5 flex flex-col gap-1.5"
              >
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{win.action}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock size={9} /> {win.time_required}
                  </span>
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    Impact: {win.impact}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Portfolio Projects */}
      {data.portfolio_projects_to_build && data.portfolio_projects_to_build.length > 0 && (
        <div className="px-6 pb-6 border-t border-slate-100 dark:border-slate-800 pt-5">
          <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <FolderKanban className="w-3.5 h-3.5 text-indigo-500" /> Suggested Portfolio Projects
          </h4>
          <div className="flex flex-col gap-3">
            {data.portfolio_projects_to_build.map((project, idx) => (
              <div
                key={`proj-${idx}`}
                className="p-4 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-900/20 flex flex-col gap-2"
              >
                <div className="flex justify-between items-start gap-2">
                  <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">{project.project_name}</h5>
                  <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 px-2.5 py-0.5 rounded-lg font-bold shrink-0">
                    ~{project.estimated_days}d
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{project.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {project.skills_demonstrated.map((sk, si) => (
                    <span
                      key={`proj-${idx}-sk-${si}`}
                      className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400 rounded-md font-medium"
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
