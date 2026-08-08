# Ustaad Frontend Integration Guide

> **Last updated:** 2026-08-08  
> This guide covers every backend API endpoint and explains the new **BYOK (Bring Your Own Gemini Key)** feature introduced in this update.

---

## Base URL

All requests go to your deployed backend. Replace `<BACKEND_URL>` with your VPS address (e.g. `https://api.yourdomain.com`).

---

## 🔑 BYOK — Bring Your Own Gemini Key

### How it works

Users can supply their own [Google AI Studio](https://aistudio.google.com/apikey) Gemini API key.  
When provided, **the backend uses the user's key exclusively for their session** — it is never shared with other users, never stored in the database, and never written to any log.

When no key is provided, the **server's default key** is used transparently — the app works exactly as before for users who don't have their own key.

### The Header

Attach the key as a custom HTTP header on any request:

```
X-Gemini-API-Key: AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

This header is **optional on every endpoint**. If omitted → server key is used.

### Recommended UX Flow

```
1. Show a "Settings" or "API Key" option in your UI
2. User pastes their Gemini API key
3. Frontend calls GET /api/keys/validate with the header → show ✅ or ❌
4. Store valid key in localStorage (browser only — never send to any other server)
5. Attach the header on all subsequent API calls
```

### Storing the key (frontend)

```js
// Save
localStorage.setItem('gemini_api_key', userKey);

// Read and attach to every fetch/axios call
const geminiKey = localStorage.getItem('gemini_api_key');
const headers = geminiKey ? { 'X-Gemini-API-Key': geminiKey } : {};
```

> ⚠️ **Security note for users**: Keys stored in localStorage are accessible to JavaScript on your page. This is the standard approach used by AI tools (OpenWebUI, LM Studio, etc.). You may want to show a one-time notice explaining this.

---

## Endpoints Reference

---

### `GET /health`

Health check — no auth needed.

**Response**
```json
{ "status": "ok", "service": "ustaad-backend" }
```

---

### `GET /api/keys/validate` ⭐ NEW

Validate a Gemini API key before starting the pipeline. Uses a cheap REST call (list models) — does **not** burn any quota.

**Header** (optional)
```
X-Gemini-API-Key: AIzaSyXXXXXXXXX
```

**Responses**

| Scenario | `valid` | `source` | Notes |
|----------|---------|----------|-------|
| Key provided and valid | `true` | `"user_key"` | Safe to proceed |
| Key provided but invalid | `false` | `"user_key"` | Show error to user |
| No key, server has a default | `true` | `"server_default"` | App works without user key |
| No key, no server default | `false` | `"none"` | App cannot function |

**Example response (valid user key)**
```json
{
  "valid": true,
  "source": "user_key",
  "model": "gemini-2.5-flash",
  "message": "Key is valid. Your key will be used for this session."
}
```

**Example response (invalid key)**
```json
{
  "valid": false,
  "source": "user_key",
  "error": "INVALID_KEY",
  "message": "The provided API key is invalid or lacks permission."
}
```

**Error codes**

| Code | Meaning |
|------|---------|
| `INVALID_KEY` | Key is wrong or revoked |
| `KEY_PERMISSION_DENIED` | Key exists but lacks Gemini API access |
| `NO_KEY_CONFIGURED` | No key anywhere (server or user) |
| `TIMEOUT` | Gemini API was unreachable |
| `API_ERROR_<N>` | Unexpected HTTP status from Gemini |

---

### `POST /api/pipeline/start`

Start the full 5-agent career analysis pipeline. Returns a `session_id` immediately; the pipeline runs in the background.

**Header** (optional — BYOK)
```
X-Gemini-API-Key: AIzaSyXXXXXXXXX
```

**Body** — `multipart/form-data`

| Field | Type | Required | Default |
|-------|------|----------|---------|
| `cv_file` | PDF file | ✅ | — |
| `target_role` | string (max 200 chars) | ✅ | — |
| `target_city` | string | ✅ | — |
| `experience_years` | float | ❌ | `0.0` |
| `education_level` | string | ❌ | `"Bachelor's"` |

**Example (JS)**
```js
const formData = new FormData();
formData.append('cv_file', pdfFile);
formData.append('target_role', 'Backend Engineer');
formData.append('target_city', 'Karachi');
formData.append('experience_years', '3');
formData.append('education_level', "Bachelor's");

const geminiKey = localStorage.getItem('gemini_api_key');
const res = await fetch(`${BACKEND_URL}/api/pipeline/start`, {
  method: 'POST',
  headers: geminiKey ? { 'X-Gemini-API-Key': geminiKey } : {},
  body: formData,
});
const { session_id } = await res.json();
```

**Success Response**
```json
{ "session_id": "uuid-string" }
```

**Error Responses**

| Status | Reason |
|--------|--------|
| 400 | File not PDF, file > 5MB, or empty target_role |
| 422 | CV text could not be extracted from PDF |

---

### `GET /api/pipeline/status/{session_id}`

**Server-Sent Events (SSE)** stream. Subscribe to get real-time agent progress updates.

> ⚠️ **Do NOT send the `X-Gemini-API-Key` header here.** The pipeline is already running with the correct key — this endpoint only reads the status queue.

**Example (JS)**
```js
const source = new EventSource(`${BACKEND_URL}/api/pipeline/status/${session_id}`);

source.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data.event, data.agent, data.message);

  if (data.event === 'pipeline_complete') {
    source.close();
    // Fetch results
  }
  if (data.event === 'error') {
    source.close();
    // Handle error
  }
};
```

**Event payload shape**
```json
{
  "event": "agent_start | agent_complete | pipeline_complete | error",
  "agent": "profile | market | gap | roadmap | cv_rewrite | orchestrator",
  "message": "Human-readable status string"
}
```

**Event sequence**
```
agent_start(profile) → agent_complete(profile)
agent_start(market)  → agent_complete(market)
agent_start(gap)     → agent_complete(gap)
agent_start(roadmap) + agent_start(cv_rewrite)   ← parallel
agent_complete(roadmap) + agent_complete(cv_rewrite)
pipeline_complete(orchestrator)
```

---

### `GET /api/pipeline/results/{session_id}`

Fetch the full session data after the pipeline completes.

**Response** — full Supabase session row:
```json
{
  "id": "uuid",
  "status": "complete",
  "target_role": "Backend Engineer",
  "target_city": "Karachi",
  "profile_data": { ... },
  "market_data": { ... },
  "gap_data": { ... },
  "roadmap_data": { ... },
  "cv_rewrite_data": { ... },
  "agents_completed": ["profile", "market", "gap", "roadmap", "cv_rewrite"]
}
```

---

### `POST /api/interview/start/{session_id}`

Generate AI interview questions based on the completed pipeline session.

**Header** (optional — BYOK)
```
X-Gemini-API-Key: AIzaSyXXXXXXXXX
```

**Response**
```json
{
  "interview_id": "uuid",
  "total_questions": 10,
  "current_question": {
    "question": "Explain the difference between REST and GraphQL...",
    "what_interviewer_looks_for": "..."
  },
  "question_number": 1
}
```

---

### `POST /api/interview/answer`

Submit one answer and receive evaluation + the next question.

**Header** (optional — BYOK)
```
X-Gemini-API-Key: AIzaSyXXXXXXXXX
```

> ✅ Use the **same key** you used for `/interview/start` within the same session.

**Body** — JSON
```json
{
  "session_id": "uuid",
  "interview_id": "uuid",
  "question_id": "q_0",
  "answer": "My answer text here..."
}
```

**Response**
```json
{
  "evaluation": {
    "score": 7,
    "feedback": "Good understanding of REST principles...",
    "strengths": ["..."],
    "improvements": ["..."]
  },
  "next_question": { "question": "...", "what_interviewer_looks_for": "..." },
  "question_number": 2,
  "is_complete": false,
  "final_score": null
}
```

When `is_complete` is `true`, `final_score` contains the overall percentage score (0–100).

---

### `GET /api/interview/summary/{session_id}`

Fetch the full interview record after completion.

**Response** — full interview_sessions row with questions, all answers, all scores, and final score.

---

### `GET /api/export/dossier/{session_id}`

Download the Career Dossier as a PDF.

**Response** — binary PDF file  
**Content-Type:** `application/pdf`  
**Content-Disposition:** `attachment; filename=ustaad_dossier_<name>.pdf`

```js
const res = await fetch(`${BACKEND_URL}/api/export/dossier/${session_id}`);
const blob = await res.blob();
const url = URL.createObjectURL(blob);
// Trigger download or open in new tab
```

---

## Complete Flow Cheatsheet

```
1. [Optional] GET  /api/keys/validate          — validate user's Gemini key
2.            POST /api/pipeline/start          — upload CV, get session_id
3.            GET  /api/pipeline/status/:id     — SSE: watch live progress
4.            GET  /api/pipeline/results/:id    — fetch full results JSON
5. [Optional] POST /api/interview/start/:id    — start AI interview
6. [Optional] POST /api/interview/answer       — submit answers (loop)
7. [Optional] GET  /api/interview/summary/:id  — get final interview report
8. [Optional] GET  /api/export/dossier/:id     — download Career Dossier PDF
```

---

## BYOK Quick Reference

```js
// ─── utils/api.js ────────────────────────────────────────────
const BACKEND = 'https://your-backend.com';

