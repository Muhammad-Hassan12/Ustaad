"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  finishInterviewEarly,
  getActiveInterview,
  startInterview,
  submitAnswer,
  submitProbeAnswer,
} from "@/lib/api";
import {
  BYOK_UPDATED_EVENT,
  getActiveBYOKConfig,
  SERVER_DEFAULT_MODEL,
} from "@/lib/llmConfig";
import LedgerLine, { LedgerCheckpoint } from "@/components/LedgerLine";
import ApiKeyModal from "@/components/ApiKeyModal";
import {
  MessageSquare,
  Send,
  AlertCircle,
  Loader2,
  Award,
  ChevronRight,
  HelpCircle,
  CheckCircle2,
  Zap,
  Code,
  Users,
  Target,
  ArrowLeft,
  Flag,
  RotateCcw,
  Key,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import AnimatedCounter from "@/components/AnimatedCounter";

interface Question {
  id: string;
  question: string;
  category?: string;
  difficulty?: string;
  what_interviewer_looks_for?: string;
}

interface Evaluation {
  score: number;
  max_score: number;
  clarity_and_structure_score?: number;
  communication_coaching_tip?: string;
  what_was_good: string;
  what_was_missing: string;
  ideal_answer_hints: string[];
  feedback_summary: string;
  follow_up_probe?: string | null;
}

interface ExistingInterviewInfo {
  interview_id: string;
  mode: string;
  difficulty: string;
  total_questions: number;
  current_question: Question | null;
  question_number: number;
  is_complete: boolean;
  answered_count: number;
  final_score: number | null;
}

const MODE_OPTIONS = [
  {
    id: "sprint_5",
    title: "Rapid 5-Question Sprint",
    badge: "Recommended · Saves 66% Quota",
    questions: "5 Questions (2 Tech · 2 Behavioral · 1 HR)",
    desc: "Fast, high-signal practice loop ideal for quick daily prep and low API quota consumption.",
    icon: Zap,
  },
  {
    id: "technical",
    title: "Technical Deep-Dive",
    badge: "6 Questions",
    questions: "6 Role-Specific Engineering Questions",
    desc: "Focused strictly on system design, debugging, core stack internals, and portfolio architecture.",
    icon: Code,
  },
  {
    id: "behavioral_hr",
    title: "Behavioral & HR Fit",
    badge: "6 Questions",
    questions: "4 STAR Behavioral + 2 Pakistani HR / Salary Qs",
    desc: "Sharpen communication clarity, conflict resolution stories, and salary negotiation.",
    icon: Users,
  },
  {
    id: "full_15",
    title: "Full 15-Question Loop",
    badge: "Comprehensive",
    questions: "15 Questions (5 Tech · 5 Behavioral · 5 HR)",
    desc: "End-to-end interview simulation covering every hiring stage. Best used with your own API key.",
    icon: Target,
  },
] as const;

const DIFFICULTY_OPTIONS = [
  { id: "fresh_grad", label: "Fresh Grad / Intern" },
  { id: "junior", label: "Junior (1–2 yrs)" },
  { id: "mid_senior", label: "Mid-Senior (3+ yrs)" },
] as const;

export default function InterviewPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [checkingExisting, setCheckingExisting] = useState(true);
  const [startingSession, setStartingSession] = useState(false);
  const [existingInfo, setExistingInfo] = useState<ExistingInterviewInfo | null>(null);
  const [inSetupStage, setInSetupStage] = useState(true);

  const [selectedMode, setSelectedMode] = useState<string>("sprint_5");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("junior");
  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const [activeModelLabel, setActiveModelLabel] = useState<string>(
    `Free Default (${SERVER_DEFAULT_MODEL})`
  );

  const [error, setError] = useState<string | null>(null);

  // Active interview state
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [interviewMode, setInterviewMode] = useState<string>("sprint_5");
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [answerText, setAnswerText] = useState("");
  const [submittedAnswerText, setSubmittedAnswerText] = useState("");

  // Evaluation & finish state
  const [submitLoading, setSubmitLoading] = useState(false);
  const [finishingEarly, setFinishingEarly] = useState(false);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);

  // Follow-up probe drill-down state
  const [lastEvaluatedQuestionId, setLastEvaluatedQuestionId] = useState<string | null>(null);
  const [isDrillingDown, setIsDrillingDown] = useState(false);
  const [probeAnswerText, setProbeAnswerText] = useState("");
  const [submittedProbeAnswer, setSubmittedProbeAnswer] = useState("");
  const [probeLoading, setProbeLoading] = useState(false);
  const [probeEvaluation, setProbeEvaluation] = useState<Evaluation | null>(null);

  useEffect(() => {
    const syncModelBadge = () => {
      const cfg = getActiveBYOKConfig();
      if (cfg) {
        setActiveModelLabel(`${cfg.provider.toUpperCase()} · ${cfg.model}`);
      } else {
        setActiveModelLabel(`Free Default (${SERVER_DEFAULT_MODEL})`);
      }
    };
    syncModelBadge();
    window.addEventListener(BYOK_UPDATED_EVENT, syncModelBadge);
    return () => window.removeEventListener(BYOK_UPDATED_EVENT, syncModelBadge);
  }, []);

  // Check if an in-progress or completed interview already exists (0 LLM calls)
  useEffect(() => {
    const checkActive = async () => {
      try {
        setCheckingExisting(true);
        const data = await getActiveInterview(sessionId);
        if (data && data.exists && data.interview_id) {
          setExistingInfo({
            interview_id: data.interview_id,
            mode: data.mode || "sprint_5",
            difficulty: data.difficulty || "junior",
            total_questions: data.total_questions || 5,
            current_question: data.current_question || null,
            question_number: data.question_number || 1,
            is_complete: !!data.is_complete,
            answered_count: Array.isArray(data.scores) ? data.scores.length : 0,
            final_score: data.final_score ?? null,
          });
        }
      } catch {
        // Proceed cleanly to setup screen
      } finally {
        setCheckingExisting(false);
      }
    };
    checkActive();
  }, [sessionId]);

  const handleResumeExisting = () => {
    if (!existingInfo || !existingInfo.current_question) return;
    setInterviewId(existingInfo.interview_id);
    setInterviewMode(existingInfo.mode);
    setTotalQuestions(existingInfo.total_questions);
    setCurrentQuestion(existingInfo.current_question);
    setQuestionNumber(existingInfo.question_number);
    setAnsweredCount(existingInfo.answered_count);
    setIsComplete(false);
    setEvaluation(null);
    setError(null);
    setInSetupStage(false);
  };

  const handleStartNewInterview = async (forceNew: boolean) => {
    try {
      setStartingSession(true);
      setError(null);
      const data = await startInterview(sessionId, {
        mode: selectedMode,
        difficulty: selectedDifficulty,
        force_new: forceNew,
      });

      if (data && data.interview_id) {
        setInterviewId(data.interview_id);
        setInterviewMode(data.mode || selectedMode);
        setTotalQuestions(data.total_questions || 5);
        setCurrentQuestion(data.current_question);
        setQuestionNumber(data.question_number || 1);
        setAnsweredCount(Array.isArray(data.scores) ? data.scores.length : 0);
        setIsComplete(!!data.is_complete);
        setFinalScore(data.final_score ?? null);
        setEvaluation(null);
        setAnswerText("");
        setSubmittedAnswerText("");
        setInSetupStage(false);
      } else {
        setError(data?.detail || data?.error || "Failed to generate interview questions.");
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not establish connection to the interview server."
      );
    } finally {
      setStartingSession(false);
    }
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerText.trim() || !interviewId || !currentQuestion) return;

    setSubmitLoading(true);
    setError(null);
    setSubmittedAnswerText(answerText);

    try {
      const payload = {
        session_id: sessionId,
        interview_id: interviewId,
        question_id: currentQuestion.id,
        answer: answerText,
      };

      const data = await submitAnswer(payload);
      if (data && data.evaluation) {
        setLastEvaluatedQuestionId(currentQuestion.id);
        setEvaluation(data.evaluation);
        setIsDrillingDown(false);
        setProbeAnswerText("");
        setSubmittedProbeAnswer("");
        setProbeEvaluation(null);
        setAnsweredCount((prev) => prev + 1);
        setIsComplete(!!data.is_complete);
        setFinalScore(data.final_score ?? null);
        setCurrentQuestion(data.next_question);
        if (data.question_number) {
          setQuestionNumber(data.question_number);
        }
      } else {
        setError(data?.error || data?.detail || "Error evaluating response. Please try again.");
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Communication error. Could not evaluate response."
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleFinishEarly = async () => {
    if (!interviewId || answeredCount < 1) return;
    try {
      setFinishingEarly(true);
      setError(null);
      const data = await finishInterviewEarly(interviewId);
      if (data && data.is_complete) {
        setEvaluation(null);
        setIsComplete(true);
        setFinalScore(data.final_score ?? 0);
      } else {
        setError(data?.detail || data?.error || "Could not finalize interview score.");
      }
    } catch {
      setError("Failed to finish interview early.");
    } finally {
      setFinishingEarly(false);
    }
  };

  const handleProbeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !probeAnswerText.trim() ||
      !interviewId ||
      !lastEvaluatedQuestionId ||
      !evaluation?.follow_up_probe
    ) {
      return;
    }

    setProbeLoading(true);
    setError(null);
    setSubmittedProbeAnswer(probeAnswerText);

    try {
      const payload = {
        session_id: sessionId,
        interview_id: interviewId,
        parent_question_id: lastEvaluatedQuestionId,
        probe_question: evaluation.follow_up_probe,
        answer: probeAnswerText,
      };

      const data = await submitProbeAnswer(payload);
      if (data && data.evaluation) {
        setProbeEvaluation(data.evaluation);
      } else {
        setError(data?.error || data?.detail || "Error evaluating follow-up response.");
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Communication error evaluating follow-up response."
      );
    } finally {
      setProbeLoading(false);
    }
  };

  const handleNextQuestion = () => {
    setAnswerText("");
    setSubmittedAnswerText("");
    setEvaluation(null);
    setIsDrillingDown(false);
    setProbeAnswerText("");
    setSubmittedProbeAnswer("");
    setProbeEvaluation(null);
    setLastEvaluatedQuestionId(null);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const buildCheckpoints = (
    activeCategory?: string,
    done?: boolean
  ): LedgerCheckpoint[] => {
    if (interviewMode === "technical") {
      return [
        { label: "Core Stack", status: answeredCount >= 2 || done ? "complete" : "active" },
        {
          label: "Architecture",
          status: done
            ? "complete"
            : answeredCount >= 4
            ? "complete"
            : answeredCount >= 2
            ? "active"
            : "pending",
        },
        {
          label: "Debugging",
          status: done ? "complete" : answeredCount >= 4 ? "active" : "pending",
        },
      ];
    }

    if (interviewMode === "behavioral_hr") {
      return [
        {
          label: "Behavioral (STAR)",
          status:
            done || activeCategory === "HR / Fit" ? "complete" : "active",
        },
        {
          label: "HR & Culture Fit",
          status: done
            ? "complete"
            : activeCategory === "HR / Fit"
            ? "active"
            : "pending",
        },
      ];
    }

    const cat = activeCategory || "Technical";
    return [
      {
        label: "Technical",
        status:
          done || cat === "Behavioral" || cat === "HR / Fit"
            ? "complete"
            : "active",
      },
      {
        label: "Behavioral",
        status:
          done || cat === "HR / Fit"
            ? "complete"
            : cat === "Behavioral"
            ? "active"
            : "pending",
      },
      {
        label: "HR / Fit",
        status: done ? "complete" : cat === "HR / Fit" ? "active" : "pending",
      },
    ];
  };

  if (checkingExisting) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4 bg-ink min-h-[70vh]">
        <Loader2 className="w-8 h-8 text-brass animate-spin" />
        <div>
          <h3 className="font-display text-2xl text-parchment">
            Loading Interview Studio...
          </h3>
          <p className="font-body text-xs text-warm-gray mt-1">
            Checking session state & active AI configuration
          </p>
        </div>
      </div>
    );
  }

  // Stage 1: Pre-Interview Mode & Difficulty Setup Screen
  if (inSetupStage) {
    const canResume =
      existingInfo && !existingInfo.is_complete && existingInfo.current_question;

    return (
      <main className="flex-1 max-w-4xl mx-auto w-full py-10 px-4 md:px-8 flex flex-col gap-6 bg-ink">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push(`/dashboard/${sessionId}`)}
            className="flex items-center gap-2 font-body text-xs font-semibold text-warm-gray hover:text-brass transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </button>

          <button
            type="button"
            onClick={() => setKeyModalOpen(true)}
            className="px-3 py-1.5 rounded-sm bg-parchment/5 border border-brass/30 hover:border-brass text-xs font-mono text-brass flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Key size={12} />
            <span>{activeModelLabel}</span>
          </button>
        </div>

        {/* Resume In-Progress Banner */}
        {canResume && (
          <div className="bg-teal/15 border-l-4 border-teal rounded-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="font-mono text-xs font-bold text-teal uppercase tracking-wider block">
                Active Session Found
              </span>
              <p className="font-body text-sm text-parchment mt-0.5">
                You have an unfinished interview at{" "}
                <strong>
                  Question {existingInfo.question_number} of {existingInfo.total_questions}
                </strong>
                . Resume right where you left off without spending extra API quota!
              </p>
            </div>
            <button
              type="button"
              onClick={handleResumeExisting}
              className="shrink-0 px-5 py-2.5 rounded-sm bg-brass text-ink font-body text-xs font-semibold hover:bg-brass/90 transition-colors cursor-pointer shadow-md"
            >
              Resume Question {existingInfo.question_number} →
            </button>
          </div>
        )}

        {/* Previous Completed Score Note */}
        {existingInfo && existingInfo.is_complete && existingInfo.final_score !== null && (
          <div className="bg-brass/10 border-l-4 border-brass rounded-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="font-body text-xs text-parchment">
              Previous mock interview completed with{" "}
              <strong className="font-mono text-brass">{existingInfo.final_score}%</strong>.
              You can view your Dossier or start a fresh practice session below.
            </p>
            <button
              type="button"
              onClick={() => router.push(`/dossier/${sessionId}`)}
              className="shrink-0 px-4 py-1.5 rounded-sm border border-brass/40 text-brass hover:bg-brass/10 font-mono text-xs cursor-pointer"
            >
              View Dossier →
            </button>
          </div>
        )}

        {/* Main Setup Ledger Card */}
        <div className="bg-parchment text-ink rounded-sm border border-brass/40 p-7 sm:p-10 shadow-2xl relative flex flex-col gap-7 paper-grain">
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-brass pointer-events-none" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-brass pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-brass pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-brass pointer-events-none" />

          <div className="border-b border-ink/15 pb-4">
            <span className="font-mono text-xs font-bold text-brass uppercase tracking-widest block mb-1">
              AI Mock Interview 2.0
            </span>
            <h1 className="font-display text-3xl sm:text-4xl text-ink">
              Configure Your Practice Loop
            </h1>
            <p className="font-body text-xs text-ink/70 mt-1">
              Questions are tailored to your CV gaps and live Pakistani tech market requirements, with per-answer STAR & clarity coaching.
            </p>
          </div>

          {/* Mode Selection Grid */}
          <div className="flex flex-col gap-3">
            <label className="font-mono text-xs font-semibold text-ink/70 uppercase tracking-wider">
              1. Choose Interview Format
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {MODE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = selectedMode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedMode(opt.id)}
                    className={`p-4 rounded-sm border-2 text-left flex flex-col gap-2 transition-all cursor-pointer ${
                      active
                        ? "border-brass bg-brass/15 shadow-sm"
                        : "border-ink/15 bg-ink/[0.02] hover:border-brass/50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display text-base font-semibold text-ink flex items-center gap-2">
                        <Icon size={16} className="text-teal" />
                        {opt.title}
                      </span>
                      <span className="font-mono text-[10px] font-bold bg-ink/10 text-ink px-2 py-0.5 rounded-sm">
                        {opt.badge}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-brass font-semibold">
                      {opt.questions}
                    </span>
                    <p className="font-body text-xs text-ink/70 leading-relaxed">
                      {opt.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Difficulty Selection */}
          <div className="flex flex-col gap-2.5">
            <label className="font-mono text-xs font-semibold text-ink/70 uppercase tracking-wider">
              2. Experience Bar Calibration
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {DIFFICULTY_OPTIONS.map((diff) => {
                const active = selectedDifficulty === diff.id;
                return (
                  <button
                    key={diff.id}
                    type="button"
                    onClick={() => setSelectedDifficulty(diff.id)}
                    className={`py-2.5 px-4 rounded-sm border font-mono text-xs transition-colors cursor-pointer ${
                      active
                        ? "bg-ink text-parchment border-ink font-bold"
                        : "bg-ink/5 text-ink/75 border-ink/20 hover:border-brass"
                    }`}
                  >
                    {diff.label}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-sm bg-critical-red/10 border-l-4 border-critical-red text-critical-red text-xs font-body">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-ink/15 pt-5">
            <p className="font-body text-xs text-ink/65">
              You can finish & score early anytime after answering at least 1 question.
            </p>
            <button
              type="button"
              disabled={startingSession}
              onClick={() => handleStartNewInterview(true)}
              className="px-8 py-3.5 rounded-sm bg-brass text-ink font-body font-semibold text-sm hover:bg-brass/90 disabled:opacity-50 transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              {startingSession ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Generating Tailored Questions...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Start Interview Session</span>
                </>
              )}
            </button>
          </div>
        </div>

        <ApiKeyModal isOpen={keyModalOpen} onClose={() => setKeyModalOpen(false)} />
      </main>
    );
  }

  // Stage 2: Interview Completed Screen
  if (isComplete && evaluation === null) {
    return (
      <main className="flex-1 max-w-2xl mx-auto w-full py-16 px-4 flex flex-col items-center justify-center bg-ink">
        <div className="bg-parchment text-ink rounded-sm border border-brass/40 p-10 md:p-12 shadow-2xl text-center w-full flex flex-col items-center gap-6 relative paper-grain">
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-brass" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-brass" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-brass" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-brass" />

          <div className="w-16 h-16 rounded-full bg-brass/20 text-brass flex items-center justify-center">
            <Award className="w-8 h-8 text-brass" />
          </div>

          <div>
            <h3 className="font-display text-3xl md:text-4xl text-ink">
              Mock Interview Complete
            </h3>
            <p className="font-body text-xs text-ink/70 mt-1">
              {answeredCount} response{answeredCount === 1 ? "" : "s"} evaluated and saved to your Career Dossier.
            </p>
          </div>

          {/* Large Monospace Final Score */}
          <div className="my-3">
            <AnimatedCounter
              value={Math.round(finalScore ?? 0)}
              className="font-mono text-7xl sm:text-8xl font-bold text-brass block leading-none"
              suffix="%"
            />
            <span className="font-mono text-xs text-ink/60 uppercase tracking-widest mt-2 block">
              Overall Candidate Score
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
            <button
              type="button"
              onClick={() => router.push(`/dossier/${sessionId}`)}
              className="px-7 py-3.5 bg-brass text-ink rounded-sm font-body font-semibold flex items-center justify-center gap-2 hover:bg-brass/90 transition-colors shadow-md cursor-pointer text-sm"
            >
              View Career Dossier <ChevronRight size={16} />
            </button>

            <button
              type="button"
              onClick={() => {
                setExistingInfo(null);
                setInSetupStage(true);
              }}
              className="px-6 py-3.5 border border-ink/25 text-ink rounded-sm font-body font-semibold flex items-center justify-center gap-2 hover:border-brass transition-colors cursor-pointer text-sm"
            >
              <RotateCcw size={15} /> Practice Another Mode
            </button>
          </div>
        </div>
      </main>
    );
  }

  const displayedQuestionNum = evaluation
    ? Math.min(answeredCount, totalQuestions)
    : questionNumber;

  const sectionCheckpoints = buildCheckpoints(currentQuestion?.category, isComplete);

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full py-10 px-4 md:px-8 flex flex-col gap-8 bg-ink">
      {/* Top Section Indicator with LedgerLine */}
      <div className="bg-ink border border-brass/30 rounded-sm p-6 flex flex-col gap-4">
        <div className="flex flex-wrap justify-between items-center border-b border-warm-gray/15 pb-3 gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push(`/dashboard/${sessionId}`)}
              className="text-warm-gray hover:text-brass transition-colors cursor-pointer"
              title="Back to Dashboard"
            >
              <ArrowLeft size={16} />
            </button>
            <span className="font-display text-lg text-parchment flex items-center gap-2">
              <MessageSquare size={18} className="text-brass" /> Ustaad Interview Terminal
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {answeredCount >= 1 && !isComplete && (
              <button
                type="button"
                disabled={finishingEarly}
                onClick={handleFinishEarly}
                className="font-mono text-[11px] text-parchment/80 hover:text-brass border border-warm-gray/30 hover:border-brass px-2.5 py-1 rounded-sm flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {finishingEarly ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <Flag size={11} className="text-teal" />
                )}
                <span>Finish & Score ({answeredCount} answered)</span>
              </button>
            )}
            <span className="font-mono text-xs text-brass border border-brass/40 px-3 py-1 rounded-sm bg-brass/10">
              Question {displayedQuestionNum} of {totalQuestions}
            </span>
          </div>
        </div>

        <LedgerLine orientation="horizontal" checkpoints={sectionCheckpoints} />
      </div>

      {/* Question Card */}
      {!evaluation && currentQuestion && (
        <div className="bg-parchment text-ink rounded-sm border border-brass/30 p-8 shadow-xl flex flex-col gap-6 relative card-hover paper-grain">
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-brass z-10 pointer-events-none" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-brass z-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-brass z-10 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-brass z-10 pointer-events-none" />

          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-semibold text-brass uppercase tracking-wider">
                  {currentQuestion.category || "Interview"}
                </span>
                {currentQuestion.difficulty && (
                  <span className="font-mono text-[10px] bg-ink/10 text-ink/70 px-2 py-0.5 rounded-sm uppercase">
                    {currentQuestion.difficulty}
                  </span>
                )}
              </div>
              <h3 className="font-display text-2xl text-ink leading-snug">
                {currentQuestion.question}
              </h3>
            </div>
          </div>

          {currentQuestion.what_interviewer_looks_for && (
            <div className="border-l-2 border-brass pl-4 py-1.5 bg-ink/[0.03]">
              <span className="font-mono text-[11px] font-semibold text-ink/60 uppercase block mb-1">
                Interviewer Focus:
              </span>
              <p className="font-body text-xs text-ink/80 leading-relaxed">
                {currentQuestion.what_interviewer_looks_for}
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-sm bg-critical-red/10 border-l-4 border-critical-red text-critical-red text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmitAnswer} className="flex flex-col gap-4 mt-2">
            <div className="relative">
              <textarea
                ref={textareaRef}
                rows={5}
                placeholder="Type your answer here... Use concrete technical examples or STAR (Situation, Task, Action, Result) structure."
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                className="w-full p-4 rounded-sm bg-transparent border-2 border-ink/20 focus:border-brass focus:outline-none font-body text-sm text-ink transition-colors leading-relaxed placeholder:text-ink/40 resize-none"
              />
              <span className="absolute bottom-3 right-3 font-mono text-[10px] text-ink/40">
                {answerText.length} chars
              </span>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitLoading || !answerText.trim()}
                className="bg-brass text-ink font-body font-semibold px-8 py-3.5 rounded-sm hover:bg-brass/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300 flex items-center gap-2 cursor-pointer shadow-md text-sm"
              >
                {submitLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Evaluating Response...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Answer</span>
                    <Send size={15} />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Evaluation Results Card */}
      {evaluation && (
        <div className="flex flex-col gap-6">
          {/* User's Answer — Handwritten Margin Note Style */}
          {submittedAnswerText && (
            <motion.div
              initial={{ opacity: 0, rotate: 0 }}
              animate={{ opacity: 1, rotate: -1 }}
              transition={{ duration: 0.35 }}
              className="bg-ink text-parchment border-l-4 border-brass p-6 rounded-sm ml-2 md:ml-6 max-w-2xl shadow-xl relative"
            >
              <span className="font-mono text-[10px] text-brass uppercase tracking-widest block mb-2">
                Candidate Response (Margin Note)
              </span>
              <p className="font-body text-sm leading-relaxed opacity-90 italic">
                &ldquo;{submittedAnswerText}&rdquo;
              </p>
            </motion.div>
          )}

          {/* AI Structured Feedback Card */}
          <div className="bg-parchment text-ink rounded-sm border border-teal/40 p-8 shadow-xl flex flex-col gap-6 relative card-hover paper-grain">
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-teal z-10 pointer-events-none" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-teal z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-teal z-10 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-teal z-10 pointer-events-none" />

            <div className="flex flex-wrap justify-between items-baseline border-b border-ink/15 pb-4 gap-4">
              <h4 className="font-display text-2xl text-ink">Structured Evaluation</h4>
              <div className="flex items-center gap-5">
                {typeof evaluation.clarity_and_structure_score === "number" && (
                  <div className="text-right">
                    <span className="font-mono text-[10px] text-ink/55 uppercase block">
                      Clarity & STAR
                    </span>
                    <span className="font-mono text-xl font-bold text-brass">
                      {evaluation.clarity_and_structure_score}/10
                    </span>
                  </div>
                )}
                <div className="text-right">
                  <span className="font-mono text-[10px] text-ink/55 uppercase block">
                    Answer Score
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono text-3xl md:text-4xl font-bold text-teal">
                      {evaluation.score}
                    </span>
                    <span className="font-mono text-lg text-ink/40">
                      / {evaluation.max_score || 10}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Feedback Summary */}
            <p className="font-body text-sm text-ink/80 italic border-l-2 border-teal pl-4 py-1">
              &ldquo;{evaluation.feedback_summary}&rdquo;
            </p>

            {/* Communication Coaching Tip */}
            {evaluation.communication_coaching_tip && (
              <div className="p-3.5 rounded-sm bg-brass/15 border border-brass/40 flex flex-col gap-1">
                <span className="font-mono text-[11px] font-bold text-ink uppercase tracking-wider">
                  Communication & Structure Coaching
                </span>
                <p className="font-body text-xs text-ink/85 leading-relaxed">
                  {evaluation.communication_coaching_tip}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-sm border border-teal/30 bg-teal/5 flex flex-col gap-1.5">
                <span className="font-mono text-xs font-semibold text-teal uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 size={13} /> Strengths
                </span>
                <p className="font-body text-xs text-ink/80 leading-relaxed">
                  {evaluation.what_was_good}
                </p>
              </div>

              <div className="p-4 rounded-sm border border-critical-red/30 bg-critical-red/5 flex flex-col gap-1.5">
                <span className="font-mono text-xs font-semibold text-critical-red uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle size={13} /> Missing Elements
                </span>
                <p className="font-body text-xs text-ink/80 leading-relaxed">
                  {evaluation.what_was_missing}
                </p>
              </div>
            </div>

            {/* Ideal Answer Hints */}
            {evaluation.ideal_answer_hints && evaluation.ideal_answer_hints.length > 0 && (
              <div className="border-t border-ink/15 pt-4 flex flex-col gap-2">
                <span className="font-mono text-xs font-semibold text-ink/60 uppercase tracking-wider flex items-center gap-1.5">
                  <HelpCircle size={13} className="text-teal" /> Ideal Answer Guidelines
                </span>
                <ul className="space-y-1.5">
                  {evaluation.ideal_answer_hints.map((hint, idx) => (
                    <li
                      key={idx}
                      className="font-body text-xs text-ink/80 flex items-start gap-2"
                    >
                      <span className="text-teal font-mono">→</span>
                      {hint}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Adaptive Interviewer Follow-Up Probe ("Drill-Down Mode") */}
            {evaluation.follow_up_probe && (
              <div className="border border-brass/50 bg-brass/[0.06] rounded-sm p-5 flex flex-col gap-3.5 relative overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brass/25 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-brass" />
                    <span className="font-mono text-xs uppercase tracking-wider font-bold text-ink">
                      Interviewer Follow-Up Probe (Adaptive Drill-Down)
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-brass bg-brass/15 border border-brass/30 px-2 py-0.5 rounded-sm">
                    Optional Coaching Round
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="font-mono text-[11px] text-ink/60 uppercase">
                    The interviewer wants deeper technical specificity:
                  </span>
                  <p className="font-body text-sm text-ink font-semibold italic border-l-2 border-brass pl-3 py-0.5">
                    &ldquo;{evaluation.follow_up_probe}&rdquo;
                  </p>
                </div>

                {/* State 1: Prompt user to practice or skip */}
                {!isDrillingDown && !probeEvaluation && (
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <p className="font-body text-xs text-ink/75 max-w-md">
                      Refine your answer with architectural trade-offs or concrete metrics to convert surface-level responses into hire-ready delivery.
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsDrillingDown(true)}
                        className="bg-brass text-ink font-mono text-xs font-semibold px-4 py-2 rounded-sm hover:bg-brass/90 transition-colors shadow-sm cursor-pointer"
                      >
                        Practice Follow-Up →
                      </button>
                    </div>
                  </div>
                )}

                {/* State 2: Active input box for follow-up */}
                {isDrillingDown && !probeEvaluation && (
                  <form onSubmit={handleProbeSubmit} className="flex flex-col gap-3 pt-1">
                    <div className="relative">
                      <textarea
                        rows={3}
                        placeholder="Address the interviewer's specific probe here... (e.g., concrete data structures, concurrency handling, or measured latency improvements)"
                        value={probeAnswerText}
                        onChange={(e) => setProbeAnswerText(e.target.value)}
                        className="w-full p-3 rounded-sm bg-parchment border border-brass/40 focus:border-brass focus:outline-none font-body text-xs text-ink leading-relaxed placeholder:text-ink/40 resize-none"
                      />
                      <span className="absolute bottom-2 right-2 font-mono text-[10px] text-ink/40">
                        {probeAnswerText.length} chars
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setIsDrillingDown(false)}
                        className="font-mono text-xs text-ink/60 hover:text-ink cursor-pointer"
                      >
                        Cancel follow-up
                      </button>
                      <button
                        type="submit"
                        disabled={probeLoading || !probeAnswerText.trim()}
                        className="bg-brass text-ink font-mono text-xs font-semibold px-4 py-2 rounded-sm hover:bg-brass/90 disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        {probeLoading ? (
                          <>
                            <Loader2 size={12} className="animate-spin" />
                            <span>Evaluating Probe...</span>
                          </>
                        ) : (
                          <>
                            <span>Submit Follow-Up Response</span>
                            <Send size={12} />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* State 3: Probe Evaluation Result */}
                {probeEvaluation && (
                  <div className="p-4 rounded-sm bg-parchment/80 border border-brass/40 flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-ink/10 pb-2">
                      <span className="font-mono text-xs font-bold text-ink uppercase tracking-wider">
                        Follow-Up Coaching Assessment
                      </span>
                      <div className="flex items-baseline gap-1 font-mono">
                        <span className="text-xl font-bold text-teal">{probeEvaluation.score}</span>
                        <span className="text-xs text-ink/40">/ {probeEvaluation.max_score || 10}</span>
                      </div>
                    </div>

                    {submittedProbeAnswer && (
                      <p className="font-body text-xs text-ink/80 italic border-l-2 border-brass pl-2.5">
                        &ldquo;{submittedProbeAnswer}&rdquo;
                      </p>
                    )}

                    <p className="font-body text-xs text-ink/90 leading-relaxed">
                      {probeEvaluation.feedback_summary}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {probeEvaluation.what_was_good && (
                        <div className="p-2 rounded-sm bg-teal/5 border border-teal/20 text-ink">
                          <strong className="font-mono uppercase text-[10px] text-teal block">Refined Strength:</strong>
                          <span className="font-body text-ink/85">{probeEvaluation.what_was_good}</span>
                        </div>
                      )}
                      {probeEvaluation.what_was_missing && (
                        <div className="p-2 rounded-sm bg-critical-red/5 border border-critical-red/20 text-critical-red">
                          <strong className="font-mono uppercase text-[10px] text-critical-red block">Remaining Delta:</strong>
                          <span className="font-body text-ink/85">{probeEvaluation.what_was_missing}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/15 pt-5">
              {!isComplete ? (
                <button
                  type="button"
                  disabled={finishingEarly}
                  onClick={handleFinishEarly}
                  className="font-mono text-xs text-ink/65 hover:text-ink underline cursor-pointer"
                >
                  End session early & compute final score
                </button>
              ) : (
                <span />
              )}

              <button
                type="button"
                onClick={() => {
                  if (isComplete) {
                    setEvaluation(null);
                  } else {
                    handleNextQuestion();
                  }
                }}
                className="bg-brass text-ink font-body font-semibold px-8 py-3.5 rounded-sm hover:bg-brass/90 transition-colors shadow-md flex items-center gap-2 cursor-pointer text-sm"
              >
                <span>{isComplete ? "See Final Scorecard" : "Next Question"}</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
