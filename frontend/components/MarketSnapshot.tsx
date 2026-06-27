"use client";

import { Briefcase, TrendingUp, Building2, Compass, ArrowUpRight } from "lucide-react";

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

const getDemandConfig = (level: string) => {
  switch (level?.toLowerCase()) {
    case "high":
    case "very high":
      return {
        badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/30 dark:border-emerald-800/30",
        bar: "bg-emerald-500",
        width: "w-full",
      };
    case "medium":
    case "moderate":
      return {
        badge: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/30 dark:border-amber-800/30",
        bar: "bg-amber-500",
        width: "w-2/3",
      };
    default:
      return {
        badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200/30 dark:border-slate-700/30",
        bar: "bg-slate-400",
        width: "w-1/3",
      };
  }
};

export default function MarketSnapshot({ data }: MarketSnapshotProps) {
  if (!data) return null;

  const demandConfig = getDemandConfig(data.market_demand_level);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col gap-6 transition-all duration-300">

      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-indigo-500" /> Market Intelligence
        </h3>
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${demandConfig.badge}`}>
          {data.market_demand_level} Demand
        </span>
      </div>

      {/* Demand Level Bar */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Market Demand</span>
          <span className="text-[10px] font-semibold text-slate-500">{data.market_demand_level}</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
          <div className={`${demandConfig.bar} ${demandConfig.width} h-2 rounded-full transition-all duration-700`} />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Salary Range</p>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
              PKR {data.salary_range_pkr?.min?.toLocaleString()}
              <span className="text-slate-400 font-normal text-xs mx-1">–</span>
              {data.salary_range_pkr?.max?.toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-400">/month</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60">
          <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center shrink-0">
            <Compass className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Remote Work</p>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {data.remote_percentage || "N/A"}
            </p>
            <p className="text-[10px] text-slate-400">of listings</p>
          </div>
        </div>
      </div>

      {/* Market Summary */}
      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic bg-indigo-50/20 dark:bg-slate-800/30 p-4 rounded-xl border border-indigo-100/15 dark:border-slate-700/30">
        &ldquo;{data.market_summary}&rdquo;
      </p>

      {/* Required Skills */}
      <div>
        <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">
          Required Tech Stack
        </h4>
        <div className="flex flex-wrap gap-2">
          {data.top_required_skills.map((skill, i) => (
            <span
              key={`req-skill-${i}`}
              className="px-2.5 py-1 rounded-lg text-xs bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border border-indigo-100/20 dark:border-indigo-900/20 font-medium"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Nice-to-have skills */}
      {data.nice_to_have_skills && data.nice_to_have_skills.length > 0 && (
        <div>
          <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">
            Nice to Have
          </h4>
          <div className="flex flex-wrap gap-2">
            {data.nice_to_have_skills.map((skill, i) => (
              <span
                key={`nice-skill-${i}`}
                className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium border border-slate-200/30 dark:border-slate-700/30"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Top Hiring Companies */}
      {data.top_hiring_companies && data.top_hiring_companies.length > 0 && (
        <div>
          <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
            <Building2 size={11} /> Top Hiring Companies
          </h4>
          <div className="flex flex-wrap gap-2">
            {data.top_hiring_companies.map((company, i) => (
              <span
                key={`company-${i}`}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200/30 dark:border-slate-700/30"
              >
                {company}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Live Job Listings */}
      {data.raw_job_listings && data.raw_job_listings.length > 0 && (
        <div>
          <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <ArrowUpRight size={11} className="text-indigo-500" /> Recent Openings in Pakistan
          </h4>
          <div className="flex flex-col gap-2">
            {data.raw_job_listings.slice(0, 4).map((job, idx) => (
              <div
                key={`job-${idx}`}
                className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-3 hover:border-indigo-200 dark:hover:border-indigo-800/60 hover:bg-indigo-50/10 dark:hover:bg-indigo-950/5 transition-all"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{job.title}</span>
                  <span className="text-[10px] text-indigo-500 font-medium">{job.company}</span>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0 hidden sm:block">{job.location}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
