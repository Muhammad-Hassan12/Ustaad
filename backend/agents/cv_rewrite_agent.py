import json
from typing import Optional
from agents.llm import LLMConfig, call_llm_json, resolve_llm_config_from_values
from agents.prompts.cv_rewrite_prompt import CV_REWRITE_SYSTEM_PROMPT, CV_REWRITE_USER_TEMPLATE


async def run_cv_rewrite_agent(
    profile_data: dict,
    market_data: dict,
    gap_data: dict,
    api_key: Optional[str] = None,
    llm_config: Optional[LLMConfig] = None,
    job_description: Optional[str] = None,
) -> dict:
    cfg = llm_config or resolve_llm_config_from_values(x_gemini_api_key=api_key)
    clean_jd = (job_description or "").strip()
    jd_section = (
        f"\nSPECIFIC TARGET JOB DESCRIPTION (TAILOR BULLETS & PITCH TO THIS JD):\n{clean_jd[:4000]}\n"
        if clean_jd
        else ""
    )
    prompt = CV_REWRITE_USER_TEMPLATE.format(
        candidate_profile=json.dumps(profile_data, indent=2),
        market_data=json.dumps(market_data, indent=2),
        gap_data=json.dumps(gap_data, indent=2),
        jd_section=jd_section,
    )
    return await call_llm_json(CV_REWRITE_SYSTEM_PROMPT, prompt, llm_config=cfg)
