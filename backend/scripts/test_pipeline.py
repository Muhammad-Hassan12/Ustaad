import asyncio
from tools.cv_parser import extract_cv_text
from agents.profile_agent import run_profile_agent
from agents.market_agent import run_market_agent
from db.supabase_client import create_session, mark_agent_complete

async def test():
    # Load a test PDF
    with open("test_cv.pdf", "rb") as f:
        cv_bytes = f.read()

    cv_text = extract_cv_text(cv_bytes)
    print("CV extracted:", len(cv_text), "chars")

    # Create session
    session_id = await create_session("ML Engineer", "Karachi", cv_text)
    print("Session created:", session_id)

    # Run Agent 1
    print("Running Agent 1 (Profile)...")
    profile = await run_profile_agent(cv_text, "ML Engineer", "Karachi", 1.0, "Bachelor's")
    await mark_agent_complete(session_id, "profile", profile)
    print("Profile agent done. Candidate Name:", profile["name"])

    # Run Agent 2
    print("Running Agent 2 (Market)...")
    market = await run_market_agent("ML Engineer", "Karachi")
    await mark_agent_complete(session_id, "market", market)
    print("Market agent done. Top skills:", market["top_required_skills"][:3])
    print("Sequential execution completed successfully!")

if __name__ == "__main__":
    asyncio.run(test())
