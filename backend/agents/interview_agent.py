import json
from typing import Optional
from agents.llm import LLMConfig, call_llm_json, resolve_llm_config_from_values
from agents.prompts.interview_prompt import (
    ANSWER_EVAL_SYSTEM_PROMPT,
    ANSWER_EVAL_USER_TEMPLATE,
    QUESTION_GEN_SYSTEM_PROMPT,
    QUESTION_GEN_USER_TEMPLATE,
)

INTERVIEW_MODES: dict[str, dict] = {
    "sprint_5": {
        "label": "Rapid 5-Question Sprint (Balanced Technical + Behavioral + HR)",
        "tech": 2,
        "behav": 2,
        "hr": 1,
    },
    "technical": {
        "label": "Technical & Architecture Deep-Dive (6 Questions)",
        "tech": 6,
        "behav": 0,
        "hr": 0,
    },
    "behavioral_hr": {
        "label": "Behavioral STAR & Pakistani HR Fit (6 Questions)",
        "tech": 0,
        "behav": 4,
        "hr": 2,
    },
    "full_15": {
        "label": "Full 15-Question Mock Interview Loop",
        "tech": 5,
        "behav": 5,
        "hr": 5,
    },
}

DIFFICULTY_LABELS: dict[str, str] = {
    "fresh_grad": "Fresh Graduate / Entry-Level Intern (0-1 years experience; focus on fundamentals, FYP/projects, and learning agility)",
    "junior": "Junior Engineer (1-2 years experience; focus on practical implementation, debugging, and team delivery)",
    "mid_senior": "Mid-to-Senior Engineer (3+ years experience; focus on system design, trade-offs, ownership, and leadership)",
}


async def generate_interview_questions(
    profile_data: dict,
    market_data: dict,
    api_key: Optional[str] = None,
    llm_config: Optional[LLMConfig] = None,
    mode: str = "sprint_5",
    difficulty: str = "junior",
) -> dict:
    cfg = llm_config or resolve_llm_config_from_values(x_gemini_api_key=api_key)
    mode_spec = INTERVIEW_MODES.get(mode, INTERVIEW_MODES["sprint_5"])
    diff_label = DIFFICULTY_LABELS.get(difficulty, DIFFICULTY_LABELS["junior"])
    total_count = mode_spec["tech"] + mode_spec["behav"] + mode_spec["hr"]

    prompt = QUESTION_GEN_USER_TEMPLATE.format(
        target_role=profile_data.get("target_role", ""),
        difficulty_label=diff_label,
        mode_description=mode_spec["label"],
        candidate_profile=json.dumps(profile_data, indent=2),
        market_data=json.dumps(market_data, indent=2),
        total_count=total_count,
        tech_count=mode_spec["tech"],
        behav_count=mode_spec["behav"],
        hr_count=mode_spec["hr"],
    )
    questions = await call_llm_json(QUESTION_GEN_SYSTEM_PROMPT, prompt, llm_config=cfg)
    if isinstance(questions, dict):
        questions["mode"] = mode if mode in INTERVIEW_MODES else "sprint_5"
        questions["difficulty"] = difficulty if difficulty in DIFFICULTY_LABELS else "junior"
    return questions


async def evaluate_answer(
    target_role: str,
    question: str,
    what_looking_for: str,
    candidate_answer: str,
    question_number: int,
    total_questions: int = 15,
    api_key: Optional[str] = None,
    llm_config: Optional[LLMConfig] = None,
) -> dict:
    cfg = llm_config or resolve_llm_config_from_values(x_gemini_api_key=api_key)
    prompt = ANSWER_EVAL_USER_TEMPLATE.format(
        target_role=target_role,
        question=question,
        what_looking_for=what_looking_for,
        candidate_answer=candidate_answer,
        question_number=question_number,
        total_questions=total_questions,
    )
    return await call_llm_json(ANSWER_EVAL_SYSTEM_PROMPT, prompt, llm_config=cfg)
