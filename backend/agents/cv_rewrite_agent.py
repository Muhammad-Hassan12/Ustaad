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
        f"\nSPECIFIC TARGET JOB DESCRIPTION (TAILOR BULLETS & PITCH TO THIS JD):\n<target_job_description>\n{clean_jd[:4000]}\n</target_job_description>\n"
        if clean_jd
        else ""
    )
    pow_digest = (profile_data.get("proof_of_work") or {}).get("prompt_digest")
    pow_section = (
        f"\nVERIFIED PROOF-OF-WORK AUDIT (FEATURE ACTIVE PROJECTS/PORTFOLIO IN CV):\n{pow_digest}\n"
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
    lean_gap = {
        k: v
        for k, v in (gap_data or {}).items()
        if k in (
            "overall_readiness_score",
            "critical_gaps",
            "moderate_gaps",
            "strengths_to_highlight",
            "summary",
        )
    }
    prompt = CV_REWRITE_USER_TEMPLATE.format(
        candidate_profile=json.dumps(lean_profile, indent=2),
        market_data=json.dumps(lean_market, indent=2),
        gap_data=json.dumps(lean_gap, indent=2),
        jd_section=combined_section,
    )
    return await call_llm_json(CV_REWRITE_SYSTEM_PROMPT, prompt, llm_config=cfg)
