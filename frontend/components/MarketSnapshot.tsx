"use client";

import { Briefcase, DollarSign, Building, Compass } from "lucide-react";

interface JobListing {
  title: string;
  company: string;
  location: string;
  snippet?: string;
}

interface MarketSnapshotProps {
  data: {
    market_demand_level: string;
    top_required_skills: string[];
    nice_to_have_skills?: string[];
    top_hiring_companies: string[];
    salary_range_pkr: { min: number; max: number };
    remote_percentage?: string;
    raw_job_listings?: JobListing[];
    market_summary: string;
  } | null;
}

export default function MarketSnapshot({ data }: MarketSnapshotProps) {
  if (!data) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col gap-6 transition-all duration-300">
      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-indigo-500" /> Market Intelligence Snapshot
        </h3>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            data.market_demand_level === "High"
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
              : data.market_demand_level === "Medium"
              ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400"
              : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400"
          }`}
        >
          Demand: {data.market_demand_level}
        </span>
      </div>

      {/* Salary & Remote Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-850">
          <DollarSign className="w-8 h-8 text-indigo-500" />
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Est. Salary Range</p>
            <p className="text-sm font-bold text-slate-850 dark:text-slate-200">
              PKR {data.salary_range_pkr.min.toLocaleString()} - {data.salary_range_pkr.max.toLocaleString()} <span className="text-xs font-normal text-slate-500">/mo</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-850">
          <Building className="w-8 h-8 text-purple-500" />
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Remote Percentage</p>
            <p className="text-sm font-bold text-slate-850 dark:text-slate-200">
              {data.remote_percentage || "N/A"} of listings
            </p>
          </div>
        </div>
      </div>

      {/* Market Summary Text */}
      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic bg-indigo-50/20 dark:bg-slate-850 p-4 rounded-xl border border-indigo-100/10">
        &ldquo;{data.market_summary}&rdquo;
      </p>

      {/* Top Skills Tags */}
      <div>
        <h4 className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider mb-2">
          Required Tech Stack Core
        </h4>
        <div className="flex flex-wrap gap-2">
          {data.top_required_skills.map((skill) => (
            <span
              key={skill}
              className="px-2.5 py-1 rounded-lg text-xs bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border border-indigo-100/20 dark:border-indigo-900/10 font-medium"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Raw Listings */}
      {data.raw_job_listings && data.raw_job_listings.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider mb-3">
            Recent Openings in Pakistan
          </h4>
          <div className="flex flex-col gap-3">
            {data.raw_job_listings.slice(0, 3).map((job, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border border-slate-150 dark:border-slate-800/60 flex flex-col gap-1 hover:border-slate-300 dark:hover:border-slate-700/60 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {job.title}
                  </span>
                  <span className="text-[10px] text-slate-500">{job.location}</span>
                </div>
                <span className="text-[10px] text-indigo-500 font-medium">{job.company}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
