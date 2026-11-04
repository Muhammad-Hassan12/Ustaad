"use client";

import Link from "next/link";
import Image from "next/image";
import LedgerLine, { LedgerCheckpoint } from "@/components/LedgerLine";
import AnimatedSection, { StaggerChild } from "@/components/AnimatedSection";
import {
  Sparkles, ArrowRight, ExternalLink,
  Layers, Search, Globe, Award,
  UserSearch, TrendingUp, GitCompare, Map, FileSignature, Mic, Download,
  Zap, Database, FileText, Palette, Upload, ScanLine, BrainCircuit,
  BarChart3, GitBranch, Shield, RefreshCcw, BookOpen, Key
} from "lucide-react";

function GithubIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function LinkedinIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

const METRICS = [
  { value: "6", label: "AI Agent Modules", desc: "5-agent core DAG + 1 adaptive mock interviewer" },
  { value: "4", label: "Search Queries / Miss", desc: "Serper.dev grounding with 48h role+city cache" },
  { value: "15", label: "Mock Interview Qs", desc: "Multi-turn loop with adaptive follow-up probes" },
  { value: "Free", label: "Shared Server Tier", desc: "250 daily pipeline runs · BYOK ready" },
];

const AGENTS = [
  {
    icon: UserSearch,
    name: "Profile Agent",
    label: "A1",
    stage: "Stage 01 · Parallel",
    desc: "Parses your text-based PDF CV into a structured JSON schema: education, experience, skills, and projects.",
  },
  {
    icon: TrendingUp,
    name: "Market Intelligence Agent",
    label: "A2",
    stage: "Stage 01 · Parallel",
    desc: "Executes up to 4 grounded Serper.dev queries across Pakistani job boards, backed by a 48h role+city cache.",
  },
  {
    icon: GitCompare,
    name: "Gap Analysis Agent",
    label: "A3",
    stage: "Stage 02 · Sequential",
    desc: "Cross-references your profile against market requirements to compute a quantified Readiness Score (0–100).",
  },
  {
    icon: Map,
    name: "Roadmap Agent",
    label: "A4",
    stage: "Stage 03 · Parallel",
    desc: "Generates a milestone-driven 30/60/90-day action plan with free curated learning resources.",
  },
  {
    icon: FileSignature,
    name: "CV Rewrite Agent",
    label: "A5",
    stage: "Stage 03 · Parallel",
    desc: "Transforms CV experience points and summary into ATS-optimized bullet points with side-by-side diffs.",
  },
  {
    icon: Mic,
    name: "Adaptive AI Interview Agent",
    label: "A6",
    stage: "Interactive Module",
    desc: "Orchestrates a scored 15-question multi-turn mock interview with per-answer evaluation and feedback.",
  },
];

const UTILITIES = [
  {
    icon: GitBranch,
    name: "Proof-of-Work Auditor",
    label: "U1",
    stage: "Supporting Audit · Stage 01",
    desc: "SSRF-guarded Python inspection engine auditing commit velocity, repositories, and live links concurrently with Stage 1.",
  },
  {
    icon: Download,
    name: "Career Dossier Compiler",
    label: "U2",
    stage: "Export Engine",
    desc: "Deterministic Python/ReportLab PDF generation engine compiling the complete career ledger into a 4-page print-ready dossier.",
  },
];

const STEPS = [
  {
    icon: Upload,
    step: "01",
    title: "Upload Your CV",
    desc: "Drop your PDF resume and tell us your target role and city. That's all the input you need.",
  },
  {
    icon: ScanLine,
    step: "02",
    title: "Pipeline Runs Live",
    desc: "Watch 6 AI agents and supporting audit utilities process your data in real-time via Server-Sent Events — no page reloads.",
  },
  {
    icon: BrainCircuit,
    step: "03",
    title: "Get Your Analysis",
    desc: "Review your Readiness Score, skill gaps, ATS-optimized CV, and 30/60/90-day learning plan.",
  },
  {
    icon: Award,
    step: "04",
    title: "Practice & Export",
    desc: "Complete an AI mock interview, then download your full PDF Career Dossier.",
  },
];

const DELIVERABLES = [
  { icon: BarChart3, label: "Readiness Score", desc: "0–100 readiness benchmark vs. live market data" },
  { icon: GitCompare, label: "Gap Analysis Report", desc: "Critical vs. nice-to-have skills with priority rankings" },
  { icon: Map, label: "30/60/90 Roadmap", desc: "Milestone-driven learning plan with free resource links" },
  { icon: FileSignature, label: "ATS-Optimized CV", desc: "Rewritten CV with before/after comparison view" },
  { icon: Mic, label: "Mock Interview", desc: "15 tailored Q&As with per-answer scoring and feedback" },
  { icon: Download, label: "PDF Career Dossier", desc: "Full ReportLab-generated export of all findings" },
];

