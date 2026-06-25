import json
from agents.gemini_utils import get_model, call_gemini_json
from agents.prompts.gap_prompt import GAP_SYSTEM_PROMPT, GAP_USER_TEMPLATE

async def run_gap_agent(profile_data: dict, market_data: dict) -> dict:
    model = get_model(GAP_SYSTEM_PROMPT)
    prompt = GAP_USER_TEMPLATE.format(
        candidate_profile=json.dumps(profile_data, indent=2),
        market_data=json.dumps(market_data, indent=2)
    )
    return await call_gemini_json(model, prompt)
