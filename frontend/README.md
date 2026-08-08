# Ustaad Frontend — Next.js 14 Application

The web user interface for **Ustaad (اُستاد)** — an AI Career Operating System for Pakistani tech talent.

Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Framer Motion**, and **Lucide Icons**, implementing a custom parchment & brass editorial manuscript design language.

---

## 🎨 Design Philosophy & Features

- **Parchment & Brass Aesthetic**: Editorial, manuscript-styled UI with dark ink accents (`bg-ink`, `text-parchment`, `border-brass`).
- **Real-time SSE Dashboard**: Live agent progress tracking with Server-Sent Events (`frontend/lib/sse.ts`) and zero page reloads.
- **BYOK (Bring Your Own Key) Integration**:
  - Secure modal dialog (`ApiKeyModal.tsx`) with password-masked key fields (`type="password"`).
  - Quota-free key validation via `GET /api/keys/validate`.
  - Client-side key persistence in browser `localStorage`.
  - Automatic `X-Gemini-API-Key` header injection on pipeline start, interview start, and answer evaluation requests.
- **Interactive AI Mock Interview Terminal**: Multi-turn Q&A interface with live scorecards and feedback rubrics.
- **Responsive Layout**: Designed for seamless operation on mobile, tablet, and desktop viewports.

---

## 📁 Project Structure

```
frontend/
├── app/
│   ├── page.tsx               # Homepage with CV upload form & BYOK status caption
│   ├── about/page.tsx         # Detailed About page with architecture & team breakdown
│   ├── dashboard/[sessionId]/ # Live agent status & complete session metrics
│   ├── interview/[sessionId]/ # Interactive AI Mock Interview Terminal
│   └── dossier/[sessionId]/   # Career Dossier view & PDF export trigger
├── components/
│   ├── ApiKeyModal.tsx        # 🔑 Privacy-first BYOK Key settings modal
│   ├── Navbar.tsx             # Top navigation bar with BYOK status badge
│   ├── CVUpload.tsx           # Drag-and-drop PDF upload component
│   ├── LedgerLine.tsx         # Custom ledger line step indicator
│   ├── PipelineProgress.tsx   # Live agent stepper component
│   ├── MarketSnapshot.tsx     # Real-time job market demand component
│   ├── GapReport.tsx          # 0–100 Readiness score & skill gap report
│   ├── RoadmapTimeline.tsx    # 30/60/90-day learning roadmap
│   ├── CVComparison.tsx       # ATS-optimized CV bullet rewrite comparison
│   └── AnimatedSection.tsx    # Scroll & entrance animations via Framer Motion
└── lib/
    ├── api.ts                 # Fetch wrapper API functions & BYOK header handling
    └── sse.ts                 # Server-Sent Events subscriber for live status stream
```

---

## ⚡ Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher

### 1. Environment Setup

Create a `.env.local` file in the `frontend` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
# Or your deployed VPS backend URL:
# NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production

```bash
npm run build
npm start
```