const CONCEPTS = [
  {
    icon: Layers,
    title: "Multi-Agent DAG Collaboration",
    tag: "Core Architecture",
    desc: "6 AI agents and 2 engineering utilities orchestrated in a parallel + sequential DAG. Stage 1 (A1 || A2) and Stage 3 (A4 || A5) execute concurrently via asyncio.gather(), running with smart rate-limit backoff.",
    code: "asyncio.gather(run_profile_agent(), run_market_agent())",
  },
  {
    icon: Search,
    title: "Tool Use & 48h Market Caching",
    tag: "Market Integration",
    desc: "The Market Agent runs 4 concurrent Serper.dev Google Search queries against Pakistani job boards, backed by a 48-hour role+city cache to conserve free search quotas.",
    code: `"Python Developer jobs Karachi site:rozee.pk"`,
  },
  {
    icon: Shield,
    title: "Structured Outputs & Self-Repair",
    tag: "Resilience Layer",
    desc: "Every agent enforces strict JSON schemas across providers with a 4-layer fallback parser, reasoning <think> block stripping, and 1-shot automatic JSON self-repair.",
    code: `response_mime_type="application/json"`,
  },
  {
    icon: RefreshCcw,
    title: "Production-Grade Async Pipeline",
    tag: "System Reliability",
    desc: "Live SSE streaming via asyncio.Queue with polling recovery on page refresh, smart retry backoff, and automatic failover when default free limits run tight.",
    code: "wait = min(2 ** attempt, 12)  # smart backoff",
  },
  {
    icon: Key,
    title: "Multi-Provider BYOK Studio",
    tag: "8 Providers + Custom Models",
    desc: "Runs free on Gemini 3.1 Flash Lite by default, while BYOK lets you connect Gemini, OpenAI, Claude, DeepSeek, Qwen, GLM, Groq, or OpenRouter with custom model IDs — stored strictly in browser localStorage.",
    code: `headers: { 'X-LLM-Provider': provider, 'X-LLM-Model': model }`,
  },
];

const TECH_STACK = [
  { icon: Sparkles, name: "Gemini 3.1 Flash Lite", category: "Default AI Engine" },
  { icon: Key, name: "8-Provider BYOK", category: "Multi-LLM Studio" },
  { icon: Zap, name: "FastAPI", category: "Async Backend" },
  { icon: Globe, name: "Next.js 16 & React 19", category: "Frontend Framework" },
  { icon: Database, name: "Supabase", category: "PostgreSQL State" },
  { icon: Search, name: "Serper.dev", category: "Live Search API" },
  { icon: FileText, name: "PyMuPDF", category: "PDF Parsing" },
  { icon: BookOpen, name: "ReportLab", category: "Dossier Export" },
  { icon: Palette, name: "Tailwind CSS v4", category: "Manuscript Styling" },
  { icon: GitBranch, name: "TypeScript 5", category: "Strict Typing" },
];

const AGENTS_CHECKPOINTS: LedgerCheckpoint[] = [
  ...AGENTS.map((a) => ({
    label: `${a.label} (${a.stage}): ${a.name} — ${a.desc}`,
    status: "complete" as const,
  })),
  ...UTILITIES.map((u) => ({
    label: `${u.label} (${u.stage}): ${u.name} — ${u.desc}`,
    status: "complete" as const,
  })),
];

