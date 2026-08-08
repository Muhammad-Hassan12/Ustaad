import json
from agents.gemini_utils import get_model, call_gemini_json
from tools.job_scraper import search_pakistan_job_market
from agents.prompts.market_prompt import MARKET_SYSTEM_PROMPT, MARKET_USER_TEMPLATE

async def run_market_agent(target_role: str, target_city: str, api_key: str = None) -> dict:
    # Step 1: Fetch real-time job data
    search_results = await search_pakistan_job_market(target_role, target_city)

    # Step 2: Pass to Gemini for structured extraction
    model = get_model(MARKET_SYSTEM_PROMPT, api_key=api_key)
    prompt = MARKET_USER_TEMPLATE.format(
        target_role=target_role,
        target_city=target_city,
        search_results=json.dumps(search_results, indent=2)
    )
    return await call_gemini_json(model, prompt)
