"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CVUpload from "@/components/CVUpload";
import { startPipeline } from "@/lib/api";
import { ArrowRight, Loader2, Sparkles, Send } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState("");
  const [targetCity, setTargetCity] = useState("Karachi");
  const [experience, setExperience] = useState(1);
  const [educationLevel, setEducationLevel] = useState("Bachelor's");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <main className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-all duration-300">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 dark:bg-indigo-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/5 dark:bg-purple-900/10 blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto w-full flex flex-col items-center gap-10 z-10">
        
        {/* Title Section */}
        <div className="text-center flex flex-col items-center gap-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-150/10 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border border-indigo-100/20 dark:border-indigo-900/20 text-xs font-semibold uppercase tracking-wider">
            <Sparkles size={12} /> Capstone Vibe Coding Submission
          </div>
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-slate-650 dark:from-white dark:via-slate-200 dark:to-slate-400 leading-tight">
            Ustaad <span className="text-indigo-600 dark:text-indigo-400 font-serif font-normal">اُستاد</span>
          </h2>
          <p className="text-md md:text-lg text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
            Upload your CV PDF. Get real-time tech market snapshot, gap analysis report, learning Roadmaps, and customized mock interviews.
          </p>
        </div>

        {/* Input Card Container */}
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-xl p-8 rounded-2xl bg-white/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 backdrop-blur-md shadow-xl flex flex-col gap-6"
        >
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/20 text-rose-600 dark:text-rose-400 text-xs leading-relaxed font-semibold">
              {error}
            </div>
          )}

          {/* Drag & drop upload */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">
              Upload CV
            </label>
            <CVUpload file={file} onFileChange={setFile} />
          </div>

          {/* Form details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">
                Target Role
              </label>
              <input
                type="text"
                placeholder="e.g. Machine Learning Engineer"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800/60 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm text-slate-850 dark:text-slate-200 transition-all placeholder-slate-400"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">
                Target City
              </label>
              <select
                value={targetCity}
                onChange={(e) => setTargetCity(e.target.value)}
                className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800/60 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm text-slate-850 dark:text-slate-200 transition-all cursor-pointer"
              >
                <option value="Karachi">Karachi</option>
                <option value="Lahore">Lahore</option>
                <option value="Islamabad">Islamabad</option>
                <option value="Remote">Remote</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">
                Years of Experience
              </label>
              <input
                type="number"
                min="0"
                max="30"
                step="0.5"
                value={experience}
                onChange={(e) => setExperience(parseFloat(e.target.value) || 0)}
                className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800/60 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm text-slate-850 dark:text-slate-200 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">
                Education Level
              </label>
              <select
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
                className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800/60 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm text-slate-850 dark:text-slate-200 transition-all cursor-pointer"
              >
                <option value="Bachelor's">Bachelor's Degree</option>
                <option value="Master's">Master's Degree</option>
                <option value="Ph.D.">Ph.D. Degree</option>
                <option value="Self-taught">Self-taught / No Degree</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Processing CV...
              </>
            ) : (
              <>
                Start My Analysis <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
