"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight, Sparkles, ChevronRight, ExternalLink,
  UserSearch, TrendingUp, GitCompare, Map, FileSignature,
  Mic, Download, Zap, Database, Search, FileText, Palette, Globe,
  Upload, ScanLine, BrainCircuit, Award,
  BarChart3, Layers, GitBranch, Shield, RefreshCcw, BookOpen
} from "lucide-react";

/* ── Brand SVG Icons ── */
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

/* ── Scroll-triggered section wrapper ── */
function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.65 }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

/* ── Data: 7 Agents ── */
const agents = [
  {
    icon: UserSearch,
    name: "Profile Agent",
    label: "A1",
    desc: "Parses your PDF CV into a structured JSON profile — education, experience, skills, and projects.",
    accent: "indigo",
  },
  {
    icon: TrendingUp,
    name: "Market Intelligence Agent",
    label: "A2",
    desc: "Runs 4 live Serper.dev queries on Pakistani job boards (Rozee.pk, Mustakbil, LinkedIn) for real-time demand data.",
    accent: "indigo",
  },
  {
    icon: GitCompare,
    name: "Gap Analysis Agent",
    label: "A3",
    desc: "Compares your profile against market demand and computes a quantified Readiness Score (0–100).",
    accent: "indigo",
  },
  {
    icon: Map,
    name: "Roadmap Agent",
    label: "A4",
    desc: "Builds a milestone-driven 30/60/90-day learning plan with free resource links to close skill gaps.",
    accent: "cyan",
  },
  {
    icon: FileSignature,
    name: "CV Rewrite Agent",
    label: "A5",
    desc: "Rewrites your CV bullet points and summary for ATS optimization with a before/after comparison view.",
    accent: "cyan",
  },
  {
    icon: Mic,
    name: "Interview Agent",
    label: "A6",
    desc: "Runs a multi-turn mock interview with 15 tailored questions and scores each answer on a 1–10 rubric.",
    accent: "cyan",
  },
  {
    icon: Download,
    name: "Export Agent",
    label: "A7",
    desc: "Aggregates all pipeline outputs into a styled, downloadable PDF Career Dossier using ReportLab.",
    accent: "violet",
  },
];

