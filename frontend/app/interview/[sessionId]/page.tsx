"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { startInterview, submitAnswer } from "@/lib/api";
import { MessageSquare, Send, CheckCircle2, AlertCircle, HelpCircle, Loader2, Award, ChevronRight } from "lucide-react";

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
        
        // Prep for next step
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
  };

  const handleGoToDossier = () => {
    router.push(`/dossier/${sessionId}`);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
        <h3 className="text-lg font-semibold text-slate-850 dark:text-slate-200">
          Preparing Mock Interview Terminal...
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">
          Generating customized questions based on your CV, projects, and target role in Pakistan.
        </p>
      </div>
    );
  }

  if (error && !interviewId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
        <h3 className="text-lg font-semibold text-slate-850 dark:text-slate-200">
          Interview Error
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">{error}</p>
        <button
          onClick={() => router.push(`/dashboard/${sessionId}`)}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Interview is finished
  if (isComplete && !evaluation) {
    return (
      <main className="flex-1 max-w-3xl mx-auto w-full py-12 px-4 flex flex-col items-center justify-center gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xl text-center w-full flex flex-col items-center gap-6">
          <Award className="w-16 h-16 text-indigo-500 animate-bounce" />
          
          <div>
            <h3 className="text-2xl font-extrabold text-slate-850 dark:text-slate-100">
              Mock Interview Completed
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Your overall interview score has been generated.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-indigo-50/30 dark:bg-indigo-950/20 border border-indigo-100/10 text-center">
            <span className="text-xs text-slate-500 dark:text-slate-400 block uppercase font-bold tracking-wider mb-1">
              Final Average Score
            </span>
            <span className="text-5xl font-black text-indigo-600 dark:text-indigo-400">
              {finalScore}%
            </span>
          </div>

          <p className="text-xs text-slate-650 dark:text-slate-400 max-w-md">
            Excellent practice! We have saved all your transcripts and evaluations. You can review them anytime on the dossier view or download the complete dossier report.
          </p>

          <button
            onClick={handleGoToDossier}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-500/10 transition-colors"
          >
            View Career Dossier <ChevronRight size={16} />
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full py-10 px-4 flex flex-col gap-6 relative">
      {/* Header Info */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <MessageSquare size={14} className="text-indigo-500" /> Interactive Mock Terminal
        </span>
        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
          Question {evaluation ? questionNumber - 1 : questionNumber} of {totalQuestions}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-indigo-600 h-full transition-all duration-500"
          style={{
            width: `${((evaluation ? questionNumber - 1 : questionNumber) / totalQuestions) * 100}%`,
          }}
        />
      </div>

      {/* Current Question Block */}
      {!evaluation && currentQuestion && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex-1 leading-relaxed">
              {currentQuestion.question}
            </h4>
            {currentQuestion.difficulty && (
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-400 ml-3">
                {currentQuestion.difficulty}
              </span>
            )}
          </div>

          {currentQuestion.what_interviewer_looks_for && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800/40 text-xs text-slate-550 dark:text-slate-400 leading-relaxed">
              <span className="font-bold text-[10px] text-indigo-500 block mb-1 uppercase tracking-wider">
                Interviewer expectations:
              </span>
              {currentQuestion.what_interviewer_looks_for}
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/20 text-rose-600 dark:text-rose-450 text-xs leading-relaxed">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmitAnswer} className="flex flex-col gap-3">
            <textarea
              rows={4}
              placeholder="Type your structured answer here..."
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800/60 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-xs text-slate-850 dark:text-slate-200 transition-all leading-relaxed placeholder-slate-400"
            />
            <button
              type="submit"
              disabled={submitLoading || !answerText.trim()}
              className="self-end px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-500/10 cursor-pointer transition-colors"
            >
              {submitLoading ? (
                <>
                  <Loader2 size={12} className="animate-spin" /> Evaluating...
                </>
              ) : (
                <>
                  Submit Answer <Send size={12} />
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Evaluation Results Card */}
      {evaluation && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col gap-5 transition-all duration-300">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Answer Evaluation
            </h4>
            
            {/* Score Ring */}
            <span
              className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                evaluation.score >= 7
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
                  : evaluation.score >= 5
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400"
                  : "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-450"
              }`}
            >
              Score: {evaluation.score} / {evaluation.max_score}
            </span>
          </div>

          <p className="text-xs text-slate-650 dark:text-slate-300 leading-relaxed italic bg-indigo-50/10 p-3.5 rounded-xl border border-indigo-100/10">
            &ldquo;{evaluation.feedback_summary}&rdquo;
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-emerald-100 dark:border-emerald-950/30 bg-emerald-50/5 dark:bg-emerald-950/5 text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                <CheckCircle2 size={12} /> What was good
              </span>
              {evaluation.what_was_good}
            </div>

            <div className="p-4 rounded-xl border border-rose-100 dark:border-rose-950/30 bg-rose-50/5 dark:bg-rose-950/5 text-xs text-slate-650 dark:text-slate-350 leading-relaxed">
              <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                <AlertCircle size={12} /> Areas to improve
              </span>
              {evaluation.what_was_missing}
            </div>
          </div>

          {/* Hints */}
          {evaluation.ideal_answer_hints && evaluation.ideal_answer_hints.length > 0 && (
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col gap-2">
              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider flex items-center gap-1">
                <HelpCircle size={12} /> Ideal Answer guidelines
              </span>
              <ul className="list-disc pl-4 text-xs text-slate-500 dark:text-slate-400 flex flex-col gap-1">
                {evaluation.ideal_answer_hints.map((hint, idx) => (
                  <li key={idx}>{hint}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={isComplete ? handleGoToDossier : handleNextQuestion}
            className="self-end px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-md shadow-indigo-500/10"
          >
            {isComplete ? "Finish Interview & Dossier" : "Next Question"} <ChevronRight size={14} />
          </button>
        </div>
      )}
    </main>
  );
}
