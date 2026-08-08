import json
from agents.gemini_utils import get_model, call_gemini_json
from agents.prompts.roadmap_prompt import ROADMAP_SYSTEM_PROMPT, ROADMAP_USER_TEMPLATE

async def run_roadmap_agent(gap_data: dict, api_key: str = None) -> dict:
    model = get_model(ROADMAP_SYSTEM_PROMPT, api_key=api_key)
    prompt = ROADMAP_USER_TEMPLATE.format(gap_data=json.dumps(gap_data, indent=2))
    return await call_gemini_json(model, prompt)