function getHeaders(extraHeaders = {}) {
  const key = localStorage.getItem('gemini_api_key');
  return {
    ...(key ? { 'X-Gemini-API-Key': key } : {}),
    ...extraHeaders,
  };
}

// Validate key
export async function validateKey(key) {
  const res = await fetch(`${BACKEND}/api/keys/validate`, {
    headers: { 'X-Gemini-API-Key': key },
  });
  return res.json(); // { valid, source, model, message/error }
}

// Start pipeline (multipart — do NOT set Content-Type manually)
export async function startPipeline(formData) {
  const res = await fetch(`${BACKEND}/api/pipeline/start`, {
    method: 'POST',
    headers: getHeaders(),   // ← key injected here
    body: formData,
  });
  return res.json();
}

// SSE status — no key needed
export function watchStatus(sessionId, onEvent) {
  const source = new EventSource(`${BACKEND}/api/pipeline/status/${sessionId}`);
  source.onmessage = (e) => onEvent(JSON.parse(e.data));
  return source; // caller calls source.close() on completion
}

// Start interview
export async function startInterview(sessionId) {
  const res = await fetch(`${BACKEND}/api/interview/start/${sessionId}`, {
    method: 'POST',
    headers: getHeaders(),
  });
  return res.json();
}

// Submit answer
export async function submitAnswer(payload) {
  const res = await fetch(`${BACKEND}/api/interview/answer`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  return res.json();
}
```
