import httpx
import os
from dotenv import load_dotenv

load_dotenv()
SERPER_API_KEY = os.getenv("SERPER_API_KEY")

async def search_jobs(query: str, num_results: int = 10) -> dict:
    """Run a single search query via Serper.dev and return results."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            "https://google.serper.dev/search",
            headers={
                "X-API-KEY": SERPER_API_KEY,
                "Content-Type": "application/json"
            },
            json={"q": query, "gl": "pk", "hl": "en", "num": num_results}
        )
        response.raise_for_status()
        return response.json()

async def search_pakistan_job_market(target_role: str, target_city: str) -> list[dict]:
    """Run 4 targeted searches for Pakistani job market intelligence."""
    queries = [
        f"{target_role} jobs {target_city} Pakistan",
        f"{target_role} required skills Pakistan 2026",
        f"{target_role} salary Pakistan PKR",
        f"top companies hiring {target_role} Pakistan"
    ]
    results = []
    for query in queries:
        try:
            data = await search_jobs(query)
            results.append({"query": query, "results": data.get("organic", [])})
        except Exception as e:
            results.append({"query": query, "error": str(e)})
    return results
