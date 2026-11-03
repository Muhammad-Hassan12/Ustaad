"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPipelineResults } from "@/lib/api";
import {
  ArrowLeft,
  Printer,
  FileDown,
  Edit3,
  Check,
  Loader2,
  AlertCircle,
  Copy,
} from "lucide-react";

interface EducationObj {
  degree?: string | null;
  field?: string | null;
  university?: string | null;
  graduation_year?: number | null;
}

interface ProjectItem {
  name: string;
  original?: string;
  rewritten?: string;
  description?: string;
  technologies?: string[];
}

interface BulletItem {
  original: string;
  rewritten: string;
}

function extractContactFromCvText(cvText: string, city?: string): string {
  const parts: string[] = [];
  if (city) parts.push(`${city}, Pakistan`);

  const emailMatch = cvText.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
  if (emailMatch) parts.push(emailMatch[0]);

  const phoneMatch = cvText.match(/(?:\+92|03)\d[\d\s-]{8,12}\d/);
  if (phoneMatch) parts.push(phoneMatch[0].trim());

  const linkedinMatch = cvText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[A-Za-z0-9_-]+/i);
  if (linkedinMatch) parts.push(linkedinMatch[0].replace(/^https?:\/\/(www\.)?/i, ""));

  const githubMatch = cvText.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[A-Za-z0-9_.-]+/i);
  if (githubMatch) parts.push(githubMatch[0].replace(/^https?:\/\/(www\.)?/i, ""));

  if (parts.length === 0) {
    return "City, Pakistan | email@example.com | +92-300-0000000 | linkedin.com/in/yourprofile | github.com/yourusername";
  }
  return parts.join(" | ");
}

function formatEduLine(edu: EducationObj | string | null | undefined): string {
  if (!edu) return "";
  if (typeof edu === "string") return edu;
  const degField = [edu.degree, edu.field ? `in ${edu.field}` : ""].filter(Boolean).join(" ");
  const uniYear = [
    edu.university,
    edu.graduation_year ? `(${edu.graduation_year})` : "",
  ]
    .filter(Boolean)
    .join(" ");
  return [degField, uniYear].filter(Boolean).join(" — ");
}

