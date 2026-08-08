from agents.gemini_utils import get_model, call_gemini_json
from agents.prompts.profile_prompt import PROFILE_SYSTEM_PROMPT, PROFILE_USER_TEMPLATE

async def run_profile_agent(
    cv_text: str,
    target_role: str,
    target_city: str,
    experience_years: float,
    education_level: str,
    api_key: str = None
) -> dict:
    model = get_model(PROFILE_SYSTEM_PROMPT, api_key=api_key)
    prompt = PROFILE_USER_TEMPLATE.format(
        cv_text=cv_text,
        target_role=target_role,
        target_city=target_city,
        experience_years=experience_years,
        education_level=education_level
    )
    return await call_gemini_json(model, prompt)
