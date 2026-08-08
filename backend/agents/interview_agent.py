import json
from agents.gemini_utils import get_model, call_gemini_json
from agents.prompts.interview_prompt import (
    QUESTION_GEN_SYSTEM_PROMPT, QUESTION_GEN_USER_TEMPLATE,
    ANSWER_EVAL_SYSTEM_PROMPT, ANSWER_EVAL_USER_TEMPLATE
)

async def generate_interview_questions(profile_data: dict, market_data: dict, api_key: str = None) -> dict:
    model = get_model(QUESTION_GEN_SYSTEM_PROMPT, api_key=api_key)
    prompt = QUESTION_GEN_USER_TEMPLATE.format(
        target_role=profile_data.get("target_role", ""),
        candidate_profile=json.dumps(profile_data, indent=2),
        market_data=json.dumps(market_data, indent=2)
    )
    return await call_gemini_json(model, prompt)

async def evaluate_answer(
    target_role: str,
    question: str,
    what_looking_for: str,
    candidate_answer: str,
    question_number: int,
    api_key: str = None
) -> dict:
    model = get_model(ANSWER_EVAL_SYSTEM_PROMPT, api_key=api_key)
    prompt = ANSWER_EVAL_USER_TEMPLATE.format(
        target_role=target_role,
        question=question,
        what_looking_for=what_looking_for,
        candidate_answer=candidate_answer,
        question_number=question_number
    )
    return await call_gemini_json(model, prompt)
