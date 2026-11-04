"use client";

import { useState } from "react";
import {
  Briefcase,
  Building2,
  ArrowUpRight,
  Calculator,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import AnimatedCounter from "./AnimatedCounter";

interface VerifiedJobLink {
  title: string;
  url: string;
  source: string;
  snippet?: string;
}

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
    verified_job_links?: VerifiedJobLink[];
    market_summary: string;
    live_data_available?: boolean;
    unverified?: boolean;
    cache_hit?: boolean;
  } | null;
}

/**
 * Progressive tax slabs for salaried individuals in Pakistan (FBR Finance Act baseline).
 */
function calculateFBRTax(annualSalary: number): {
  annualTax: number;
  monthlyTax: number;
  slabLabel: string;
} {
  let annualTax = 0;
  let slabLabel = "0% (Exempt below 600k/year)";

  if (annualSalary <= 600_000) {
    annualTax = 0;
    slabLabel = "0% (Exempt up to 600k PKR/yr)";
  } else if (annualSalary <= 1_200_000) {
    annualTax = (annualSalary - 600_000) * 0.05;
    slabLabel = "5% on amount over 600k";
  } else if (annualSalary <= 2_200_000) {
    annualTax = 30_000 + (annualSalary - 1_200_000) * 0.15;
    slabLabel = "30k + 15% on amount over 1.2M";
  } else if (annualSalary <= 3_200_000) {
    annualTax = 180_000 + (annualSalary - 2_200_000) * 0.25;
    slabLabel = "180k + 25% on amount over 2.2M";
  } else if (annualSalary <= 4_100_000) {
    annualTax = 430_000 + (annualSalary - 3_200_000) * 0.30;
    slabLabel = "430k + 30% on amount over 3.2M";
  } else {
    annualTax = 700_000 + (annualSalary - 4_100_000) * 0.35;
    slabLabel = "700k + 35% on amount over 4.1M";
  }

  const monthlyTax = Math.round(annualTax / 12);
  return { annualTax: Math.round(annualTax), monthlyTax, slabLabel };
}

