import asyncio
import logging
from typing import Optional
from agents.cv_rewrite_agent import run_cv_rewrite_agent
from agents.gap_agent import run_gap_agent
from agents.llm import LLMConfig, redact_secrets, resolve_llm_config_from_values
from agents.market_agent import run_market_agent
from agents.profile_agent import run_profile_agent
from agents.roadmap_agent import run_roadmap_agent
from db.supabase_client import mark_agent_complete, release_session_lock, update_session
import settings
from tools.proof_of_work import run_proof_of_work_audit

logger = logging.getLogger("ustaad.agents")


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
    github_username: Optional[str] = None,
    portfolio_url: Optional[str] = None,
    pow_source: str = "cv_extracted",
    preloaded_market_data: Optional[dict] = None,
    baseline_session_id: Optional[str] = None,
    baseline_snapshot: Optional[dict] = None,
):
    """
    Full DAG pipeline orchestrator:
      Stage 1 (Parallel): A1 Profile Agent || A2 Market Intelligence Agent || Proof-of-Work Inspector
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
        if preloaded_market_data:
            await emit("agent_start", "market", "Reusing verified Pakistani market data from baseline session (0 Serper calls)...")
            data = dict(preloaded_market_data)
            await mark_agent_complete(session_id, "market", data)
            await emit("agent_complete", "market", f"Market data ready. Demand: {data.get('market_demand_level', 'N/A')}")
            return data

        await emit("agent_start", "market", f"Scanning Pakistani job market for {target_role} in {target_city}...")
        data = await run_market_agent(target_role, target_city, llm_config=cfg)
        await mark_agent_complete(session_id, "market", data)
        await emit("agent_complete", "market", f"Market data ready. Demand: {data.get('market_demand_level', 'N/A')}")
        return data

    async def _stage_proof_of_work() -> Optional[dict]:
        clean_gh = (github_username or "").strip() or None
        clean_port = (portfolio_url or "").strip() or None
        if not clean_gh and not clean_port:
            return None
        try:
            await emit("agent_start", "pow", "Auditing GitHub & portfolio proof-of-work...")
            pow_data = await run_proof_of_work_audit(clean_gh, clean_port, source=pow_source)
            if pow_data:
                await emit("agent_complete", "pow", "Proof-of-work audit complete")
            return pow_data
        except Exception as e:
            logger.warning("Proof-of-work audit failed for session %s: %s", session_id, e)
            return None

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

    async def _run_dag():
        # Stage 1: Run Profile + Market + Proof-of-Work in parallel with sibling cancellation on error
        t1 = asyncio.create_task(_stage_profile())
        t2 = asyncio.create_task(_stage_market())
        t3 = asyncio.create_task(_stage_proof_of_work())
        try:
            profile_data, market_data, pow_data = await asyncio.gather(t1, t2, t3)
        except Exception:
            for task in (t1, t2, t3):
                if not task.done():
                    task.cancel()
            await asyncio.gather(t1, t2, t3, return_exceptions=True)
            raise

        # Preserve model provenance cleanly inside profile_data metadata (non-sensitive)
        if isinstance(profile_data, dict):
            profile_data["analyzed_with"] = {
                "provider": cfg.provider,
                "model": cfg.model,
                "mode": "byok" if cfg.is_byok else "server_default",
            }
            if job_description and job_description.strip():
                profile_data["has_target_jd"] = True
                profile_data["target_job_description"] = job_description.strip()[:8000]
            if pow_data:
                profile_data["proof_of_work"] = pow_data
            await update_session(session_id, {"profile_data": profile_data})

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

        # Stage 3: Run Roadmap + CV Rewrite in parallel with sibling cancellation on error
        t_road = asyncio.create_task(_stage_roadmap(gap_data))
        t_cv = asyncio.create_task(_stage_cv_rewrite(profile_data, market_data, gap_data))
        try:
            roadmap_data, cv_rewrite_data = await asyncio.gather(t_road, t_cv)
        except Exception:
            for task in (t_road, t_cv):
                if not task.done():
                    task.cancel()
            await asyncio.gather(t_road, t_cv, return_exceptions=True)
            raise

        # Compute re-audit score delta if baseline session was provided (0 Serper calls)
        if baseline_snapshot or baseline_session_id:
            baseline_gap = (baseline_snapshot or {}).get("gap_data") or {}
            baseline_cv = (baseline_snapshot or {}).get("cv_rewrite_data") or {}
            prev_readiness = baseline_gap.get("overall_readiness_score")
            new_readiness = gap_data.get("overall_readiness_score")
            prev_ats = baseline_cv.get("ats_score_estimate")
            new_ats = cv_rewrite_data.get("ats_score_estimate")

            readiness_delta = None
            if prev_readiness is not None and new_readiness is not None:
                try:
                    readiness_delta = round(float(new_readiness) - float(prev_readiness), 1)
                except Exception:
                    pass

            ats_delta = None
            if prev_ats is not None and new_ats is not None:
                try:
                    ats_delta = round(float(new_ats) - float(prev_ats), 1)
                except Exception:
                    pass

            prev_gaps = []
            for g in (baseline_gap.get("critical_gaps") or []):
                if isinstance(g, dict):
                    prev_gaps.append(g.get("skill") or "")
                elif isinstance(g, str):
                    prev_gaps.append(g)

            new_gaps_text = " ".join([
                (g.get("skill") or "") if isinstance(g, dict) else str(g)
                for g in (gap_data.get("critical_gaps") or [])
            ]).lower()

            resolved_gaps = [
                g for g in prev_gaps if g and g.lower() not in new_gaps_text
            ]

            profile_data["reaudit_delta"] = {
                "baseline_session_id": baseline_session_id,
                "previous_readiness_score": prev_readiness,
                "new_readiness_score": new_readiness,
                "readiness_delta": readiness_delta,
                "previous_ats_score": prev_ats,
                "new_ats_score": new_ats,
                "ats_delta": ats_delta,
                "resolved_gaps": resolved_gaps,
            }

        # Persist enriched profile_data metadata & mark session complete
        await update_session(session_id, {"profile_data": profile_data, "status": "complete"})
        await emit("pipeline_complete", "orchestrator", "Your Career Dossier is ready!")

    try:
        await asyncio.wait_for(_run_dag(), timeout=settings.pipeline_timeout_seconds())
    except asyncio.TimeoutError:
        safe_err = f"Pipeline execution timed out after {settings.pipeline_timeout_seconds()} seconds."
        try:
            await update_session(session_id, {"status": "error", "error_message": safe_err})
        except Exception:
            pass
        await emit("error", "orchestrator", safe_err)
    except Exception as e:
        safe_err = redact_secrets(str(e), cfg.api_key)
        try:
            await update_session(session_id, {"status": "error", "error_message": safe_err})
        except Exception:
            pass
        await emit("error", "orchestrator", f"Pipeline error: {safe_err}")
    finally:
        release_session_lock(session_id)
        await status_queue.put(None)  # Sentinel to close SSE stream
