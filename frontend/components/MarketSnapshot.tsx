"use client";

import { Briefcase, Building2, ArrowUpRight } from "lucide-react";
import AnimatedCounter from "./AnimatedCounter";

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
    <div className="bg-parchment text-ink rounded-sm border border-brass/30 p-8 relative flex flex-col gap-6 shadow-md card-hover paper-grain">
      {/* Ledger corner ticks */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-brass z-10 pointer-events-none" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-brass z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-brass z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-brass z-10 pointer-events-none" />

      {/* Header */}
      <div className="flex justify-between items-center border-b border-ink/15 pb-4">
        <h3 className="font-display text-2xl text-ink flex items-center gap-2.5">
          <Briefcase className="w-5 h-5 text-teal" /> Market Intelligence
        </h3>
        <span className="font-mono text-xs font-semibold bg-brass/20 text-ink border border-brass/40 px-3 py-1 rounded-sm">
          {data.market_demand_level} Demand
        </span>
      </div>

      {/* Key Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-ink/5 p-6 rounded-sm border border-ink/10">
        <div>
          <span className="font-mono text-xs text-ink/60 uppercase tracking-wider block mb-1">
            Estimated Salary Range
          </span>
          <p className="font-mono text-2xl md:text-3xl text-brass font-bold">
            PKR <AnimatedCounter value={data.salary_range_pkr?.min || 0} className="font-mono" />
            <span className="text-ink/40 font-normal text-lg mx-1">–</span>
            <AnimatedCounter value={data.salary_range_pkr?.max || 0} className="font-mono" />
          </p>
          <p className="font-body text-xs text-ink/50 mt-0.5">per month</p>
        </div>

        <div>
          <span className="font-mono text-xs text-ink/60 uppercase tracking-wider block mb-1">
            Remote Opportunities
          </span>
          <p className="font-mono text-2xl md:text-3xl text-teal font-bold">
            {data.remote_percentage || "N/A"}
          </p>
          <p className="font-body text-xs text-ink/50 mt-0.5">of Pakistani job postings</p>
        </div>
      </div>

      {/* Market Summary */}
      <div className="border-l-2 border-brass pl-4 py-1">
        <p className="font-body text-sm text-ink/80 leading-relaxed italic">
          &ldquo;{data.market_summary}&rdquo;
        </p>
      </div>

      {/* Required Tech Stack */}
      <div>
        <h4 className="font-mono text-xs font-semibold text-ink/60 uppercase tracking-wider mb-3">
          Required Tech Stack
        </h4>
        <div className="flex flex-wrap gap-2">
          {data.top_required_skills.map((skill, i) => (
            <span
              key={`req-skill-${i}`}
              className="font-body text-xs bg-ink/10 text-ink border border-ink/20 px-3 py-1 rounded-sm"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Nice to Have */}
      {data.nice_to_have_skills && data.nice_to_have_skills.length > 0 && (
        <div>
          <h4 className="font-mono text-xs font-semibold text-ink/60 uppercase tracking-wider mb-3">
            Nice to Have
          </h4>
          <div className="flex flex-wrap gap-2">
            {data.nice_to_have_skills.map((skill, i) => (
              <span
                key={`nice-skill-${i}`}
                className="font-body text-xs bg-ink/5 text-ink/70 border border-ink/10 px-3 py-1 rounded-sm"
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
          <h4 className="font-mono text-xs font-semibold text-ink/60 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Building2 size={14} className="text-teal" /> Top Hiring Companies
          </h4>
          <div className="flex flex-wrap gap-2">
            {data.top_hiring_companies.map((company, i) => (
              <span
                key={`company-${i}`}
                className="font-body text-xs font-medium bg-parchment text-ink border border-brass/40 px-3 py-1 rounded-sm"
              >
                {company}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Live Job Openings */}
      {data.raw_job_listings && data.raw_job_listings.length > 0 && (
        <div className="border-t border-ink/15 pt-5">
          <h4 className="font-mono text-xs font-semibold text-ink/60 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <ArrowUpRight size={14} className="text-brass" /> Recent Openings in Pakistan
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.raw_job_listings.slice(0, 4).map((job, idx) => (
              <div
                key={`job-${idx}`}
                className="p-3.5 rounded-sm border border-ink/15 bg-ink/[0.03] flex flex-col gap-1 hover:border-brass transition-colors"
              >
                <span className="font-body text-xs font-semibold text-ink truncate">{job.title}</span>
                <div className="flex justify-between items-center font-mono text-[11px] text-ink/60">
                  <span>{job.company}</span>
                  <span>{job.location}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
