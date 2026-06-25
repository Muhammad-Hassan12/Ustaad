# Ustaad (اُستاد) — AI Career OS for Pakistani Tech Talent
### Kaggle × Google: 5-Day AI Agents Vibe Coding Capstone Project
### Phases-Wise Implementation Plan for Agentic Execution

---

## 🧠 READ THIS FIRST — Agent Instructions

This document is structured into **7 sequential phases**. Each phase must be completed fully before moving to the next. Every phase contains:
- **What to build** — exact files, code, and logic
- **What to verify** — test before proceeding
- **What NOT to do** — common mistakes to avoid
- **Phase complete signal** — how you know the phase is done

Do not skip phases. Do not build ahead. Each phase's output is the input to the next phase.

---

## 📋 Project Overview

**Project Name:** Ustaad (اُستاد)
**Tagline:** Your AI-powered Career OS — built for Pakistani tech graduates
**Team:** Hassan (Backend/Agents) + Abdul Mannan (Frontend/UI)
**Submission Deadline:** July 6, 2026 — 11:59 PM PT

**What it does in one paragraph:**
A Pakistani CS/IT graduate uploads their CV (PDF) and enters their target job role and city. Ustaad runs a 7-agent AI pipeline powered by Gemini 2.5 Flash that: parses the CV, researches the Pakistani job market in real-time via Serper.dev, identifies skill gaps, builds a 30/60/90-day personalized learning roadmap, rewrites the CV for ATS optimization, and runs a multi-turn mock interview with scored feedback. The final output is a downloadable Career Dossier PDF + an interactive web dashboard.

---

## 🏗️ Full System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      NEXT.JS FRONTEND                           │
│                                                                 │
│   [Landing Page]  →  [Dashboard /session]  →  [Interview]      │
│                              ↓                                  │
│                       [Dossier /export]                         │
└──────────────────────────┬──────────────────────────────────────┘
                           │ REST + SSE
┌──────────────────────────▼──────────────────────────────────────┐
│                      FASTAPI BACKEND                            │
│                                                                 │
│   /api/pipeline/start     → triggers full pipeline             │
│   /api/pipeline/status    → SSE stream of live agent status    │
│   /api/pipeline/results   → returns full session JSON          │
│   /api/interview/start    → generates interview questions      │
│   /api/interview/answer   → multi-turn answer evaluation       │
│   /api/interview/summary  → final interview score              │
│   /api/export/dossier     → generates + returns PDF            │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  ORCHESTRATOR                            │  │
│  │   asyncio-based supervisor — coordinates all agents      │  │
│  └──┬──────────┬──────────┬───────────────┬────────────────┘  │
│     │          │          │               │                    │
│  [A1:        [A2:       [A3:          [A4: Roadmap]           │
│  Profile]   Market]    Gap]          [A5: CV Rewrite]         │
│                                      (parallel)               │
│                                          │                    │
│                                      [A6: Interview]          │
│                                      (on-demand)              │
│                                          │                    │
│                                      [PDF Export]             │
│                                                                 │
│  ┌─────────────┐   ┌──────────────┐   ┌───────────────┐      │
│  │  Supabase   │   │  Serper.dev  │   │  Gemini 2.5   │      │
│  │  (sessions) │   │  (job data)  │   │  Flash (LLM)  │      │
│  └─────────────┘   └──────────────┘   └───────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

**Agent Execution Order:**
```
A1 (Profile) → A2 (Market) → A3 (Gap) → [A4 (Roadmap) + A5 (CV)] parallel → A6 (Interview, on-demand) → PDF Export
```

---

## 📁 Complete Folder Structure

```
ustaad/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── .env
│   ├── .gitignore
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── orchestrator.py
│   │   ├── profile_agent.py
│   │   ├── market_agent.py
│   │   ├── gap_agent.py
│   │   ├── roadmap_agent.py
│   │   ├── cv_rewrite_agent.py
│   │   ├── interview_agent.py
│   │   └── prompts/
│   │       ├── __init__.py
│   │       ├── profile_prompt.py
│   │       ├── market_prompt.py
│   │       ├── gap_prompt.py
│   │       ├── roadmap_prompt.py
│   │       ├── cv_rewrite_prompt.py
│   │       └── interview_prompt.py
│   ├── tools/
│   │   ├── __init__.py
│   │   ├── cv_parser.py
│   │   ├── job_scraper.py
│   │   └── pdf_generator.py
│   ├── db/
│   │   ├── __init__.py
│   │   ├── supabase_client.py
│   │   └── schemas.sql
│   └── routers/
│       ├── __init__.py
│       ├── pipeline.py
│       ├── interview.py
│       └── export.py
│
└── frontend/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx
    │   ├── globals.css
    │   ├── dashboard/
    │   │   └── [sessionId]/
    │   │       └── page.tsx
    │   ├── interview/
    │   │   └── [sessionId]/
    │   │       └── page.tsx
    │   └── dossier/
    │       └── [sessionId]/
    │           └── page.tsx
    ├── components/
    │   ├── CVUpload.tsx
    │   ├── JobRoleForm.tsx
    │   ├── PipelineProgress.tsx
    │   ├── MarketSnapshot.tsx
    │   ├── GapReport.tsx
    │   ├── RoadmapTimeline.tsx
    │   ├── CVComparison.tsx
    │   ├── InterviewChat.tsx
    │   └── DossierExport.tsx
    ├── lib/
    │   ├── api.ts
    │   └── sse.ts
    ├── public/
    │   └── ustaad-logo.svg
    ├── package.json
    ├── tailwind.config.ts
    ├── tsconfig.json
    └── .env.local
```

---

## 🔑 Environment Variables Reference

### Backend `.env`
```
GEMINI_API_KEY=your_gemini_api_key_here
SERPER_API_KEY=your_serper_api_key_here
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
CORS_ORIGINS=http://localhost:3000,https://ustaad.vercel.app
```

### Frontend `.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 🗄️ Supabase Schema Reference

```sql
-- Run this in Supabase SQL Editor before starting Phase 3

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending',

  -- User inputs
  candidate_name TEXT,
  target_role TEXT,
  target_city TEXT,
  cv_text TEXT,

  -- Agent outputs
  profile_data JSONB,
  market_data JSONB,
  gap_data JSONB,
  roadmap_data JSONB,
  cv_rewrite_data JSONB,

  -- Pipeline tracking
  agents_completed TEXT[] DEFAULT '{}',
  current_agent TEXT,
  error_message TEXT
);

CREATE TABLE interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  questions JSONB,
  current_question_index INT DEFAULT 0,
  answers JSONB DEFAULT '[]',
  scores JSONB DEFAULT '[]',
  final_score FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON sessions FOR ALL USING (true);
CREATE POLICY "Allow all" ON interview_sessions FOR ALL USING (true);
```

---

## 📦 Dependencies Reference

### `backend/requirements.txt`
```
fastapi==0.115.0
uvicorn==0.30.0
python-multipart==0.0.9
pymupdf==1.24.0
httpx==0.27.0
google-generativeai==0.8.0
supabase==2.7.0
python-dotenv==1.0.0
reportlab==4.2.0
```

### Frontend `package.json` (key dependencies)
```json
{
  "dependencies": {
    "next": "14.2.0",
    "react": "^18",
    "react-dom": "^18",
    "typescript": "^5",
    "tailwindcss": "^3",
    "@supabase/supabase-js": "^2",
    "react-dropzone": "^14",
    "framer-motion": "^11",
    "lucide-react": "^0.383.0",
    "react-markdown": "^9"
  }
}
```

---

## ⚠️ Universal Gotchas (Read Before Every Phase)

**1. Gemini JSON parsing — always strip fences:**
```python
import json, re
def parse_gemini_json(text: str) -> dict:
    clean = re.sub(r'```json|```', '', text).strip()
    return json.loads(clean)
```

