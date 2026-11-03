import json
from typing import Optional
from agents.llm import LLMConfig, call_llm_json, resolve_llm_config_from_values
from agents.prompts.gap_prompt import GAP_SYSTEM_PROMPT, GAP_USER_TEMPLATE


async def run_gap_agent(
    profile_data: dict,
    market_data: dict,
    api_key: Optional[str] = None,
    llm_config: Optional[LLMConfig] = None,
    job_description: Optional[str] = None,
) -> dict:
    cfg = llm_config or resolve_llm_config_from_values(x_gemini_api_key=api_key)
    clean_jd = (job_description or "").strip()
    if clean_jd:
        jd_section = (
            f"\nSPECIFIC TARGET JOB DESCRIPTION (JD):\n{clean_jd[:4000]}\n"
            "(Compute jd_match_score 0-100 and list exact jd_missing_keywords from this JD.)\n"
        )
        jd_score_example = "78"
        jd_keywords_example = '["keyword1", "keyword2"]'
    else:
        jd_section = ""
        jd_score_example = "null"
        jd_keywords_example = "[]"

    prompt = GAP_USER_TEMPLATE.format(
        candidate_profile=json.dumps(profile_data, indent=2),
        market_data=json.dumps(market_data, indent=2),
        jd_section=jd_section,
        jd_score_example=jd_score_example,
        jd_keywords_example=jd_keywords_example,
    )
    return await call_llm_json(GAP_SYSTEM_PROMPT, prompt, llm_config=cfg)