export default function AboutPage() {
  return (
    <main className="flex-1 bg-ink text-parchment min-h-screen py-12 px-6 md:px-16 max-w-6xl mx-auto w-full flex flex-col gap-16">
      {/* 1. Hero Section */}
      <AnimatedSection className="flex flex-col gap-6 pt-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-sm bg-parchment/5 text-brass border border-brass/30 text-xs font-mono tracking-wider uppercase self-start">
          <Sparkles size={13} />
          About Ustaad (اُستاد)
        </div>

        <h1 className="font-display text-6xl md:text-8xl text-parchment leading-none tracking-tight">
          Meet Ustaad
          <span className="block text-3xl md:text-4xl text-warm-gray font-normal mt-2 font-display">
            اُستاد
          </span>
        </h1>

        {/* Marginal annotation tagline */}
        <div className="mt-2 border-l-2 border-brass pl-6 max-w-3xl">
          <p className="font-body text-xl md:text-2xl text-brass font-medium">
            The career coach Pakistan never had.
          </p>
          <p className="font-body text-sm text-warm-gray mt-3 leading-relaxed">
            Ustaad is an AI-powered career intelligence platform built for tech graduates across Pakistan —
            whether you&apos;re from CS, IT, Software Engineering, Data Science, or any tech domain.
            Upload your CV, pick your target role, and Ustaad&apos;s parallel multi-agent pipeline gives you grounded Pakistani
            job-market intelligence, an honest skill gap analysis, a personalized learning roadmap, an ATS-optimized CV rewrite,
            and an interactive mock interview with scored feedback.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 mt-4">
          <Link
            href="/"
            className="bg-brass text-ink font-body font-semibold px-7 py-3.5 rounded-sm hover:bg-brass/90 transition-colors flex items-center gap-2 text-sm shadow-md"
          >
            <span>Try Ustaad Now</span>
            <ArrowRight size={16} />
          </Link>
          <a
            href="https://github.com/Muhammad-Hassan12/Ustaad"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-brass/40 text-brass font-body font-semibold px-7 py-3.5 rounded-sm hover:bg-brass/10 transition-colors flex items-center gap-2 text-sm"
          >
            <span>View on GitHub</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </AnimatedSection>

      {/* 2. Key Metrics Bar */}
      <AnimatedSection className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {METRICS.map((m, idx) => (
          <StaggerChild key={idx} index={idx}>
            <div
              className="bg-parchment text-ink rounded-sm border border-brass/30 p-6 flex flex-col gap-1 relative shadow-md card-hover paper-grain h-full"
            >
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-brass z-10 pointer-events-none" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-brass z-10 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-brass z-10 pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-brass z-10 pointer-events-none" />
              <span className="font-mono text-4xl font-bold text-brass">{m.value}</span>
              <span className="font-body text-sm font-semibold text-ink mt-1">{m.label}</span>
              <span className="font-body text-xs text-ink/70 leading-normal">{m.desc}</span>
            </div>
          </StaggerChild>
        ))}
      </AnimatedSection>

      {/* 3. The Problem Section */}
      <AnimatedSection direction="left" className="border-l-4 border-brass pl-6 md:pl-8 py-2 max-w-3xl flex flex-col gap-3">
        <h2 className="font-display text-3xl text-parchment">Why We Built This</h2>
        <p className="font-body text-sm text-warm-gray leading-relaxed">
          Every year, thousands of tech graduates in Pakistan enter the job market without a clear picture
          of what employers actually want. Generic CVs get ignored. Skills don&apos;t match market demand.
          Interview prep is guesswork. And there&apos;s no single tool that understands the Pakistani job market
          deeply enough to give real, actionable guidance. Ustaad changes that.
        </p>
      </AnimatedSection>

      {/* 4. Multi-Agent Pipeline & Engineering Utilities — Detailed Ledger */}
      <AnimatedSection className="bg-parchment text-ink rounded-sm border border-brass/40 p-8 md:p-12 shadow-2xl relative flex flex-col gap-8 paper-grain">
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-brass z-10 pointer-events-none" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-brass z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-brass z-10 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-brass z-10 pointer-events-none" />

        <div>
          <h2 className="font-display text-3xl md:text-4xl text-ink">6 AI Agents · 2 Engineering Utilities</h2>
          <p className="font-body text-xs text-ink/70 mt-1">
            Deterministic parallel DAG execution paired with adaptive interview probing and Python audit utilities.
          </p>
        </div>

        {/* Architecture DAG Ledger Diagram */}
        <div className="p-6 md:p-8 rounded-sm border border-ink/20 bg-ink/[0.02] flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-ink/15 pb-4">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-brass font-bold">Pipeline DAG Specification</span>
              <h3 className="font-display text-2xl text-ink">Ustaad System Architecture</h3>
            </div>
            <span className="font-mono text-xs text-ink/60 bg-ink/5 px-2.5 py-1 rounded-sm border border-ink/10 self-start sm:self-auto">
              asyncio DAG · 6 AI Agents + 2 Utilities
            </span>
          </div>

          <div className="flex flex-col gap-4 max-w-4xl mx-auto w-full">
            <span className="font-mono text-[10px] uppercase tracking-wider text-ink/50 font-bold">Core Career Analysis</span>

            {/* Stage 01 */}
            <div className="p-4 rounded-sm border border-brass/40 bg-parchment/60 flex flex-col gap-3 shadow-xs">
              <div className="flex items-center justify-between text-xs font-mono text-brass font-bold">
                <span>Stage 01 · Parallel Execution</span>
                <span className="text-[10px] text-ink/50 font-normal">asyncio.gather()</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-sm border border-ink/10 bg-white/70">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-brass">A1</span>
                    <UserSearch size={14} className="text-teal" />
                  </div>
                  <h5 className="font-display text-sm text-ink mt-1">Profile Agent</h5>
                  <p className="font-body text-[11px] text-ink/70 mt-0.5">PDF text extraction & JSON schema structuring</p>
                </div>
                <div className="p-3 rounded-sm border border-ink/10 bg-white/70">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-brass">A2</span>
                    <TrendingUp size={14} className="text-teal" />
                  </div>
                  <h5 className="font-display text-sm text-ink mt-1">Market Agent</h5>
                  <p className="font-body text-[11px] text-ink/70 mt-0.5">Serper.dev live Pakistani job queries (48h cached)</p>
                </div>
              </div>
              <div className="p-2.5 rounded-sm border border-dashed border-ink/20 bg-ink/[0.02] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold text-teal bg-teal/10 px-1.5 py-0.5 rounded-sm">Utility U1</span>
                  <span className="font-body text-xs font-medium text-ink">GitHub & Portfolio Proof-of-Work Auditor</span>
                </div>
                <span className="font-mono text-[10px] text-ink/50 hidden sm:inline">SSRF-guarded Python inspector</span>
              </div>
            </div>

            {/* Down Arrow */}
            <div className="flex justify-center text-brass font-mono text-base font-bold">↓</div>

            {/* Stage 02 */}
            <div className="p-4 rounded-sm border border-brass/40 bg-parchment/60 flex flex-col gap-2 shadow-xs">
              <div className="flex items-center justify-between text-xs font-mono text-brass font-bold">
                <span>Stage 02 · Sequential Synthesis</span>
                <span className="text-[10px] text-ink/50 font-normal">Requires A1 + A2 complete</span>
              </div>
              <div className="p-3 rounded-sm border border-ink/10 bg-white/70 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-brass">A3</span>
                    <h5 className="font-display text-sm text-ink">Gap Analysis Agent</h5>
                  </div>
                  <p className="font-body text-[11px] text-ink/70 mt-0.5">Profile-to-market matrix reconciliation & heuristic Readiness Score</p>
                </div>
                <GitCompare size={16} className="text-teal ml-3 shrink-0" />
              </div>
            </div>

            {/* Down Arrow */}
            <div className="flex justify-center text-brass font-mono text-base font-bold">↓</div>

            {/* Stage 03 */}
            <div className="p-4 rounded-sm border border-brass/40 bg-parchment/60 flex flex-col gap-3 shadow-xs">
              <div className="flex items-center justify-between text-xs font-mono text-brass font-bold">
                <span>Stage 03 · Parallel Generation</span>
                <span className="text-[10px] text-ink/50 font-normal">asyncio.gather() from A3 context</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-sm border border-ink/10 bg-white/70">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-brass">A4</span>
                    <Map size={14} className="text-teal" />
                  </div>
                  <h5 className="font-display text-sm text-ink mt-1">Roadmap Agent</h5>
                  <p className="font-body text-[11px] text-ink/70 mt-0.5">30/60/90-day learning curriculum & curated free resources</p>
                </div>
                <div className="p-3 rounded-sm border border-ink/10 bg-white/70">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-brass">A5</span>
                    <FileSignature size={14} className="text-teal" />
                  </div>
                  <h5 className="font-display text-sm text-ink mt-1">CV Rewrite Agent</h5>
                  <p className="font-body text-[11px] text-ink/70 mt-0.5">ATS bullet transformation with side-by-side comparison</p>
                </div>
              </div>
            </div>

            <div className="border-t border-ink/15 my-2" />

            {/* Additional Modules */}
            <span className="font-mono text-[10px] uppercase tracking-wider text-ink/50 font-bold">Additional Modules</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-sm border border-ink/15 bg-white/70 flex items-start gap-3">
                <span className="font-mono text-xs font-bold text-brass bg-brass/10 border border-brass/30 px-2 py-0.5 rounded-sm shrink-0">A6</span>
                <div>
                  <h5 className="font-display text-sm text-ink flex items-center gap-1.5">
                    Adaptive AI Interview Agent
                    <Mic size={14} className="text-teal inline" />
                  </h5>
                  <p className="font-body text-[11px] text-ink/70 mt-0.5">
                    15-question interactive multi-turn interview with per-answer rubric scoring and adaptive probes.
                  </p>
                </div>
              </div>
              <div className="p-3.5 rounded-sm border border-ink/15 bg-white/70 flex items-start gap-3">
                <span className="font-mono text-xs font-bold text-teal bg-teal/10 border border-teal/30 px-2 py-0.5 rounded-sm shrink-0">U2</span>
                <div>
                  <h5 className="font-display text-sm text-ink flex items-center gap-1.5">
                    Career Dossier Compiler
                    <Download size={14} className="text-teal inline" />
                  </h5>
                  <p className="font-body text-[11px] text-ink/70 mt-0.5">
                    Deterministic ReportLab Python utility exporting all ledger sections into a 4-page PDF.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vertical LedgerLine signature view */}
        <div className="py-2 border-b border-ink/15 pb-6">
          <LedgerLine orientation="vertical" variant="on-parchment" checkpoints={AGENTS_CHECKPOINTS} />
        </div>

        {/* Core AI Agents Grid */}
        <div className="flex flex-col gap-4">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink/60">
            6 Specialized AI Agents
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {AGENTS.map((agent, i) => (
              <StaggerChild key={i} index={i}>
                <div
                  className="p-5 rounded-sm border border-ink/15 bg-ink/[0.03] flex flex-col gap-2 relative hover:border-brass transition-colors card-hover h-full"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-brass bg-brass/10 border border-brass/30 px-2.5 py-0.5 rounded-sm">
                      {agent.label}
                    </span>
                    <span className="font-mono text-[10px] text-ink/50 uppercase">{agent.stage}</span>
                    <agent.icon size={18} className="text-teal" />
                  </div>
                  <h4 className="font-display text-lg text-ink mt-1">{agent.name}</h4>
                  <p className="font-body text-xs text-ink/75 leading-relaxed">{agent.desc}</p>
                </div>
              </StaggerChild>
            ))}
          </div>
        </div>

        {/* Engineering Utilities Grid */}
        <div className="flex flex-col gap-4 pt-4 border-t border-ink/15">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink/60">
            2 Supporting Engineering Utilities
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {UTILITIES.map((util, i) => (
              <StaggerChild key={i} index={i}>
                <div
                  className="p-5 rounded-sm border border-teal/20 bg-teal/[0.02] flex flex-col gap-2 relative hover:border-teal transition-colors card-hover h-full"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-teal bg-teal/10 border border-teal/30 px-2.5 py-0.5 rounded-sm">
                      {util.label}
                    </span>
                    <span className="font-mono text-[10px] text-teal/70 uppercase">{util.stage}</span>
                    <util.icon size={18} className="text-teal" />
                  </div>
                  <h4 className="font-display text-lg text-ink mt-1">{util.name}</h4>
                  <p className="font-body text-xs text-ink/75 leading-relaxed">{util.desc}</p>
                </div>
              </StaggerChild>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* 5. How It Works Steps */}
      <AnimatedSection className="flex flex-col gap-8">
        <div>
          <h2 className="font-display text-3xl text-parchment">How It Works</h2>
          <p className="font-body text-xs text-warm-gray mt-1">
            4 simple steps from CV upload to complete career dossier
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((s, idx) => (
            <StaggerChild key={idx} index={idx}>
              <div
                className="bg-parchment text-ink rounded-sm border border-brass/30 p-6 flex flex-col gap-3 relative shadow-md card-hover paper-grain h-full"
              >
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-brass z-10 pointer-events-none" />
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-brass z-10 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-brass z-10 pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-brass z-10 pointer-events-none" />
                <div className="flex justify-between items-center">
                  <span className="font-mono text-2xl font-bold text-brass">{s.step}</span>
                  <s.icon size={20} className="text-teal" />
                </div>
                <h4 className="font-display text-lg text-ink">{s.title}</h4>
                <p className="font-body text-xs text-ink/75 leading-relaxed">{s.desc}</p>
              </div>
            </StaggerChild>
          ))}
        </div>
      </AnimatedSection>

      {/* 6. What Ustaad Delivers */}
      <AnimatedSection className="flex flex-col gap-8">
        <div>
          <h2 className="font-display text-3xl text-parchment">What Ustaad Delivers</h2>
          <p className="font-body text-xs text-warm-gray mt-1">
            A comprehensive, actionable career intelligence package
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {DELIVERABLES.map((d, idx) => (
            <div
              key={idx}
              className="border border-brass/30 bg-parchment/5 p-6 rounded-sm flex flex-col gap-2"
            >
              <div className="flex items-center gap-2.5">
                <d.icon size={18} className="text-brass" />
                <h4 className="font-display text-base text-parchment">{d.label}</h4>
              </div>
              <p className="font-body text-xs text-warm-gray leading-relaxed">{d.desc}</p>
            </div>
          ))}
        </div>
      </AnimatedSection>

      {/* 7. Capstone & Engineering Concepts */}
      <AnimatedSection className="bg-parchment text-ink rounded-sm border border-brass/40 p-8 md:p-12 shadow-2xl relative flex flex-col gap-8 paper-grain">
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-brass z-10 pointer-events-none" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-brass z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-brass z-10 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-brass z-10 pointer-events-none" />

        <div>
          <h2 className="font-display text-3xl text-ink">Engineering Concepts</h2>
          <p className="font-body text-xs text-ink/70 mt-1">
            Key architectural highlights built into Ustaad&apos;s pipeline
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CONCEPTS.map((c, idx) => (
            <div
              key={idx}
              className="p-6 rounded-sm border border-ink/15 bg-ink/[0.03] flex flex-col gap-3 justify-between"
            >
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[10px] font-bold text-brass uppercase bg-brass/10 border border-brass/30 px-2.5 py-0.5 rounded-sm">
                    {c.tag}
                  </span>
                  <c.icon size={18} className="text-teal" />
                </div>
                <h4 className="font-display text-xl text-ink mt-1">{c.title}</h4>
                <p className="font-body text-xs text-ink/80 leading-relaxed">{c.desc}</p>
              </div>
              <div className="p-3 rounded-sm bg-ink text-parchment font-mono text-xs overflow-x-auto border border-brass/30">
                <code>{c.code}</code>
              </div>
            </div>
          ))}
        </div>
      </AnimatedSection>

      {/* 8. Tech Stack Pills */}
      <AnimatedSection className="flex flex-col items-center text-center gap-6 py-4">
        <div>
          <h2 className="font-display text-3xl text-parchment">Full Tech Stack</h2>
          <p className="font-body text-xs text-warm-gray mt-1">
            Built with modern production-grade AI & web technologies
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 max-w-4xl w-full">
          {TECH_STACK.map((tech, i) => (
            <div
              key={i}
              className="border border-brass/30 bg-parchment/5 p-4 rounded-sm flex flex-col items-center gap-1.5 text-center"
            >
              <tech.icon size={18} className="text-brass" />
              <span className="font-mono text-xs text-parchment font-semibold">{tech.name}</span>
              <span className="font-body text-[10px] text-warm-gray">{tech.category}</span>
            </div>
          ))}
        </div>
      </AnimatedSection>

      {/* 8.5 Common Questions (FAQ) Section */}
      <AnimatedSection className="flex flex-col gap-8 max-w-3xl mx-auto w-full">
        <div className="text-center">
          <h2 className="font-display text-3xl md:text-4xl text-parchment">Common Questions</h2>
          <p className="font-body text-xs text-warm-gray mt-1">
            Everything you need to know about API keys, privacy, and access
          </p>
        </div>

        <div className="space-y-6">
          <div className="border-l-2 border-brass pl-6 py-1 flex flex-col gap-2">
            <h3 className="font-display text-xl text-brass">
              How does Multi-Provider Bring Your Own Key (BYOK) work?
            </h3>
            <p className="font-body text-xs sm:text-sm text-warm-gray leading-relaxed">
              Out of the box, Ustaad provides a free shared server tier (defaulting to 250 pipeline runs per day). During peak student traffic or when shared quota is exhausted, you may experience queueing — or you may want to test frontier reasoning models on your CV.
            </p>
            <p className="font-body text-xs sm:text-sm text-warm-gray leading-relaxed">
              With BYOK mode, you can connect a free API key from{" "}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brass underline hover:text-brass/80 font-medium"
              >
                Google AI Studio
              </a>{" "}
              or{" "}
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brass underline hover:text-brass/80 font-medium"
              >
                Groq
              </a>
              , or bring keys from OpenAI (ChatGPT), Anthropic (Claude), DeepSeek, Alibaba Qwen, Zhipu GLM, or OpenRouter — including custom model IDs. Keys are saved strictly in your browser&apos;s <code>localStorage</code> and transmitted over HTTPS for your requests. Ustaad never persists your BYOK key in its database or application logs. BYOK requests run directly through your chosen provider with provider-reported rate limit backoff and never fail over to unselected secondary models. External provider terms and rate limits apply.
            </p>
          </div>

          <div className="border-l-2 border-brass pl-6 py-1 flex flex-col gap-2">
            <h3 className="font-display text-xl text-brass">
              Is my CV or personal data stored anywhere?
            </h3>
            <p className="font-body text-xs sm:text-sm text-warm-gray leading-relaxed">
              Ustaad processes your CV and career information through its configured AI and search services. Parsed CV text and generated analysis results are stored server-side in Supabase for up to 30 days under an unguessable 128-bit UUID session link (sessions older than 30 days are automatically purged).
            </p>
            <p className="font-body text-xs sm:text-sm text-warm-gray leading-relaxed">
              Each session uses its private session URL as an access credential. Anyone possessing that exact URL is able to access the associated career analysis, interview transcripts, and PDF dossier — keep it private and do not post it publicly. Session pages are configured with strict <code>robots: noindex, nofollow</code> headers so search engines will never index your results.
            </p>
            <p className="font-body text-xs sm:text-sm text-warm-gray leading-relaxed">
              Your CV data is never used to train foundational AI models, sold, or shared with third-party advertisers. On the shared server-default tier, requests may failover to an operator-configured secondary model if primary API rate limits occur; BYOK requests never do.
            </p>
          </div>

          <div className="border-l-2 border-brass pl-6 py-1 flex flex-col gap-2">
            <h3 className="font-display text-xl text-brass">
              Is Ustaad free to use? What are the limits?
            </h3>
            <p className="font-body text-xs sm:text-sm text-warm-gray leading-relaxed">
              Yes, Ustaad offers a free shared server tier for Pakistani students and graduates, supported by a daily capacity limit (defaulting to 250 pipeline runs per day). All core features — Pakistani job-market intelligence, gap analysis, 30/60/90 roadmap, ATS CV rewrite, mock interview, and PDF dossier export — are accessible on this tier.
            </p>
            <p className="font-body text-xs sm:text-sm text-warm-gray leading-relaxed">
              If the shared daily server quota is exhausted, you can continue immediately without waiting by toggling BYOK mode with your own free key (e.g. from Google AI Studio or Groq).
            </p>
          </div>

          <div className="border-l-2 border-brass pl-6 py-1 flex flex-col gap-2">
            <h3 className="font-display text-xl text-brass">
              Are Readiness Scores and ATS benchmarks a guarantee of employment?
            </h3>
            <p className="font-body text-xs sm:text-sm text-warm-gray leading-relaxed">
              No. Career readiness scores, ATS optimization metrics, and interview evaluations generated by Ustaad are heuristic, advisory estimates designed for self-guided preparation and skill benchmarking. They do not constitute a hiring guarantee or employment offer from any company. Actual hiring outcomes depend on employer-specific criteria, human interviews, technical assessments, and evolving market conditions.
            </p>
          </div>

          <div className="border-l-2 border-brass pl-6 py-1 flex flex-col gap-2">
            <h3 className="font-display text-xl text-brass">
              What resume formats are supported?
            </h3>
            <p className="font-body text-xs sm:text-sm text-warm-gray leading-relaxed">
              Ustaad supports text-based PDF documents up to 5MB. Scanned image-only PDFs (such as smartphone camera photographs or flattened raster exports without embedded font/text streams) are currently unsupported because text extraction requires machine-readable PDF layers. For best results, export your resume directly as a PDF from Google Docs, Microsoft Word, Canva, or LaTeX.
            </p>
          </div>
        </div>
      </AnimatedSection>

      {/* 9. Built For — Competition Card */}
      <AnimatedSection className="flex justify-center">
        <div className="bg-parchment text-ink rounded-sm border border-brass/40 p-10 text-center max-w-md w-full shadow-2xl relative card-hover paper-grain">
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-brass z-10 pointer-events-none" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-brass z-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-brass z-10 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-brass z-10 pointer-events-none" />

          <span className="font-mono text-xs text-ink/50 uppercase tracking-widest block mb-1">Submitted to</span>
          <h3 className="font-display text-3xl text-ink mt-1">Kaggle × Google</h3>
          <p className="font-body text-xs text-ink/70 mt-1">5-Day AI Agents Vibe Coding Capstone 2026</p>

          <span className="inline-block mt-5 font-mono text-xs bg-brass/15 text-ink border border-brass/40 px-4 py-1.5 rounded-sm font-semibold">
            🏆 Capstone Project Submission
          </span>
        </div>
      </AnimatedSection>

      {/* 10. The Team */}
      <AnimatedSection className="flex flex-col gap-8">
        <div className="text-center">
          <h2 className="font-display text-4xl text-parchment">The Team</h2>
          <p className="font-body text-xs text-warm-gray mt-1">
            Built by two developers from Karachi, Pakistan 🇵🇰
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
          {/* Card 1 — Hassan */}
          <div className="bg-parchment text-ink rounded-sm border border-brass/30 p-8 shadow-xl flex flex-col justify-between relative card-hover paper-grain">
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-brass z-10 pointer-events-none" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-brass z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-brass z-10 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-brass z-10 pointer-events-none" />

            <div>
              <Image
                src="/images/team/muhammad-hassan12.jpg"
                alt="Syed Muhammad Hassan"
                width={56}
                height={56}
                unoptimized
                className="w-14 h-14 rounded-full shadow-md border-2 border-brass object-cover"
              />
              <h3 className="font-display text-2xl text-ink mt-4">Syed Muhammad Hassan</h3>
              <p className="font-mono text-xs text-teal font-semibold mt-1">Backend/Frontend Engineer/Architect & AI Agents</p>
              <p className="font-body text-xs text-ink/80 mt-3 leading-relaxed">
                GenAI developer and co-founder & CTO of AgenticEra Systems. Built the multi-agent orchestration DAG,
                FastAPI backend, multi-provider BYOK engine, and contributed across the frontend.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-6 border-t border-ink/15 pt-4">
              <a
                href="https://www.smhassan.me/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-body text-xs text-ink/70 hover:text-brass flex items-center gap-1.5 transition-colors"
              >
                <Globe size={14} /> Portfolio
              </a>
              <a
                href="https://github.com/Muhammad-Hassan12"
                target="_blank"
                rel="noopener noreferrer"
                className="font-body text-xs text-ink/70 hover:text-brass flex items-center gap-1.5 transition-colors"
              >
                <GithubIcon size={14} /> GitHub
              </a>
              <a
                href="https://www.linkedin.com/in/syed-muhammad-hassan-aa112928b/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-body text-xs text-ink/70 hover:text-brass flex items-center gap-1.5 transition-colors"
              >
                <LinkedinIcon size={14} /> LinkedIn
              </a>
            </div>
          </div>

          {/* Card 2 — Abdul Mannan */}
          <div className="bg-parchment text-ink rounded-sm border border-brass/30 p-8 shadow-xl flex flex-col justify-between relative card-hover paper-grain">
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-brass z-10 pointer-events-none" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-brass z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-brass z-10 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-brass z-10 pointer-events-none" />

            <div>
              <Image
                src="/images/team/abdulmannan991.png"
                alt="Abdul Mannan Fazlani"
                width={56}
                height={56}
                unoptimized
                className="w-14 h-14 rounded-full shadow-md border-2 border-teal object-cover"
              />
              <h3 className="font-display text-2xl text-ink mt-4">Abdul Mannan Fazlani</h3>
              <p className="font-mono text-xs text-teal font-semibold mt-1">Frontend Engineer & UI/UX</p>
              <p className="font-body text-xs text-ink/80 mt-3 leading-relaxed">
                Full-stack developer and Founder of AgenticEra Systems.
                Built the entire Next.js frontend, dashboard, and interview UI.
              </p>
            </div>

            <div className="flex items-center gap-4 mt-6 border-t border-ink/15 pt-4">
              <a
                href="https://github.com/abdulmannan991"
                target="_blank"
                rel="noopener noreferrer"
                className="font-body text-xs text-ink/70 hover:text-brass flex items-center gap-1.5 transition-colors"
              >
                <GithubIcon size={14} /> GitHub
              </a>
              <a
                href="https://www.linkedin.com/in/abdul-mannan-fazlani-47b274293/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-body text-xs text-ink/70 hover:text-brass flex items-center gap-1.5 transition-colors"
              >
                <LinkedinIcon size={14} /> LinkedIn
              </a>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* 11. Final CTA Banner */}
      <AnimatedSection className="bg-parchment text-ink rounded-sm border border-brass/40 p-10 md:p-14 text-center shadow-2xl flex flex-col items-center gap-6 relative paper-grain">
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-brass z-10 pointer-events-none" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-brass z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-brass z-10 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-brass z-10 pointer-events-none" />

        <h2 className="font-display text-3xl md:text-5xl text-ink">
          Ready to Launch Your Career OS?
        </h2>
        <p className="font-body text-sm text-ink/70 max-w-xl leading-relaxed">
          Upload your CV, select your target role, and get your complete Pakistani job-market intelligence,
          gap analysis, roadmap, ATS rewrite, and AI mock interview.
        </p>

        <Link
          href="/"
          className="bg-brass text-ink font-body font-semibold px-8 py-4 rounded-sm hover:bg-brass/90 transition-colors flex items-center gap-2 text-base shadow-md"
        >
          <span>Start Your Career Analysis Now</span>
          <ArrowRight size={18} />
        </Link>
      </AnimatedSection>
    </main>
  );
}
