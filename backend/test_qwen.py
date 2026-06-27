import asyncio
import json
import os
from agents.gemini_utils import call_kaggle_qwen

async def main():
    system = "Extract the candidate name and location. Return ONLY valid JSON: {\"name\": \"John Doe\", \"location\": \"New York\"}."
    user = "CV TEXT:\nSyed Muhammad Hassan\nAI / GenAI Developer\n📍 Karachi, PK"
    res = await call_kaggle_qwen(system, user)
    print("Raw Response:", repr(res))
    
if __name__ == "__main__":
    asyncio.run(main())
