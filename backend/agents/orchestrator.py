import asyncio
import json
from typing import AsyncGenerator
from agents.profile_agent import run_profile_agent
from agents.market_agent import run_market_agent
from agents.gap_agent import run_gap_agent
from agents.roadmap_agent import run_roadmap_agent
from agents.cv_rewrite_agent import run_cv_rewrite_agent
from db.supabase_client import mark_agent_complete, update_session

async def run_pipeline(
    session_id: str,
    cv_text: str,
    target_role: str,
    target_city: str,
    experience_years: float,
    education_level: str,
    status_queue: asyncio.Queue,
    api_key: str = None,
):
    """
    Full pipeline orchestrator. Puts SSE-compatible status dicts into status_queue.
    api_key: optional user-supplied Gemini API key (BYOK). Falls back to server
             GEMINI_API_KEY env var when None.
    """
    async def emit(event: str, agent: str, message: str):
        await status_queue.put({
            "event": event,
            "agent": agent,
            "message": message
        })

    try:
        # Agent 1: Profile
        await emit("agent_start", "profile", "Parsing your CV...")
        profile_data = await run_profile_agent(cv_text, target_role, target_city, experience_years, education_level, api_key=api_key)
        await mark_agent_complete(session_id, "profile", profile_data)
        await emit("agent_complete", "profile", f"Profile built for {profile_data.get('name', 'candidate')}")

        # Agent 2: Market
        await emit("agent_start", "market", f"Scanning Pakistani job boards for {target_role} in {target_city}...")
        market_data = await run_market_agent(target_role, target_city, api_key=api_key)
        await mark_agent_complete(session_id, "market", market_data)
        await emit("agent_complete", "market", f"Found market data. Demand: {market_data.get('market_demand_level', 'N/A')}")

        # Agent 3: Gap Analysis
        await emit("agent_start", "gap", "Analyzing skill gaps against market requirements...")
        gap_data = await run_gap_agent(profile_data, market_data, api_key=api_key)
        await mark_agent_complete(session_id, "gap", gap_data)
        await emit("agent_complete", "gap", f"Readiness score: {gap_data.get('overall_readiness_score', '?')}/100")

        # Agents 4 + 5: Parallel
        await emit("agent_start", "roadmap", "Building your 30/60/90-day learning roadmap...")
        await emit("agent_start", "cv_rewrite", "Rewriting your CV for ATS optimization...")

        roadmap_data, cv_rewrite_data = await asyncio.gather(
            run_roadmap_agent(gap_data, api_key=api_key),
            run_cv_rewrite_agent(profile_data, market_data, gap_data, api_key=api_key)
        )

        await mark_agent_complete(session_id, "roadmap", roadmap_data)
        await mark_agent_complete(session_id, "cv_rewrite", cv_rewrite_data)

        await emit("agent_complete", "roadmap", "Learning roadmap ready")
        await emit("agent_complete", "cv_rewrite", f"CV rewritten. ATS score: {cv_rewrite_data.get('ats_score_estimate', '?')}/100")

        # Mark pipeline complete
        await update_session(session_id, {"status": "complete"})
        await emit("pipeline_complete", "orchestrator", "Your Career Dossier is ready!")

    except Exception as e:
        await update_session(session_id, {"status": "error", "error_message": str(e)})
        await emit("error", "orchestrator", f"Pipeline error: {str(e)}")

    finally:
        await status_queue.put(None)  # Sentinel to close SSE stream
