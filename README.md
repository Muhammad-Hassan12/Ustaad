# Ustaad (اُستاد) — AI Career OS for Pakistani Tech Talent

<div align="center">

[![Kaggle Capstone](https://img.shields.io/badge/Kaggle-AI%20Agents%20Capstone%202026-20BEFF?style=for-the-badge&logo=kaggle&logoColor=white)](https://www.kaggle.com/competitions/vibecoding-agents-capstone-project)
[![Google Gemini](https://img.shields.io/badge/Powered%20By-Gemini%202.5%20Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://aistudio.google.com/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](https://opensource.org/licenses/MIT)

<br/>

> **Ustaad** *(Urdu: اُستاد — Teacher / Master)* is an AI-powered **Career Operating System** purpose-built to help Pakistani technology graduates navigate, prepare for, and succeed in the local tech job market.

**"The career coach Pakistan never had."**

</div>

---

## 📋 Table of Contents

1. [The Problem & Mission](#-the-problem--mission)
2. [Live Demo](#-live-demo)
3. [Competition Track](#-competition-track)
4. [Multi-Agent Architecture](#️-multi-agent-architecture--pipeline)
5. [The 5+2 Agents — Detailed Breakdown](#-the-52-agents--detailed-breakdown)
6. [Course Concepts Demonstrated](#-course-concepts-demonstrated)
7. [Tech Stack](#️-tech-stack)
8. [Project Structure](#-project-structure)
9. [Setup & Installation](#-setup--installation)
10. [Environment Variables](#-environment-variables)
11. [API Reference](#-api-reference)
12. [The Team](#-the-team)
13. [License](#-license)

---

## 🎯 The Problem & Mission

Every year, **tens of thousands of CS and IT graduates** enter Pakistan's technology sector. A critical disconnect persists between university curricula and real industry demands. Graduates face:

| Challenge | Reality |
|---|---|
| **Curriculum Gaps** | No clear signal on which skills Pakistani employers in Karachi, Lahore, and Islamabad actually need |
| **ATS Incompatibility** | Resumes that fail automated Applicant Tracking System screening before any human ever reads them |
| **No Interview Prep** | Little to no access to structured, domain-specific mock interview practice |
| **Career Blindness** | No benchmarking mechanism to understand where they stand vs. market demand |

**Ustaad** solves this by serving as a fully-automated, AI-driven personal career concierge. A user uploads a single PDF CV, specifies their target role and city, and the system delivers:

- ✅ **Real-time market snapshot** grounded in live Pakistani job board data
- ✅ **Honest skill gap analysis** with a quantified readiness score
- ✅ **30/60/90-day personalized learning roadmap** with free resource links
- ✅ **ATS-optimized CV rewrite** with keyword improvements and before/after comparison
- ✅ **Multi-turn mock interview** (15 questions) with AI scoring and feedback on each answer
- ✅ **Downloadable PDF Career Dossier** summarizing all findings

---

## 🚀 Live Demo

> 🔗 **[Watch the 5-minute demo video on YouTube](#)** *(link to be added)*

The demo walks through a real CV submission, live pipeline execution with SSE streaming, and the full dossier output.

---

## 🏆 Competition Track

**Submitted to**: [AI Agents Intensive — Vibe Coding Capstone 2026](https://www.kaggle.com/competitions/vibecoding-agents-capstone-project)

**Track**: **Agents for Business / Agents for Good**

Ustaad addresses a dual mandate:
- **Business**: Helps companies find better-prepared candidates (reduced hiring friction)
- **Good**: Democratizes career coaching for graduates who cannot afford professional coaching services

---

## 🏗️ Multi-Agent Architecture & Pipeline

Ustaad's backend orchestrates a **5-Agent Core Pipeline** with 2 additional interactive modules (Interview + PDF Export), using sequential dependencies and concurrent execution pathways. The architecture maximizes efficiency through `asyncio.gather()` parallelism and streams real-time progress to the frontend via Server-Sent Events (SSE).

```mermaid
flowchart TD
    subgraph Input["👤 User Input"]
        A["Upload PDF CV + Target Role + City"]
    end

    subgraph Pipeline["🤖 Core Pipeline — FastAPI + asyncio"]
        B["A1: Profile Agent\n🔍 Extract & structure CV"] --> C
        C["A2: Market Agent\n📊 Live job board search"] --> D
        D["A3: Gap Agent\n⚡ Compute readiness score"]

        D --> E["A4: Roadmap Agent\n🗺️ Build 30/60/90-day plan"]
        D --> F["A5: CV Rewrite Agent\n📝 ATS optimization"]

        E -.- G["asyncio.gather()\n⚡ Parallel Execution"]
        F -.- G
    end

    subgraph Interactive["🎙️ Interactive Modules — User-Triggered"]
        H["A6: Interview Module\n🎤 Multi-turn Q&A + Scoring"]
        I["A7: Export Module\n📄 PDF Career Dossier"]
    end

    subgraph Output["📄 Deliverables"]
        J[Market Snapshot]
        K[Gap Report]
        L[Learning Roadmap]
        M[CV Before/After]
        N[Interview Scorecard]
        O[PDF Dossier Download]
    end

    A --> B
    G --> J & K & L & M
    G -.-> H
    H --> N
    G -.-> I
    I --> O
```

### Pipeline Flow Summary

```
Upload CV → [A1 Profile] → [A2 Market] → [A3 Gap]
                                              ↙          ↘
                                    [A4 Roadmap]  [A5 CV Rewrite]  ← parallel via asyncio.gather()
                                              ↘          ↙
                                        Dashboard Results
                                              ↓
                              [A6 Interview] ← user-triggered
                              [A7 PDF Export] ← user-triggered
```

> **Note**: Agents A1–A5 execute automatically as a pipeline when a CV is submitted. Agent A6 (Interview) is triggered separately when the user clicks "Start Mock Interview" from the dashboard. Agent A7 (PDF Export) generates on-demand when the user clicks "Download Career Dossier".

---

## 🤖 The 5+2 Agents — Detailed Breakdown

### Core Pipeline Agents (Automated)

| # | Agent | Role | Input | Output | LLM |
|---|---|---|---|---|---|
| **A1** | **Profile Agent** | Parses raw CV text into a structured JSON resume profile (education, experience, skills, projects) | Raw CV text + target role + city + experience + education | `ProfileSchema` JSON | Gemini 2.5 Flash |
| **A2** | **Market Intelligence Agent** | Runs 4 targeted Serper.dev Google searches for live Pakistani job market data, then passes results to Gemini for structured extraction | Target role + city | `MarketDataSchema` JSON | Gemini 2.5 Flash |
| **A3** | **Gap Analysis Agent** | Compares candidate profile vs. market demand, computes a quantified readiness score (0–100) and lists critical skill gaps | A1 Profile + A2 Market data | `GapAnalysisSchema` JSON | Gemini 2.5 Flash |
| **A4** | **Roadmap Agent** | Builds a milestone-driven 30/60/90-day learning plan with free resource links targeted at closing identified gaps | A3 Gap data | `RoadmapSchema` JSON | Gemini 2.5 Flash |
| **A5** | **CV Rewrite Agent** | Rewrites CV bullet points and summary for ATS optimization; estimates ATS score improvement | A1 Profile + A2 Market + A3 Gap | `CVRewriteSchema` JSON | Gemini 2.5 Flash |

### Interactive Modules (User-Triggered)

| # | Module | Role | Input | Output | Engine |
|---|---|---|---|---|---|
| **A6** | **Interview Module** | Generates 15 role-specific questions (5 technical, 5 behavioral, 5 HR), then evaluates each user answer on a 1–10 rubric with detailed feedback | A1 Profile + A2 Market + user answers | Per-answer scoring + final percentage | Gemini 2.5 Flash |
| **A7** | **Export Module** | Aggregates all pipeline outputs into a formatted, styled PDF Career Dossier using ReportLab | Full session data from Supabase | Downloadable PDF | ReportLab SDK |

---

## 🎓 Course Concepts Demonstrated

This project directly demonstrates **4 of the core agentic paradigms** from the Google AI Agents Intensive course:

### 1. ✅ Multi-Agent Collaboration & Orchestration
The `orchestrator.py` coordinates 5 specialized agents in a dependency graph. Agents 4 and 5 are dispatched **in parallel** using `asyncio.gather()`, reducing total pipeline time by ~40% compared to sequential execution. Each agent maintains a single responsibility and communicates exclusively through typed JSON schemas.

```python
# Parallel execution of Roadmap + CV Rewrite agents
roadmap_data, cv_rewrite_data = await asyncio.gather(
    run_roadmap_agent(gap_data),
    run_cv_rewrite_agent(profile_data, market_data, gap_data)
)
```

### 2. ✅ Tool Use & Real-Time Grounding
The **Market Intelligence Agent** calls **Serper.dev** to execute 4 live Google Search queries per session, targeting Pakistani job market data:
```
"{target_role} jobs {target_city} Pakistan"
"{target_role} required skills Pakistan 2026"
"{target_role} salary Pakistan PKR"
"top companies hiring {target_role} Pakistan"
```
Results are geo-targeted (`gl: "pk"`) and passed to Gemini for structured extraction. This grounds every downstream analysis in **real market data**, not LLM training set approximations — a fundamental agentic capability.

### 3. ✅ Structured Outputs & Schema Hardening
Every agent enforces a strict output schema via Gemini's `response_mime_type="application/json"`. The `parse_gemini_json()` utility implements a **4-layer parsing fallback**:
1. Direct `json.loads()`
2. Markdown fence stripping + JSON object extraction
3. Trailing comma cleanup via regex
4. `ast.literal_eval()` for Python-like dict strings (single quotes)

This makes the pipeline resilient against malformed LLM responses across both Gemini and fallback models.

### 4. ✅ Production-Focused Async Pipeline Design
- **Server-Sent Events (SSE)**: Pipeline status events are streamed in real-time to the Next.js frontend via an `asyncio.Queue` + SSE generator pattern, giving users live progress updates without polling.
- **Exponential Backoff**: Gemini calls retry up to 8 times with `min(2^attempt, 15)` second waits on rate-limit errors (429).
- **Model Failover**: If Gemini quota is exhausted, the pipeline automatically falls back to a secondary model endpoint (configurable via `KAGGLE_LLM_URL`). This was used during development for rapid testing when the Gemini free tier quota exhausted quickly.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | Next.js 14.2, TypeScript, React 18 | App Router, SSR/CSR hybrid pages |
| **Styling** | Tailwind CSS 3.4, Framer Motion | Responsive UI, scroll/mount animations |
| **Icons** | Lucide React | Consistent professional icon set |
| **File Upload** | react-dropzone | Drag-and-drop PDF CV upload |
| **Markdown** | react-markdown | Rendering formatted AI responses |
| **Backend** | Python 3.10+, FastAPI | Async REST API + SSE endpoint |
| **PDF Parsing** | PyMuPDF (fitz) | CV text extraction from PDF uploads |
| **AI/LLM** | Google Gemini 2.5 Flash | Core agent pipeline backbone |
| **Search API** | Serper.dev | Real-time Google Search for job board grounding |
| **Database** | Supabase (PostgreSQL) | Session state, agent outputs, interview history |
| **PDF Generation** | ReportLab | Career Dossier PDF output |
| **HTTP Client** | httpx | Async HTTP calls (Serper, fallback LLM) |

---

## 📂 Project Structure

```
ustaad/
├── backend/
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── prompts/                # LLM system instruction templates
│   │   │   ├── __init__.py
│   │   │   ├── profile_prompt.py   # CV parser schema & instructions
│   │   │   ├── market_prompt.py    # Job board search + analysis prompt
│   │   │   ├── gap_prompt.py       # Gap scoring rubric & schema
│   │   │   ├── roadmap_prompt.py   # 30/60/90 learning plan schema
│   │   │   ├── cv_rewrite_prompt.py# ATS optimization instructions
│   │   │   └── interview_prompt.py # Q&A generation + scoring rubric
│   │   ├── gemini_utils.py         # Shared LLM client, retry, JSON parsing, fallback
│   │   ├── orchestrator.py         # Pipeline manager (SSE queue, parallel flows)
│   │   ├── profile_agent.py        # A1: CV Parser Agent
│   │   ├── market_agent.py         # A2: Market Intelligence Agent
│   │   ├── gap_agent.py            # A3: Gap Analysis Agent
│   │   ├── roadmap_agent.py        # A4: Learning Roadmap Agent
│   │   ├── cv_rewrite_agent.py     # A5: ATS CV Rewrite Agent
│   │   └── interview_agent.py      # A6: Mock Interview (question gen + answer eval)
│   ├── db/
│   │   ├── __init__.py
│   │   ├── supabase_client.py      # Supabase async client helpers
│   │   └── schemas.sql             # SQL table definitions for Supabase
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── pipeline.py             # POST /start, GET /status (SSE), GET /results
│   │   ├── interview.py            # POST /start, POST /answer, GET /summary
│   │   └── export.py               # GET /dossier/{session_id} → PDF download
│   ├── tools/
│   │   ├── __init__.py
│   │   ├── cv_parser.py            # PyMuPDF PDF text extraction
│   │   ├── job_scraper.py          # Serper.dev Google Search integration
│   │   └── pdf_generator.py        # ReportLab career dossier builder
│   ├── main.py                     # FastAPI app entry + CORS config
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── app/
│   │   ├── page.tsx                # Landing page with CV upload form
│   │   ├── about/page.tsx          # About page (team, architecture, features)
│   │   ├── dashboard/[sessionId]/  # Live pipeline dashboard with SSE
│   │   ├── interview/[sessionId]/  # Interactive mock interview terminal
│   │   ├── dossier/[sessionId]/    # Full dossier results view
│   │   ├── layout.tsx              # Root layout (nav, theme, footer)
│   │   ├── globals.css             # Global styles & Tailwind base
│   │   ├── icon.png                # App favicon (PNG)
│   │   └── fonts/                  # Geist Sans & Mono font files
│   ├── components/
│   │   ├── PipelineProgress.tsx    # Real-time SSE-driven step tracker
│   │   ├── CVComparison.tsx        # Before/after CV diff view
│   │   ├── CVUpload.tsx            # Drag-and-drop PDF upload dropzone
│   │   ├── GapReport.tsx           # Skills gap visualization cards
│   │   ├── MarketSnapshot.tsx      # Job market demand dashboard
│   │   ├── RoadmapTimeline.tsx     # 30/60/90 roadmap timeline
│   │   ├── Skeleton.tsx            # Loading skeleton placeholders
│   │   ├── ThemeToggle.tsx         # Dark/light mode toggle
│   │   └── ErrorBoundary.tsx       # React error boundary fallback
│   ├── lib/
│   │   ├── api.ts                  # Typed API fetch wrappers (with ngrok bypass)
│   │   └── sse.ts                  # Custom fetch-based SSE stream reader
│   ├── public/
│   │   └── Favicon.png             # High-res logo/favicon asset
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── next.config.mjs
│   ├── tsconfig.json
│   └── .env.example
├── README.md
├── LICENSE
└── .gitignore
```

---

## 🚀 Setup & Installation

### Prerequisites

- Python 3.10+
- Node.js 18+
- A [Supabase](https://supabase.com/) project (free tier works)
- A [Google AI Studio](https://aistudio.google.com/) account (for Gemini API key)
- A [Serper.dev](https://serper.dev/) account (for job search API key)

---

### Step 1: Database Setup (Supabase)

1. Create a free project at [Supabase](https://supabase.com/)
2. Open **SQL Editor** and run the schema from `backend/db/schemas.sql`:

```sql
-- Sessions table: stores pipeline state and all agent outputs
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending',

  -- User inputs
  candidate_name TEXT,
  target_role TEXT,
  target_city TEXT,
  cv_text TEXT,

  -- Agent outputs (JSONB)
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

-- Interview sessions: stores generated questions, user answers, and scores
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

-- Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON sessions FOR ALL USING (true);
CREATE POLICY "Allow all" ON interview_sessions FOR ALL USING (true);
```

---

### Step 2: Backend Setup (FastAPI)

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate
# Activate (macOS/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# → Edit .env with your API keys (see Environment Variables section below)

# Start the backend server
uvicorn main:app --reload --port 8000
```

Backend runs at `http://localhost:8000`. Health check: `GET /health`

---

### Step 3: Frontend Setup (Next.js)

```bash
# Navigate to frontend (from project root)
cd frontend

# Install Node dependencies
npm install

# Configure environment
cp .env.example .env.local
# → Set NEXT_PUBLIC_API_URL=http://localhost:8000

# Start the development server
npm run dev
```

Frontend runs at `http://localhost:3000`

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

```env
# AI / LLM
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# Search / Grounding
SERPER_API_KEY=your_serper_dev_api_key_here

# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_service_role_key

# CORS (comma-separated list of allowed origins)
CORS_ORIGINS=http://localhost:3000

# Optional: override default Gemini model
# GEMINI_MODEL=gemini-2.5-flash

# Optional: secondary fallback model endpoint (OpenAI-compatible)
# Used for rapid testing when Gemini free tier quota exhausts quickly.
# The system auto-failovers to this endpoint if Gemini returns 429.
# KAGGLE_LLM_URL=https://your-ngrok-tunnel.ngrok-free.dev/v1/chat/completions
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

> ⚠️ **Never commit `.env` files.** Both are listed in `.gitignore`. Use `.env.example` files as templates.

---

## 📡 API Reference

### Pipeline Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Backend health check |
| `POST` | `/api/pipeline/start` | Upload CV (multipart form) + start pipeline. Returns `{ session_id }` |
| `GET` | `/api/pipeline/status/{session_id}` | SSE stream of real-time pipeline events (`agent_start`, `agent_complete`, `pipeline_complete`, `error`) |
| `GET` | `/api/pipeline/results/{session_id}` | Full JSON session data for a completed (or in-progress) session |

### Interview Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/interview/start/{session_id}` | Generate 15 interview questions and create an interview session. Returns first question |
| `POST` | `/api/interview/answer` | Submit an answer. Body: `{ session_id, interview_id, question_id, answer }`. Returns evaluation + next question |
| `GET` | `/api/interview/summary/{session_id}` | Retrieve full interview session data (all questions, answers, scores, final score) |

### Export Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/export/dossier/{session_id}` | Download Career Dossier as a styled PDF |

---

## 👥 The Team

<table>
  <tr>
    <td align="center">
      <img src="https://github.com/Muhammad-Hassan12.png" width="80" style="border-radius:50%"/><br/>
      <b>Syed Muhammad Hassan</b><br/>
      <sub>Backend Architecture & AI Agent Pipeline</sub><br/>
      <a href="https://github.com/Muhammad-Hassan12">GitHub</a> •
      <a href="https://www.linkedin.com/in/syed-muhammad-hassan-aa112928b/">LinkedIn</a>
    </td>
    <td align="center">
      <img src="https://github.com/abdulmannan991.png" width="80" style="border-radius:50%"/><br/>
      <b>Abdul Mannan Fazlani</b><br/>
      <sub>Frontend Engineering & UI/UX Design</sub><br/>
      <a href="https://github.com/abdulmannan991">GitHub</a> •
      <a href="https://www.linkedin.com/in/abdul-mannan-fazlani-47b274293/">LinkedIn</a>
    </td>
  </tr>
</table>

**Organization**: [AgenticEra Systems](https://github.com/AgenticEraSystems) — AI automation for the real world.

---

## 📄 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2026 AgenticEra Systems

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

<div align="center">

Built with ❤️ in Karachi, Pakistan 🇵🇰 · Powered by Gemini 2.5 Flash 🤖

**[Try Ustaad](#)** · **[Watch Demo](#)** · **[Kaggle Competition](https://www.kaggle.com/competitions/vibecoding-agents-capstone-project)**

</div>