export default function MarketSnapshot({ data }: MarketSnapshotProps) {
  const [showTaxCalc, setShowTaxCalc] = useState(false);
  const parsedMin = Number(data?.salary_range_pkr?.min);
  const parsedMax = Number(data?.salary_range_pkr?.max);
  const minSal = Number.isFinite(parsedMin) && parsedMin > 0 ? Math.round(parsedMin) : 80000;
  const maxSal =
    Number.isFinite(parsedMax) && parsedMax > minSal
      ? Math.round(parsedMax)
      : Math.max(200000, Math.round(minSal * 1.6));
  const [monthlyGross, setMonthlyGross] = useState<number>(() =>
    Math.round((minSal + maxSal) / 2)
  );
  const [copiedScript, setCopiedScript] = useState(false);

  if (!data) return null;

  const annualGross = monthlyGross * 12;
  const { annualTax, monthlyTax, slabLabel } = calculateFBRTax(annualGross);
  const monthlyNet = Math.max(0, monthlyGross - monthlyTax);
  const effectiveRate =
    annualGross > 0 ? ((annualTax / annualGross) * 100).toFixed(1) : "0.0";

  const hasRange = maxSal > minSal;
  const percentile = hasRange
    ? Math.min(
        100,
        Math.max(
          0,
          Math.round(((monthlyGross - minSal) / (maxSal - minSal)) * 100)
        )
      )
    : 50;

  const negotiationScript = `Based on current Pakistani tech market data for this role (PKR ${minSal.toLocaleString()} – ${maxSal.toLocaleString()}/month), my target is PKR ${monthlyGross.toLocaleString()} monthly gross, which aligns with local market benchmarks.`;

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(negotiationScript);
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    } catch {
      // Fallback
    }
  };

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
        <div className="flex items-center gap-2">
          {data.cache_hit && (
            <span
              className="font-mono text-[11px] font-semibold bg-ink/5 text-ink/70 border border-ink/20 px-2.5 py-1 rounded-sm"
              title="Re-used recent Pakistani market research"
            >
              Cached Intel
            </span>
          )}
          <span className="font-mono text-xs font-semibold bg-brass/20 text-ink border border-brass/40 px-3 py-1 rounded-sm">
            {data.market_demand_level} Demand
          </span>
        </div>
      </div>

      {/* Unverified / Offline Warning Banner */}
      {(data.live_data_available === false || data.unverified === true) && (
        <div className="p-3.5 rounded-sm bg-amber-500/10 border-l-4 border-amber-600 text-ink text-xs font-body flex items-start gap-2.5">
          <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
          <span>
            No live job-board data was available for this run — figures below are unverified AI estimates.
          </span>
        </div>
      )}

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

      {/* Collapsible PKR Net Take-Home & FBR Tax Estimator */}
      <div className="rounded-sm border border-brass/35 bg-brass/[0.04] overflow-hidden">
        <button
          type="button"
          onClick={() => setShowTaxCalc(!showTaxCalc)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-brass/[0.08] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Calculator size={16} className="text-brass" />
            <span className="font-mono text-xs font-bold text-ink uppercase tracking-wider">
              PKR Net Take-Home &amp; FBR Tax Estimator
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs text-brass font-semibold">
            <span>{showTaxCalc ? "Hide Calculator" : "Estimate Net Take-Home"}</span>
            {showTaxCalc ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </button>

        {showTaxCalc && (
          <div className="p-5 border-t border-brass/25 flex flex-col gap-5 animate-fadeInUp">
            {/* Slider & Presets */}
            <div className="flex flex-col gap-2.5">
              <div className="flex justify-between items-center font-mono text-xs">
                <span className="text-ink/70 font-semibold">Target Monthly Gross Salary:</span>
                <span className="font-bold text-base text-brass">
                  PKR {monthlyGross.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min={Math.max(30000, Math.round(minSal * 0.7))}
                max={Math.round(maxSal * 1.5)}
                step={5000}
                value={monthlyGross}
                onChange={(e) => setMonthlyGross(Number(e.target.value))}
                className="w-full accent-brass cursor-pointer"
              />
              <div className="flex flex-wrap gap-2 pt-1 font-mono text-[11px]">
                <button
                  type="button"
                  onClick={() => setMonthlyGross(minSal)}
                  className="px-2.5 py-1 rounded-sm border border-ink/15 bg-ink/5 hover:border-brass cursor-pointer"
                >
                  Min: {minSal.toLocaleString()}
                </button>
                <button
                  type="button"
                  onClick={() => setMonthlyGross(Math.round((minSal + maxSal) / 2))}
                  className="px-2.5 py-1 rounded-sm border border-ink/15 bg-ink/5 hover:border-brass cursor-pointer"
                >
                  Mid: {Math.round((minSal + maxSal) / 2).toLocaleString()}
                </button>
                <button
                  type="button"
                  onClick={() => setMonthlyGross(maxSal)}
                  className="px-2.5 py-1 rounded-sm border border-ink/15 bg-ink/5 hover:border-brass cursor-pointer"
                >
                  Max: {maxSal.toLocaleString()}
                </button>
              </div>
            </div>

            {/* Calculations Breakdown Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-sm bg-ink/[0.03] border border-ink/15 flex flex-col gap-1">
                <span className="font-mono text-[11px] text-ink/60 uppercase">Monthly Gross</span>
                <span className="font-mono text-base font-bold text-ink">
                  PKR {monthlyGross.toLocaleString()}
                </span>
                <span className="font-body text-[10px] text-ink/50">
                  Annual: PKR {(annualGross / 100000).toFixed(1)} Lacs
                </span>
              </div>

              <div className="p-3.5 rounded-sm bg-critical-red/[0.05] border border-critical-red/25 flex flex-col gap-1">
                <span className="font-mono text-[11px] text-critical-red uppercase">
                  Est. FBR Withholding
                </span>
                <span className="font-mono text-base font-bold text-critical-red">
                  - PKR {monthlyTax.toLocaleString()}
                </span>
                <span className="font-body text-[10px] text-ink/60">
                  {effectiveRate}% eff. ({slabLabel})
                </span>
              </div>

              <div className="p-3.5 rounded-sm bg-teal/[0.07] border border-teal/30 flex flex-col gap-1">
                <span className="font-mono text-[11px] text-teal uppercase font-bold">
                  Net Monthly In-Hand
                </span>
                <span className="font-mono text-lg font-bold text-teal">
                  PKR {monthlyNet.toLocaleString()}
                </span>
                <span className="font-body text-[10px] text-teal/80">
                  Annual Net: PKR {((monthlyNet * 12) / 100000).toFixed(1)} Lacs
                </span>
              </div>
            </div>

            {/* Market Percentile Bar */}
            <div className="p-3 rounded-sm bg-ink/[0.03] border border-ink/10 flex flex-col gap-1.5">
              <div className="flex justify-between items-center font-mono text-[11px]">
                <span className="text-ink/70 flex items-center gap-1">
                  <TrendingUp size={12} className="text-teal" /> Market Range Position:
                </span>
                <span className="font-bold text-brass">{percentile}th Percentile</span>
              </div>
              <div className="w-full h-1.5 bg-ink/10 rounded-sm overflow-hidden">
                <div
                  className="h-full bg-brass transition-all duration-300"
                  style={{ width: `${percentile}%` }}
                />
              </div>
            </div>

            {/* Negotiation Script Card */}
            <div className="p-3.5 rounded-sm bg-ink/[0.04] border border-ink/15 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="font-mono text-[11px] font-bold text-ink uppercase tracking-wider">
                  Copyable Salary Negotiation Script
                </span>
                <button
                  type="button"
                  onClick={handleCopyScript}
                  className="font-mono text-[11px] text-teal hover:text-brass flex items-center gap-1 cursor-pointer"
                >
                  {copiedScript ? (
                    <>
                      <Check size={12} className="text-teal" />
                      <span className="text-teal font-bold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Copy Script</span>
                    </>
                  )}
                </button>
              </div>
              <p className="font-body text-xs text-ink/80 italic leading-relaxed bg-parchment p-2.5 rounded-xs border border-ink/10">
                &ldquo;{negotiationScript}&rdquo;
              </p>
              <p className="font-body text-[10px] text-ink/50 leading-normal">
                * Advisory estimate based on Pakistani salaried income tax slabs. Actual payroll deductions may vary with probation terms, medical allowances, and provident fund contributions.
              </p>
            </div>
          </div>
        )}
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

      {/* Live Job Openings / Verified Job Links */}
      {((data.verified_job_links && data.verified_job_links.length > 0) ||
        (data.raw_job_listings && data.raw_job_listings.length > 0)) && (
        <div className="border-t border-ink/15 pt-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-mono text-xs font-semibold text-ink/60 uppercase tracking-wider flex items-center gap-1.5">
              <ArrowUpRight size={14} className="text-brass" />
              {data.verified_job_links && data.verified_job_links.length > 0
                ? "Live Pakistani Job Matches (Click to View / Apply)"
                : "Recent Openings in Pakistan"}
            </h4>
            {data.verified_job_links && data.verified_job_links.length > 0 && (
              <span className="font-mono text-[10px] text-teal bg-teal/10 border border-teal/30 px-2 py-0.5 rounded-xs font-bold">
                {data.verified_job_links.length} Active Listings
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.verified_job_links && data.verified_job_links.length > 0
              ? data.verified_job_links.slice(0, 6).map((job, idx) => (
                  <a
                    key={`verified-job-${idx}`}
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3.5 rounded-sm border border-ink/15 bg-ink/[0.03] hover:border-brass/70 hover:bg-brass/[0.04] flex flex-col justify-between gap-2 transition-all group cursor-pointer"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-body text-xs font-semibold text-ink group-hover:text-brass transition-colors line-clamp-1">
                          {job.title}
                        </span>
                        <ArrowUpRight
                          size={13}
                          className="text-ink/40 group-hover:text-brass group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0"
                        />
                      </div>
                      {job.snippet && (
                        <p className="font-body text-[11px] text-ink/65 line-clamp-2 leading-relaxed">
                          {job.snippet}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between font-mono text-[10px] pt-1.5 border-t border-ink/10">
                      <span className="text-teal font-bold bg-teal/15 px-1.5 py-0.5 rounded-xs border border-teal/25">
                        {job.source}
                      </span>
                      <span className="text-brass font-medium group-hover:underline">
                        Apply Link →
                      </span>
                    </div>
                  </a>
                ))
              : (data.raw_job_listings || []).slice(0, 4).map((job, idx) => (
                  <div
                    key={`job-${idx}`}
                    className="p-3.5 rounded-sm border border-ink/15 bg-ink/[0.03] flex flex-col gap-1 hover:border-brass transition-colors"
                  >
                    <span className="font-body text-xs font-semibold text-ink truncate">
                      {job.title}
                    </span>
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
