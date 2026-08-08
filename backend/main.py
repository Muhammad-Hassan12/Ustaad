from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(title="Ustaad API", version="1.0.0")

origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
for port in ["3000", "3001", "3002"]:
    dev_url = f"http://localhost:{port}"
    if dev_url not in origins:
        origins.append(dev_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok", "service": "ustaad-backend"}

from routers.pipeline import router as pipeline_router
from routers.interview import router as interview_router
from routers.export import router as export_router
from routers.keys import router as keys_router

app.include_router(pipeline_router)
app.include_router(interview_router)
app.include_router(export_router)
app.include_router(keys_router)


