"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import CVUpload from "@/components/CVUpload";
import { startPipeline } from "@/lib/api";
import { ArrowRight, Loader2, Sparkles, Brain, Target, Zap, FileText, ChevronDown } from "lucide-react";

const features = [
  { icon: Brain, label: "AI Profile Analysis", desc: "Deep CV parsing & profiling" },
  { icon: Target, label: "Market Intelligence", desc: "Live Pakistan job market data" },
  { icon: Zap, label: "Gap Analysis & Roadmap", desc: "Personalized learning paths" },
  { icon: FileText, label: "ATS CV Rewrite", desc: "Keyword-optimized resume" },
];

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
  "Remote"
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
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
      setError("Please upload your CV PDF first.");
      return;
    }
    if (!targetRole.trim()) {
      setError("Please specify your target job role.");
      return;
    }
    if (!targetCity.trim()) {
      setError("Please specify your target city.");
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

      const res = await startPipeline(formData);
      if (res && res.session_id) {
        router.push(`/dashboard/${res.session_id}`);
      } else {
        setError(res.detail || "An error occurred while launching the pipeline.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to contact the backend server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] rounded-full bg-indigo-500/8 dark:bg-indigo-900/12 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[45%] h-[45%] rounded-full bg-purple-500/8 dark:bg-purple-900/12 blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] rounded-full bg-violet-500/5 dark:bg-violet-900/8 blur-[100px] pointer-events-none" />

      <div className="max-w-5xl mx-auto w-full flex flex-col items-center gap-12 z-10">

        {/* Hero Section */}
        <div className="text-center flex flex-col items-center gap-5 animate-fadeInUp">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200/40 dark:border-indigo-800/40 text-xs font-bold uppercase tracking-widest">
            <Sparkles size={12} />
            Kaggle Capstone · Vibe Coding Submission
          </div>

          <div className="flex flex-col gap-3">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-none">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-700 to-slate-600 dark:from-white dark:via-slate-200 dark:to-slate-400">
                Ustaad
              </span>{" "}
              <span className="font-serif font-light text-indigo-500 dark:text-indigo-400 text-4xl md:text-6xl">
                اُستاد
              </span>
            </h1>
            <p className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-200 mt-1">
              The career coach{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-500 dark:from-indigo-400 dark:to-cyan-400">
                Pakistan never had.
              </span>
            </p>
            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed mx-auto mt-2">
              Your AI-powered Career OS. Upload your CV — get a complete market snapshot, gap analysis, learning roadmap, ATS-optimized rewrite, and a personalized mock interview.
            </p>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-3 mt-1">
            {features.map((f, i) => (
              <div
                key={f.label}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400 shadow-sm animate-fadeInUp`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <f.icon size={13} className="text-indigo-500 shrink-0" />
                {f.label}
              </div>
            ))}
          </div>
        </div>

        {/* Input Form Card */}
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-xl shadow-slate-200/60 dark:shadow-slate-950/80 flex flex-col gap-0 overflow-hidden animate-fadeInUp delay-200 transition-all duration-300"
        >
          {/* Form Header */}
          <div className="px-8 pt-7 pb-4 border-b border-slate-100 dark:border-slate-800/60 transition-colors duration-300">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Start Your Career Analysis
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
              Fill in the details below and upload your CV to begin.
            </p>
          </div>

          <div className="px-8 py-6 flex flex-col gap-5">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 text-xs leading-relaxed flex items-start gap-2">
                <span className="shrink-0 mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* CV Upload */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Upload CV (PDF)
              </label>
              <CVUpload file={file} onFileChange={setFile} />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800 transition-colors duration-300" />
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Job Details
              </span>
              <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800 transition-colors duration-300" />
            </div>

            {/* Form Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Target Role
                </label>
                <input
                  type="text"
                  placeholder="e.g. Machine Learning Engineer"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm text-slate-900 dark:text-slate-100 transition-all placeholder-slate-400 dark:placeholder-slate-600"
                />
              </div>

              <div className="flex flex-col gap-1.5 relative" ref={dropdownRef}>
                <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Target City
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search or type city..."
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
                    className="w-full px-4 py-2.5 pr-10 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm text-slate-900 dark:text-slate-100 transition-all placeholder-slate-400 dark:placeholder-slate-600"
                  />
                  <div
                    onClick={() => setIsOpen(!isOpen)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 cursor-pointer p-1"
                  >
                    <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                  </div>
                </div>

                {isOpen && (
                  <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 max-h-52 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-1 shadow-lg shadow-slate-200/50 dark:shadow-slate-950/80">
                    {DEFAULT_CITIES.filter(c => c.toLowerCase().includes(searchTerm.toLowerCase())).map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => selectCity(city)}
                        className={`w-full text-left px-4 py-2 text-xs transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                          targetCity.toLowerCase() === city.toLowerCase()
                            ? "text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/30 dark:bg-indigo-950/20"
                            : "text-slate-700 dark:text-slate-350"
                        }`}
                      >
                        {city}
                      </button>
                    ))}

                    {searchTerm.trim() && !DEFAULT_CITIES.some(c => c.toLowerCase() === searchTerm.trim().toLowerCase()) && (
                      <button
                        type="button"
                        onClick={() => selectCity(searchTerm.trim())}
                        className="w-full text-left px-4 py-2 text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 border-t border-slate-100 dark:border-slate-800/60 mt-1 pt-2"
                      >
                        Use custom: "{searchTerm.trim()}"
                      </button>
                    )}

                    {DEFAULT_CITIES.filter(c => c.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && !searchTerm.trim() && (
                      <div className="px-4 py-3 text-xs text-slate-400 dark:text-slate-500 text-center">
                        Type a city name to select it
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Years of Experience
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  step="0.5"
                  value={experience}
                  onChange={(e) => setExperience(parseFloat(e.target.value) || 0)}
                  className="px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm text-slate-900 dark:text-slate-100 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Education Level
                </label>
                <select
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                  className="px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm text-slate-900 dark:text-slate-100 transition-all cursor-pointer"
                >
                  <option value="Ph.D.">Ph.D. Degree</option>
                  <option value="Master's">Master&apos;s Degree</option>
                  <option value="Bachelor's">Bachelor&apos;s Degree</option>
                  <option value="Associate / Diploma">Associate Degree / Diploma</option>
                  <option value="Intermediate / A-Levels">Intermediate / A-Levels</option>
                  <option value="Matric / O-Levels">Matriculation / O-Levels</option>
                  <option value="Self-taught">Self-taught / Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit Footer */}
          <div className="px-8 pb-7">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Launching Career OS...
                </>
              ) : (
                <>
                  Start My Analysis
                  <ArrowRight size={16} />
                </>
              )}
            </button>
            <p className="text-center text-[10px] text-slate-400 dark:text-slate-600 mt-3">
              Analysis takes 2-4 minutes. Powered by Google Gemini 2.5 Flash.
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}