**2. Gemini rate limit — always use exponential backoff:**
```python
async def call_gemini_with_retry(model, prompt: str, max_retries: int = 5) -> str:
    for attempt in range(max_retries):
        try:
            response = await model.generate_content_async(prompt)
            return response.text
        except Exception as e:
            if "429" in str(e) or "quota" in str(e).lower():
                wait = 2 ** attempt
                await asyncio.sleep(wait)
            else:
                raise e
    raise Exception("Gemini max retries exceeded")
```

**3. Never commit `.env` or `.env.local` — add both to `.gitignore`**

**4. All Gemini prompts must end with: `Return ONLY valid JSON. No preamble, no markdown fences.`**

**5. All agent functions must be `async def` — never blocking sync calls**

---

---

# PHASE 1 — Project Scaffold & Infrastructure

**Goal:** Both backend and frontend repos initialized, dependencies installed, environment configured, Supabase tables created, and a working health check endpoint. No agents yet.

**Owner:** Hassan (backend) + Abdul Mannan (frontend) in parallel.

---

## Phase 1A — Backend Scaffold (Hassan)

### Step 1: Initialize project
```bash
mkdir ustaad && cd ustaad
mkdir backend && cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

### Step 2: Create `requirements.txt`
```
fastapi==0.115.0
uvicorn==0.30.0
python-multipart==0.0.9
pymupdf==1.24.0
httpx==0.27.0
google-generativeai==0.8.0
supabase==2.7.0
python-dotenv==1.0.0
reportlab==4.2.0
```
```bash
pip install -r requirements.txt
```

### Step 3: Create folder structure
```bash
mkdir -p agents/prompts tools db routers
touch agents/__init__.py agents/prompts/__init__.py
touch tools/__init__.py db/__init__.py routers/__init__.py
touch .env .gitignore
```

### Step 4: Create `.gitignore`
```
venv/
__pycache__/
*.pyc
.env
*.egg-info/
dist/
```

### Step 5: Populate `.env`
```
GEMINI_API_KEY=your_key_here
SERPER_API_KEY=your_key_here
SUPABASE_URL=your_url_here
SUPABASE_SERVICE_KEY=your_key_here
CORS_ORIGINS=http://localhost:3000
```

### Step 6: Create `db/supabase_client.py`
```python
from supabase import create_client, Client
from dotenv import load_dotenv
import os

load_dotenv()

supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)
```

### Step 7: Create `main.py`
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(title="Ustaad API", version="1.0.0")

origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

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

# Routers will be registered here in later phases
```

### Step 8: Run and verify
```bash
uvicorn main:app --reload --port 8000
```
Visit `http://localhost:8000/health` → must return `{"status": "ok", "service": "ustaad-backend"}`

### Step 9: Set up Supabase tables
- Go to your Supabase project → SQL Editor
- Run the full SQL from the **Supabase Schema Reference** section above
- Verify both tables appear in the Table Editor

---

## Phase 1B — Frontend Scaffold (Abdul Mannan)

### Step 1: Initialize Next.js
```bash
cd ustaad
npx create-next-app@14 frontend --typescript --tailwind --eslint --app --src-dir=false
cd frontend
```

### Step 2: Install additional dependencies
```bash
npm install @supabase/supabase-js react-dropzone framer-motion lucide-react react-markdown
```

### Step 3: Create `.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=your_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### Step 4: Create `lib/api.ts`
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function startPipeline(formData: FormData) {
  const res = await fetch(`${API_URL}/api/pipeline/start`, {
    method: "POST",
    body: formData,
  });
  return res.json();
}

export async function getPipelineResults(sessionId: string) {
  const res = await fetch(`${API_URL}/api/pipeline/results/${sessionId}`);
  return res.json();
}

export async function startInterview(sessionId: string) {
  const res = await fetch(`${API_URL}/api/interview/start/${sessionId}`, {
    method: "POST",
  });
  return res.json();
}

