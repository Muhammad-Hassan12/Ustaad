import asyncio
from datetime import datetime
import httpx
import os
from dotenv import load_dotenv

load_dotenv()


async def _run_single_serper_query(
    client: httpx.AsyncClient,
    api_key: str,
    query: str,
    num_results: int = 10,
) -> dict:
    """Execute one geo-targeted Serper.dev search query using a shared AsyncClient."""
    try:
        response = await client.post(
            "https://google.serper.dev/search",
            headers={
                "X-API-KEY": api_key,
                "Content-Type": "application/json",
            },
            json={"q": query, "gl": "pk", "hl": "en", "num": num_results},
        )
        response.raise_for_status()
        data = response.json()
        return {"query": query, "results": data.get("organic", [])}
    except Exception as e:
        return {"query": query, "error": str(e)}


async def search_jobs(query: str, num_results: int = 10) -> dict:
    """Run a single search query via Serper.dev and return raw JSON response."""
    api_key = os.getenv("SERPER_API_KEY", "")
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            "https://google.serper.dev/search",
            headers={
                "X-API-KEY": api_key,
                "Content-Type": "application/json",
            },
            json={"q": query, "gl": "pk", "hl": "en", "num": num_results},
        )
        response.raise_for_status()
        return response.json()


async def search_pakistan_job_market(target_role: str, target_city: str) -> list[dict]:
    """Run 4 targeted searches concurrently for Pakistani job market intelligence."""
    year = datetime.now().year
    queries = [
        f"{target_role} jobs {target_city} Pakistan",
        f"{target_role} required skills Pakistan {year}",
        f"{target_role} salary Pakistan PKR",
        f"top companies hiring {target_role} Pakistan",
    ]
    api_key = os.getenv("SERPER_API_KEY", "")
    if not api_key:
        return [{"query": q, "error": "SERPER_API_KEY not configured"} for q in queries]

    async with httpx.AsyncClient(timeout=15.0) as client:
        results = await asyncio.gather(
            *(_run_single_serper_query(client, api_key, q) for q in queries)
        )
    return list(results)
