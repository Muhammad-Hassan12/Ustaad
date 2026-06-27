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
import httpx
import ast
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
    Parse JSON from model response, handling markdown fences,
    leading/trailing text, nested code blocks, trailing commas,
    and Python-like dictionary representations (single quotes).
    """
    # 1. Try direct parse first
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError:
        pass

    # Strip markdown code block fences
    clean = re.sub(r"```(?:json)?\s*", "", text).strip()
    clean = clean.rstrip("`").strip()

    # 2. Try to extract JSON object/array from surrounding text
    for start_char, end_char in [("{", "}"), ("[", "]")]:
        start_idx = clean.find(start_char)
        end_idx = clean.rfind(end_char)
        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            block = clean[start_idx : end_idx + 1]
            
            # Try to load directly
            try:
                return json.loads(block)
            except json.JSONDecodeError:
                pass
                
            # Try cleaning trailing commas (very common with local LLMs)
            try:
                cleaned_block = re.sub(r',(\s*[\]}])', r'\1', block)
                return json.loads(cleaned_block)
            except json.JSONDecodeError:
                pass
                
            # Try ast.literal_eval fallback (excellent for single-quoted dict strings)
            try:
                block_py = block.replace("true", "True").replace("false", "False").replace("null", "None")
                evaluated = ast.literal_eval(block_py)
                if isinstance(evaluated, (dict, list)):
                    return evaluated
            except Exception:
                pass

    # 3. Last resort: try ast.literal_eval on the entire cleaned text
    try:
        clean_py = clean.replace("true", "True").replace("false", "False").replace("null", "None")
        evaluated = ast.literal_eval(clean_py)
        if isinstance(evaluated, (dict, list)):
            return evaluated
    except Exception:
        pass

    # Log the exact raw text for debugging before raising the final error
    logger.error(
        f"JSON parsing failed completely! The raw model response was:\n"
        f"================= RAW START =================\n"
        f"{text}\n"
        f"================== RAW END =================="
    )
    
    # Try parsing clean block directly as a last resort to raise the standard decoding exception
    return json.loads(clean)

async def call_kaggle_qwen(system_instruction: str, prompt: str) -> str:
    """
    Call the secondary Qwen model hosted on Kaggle using OpenAI-compatible chat endpoint.
    """
    kaggle_url = os.getenv("KAGGLE_LLM_URL")
    if not kaggle_url:
        raise Exception("KAGGLE_LLM_URL is not set.")
    
    json_instruction = "IMPORTANT: You must output ONLY valid JSON format. Do not add markdown blocks like ```json or any other text before or after."
    
    # Qwen uses ChatML template format. We provide both to handle different endpoint models.
    combined_prompt = (
        f"<|im_start|>system\n{system_instruction or 'You are a helpful assistant.'}\n{json_instruction}<|im_end|>\n"
        f"<|im_start|>user\n{prompt}<|im_end|>\n"
        f"<|im_start|>assistant\n"
    )
    
    payload = {
        "model": "qwen",
        "prompt": combined_prompt,
        "messages": [
            {"role": "system", "content": f"{system_instruction or 'You are a helpful assistant.'}\n{json_instruction}"},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 4096,
        "max_new_tokens": 4096
    }
    
    headers = {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true"
    }
    
    async with httpx.AsyncClient() as client:
        logger.info(f"Calling secondary Kaggle Qwen model at {kaggle_url}...")
        response = await client.post(kaggle_url, json=payload, headers=headers, timeout=300.0)
        
        if response.status_code != 200:
            logger.error(f"Kaggle API returned status {response.status_code}: {response.text}")
            response.raise_for_status()
            
        res_data = response.json()
        
        text = ""
        # 1. Handle custom Kaggle format: {"status": "success", "response": "..."}
        if "response" in res_data:
            text = res_data["response"]
            
        # 2. Handle standard OpenAI chat/text completions: {"choices": [{"message": {"content": "..."}}]}
        elif "choices" in res_data and len(res_data["choices"]) > 0:
            choice = res_data["choices"][0]
            if "message" in choice and isinstance(choice["message"], dict) and "content" in choice["message"]:
                text = choice["message"]["content"]
            elif "text" in choice:
                text = choice["text"]
                
        # 3. Handle other custom formats: {"text": "..."}
        elif "text" in res_data:
            text = res_data["text"]
        else:
            raise Exception(f"Could not parse response content from Kaggle API payload: {res_data}")

        if "</think>" in text:
            text = text.split("</think>")[-1].strip()

        return text

async def call_gemini(model: genai.GenerativeModel, prompt: str, max_retries: int = 8) -> str:
    """
    Call Gemini with exponential backoff retry on quota/rate limit errors.
    Returns raw response text. Supports up to 8 retries (total backoff spans >60s).
    Falls back to secondary Kaggle Qwen model if Gemini fails/rate-limits and KAGGLE_LLM_URL is set.
    """
    kaggle_url = os.getenv("KAGGLE_LLM_URL")
    system_instruction = getattr(model, "system_instruction", "")
    sys_inst_str = ""
    if system_instruction:
        if isinstance(system_instruction, str):
            sys_inst_str = system_instruction
        else:
            sys_inst_str = str(system_instruction)

    last_error = None
    for attempt in range(max_retries):
        try:
            response = await model.generate_content_async(prompt)
            return response.text
        except Exception as e:
            last_error = e
            err_str = str(e).lower()
            
            # If we have a Kaggle backup, attempt failover immediately
            if kaggle_url:
                logger.warning(f"Gemini call failed (Error: {e}). Attempting failover to secondary Kaggle Qwen model...")
                try:
                    return await call_kaggle_qwen(sys_inst_str, prompt)
                except Exception as fallback_err:
                    logger.error(f"Failover to Kaggle Qwen failed: {repr(fallback_err)}. Proceeding with Gemini retries...")
            
            # Match common rate limit indicators: 429, resource_exhausted, quota, limit
            if any(term in err_str for term in ["429", "quota", "limit", "exhausted", "resource"]):
                wait = min(2 ** attempt, 15)
                logger.warning(
                    f"Gemini API rate limit or quota hit (Attempt {attempt + 1}/{max_retries}). "
                    f"Retrying in {wait}s... (Error: {e})"
                )
                await asyncio.sleep(wait)
            else:
                # Raise non-rate-limit errors immediately if no Kaggle fallback or if it failed
                raise e
                
    # Final fallback attempt if all Gemini retries failed
    if kaggle_url:
        logger.warning("Gemini retries exhausted. Attempting final failover to secondary Kaggle Qwen model...")
        try:
            return await call_kaggle_qwen(sys_inst_str, prompt)
        except Exception as fallback_err:
            logger.error(f"Final failover to Kaggle Qwen failed: {repr(fallback_err)}")
            
    raise Exception(f"Gemini max retries exceeded. Last error: {last_error}")

async def call_gemini_json(model: genai.GenerativeModel, prompt: str, max_retries: int = 8) -> dict:
    """Convenience: call Gemini and parse JSON response in one step."""
    logger.info(f"Calling Gemini ({model.model_name})...")
    raw = await call_gemini(model, prompt, max_retries)
    result = parse_gemini_json(raw)
    logger.info(f"Gemini response parsed successfully ({len(raw)} chars)")
    return result
