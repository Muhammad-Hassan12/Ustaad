"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CVUpload from "@/components/CVUpload";
import LedgerLine from "@/components/LedgerLine";
import AnimatedSection, { StaggerChild } from "@/components/AnimatedSection";
import { startPipeline } from "@/lib/api";
import ApiKeyModal from "@/components/ApiKeyModal";
import ResumeSessionModal from "@/components/ResumeSessionModal";
import {
  ActiveBYOKConfig,
  BYOK_UPDATED_EVENT,
  getActiveBYOKConfig,
  SERVER_DEFAULT_MODEL,
} from "@/lib/llmConfig";
import {
  ArrowRight,
  Loader2,
  Sparkles,
  ChevronDown,
  AlertCircle,
  UserSearch,
  TrendingUp,
  GitCompare,
  Map,
  FileSignature,
  Mic,
  Download,
  ShieldCheck,
  Zap,
  Globe,
  FileText,
  Cpu,
} from "lucide-react";

const DEFAULT_CITIES = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Peshawar",
  "Multan",
  "Gujranwala",
  "Sialkot",
  "Hyderabad",
  "Quetta",
  "Remote",
];

const AGENT_PREVIEWS = [
  { icon: UserSearch, name: "Profile Agent", tag: "A1", desc: "Parses CV into structured JSON" },
  { icon: TrendingUp, name: "Market Agent", tag: "A2", desc: "Live Pakistani job grounding + cache" },
  { icon: GitCompare, name: "Gap Agent", tag: "A3", desc: "0–100 Readiness + JD Match Score" },
  { icon: Map, name: "Roadmap Agent", tag: "A4", desc: "Interactive 30/60/90-day plan" },
  { icon: FileSignature, name: "CV Rewrite Agent", tag: "A5", desc: "ATS bullets + referral outreach" },
  { icon: Mic, name: "Interview Agent", tag: "A6", desc: "Custom sprint & full mock loops" },
  { icon: Download, name: "Export Studio", tag: "A7", desc: "PDF Dossier + Printable ATS CV" },
];

