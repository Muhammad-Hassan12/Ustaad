"use client";

import { useState } from "react";
import { Map, Zap, Projector, Calendar, Clock, ExternalLink } from "lucide-react";

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

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col gap-6 transition-all duration-300">
      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Map className="w-5 h-5 text-indigo-500" /> Learning Path Roadmap
        </h3>
        
        {/* Tab switchers */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/20">
          {(["30", "60", "90"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                activeTab === tab
                  ? "bg-white dark:bg-slate-950 text-slate-850 dark:text-slate-100 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
              }`}
            >
              {tab} Days
            </button>
          ))}
        </div>
      </div>

      {/* Week Timeline */}
      <div className="flex flex-col gap-5 relative">
        {currentPlan && currentPlan.length > 0 ? (
          currentPlan.map((week, idx) => (
            <div key={idx} className="relative pl-6 flex flex-col gap-3">
              {/* Timeline dot */}
              <div className="absolute top-1.5 left-0 w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-white dark:border-slate-950" />
              
              <div>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  Week {week.week}
                </span>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {week.focus}
                </h4>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {week.tasks.map((task, tidx) => (
                  <div
                    key={tidx}
                    className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100/30 dark:hover:bg-slate-900/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex flex-col gap-1 max-w-[80%]">
                      <p className="font-semibold text-slate-750 dark:text-slate-300">
                        {task.task}
                      </p>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1">
                        <ExternalLink size={10} /> {task.resource} ({task.platform})
                      </p>
                    </div>
                    <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 font-medium">
                      <Clock size={10} /> {task.estimated_hours}h
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-slate-400 text-center py-4">No timeline tasks found.</p>
        )}
      </div>

      {/* Quick Wins */}
      {data.quick_wins && data.quick_wins.length > 0 && (
        <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
          <h4 className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500" /> Quick Wins (Under 1 Week)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.quick_wins.map((win, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-150 dark:border-slate-800/60 flex flex-col gap-1"
              >
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {win.action}
                </p>
                <div className="flex gap-4 mt-1 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar size={10} /> {win.time_required}
                  </span>
                  <span className="font-medium text-indigo-500">
                    Impact: {win.impact}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Portfolio projects */}
      {data.portfolio_projects_to_build && data.portfolio_projects_to_build.length > 0 && (
        <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
          <h4 className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Projector className="w-4 h-4 text-indigo-500" /> Suggested Portfolio Projects
          </h4>
          <div className="flex flex-col gap-3">
            {data.portfolio_projects_to_build.map((project, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-150 dark:border-slate-800/60 bg-slate-50/20 dark:bg-slate-900/10 flex flex-col gap-2"
              >
                <div className="flex justify-between items-center">
                  <h5 className="text-xs font-bold text-slate-850 dark:text-slate-255">
                    {project.project_name}
                  </h5>
                  <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 px-2.5 py-0.5 rounded-md font-semibold">
                    ~{project.estimated_days} days
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {project.skills_demonstrated.map((sk) => (
                    <span
                      key={sk}
                      className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-450 rounded"
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
