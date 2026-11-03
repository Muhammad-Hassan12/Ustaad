import json
from typing import Optional
from agents.llm import LLMConfig, call_llm_json, resolve_llm_config_from_values
from agents.prompts.roadmap_prompt import ROADMAP_SYSTEM_PROMPT, ROADMAP_USER_TEMPLATE


async def run_roadmap_agent(
    gap_data: dict,
    api_key: Optional[str] = None,
    llm_config: Optional[LLMConfig] = None,
) -> dict:
    cfg = llm_config or resolve_llm_config_from_values(x_gemini_api_key=api_key)
    prompt = ROADMAP_USER_TEMPLATE.format(gap_data=json.dumps(gap_data, indent=2))
    return await call_llm_json(ROADMAP_SYSTEM_PROMPT, prompt, llm_config=cfg)