export default function PrintableResumePage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [copiedMd, setCopiedMd] = useState(false);

  // Editable resume state
  const [fullName, setFullName] = useState("Candidate Name");
  const [headline, setHeadline] = useState("Software Engineer");
  const [contactLine, setContactLine] = useState("");
  const [summary, setSummary] = useState("");
  const [skillsText, setSkillsText] = useState("");
  const [experienceHeader, setExperienceHeader] = useState(
    "Relevant Technical Experience & Impact"
  );
  const [experienceBullets, setExperienceBullets] = useState<string[]>([]);
  const [projects, setProjects] = useState<Array<{ name: string; description: string }>>([]);
  const [educationLine, setEducationLine] = useState("");
  const [certifications, setCertifications] = useState<string[]>([]);
  const [atsScore, setAtsScore] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getPipelineResults(sessionId);
        if (!data || data.error) {
          setError(data?.error || "Could not load resume session.");
          return;
        }

        const profile = data.profile_data || {};
        const cv = data.cv_rewrite_data || {};

        setFullName(profile.name || "Your Full Name");
        setHeadline(data.target_role || "Software Engineer");
        setContactLine(extractContactFromCvText(data.cv_text || "", data.target_city));
        setSummary(
          cv.rewritten_summary ||
            profile.cv_summary_original ||
            profile.summary ||
            ""
        );

        const mergedSkills: string[] =
          cv.rewritten_skills_section && cv.rewritten_skills_section.length > 0
            ? cv.rewritten_skills_section
            : profile.current_skills || [];
        setSkillsText(mergedSkills.join(", "));

        const bullets: string[] = (cv.rewritten_experience_bullets || []).map(
          (b: BulletItem) => b.rewritten || b.original
        );
        setExperienceBullets(bullets);

        if (cv.rewritten_projects && cv.rewritten_projects.length > 0) {
          setProjects(
            cv.rewritten_projects.map((p: ProjectItem) => ({
              name: p.name || "Project",
              description: p.rewritten || p.original || "",
            }))
          );
        } else if (profile.projects && profile.projects.length > 0) {
          setProjects(
            profile.projects.map((p: ProjectItem) => ({
              name: p.name || "Project",
              description: [
                p.description || "",
                p.technologies && p.technologies.length > 0
                  ? `Tech: ${p.technologies.join(", ")}`
                  : "",
              ]
                .filter(Boolean)
                .join(" — "),
            }))
          );
        }

        setEducationLine(formatEduLine(profile.education));
        setCertifications(Array.isArray(profile.certifications) ? profile.certifications : []);
        if (typeof cv.ats_score_estimate === "number") {
          setAtsScore(cv.ats_score_estimate);
        }
      } catch {
        setError("Failed to connect to Ustaad server.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [sessionId]);

  const buildMarkdown = (): string => {
    const lines: string[] = [
      `# ${fullName}`,
      `**${headline}**`,
      `${contactLine}`,
      "",
    ];

    if (summary.trim()) {
      lines.push("## PROFESSIONAL SUMMARY", summary.trim(), "");
    }

    if (skillsText.trim()) {
      lines.push("## TECHNICAL SKILLS", skillsText.trim(), "");
    }

    if (experienceBullets.length > 0) {
      lines.push(`## ${experienceHeader.toUpperCase()}`);
      experienceBullets.forEach((b) => {
        if (b.trim()) lines.push(`- ${b.trim()}`);
      });
      lines.push("");
    }

    if (projects.length > 0) {
      lines.push("## PROJECTS");
      projects.forEach((p) => {
        lines.push(`### ${p.name}`);
        if (p.description.trim()) lines.push(`- ${p.description.trim()}`);
      });
      lines.push("");
    }

    if (educationLine.trim()) {
      lines.push("## EDUCATION", `- ${educationLine.trim()}`, "");
    }

    if (certifications.length > 0) {
      lines.push("## CERTIFICATIONS");
      certifications.forEach((c) => {
        if (c.trim()) lines.push(`- ${c.trim()}`);
      });
      lines.push("");
    }

    return lines.join("\n");
  };

  const handleDownloadMarkdown = () => {
    const md = buildMarkdown();
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeSlug = fullName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
    link.href = url;
    link.download = `${safeSlug || "ustaad"}_ats_resume.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(buildMarkdown());
      setCopiedMd(true);
      setTimeout(() => setCopiedMd(false), 1800);
    } catch {
      // Ignore clipboard failures
    }
  };

  const handlePrint = () => {
    if (editMode) setEditMode(false);
    setTimeout(() => {
      window.print();
    }, 80);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4 bg-ink min-h-[70vh]">
        <Loader2 className="w-8 h-8 text-brass animate-spin" />
        <div>
          <h3 className="font-display text-2xl text-parchment">
            Assembling ATS Resume Sheet...
          </h3>
          <p className="font-body text-xs text-warm-gray mt-1">
            Formatting single-column parser-safe layout
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4 bg-ink min-h-[70vh]">
        <AlertCircle className="w-12 h-12 text-critical-red" />
        <div>
          <h3 className="font-display text-2xl text-parchment">Resume Unavailable</h3>
          <p className="font-body text-xs text-warm-gray mt-1 max-w-xs">{error}</p>
        </div>
        <button
          onClick={() => router.push(`/dashboard/${sessionId}`)}
          className="px-6 py-3 bg-brass text-ink font-body font-semibold rounded-sm hover:bg-brass/90 cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full bg-ink print:bg-white print:p-0 print:max-w-none">
      {/* Top Action Bar (Hidden when printing) */}
      <div className="print:hidden mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-ink border border-brass/30 rounded-sm p-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push(`/dashboard/${sessionId}`)}
            className="flex items-center gap-1.5 font-body text-xs font-semibold text-warm-gray hover:text-brass transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} /> Dashboard
          </button>
          <div className="h-4 w-[1px] bg-warm-gray/25" />
          <div>
            <span className="font-display text-base text-parchment block leading-tight">
              ATS Resume Studio
            </span>
            <span className="font-mono text-[11px] text-warm-gray">
              Single-column Workday / Greenhouse / Lever compatible
              {atsScore !== null ? ` · Est. ATS Score ${atsScore}/100` : ""}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setEditMode(!editMode)}
            className={`px-3.5 py-2 rounded-sm font-mono text-xs border flex items-center gap-1.5 transition-colors cursor-pointer ${
              editMode
                ? "bg-teal text-parchment border-teal font-semibold"
                : "bg-parchment/5 text-parchment border-warm-gray/30 hover:border-brass"
            }`}
          >
            {editMode ? <Check size={13} /> : <Edit3 size={13} />}
            <span>{editMode ? "Done Editing" : "Edit Text"}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="px-3.5 py-2 rounded-sm bg-parchment/5 text-parchment border border-warm-gray/30 hover:border-brass font-mono text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedMd ? <Check size={13} className="text-teal" /> : <Copy size={13} />}
            <span>{copiedMd ? "Copied!" : "Copy .md"}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadMarkdown}
            className="px-3.5 py-2 rounded-sm bg-parchment/5 text-parchment border border-warm-gray/30 hover:border-brass font-mono text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileDown size={13} />
            <span>Download .md</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-sm bg-brass text-ink font-body text-xs font-semibold flex items-center gap-1.5 hover:bg-brass/90 shadow-md transition-colors cursor-pointer"
          >
            <Printer size={14} />
            <span>Save as ATS PDF</span>
          </button>
        </div>
      </div>

      {editMode && (
        <div className="print:hidden mb-5 px-4 py-3 rounded-sm bg-teal/15 border-l-4 border-teal text-parchment font-body text-xs">
          <strong>Edit Mode Active:</strong> Click any field below to customize contact details, role titles, or bullet metrics before clicking <strong>Save as ATS PDF</strong> (select &ldquo;Save as PDF&rdquo; in your browser print dialog).
        </div>
      )}

      {/* Crisp White A4 Printable ATS Sheet */}
      <article className="ats-print-sheet bg-white text-[#111827] max-w-[210mm] mx-auto p-8 sm:p-12 shadow-2xl rounded-sm border border-warm-gray/30 font-sans leading-snug">
        {/* Header: Name, Role, Contact */}
        <header className="border-b-2 border-[#111827] pb-3 mb-4 text-center">
          {editMode ? (
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="text-center text-2xl font-bold text-[#111827] border border-gray-300 rounded px-2 py-1 w-full"
                placeholder="Full Name"
              />
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="text-center text-sm font-semibold text-gray-700 border border-gray-300 rounded px-2 py-1 w-full"
                placeholder="Target Role Title"
              />
              <input
                type="text"
                value={contactLine}
                onChange={(e) => setContactLine(e.target.value)}
                className="text-center text-xs text-gray-600 border border-gray-300 rounded px-2 py-1 w-full"
                placeholder="City | Email | Phone | LinkedIn | GitHub"
              />
            </div>
          ) : (
            <>
              <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight text-[#111827] uppercase font-sans">
                {fullName}
              </h1>
              {headline && (
                <p className="text-sm font-semibold text-gray-800 mt-0.5">{headline}</p>
              )}
              {contactLine && (
                <p className="text-xs text-gray-700 mt-1 break-words">{contactLine}</p>
              )}
            </>
          )}
        </header>

        {/* Summary */}
        {(summary || editMode) && (
          <section className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#111827] border-b border-gray-300 pb-0.5 mb-2 font-sans">
              Professional Summary
            </h2>
            {editMode ? (
              <textarea
                rows={4}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full text-xs text-gray-800 border border-gray-300 rounded p-2 leading-relaxed"
              />
            ) : (
              <p className="text-[12.5px] text-gray-800 leading-relaxed">{summary}</p>
            )}
          </section>
        )}

        {/* Technical Skills */}
        {(skillsText || editMode) && (
          <section className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#111827] border-b border-gray-300 pb-0.5 mb-2 font-sans">
              Technical Skills
            </h2>
            {editMode ? (
              <textarea
                rows={2}
                value={skillsText}
                onChange={(e) => setSkillsText(e.target.value)}
                className="w-full text-xs text-gray-800 border border-gray-300 rounded p-2"
              />
            ) : (
              <p className="text-[12.5px] text-gray-800 leading-relaxed">{skillsText}</p>
            )}
          </section>
        )}

        {/* Experience Bullets */}
        {(experienceBullets.length > 0 || editMode) && (
          <section className="mb-4">
            {editMode ? (
              <input
                type="text"
                value={experienceHeader}
                onChange={(e) => setExperienceHeader(e.target.value)}
                className="text-xs font-bold uppercase tracking-wider text-[#111827] border border-gray-300 rounded px-2 py-1 mb-2 w-full"
              />
            ) : (
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#111827] border-b border-gray-300 pb-0.5 mb-2 font-sans">
                {experienceHeader}
              </h2>
            )}

            {editMode ? (
              <div className="flex flex-col gap-1.5">
                {experienceBullets.map((b, idx) => (
                  <textarea
                    key={`edit-exp-${idx}`}
                    rows={2}
                    value={b}
                    onChange={(e) => {
                      const copy = [...experienceBullets];
                      copy[idx] = e.target.value;
                      setExperienceBullets(copy);
                    }}
                    className="w-full text-xs text-gray-800 border border-gray-300 rounded p-1.5"
                  />
                ))}
              </div>
            ) : (
              <ul className="list-disc pl-5 space-y-1 text-[12.5px] text-gray-800">
                {experienceBullets
                  .filter((b) => b.trim())
                  .map((bullet, idx) => (
                    <li key={`exp-${idx}`} className="leading-relaxed">
                      {bullet}
                    </li>
                  ))}
              </ul>
            )}
          </section>
        )}

        {/* Projects */}
        {(projects.length > 0 || editMode) && (
          <section className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#111827] border-b border-gray-300 pb-0.5 mb-2 font-sans">
              Technical Projects
            </h2>
            <div className="space-y-2.5">
              {projects.map((proj, idx) => (
                <div key={`proj-${idx}`}>
                  {editMode ? (
                    <div className="flex flex-col gap-1 border border-gray-200 p-2 rounded">
                      <input
                        type="text"
                        value={proj.name}
                        onChange={(e) => {
                          const next = [...projects];
                          next[idx] = { ...next[idx], name: e.target.value };
                          setProjects(next);
                        }}
                        className="text-xs font-bold text-[#111827] border border-gray-300 rounded px-2 py-1"
                      />
                      <textarea
                        rows={2}
                        value={proj.description}
                        onChange={(e) => {
                          const next = [...projects];
                          next[idx] = { ...next[idx], description: e.target.value };
                          setProjects(next);
                        }}
                        className="text-xs text-gray-800 border border-gray-300 rounded p-1.5"
                      />
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-[13px] font-bold text-[#111827] font-sans">
                        {proj.name}
                      </h3>
                      <p className="text-[12.5px] text-gray-800 leading-relaxed mt-0.5">
                        {proj.description}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {(educationLine || editMode) && (
          <section className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#111827] border-b border-gray-300 pb-0.5 mb-2 font-sans">
              Education
            </h2>
            {editMode ? (
              <input
                type="text"
                value={educationLine}
                onChange={(e) => setEducationLine(e.target.value)}
                className="w-full text-xs text-gray-800 border border-gray-300 rounded px-2 py-1"
                placeholder="BS in Computer Science — University Name (2025)"
              />
            ) : (
              <p className="text-[12.5px] text-gray-800">{educationLine}</p>
            )}
          </section>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#111827] border-b border-gray-300 pb-0.5 mb-2 font-sans">
              Certifications
            </h2>
            <ul className="list-disc pl-5 space-y-0.5 text-[12.5px] text-gray-800">
              {certifications.map((cert, idx) => (
                <li key={`cert-${idx}`}>{cert}</li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </main>
  );
}