/* ── Data: How It Works steps ── */
const steps = [
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

/* ── Data: Deliverables ── */
const deliverables = [
  { icon: BarChart3, label: "Readiness Score", desc: "0–100 readiness benchmark vs. live market data" },
  { icon: GitCompare, label: "Gap Analysis Report", desc: "Critical vs. nice-to-have skills with priority rankings" },
  { icon: Map, label: "30/60/90 Roadmap", desc: "Milestone-driven learning plan with free resource links" },
  { icon: FileSignature, label: "ATS-Optimized CV", desc: "Rewritten CV with before/after comparison view" },
  { icon: Mic, label: "Mock Interview", desc: "15 tailored Q&As with per-answer scoring and feedback" },
  { icon: Download, label: "PDF Career Dossier", desc: "Full ReportLab-generated export of all findings" },
];

/* ── Data: Course Concepts ── */
const concepts = [
  {
    icon: Layers,
    title: "Multi-Agent Collaboration",
    tag: "Core Concept",
    desc: "7 specialized agents in a sequential + parallel dependency graph. Agents A4 and A5 run concurrently via asyncio.gather(), cutting pipeline time by ~40%.",
    code: "asyncio.gather(run_roadmap_agent(), run_cv_rewrite_agent())",
  },
  {
    icon: Search,
    title: "Tool Use & Real-Time Grounding",
    tag: "Core Concept",
    desc: "The Market Agent uses Serper.dev to run 4 live Google Search queries per session against Pakistani job boards — grounding the pipeline in current market reality.",
    code: `"Python Developer jobs Karachi site:rozee.pk"`,
  },
  {
    icon: Shield,
    title: "Structured Outputs & Schema Hardening",
    tag: "Core Concept",
    desc: "Every agent enforces strict JSON output via Gemini's response_mime_type API. A 4-layer fallback parser (json → fence strip → regex → ast.literal_eval) prevents crashes.",
    code: `response_mime_type="application/json"`,
  },
  {
    icon: RefreshCcw,
    title: "Production-Grade Async Pipeline",
    tag: "Core Concept",
    desc: "Live SSE streaming via asyncio.Queue. Exponential backoff with 8 retries. Automatic failover to a secondary Kaggle-hosted Qwen model if Gemini quota is exhausted.",
    code: "wait = min(2 ** attempt, 15)  # backoff",
  },
];

/* ── Data: Tech Stack ── */
const stack = [
  { icon: Sparkles, name: "Gemini 2.5 Flash", category: "AI" },
  { icon: Zap, name: "FastAPI", category: "Backend" },
  { icon: Globe, name: "Next.js 14", category: "Frontend" },
  { icon: Database, name: "Supabase", category: "Database" },
  { icon: Search, name: "Serper.dev", category: "Tools" },
  { icon: FileText, name: "PyMuPDF", category: "Tools" },
  { icon: BookOpen, name: "ReportLab", category: "Tools" },
  { icon: Palette, name: "Tailwind CSS", category: "UI" },
  { icon: Sparkles, name: "Framer Motion", category: "UI" },
  { icon: GitBranch, name: "TypeScript", category: "Frontend" },
];

/* ══════════════════════════════════════════════════════════
   PAGE COMPONENT
══════════════════════════════════════════════════════════ */
export default function AboutPage() {
  return (
    <main className="about-page-wrapper relative min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 overflow-x-hidden">

      {/* ── Ambient background ── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-600/10 dark:bg-indigo-900/10 hidden sm:block blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/5 dark:bg-cyan-900/10 hidden sm:block blur-[100px]" />
        <div
          className="absolute inset-0 hidden sm:block opacity-[0.05] dark:opacity-[0.03]"
          style={{ backgroundImage: `radial-gradient(circle, #6366F1 1px, transparent 1px)`, backgroundSize: "40px 40px" }}
        />
      </div>

      <div className="relative z-10">

        {/* ══════════════════════════════════════
            SECTION 1 — HERO
        ══════════════════════════════════════ */}
        <section className="relative min-h-[88vh] flex flex-col items-center justify-center text-center px-6 py-24 gap-8">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 text-xs font-bold uppercase tracking-widest"
          >
            <Sparkles size={11} />
            Kaggle Capstone · AI Agents Intensive 2026
          </motion.div>

          {/* Main heading */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="flex flex-col items-center gap-3"
          >
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight leading-none">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 dark:from-white dark:via-slate-200 dark:to-slate-400">
                Meet Ustaad
              </span>
              {" "}
              <span className="font-serif font-light text-indigo-500 dark:text-indigo-400 text-4xl sm:text-5xl md:text-6xl">
                اُستاد
              </span>
            </h1>
            <p className="text-indigo-600 dark:text-indigo-400 font-medium tracking-wide text-lg sm:text-xl">
              اُستاد — Your AI-Powered Career OS
            </p>
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white max-w-3xl leading-tight"
          >
            The career coach{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-500 dark:from-indigo-400 dark:to-cyan-400">
              Pakistan never had.
            </span>
          </motion.p>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-slate-600 dark:text-slate-400 text-base sm:text-lg max-w-2xl leading-relaxed"
          >
            Ustaad is an AI-powered career intelligence platform built for tech graduates
            across Pakistan. Upload your CV, pick your target role and city, and Ustaad&apos;s
            7-agent pipeline delivers a real-time market snapshot, honest skill gap analysis,
            a personalized learning roadmap, an ATS-optimized CV rewrite, and a scored mock
            interview — all in under 5 minutes.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            <Link
              href="/"
              className="group flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 dark:shadow-indigo-500/30 hover:shadow-indigo-500/45 transition-all"
            >
              Try Ustaad
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <a
              href="https://github.com/Muhammad-Hassan12"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:border-indigo-400/60 dark:hover:border-indigo-500/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold text-sm transition-all hover:bg-indigo-500/5"
            >
              <GithubIcon size={16} />
              View on GitHub
            </a>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.2 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-600">Scroll</p>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.4, repeat: Infinity }}
              className="w-4 h-4 flex items-center justify-center"
            >
              <ChevronRight size={14} className="rotate-90 text-slate-400 dark:text-slate-600" />
            </motion.div>
          </motion.div>
        </section>

        {/* ══════════════════════════════════════
            SECTION 2 — THE PROBLEM
        ══════════════════════════════════════ */}
        <Section className="max-w-4xl mx-auto px-6 py-20">
          <div className="flex gap-5">
            <div className="w-1 rounded-full bg-gradient-to-b from-indigo-500 to-indigo-500/0 shrink-0" />
            <div className="flex flex-col gap-6">
              <div>
                <p className="text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-widest mb-3">The Problem</p>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  Why We Built This
                </h2>
              </div>
              <div className="flex flex-col gap-5 text-slate-600 dark:text-slate-400 text-base sm:text-lg leading-relaxed">
                <p>
                  Every year, thousands of CS and IT graduates in Pakistan enter the job market
                  without a clear picture of what employers actually want. Generic CVs get filtered
                  out by ATS before any human reads them. Skills don&apos;t match market demand.
                  Interview prep is guesswork. And there&apos;s no single tool that understands
                  the Pakistani tech job market deeply enough to give real, actionable guidance.
                </p>
                <p className="text-slate-800 dark:text-slate-200 font-medium">
                  Ustaad changes that. We built it to be the career partner that every Pakistani
                  tech graduate deserves — honest, intelligent, and grounded in live market data
                  from Rozee.pk, Mustakbil, and LinkedIn Pakistan.
                </p>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-4 mt-2">
                {[
                  { value: "7", label: "Specialized AI Agents" },
                  { value: "~5 min", label: "Full Pipeline Runtime" },
                  { value: "100%", label: "Pakistan-Grounded Data" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-slate-200 dark:border-indigo-500/20 bg-white dark:bg-slate-900/60 p-4 text-center shadow-sm dark:shadow-none"
                  >
                    <p className="text-2xl sm:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-500 dark:from-indigo-400 dark:to-cyan-400">
                      {stat.value}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1 leading-snug">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* ══════════════════════════════════════
            SECTION 3 — HOW IT WORKS
        ══════════════════════════════════════ */}
        <Section className="max-w-5xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-widest mb-3">User Journey</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-base max-w-xl mx-auto">
              Four simple steps from CV upload to a downloadable career dossier.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative flex flex-col gap-4 p-6 rounded-2xl border border-slate-200 dark:border-indigo-500/20 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-none"
              >
                {/* Step connector line */}
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute right-0 top-1/2 translate-x-[100%] w-5 h-0.5 bg-gradient-to-r from-indigo-300 to-indigo-300/0 dark:from-indigo-500/30 dark:to-indigo-500/0" />
                )}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                    <step.icon size={20} />
                  </div>
                  <span className="text-3xl font-black text-indigo-300 dark:text-indigo-700">{step.step}</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">{step.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* ══════════════════════════════════════
            SECTION 4 — 7 AGENTS
        ══════════════════════════════════════ */}
        <Section className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-widest mb-3">Architecture</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">
              7 AI Agents. One Career Dossier.
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
              Each agent is a specialized Gemini 2.5 Flash instance — sequential pipeline with parallel execution
              on Agents A4 + A5 for maximum speed.
            </p>
          </div>

          {/* Pipeline flow banner */}
          <div className="mb-10 p-4 rounded-2xl bg-slate-900/5 dark:bg-slate-900/80 border border-slate-200 dark:border-indigo-500/20 overflow-x-auto">
            <div className="flex items-center justify-start sm:justify-center gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400 min-w-max mx-auto px-2">
              {["A1 Profile", "→", "A2 Market", "→", "A3 Gap", "→", "A4+A5 ⚡", "→", "A6 Interview", "→", "A7 Export PDF"].map((item, i) => (
                <span
                  key={i}
                  className={
                    item === "→"
                      ? "text-slate-300 dark:text-slate-700"
                      : item.includes("⚡")
                        ? "px-2 py-1 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/20 font-bold"
                        : "px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20 font-semibold"
                  }
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent, i) => (
              <motion.div
                key={agent.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                whileHover={{ scale: 1.025 }}
                className="group relative flex flex-col gap-3.5 p-6 rounded-2xl border border-slate-200/80 dark:border-indigo-500/20 bg-white dark:bg-slate-900/60 transition-all duration-300 cursor-default shadow-sm dark:shadow-none hover:border-indigo-300 dark:hover:border-indigo-500/40"
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/0 to-indigo-500/0 group-hover:from-indigo-500/5 group-hover:to-cyan-500/5 transition-all duration-300 pointer-events-none" />
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-cyan-400 transition-colors shrink-0">
                    <agent.icon size={20} />
                  </div>
                  <span className="text-[10px] font-black text-indigo-500/50 dark:text-indigo-500/30 font-mono">{agent.label}</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{agent.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">{agent.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* ══════════════════════════════════════
            SECTION 5 — WHAT YOU GET
        ══════════════════════════════════════ */}
        <Section className="max-w-5xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-widest mb-3">Deliverables</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">
              What You Get
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-base max-w-xl mx-auto">
              Six concrete outputs — all generated from a single CV upload.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {deliverables.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.07 }}
                className="flex items-start gap-4 p-5 rounded-2xl border border-slate-200 dark:border-indigo-500/20 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-none hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-all"
              >
                <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                  <item.icon size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{item.label}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* ══════════════════════════════════════
            SECTION 6 — COURSE CONCEPTS
        ══════════════════════════════════════ */}
        <Section className="max-w-5xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-widest mb-3">Kaggle × Google</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">
              Course Concepts Demonstrated
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-base max-w-2xl mx-auto">
              Ustaad is a direct application of 4 core agentic paradigms from the
              <span className="font-semibold text-slate-700 dark:text-slate-300"> Google AI Agents Intensive course</span>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {concepts.map((concept, i) => (
              <motion.div
                key={concept.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex flex-col gap-4 p-6 rounded-2xl border border-slate-200 dark:border-indigo-500/20 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-none"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                    <concept.icon size={20} />
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 whitespace-nowrap">
                    {concept.tag}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">{concept.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">{concept.desc}</p>
                  <code className="block text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-cyan-400 px-3 py-2 rounded-lg overflow-x-auto">
                    {concept.code}
                  </code>
                </div>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* ══════════════════════════════════════
            SECTION 7 — TECH STACK
        ══════════════════════════════════════ */}
        <Section className="max-w-4xl mx-auto px-6 py-20">
          <div className="text-center mb-10">
            <p className="text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-widest mb-3">Stack</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">Built With</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {stack.map((item, i) => (
              <motion.span
                key={item.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.06 }}
                className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-indigo-500/20 bg-white dark:bg-indigo-500/10 text-slate-800 dark:text-indigo-200 text-sm font-semibold hover:border-indigo-400/50 dark:hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-indigo-500/15 transition-all cursor-default shadow-sm dark:shadow-none"
              >
                <item.icon size={15} className="text-indigo-500 dark:text-indigo-400" />
                {item.name}
              </motion.span>
            ))}
          </div>
        </Section>

        {/* ══════════════════════════════════════
            SECTION 8 — KAGGLE BADGE
        ══════════════════════════════════════ */}
        <Section className="max-w-3xl mx-auto px-6 py-20 flex justify-center">
          <div className="relative w-full rounded-3xl border border-indigo-100 dark:border-indigo-500/25 bg-white dark:bg-gradient-to-br dark:from-indigo-950/60 dark:to-slate-900 p-10 text-center overflow-hidden shadow-xl dark:shadow-2xl dark:shadow-indigo-500/10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-indigo-500/5 dark:bg-indigo-500/15 blur-[30px] sm:blur-[60px] rounded-full pointer-events-none" />
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Submitted to</p>
            <div className="flex items-center justify-center gap-3 mb-3">
              <span className="text-2xl sm:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 dark:from-indigo-400 dark:via-cyan-300 dark:to-indigo-400">
                Kaggle × Google
              </span>
            </div>
            <p className="text-slate-900 dark:text-white text-base sm:text-lg font-bold mb-2">
              AI Agents: Intensive Vibe Coding Capstone 2026
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              Track: <span className="font-semibold text-indigo-600 dark:text-indigo-400">Agents for Business / Agents for Good</span>
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-300 text-xs font-bold uppercase tracking-widest">
                <Award size={12} />
                Capstone Project
              </div>
              <a
                href="https://www.kaggle.com/competitions/vibecoding-agents-capstone-project"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold uppercase tracking-widest hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-colors"
              >
                <ExternalLink size={11} />
                View Competition
              </a>
            </div>
          </div>
        </Section>

        {/* ══════════════════════════════════════
            SECTION 9 — THE TEAM
        ══════════════════════════════════════ */}
        <Section className="max-w-5xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-widest mb-3">Creators</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-3">The Team</h2>
            <p className="text-slate-500 dark:text-slate-400 text-base">Built by two developers from Karachi, Pakistan 🇵🇰</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">

            {/* Hassan */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
              className="flex flex-col gap-5 p-7 rounded-2xl border border-slate-200 dark:border-indigo-500/20 bg-white dark:bg-slate-900/70 hover:border-indigo-400 dark:hover:border-indigo-500/40 transition-all shadow-sm dark:shadow-none"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-indigo-300 dark:border-indigo-500/30 shadow-md shrink-0 relative">
                  <Image
                    src="https://github.com/Muhammad-Hassan12.png"
                    alt="Syed Muhammad Hassan Avatar"
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Syed Muhammad Hassan</h3>
                  <p className="text-indigo-600 dark:text-indigo-400 text-xs font-semibold mt-0.5">Backend Engineer & AI Agents</p>
                </div>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                GenAI Developer and Co-Founder of AgenticEra Systems.
                Built the entire 7-agent pipeline, FastAPI backend, orchestration logic,
                and the Kaggle Qwen model failover system.
              </p>
              <div className="flex items-center gap-4 mt-auto pt-4 border-t border-slate-100 dark:border-slate-700/50">
                <a
                  href="https://github.com/Muhammad-Hassan12"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors font-semibold"
                >
                  <GithubIcon size={14} /> GitHub
                </a>
                <a
                  href="https://www.linkedin.com/in/syed-muhammad-hassan-aa112928b/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-cyan-400 transition-colors font-semibold"
                >
                  <LinkedinIcon size={14} /> LinkedIn
                </a>
              </div>
            </motion.div>

            {/* Abdul Mannan */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.12 }}
              className="flex flex-col gap-5 p-7 rounded-2xl border border-slate-200 dark:border-cyan-500/20 bg-white dark:bg-slate-900/70 hover:border-cyan-400 dark:hover:border-cyan-500/40 transition-all shadow-sm dark:shadow-none"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-cyan-300 dark:border-cyan-500/30 shadow-md shrink-0 relative">
                  <Image
                    src="https://github.com/abdulmannan991.png"
                    alt="Abdul Mannan Fazlani Avatar"
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Abdul Mannan Fazlani</h3>
                  <p className="text-cyan-600 dark:text-cyan-400 text-xs font-semibold mt-0.5">Frontend Engineer & UI/UX</p>
                </div>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Full-stack, Agentic Systems Developer and Founder of AgenticEra Systems.
                Built the complete Next.js frontend — dashboard, SSE-driven pipeline view,
                mock interview terminal, CV diff view, and the About page.
              </p>
              <div className="flex items-center gap-4 mt-auto pt-4 border-t border-slate-100 dark:border-slate-700/50">
                <a
                  href="https://github.com/abdulmannan991"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors font-semibold"
                >
                  <GithubIcon size={14} /> GitHub
                </a>
                <a
                  href="https://www.linkedin.com/in/abdul-mannan-fazlani-47b274293/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors font-semibold"
                >
                  <LinkedinIcon size={14} /> LinkedIn
                </a>
              </div>
            </motion.div>
          </div>

          {/* AgenticEra branding */}
          <div className="text-center">
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              A product by{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-500 dark:from-indigo-400 dark:to-cyan-400 font-bold">
                AgenticEra Systems
              </span>
              {" "}— AI automation for the real world.
            </p>
          </div>
        </Section>

        {/* ══════════════════════════════════════
            SECTION 10 — FOOTER
        ══════════════════════════════════════ */}
        <footer className="border-t border-slate-200 dark:border-slate-800/60 bg-slate-100 dark:bg-slate-950 transition-colors duration-300">
          <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-5 text-xs text-slate-500 dark:text-slate-400">
            <p className="font-semibold text-slate-700 dark:text-slate-100">
              Ustaad{" "}
              <span className="font-serif text-indigo-600 dark:text-indigo-400">اُستاد</span>{" "}
              © 2026 AgenticEra Systems
            </p>
            <p className="text-center text-slate-400 dark:text-slate-500">
              Built with Gemini 2.5 Flash · Made in Karachi-Pakistan 🇵🇰
            </p>
            <div className="flex items-center gap-5 font-semibold">
              <Link
                href="/"
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors flex items-center gap-1"
              >
                Try Ustaad <ChevronRight size={12} />
              </Link>
              <a
                href="https://github.com/Muhammad-Hassan12"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5"
              >
                <GithubIcon size={12} /> GitHub
              </a>
            </div>
          </div>
        </footer>

      </div>
    </main>
  );
}
