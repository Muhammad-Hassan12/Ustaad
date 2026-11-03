import asyncio
from typing import Optional
from agents.cv_rewrite_agent import run_cv_rewrite_agent
from agents.gap_agent import run_gap_agent
from agents.llm import LLMConfig, redact_secrets, resolve_llm_config_from_values
from agents.market_agent import run_market_agent
from agents.profile_agent import run_profile_agent
from agents.roadmap_agent import run_roadmap_agent
from db.supabase_client import mark_agent_complete, release_session_lock, update_session


async def run_pipeline(
    session_id: str,
    cv_text: str,
    target_role: str,
    target_city: str,
    experience_years: float,
    education_level: str,
    status_queue: asyncio.Queue,
    api_key: Optional[str] = None,
    llm_config: Optional[LLMConfig] = None,
    job_description: Optional[str] = None,
):
    """
    Full DAG pipeline orchestrator:
      Stage 1 (Parallel): A1 Profile Agent || A2 Market Intelligence Agent
      Stage 2 (Sequential): A3 Gap Analysis Agent
      Stage 3 (Parallel): A4 Learning Roadmap Agent || A5 ATS CV Rewrite Agent
    """
    cfg = llm_config or resolve_llm_config_from_values(x_gemini_api_key=api_key)

    async def emit(event: str, agent: str, message: str):
        await status_queue.put({
            "event": event,
            "agent": agent,
            "message": message,
        })

    async def _stage_profile() -> dict:
        await emit("agent_start", "profile", f"Parsing your CV ({cfg.short_label})...")
        data = await run_profile_agent(
            cv_text,
            target_role,
            target_city,
            experience_years,
            education_level,
            llm_config=cfg,
        )
        await mark_agent_complete(session_id, "profile", data)
        await emit("agent_complete", "profile", f"Profile built for {data.get('name') or 'candidate'}")
        return data

    async def _stage_market() -> dict:
        await emit("agent_start", "market", f"Scanning Pakistani job market for {target_role} in {target_city}...")
        data = await run_market_agent(target_role, target_city, llm_config=cfg)
        await mark_agent_complete(session_id, "market", data)
        await emit("agent_complete", "market", f"Market data ready. Demand: {data.get('market_demand_level', 'N/A')}")
        return data

    async def _stage_roadmap(gap_data: dict) -> dict:
        await emit("agent_start", "roadmap", "Building your 30/60/90-day learning roadmap...")
        data = await run_roadmap_agent(gap_data, llm_config=cfg)
        await mark_agent_complete(session_id, "roadmap", data)
        await emit("agent_complete", "roadmap", "Learning roadmap ready")
        return data

    async def _stage_cv_rewrite(profile_data: dict, market_data: dict, gap_data: dict) -> dict:
        await emit("agent_start", "cv_rewrite", "Rewriting your CV for ATS optimization...")
        data = await run_cv_rewrite_agent(
            profile_data,
            market_data,
            gap_data,
            llm_config=cfg,
            job_description=job_description,
        )
        await mark_agent_complete(session_id, "cv_rewrite", data)
        await emit("agent_complete", "cv_rewrite", f"CV rewritten. ATS score: {data.get('ats_score_estimate', '?')}/100")
        return data

    try:
        # Stage 1: Run Profile + Market in parallel (zero data dependency between A1 and A2)
        profile_data, market_data = await asyncio.gather(
            _stage_profile(),
            _stage_market(),
        )

        # Preserve model provenance cleanly inside profile_data metadata (non-sensitive)
        if isinstance(profile_data, dict):
            profile_data["analyzed_with"] = {
                "provider": cfg.provider,
                "model": cfg.model,
                "mode": "byok" if cfg.is_byok else "server_default",
            }
            if job_description and job_description.strip():
                profile_data["has_target_jd"] = True

        # Stage 2: Gap Analysis (depends on Profile + Market)
        await emit("agent_start", "gap", "Analyzing skill gaps against market requirements...")
        gap_data = await run_gap_agent(
            profile_data,
            market_data,
            llm_config=cfg,
            job_description=job_description,
        )
        await mark_agent_complete(session_id, "gap", gap_data)
        await emit("agent_complete", "gap", f"Readiness score: {gap_data.get('overall_readiness_score', '?')}/100")

        # Stage 3: Run Roadmap + CV Rewrite in parallel
        await asyncio.gather(
            _stage_roadmap(gap_data),
            _stage_cv_rewrite(profile_data, market_data, gap_data),
        )

        # Persist enriched profile_data metadata & mark session complete
        await update_session(session_id, {"profile_data": profile_data, "status": "complete"})
        await emit("pipeline_complete", "orchestrator", "Your Career Dossier is ready!")

    except Exception as e:
        safe_err = redact_secrets(str(e), cfg.api_key)
        await update_session(session_id, {"status": "error", "error_message": safe_err})
        await emit("error", "orchestrator", f"Pipeline error: {safe_err}")

    finally:
        release_session_lock(session_id)
        await status_queue.put(None)  # Sentinel to close SSE stream
