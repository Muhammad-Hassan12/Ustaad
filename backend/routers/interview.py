import asyncio
from typing import Optional
from fastapi import APIRouter, Body, Depends, HTTPException
from pydantic import BaseModel
from agents.interview_agent import (
    DIFFICULTY_LABELS,
    INTERVIEW_MODES,
    evaluate_answer,
    generate_interview_questions,
)
from agents.llm import LLMConfig, redact_secrets, resolve_llm_config
from db.supabase_client import get_session, supabase

router = APIRouter(prefix="/api/interview")

MAX_ANSWER_LENGTH = 5000  # characters


class StartInterviewPayload(BaseModel):
    mode: str = "sprint_5"
    difficulty: str = "junior"
    force_new: bool = False


class AnswerPayload(BaseModel):
    session_id: str
    interview_id: str
    question_id: str
    answer: str


class ProbePayload(BaseModel):
    session_id: str
    interview_id: str
    parent_question_id: str
    probe_question: str
    answer: str


def _flatten_questions(questions_data: dict) -> list[dict]:
    if not isinstance(questions_data, dict):
        return []
    tech = [
        {**q, "category": q.get("category") or "Technical"}
        for q in (questions_data.get("technical_questions") or [])
        if isinstance(q, dict)
    ]
    behav = [
        {**q, "category": q.get("category") or "Behavioral"}
        for q in (questions_data.get("behavioral_questions") or [])
        if isinstance(q, dict)
    ]
    hr = [
        {**q, "category": q.get("category") or "HR / Fit"}
        for q in (questions_data.get("hr_questions") or [])
        if isinstance(q, dict)
    ]
    return tech + behav + hr


