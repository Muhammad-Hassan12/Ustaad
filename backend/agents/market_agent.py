import json
import logging
from typing import Optional
from agents.llm import LLMConfig, call_llm_json, resolve_llm_config_from_values
from agents.prompts.market_prompt import MARKET_SYSTEM_PROMPT, MARKET_USER_TEMPLATE
from db.supabase_client import get_cached_market_data
from tools.job_scraper import search_pakistan_job_market

logger = logging.getLogger("ustaad.agents")


async def run_market_agent(
    target_role: str,
    target_city: str,
    api_key: Optional[str] = None,
    llm_config: Optional[LLMConfig] = None,
    use_cache: bool = True,
) -> dict:
    # Step 0: Check 48-hour Supabase market cache to conserve Serper.dev + LLM quota
    if use_cache:
        cached = await get_cached_market_data(target_role, target_city, ttl_hours=48)
        if cached:
            logger.info("Market cache hit for '%s' in '%s' (<48h).", target_role, target_city)
            return cached

    # Step 1: Fetch real-time job data concurrently via Serper.dev
    search_results = await search_pakistan_job_market(target_role, target_city)

    # Step 2: Pass to configured LLM for structured extraction
    cfg = llm_config or resolve_llm_config_from_values(x_gemini_api_key=api_key)
    prompt = MARKET_USER_TEMPLATE.format(
        target_role=target_role,
        target_city=target_city,
        search_results=json.dumps(search_results, indent=2),
    )
    return await call_llm_json(MARKET_SYSTEM_PROMPT, prompt, llm_config=cfg)