export default function Home() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState("");
  const [targetCity, setTargetCity] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [experience, setExperience] = useState(1);
  const [educationLevel, setEducationLevel] = useState("Bachelor's");
  const [showJdInput, setShowJdInput] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [activeByok, setActiveByok] = useState<ActiveBYOKConfig | null>(null);

  const checkKeyStatus = () => {
    if (typeof window !== "undefined") {
      setActiveByok(getActiveBYOKConfig());
    }
  };

  useEffect(() => {
    checkKeyStatus();
    window.addEventListener(BYOK_UPDATED_EVENT, checkKeyStatus);
    window.addEventListener("storage", checkKeyStatus);

    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener(BYOK_UPDATED_EVENT, checkKeyStatus);
      window.removeEventListener("storage", checkKeyStatus);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectCity = (city: string) => {
    setTargetCity(city);
    setSearchTerm("");
    setIsOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please upload your CV (PDF format) to start.");
      return;
    }
    if (!targetRole.trim()) {
      setError("Please enter your target job role.");
      return;
    }
    if (!targetCity.trim()) {
      setError("Please select or enter your target city.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("cv_file", file);
      formData.append("target_role", targetRole);
      formData.append("target_city", targetCity);
      formData.append("experience_years", experience.toString());
      formData.append("education_level", educationLevel);
      if (jobDescription.trim()) {
        formData.append("job_description", jobDescription.trim());
      }

      const res = await startPipeline(formData);
      if (res && res.session_id) {
        router.push(`/dashboard/${res.session_id}`);
      } else {
        setError(res.detail || "An error occurred while launching the pipeline.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to contact the backend server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col gap-20 bg-ink text-parchment py-10 px-6 md:px-12 lg:px-16 max-w-7xl mx-auto w-full">
      {/* 1. Hero 2-Column Grid Layout */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start pt-4">
        {/* Left Column: Hero Copy & Ledger Line */}
        <div className="lg:col-span-7 flex flex-col gap-6 lg:pt-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-sm bg-parchment/5 text-brass border border-brass/30 text-xs font-mono tracking-wider uppercase self-start">
            <Sparkles size={13} />
            AI Career OS · Built for Pakistani Tech Talent
          </div>

          <h1 className="font-display text-6xl md:text-8xl leading-none tracking-tight text-shimmer">
            Meet Ustaad
            <span
              className="block text-3xl md:text-4xl text-warm-gray font-normal mt-2 font-display"
              style={{ WebkitTextFillColor: "unset", backgroundImage: "none" }}
            >
              اُستاد
            </span>
          </h1>

          {/* Tagline as marginal annotation */}
          <div className="border-l-4 border-brass pl-6 max-w-xl">
            <p className="font-body text-xl md:text-2xl text-brass font-medium">
              The career coach Pakistan never had.
            </p>
            <p className="font-body text-sm text-warm-gray mt-3 leading-relaxed">
              Upload your CV, pick your target role, and Ustaad&apos;s parallel 7-agent pipeline delivers live Pakistani market salaries, an honest skill-gap &amp; JD match score, an interactive 30/60/90-day roadmap, a ready-to-export ATS CV rewrite, and custom AI mock interviews.
            </p>
          </div>

          {/* Feature Badges */}
          <div className="flex flex-wrap items-center gap-3 my-1">
            <span className="font-mono text-xs text-brass bg-brass/10 border border-brass/30 px-3.5 py-1.5 rounded-sm inline-flex items-center gap-2 whitespace-nowrap leading-none">
              <Zap size={13} className="shrink-0" /> 7 Parallel AI Agents
            </span>
            <span className="font-mono text-xs text-teal bg-teal/10 border border-teal/30 px-3.5 py-1.5 rounded-sm inline-flex items-center gap-2 whitespace-nowrap leading-none">
              <Globe size={13} className="shrink-0" /> Live Pakistani Market Grounding
            </span>
            <span className="font-mono text-xs text-parchment bg-parchment/10 border border-warm-gray/30 px-3.5 py-1.5 rounded-sm inline-flex items-center gap-2 whitespace-nowrap leading-none">
              <Cpu size={13} className="shrink-0 text-brass" /> Multi-Model BYOK Ready
            </span>
            <span className="font-mono text-xs text-parchment bg-parchment/10 border border-warm-gray/30 px-3.5 py-1.5 rounded-sm inline-flex items-center gap-2 whitespace-nowrap leading-none">
              <ShieldCheck size={13} className="shrink-0 text-teal" /> 100% Free &amp; Open Source
            </span>
          </div>

          {/* Horizontal LedgerLine Workflow */}
          <div className="mt-4 pt-4 border-t border-warm-gray/15 max-w-lg">
            <span className="font-mono text-[11px] text-warm-gray uppercase tracking-widest block mb-3">
              3-Step Workflow:
            </span>
            <LedgerLine
              orientation="horizontal"
              variant="on-ink"
              checkpoints={[
                { label: "1. Upload CV", status: file ? "complete" : "active" },
                { label: "2. Live Analysis", status: "pending" },
                { label: "3. Export & Interview", status: "pending" },
              ]}
            />
          </div>
        </div>

        {/* Right Column: Parchment Form Card */}
        <div className="lg:col-span-5 w-full">
          <form
            onSubmit={handleSubmit}
            className="bg-parchment text-ink rounded-sm border border-brass/40 p-7 md:p-8 shadow-2xl relative flex flex-col gap-5 paper-grain"
          >
            {/* Decorative brass corner ticks */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-brass z-10 pointer-events-none" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-brass z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-brass z-10 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-brass z-10 pointer-events-none" />

            {/* Header */}
            <div className="border-b border-ink/15 pb-3.5">
              <h2 className="font-display text-2xl md:text-3xl text-ink">
                Start Your Career Analysis
              </h2>
              <p className="font-body text-xs text-ink/70 mt-1">
                Upload your PDF resume and target role to launch Ustaad&apos;s multi-agent pipeline.
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-sm bg-critical-red/10 border-l-4 border-critical-red text-critical-red text-xs flex items-start gap-2.5 font-body">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* CV Upload Dropzone */}
            <div className="flex flex-col gap-2">
              <label className="font-mono text-xs font-semibold text-ink/80 uppercase tracking-wider">
                1. Upload CV (PDF)
              </label>
              <CVUpload file={file} onFileChange={setFile} />
            </div>

            <div className="border-t border-ink/10 pt-4 flex flex-col gap-4">
              <label className="font-mono text-xs font-semibold text-ink/80 uppercase tracking-wider">
                2. Job &amp; Experience Details
              </label>

              <div className="flex flex-col gap-4">
                {/* Target Role */}
                <div className="flex flex-col gap-1.5">
                  <span className="font-body text-xs text-ink/70 font-medium">Target Role</span>
                  <input
                    type="text"
                    placeholder="e.g. Machine Learning Engineer, Full Stack Developer"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full bg-transparent border-b-2 border-ink/20 pb-2 font-body text-sm text-ink focus:border-brass focus:outline-none transition-colors placeholder:text-ink/40"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Target City */}
                  <div className="flex flex-col gap-1.5 relative" ref={dropdownRef}>
                    <span className="font-body text-xs text-ink/70 font-medium">Target City</span>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search city..."
                        value={isOpen ? searchTerm : targetCity}
                        onFocus={() => {
                          setSearchTerm(targetCity);
                          setIsOpen(true);
                        }}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSearchTerm(val);
                          setTargetCity(val);
                        }}
                        className="w-full bg-transparent border-b-2 border-ink/20 pb-2 pr-8 font-body text-sm text-ink focus:border-brass focus:outline-none transition-colors placeholder:text-ink/40"
                      />
                      <div
                        onClick={() => setIsOpen(!isOpen)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 text-ink/60 cursor-pointer p-1"
                      >
                        <ChevronDown
                          size={16}
                          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                        />
                      </div>
                    </div>

                    {isOpen && (
                      <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 max-h-48 overflow-y-auto rounded-sm border border-brass/40 bg-parchment py-1 shadow-xl text-ink">
                        {DEFAULT_CITIES.filter((c) =>
                          c.toLowerCase().includes(searchTerm.toLowerCase())
                        ).map((city) => (
                          <button
                            key={city}
                            type="button"
                            onClick={() => selectCity(city)}
                            className={`w-full text-left px-4 py-2 font-body text-xs transition-colors hover:bg-brass/15 ${
                              targetCity.toLowerCase() === city.toLowerCase()
                                ? "text-brass font-bold bg-brass/10"
                                : "text-ink"
                            }`}
                          >
                            {city}
                          </button>
                        ))}

                        {searchTerm.trim() &&
                          !DEFAULT_CITIES.some(
                            (c) => c.toLowerCase() === searchTerm.trim().toLowerCase()
                          ) && (
                            <button
                              type="button"
                              onClick={() => selectCity(searchTerm.trim())}
                              className="w-full text-left px-4 py-2 font-body text-xs text-brass font-semibold hover:bg-brass/15 border-t border-ink/10"
                            >
                              Use custom: &quot;{searchTerm.trim()}&quot;
                            </button>
                          )}
                      </div>
                    )}
                  </div>

                  {/* Experience Years */}
                  <div className="flex flex-col gap-1.5">
                    <span className="font-body text-xs text-ink/70 font-medium">
                      Experience (Years)
                    </span>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      step="0.5"
                      value={experience}
                      onChange={(e) => setExperience(parseFloat(e.target.value) || 0)}
                      className="w-full bg-transparent border-b-2 border-ink/20 pb-2 font-mono text-sm text-ink focus:border-brass focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Education Level */}
                <div className="flex flex-col gap-1.5">
                  <span className="font-body text-xs text-ink/70 font-medium">Education Level</span>
                  <select
                    value={educationLevel}
                    onChange={(e) => setEducationLevel(e.target.value)}
                    className="w-full bg-transparent border-b-2 border-ink/20 pb-2 font-body text-sm text-ink focus:border-brass focus:outline-none transition-colors cursor-pointer"
                  >
                    <option value="Ph.D.">Ph.D. Degree</option>
                    <option value="Master's">Master&apos;s Degree</option>
                    <option value="Bachelor's">Bachelor&apos;s Degree</option>
                    <option value="Undergraduate">Undergraduate / Student</option>
                    <option value="Associate / Diploma">Associate Degree / Diploma</option>
                    <option value="Intermediate / A-Levels">Intermediate / A-Levels</option>
                    <option value="Matric / O-Levels">Matriculation / O-Levels</option>
                    <option value="Self-taught">Self-taught / Other</option>
                  </select>
                </div>

                {/* Optional Specific Job Description Drawer */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowJdInput(!showJdInput)}
                    className="w-full flex items-center justify-between text-left px-3 py-2 rounded-sm border border-ink/15 bg-ink/[0.03] hover:border-brass/50 transition-colors cursor-pointer"
                  >
                    <span className="font-mono text-[11px] font-semibold text-ink/80 flex items-center gap-1.5">
                      <FileText size={13} className="text-teal" />
                      {jobDescription.trim()
                        ? "Target Job Description Added ✓"
                        : "Tailor to a Specific Job Posting (Optional)"}
                    </span>
                    <ChevronDown
                      size={14}
                      className={`text-ink/60 transition-transform ${showJdInput ? "rotate-180" : ""}`}
                    />
                  </button>

                  {showJdInput && (
                    <div className="mt-2 flex flex-col gap-1.5">
                      <textarea
                        rows={4}
                        placeholder="Paste a specific job description from LinkedIn, Rozee.pk, or a company career page to unlock a JD Match Score, missing JD keywords, and a tailored LinkedIn referral note..."
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        maxLength={8000}
                        className="w-full p-3 rounded-sm bg-transparent border border-ink/25 focus:border-brass focus:outline-none font-body text-xs text-ink leading-relaxed placeholder:text-ink/40 resize-y"
                      />
                      <span className="font-mono text-[10px] text-ink/50 text-right">
                        {jobDescription.length}/8000 chars · Zero extra API calls
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brass text-ink font-body font-semibold px-8 py-4 rounded-sm hover:bg-brass/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer shadow-xl text-base"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Launching Career OS...</span>
                  </>
                ) : (
                  <>
                    <span>Start My Analysis</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              <p className="text-center font-mono text-[11px] text-ink/65 mt-3">
                {activeByok ? (
                  <>
                    BYOK Active · Powered by{" "}
                    <strong className="text-teal">
                      {activeByok.providerShortName} ({activeByok.model})
                    </strong>
                  </>
                ) : (
                  <>Fast Parallel Pipeline · Default: {SERVER_DEFAULT_MODEL}</>
                )}
              </p>

              <p className="text-center font-body text-xs text-ink/65 mt-1">
                {activeByok ? "Want to switch AI provider or model? " : "Using free shared server key — "}
                <button
                  type="button"
                  onClick={() => setIsKeyModalOpen(true)}
                  className="text-brass underline hover:text-brass/80 cursor-pointer font-medium"
                >
                  {activeByok
                    ? "configure BYOK settings →"
                    : "bring your own key (Claude, GPT, DeepSeek, Qwen, GLM, Groq) →"}
                </button>
              </p>

              <p className="text-center font-body text-[11px] text-ink/50 mt-3 border-t border-ink/10 pt-3">
                Have a previous Session ID?{" "}
                <button
                  type="button"
                  onClick={() => setIsResumeModalOpen(true)}
                  className="text-brass underline hover:text-brass/80 font-medium cursor-pointer"
                >
                  Resume Analysis →
                </button>
              </p>
            </div>
          </form>
        </div>
      </section>

      {/* 2. Section: 7 AI Agents Preview Grid */}
      <AnimatedSection className="flex flex-col gap-8 border-t border-warm-gray/15 pt-16">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-xs text-brass uppercase tracking-widest">
            Behind the Scenes
          </span>
          <h2 className="font-display text-3xl md:text-4xl text-parchment">
            7 Autonomous AI Agents Working For You
          </h2>
          <p className="font-body text-xs text-warm-gray max-w-2xl leading-relaxed">
            From parallel CV &amp; market intelligence parsing to ATS resume generation and custom mock interviews — each specialized agent handles one critical pillar of your career strategy.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
          {AGENT_PREVIEWS.map((agent, idx) => (
            <StaggerChild key={idx} index={idx}>
              <div className="bg-parchment text-ink rounded-sm border border-brass/30 p-4 flex flex-col gap-2 relative shadow-md hover:border-brass transition-colors card-hover paper-grain h-full">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[10px] font-bold text-brass bg-brass/10 border border-brass/30 px-2 py-0.5 rounded-sm">
                    {agent.tag}
                  </span>
                  <agent.icon size={16} className="text-teal" />
                </div>
                <h4 className="font-display text-sm font-semibold text-ink mt-1">{agent.name}</h4>
                <p className="font-body text-[11px] text-ink/75 leading-tight">{agent.desc}</p>
              </div>
            </StaggerChild>
          ))}
        </div>
      </AnimatedSection>

      {/* 3. Section: What Ustaad Delivers */}
      <AnimatedSection className="bg-parchment text-ink rounded-sm border border-brass/40 p-8 md:p-12 shadow-2xl relative flex flex-col gap-8 paper-grain">
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-brass" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-brass" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-ink/15 pb-6">
          <div>
            <span className="font-mono text-xs font-bold text-brass uppercase tracking-widest block mb-1">
              Complete Career Intelligence
            </span>
            <h2 className="font-display text-3xl md:text-4xl text-ink">
              What You Get in Minutes
            </h2>
          </div>
          <Link
            href="/about"
            className="font-body text-xs font-semibold text-teal hover:text-brass flex items-center gap-1 transition-colors"
          >
            Learn more about the architecture →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 rounded-sm border border-ink/15 bg-ink/[0.03] flex flex-col gap-2">
            <span className="font-mono text-xs font-bold text-brass">01 / MARKET SNAPSHOT</span>
            <h3 className="font-display text-xl text-ink">Real-Time Demand</h3>
            <p className="font-body text-xs text-ink/75 leading-relaxed">
              Live Pakistani tech job queries for local PKR salary ranges, remote ratios, and top hiring software houses.
            </p>
          </div>

          <div className="p-5 rounded-sm border border-ink/15 bg-ink/[0.03] flex flex-col gap-2">
            <span className="font-mono text-xs font-bold text-teal">02 / GAP &amp; JD SCORE</span>
            <h3 className="font-display text-xl text-ink">0–100 Readiness</h3>
            <p className="font-body text-xs text-ink/75 leading-relaxed">
              Honest gap breakdown against live market demands plus exact Job Description match scoring.
            </p>
          </div>

          <div className="p-5 rounded-sm border border-ink/15 bg-ink/[0.03] flex flex-col gap-2">
            <span className="font-mono text-xs font-bold text-brass">03 / ATS CV &amp; ROADMAP</span>
            <h3 className="font-display text-xl text-ink">Printable ATS CV</h3>
            <p className="font-body text-xs text-ink/75 leading-relaxed">
              Checkable 30/60/90-day free learning roadmap plus a clean single-column ATS resume ready to export as PDF.
            </p>
          </div>

          <div className="p-5 rounded-sm border border-ink/15 bg-ink/[0.03] flex flex-col gap-2">
            <span className="font-mono text-xs font-bold text-teal">04 / MOCK INTERVIEW 2.0</span>
            <h3 className="font-display text-xl text-ink">Custom Interview Loops</h3>
            <p className="font-body text-xs text-ink/75 leading-relaxed">
              Choose a 5-question rapid sprint, technical deep-dive, STAR behavioral prep, or full 15-question loop.
            </p>
          </div>
        </div>
      </AnimatedSection>

      {/* 4. Bottom Recognition Banner */}
      <AnimatedSection className="border-t border-warm-gray/20 pt-8 pb-12 flex flex-col sm:flex-row justify-between items-center text-xs font-mono text-warm-gray gap-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brass animate-ping" />
          <span>Originally built for Kaggle × Google AI Agents Capstone · Open Source Career OS</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/about" className="hover:text-brass transition-colors">
            About Ustaad
          </Link>
          <a
            href="https://github.com/Muhammad-Hassan12/Ustaad"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-brass transition-colors"
          >
            GitHub Repository
          </a>
        </div>
      </AnimatedSection>

      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        onKeyUpdated={checkKeyStatus}
      />

      <ResumeSessionModal
        isOpen={isResumeModalOpen}
        onClose={() => setIsResumeModalOpen(false)}
      />
    </main>
  );
}
