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
            f"\nSPECIFIC TARGET JOB DESCRIPTION (JD):\n<target_job_description>\n{clean_jd[:4000]}\n</target_job_description>\n"
            "(Compute jd_match_score 0-100 and list exact jd_missing_keywords from this JD.)\n"
        )
        jd_score_example = "78"
        jd_keywords_example = '["keyword1", "keyword2"]'
    else:
        jd_section = ""
        jd_score_example = "null"
        jd_keywords_example = "[]"

    pow_digest = (profile_data.get("proof_of_work") or {}).get("prompt_digest")
    pow_section = (
        f"\nVERIFIED PROOF-OF-WORK AUDIT (GITHUB & PORTFOLIO):\n{pow_digest}\n"
        if pow_digest
        else ""
    )
    combined_section = (
        f"{jd_section}\n{pow_section}".strip()
        if (jd_section or pow_section)
        else ""
    )

    lean_profile = {
        k: v
        for k, v in (profile_data or {}).items()
        if k not in ("target_job_description", "reaudit_delta", "proof_of_work")
    }

    lean_market = {
        k: v
        for k, v in (market_data or {}).items()
        if k not in (
            "raw_job_listings",
            "verified_job_links",
            "unverified",
            "cache_hit",
            "source_mode",
            "generated_at",
            "live_data_available",
        )
    }

    prompt = GAP_USER_TEMPLATE.format(
        candidate_profile=json.dumps(lean_profile, indent=2),
        market_data=json.dumps(lean_market, indent=2),
        jd_section=combined_section,
        jd_score_example=jd_score_example,
        jd_keywords_example=jd_keywords_example,
    )
    return await call_llm_json(GAP_SYSTEM_PROMPT, prompt, llm_config=cfg)
