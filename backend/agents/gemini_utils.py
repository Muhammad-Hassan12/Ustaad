"""
Shared utilities for Gemini-powered agents.
Centralises configuration, retry logic, and JSON parsing
so individual agents stay lean and focused on their prompts.
"""
import google.generativeai as genai
import asyncio
import json
import re
import os
import logging
from dotenv import load_dotenv

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ustaad.agents")

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

DEFAULT_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

def get_model(system_instruction: str, model_name: str = None) -> genai.GenerativeModel:
    """Create a configured Gemini model instance with structured output settings."""
    return genai.GenerativeModel(
        model_name=model_name or DEFAULT_MODEL,
        system_instruction=system_instruction,
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
            temperature=0.7,
        ),
    )

def parse_gemini_json(text: str) -> dict:
    """
    Parse JSON from Gemini response, handling markdown fences,
    leading/trailing text, and nested code blocks.
    """
    # Try direct parse first (fastest path when response_mime_type works)
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError:
        pass

    # Strip markdown code block fences
    clean = re.sub(r"```(?:json)?\s*", "", text).strip()
    clean = clean.rstrip("`").strip()

    # Try to extract JSON object/array from surrounding text
    for start_char, end_char in [("{", "}"), ("[", "]")]:
        start_idx = clean.find(start_char)
        end_idx = clean.rfind(end_char)
        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            try:
                return json.loads(clean[start_idx : end_idx + 1])
            except json.JSONDecodeError:
                continue

    # Last resort — original approach
    return json.loads(clean)

async def call_gemini(model: genai.GenerativeModel, prompt: str, max_retries: int = 8) -> str:
    """
    Call Gemini with exponential backoff retry on quota/rate limit errors.
    Returns raw response text. Supports up to 8 retries (total backoff spans >60s).
    """
    last_error = None
    for attempt in range(max_retries):
        try:
            response = await model.generate_content_async(prompt)
            return response.text
        except Exception as e:
            last_error = e
            err_str = str(e).lower()
            # Match common rate limit indicators: 429, resource_exhausted, quota, limit
            if any(term in err_str for term in ["429", "quota", "limit", "exhausted", "resource"]):
                wait = min(2 ** attempt, 15)
                logger.warning(
                    f"Gemini API rate limit or quota hit (Attempt {attempt + 1}/{max_retries}). "
                    f"Retrying in {wait}s... (Error: {e})"
                )
                await asyncio.sleep(wait)
            else:
                # Raise non-rate-limit errors immediately
                raise e
    raise Exception(f"Gemini max retries exceeded. Last error: {last_error}")

async def call_gemini_json(model: genai.GenerativeModel, prompt: str, max_retries: int = 8) -> dict:
    """Convenience: call Gemini and parse JSON response in one step."""
    logger.info(f"Calling Gemini ({model.model_name})...")
    raw = await call_gemini(model, prompt, max_retries)
    result = parse_gemini_json(raw)
    logger.info(f"Gemini response parsed successfully ({len(raw)} chars)")
    return result
