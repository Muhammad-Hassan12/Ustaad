import json
from agents.gemini_utils import get_model, call_gemini_json
from agents.prompts.cv_rewrite_prompt import CV_REWRITE_SYSTEM_PROMPT, CV_REWRITE_USER_TEMPLATE

async def run_cv_rewrite_agent(profile_data: dict, market_data: dict, gap_data: dict) -> dict:
    model = get_model(CV_REWRITE_SYSTEM_PROMPT)
    prompt = CV_REWRITE_USER_TEMPLATE.format(
        candidate_profile=json.dumps(profile_data, indent=2),
        market_data=json.dumps(market_data, indent=2),
        gap_data=json.dumps(gap_data, indent=2)
    )
    return await call_gemini_json(model, prompt)
