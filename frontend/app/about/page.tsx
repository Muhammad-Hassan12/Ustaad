"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight, Sparkles, ChevronRight, ExternalLink,
  UserSearch, TrendingUp, GitCompare, Map, FileSignature,
  Mic, Target, Zap, Database, Search, FileText, Palette, Globe
} from "lucide-react";

/* ── Brand SVG Icons (lucide-react doesn't ship Github/Linkedin in this version) ── */
function GithubIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
    </svg>
  );
}

function LinkedinIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

/* ── Animation helpers ── */
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

/* ── Agent data ── */
const agents = [
  { icon: UserSearch,    name: "Profile Agent",            desc: "Parses your CV and builds a structured candidate profile" },
  { icon: TrendingUp,    name: "Market Intelligence Agent", desc: "Searches Pakistani job boards in real-time via Serper.dev" },
  { icon: GitCompare,    name: "Gap Analysis Agent",        desc: "Compares your skills against market demand with a readiness score" },
  { icon: Map,           name: "Roadmap Agent",            desc: "Builds a personalized 30/60/90-day learning plan using free resources" },
  { icon: FileSignature, name: "CV Rewrite Agent",          desc: "Rewrites your CV for ATS optimization with before/after comparison" },
  { icon: Mic,           name: "Interview Agent",           desc: "Runs a multi-turn mock interview with scored feedback per answer" },
  { icon: Target,        name: "Orchestrator",              desc: "Supervises the entire pipeline and assembles your Career Dossier" },
];

/* ── Tech stack ── */
const stack = [
  { icon: Sparkles, name: "Gemini 2.5 Flash" },
  { icon: Zap,      name: "FastAPI" },
  { icon: Globe,    name: "Next.js 14" },
  { icon: Database, name: "Supabase" },
  { icon: Search,   name: "Serper.dev" },
  { icon: FileText, name: "PyMuPDF" },
  { icon: Palette,  name: "Tailwind CSS" },
];

