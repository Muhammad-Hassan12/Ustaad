"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { startInterview, submitAnswer } from "@/lib/api";
import LedgerLine, { LedgerCheckpoint } from "@/components/LedgerLine";
import {
  MessageSquare, Send, AlertCircle,
  Loader2, Award, ChevronRight, HelpCircle, CheckCircle2
} from "lucide-react";
import { motion } from "framer-motion";
import AnimatedCounter from "@/components/AnimatedCounter";

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
  const [submittedAnswerText, setSubmittedAnswerText] = useState("");

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
          setTotalQuestions(data.total_questions || 15);
          setCurrentQuestion(data.current_question);
          setQuestionNumber(data.question_number || 1);
        } else {
          setError(data.error || "Failed to start the interview session.");
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Could not establish connection to the interview server.");
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
        setEvaluation(data.evaluation);
        setIsComplete(data.is_complete);
        setFinalScore(data.final_score);
        setCurrentQuestion(data.next_question);
        setQuestionNumber(data.question_number);
      } else {
        setError("Error submitting response. Please try again.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Communication error. Could not evaluate response.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleNextQuestion = () => {
    setAnswerText("");
    setSubmittedAnswerText("");
    setEvaluation(null);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleGoToDossier = () => {
    router.push(`/dossier/${sessionId}`);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4 bg-ink">
        <Loader2 className="w-8 h-8 text-brass animate-spin" />
        <div>
          <h3 className="font-display text-2xl text-parchment">
            Preparing Interview Terminal...
          </h3>
          <p className="font-body text-xs text-warm-gray mt-1.5 max-w-xs leading-relaxed">
            Structuring role-specific technical, behavioral, and HR questions.
          </p>
        </div>
      </div>
    );
  }

  if (error && !interviewId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4 bg-ink">
        <AlertCircle className="w-12 h-12 text-critical-red" />
        <div>
          <h3 className="font-display text-2xl text-parchment">Interview Exception</h3>
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

  // Interview finished — show final score screen
  if (isComplete && evaluation === null) {
    return (
      <main className="flex-1 max-w-2xl mx-auto w-full py-16 px-4 flex flex-col items-center justify-center bg-ink">
        <div className="bg-parchment text-ink rounded-sm border border-brass/40 p-10 md:p-12 shadow-2xl text-center w-full flex flex-col items-center gap-6 relative paper-grain">
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-brass" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-brass" />

          <div className="w-16 h-16 rounded-full bg-brass/20 text-brass flex items-center justify-center">
            <Award className="w-8 h-8 text-brass" />
          </div>

          <div>
            <h3 className="font-display text-3xl md:text-4xl text-ink">
              Mock Interview Complete
            </h3>
            <p className="font-body text-xs text-ink/70 mt-1">
              Your session responses have been evaluated and recorded.
            </p>
          </div>

          {/* Large Monospace Final Score */}
          <div className="my-4">
            <AnimatedCounter value={finalScore ?? 0} className="font-mono text-8xl font-bold text-brass block leading-none" suffix="%" />
            <span className="font-mono text-xs text-ink/60 uppercase tracking-widest mt-2 block">
              Overall Candidate Score
            </span>
          </div>

          <p className="font-body text-xs text-ink/70 max-w-sm leading-relaxed">
            All transcript evaluations are saved in your Career Dossier report.
          </p>

          <button
            onClick={handleGoToDossier}
            className="w-full sm:w-auto px-8 py-4 bg-brass text-ink rounded-sm font-body font-semibold flex items-center justify-center gap-2 hover:bg-brass/90 transition-colors shadow-md cursor-pointer text-sm"
          >
            View Career Dossier <ChevronRight size={16} />
          </button>
        </div>
      </main>
    );
  }

  const displayedQuestionNum = evaluation ? questionNumber - 1 : questionNumber;

  // Determine section progress
  const technicalStatus = displayedQuestionNum > 5 ? "complete" : displayedQuestionNum >= 1 ? "active" : "pending";
  const behavioralStatus = displayedQuestionNum > 10 ? "complete" : displayedQuestionNum > 5 ? "active" : "pending";
  const hrStatus = isComplete ? "complete" : displayedQuestionNum > 10 ? "active" : "pending";

  const sectionCheckpoints: LedgerCheckpoint[] = [
    { label: "Technical", status: technicalStatus },
    { label: "Behavioral", status: behavioralStatus },
    { label: "HR / Fit", status: hrStatus },
  ];

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full py-10 px-4 md:px-8 flex flex-col gap-8 bg-ink">
      {/* Top Section Indicator with LedgerLine */}
      <div className="bg-ink border border-brass/30 rounded-sm p-6 flex flex-col gap-4">
        <div className="flex justify-between items-center border-b border-warm-gray/15 pb-3">
          <span className="font-display text-lg text-parchment flex items-center gap-2">
            <MessageSquare size={18} className="text-brass" /> Ustaad Interview Terminal
          </span>
          <span className="font-mono text-xs text-brass border border-brass/40 px-3 py-1 rounded-sm bg-brass/10">
            Question {displayedQuestionNum} of {totalQuestions}
          </span>
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
              <span className="font-mono text-xs font-semibold text-brass uppercase tracking-wider">
                {currentQuestion.difficulty || "Technical"} Level Question
              </span>
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
                placeholder="Type your answer here... Be structured, concise, and provide realistic technical examples."
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
              animate={{ opacity: 1, rotate: -1.5 }}
              transition={{ duration: 0.4 }}
              className="bg-ink text-parchment border-l-4 border-brass p-6 rounded-sm ml-4 md:ml-8 max-w-2xl shadow-xl relative"
            >
              <span className="font-mono text-[10px] text-brass uppercase tracking-widest block mb-2">
                ✍️ Candidate Response (Margin Note)
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

            <div className="flex justify-between items-baseline border-b border-ink/15 pb-4">
              <h4 className="font-display text-2xl text-ink">Structured Feedback</h4>
              <div className="flex items-baseline gap-1">
                <span className="font-mono text-3xl md:text-4xl font-bold text-teal">
                  {evaluation.score}
                </span>
                <span className="font-mono text-lg text-ink/40">/ {evaluation.max_score}</span>
              </div>
            </div>

            {/* Feedback Summary */}
            <p className="font-body text-sm text-ink/80 italic border-l-2 border-teal pl-4 py-1">
              &ldquo;{evaluation.feedback_summary}&rdquo;
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-sm border border-teal/30 bg-teal/5 flex flex-col gap-1.5">
                <span className="font-mono text-xs font-semibold text-teal uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 size={13} /> Strengths
                </span>
                <p className="font-body text-xs text-ink/80 leading-relaxed">{evaluation.what_was_good}</p>
              </div>

              <div className="p-4 rounded-sm border border-critical-red/30 bg-critical-red/5 flex flex-col gap-1.5">
                <span className="font-mono text-xs font-semibold text-critical-red uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle size={13} /> Missing Elements
                </span>
                <p className="font-body text-xs text-ink/80 leading-relaxed">{evaluation.what_was_missing}</p>
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
                    <li key={idx} className="font-body text-xs text-ink/80 flex items-start gap-2">
                      <span className="text-teal font-mono">→</span>
                      {hint}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end border-t border-ink/15 pt-5">
              <button
                onClick={isComplete ? handleGoToDossier : handleNextQuestion}
                className="bg-brass text-ink font-body font-semibold px-8 py-3.5 rounded-sm hover:bg-brass/90 transition-colors shadow-md flex items-center gap-2 cursor-pointer text-sm"
              >
                <span>{isComplete ? "Finish & View Career Dossier" : "Next Question"}</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
