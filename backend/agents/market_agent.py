from datetime import datetime, timezone
import json
import logging
import urllib.parse
from typing import Optional
from agents.llm import LLMConfig, call_llm_json, resolve_llm_config_from_values
from agents.prompts.market_prompt import MARKET_SYSTEM_PROMPT, MARKET_USER_TEMPLATE
from db.supabase_client import get_cached_market_data
from tools.job_scraper import search_pakistan_job_market

logger = logging.getLogger("ustaad.agents")


def _extract_verified_job_links(search_results: list[dict], max_items: int = 8) -> list[dict]:
    """Extract and deduplicate clickable job links directly from Serper organic search results."""
    verified = []
    seen_urls = set()

    for entry in search_results:
        if not isinstance(entry, dict):
            continue
        for item in entry.get("results", []):
            if not isinstance(item, dict):
                continue
            link = (item.get("link") or "").strip()
            if not link.startswith(("http://", "https://")):
                continue

            try:
                parsed = urllib.parse.urlparse(link)
                hostname = parsed.netloc.lower().removeprefix("www.")
            except Exception:
                continue

            # Normalized URL for deduplication (strip query tracking and trailing slash)
            norm_url = f"{parsed.scheme}://{parsed.netloc}{parsed.path}".rstrip("/")
            if norm_url in seen_urls:
                continue
            seen_urls.add(norm_url)

            # Friendly source name
            if "rozee.pk" in hostname:
                source = "Rozee.pk"
            elif "linkedin.com" in hostname:
                source = "LinkedIn"
            elif "mustakbil.com" in hostname:
                source = "Mustakbil"
            elif "indeed.com" in hostname:
                source = "Indeed PK"
            elif "glassdoor.com" in hostname:
                source = "Glassdoor"
            else:
                source = hostname or "Job Board"

            title = (item.get("title") or "Job Opening").strip()[:140]
            snippet = (item.get("snippet") or "").strip()[:240]

            verified.append({
                "title": title,
                "url": link,
                "source": source,
                "snippet": snippet,
            })

            if len(verified) >= max_items:
                return verified

    return verified


async def run_market_agent(
    target_role: str,
    target_city: str,
    api_key: Optional[str] = None,
    llm_config: Optional[LLMConfig] = None,
    use_cache: bool = True,
) -> dict:
    cfg = llm_config or resolve_llm_config_from_values(x_gemini_api_key=api_key)

    # Step 0: Check 48-hour Supabase market cache to conserve Serper.dev + LLM quota
    if use_cache:
        cached = await get_cached_market_data(target_role, target_city, ttl_hours=48)
        if cached:
            logger.info("Market cache hit for '%s' in '%s' (<48h).", target_role, target_city)
            res = dict(cached)
            res["cache_hit"] = True
            return res

    # Step 1: Fetch real-time job data concurrently via Serper.dev
    search_results = await search_pakistan_job_market(target_role, target_city)
    has_live_results = any(
        bool(entry.get("results")) for entry in search_results if isinstance(entry, dict)
    )
    verified_job_links = _extract_verified_job_links(search_results)

    # Clean and compress search results to essential titles, snippets, and links to minimize token usage
    clean_results = []
    for entry in search_results:
        if not isinstance(entry, dict):
            continue
        clean_entry = {
            "query": entry.get("query"),
            "results": [
                {
                    "title": (item.get("title") or "")[:120],
                    "snippet": (item.get("snippet") or "")[:240],
                    "link": (item.get("link") or "")[:160],
                }
                for item in entry.get("results", [])[:8]
                if isinstance(item, dict)
            ],
        }
        clean_results.append(clean_entry)

    # Step 2: Pass to configured LLM for structured extraction
    prompt = MARKET_USER_TEMPLATE.format(
        target_role=target_role,
        target_city=target_city,
        search_results=json.dumps(clean_results, indent=2),
    )
    result = await call_llm_json(MARKET_SYSTEM_PROMPT, prompt, llm_config=cfg)
    if isinstance(result, dict):
        result["verified_job_links"] = verified_job_links
        result["live_data_available"] = has_live_results
        result["unverified"] = not has_live_results
        result["source_mode"] = "byok" if cfg.is_byok else "server_default"
        result["generated_at"] = datetime.now(timezone.utc).isoformat()
        result["cache_hit"] = False
    return result
