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
  { value: "7", label: "AI Agents", desc: "Sequential + Parallel pipeline graph" },
  { value: "4", label: "Live Searches / Session", desc: "Grounding via Serper.dev on job boards" },
  { value: "15", label: "Mock Interview Qs", desc: "Scored multi-turn AI interview" },
  { value: "100%", label: "Free for Graduates", desc: "Built for Pakistani tech talent 🇵🇰" },
];

const AGENTS = [
  {
    icon: UserSearch,
    name: "Profile Agent",
    label: "A1",
    desc: "Parses your PDF CV into a structured JSON profile — education, experience, skills, and projects.",
  },
  {
    icon: TrendingUp,
    name: "Market Intelligence Agent",
    label: "A2",
    desc: "Runs 4 live Serper.dev queries on Pakistani job boards (Rozee.pk, Mustakbil, LinkedIn) for real-time demand data.",
  },
  {
    icon: GitCompare,
    name: "Gap Analysis Agent",
    label: "A3",
    desc: "Compares your profile against market demand and computes a quantified Readiness Score (0–100).",
  },
  {
    icon: Map,
    name: "Roadmap Agent",
    label: "A4",
    desc: "Builds a milestone-driven 30/60/90-day learning plan with free resource links to close skill gaps.",
  },
  {
    icon: FileSignature,
    name: "CV Rewrite Agent",
    label: "A5",
    desc: "Rewrites your CV bullet points and summary for ATS optimization with a before/after comparison view.",
  },
  {
    icon: Mic,
    name: "Interview Agent",
    label: "A6",
    desc: "Runs a multi-turn mock interview with 15 tailored questions and scores each answer on a 1–10 rubric.",
  },
  {
    icon: Download,
    name: "Export Agent",
    label: "A7",
    desc: "Aggregates all pipeline outputs into a styled, downloadable PDF Career Dossier using ReportLab.",
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
    desc: "Watch 7 AI agents process your data in real-time via Server-Sent Events — no page reloads.",
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
    title: "Multi-Agent Collaboration",
    tag: "Core Architecture",
    desc: "7 specialized agents in a parallel + sequential DAG. Agents (A1 || A2) and (A4 || A5) execute concurrently via asyncio.gather(), cutting end-to-end latency in half.",
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

const AGENTS_CHECKPOINTS: LedgerCheckpoint[] = AGENTS.map((a) => ({
  label: `${a.label}: ${a.name} — ${a.desc}`,
  status: "complete",
}));

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
            Upload your CV, pick your target role, and Ustaad&apos;s 7-agent AI pipeline gives you a real-time market snapshot,
            honest skill gap analysis, a personalized learning roadmap, an ATS-optimized CV rewrite, and a mock interview
            with scored feedback — all in under 5 minutes.
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

      {/* 4. The 7 AI Agents — Detailed Ledger Grid */}
      <AnimatedSection className="bg-parchment text-ink rounded-sm border border-brass/40 p-8 md:p-12 shadow-2xl relative flex flex-col gap-8 paper-grain">
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-brass z-10 pointer-events-none" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-brass z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-brass z-10 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-brass z-10 pointer-events-none" />

        <div>
          <h2 className="font-display text-3xl md:text-4xl text-ink">7 AI Agents. One Career Dossier.</h2>
          <p className="font-body text-xs text-ink/70 mt-1">
            Powered by Gemini 3.1 Flash Lite — each agent handles one critical piece of your career puzzle.
          </p>
        </div>

        {/* Vertical LedgerLine signature view */}
        <div className="py-2 border-b border-ink/15 pb-6">
          <LedgerLine orientation="vertical" variant="on-parchment" checkpoints={AGENTS_CHECKPOINTS} />
        </div>

        {/* Detailed Cards Grid */}
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
                  <agent.icon size={18} className="text-teal" />
                </div>
                <h4 className="font-display text-lg text-ink mt-1">{agent.name}</h4>
                <p className="font-body text-xs text-ink/75 leading-relaxed">{agent.desc}</p>
              </div>
            </StaggerChild>
          ))}
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
              Out of the box, Ustaad runs completely free on Google&apos;s shared Gemini tier. During peak student traffic, shared daily requests can run tight — or you may want to test frontier reasoning models on your CV.
            </p>
            <p className="font-body text-xs sm:text-sm text-warm-gray leading-relaxed">
              With BYOK mode, you can connect a free key from{" "}
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
              , or bring keys from OpenAI (ChatGPT), Anthropic (Claude), DeepSeek, Alibaba Qwen, Zhipu GLM, or OpenRouter — including custom model IDs. Keys live strictly in your browser&apos;s localStorage and are never stored in any database. BYOK requests always run directly through your chosen provider and never failover to secondary models.
            </p>
          </div>

          <div className="border-l-2 border-brass pl-6 py-1 flex flex-col gap-2">
            <h3 className="font-display text-xl text-brass">
              Is my CV or data stored anywhere?
            </h3>
            <p className="font-body text-xs sm:text-sm text-warm-gray leading-relaxed">
              Your parsed CV text and agent outputs are stored server-side in Supabase under an unguessable 128-bit UUID session link until retention expiry (sessions older than 30 days are automatically purged). Anyone with that exact link can view your dashboard, mock interview, and dossier — treat it like a private access token and do not post it publicly. Session pages are configured with strict <code>robots: noindex, nofollow</code> headers so search engines will never index your results.
            </p>
            <p className="font-body text-xs sm:text-sm text-warm-gray leading-relaxed">
              Your data is never used to train foundational AI models, sold, or shared with third-party advertisers. On the shared server-default tier, requests may failover to an operator-configured secondary model if primary API rate limits occur; BYOK requests never do.
            </p>
          </div>

          <div className="border-l-2 border-brass pl-6 py-1 flex flex-col gap-2">
            <h3 className="font-display text-xl text-brass">
              Is Ustaad really free to use?
            </h3>
            <p className="font-body text-xs sm:text-sm text-warm-gray leading-relaxed">
              Yes, 100% free. The full 7-agent pipeline market research, gap analysis, roadmap, ATS CV rewrite, mock interview, and PDF dossier... is completely free. If you bring your own Gemini key, it is also free under Google&apos;s standard free-tier limits.
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
              <p className="font-mono text-xs text-teal font-semibold mt-1">Backend Engineer & AI Agents</p>
              <p className="font-body text-xs text-ink/80 mt-3 leading-relaxed">
                GenAI developer and co-founder of AgenticEra Systems. Built the entire 7-agent pipeline,
                FastAPI backend, orchestration logic and contributed across the frontend as well.
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
                Full-stack, agentic systems developer and Founder of AgenticEra Systems.
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
          Upload your CV, select your target role, and get your complete market snapshot,
          gap analysis, roadmap, ATS rewrite, and AI mock interview in under 5 minutes.
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