def _get_latest_interview_for_session_sync(session_id: str) -> Optional[dict]:
    res = (
        supabase.table("interview_sessions")
        .select("*")
        .eq("session_id", session_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    return res.data[0] if res.data else None


def _get_interview_by_id_sync(interview_id: str) -> Optional[dict]:
    res = supabase.table("interview_sessions").select("*").eq("id", interview_id).execute()
    return res.data[0] if res.data else None


def _insert_interview_sync(row: dict) -> dict:
    res = supabase.table("interview_sessions").insert(row).execute()
    return res.data[0]


def _update_interview_sync(interview_id: str, updates: dict) -> None:
    supabase.table("interview_sessions").update(updates).eq("id", interview_id).execute()


def _format_interview_state(interview: dict) -> dict:
    questions_data = interview.get("questions") or {}
    all_questions = _flatten_questions(questions_data)
    idx = interview.get("current_question_index") or 0
    final_score = interview.get("final_score")
    is_complete = final_score is not None or idx >= len(all_questions)
    current_question = all_questions[idx] if (not is_complete and idx < len(all_questions)) else None

    return {
        "interview_id": interview["id"],
        "mode": questions_data.get("mode", "full_15" if len(all_questions) >= 15 else "sprint_5"),
        "difficulty": questions_data.get("difficulty", "junior"),
        "total_questions": len(all_questions),
        "current_question": current_question,
        "question_number": (idx + 1) if not is_complete else len(all_questions),
        "is_complete": is_complete,
        "answers": interview.get("answers") or [],
        "scores": interview.get("scores") or [],
        "final_score": final_score,
    }


@router.get("/active/{session_id}")
async def get_active_interview(session_id: str):
    """Check whether an in-progress or completed interview already exists for session_id."""
    interview = await asyncio.to_thread(_get_latest_interview_for_session_sync, session_id)
    if not interview:
        return {"exists": False}
    return {"exists": True, **_format_interview_state(interview)}


@router.post("/start/{session_id}")
async def start_interview(
    session_id: str,
    payload: Optional[StartInterviewPayload] = Body(default=None),
    llm_config: LLMConfig = Depends(resolve_llm_config),
):
    session = await get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found. Please start a new analysis.")

    req_mode = payload.mode if payload else "sprint_5"
    req_diff = payload.difficulty if payload else "junior"
    force_new = payload.force_new if payload else False

    if req_mode not in INTERVIEW_MODES:
        req_mode = "sprint_5"
    if req_diff not in DIFFICULTY_LABELS:
        req_diff = "junior"

    # Resume existing incomplete interview unless explicitly starting a fresh session
    if not force_new:
        existing = await asyncio.to_thread(_get_latest_interview_for_session_sync, session_id)
        if existing:
            state = _format_interview_state(existing)
            if not state["is_complete"] and state["current_question"]:
                return {"resumed": True, **state}

    profile_data = session.get("profile_data") or {}
    market_data = session.get("market_data") or {}

    try:
        questions = await generate_interview_questions(
            profile_data,
            market_data,
            llm_config=llm_config,
            mode=req_mode,
            difficulty=req_diff,
        )
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=redact_secrets(str(e), llm_config.api_key),
        )

    inserted = await asyncio.to_thread(
        _insert_interview_sync,
        {
            "session_id": session_id,
            "questions": questions,
            "current_question_index": 0,
            "answers": [],
            "scores": [],
        },
    )
    return {"resumed": False, **_format_interview_state(inserted)}


@router.post("/answer")
async def submit_answer(
    payload: AnswerPayload,
    llm_config: LLMConfig = Depends(resolve_llm_config),
):
    if len(payload.answer) > MAX_ANSWER_LENGTH:
        return {"error": f"Answer is too long. Maximum {MAX_ANSWER_LENGTH} characters."}
    if not payload.answer.strip():
        return {"error": "Answer cannot be empty."}

    session = await get_session(payload.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    target_role = session.get("target_role", "")

    interview = await asyncio.to_thread(_get_interview_by_id_sync, payload.interview_id)
    if not interview:
        raise HTTPException(status_code=404, detail="Interview session not found.")
    if interview.get("session_id") != payload.session_id:
        raise HTTPException(status_code=400, detail="Interview session does not match session_id.")

    questions_data = interview.get("questions") or {}
    all_questions = _flatten_questions(questions_data)
    if not all_questions:
        return {"error": "No interview questions available in this session."}

    current_index = interview.get("current_question_index") or 0
    if current_index >= len(all_questions):
        return {
            "evaluation": None,
            "next_question": None,
            "question_number": None,
            "is_complete": True,
            "final_score": interview.get("final_score"),
        }

    current_q = all_questions[current_index]

    try:
        evaluation = await evaluate_answer(
            target_role=target_role,
            question=current_q.get("question", ""),
            what_looking_for=current_q.get("what_interviewer_looks_for", ""),
            candidate_answer=payload.answer,
            question_number=current_index + 1,
            total_questions=len(all_questions),
            llm_config=llm_config,
        )
    except Exception as e:
        return {"error": redact_secrets(str(e), llm_config.api_key)}

    answers = list(interview.get("answers") or [])
    scores = list(interview.get("scores") or [])

    numeric_score = evaluation.get("score", 0)
    try:
        numeric_score = float(numeric_score)
    except Exception:
        numeric_score = 0.0

    answers.append({
        "question_id": payload.question_id,
        "question": current_q.get("question", ""),
        "category": current_q.get("category", "Technical"),
        "answer": payload.answer,
    })
    scores.append({
        "question_id": payload.question_id,
        "score": numeric_score,
        "clarity_score": evaluation.get("clarity_and_structure_score"),
        "feedback_summary": evaluation.get("feedback_summary", ""),
    })

    next_index = current_index + 1
    is_complete = next_index >= len(all_questions)
    next_question = all_questions[next_index] if not is_complete else None

    final_score = None
    if is_complete and scores:
        total = sum(float(s.get("score", 0)) for s in scores)
        final_score = round((total / (len(scores) * 10)) * 100, 1)

    await asyncio.to_thread(
        _update_interview_sync,
        payload.interview_id,
        {
            "current_question_index": next_index,
            "answers": answers,
            "scores": scores,
            "final_score": final_score,
        },
    )

    return {
        "evaluation": evaluation,
        "next_question": next_question,
        "question_number": next_index + 1 if not is_complete else None,
        "is_complete": is_complete,
        "final_score": final_score,
    }


@router.post("/probe")
async def submit_probe(
    payload: ProbePayload,
    llm_config: LLMConfig = Depends(resolve_llm_config),
):
    if len(payload.answer) > MAX_ANSWER_LENGTH:
        return {"error": f"Answer is too long. Maximum {MAX_ANSWER_LENGTH} characters."}
    if not payload.answer.strip():
        return {"error": "Answer cannot be empty."}
    if not payload.probe_question.strip():
        return {"error": "Probe question cannot be empty."}

    session = await get_session(payload.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    target_role = session.get("target_role", "")

    interview = await asyncio.to_thread(_get_interview_by_id_sync, payload.interview_id)
    if not interview:
        raise HTTPException(status_code=404, detail="Interview session not found.")
    if interview.get("session_id") != payload.session_id:
        raise HTTPException(status_code=400, detail="Interview session does not match session_id.")

    questions_data = interview.get("questions") or {}
    all_questions = _flatten_questions(questions_data)
    total_q = len(all_questions) if all_questions else 5
    current_index = interview.get("current_question_index") or 1

    try:
        evaluation = await evaluate_answer(
            target_role=target_role,
            question=payload.probe_question,
            what_looking_for="Technical depth, concrete architecture trade-offs, and STAR specificity addressing the follow-up probe.",
            candidate_answer=payload.answer,
            question_number=current_index,
            total_questions=total_q,
            llm_config=llm_config,
        )
    except Exception as e:
        return {"error": redact_secrets(str(e), llm_config.api_key)}

    # Attach probe to matching score without altering question progression or total counts
    scores = list(interview.get("scores") or [])
    probe_entry = {
        "probe_question": payload.probe_question,
        "probe_answer": payload.answer,
        "probe_score": evaluation.get("score"),
        "feedback_summary": evaluation.get("feedback_summary", ""),
        "clarity_score": evaluation.get("clarity_and_structure_score"),
        "what_was_good": evaluation.get("what_was_good", ""),
        "what_was_missing": evaluation.get("what_was_missing", ""),
    }

    matched = False
    for sc in reversed(scores):
        if sc.get("question_id") == payload.parent_question_id:
            sc["probe_evaluation"] = probe_entry
            matched = True
            break
    if not matched and scores:
        scores[-1]["probe_evaluation"] = probe_entry

    await asyncio.to_thread(
        _update_interview_sync,
        payload.interview_id,
        {"scores": scores},
    )

    return {
        "evaluation": evaluation,
        "parent_question_id": payload.parent_question_id,
    }


@router.post("/finish/{interview_id}")
async def finish_interview_early(interview_id: str):
    """Allow ending an interview early and computing the overall score on answered questions."""
    interview = await asyncio.to_thread(_get_interview_by_id_sync, interview_id)
    if not interview:
        raise HTTPException(status_code=404, detail="Interview session not found.")

    scores = interview.get("scores") or []
    questions_data = interview.get("questions") or {}
    all_questions = _flatten_questions(questions_data)

    if not scores:
        raise HTTPException(status_code=400, detail="Answer at least 1 question before finishing and scoring.")

    total = sum(float(s.get("score", 0)) for s in scores)
    final_score = round((total / (len(scores) * 10)) * 100, 1)

    await asyncio.to_thread(
        _update_interview_sync,
        interview_id,
        {
            "current_question_index": len(all_questions),
            "final_score": final_score,
        },
    )

    return {
        "is_complete": True,
        "answered_count": len(scores),
        "final_score": final_score,
    }


@router.get("/summary/{session_id}")
async def get_interview_summary(session_id: str):
    interview = await asyncio.to_thread(_get_latest_interview_for_session_sync, session_id)
    if not interview:
        return {"error": "No interview found for this session"}
    return interview
