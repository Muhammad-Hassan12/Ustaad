from typing import Optional
from agents.llm import LLMConfig, call_llm_json, resolve_llm_config_from_values
from agents.prompts.profile_prompt import PROFILE_SYSTEM_PROMPT, PROFILE_USER_TEMPLATE


async def run_profile_agent(
    cv_text: str,
    target_role: str,
    target_city: str,
    experience_years: float,
    education_level: str,
    api_key: Optional[str] = None,
    llm_config: Optional[LLMConfig] = None,
) -> dict:
    cfg = llm_config or resolve_llm_config_from_values(x_gemini_api_key=api_key)
    prompt = PROFILE_USER_TEMPLATE.format(
        cv_text=cv_text,
        target_role=target_role,
        target_city=target_city,
        experience_years=experience_years,
        education_level=education_level,
    )
    return await call_llm_json(PROFILE_SYSTEM_PROMPT, prompt, llm_config=cfg)