export default function AboutPage() {
  return (
    <main className="about-page-wrapper relative min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 overflow-x-hidden">

      {/* ── Ambient background ── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-600/10 blur-[120px] dark:bg-indigo-900/10" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/5 blur-[100px] dark:bg-cyan-900/10" />
        <div
          className="absolute inset-0 opacity-[0.06] dark:opacity-[0.03]"
          style={{ backgroundImage: `radial-gradient(circle, #6366F1 1px, transparent 1px)`, backgroundSize: "40px 40px" }}
        />
      </div>

      <div className="relative z-10">

        {/* ══════════════════════════════════════
            SECTION 1 — HERO
        ══════════════════════════════════════ */}
        <section className="relative min-h-[85vh] flex flex-col items-center justify-center text-center px-6 py-20 gap-8">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 text-xs font-bold uppercase tracking-widest"
          >
            <Sparkles size={11} />
            Kaggle Capstone · Vibe Coding 2026
          </motion.div>

          {/* Main heading */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="flex flex-col items-center gap-3"
          >
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight leading-none">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-slate-655 dark:from-white dark:via-slate-200 dark:to-slate-400">
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
            across Pakistan — whether you&apos;re from CS, IT, Software Engineering, Data Science,
            or any tech domain. Upload your CV, pick your target role, and Ustaad&apos;s 7-agent AI
            pipeline gives you a real-time market snapshot, honest skill gap analysis,
            a personalized learning roadmap, an ATS-optimized CV rewrite, and a mock interview
            with scored feedback — all in under 5 minutes.
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
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl border border-slate-350 dark:border-slate-700 hover:border-indigo-550/40 dark:hover:border-indigo-500/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold text-sm transition-all hover:bg-indigo-500/5"
            >
              <GithubIcon size={16} />
              View on GitHub
            </a>
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
              <div className="flex flex-col gap-5 text-slate-650 dark:text-slate-400 text-base sm:text-lg leading-relaxed">
                <p>
                  Every year, thousands of tech graduates in Pakistan enter the job market
                  without a clear picture of what employers actually want. Generic CVs get ignored.
                  Skills don&apos;t match market demand. Interview prep is guesswork.
                  And there&apos;s no single tool that understands the Pakistani job market deeply enough
                  to give real, actionable guidance.
                </p>
                <p className="text-slate-800 dark:text-slate-200 font-medium">
                  Ustaad changes that. We built it to be the career partner that every Pakistani
                  tech graduate deserves — honest, intelligent, and grounded in real market data.
                </p>
              </div>
            </div>
          </div>
        </Section>

        {/* ══════════════════════════════════════
            SECTION 3 — 7 AGENTS
        ══════════════════════════════════════ */}
        <Section className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-widest mb-3">Architecture</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">
              7 AI Agents. One Career Dossier.
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
              Powered by Gemini 2.5 Flash — each agent handles one critical piece of your career puzzle.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent, i) => (
              <motion.div
                key={agent.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                whileHover={{ scale: 1.025, boxShadow: "0 10px 30px rgba(99,102,241,0.08)" }}
                className="group relative flex flex-col gap-3.5 p-6 rounded-2xl border border-slate-200/80 dark:border-indigo-500/20 bg-white dark:bg-slate-900/60 transition-all duration-300 cursor-default shadow-sm dark:shadow-none"
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/0 to-indigo-500/0 group-hover:from-indigo-500/5 group-hover:to-cyan-500/5 dark:group-hover:from-indigo-500/5 dark:group-hover:to-cyan-500/5 transition-all duration-300 pointer-events-none" />
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-cyan-400 transition-colors shrink-0">
                  <agent.icon size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">Agent {i + 1}</p>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{agent.name}</h3>
                  <p className="text-xs text-slate-550 dark:text-slate-450 mt-1.5 leading-relaxed">{agent.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* ══════════════════════════════════════
            SECTION 4 — TECH STACK
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
                transition={{ duration: 0.45, delay: i * 0.07 }}
                className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-indigo-500/20 bg-white dark:bg-indigo-500/10 text-slate-800 dark:text-indigo-200 text-sm font-semibold hover:border-indigo-400/50 dark:hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-indigo-500/15 transition-all cursor-default shadow-sm dark:shadow-none"
              >
                <item.icon size={15} className="text-indigo-500 dark:text-indigo-400" />
                {item.name}
              </motion.span>
            ))}
          </div>
        </Section>

        {/* ══════════════════════════════════════
            SECTION 5 — BUILT FOR
        ══════════════════════════════════════ */}
        <Section className="max-w-3xl mx-auto px-6 py-20 flex justify-center">
          <div className="relative w-full rounded-3xl border border-slate-200 dark:border-indigo-500/25 bg-white dark:bg-gradient-to-br dark:from-indigo-950/60 dark:to-slate-900 p-10 text-center overflow-hidden shadow-xl dark:shadow-2xl dark:shadow-indigo-500/10 border-indigo-100/50">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-indigo-500/5 dark:bg-indigo-500/15 blur-[60px] rounded-full pointer-events-none" />
            <p className="text-slate-500 dark:text-[#94A3B8] text-xs font-bold uppercase tracking-widest mb-4">Submitted to</p>
            <div className="flex items-center justify-center gap-3 mb-3">
              <span className="text-2xl sm:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 dark:from-indigo-400 dark:via-cyan-300 dark:to-indigo-400">
                Kaggle × Google
              </span>
            </div>
            <p className="text-slate-900 dark:text-white text-base sm:text-lg font-bold mb-5">
              5-Day AI Agents: Intensive Vibe Coding Capstone 2026
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-250 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-300 text-xs font-bold uppercase tracking-widest">
              🏆 Capstone Project
            </div>
          </div>
        </Section>

        {/* ══════════════════════════════════════
            SECTION 6 — THE TEAM
        ══════════════════════════════════════ */}
        <Section className="max-w-5xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-widest mb-3">Creators</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-3">The Team</h2>
            <p className="text-slate-550 dark:text-[#94A3B8] text-base">Built by two developers from Karachi, Pakistan 🇵🇰</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">

            {/* Hassan */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
              className="flex flex-col gap-5 p-7 rounded-2xl border border-slate-200/80 dark:border-indigo-500/20 bg-white dark:bg-[#1E293B] hover:border-indigo-400 dark:hover:border-indigo-500/40 transition-all shadow-sm dark:shadow-none"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-indigo-300 dark:border-indigo-500/20 shadow-md dark:shadow-lg dark:shadow-indigo-500/30 shrink-0 relative">
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
                  <p className="text-indigo-600 dark:text-indigo-400 text-xs font-semibold mt-0.5">Backend Engineer &amp; AI Agents</p>
                </div>
              </div>
              <p className="text-slate-600 dark:text-[#94A3B8] text-sm leading-relaxed">
                GenAI developer and co-founder of AgenticEra Systems.
                Built the entire 7-agent pipeline, FastAPI backend, and orchestration logic.
              </p>
              <div className="flex items-center gap-3 mt-auto pt-4 border-t border-slate-100 dark:border-slate-700/50">
                <a
                  href="https://github.com/Muhammad-Hassan12"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-slate-550 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white transition-colors font-semibold"
                >
                  <GithubIcon size={14} /> GitHub
                </a>
                <a
                  href="https://www.linkedin.com/in/syed-muhammad-hassan-aa112928b/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-slate-550 dark:text-[#94A3B8] hover:text-indigo-600 dark:hover:text-cyan-400 transition-colors font-semibold"
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
              className="flex flex-col gap-5 p-7 rounded-2xl border border-slate-200/80 dark:border-cyan-500/20 bg-white dark:bg-[#1E293B] hover:border-cyan-400 dark:hover:border-cyan-500/40 transition-all shadow-sm dark:shadow-none"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-cyan-300 dark:border-cyan-500/20 shadow-md dark:shadow-lg dark:shadow-cyan-500/30 shrink-0 relative">
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
                  <p className="text-cyan-600 dark:text-cyan-400 text-xs font-semibold mt-0.5">Frontend Engineer &amp; UI/UX</p>
                </div>
              </div>
              <p className="text-slate-600 dark:text-[#94A3B8] text-sm leading-relaxed">
                Full-stack and agentic systems developer at AgenticEra Systems.
                Built the entire Next.js frontend, dashboard, and interview UI.
              </p>
              <div className="flex items-center gap-3 mt-auto pt-4 border-t border-slate-100 dark:border-slate-700/50">
                <a
                  href="https://github.com/abdulmannan991"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-slate-550 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white transition-colors font-semibold"
                >
                  <GithubIcon size={14} /> GitHub
                </a>
                <a
                  href="https://www.linkedin.com/in/abdul-mannan-fazlani-47b274293/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-slate-550 dark:text-[#94A3B8] hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors font-semibold"
                >
                  <LinkedinIcon size={14} /> LinkedIn
                </a>
              </div>
            </motion.div>
          </div>

          {/* AgenticEra branding */}
          <div className="text-center">
            <p className="text-slate-650 dark:text-[#94A3B8] text-sm">
              A product by{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-500 dark:from-indigo-400 dark:to-cyan-400 font-bold font-sans">
                AgenticEra Systems
              </span>
              {" "}— AI automation for the real world.
            </p>
          </div>
        </Section>

        {/* ══════════════════════════════════════
            SECTION 7 — FOOTER
        ══════════════════════════════════════ */}
        <footer className="border-t border-slate-200 dark:border-slate-800/60 bg-slate-100 dark:bg-slate-950 transition-colors duration-300">
          <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-5 text-xs text-slate-500 dark:text-[#94A3B8]">
            <p className="font-semibold text-slate-700 dark:text-[#F8FAFC]">
              Ustaad{" "}
              <span className="font-serif text-indigo-650 dark:text-indigo-400">اُستاد</span>{" "}
              © 2026 AgenticEra Systems
            </p>
            <p className="text-center text-slate-450 dark:text-slate-500">
              Built with Gemini 2.5 Flash 🤖 · Made in Karachi 🇵🇰
            </p>
            <div className="flex items-center gap-5 font-semibold">
              <Link
                href="/"
                className="text-indigo-650 dark:text-indigo-400 hover:text-indigo-750 dark:hover:text-indigo-300 transition-colors flex items-center gap-1"
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
