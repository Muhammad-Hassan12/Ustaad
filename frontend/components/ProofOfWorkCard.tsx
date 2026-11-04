"use client";

import Image from "next/image";
import {
  Globe,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Star,
  GitCommit,
  Sparkles,
  Layers,
  Search,
} from "lucide-react";

export function GithubIcon({
  className = "w-4 h-4",
  size = 16,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      fill="currentColor"
      width={size}
      height={size}
      className={className}
    >
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

export interface GitHubRepoItem {
  name: string;
  url?: string;
  html_url?: string;
  description?: string | null;
  stars: number;
  language?: string | null;
  has_demo?: boolean;
  homepage?: string | null;
  pushed_at?: string | null;
}

export interface GitHubAuditData {
  status:
    | "ok"
    | "not_found"
    | "rate_limited"
    | "unreachable"
    | "invalid_username"
    | "error";
  username: string;
  name?: string | null;
  avatar_url?: string | null;
  profile_url?: string | null;
  html_url?: string | null;
  bio?: string | null;
  blog?: string | null;
  public_repos?: number;
  followers?: number;
  top_languages?: string[];
  active_within_90_days?: boolean;
  latest_push?: string | null;
  original_repos_checked?: number;
  repos_with_description?: number;
  repos_with_live_demo?: number;
  standout_repos?: GitHubRepoItem[];
  audit_findings?: string[];
}

export interface PortfolioAuditData {
  status: "ok" | "blocked_url" | "unreachable" | "http_error" | "error";
  url: string;
  canonical_url?: string;
  http_status?: number | null;
  title?: string | null;
  meta_description?: string | null;
  uses_https?: boolean;
  has_open_graph?: boolean;
  og_image?: string | null;
  has_github_link?: boolean;
  has_linkedin_link?: boolean;
  has_contact_cta?: boolean;
  is_empty_spa_shell?: boolean;
  headings?: string[];
  headings_sample?: string[];
  audit_findings?: string[];
}

export interface ProofOfWorkProps {
  data: {
    source?: "manual_input" | "cv_extracted" | "auto" | string;
    github?: GitHubAuditData | null;
    portfolio?: PortfolioAuditData | null;
    audit_findings?: string[];
    prompt_digest?: string;
  };
}

function getValidGithubAvatarUrl(rawUrl?: string | null): string | null {
  if (!rawUrl) return null;
  try {
    const parsed = new URL(rawUrl);
    if (
      parsed.protocol === "https:" &&
      (parsed.hostname === "avatars.githubusercontent.com" ||
        parsed.hostname === "github.com")
    ) {
      return parsed.toString();
    }
  } catch {
    return null;
  }
  return null;
}

export default function ProofOfWorkCard({ data }: ProofOfWorkProps) {
  const { github, portfolio, audit_findings = [], source } = data || {};

  if (!github && !portfolio && audit_findings.length === 0) {
    return null;
  }

  const isCVSource = source !== "manual_input";
  const githubProfileLink = github?.profile_url || github?.html_url || null;
  const safeAvatarUrl = getValidGithubAvatarUrl(github?.avatar_url);

  return (
    <div className="bg-parchment text-ink border border-brass/40 rounded-sm p-6 sm:p-7 relative shadow-md paper-grain flex flex-col gap-6">
      {/* Editorial corner accents */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-brass z-10 pointer-events-none" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-brass z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-brass z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-brass z-10 pointer-events-none" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/15 pb-4">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-brass font-bold flex items-center gap-1.5">
            <Sparkles size={13} className="text-brass" /> Proof-of-Work Verification
          </span>
          <h3 className="font-display text-2xl text-ink font-bold mt-0.5">
            GitHub &amp; Portfolio Technical Audit
          </h3>
          <p className="font-body text-xs text-ink/70 mt-1 max-w-2xl">
            Recruiters and engineering leads inspect public code and live projects before scheduling technical rounds.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] px-2.5 py-1 rounded-sm border border-ink/20 bg-ink/5 text-ink/80 flex items-center gap-1.5">
            <Search size={12} className="text-teal" />
            {isCVSource ? "Auto-detected from CV" : "Candidate Provided"}
          </span>
        </div>
      </div>

      {/* Main Grid: GitHub and Portfolio Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GitHub Inspection Column */}
        {github && (
          <div className="flex flex-col gap-4 p-4 rounded-sm border border-ink/15 bg-ink/[0.02]">
            <div className="flex items-center justify-between gap-2 border-b border-ink/10 pb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <GithubIcon size={18} className="text-ink shrink-0" />
                <span className="font-mono text-sm font-bold text-ink truncate">
                  GitHub Profile {github.username ? `(@${github.username})` : ""}
                </span>
              </div>
              {githubProfileLink && (
                <a
                  href={githubProfileLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[11px] text-teal hover:text-teal/80 flex items-center gap-1 shrink-0"
                >
                  <span>Open Profile</span>
                  <ExternalLink size={11} />
                </a>
              )}
            </div>

            {github.status === "ok" ? (
              <>
                {/* User Snapshot */}
                <div className="flex items-start gap-3">
                  {safeAvatarUrl && (
                    <Image
                      src={safeAvatarUrl}
                      alt={github.username || "GitHub avatar"}
                      width={44}
                      height={44}
                      className="w-11 h-11 rounded-sm border border-ink/20 shrink-0 object-cover"
                    />
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="font-body text-sm font-semibold text-ink truncate">
                      {github.name || `@${github.username}`}
                    </span>
                    {github.bio && (
                      <p className="font-body text-xs text-ink/75 line-clamp-2 mt-0.5">
                        {github.bio}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 font-mono text-[11px] text-ink/65">
                      <span>{github.public_repos ?? 0} public repos</span>
                      <span>·</span>
                      <span>{github.followers ?? 0} followers</span>
                    </div>
                  </div>
                </div>

                {/* Key Metrics Strip */}
                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
                  <div className="p-2.5 rounded-sm bg-ink/5 border border-ink/10 flex flex-col gap-1">
                    <span className="text-[10px] text-ink/60 uppercase">90-Day Activity</span>
                    <span
                      className={`font-semibold flex items-center gap-1.5 ${
                        github.active_within_90_days ? "text-teal" : "text-critical-red"
                      }`}
                    >
                      <GitCommit size={13} />
                      {github.active_within_90_days ? "Active Recent Pushes" : "Inactive (>90d)"}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-sm bg-ink/5 border border-ink/10 flex flex-col gap-1">
                    <span className="text-[10px] text-ink/60 uppercase">Live Demos</span>
                    <span className="font-semibold text-ink flex items-center gap-1.5">
                      <Layers size={13} className="text-brass" />
                      {github.repos_with_live_demo ?? 0}/{github.original_repos_checked ?? 0} with Links
                    </span>
                  </div>
                </div>

                {/* Top Languages */}
                {github.top_languages && github.top_languages.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <span className="font-mono text-[11px] text-ink/70">Top Languages:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {github.top_languages.map((lang) => (
                        <span
                          key={lang}
                          className="font-mono text-[11px] bg-ink/5 border border-ink/15 text-ink px-2 py-0.5 rounded-sm"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Standout Repositories */}
                {github.standout_repos && github.standout_repos.length > 0 && (
                  <div className="flex flex-col gap-2 pt-1">
                    <span className="font-mono text-[11px] font-semibold text-ink/80">
                      Standout Original Repositories:
                    </span>
                    <div className="flex flex-col gap-2">
                      {github.standout_repos.slice(0, 3).map((repo) => {
                        const repoHref = repo.url || repo.html_url;
                        return (
                          <div
                            key={repo.name}
                            className="p-2.5 rounded-sm border border-ink/10 bg-parchment/60 flex flex-col gap-1 text-xs"
                          >
                            <div className="flex items-center justify-between gap-2">
                              {repoHref ? (
                                <a
                                  href={repoHref}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-mono font-bold text-ink hover:text-teal flex items-center gap-1 truncate"
                                >
                                  <span>{repo.name}</span>
                                  <ExternalLink size={10} />
                                </a>
                              ) : (
                                <span className="font-mono font-bold text-ink truncate">
                                  {repo.name}
                                </span>
                              )}
                              <div className="flex items-center gap-2 shrink-0 font-mono text-[11px] text-ink/60">
                                {repo.language && (
                                  <span className="bg-ink/5 px-1.5 py-0.5 rounded-sm border border-ink/10">
                                    {repo.language}
                                  </span>
                                )}
                                {repo.stars > 0 && (
                                  <span className="flex items-center gap-0.5 text-brass">
                                    <Star size={11} className="fill-brass" /> {repo.stars}
                                  </span>
                                )}
                              </div>
                            </div>
                            {repo.description && (
                              <p className="font-body text-[11px] text-ink/75 line-clamp-2">
                                {repo.description}
                              </p>
                            )}
                            {repo.homepage && (
                              <a
                                href={repo.homepage}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-[10px] text-teal hover:underline flex items-center gap-1 mt-0.5 truncate"
                              >
                                <span className="truncate">Live Demo: {repo.homepage}</span>
                                <ExternalLink size={9} className="shrink-0" />
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="p-4 rounded-sm bg-critical-red/5 border border-critical-red/20 text-xs font-body text-critical-red flex items-center gap-2">
                <AlertTriangle size={15} className="shrink-0" />
                <span>
                  {github.status === "not_found"
                    ? `GitHub profile '@${github.username}' was not found.`
                    : github.status === "invalid_username"
                    ? "Invalid GitHub username handle provided."
                    : github.status === "rate_limited"
                    ? "GitHub API rate limit reached for unauthenticated inspection."
                    : "GitHub inspection unavailable within 4.0s timeout."}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Portfolio Inspection Column */}
        {portfolio && (
          <div className="flex flex-col gap-4 p-4 rounded-sm border border-ink/15 bg-ink/[0.02]">
            <div className="flex items-center justify-between gap-2 border-b border-ink/10 pb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <Globe size={18} className="text-ink shrink-0" />
                <span className="font-mono text-sm font-bold text-ink truncate">
                  Personal Portfolio
                </span>
              </div>
              {portfolio.url && portfolio.status !== "blocked_url" && (
                <a
                  href={portfolio.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[11px] text-teal hover:text-teal/80 flex items-center gap-1 shrink-0"
                >
                  <span>Visit Site</span>
                  <ExternalLink size={11} />
                </a>
              )}
            </div>

            {portfolio.status === "ok" ? (
              <>
                {/* Site Title & Preview */}
                <div className="flex flex-col gap-1">
                  <span className="font-body text-sm font-semibold text-ink">
                    {portfolio.title || "Untitled Portfolio"}
                  </span>
                  <p className="font-mono text-[11px] text-ink/60 truncate">
                    {portfolio.canonical_url || portfolio.url}
                  </p>
                  {portfolio.meta_description && (
                    <p className="font-body text-xs text-ink/75 line-clamp-3 mt-1 bg-ink/5 p-2 rounded-sm border border-ink/10 italic">
                      &quot;{portfolio.meta_description}&quot;
                    </p>
                  )}
                </div>

                {/* 4-Point Health Check Matrix */}
                <div className="flex flex-col gap-2 pt-1">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-ink/65 font-bold">
                    Portfolio Health Checklist
                  </span>

                  <div className="flex flex-col gap-1.5 font-body text-xs">
                    {/* HTTPS */}
                    <div className="flex items-center justify-between p-2 rounded-sm border border-ink/10 bg-parchment/60">
                      <span className="flex items-center gap-2 text-ink">
                        <ShieldCheck size={14} className="text-teal" />
                        HTTPS Security Protocol
                      </span>
                      {portfolio.uses_https ? (
                        <span className="font-mono text-[11px] text-teal font-semibold flex items-center gap-1">
                          <CheckCircle2 size={13} /> Active
                        </span>
                      ) : (
                        <span className="font-mono text-[11px] text-critical-red font-semibold flex items-center gap-1">
                          <XCircle size={13} /> Insecure (HTTP)
                        </span>
                      )}
                    </div>

                    {/* OpenGraph Tags */}
                    <div className="flex items-center justify-between p-2 rounded-sm border border-ink/10 bg-parchment/60">
                      <span className="flex items-center gap-2 text-ink">
                        <Layers size={14} className="text-brass" />
                        OpenGraph Social Preview Cards
                      </span>
                      {portfolio.has_open_graph ? (
                        <span className="font-mono text-[11px] text-teal font-semibold flex items-center gap-1">
                          <CheckCircle2 size={13} /> Configured
                        </span>
                      ) : (
                        <span className="font-mono text-[11px] text-critical-red font-semibold flex items-center gap-1">
                          <XCircle size={13} /> Missing Tags
                        </span>
                      )}
                    </div>

                    {/* Contact CTA */}
                    <div className="flex items-center justify-between p-2 rounded-sm border border-ink/10 bg-parchment/60">
                      <span className="flex items-center gap-2 text-ink">
                        <Sparkles size={14} className="text-teal" />
                        Recruiter Contact / Email CTA
                      </span>
                      {portfolio.has_contact_cta ? (
                        <span className="font-mono text-[11px] text-teal font-semibold flex items-center gap-1">
                          <CheckCircle2 size={13} /> Detected
                        </span>
                      ) : (
                        <span className="font-mono text-[11px] text-critical-red font-semibold flex items-center gap-1">
                          <XCircle size={13} /> Not Detected
                        </span>
                      )}
                    </div>

                    {/* SPA Shell Status */}
                    <div className="flex items-center justify-between p-2 rounded-sm border border-ink/10 bg-parchment/60">
                      <span className="flex items-center gap-2 text-ink">
                        <Globe size={14} className="text-ink/70" />
                        SEO / Crawler Pre-rendering
                      </span>
                      {portfolio.is_empty_spa_shell ? (
                        <span className="font-mono text-[11px] text-critical-red font-semibold flex items-center gap-1">
                          <AlertTriangle size={13} /> Empty SPA Shell
                        </span>
                      ) : (
                        <span className="font-mono text-[11px] text-teal font-semibold flex items-center gap-1">
                          <CheckCircle2 size={13} /> HTML Rendered
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-4 rounded-sm bg-critical-red/5 border border-critical-red/20 text-xs font-body text-critical-red flex items-center gap-2">
                <AlertTriangle size={15} className="shrink-0" />
                <span>
                  {portfolio.status === "blocked_url"
                    ? "Portfolio URL was blocked (private, reserved, or invalid host)."
                    : portfolio.status === "http_error"
                    ? `Portfolio URL returned HTTP ${portfolio.http_status || "error"} or non-HTML content.`
                    : "Portfolio inspection failed or site was unreachable within 4.0s timeout."}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actionable Engineering Findings Strip */}
      {audit_findings && audit_findings.length > 0 && (
        <div className="p-4 rounded-sm border border-brass/40 bg-brass/[0.04] flex flex-col gap-2.5">
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-brass uppercase tracking-wider">
            <Sparkles size={13} />
            <span>Actionable Proof-of-Work Recommendations</span>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-body text-ink">
            {audit_findings.map((finding, idx) => (
              <li
                key={`finding-${idx}`}
                className="flex items-start gap-2 bg-parchment/60 p-2.5 rounded-sm border border-ink/10"
              >
                <span className="font-mono text-brass font-bold text-xs shrink-0">•</span>
                <span className="leading-snug text-ink/85">{finding}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
