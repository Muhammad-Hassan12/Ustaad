from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from typing import Optional
from agents.interview_agent import generate_interview_questions, evaluate_answer
from db.supabase_client import get_session, supabase
import json

router = APIRouter(prefix="/api/interview")

MAX_ANSWER_LENGTH = 5000  # characters

class AnswerPayload(BaseModel):
    session_id: str
    interview_id: str
    question_id: str
    answer: str

@router.post("/start/{session_id}")
async def start_interview(
    session_id: str,
    x_gemini_api_key: Optional[str] = Header(default=None),
):
    session = await get_session(session_id)
    # Guard against empty session (UUID not found in DB)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found. Please start a new analysis.")

    profile_data = session.get("profile_data", {})
    market_data = session.get("market_data", {})

    questions = await generate_interview_questions(profile_data, market_data, api_key=x_gemini_api_key)

    result = supabase.table("interview_sessions").insert({
        "session_id": session_id,
        "questions": questions,
        "current_question_index": 0,
        "answers": [],
        "scores": []
    }).execute()

    interview_id = result.data[0]["id"]
    all_questions = (
        questions.get("technical_questions", []) +
        questions.get("behavioral_questions", []) +
        questions.get("hr_questions", [])
    )
    first_question = all_questions[0] if all_questions else {}

    return {
        "interview_id": interview_id,
        "total_questions": len(all_questions),
        "current_question": first_question,
        "question_number": 1
    }

@router.post("/answer")
async def submit_answer(
    payload: AnswerPayload,
    x_gemini_api_key: Optional[str] = Header(default=None),
):
    if len(payload.answer) > MAX_ANSWER_LENGTH:
        return {"error": f"Answer is too long. Maximum {MAX_ANSWER_LENGTH} characters."}

    session = await get_session(payload.session_id)
    target_role = session.get("target_role", "")

    interview_result = supabase.table("interview_sessions").select("*").eq("id", payload.interview_id).execute()
    interview = interview_result.data[0]

    questions_data = interview["questions"]
    all_questions = (
        questions_data.get("technical_questions", []) +
        questions_data.get("behavioral_questions", []) +
        questions_data.get("hr_questions", [])
    )

    current_index = interview["current_question_index"]
    current_q = all_questions[current_index]

    evaluation = await evaluate_answer(
        target_role=target_role,
        question=current_q["question"],
        what_looking_for=current_q.get("what_interviewer_looks_for", ""),
        candidate_answer=payload.answer,
        question_number=current_index + 1,
        api_key=x_gemini_api_key,
    )

    answers = interview["answers"] or []
    scores = interview["scores"] or []
    answers.append({"question_id": payload.question_id, "answer": payload.answer})
    scores.append({"question_id": payload.question_id, "score": evaluation["score"]})

    next_index = current_index + 1
    is_complete = next_index >= len(all_questions)
    next_question = all_questions[next_index] if not is_complete else None

    final_score = None
    if is_complete:
        total = sum(s["score"] for s in scores)
        final_score = round((total / (len(scores) * 10)) * 100, 1)

    supabase.table("interview_sessions").update({
        "current_question_index": next_index,
        "answers": answers,
        "scores": scores,
        "final_score": final_score
    }).eq("id", payload.interview_id).execute()

    return {
        "evaluation": evaluation,
        "next_question": next_question,
        "question_number": next_index + 1 if not is_complete else None,
        "is_complete": is_complete,
        "final_score": final_score
    }

@router.get("/summary/{session_id}")
async def get_interview_summary(session_id: str):
    result = supabase.table("interview_sessions").select("*").eq("session_id", session_id).execute()
    if not result.data:
        return {"error": "No interview found for this session"}
    return result.data[0]