export async function submitAnswer(payload: {
  session_id: string;
  interview_id: string;
  question_id: string;
  answer: string;
}) {
  const res = await fetch(`${API_URL}/api/interview/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function getInterviewSummary(sessionId: string) {
  const res = await fetch(`${API_URL}/api/interview/summary/${sessionId}`);
  return res.json();
}

export function getDossierUrl(sessionId: string) {
  return `${API_URL}/api/export/dossier/${sessionId}`;
}
```

### Step 5: Create `lib/sse.ts`
```typescript
export function subscribeToPipeline(
  sessionId: string,
  onEvent: (data: PipelineEvent) => void,
  onDone: () => void
) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const es = new EventSource(`${API_URL}/api/pipeline/status/${sessionId}`);

  es.onmessage = (e) => {
    const data: PipelineEvent = JSON.parse(e.data);
    onEvent(data);
    if (data.event === "pipeline_complete" || data.event === "error") {
      es.close();
      onDone();
    }
  };

  es.onerror = () => {
    es.close();
    onDone();
  };

  return () => es.close(); // cleanup function
}

export interface PipelineEvent {
  event: "agent_start" | "agent_complete" | "pipeline_complete" | "error";
  agent?: string;
  message: string;
}
```

### Step 6: Create placeholder pages
Create empty placeholder files for all routes — they will be filled in later phases:
- `app/page.tsx` — placeholder "Landing"
- `app/dashboard/[sessionId]/page.tsx` — placeholder "Dashboard"
- `app/interview/[sessionId]/page.tsx` — placeholder "Interview"
- `app/dossier/[sessionId]/page.tsx` — placeholder "Dossier"

Each placeholder:
```tsx
export default function Page() {
  return <div className="p-8 text-2xl font-bold">Coming Soon</div>;
}
```

### Step 7: Run and verify
```bash
npm run dev
```
Visit `http://localhost:3000` → must render without errors.

---

## ✅ Phase 1 Complete When:
- [ ] `GET /health` returns `{"status": "ok"}` from FastAPI
- [ ] `npm run dev` runs without errors
- [ ] Supabase has both `sessions` and `interview_sessions` tables
- [ ] All placeholder pages render in browser
- [ ] `.env` and `.env.local` populated with real keys
- [ ] `.gitignore` excludes `.env` files

---

---

# PHASE 2 — CV Parser + Profile Agent (Agent 1)

**Goal:** User can upload a PDF CV. Backend extracts text and Gemini returns a structured candidate profile JSON. No pipeline, no database yet — just the parser and one agent working end-to-end.

**Owner:** Hassan

---

## Step 1: Create `tools/cv_parser.py`
```python
import fitz  # PyMuPDF

def extract_cv_text(pdf_bytes: bytes) -> str:
    """Extract all text from a PDF CV given its raw bytes."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    full_text = ""
    for page in doc:
        full_text += page.get_text()
    doc.close()
    return full_text.strip()
```

## Step 2: Create `agents/prompts/profile_prompt.py`
```python
PROFILE_SYSTEM_PROMPT = """
You are an expert career profiler specializing in Pakistani tech talent.

Given a CV text and user-provided metadata, extract a complete structured candidate profile.

Rules:
- Only extract what is EXPLICITLY stated in the CV. Do not infer or assume.
- If a field is missing from the CV, set it to null.
- For skills, extract every technical skill mentioned anywhere in the CV.
- For projects, extract every project mentioned with its technologies.

Return ONLY valid JSON matching exactly this schema. No preamble, no markdown fences.
"""

PROFILE_USER_TEMPLATE = """
CV TEXT:
{cv_text}

USER PROVIDED:
- Target Role: {target_role}
- Target City: {target_city}
- Years of Experience: {experience_years}
- Education Level: {education_level}

Extract the candidate profile. Return ONLY valid JSON:
{{
  "name": "string or null",
  "education": {{
    "degree": "string or null",
    "field": "string or null",
    "university": "string or null",
    "graduation_year": "int or null"
  }},
  "experience_years": "float",
  "current_skills": ["skill1", "skill2"],
  "projects": [
    {{
      "name": "string",
      "description": "string",
      "technologies": ["string"]
    }}
  ],
  "certifications": ["string"],
  "target_role": "string",
  "target_city": "string",
  "cv_summary_original": "string or null",
  "weaknesses_detected": ["string"]
}}
"""
```

## Step 3: Create `agents/profile_agent.py`
```python
import google.generativeai as genai
import asyncio
import json
import re
import os
from dotenv import load_dotenv
from agents.prompts.profile_prompt import PROFILE_SYSTEM_PROMPT, PROFILE_USER_TEMPLATE

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def parse_gemini_json(text: str) -> dict:
    clean = re.sub(r'```json|```', '', text).strip()
    return json.loads(clean)

async def call_gemini_with_retry(model, prompt: str, max_retries: int = 5) -> str:
    for attempt in range(max_retries):
        try:
            response = await model.generate_content_async(prompt)
            return response.text
        except Exception as e:
            if "429" in str(e) or "quota" in str(e).lower():
                wait = 2 ** attempt
                await asyncio.sleep(wait)
            else:
                raise e
    raise Exception("Gemini max retries exceeded")

async def run_profile_agent(
    cv_text: str,
    target_role: str,
    target_city: str,
    experience_years: float,
    education_level: str
) -> dict:
    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        system_instruction=PROFILE_SYSTEM_PROMPT
    )

    prompt = PROFILE_USER_TEMPLATE.format(
        cv_text=cv_text,
        target_role=target_role,
        target_city=target_city,
        experience_years=experience_years,
        education_level=education_level
    )

    raw = await call_gemini_with_retry(model, prompt)
    return parse_gemini_json(raw)
```

## Step 4: Create `routers/pipeline.py` (partial — just start endpoint for now)
```python
from fastapi import APIRouter, UploadFile, File, Form
from tools.cv_parser import extract_cv_text
from agents.profile_agent import run_profile_agent

router = APIRouter(prefix="/api/pipeline")

@router.post("/test-profile")
async def test_profile_agent(
    cv_file: UploadFile = File(...),
    target_role: str = Form(...),
    target_city: str = Form(...),
    experience_years: float = Form(0.0),
    education_level: str = Form("Bachelor's")
):
    cv_bytes = await cv_file.read()
    cv_text = extract_cv_text(cv_bytes)
    profile = await run_profile_agent(cv_text, target_role, target_city, experience_years, education_level)
    return {"profile": profile}
```

## Step 5: Register router in `main.py`
```python
# Add to main.py after existing imports:
from routers.pipeline import router as pipeline_router
app.include_router(pipeline_router)
```

## Step 6: Test
```bash
# Using curl with a real CV PDF
curl -X POST http://localhost:8000/api/pipeline/test-profile \
  -F "cv_file=@/path/to/test_cv.pdf" \
  -F "target_role=Machine Learning Engineer" \
  -F "target_city=Karachi" \
  -F "experience_years=1.0" \
  -F "education_level=Bachelor's"
```
Expected: Valid JSON with candidate profile. All fields present, nulls where data missing.

---

## ✅ Phase 2 Complete When:
- [ ] `extract_cv_text()` returns clean text from a PDF
- [ ] `run_profile_agent()` returns valid JSON matching the schema
- [ ] `/api/pipeline/test-profile` endpoint works via curl or Postman
- [ ] Gemini retry logic handles 429 without crashing
- [ ] JSON parsing handles Gemini responses with or without markdown fences

---

---

# PHASE 3 — Market Intelligence Agent (Agent 2) + Supabase Session Management

**Goal:** Agent 2 searches Pakistani job boards via Serper.dev and returns structured market data. Supabase session creation works. Both agents run sequentially (A1 → A2) with output stored in DB.

**Owner:** Hassan

---

## Step 1: Create `tools/job_scraper.py`
```python
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
```

## Step 2: Create `agents/prompts/market_prompt.py`
```python
MARKET_SYSTEM_PROMPT = """
You are a job market analyst specializing in Pakistan's tech industry.

You will receive raw search results from Pakistani job boards and Google searches.
Your task is to extract structured market intelligence for a specific role and city.

Be specific and realistic. Only report what the data actually shows.
Return ONLY valid JSON. No preamble, no markdown fences.
"""

MARKET_USER_TEMPLATE = """
TARGET ROLE: {target_role}
TARGET CITY: {target_city}

RAW SEARCH RESULTS:
{search_results}

Extract market intelligence. Return ONLY valid JSON:
{{
  "top_required_skills": ["skill1", "skill2"],
  "nice_to_have_skills": ["skill1"],
  "top_hiring_companies": ["Company A", "Company B"],
  "salary_range_pkr": {{"min": 80000, "max": 200000}},
  "remote_percentage": "string e.g. ~40%",
  "most_common_certifications": ["string"],
  "market_demand_level": "High or Medium or Low",
  "raw_job_listings": [
    {{
      "title": "string",
      "company": "string",
      "location": "string",
      "snippet": "string"
    }}
  ],
  "market_summary": "2-3 sentence human-readable summary of market conditions"
}}
"""
```

## Step 3: Create `agents/market_agent.py`
```python
import google.generativeai as genai
import asyncio
import json
import re
import os
from dotenv import load_dotenv
from tools.job_scraper import search_pakistan_job_market
from agents.prompts.market_prompt import MARKET_SYSTEM_PROMPT, MARKET_USER_TEMPLATE

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def parse_gemini_json(text: str) -> dict:
    clean = re.sub(r'```json|```', '', text).strip()
    return json.loads(clean)

async def call_gemini_with_retry(model, prompt: str, max_retries: int = 5) -> str:
    for attempt in range(max_retries):
        try:
            response = await model.generate_content_async(prompt)
            return response.text
        except Exception as e:
            if "429" in str(e) or "quota" in str(e).lower():
                await asyncio.sleep(2 ** attempt)
            else:
                raise e
    raise Exception("Gemini max retries exceeded")

async def run_market_agent(target_role: str, target_city: str) -> dict:
    # Step 1: Fetch real-time job data
    search_results = await search_pakistan_job_market(target_role, target_city)

    # Step 2: Pass to Gemini for structured extraction
    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        system_instruction=MARKET_SYSTEM_PROMPT
    )

    prompt = MARKET_USER_TEMPLATE.format(
        target_role=target_role,
        target_city=target_city,
        search_results=json.dumps(search_results, indent=2)
    )

    raw = await call_gemini_with_retry(model, prompt)
    return parse_gemini_json(raw)
```

## Step 4: Create `db/supabase_client.py` (expand)
```python
from supabase import create_client, Client
from dotenv import load_dotenv
import os
import json

load_dotenv()

supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)

async def create_session(target_role: str, target_city: str, cv_text: str) -> str:
    """Create a new pipeline session. Returns session_id (UUID string)."""
    result = supabase.table("sessions").insert({
        "target_role": target_role,
        "target_city": target_city,
        "cv_text": cv_text,
        "status": "running"
    }).execute()
    return result.data[0]["id"]

async def update_session(session_id: str, updates: dict):
    """Update any fields on a session row."""
    supabase.table("sessions").update(updates).eq("id", session_id).execute()

async def get_session(session_id: str) -> dict:
    """Fetch a full session row."""
    result = supabase.table("sessions").select("*").eq("id", session_id).execute()
    if result.data:
        return result.data[0]
    return {}

async def mark_agent_complete(session_id: str, agent_name: str, data: dict):
    """Store agent output and append agent name to completed list."""
    session = await get_session(session_id)
    completed = session.get("agents_completed", []) or []
    completed.append(agent_name)
    supabase.table("sessions").update({
        f"{agent_name}_data": data,
        "agents_completed": completed,
        "current_agent": agent_name
    }).eq("id", session_id).execute()
```

## Step 5: Test A1 → A2 sequential run (standalone script, not an endpoint yet)
Create `test_pipeline.py` in backend root:
```python
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
    profile = await run_profile_agent(cv_text, "ML Engineer", "Karachi", 1.0, "Bachelor's")
    await mark_agent_complete(session_id, "profile", profile)
    print("Profile agent done:", profile["name"])

    # Run Agent 2
    market = await run_market_agent("ML Engineer", "Karachi")
    await mark_agent_complete(session_id, "market", market)
    print("Market agent done. Top skills:", market["top_required_skills"][:3])

asyncio.run(test())
```
```bash
python test_pipeline.py
```

---

## ✅ Phase 3 Complete When:
- [ ] `search_pakistan_job_market()` returns results from Serper.dev
- [ ] `run_market_agent()` returns valid structured JSON
- [ ] `create_session()` creates a row in Supabase
- [ ] `mark_agent_complete()` stores agent output in Supabase
- [ ] `test_pipeline.py` runs A1 → A2 without errors
- [ ] Supabase Table Editor shows the session row with both `profile_data` and `market_data` populated

---

---

# PHASE 4 — Gap, Roadmap & CV Rewrite Agents (Agents 3, 4, 5) + Orchestrator

**Goal:** Agents 3, 4, and 5 built. Full orchestrator wired with parallel execution of A4+A5. Complete pipeline A1→A2→A3→[A4+A5] runs end-to-end with all outputs stored in Supabase.

**Owner:** Hassan

---

## Step 1: Create `agents/prompts/gap_prompt.py`
```python
GAP_SYSTEM_PROMPT = """
You are a senior technical recruiter in Pakistan's tech industry with 10 years of experience.

You will receive a candidate profile and real market requirements.
Perform an honest, detailed gap analysis. Be specific — this is meant to help, not flatter.

Return ONLY valid JSON. No preamble, no markdown fences.
"""

GAP_USER_TEMPLATE = """
CANDIDATE PROFILE:
{candidate_profile}

MARKET REQUIREMENTS:
{market_data}

Perform gap analysis. Return ONLY valid JSON:
{{
  "overall_readiness_score": 72,
  "critical_gaps": [
    {{
      "skill": "string",
      "priority": "Critical",
      "reason": "string — why this matters"
    }}
  ],
  "moderate_gaps": [
    {{
      "skill": "string",
      "priority": "Moderate",
      "reason": "string"
    }}
  ],
  "minor_gaps": [
    {{
      "skill": "string",
      "priority": "Minor",
      "reason": "string"
    }}
  ],
  "strengths_to_highlight": ["skill1", "skill2"],
  "portfolio_gaps": ["string — specific issues with portfolio/GitHub"],
  "certification_gaps": ["string — specific certifications to pursue"],
  "summary": "2-3 sentence honest assessment"
}}
"""
```

## Step 2: Create `agents/gap_agent.py`
```python
import google.generativeai as genai
import asyncio, json, re, os
from dotenv import load_dotenv
from agents.prompts.gap_prompt import GAP_SYSTEM_PROMPT, GAP_USER_TEMPLATE

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def parse_gemini_json(text: str) -> dict:
    clean = re.sub(r'```json|```', '', text).strip()
    return json.loads(clean)

async def call_gemini_with_retry(model, prompt: str, max_retries: int = 5) -> str:
    for attempt in range(max_retries):
        try:
            response = await model.generate_content_async(prompt)
            return response.text
        except Exception as e:
            if "429" in str(e) or "quota" in str(e).lower():
                await asyncio.sleep(2 ** attempt)
            else:
                raise e
    raise Exception("Gemini max retries exceeded")

async def run_gap_agent(profile_data: dict, market_data: dict) -> dict:
    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        system_instruction=GAP_SYSTEM_PROMPT
    )
    prompt = GAP_USER_TEMPLATE.format(
        candidate_profile=json.dumps(profile_data, indent=2),
        market_data=json.dumps(market_data, indent=2)
    )
    raw = await call_gemini_with_retry(model, prompt)
    return parse_gemini_json(raw)
```

## Step 3: Create `agents/prompts/roadmap_prompt.py`
```python
ROADMAP_SYSTEM_PROMPT = """
You are a senior engineering mentor and career coach specializing in the Pakistani tech job market.

Build a realistic, actionable 30/60/90-day learning roadmap based on a gap analysis.

Rules:
- ONLY recommend free resources: YouTube, Kaggle, freeCodeCamp, Google Codelabs, free Coursera audits
- Include specific resource names (e.g. "CS50P on edX", "Kaggle ML Course")
- Prioritize Critical gaps in the first 30 days
- Assume 1-2 hours of learning per weekday
- Include portfolio project ideas that directly address gaps
- Include quick wins — things doable in under 1 week

Return ONLY valid JSON. No preamble, no markdown fences.
"""

ROADMAP_USER_TEMPLATE = """
GAP ANALYSIS:
{gap_data}

Build the roadmap. Return ONLY valid JSON:
{{
  "thirty_day_plan": [
    {{
      "week": 1,
      "focus": "string",
      "tasks": [
        {{
          "task": "string",
          "resource": "string",
          "platform": "YouTube or Kaggle or freeCodeCamp or Google or Coursera",
          "estimated_hours": 4
        }}
      ]
    }}
  ],
  "sixty_day_plan": [ /* same structure */ ],
  "ninety_day_plan": [ /* same structure */ ],
  "quick_wins": [
    {{
      "action": "string",
      "impact": "High or Medium",
      "time_required": "string e.g. 2 hours"
    }}
  ],
  "portfolio_projects_to_build": [
    {{
      "project_name": "string",
      "description": "string",
      "skills_demonstrated": ["string"],
      "estimated_days": 5
    }}
  ]
}}
"""
```

## Step 4: Create `agents/roadmap_agent.py`
```python
import google.generativeai as genai
import asyncio, json, re, os
from dotenv import load_dotenv
from agents.prompts.roadmap_prompt import ROADMAP_SYSTEM_PROMPT, ROADMAP_USER_TEMPLATE

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def parse_gemini_json(text: str) -> dict:
    clean = re.sub(r'```json|```', '', text).strip()
    return json.loads(clean)

async def call_gemini_with_retry(model, prompt: str, max_retries: int = 5) -> str:
    for attempt in range(max_retries):
        try:
            response = await model.generate_content_async(prompt)
            return response.text
        except Exception as e:
            if "429" in str(e) or "quota" in str(e).lower():
                await asyncio.sleep(2 ** attempt)
            else:
                raise e
    raise Exception("Gemini max retries exceeded")

async def run_roadmap_agent(gap_data: dict) -> dict:
    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        system_instruction=ROADMAP_SYSTEM_PROMPT
    )
    prompt = ROADMAP_USER_TEMPLATE.format(gap_data=json.dumps(gap_data, indent=2))
    raw = await call_gemini_with_retry(model, prompt)
    return parse_gemini_json(raw)
```

## Step 5: Create `agents/prompts/cv_rewrite_prompt.py`
```python
CV_REWRITE_SYSTEM_PROMPT = """
You are an expert CV writer specializing in Pakistani tech industry applications and ATS optimization.

Rewrite the candidate's CV content to be stronger, more specific, and market-aligned.

Rules:
- Use strong action verbs: Built, Deployed, Reduced, Increased, Led, Designed, Implemented
- Add quantifiable metrics wherever possible (use "~" prefix for estimates)
- Incorporate market keywords naturally
- Summary must be 3 sentences max, role-specific
- For each rewrite, keep the original so the user can compare

Return ONLY valid JSON. No preamble, no markdown fences.
"""

CV_REWRITE_USER_TEMPLATE = """
ORIGINAL CANDIDATE PROFILE:
{candidate_profile}

MARKET KEYWORDS NEEDED:
{market_data}

GAP ANALYSIS:
{gap_data}

Rewrite CV content. Return ONLY valid JSON:
{{
  "rewritten_summary": "string — 3 sentences max",
  "rewritten_skills_section": ["skill1", "skill2"],
  "rewritten_experience_bullets": [
    {{
      "original": "string",
      "rewritten": "string"
    }}
  ],
  "rewritten_projects": [
    {{
      "name": "string",
      "original": "string",
      "rewritten": "string"
    }}
  ],
  "keywords_added": ["string"],
  "ats_score_estimate": 78,
  "improvement_tips": ["string"]
}}
"""
```

## Step 6: Create `agents/cv_rewrite_agent.py`
```python
import google.generativeai as genai
import asyncio, json, re, os
from dotenv import load_dotenv
from agents.prompts.cv_rewrite_prompt import CV_REWRITE_SYSTEM_PROMPT, CV_REWRITE_USER_TEMPLATE

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def parse_gemini_json(text: str) -> dict:
    clean = re.sub(r'```json|```', '', text).strip()
    return json.loads(clean)

async def call_gemini_with_retry(model, prompt: str, max_retries: int = 5) -> str:
    for attempt in range(max_retries):
        try:
            response = await model.generate_content_async(prompt)
            return response.text
        except Exception as e:
            if "429" in str(e) or "quota" in str(e).lower():
                await asyncio.sleep(2 ** attempt)
            else:
                raise e
    raise Exception("Gemini max retries exceeded")

async def run_cv_rewrite_agent(profile_data: dict, market_data: dict, gap_data: dict) -> dict:
    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        system_instruction=CV_REWRITE_SYSTEM_PROMPT
    )
    prompt = CV_REWRITE_USER_TEMPLATE.format(
        candidate_profile=json.dumps(profile_data, indent=2),
        market_data=json.dumps(market_data, indent=2),
        gap_data=json.dumps(gap_data, indent=2)
    )
    raw = await call_gemini_with_retry(model, prompt)
    return parse_gemini_json(raw)
```

## Step 7: Create `agents/orchestrator.py`
```python
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
    status_queue: asyncio.Queue
):
    """
    Full pipeline orchestrator. Puts SSE-compatible status dicts into status_queue.
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
        profile_data = await run_profile_agent(cv_text, target_role, target_city, experience_years, education_level)
        await mark_agent_complete(session_id, "profile", profile_data)
        await emit("agent_complete", "profile", f"Profile built for {profile_data.get('name', 'candidate')}")

        # Agent 2: Market
        await emit("agent_start", "market", f"Scanning Pakistani job boards for {target_role} in {target_city}...")
        market_data = await run_market_agent(target_role, target_city)
        await mark_agent_complete(session_id, "market", market_data)
        await emit("agent_complete", "market", f"Found market data. Demand: {market_data.get('market_demand_level', 'N/A')}")

        # Agent 3: Gap Analysis
        await emit("agent_start", "gap", "Analyzing skill gaps against market requirements...")
        gap_data = await run_gap_agent(profile_data, market_data)
        await mark_agent_complete(session_id, "gap", gap_data)
        await emit("agent_complete", "gap", f"Readiness score: {gap_data.get('overall_readiness_score', '?')}/100")

        # Agents 4 + 5: Parallel
        await emit("agent_start", "roadmap", "Building your 30/60/90-day learning roadmap...")
        await emit("agent_start", "cv_rewrite", "Rewriting your CV for ATS optimization...")

        roadmap_data, cv_rewrite_data = await asyncio.gather(
            run_roadmap_agent(gap_data),
            run_cv_rewrite_agent(profile_data, market_data, gap_data)
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
```

## Step 8: Update `routers/pipeline.py` with full endpoints
```python
from fastapi import APIRouter, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import StreamingResponse
from tools.cv_parser import extract_cv_text
from agents.orchestrator import run_pipeline
from db.supabase_client import create_session, get_session
import asyncio
import json

router = APIRouter(prefix="/api/pipeline")

# In-memory store for status queues (keyed by session_id)
status_queues: dict[str, asyncio.Queue] = {}

@router.post("/start")
async def start_pipeline(
    background_tasks: BackgroundTasks,
    cv_file: UploadFile = File(...),
    target_role: str = Form(...),
    target_city: str = Form(...),
    experience_years: float = Form(0.0),
    education_level: str = Form("Bachelor's")
):
    cv_bytes = await cv_file.read()
    cv_text = extract_cv_text(cv_bytes)
    session_id = await create_session(target_role, target_city, cv_text)

    queue = asyncio.Queue()
    status_queues[session_id] = queue

    background_tasks.add_task(
        run_pipeline,
        session_id, cv_text, target_role, target_city, experience_years, education_level, queue
    )

    return {"session_id": session_id}

@router.get("/status/{session_id}")
async def pipeline_status(session_id: str):
    async def event_generator():
        queue = status_queues.get(session_id)
        if not queue:
            # Session already complete — check DB
            session = await get_session(session_id)
            yield f"data: {json.dumps({'event': 'pipeline_complete', 'message': 'Already complete'})}\n\n"
            return

        while True:
            item = await queue.get()
            if item is None:
                break
            yield f"data: {json.dumps(item)}\n\n"

        status_queues.pop(session_id, None)

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.get("/results/{session_id}")
async def get_results(session_id: str):
    session = await get_session(session_id)
    return session
```

## Step 9: Register router in `main.py`
```python
from routers.pipeline import router as pipeline_router
app.include_router(pipeline_router)
```

## Step 10: Full pipeline test
```bash
# Start server
uvicorn main:app --reload --port 8000

# In another terminal — test full pipeline
curl -X POST http://localhost:8000/api/pipeline/start \
  -F "cv_file=@test_cv.pdf" \
  -F "target_role=ML Engineer" \
  -F "target_city=Karachi" \
  -F "experience_years=1.0" \
  -F "education_level=Bachelor's"
# Note the session_id returned

# Stream status
curl -N http://localhost:8000/api/pipeline/status/YOUR_SESSION_ID

# Get final results
curl http://localhost:8000/api/pipeline/results/YOUR_SESSION_ID
```

---

## ✅ Phase 4 Complete When:
- [ ] All 5 agents (A1–A5) run without errors
- [ ] A4 and A5 run in parallel (confirmed by timing — should not be sequential wait)
- [ ] All 5 agent outputs stored in Supabase session row
- [ ] SSE stream emits all agent status events correctly
- [ ] `/api/pipeline/results/{id}` returns full session with all `_data` fields populated
- [ ] Pipeline handles Gemini errors gracefully — updates session status to "error" with message

---

---

# PHASE 5 — Interview Agent (Agent 6) + PDF Export

**Goal:** Multi-turn interview agent built. PDF Career Dossier generation working. All backend endpoints complete.

**Owner:** Hassan

---

## Step 1: Create `agents/prompts/interview_prompt.py`
```python
QUESTION_GEN_SYSTEM_PROMPT = """
You are a senior technical interviewer at a Pakistani tech company (Systems Limited, Netsol, Arbisoft, 10Pearls).

Generate targeted interview questions based on the candidate's profile and target role.
Make questions specific — not generic. Reference the actual skills and projects from their CV.

Return ONLY valid JSON. No preamble, no markdown fences.
"""

QUESTION_GEN_USER_TEMPLATE = """
TARGET ROLE: {target_role}
CANDIDATE PROFILE: {candidate_profile}
MARKET DATA: {market_data}

Generate 15 interview questions (5 technical, 5 behavioral, 5 HR/culture-fit).
Return ONLY valid JSON:
{{
  "technical_questions": [
    {{
      "id": "t1",
      "question": "string",
      "difficulty": "Easy or Medium or Hard",
      "what_interviewer_looks_for": "string"
    }}
  ],
  "behavioral_questions": [
    {{
      "id": "b1",
      "question": "string",
      "what_interviewer_looks_for": "string"
    }}
  ],
  "hr_questions": [
    {{
      "id": "h1",
      "question": "string",
      "what_interviewer_looks_for": "string"
    }}
  ]
}}
"""

ANSWER_EVAL_SYSTEM_PROMPT = """
You are a senior technical interviewer evaluating a candidate for a Pakistani tech company.

You will receive the question, what you were looking for, and the candidate's answer.
Evaluate honestly but constructively. This is for the candidate's improvement.

Return ONLY valid JSON. No preamble, no markdown fences.
"""

ANSWER_EVAL_USER_TEMPLATE = """
ROLE: {target_role}
QUESTION: {question}
WHAT INTERVIEWER LOOKS FOR: {what_looking_for}
CANDIDATE ANSWER: {candidate_answer}
QUESTION NUMBER: {question_number} of 15

Evaluate the answer. Return ONLY valid JSON:
{{
  "score": 7,
  "max_score": 10,
  "what_was_good": "string",
  "what_was_missing": "string",
  "ideal_answer_hints": ["string — hint, not full answer"],
  "feedback_summary": "string — 2-3 sentence overall feedback"
}}
"""
```

## Step 2: Create `agents/interview_agent.py`
```python
import google.generativeai as genai
import asyncio, json, re, os
from dotenv import load_dotenv
from agents.prompts.interview_prompt import (
    QUESTION_GEN_SYSTEM_PROMPT, QUESTION_GEN_USER_TEMPLATE,
    ANSWER_EVAL_SYSTEM_PROMPT, ANSWER_EVAL_USER_TEMPLATE
)

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def parse_gemini_json(text: str) -> dict:
    clean = re.sub(r'```json|```', '', text).strip()
    return json.loads(clean)

async def call_gemini_with_retry(model, prompt: str, max_retries: int = 5) -> str:
    for attempt in range(max_retries):
        try:
            response = await model.generate_content_async(prompt)
            return response.text
        except Exception as e:
            if "429" in str(e) or "quota" in str(e).lower():
                await asyncio.sleep(2 ** attempt)
            else:
                raise e
    raise Exception("Gemini max retries exceeded")

async def generate_interview_questions(profile_data: dict, market_data: dict) -> dict:
    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        system_instruction=QUESTION_GEN_SYSTEM_PROMPT
    )
    prompt = QUESTION_GEN_USER_TEMPLATE.format(
        target_role=profile_data.get("target_role", ""),
        candidate_profile=json.dumps(profile_data, indent=2),
        market_data=json.dumps(market_data, indent=2)
    )
    raw = await call_gemini_with_retry(model, prompt)
    return parse_gemini_json(raw)

async def evaluate_answer(
    target_role: str,
    question: str,
    what_looking_for: str,
    candidate_answer: str,
    question_number: int
) -> dict:
    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        system_instruction=ANSWER_EVAL_SYSTEM_PROMPT
    )
    prompt = ANSWER_EVAL_USER_TEMPLATE.format(
        target_role=target_role,
        question=question,
        what_looking_for=what_looking_for,
        candidate_answer=candidate_answer,
        question_number=question_number
    )
    raw = await call_gemini_with_retry(model, prompt)
    return parse_gemini_json(raw)
```

## Step 3: Create `routers/interview.py`
```python
from fastapi import APIRouter
from pydantic import BaseModel
from agents.interview_agent import generate_interview_questions, evaluate_answer
from db.supabase_client import get_session, supabase
import json

router = APIRouter(prefix="/api/interview")

class AnswerPayload(BaseModel):
    session_id: str
    interview_id: str
    question_id: str
    answer: str

@router.post("/start/{session_id}")
async def start_interview(session_id: str):
    session = await get_session(session_id)
    profile_data = session.get("profile_data", {})
    market_data = session.get("market_data", {})

    questions = await generate_interview_questions(profile_data, market_data)

    result = supabase.table("interview_sessions").insert({
        "session_id": session_id,
        "questions": questions,
        "current_question_index": 0,
        "answers": [],
        "scores": []
    }).execute()

    interview_id = result.data[0]["id"]
    all_questions = (
        questions.get("technical_questions", []) +
        questions.get("behavioral_questions", []) +
        questions.get("hr_questions", [])
    )
    first_question = all_questions[0] if all_questions else {}

    return {
        "interview_id": interview_id,
        "total_questions": len(all_questions),
        "current_question": first_question,
        "question_number": 1
    }

@router.post("/answer")
async def submit_answer(payload: AnswerPayload):
    session = await get_session(payload.session_id)
    target_role = session.get("target_role", "")

    interview_result = supabase.table("interview_sessions").select("*").eq("id", payload.interview_id).execute()
    interview = interview_result.data[0]

    questions_data = interview["questions"]
    all_questions = (
        questions_data.get("technical_questions", []) +
        questions_data.get("behavioral_questions", []) +
        questions_data.get("hr_questions", [])
    )

    current_index = interview["current_question_index"]
    current_q = all_questions[current_index]

    evaluation = await evaluate_answer(
        target_role=target_role,
        question=current_q["question"],
        what_looking_for=current_q.get("what_interviewer_looks_for", ""),
        candidate_answer=payload.answer,
        question_number=current_index + 1
    )

    answers = interview["answers"] or []
    scores = interview["scores"] or []
    answers.append({"question_id": payload.question_id, "answer": payload.answer})
    scores.append({"question_id": payload.question_id, "score": evaluation["score"]})

    next_index = current_index + 1
    is_complete = next_index >= len(all_questions)
    next_question = all_questions[next_index] if not is_complete else None

    final_score = None
    if is_complete:
        total = sum(s["score"] for s in scores)
        final_score = round((total / (len(scores) * 10)) * 100, 1)

    supabase.table("interview_sessions").update({
        "current_question_index": next_index,
        "answers": answers,
        "scores": scores,
        "final_score": final_score
    }).eq("id", payload.interview_id).execute()

    return {
        "evaluation": evaluation,
        "next_question": next_question,
        "question_number": next_index + 1 if not is_complete else None,
        "is_complete": is_complete,
        "final_score": final_score
    }

@router.get("/summary/{session_id}")
async def get_interview_summary(session_id: str):
    result = supabase.table("interview_sessions").select("*").eq("session_id", session_id).execute()
    if not result.data:
        return {"error": "No interview found for this session"}
    return result.data[0]
```

## Step 4: Create `tools/pdf_generator.py`
```python
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from io import BytesIO
import json

def generate_career_dossier(session: dict) -> bytes:
    """Generate a Career Dossier PDF from a complete session dict. Returns PDF bytes."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
                            rightMargin=2*cm, leftMargin=2*cm,
                            topMargin=2*cm, bottomMargin=2*cm)

    styles = getSampleStyleSheet()
    BRAND_COLOR = colors.HexColor("#0F172A")
    ACCENT_COLOR = colors.HexColor("#6366F1")

    title_style = ParagraphStyle('Title', parent=styles['Title'],
                                  fontSize=24, textColor=BRAND_COLOR, spaceAfter=6)
    h1_style = ParagraphStyle('H1', parent=styles['Heading1'],
                               fontSize=14, textColor=ACCENT_COLOR, spaceBefore=16, spaceAfter=6)
    body_style = ParagraphStyle('Body', parent=styles['Normal'],
                                 fontSize=10, spaceAfter=4, leading=14)

    story = []
    profile = session.get("profile_data", {})
    market = session.get("market_data", {})
    gap = session.get("gap_data", {})
    roadmap = session.get("roadmap_data", {})
    cv_rewrite = session.get("cv_rewrite_data", {})

    # Header
    story.append(Paragraph("اُستاد — Career Dossier", title_style))
    story.append(Paragraph(f"Prepared for: {profile.get('name', 'Candidate')}", body_style))
    story.append(Paragraph(f"Target Role: {session.get('target_role', '')} | City: {session.get('target_city', '')}", body_style))
    story.append(HRFlowable(width="100%", thickness=1, color=ACCENT_COLOR))
    story.append(Spacer(1, 0.3*cm))

    # Market Snapshot
    story.append(Paragraph("📊 Market Intelligence", h1_style))
    story.append(Paragraph(f"Demand Level: {market.get('market_demand_level', 'N/A')}", body_style))
    story.append(Paragraph(f"Top Skills Required: {', '.join(market.get('top_required_skills', [])[:8])}", body_style))
    sal = market.get("salary_range_pkr", {})
    story.append(Paragraph(f"Salary Range: PKR {sal.get('min', 'N/A'):,} – {sal.get('max', 'N/A'):,}/month", body_style))
    story.append(Paragraph(market.get("market_summary", ""), body_style))
    story.append(Spacer(1, 0.3*cm))

    # Gap Analysis
    story.append(Paragraph("🔍 Gap Analysis", h1_style))
    story.append(Paragraph(f"Readiness Score: {gap.get('overall_readiness_score', 'N/A')}/100", body_style))
    story.append(Paragraph(gap.get("summary", ""), body_style))
    for g in gap.get("critical_gaps", []):
        story.append(Paragraph(f"❌ CRITICAL: {g['skill']} — {g['reason']}", body_style))
    story.append(Spacer(1, 0.3*cm))

    # Rewritten CV Summary
    story.append(Paragraph("📝 Optimized CV Summary", h1_style))
    story.append(Paragraph(cv_rewrite.get("rewritten_summary", ""), body_style))
    story.append(Paragraph(f"ATS Score Estimate: {cv_rewrite.get('ats_score_estimate', 'N/A')}/100", body_style))
    story.append(Spacer(1, 0.3*cm))

    # Roadmap (30-day only in PDF for brevity)
    story.append(Paragraph("🗺️ 30-Day Learning Roadmap", h1_style))
    for week in roadmap.get("thirty_day_plan", []):
        story.append(Paragraph(f"Week {week['week']}: {week['focus']}", body_style))
        for task in week.get("tasks", []):
            story.append(Paragraph(f"  • {task['task']} ({task['platform']}, ~{task.get('estimated_hours', '?')}h)", body_style))
    story.append(Spacer(1, 0.3*cm))

    # Quick wins
    story.append(Paragraph("⚡ Quick Wins This Week", h1_style))
    for qw in roadmap.get("quick_wins", []):
        story.append(Paragraph(f"• {qw['action']} [{qw['impact']} impact, {qw['time_required']}]", body_style))

    doc.build(story)
    buffer.seek(0)
    return buffer.read()
```

## Step 5: Create `routers/export.py`
```python
from fastapi import APIRouter
from fastapi.responses import Response
from db.supabase_client import get_session
from tools.pdf_generator import generate_career_dossier

router = APIRouter(prefix="/api/export")

@router.get("/dossier/{session_id}")
async def export_dossier(session_id: str):
    session = await get_session(session_id)
    if not session:
        return {"error": "Session not found"}

    pdf_bytes = generate_career_dossier(session)
    candidate_name = session.get("profile_data", {}).get("name", "candidate").replace(" ", "_")

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=ustaad_dossier_{candidate_name}.pdf"}
    )
```

## Step 6: Register all routers in `main.py`
```python
from routers.pipeline import router as pipeline_router
from routers.interview import router as interview_router
from routers.export import router as export_router

app.include_router(pipeline_router)
app.include_router(interview_router)
app.include_router(export_router)
```

---

## ✅ Phase 5 Complete When:
- [ ] `/api/interview/start/{id}` returns 15 questions (5+5+5)
- [ ] `/api/interview/answer` returns scored evaluation + next question
- [ ] Final answer returns `is_complete: true` + `final_score`
- [ ] `/api/export/dossier/{id}` returns a downloadable PDF
- [ ] PDF contains all 5 sections: Market, Gap, CV Summary, Roadmap, Quick Wins
- [ ] All 7 endpoints work via Postman/curl

---

---

# PHASE 6 — Full Frontend Implementation

**Goal:** All 4 pages built and wired to backend. Complete user flow works end-to-end in browser. Abdul Mannan owns this phase entirely.

**Owner:** Abdul Mannan

---

## Page 1: Landing Page (`app/page.tsx`)

**What to build:**
- Hero: "اُستاد — Your AI Career Coach, Built for Pakistan"
- Subheadline: "Upload your CV. Get a real-time market analysis, skill gap report, personalized roadmap, and AI mock interview — all in under 5 minutes."
- Two-step form:
  - Step 1: CV drag-and-drop upload (react-dropzone, PDF only, max 5MB)
  - Step 2: Target role (text input), Target city (dropdown: Karachi/Lahore/Islamabad/Remote), Years of experience (number input), Education level (dropdown: Bachelor's/Master's/Self-taught)
- Submit button: "Start My Analysis →" with loading spinner
- On submit: call `startPipeline(formData)` from `lib/api.ts`, receive `session_id`, redirect to `/dashboard/[sessionId]`

**Design notes:**
- Dark background (#0F172A), indigo accent (#6366F1)
- Clean, modern, confident — not "student project" energy
- Mobile responsive

---

## Page 2: Dashboard (`app/dashboard/[sessionId]/page.tsx`)

**What to build:**

**Left panel — Live Pipeline Progress (`PipelineProgress.tsx`):**
- Shows 5 agent steps as a vertical stepper
- Each step: icon + agent name + status (Waiting / Running / Complete)
- Live message under current running agent ("Scanning Rozee.pk for ML Engineer roles...")
- Connects to SSE stream via `subscribeToPipeline()` from `lib/sse.ts` on page mount

**Right panel — Results appear section by section as agents complete:**

`MarketSnapshot.tsx` — appears when market agent completes:
- Demand level badge (High/Medium/Low with color)
- Top 8 required skills as tags
- Salary range in PKR
- Top 3 hiring companies

`GapReport.tsx` — appears when gap agent completes:
- Large readiness score (e.g. "72/100") with circular progress indicator
- Summary text
- Critical gaps listed with red ❌ badges
- Moderate gaps with orange ⚠️ badges
- Strengths with green ✅ badges

`RoadmapTimeline.tsx` — appears when roadmap agent completes:
- Tab switcher: 30 days / 60 days / 90 days
- Each week as a card with task list
- Quick wins section at bottom

`CVComparison.tsx` — appears when CV rewrite agent completes:
- Side-by-side: Original (left, greyed out) vs Rewritten (right, highlighted)
- ATS score badge
- Keywords added list

**Bottom CTA** — appears when all agents complete:
- "🎤 Start Mock Interview" button → navigates to `/interview/[sessionId]`
- "📄 Download Career Dossier" button → calls export endpoint

---

## Page 3: Interview (`app/interview/[sessionId]/page.tsx`)

**What to build:**

On page mount: call `startInterview(sessionId)`, receive `interview_id` + first question.

**Layout:**
- Progress bar at top: "Question 3 of 15"
- Question card: question text + difficulty badge (technical only)
- Answer textarea: "Type your answer here..."
- "Submit Answer →" button with loading state

After submission — feedback card slides in below:
- Score: "7 / 10" with color (green ≥7, yellow 5-6, red <5)
- What was good ✅
- What was missing ❌
- Hints 💡

Then: "Next Question →" button

After question 15:
- Final score display (e.g. "Overall Interview Score: 74/100")
- Breakdown by category (Technical / Behavioral / HR)
- "View Career Dossier →" CTA

---

## Page 4: Dossier (`app/dossier/[sessionId]/page.tsx`)

**What to build:**
- Fetch full session via `getPipelineResults(sessionId)`
- Display all 5 sections in a clean report layout:
  1. Header: Name, Role, Date
  2. Market Intelligence summary
  3. Gap Analysis with score
  4. 30-day roadmap checklist
  5. Rewritten CV summary
- "Download PDF" button → `window.open(getDossierUrl(sessionId))`
- "Share" button → copies current URL to clipboard

---

## ✅ Phase 6 Complete When:
- [ ] CV upload + form submission works and redirects to dashboard
- [ ] SSE pipeline progress updates live in the browser
- [ ] All 4 result sections appear progressively as agents complete
- [ ] Interview page works end-to-end (15 questions, feedback, final score)
- [ ] PDF downloads correctly from the dossier page
- [ ] All pages are mobile responsive
- [ ] Loading states and error states handled on every async action

---

---

# PHASE 7 — Deployment, Polish & Kaggle Submission

**Goal:** Live deployment on Render + Vercel. All integration bugs fixed. Demo video recorded. Kaggle writeup submitted before July 6.

**Owner:** Both

---

## Step 1: Deploy Backend to Render (Hassan)

1. Push `backend/` to a GitHub repo
2. Go to render.com → New Web Service
3. Connect GitHub repo
4. Settings:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Environment:** Python 3.11
5. Add all environment variables from `.env` in Render dashboard
6. Add a `/health` endpoint check in Render settings
7. After deploy: test `https://your-app.onrender.com/health`

**Important:** Render free tier spins down after inactivity. For demo purposes this is fine. Add a note in the writeup.

---

## Step 2: Deploy Frontend to Vercel (Abdul Mannan)

1. Push `frontend/` to GitHub repo
2. Go to vercel.com → New Project → Import repo
3. Framework: Next.js (auto-detected)
4. Add all environment variables from `.env.local` in Vercel dashboard
   - `NEXT_PUBLIC_API_URL` = your Render backend URL
5. Deploy and verify all 4 pages load

---

## Step 3: Update CORS in Backend

In `main.py`, update `CORS_ORIGINS` env var in Render to include your Vercel URL:
```
CORS_ORIGINS=http://localhost:3000,https://ustaad.vercel.app
```

---

## Step 4: End-to-End Integration Testing (Both)

Test with 5 different CV types:
- [ ] Fresh graduate, no experience
- [ ] 1-2 years experience
- [ ] Career switcher (non-CS background)
- [ ] Strong candidate (should score 80+)
- [ ] Weak candidate (should score <50, many critical gaps)

For each: verify pipeline completes, all sections display, PDF downloads, interview works.

---

## Step 5: Demo Video (Abdul Mannan)

**Script outline (target: 4-5 minutes):**

```
0:00 - 0:30  Problem intro
  "800,000 CS graduates in Pakistan every year. Most don't know how to position themselves.
  Generic CVs, no market awareness, failed interviews. Meet Ustaad."

0:30 - 1:00  Show landing page, upload Hassan's real CV, fill form

1:00 - 2:30  Live pipeline running
  - Show each agent status appearing in real time
  - Narrate what each agent is doing
  - Market snapshot: "This is real-time data from Pakistani job boards — right now"
  - Gap report: show the readiness score
  - CV comparison: before vs after

2:30 - 3:30  Mock interview demo
  - Answer one technical question (deliberately weak answer)
  - Show the scored feedback
  - Show a good answer for next question
  - Show final score

3:30 - 4:00  Download Career Dossier, show PDF

4:00 - 4:30  Architecture quick overview (diagram)
  "7 agents, Gemini 2.5 Flash, real-time job data, FastAPI + Next.js"

4:30 - 5:00  Closing
  "Built by Hassan and Abdul Mannan from Karachi. This is for every Pakistani
  grad who doesn't know where to start."
```

**Recording tools:** Loom (free), OBS, or Screencastify. Upload to YouTube as Unlisted.

---

## Step 6: GitHub README (Hassan)

Create a clean `README.md` at the repo root:
```markdown
# Ustaad (اُستاد) — AI Career OS for Pakistani Tech Talent

> Built for Kaggle × Google: 5-Day AI Agents Vibe Coding Capstone 2026

## What it does
[2-3 paragraph description]

## Architecture
[Architecture diagram]

## Agents
| Agent | Role |
|-------|------|
| Profile Agent | CV parsing + structured extraction |
| Market Agent | Real-time Pakistani job board research |
| Gap Agent | Skill gap analysis with readiness score |
| Roadmap Agent | 30/60/90-day personalized learning plan |
| CV Rewrite Agent | ATS-optimized CV rewriting |
| Interview Agent | Multi-turn mock interview with scoring |

## Tech Stack
Gemini 2.5 Flash · FastAPI · Next.js 14 · Supabase · Serper.dev · PyMuPDF · ReportLab

## Live Demo
[Vercel URL]

## Team
Hassan + Abdul Mannan | AgenticEra Systems
```

---

## Step 7: Kaggle Writeup (Hassan)

Publish on the Kaggle competition page. Required sections:

**Title:** Ustaad — A 7-Agent AI Career OS for Pakistani Tech Graduates

**1. Problem**
Pakistan produces hundreds of thousands of CS/IT graduates yearly. Most struggle to position themselves for the job market — they send generic CVs, don't know what skills are actually in demand, and fail interviews for lack of preparation. No existing tool addresses this with real Pakistani market data.

**2. Solution**
Ustaad is a multi-agent AI pipeline that takes a candidate's CV and target role as input, and produces a complete career action plan as output. It uses real-time web search to ground its analysis in actual Pakistani market conditions.

**3. Agent Architecture**
[Describe all 7 agents with their inputs, outputs, and roles. Include the execution diagram.]

**4. Technical Decisions**
- Why Gemini 2.5 Flash: native Google ecosystem, generous context window for CV + market data, reliable JSON output
- Why no LangChain/LangGraph: pipeline is deterministic — `asyncio.gather()` handles parallelism cleanly without framework overhead
- Why Serper.dev: real-time job data makes the market analysis actually useful, not generic
- Why Supabase: session persistence enables the multi-step user flow (pipeline → interview → export)

**5. Challenges Faced**
- Gemini rate limits during parallel A4+A5 execution → exponential backoff
- JSON parsing inconsistency from Gemini → regex fence stripping
- SSE stream management across background tasks in FastAPI → asyncio Queue pattern

**6. Impact**
[Write about who this helps and why it matters]

**7. Links**
- Demo video: [YouTube link]
- GitHub: [repo link]
- Live app: [Vercel URL]

---

## Step 8: Final Submission Checklist

- [ ] Both Hassan and Abdul Mannan registered on Kaggle competition
- [ ] Team formed on Kaggle (if team submission supported)
- [ ] Demo video uploaded (YouTube Unlisted or Loom)
- [ ] GitHub repo public with clean README
- [ ] Kaggle writeup published with all 7 sections
- [ ] Live Vercel URL included in writeup
- [ ] Submitted before **July 6, 2026 at 11:59 PM PT**

---

## ✅ Phase 7 Complete When:
- [ ] Backend live on Render, health check passing
- [ ] Frontend live on Vercel, all pages accessible
- [ ] Full flow works on production URLs (not localhost)
- [ ] Demo video is 4-5 minutes, covers all key features
- [ ] Kaggle writeup published
- [ ] Submission confirmed on Kaggle competition page

---

---

## 📊 Phase Summary

| Phase | What Gets Built | Owner | Est. Time |
|-------|----------------|-------|-----------|
| Phase 1 | Project scaffold, Supabase tables, health check | Both | Day 1 |
| Phase 2 | CV parser + Profile Agent (A1) | Hassan | Day 1-2 |
| Phase 3 | Market Agent (A2) + Supabase session management | Hassan | Day 2 |
| Phase 4 | Gap (A3) + Roadmap (A4) + CV Rewrite (A5) + Orchestrator | Hassan | Day 3 |
| Phase 5 | Interview Agent (A6) + PDF export + all endpoints | Hassan | Day 4 |
| Phase 6 | Full frontend — all 4 pages wired to backend | Abdul Mannan | Day 2-5 |
| Phase 7 | Deployment + testing + video + writeup + submission | Both | Day 6-7 |

---

*Ustaad — Built for Kaggle × Google 5-Day AI Agents Vibe Coding Capstone, June 2026*
*Team: Hassan + Abdul Mannan | AgenticEra Systems, Karachi*
