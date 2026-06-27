"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { startInterview, submitAnswer } from "@/lib/api";
import {
  MessageSquare, Send, CheckCircle2, AlertCircle, HelpCircle,
  Loader2, Award, ChevronRight, User
} from "lucide-react";

interface Question {
  id: string;
  question: string;
  difficulty?: string;
  what_interviewer_looks_for?: string;
}

interface Evaluation {
  score: number;
  max_score: number;
  what_was_good: string;
  what_was_missing: string;
  ideal_answer_hints: string[];
  feedback_summary: string;
}

export default function InterviewPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Interview state
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [totalQuestions, setTotalQuestions] = useState(15);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [answerText, setAnswerText] = useState("");

  // Evaluation feedback state
  const [submitLoading, setSubmitLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);

  // Initialize Interview Session
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await startInterview(sessionId);
        if (data && data.interview_id) {
          setInterviewId(data.interview_id);
          setTotalQuestions(data.total_questions);
          setCurrentQuestion(data.current_question);
          setQuestionNumber(data.question_number);
        } else {
          setError(data.error || "Failed to start the interview session.");
        }
      } catch (err: any) {
        setError("Could not establish connection to the interview server.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [sessionId]);

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerText.trim() || !interviewId || !currentQuestion) return;

    setSubmitLoading(true);
    setError(null);

    try {
      const payload = {
        session_id: sessionId,
        interview_id: interviewId,
        question_id: currentQuestion.id,
        answer: answerText,
      };

      const data = await submitAnswer(payload);
      if (data && data.evaluation) {
        setEvaluation(data.evaluation);
        setIsComplete(data.is_complete);
        setFinalScore(data.final_score);
        // Store next question for when user clicks "Next"
        setCurrentQuestion(data.next_question);
        setQuestionNumber(data.question_number);
      } else {
        setError("Error submitting response. Please try again.");
      }
    } catch (err: any) {
      setError("Communication error. Could not evaluate response.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleNextQuestion = () => {
    setAnswerText("");
    setEvaluation(null);
    // Focus textarea for next question
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleGoToDossier = () => {
    router.push(`/dossier/${sessionId}`);
  };

  const getDifficultyColor = (diff?: string) => {
    if (!diff) return "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400";
    const d = diff.toLowerCase();
    if (d === "hard" || d === "advanced") return "bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400";
    if (d === "medium" || d === "intermediate") return "bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400";
    return "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400";
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
          <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 animate-ping" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Preparing Mock Interview Terminal...
          </h3>
          <p className="text-xs text-slate-500 mt-1.5 max-w-xs leading-relaxed">
            Generating customized questions based on your CV, projects, and target role.
          </p>
        </div>
      </div>
    );
  }

  if (error && !interviewId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Interview Error</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">{error}</p>
        </div>
        <button
          onClick={() => router.push(`/dashboard/${sessionId}`)}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl cursor-pointer transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Interview finished — show final score screen
  // Bug fix: was `isComplete && !evaluation`. Now shows when isComplete is true and no pending evaluation.
  if (isComplete && evaluation === null) {
    return (
      <main className="flex-1 max-w-2xl mx-auto w-full py-12 px-4 flex flex-col items-center justify-center gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 shadow-xl text-center w-full flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center">
            <Award className="w-10 h-10 text-indigo-500" />
          </div>

          <div>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              Mock Interview Complete!
            </h3>
            <p className="text-sm text-slate-500 mt-1.5">
              Your overall performance has been evaluated.
            </p>
          </div>

          {/* Score Ring */}
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="absolute w-full h-full -rotate-90">
              <circle cx="68" cy="68" r="58" strokeWidth="10" fill="transparent" className="stroke-slate-100 dark:stroke-slate-800" />
              <circle
                cx="68" cy="68" r="58" strokeWidth="10" fill="transparent"
                className="stroke-indigo-500 transition-all duration-1000"
                strokeDasharray={364.4}
                strokeDashoffset={364.4 - (364.4 * (finalScore ?? 0)) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="text-center">
              <span className="text-4xl font-black text-indigo-600 dark:text-indigo-400">
                {finalScore}%
              </span>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Score</p>
            </div>
          </div>

          <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
            All transcripts and evaluations have been saved. Review them anytime on your career dossier or download the full PDF report.
          </p>

          <button
            onClick={handleGoToDossier}
            className="px-7 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl font-semibold flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/20 transition-all"
          >
            View Career Dossier <ChevronRight size={16} />
          </button>
        </div>
      </main>
    );
  }

  // Bug fix: display the actual current question number being shown to the user
  const displayedQuestionNum = evaluation ? questionNumber - 1 : questionNumber;

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full py-10 px-4 flex flex-col gap-5">
      {/* Header Bar */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3.5 shadow-sm">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <MessageSquare size={14} className="text-indigo-500" /> Mock Interview Terminal
        </span>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
            Q{displayedQuestionNum}
            <span className="text-slate-400 font-normal"> / {totalQuestions}</span>
          </span>
          <div className="flex gap-0.5">
            {Array.from({ length: totalQuestions }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i < displayedQuestionNum
                    ? "bg-indigo-500 w-3"
                    : i === displayedQuestionNum - 1 && !evaluation
                    ? "bg-indigo-300 dark:bg-indigo-700 w-3"
                    : "bg-slate-200 dark:bg-slate-800 w-1.5"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Current Question Block */}
      {!evaluation && currentQuestion && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-8 h-8 shrink-0 rounded-full bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center mt-0.5">
                <User size={14} className="text-indigo-500" />
              </div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-relaxed flex-1">
                {currentQuestion.question}
              </h4>
            </div>
            {currentQuestion.difficulty && (
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${getDifficultyColor(currentQuestion.difficulty)}`}>
                {currentQuestion.difficulty}
              </span>
            )}
          </div>

          {currentQuestion.what_interviewer_looks_for && (
            <div className="ml-11 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800/60 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              <span className="font-bold text-[10px] text-indigo-500 block mb-1 uppercase tracking-wider">
                What the interviewer looks for:
              </span>
              {currentQuestion.what_interviewer_looks_for}
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/20 text-rose-600 dark:text-rose-400 text-xs leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmitAnswer} className="flex flex-col gap-3">
            <div className="relative">
              <textarea
                ref={textareaRef}
                rows={5}
                placeholder="Type your structured answer here... Be specific, use examples, and structure your response clearly."
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm text-slate-900 dark:text-slate-100 transition-all leading-relaxed placeholder-slate-400 dark:placeholder-slate-600 resize-none"
              />
              <span className="absolute bottom-3 right-3 text-[10px] text-slate-400">
                {answerText.length} chars
              </span>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitLoading || !answerText.trim()}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold flex items-center gap-2 shadow-md shadow-indigo-500/15 cursor-pointer transition-colors"
              >
                {submitLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Evaluating...
                  </>
                ) : (
                  <>
                    Submit Answer <Send size={13} />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Evaluation Results Card */}
      {evaluation && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Answer Evaluation</h4>

            {/* Score Badge */}
            <div className={`px-4 py-1.5 rounded-full text-sm font-extrabold ${
              evaluation.score / evaluation.max_score >= 0.7
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
                : evaluation.score / evaluation.max_score >= 0.5
                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400"
                : "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400"
            }`}>
              {evaluation.score} / {evaluation.max_score}
            </div>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic bg-indigo-50/30 dark:bg-indigo-950/10 p-4 rounded-xl border border-indigo-100/20 dark:border-indigo-900/20">
            &ldquo;{evaluation.feedback_summary}&rdquo;
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-emerald-100 dark:border-emerald-950/30 bg-emerald-50/30 dark:bg-emerald-950/10 text-xs text-slate-700 dark:text-slate-300 leading-relaxed flex flex-col gap-2">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 size={11} /> What was good
              </span>
              {evaluation.what_was_good}
            </div>

            <div className="p-4 rounded-xl border border-rose-100 dark:border-rose-950/30 bg-rose-50/30 dark:bg-rose-950/10 text-xs text-slate-700 dark:text-slate-300 leading-relaxed flex flex-col gap-2">
              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle size={11} /> Areas to improve
              </span>
              {evaluation.what_was_missing}
            </div>
          </div>

          {evaluation.ideal_answer_hints && evaluation.ideal_answer_hints.length > 0 && (
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col gap-2.5">
              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle size={11} /> Ideal Answer Guidelines
              </span>
              <ul className="flex flex-col gap-1.5">
                {evaluation.ideal_answer_hints.map((hint, idx) => (
                  <li key={idx} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
                    <span className="text-indigo-400 shrink-0 mt-0.5">→</span>
                    {hint}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={isComplete ? handleGoToDossier : handleNextQuestion}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold flex items-center gap-2 cursor-pointer transition-colors shadow-md shadow-indigo-500/15"
            >
              {isComplete ? "Finish & View Dossier" : "Next Question"} <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
