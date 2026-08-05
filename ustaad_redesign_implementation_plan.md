# Ustaad (اُستاد) — Frontend Redesign Implementation Plan
### Direction: "The Ledger" — From Glassmorphism to Manuscript-Modern
### Phases-Wise Plan for Antigravity Agent Execution

---

## 🧠 READ THIS FIRST — Agent Instructions

This is a **visual/styling redesign only**. All existing functionality, API calls, SSE logic, component state, and business logic must remain intact. You are changing how things look, not how they work.

Execute phases **in order**. Do not skip ahead. Each phase ends with a verification checklist — confirm it before moving to the next phase. If a phase touches a shared file (e.g. `globals.css`, `tailwind.config.ts`), later phases depend on it being correct — do not proceed with a broken design token system.

Reference `/mnt/skills/public/frontend-design/SKILL.md` principles throughout: one signature element executed well, responsive down to mobile, visible keyboard focus states, respect `prefers-reduced-motion`.

---

## 🎨 Design System Reference (Use Throughout All Phases)

### Design Concept: "The Ledger"
A fusion of academic mentorship warmth and modern tech precision. Think: a respected teacher's handwritten notebook margins meeting a clean, confident product dashboard.

**Explicitly avoid:**
- Glassmorphism / backdrop-blur / frosted glass cards
- Dark-navy-plus-indigo gradient (generic AI SaaS default)
- Cream-background-plus-terracotta-serif combo (overused AI-generated cliché)
- Generic circular progress indicators
- Excessive hover glows / scale transforms

### Color Tokens
```css
--ink-black: #0B0F14;        /* Primary background */
--parchment: #F5F0E6;        /* Contrast section background, cards */
--brass: #C9A961;            /* Primary accent — gold leaf on manuscripts */
--teal: #4A7C7C;             /* Secondary accent — technical/data feel */
--warm-gray: #8B8378;        /* Secondary text on dark */
--text-on-dark: #F5F0E6;
--text-on-light: #0B0F14;
--critical-red: #B85450;     /* Gap report — critical gaps (muted, not harsh) */
--moderate-amber: #C9A961;   /* Gap report — moderate gaps (reuses brass) */
--success-teal: #4A7C7C;     /* Gap report — strengths (reuses teal) */
```

### Typography Tokens
```css
--font-display: 'Fraunces', 'Newsreader', serif;   /* Headlines, section titles ONLY */
--font-body: 'Inter', 'General Sans', sans-serif;   /* All body copy */
--font-mono: 'JetBrains Mono', monospace;           /* Scores, stats, PKR figures, data */
```

**Usage rule:** Display face is used with restraint — headlines and section titles only, never body paragraphs. Data face (mono) is used specifically for numbers: readiness score, ATS score, salary figures, percentages. This creates a visual distinction between "narrative" text and "data" text throughout the product.

### Signature Element: The Ledger Line
A thin brass (`#C9A961`) horizontal or vertical rule with small tick/checkpoint marks along it — evokes both a manuscript's marginal annotations and a roadmap's progress checkpoints.

- Connects major page sections visually
- Becomes the pipeline progress indicator on the dashboard (replaces any circular/generic stepper)
- Fills in with a drawing animation as agents complete — like ink appearing on paper
- Reappears wherever "progress" or "sequence" is being communicated

---

## 📁 Files That Will Be Touched (Full Map)

```
frontend/
├── app/
│   ├── layout.tsx                    [Phase 1 — fonts, global providers]
│   ├── globals.css                   [Phase 1 — design tokens, base styles]
│   ├── page.tsx                      [Phase 2 — landing page]
│   ├── about/
│   │   └── page.tsx                  [Phase 6 — about page redesign]
│   ├── dashboard/[sessionId]/
│   │   └── page.tsx                  [Phase 3 — dashboard layout]
│   ├── interview/[sessionId]/
│   │   └── page.tsx                  [Phase 4 — interview page layout]
│   └── dossier/[sessionId]/
│       └── page.tsx                  [Phase 5 — dossier page]
├── components/
│   ├── CVUpload.tsx                  [Phase 2]
│   ├── JobRoleForm.tsx               [Phase 2]
│   ├── PipelineProgress.tsx          [Phase 3 — becomes the Ledger Line]
│   ├── MarketSnapshot.tsx            [Phase 3]
│   ├── GapReport.tsx                 [Phase 3]
│   ├── RoadmapTimeline.tsx           [Phase 3]
│   ├── CVComparison.tsx              [Phase 3]
│   ├── InterviewChat.tsx             [Phase 4]
│   ├── DossierExport.tsx             [Phase 5]
│   ├── LedgerLine.tsx                [Phase 1 — NEW shared component]
│   ├── Navbar.tsx                    [Phase 1 — if exists, else create]
│   └── Footer.tsx                    [Phase 1 — if exists, else create]
├── tailwind.config.ts                [Phase 1]
└── package.json                      [Phase 1 — font packages if needed]
```

---

---

# PHASE 1 — Design Foundation & Shared Components

**Goal:** All design tokens, fonts, and the new shared `LedgerLine` component exist and are verified working in isolation before touching any page. This is the foundation every later phase depends on.

---

## Step 1: Install/Configure Fonts

Update `app/layout.tsx` to load fonts via `next/font/google`:

```tsx
import { Fraunces, Inter, JetBrains_Mono } from 'next/font/google';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '700'],
});
```

Apply the variable classes to the `<html>` or `<body>` tag so they're available globally.

## Step 2: Update `tailwind.config.ts`

Add the full design token system:

```ts
theme: {
  extend: {
    colors: {
      ink: '#0B0F14',
      parchment: '#F5F0E6',
      brass: '#C9A961',
      teal: '#4A7C7C',
      'warm-gray': '#8B8378',
      'critical-red': '#B85450',
    },
    fontFamily: {
      display: ['var(--font-display)'],
      body: ['var(--font-body)'],
      mono: ['var(--font-mono)'],
    },
  },
}
```

## Step 3: Update `app/globals.css`

Remove ALL existing glassmorphism utility classes (search for `backdrop-blur`, `bg-opacity`, `.glass`, etc. and delete them). Add base styles:

```css
:root {
  --ink-black: #0B0F14;
  --parchment: #F5F0E6;
  --brass: #C9A961;
  --teal: #4A7C7C;
  --warm-gray: #8B8378;
}

body {
  background-color: var(--ink-black);
  color: var(--parchment);
  font-family: var(--font-body);
}

h1, h2, h3, .display-text {
  font-family: var(--font-display);
  letter-spacing: 0.01em;
}

.data-text {
  font-family: var(--font-mono);
}

/* Visible keyboard focus — required, do not skip */
*:focus-visible {
  outline: 2px solid var(--brass);
  outline-offset: 2px;
}

/* Respect reduced motion — required, do not skip */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Step 4: Build the `LedgerLine` Component

Create `components/LedgerLine.tsx` — this is the signature element used across the entire redesign:

```tsx
"use client";
import { motion } from "framer-motion";

interface LedgerLineProps {
  orientation?: "horizontal" | "vertical";
  checkpoints: {
    label: string;
    status: "pending" | "active" | "complete";
  }[];
}

export default function LedgerLine({ orientation = "horizontal", checkpoints }: LedgerLineProps) {
  const isHorizontal = orientation === "horizontal";

  return (
    <div className={`flex ${isHorizontal ? "flex-row items-center" : "flex-col items-start"} gap-0 w-full`}>
      {checkpoints.map((checkpoint, index) => (
        <div key={index} className={`flex ${isHorizontal ? "flex-col items-center" : "flex-row items-center"} flex-1`}>
          {/* Checkpoint tick mark */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0.4 }}
            animate={{
              scale: checkpoint.status === "active" ? 1.1 : 1,
              opacity: checkpoint.status === "pending" ? 0.4 : 1,
            }}
            transition={{ duration: 0.4 }}
            className={`
              w-3 h-3 rounded-full border-2 border-brass z-10
              ${checkpoint.status === "complete" ? "bg-brass" : "bg-ink"}
            `}
          />
          <span className="text-xs font-body text-warm-gray mt-2 text-center">
            {checkpoint.label}
          </span>

          {/* Connecting line — the "ink filling in" effect */}
          {index < checkpoints.length - 1 && (
            <div className={`relative ${isHorizontal ? "h-[1px] w-full -mt-6" : "w-[1px] h-full -ml-6"} bg-warm-gray/20`}>
              <motion.div
                initial={{ scaleX: isHorizontal ? 0 : 1, scaleY: isHorizontal ? 1 : 0 }}
                animate={{
                  scaleX: isHorizontal ? (checkpoint.status === "complete" ? 1 : 0) : 1,
                  scaleY: isHorizontal ? 1 : (checkpoint.status === "complete" ? 1 : 0),
                }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                style={{ transformOrigin: isHorizontal ? "left" : "top" }}
                className="absolute inset-0 bg-brass"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

## Step 5: Build/Update `Navbar.tsx` and `Footer.tsx`

Simple, consistent across all pages:

```tsx
// components/Navbar.tsx
export default function Navbar() {
  return (
    <nav className="flex items-center justify-between px-8 py-6 bg-ink border-b border-warm-gray/10">
      <a href="/" className="font-display text-2xl text-parchment">
        اُستاد <span className="text-brass text-sm font-body">Ustaad</span>
      </a>
      <div className="flex gap-6 font-body text-sm text-warm-gray">
        <a href="/about" className="hover:text-brass transition-colors">About</a>
        <a href="https://github.com/Muhammad-Hassan12/Ustaad" className="hover:text-brass transition-colors">GitHub</a>
      </div>
    </nav>
  );
}
```

```tsx
// components/Footer.tsx
export default function Footer() {
  return (
    <footer className="px-8 py-6 bg-ink border-t border-warm-gray/10 flex justify-between items-center text-xs text-warm-gray font-body">
      <span>Ustaad (اُستاد) © 2026 AgenticEra Systems</span>
      <span>Built with Gemini · Made in Karachi 🇵🇰</span>
    </footer>
  );
}
```

---

## ✅ Phase 1 Complete When:
- [ ] Fonts load correctly — inspect element shows Fraunces on headings, Inter on body, JetBrains Mono available
- [ ] `tailwind.config.ts` has all color tokens working (`bg-ink`, `text-brass`, etc. all resolve)
- [ ] No `backdrop-blur` or glass-related classes remain anywhere in `globals.css`
- [ ] `LedgerLine.tsx` renders in isolation (test on a blank page) with a sample array of 3 checkpoints, shows correct fill animation
- [ ] Keyboard focus outline visible in brass color when tabbing through any interactive element
- [ ] Navbar and Footer render and are visually consistent with the ink/parchment/brass palette

---

---

# PHASE 2 — Landing Page Redesign

**Goal:** `app/page.tsx` fully redesigned. CV upload + form flow visually transformed but functionally identical.

---

## Step 1: Hero Section Layout

Redesign the hero — asymmetric layout, NOT centered-everything (that's the generic template).

```tsx
<section className="min-h-[80vh] flex flex-col justify-center px-8 md:px-16 bg-ink relative">
  {/* Large serif headline */}
  <h1 className="font-display text-6xl md:text-8xl text-parchment leading-none">
    Ustaad
    <span className="block text-3xl md:text-4xl text-warm-gray mt-2">اُستاد</span>
  </h1>

  {/* Tagline positioned as a marginal annotation — offset, not centered beneath */}
  <div className="mt-8 md:ml-4 md:pl-6 md:border-l-2 md:border-brass max-w-md">
    <p className="font-body text-xl text-brass">
      The career coach Pakistan never had.
    </p>
    <p className="font-body text-sm text-warm-gray mt-3 leading-relaxed">
      Upload your CV. Get a real-time market analysis, skill gap report,
      personalized roadmap, and AI mock interview — all in under 5 minutes.
    </p>
  </div>

  {/* Ledger line as decorative divider beneath hero content */}
  <div className="mt-16 max-w-2xl">
    <LedgerLine
      orientation="horizontal"
      checkpoints={[
        { label: "Upload CV", status: "active" },
        { label: "Get Analysis", status: "pending" },
        { label: "Land the Role", status: "pending" },
      ]}
    />
  </div>
</section>
```

## Step 2: CV Upload Component Redesign

Update `CVUpload.tsx` — replace any glass/blur drop zone with a parchment-toned bordered zone:

```tsx
<div className="border-2 border-dashed border-brass/40 bg-parchment/[0.03] rounded-sm p-12
                 hover:border-brass hover:bg-parchment/[0.06] transition-colors duration-300
                 cursor-pointer">
  {/* react-dropzone logic unchanged — only className styling updates */}
  <p className="font-body text-parchment text-center">
    Drop your CV here, or <span className="text-brass underline">browse</span>
  </p>
  <p className="font-mono text-xs text-warm-gray text-center mt-2">PDF · Max 5MB</p>
</div>
```

**Important:** `rounded-sm` not `rounded-2xl` — sharp, manuscript-like edges, not soft app-like curves. Apply this rounding rule consistently across ALL components in every phase.

## Step 3: Job Role Form Redesign

Update `JobRoleForm.tsx` — parchment card, brass focus states, mono font for any numeric input:

```tsx
<div className="bg-parchment text-ink rounded-sm p-8 border border-brass/20">
  <label className="font-body text-sm text-ink/70 block mb-2">Target Role</label>
  <input
    type="text"
    className="w-full bg-transparent border-b border-ink/20 pb-2 font-body text-ink
               focus:border-brass focus:outline-none transition-colors"
    placeholder="e.g. AI Engineer"
  />
  {/* Repeat pattern for City dropdown, Experience (use font-mono for the number input), Education */}
</div>
```

## Step 4: Submit Button

```tsx
<button className="bg-brass text-ink font-body font-semibold px-8 py-4 rounded-sm
                    hover:bg-brass/90 transition-colors duration-300
                    flex items-center gap-2">
  Start My Analysis
  <span className="font-mono">→</span>
</button>
```

---

## ✅ Phase 2 Complete When:
- [ ] Hero renders with asymmetric layout — headline left/top, tagline offset with brass left-border, not centered
- [ ] LedgerLine appears beneath hero showing 3 checkpoints in "pending/active" state
- [ ] CV upload zone has NO blur/glass effect — solid dashed brass border on ink background
- [ ] Form inputs use parchment card with ink text, brass focus underline (not glow/ring)
- [ ] Submit button is solid brass, sharp corners (rounded-sm), no gradient
- [ ] Form submission still correctly calls `startPipeline()` and redirects to `/dashboard/[sessionId]` — functionality untouched
- [ ] Mobile responsive — hero stacks correctly, form remains usable at 375px width

---

---

# PHASE 3 — Dashboard Redesign (Pipeline Progress + Result Cards)

**Goal:** The dashboard is the most complex page — this is where the Ledger Line signature element does its main job as the live pipeline progress indicator. All SSE logic stays untouched; only presentation changes.

---

## Step 1: Convert `PipelineProgress.tsx` to Use LedgerLine

This is the most important change in the entire redesign — replace whatever generic stepper currently exists with the `LedgerLine` component, driven by live SSE state:

```tsx
"use client";
import { useEffect, useState } from "react";
import LedgerLine from "./LedgerLine";
import { subscribeToPipeline, PipelineEvent } from "@/lib/sse";

const AGENT_LABELS = [
  { key: "profile", label: "Profile" },
  { key: "market", label: "Market" },
  { key: "gap", label: "Gap Analysis" },
  { key: "roadmap", label: "Roadmap" },
  { key: "cv_rewrite", label: "CV Rewrite" },
];

export default function PipelineProgress({ sessionId }: { sessionId: string }) {
  const [agentStatus, setAgentStatus] = useState<Record<string, "pending" | "active" | "complete">>(
    Object.fromEntries(AGENT_LABELS.map(a => [a.key, "pending"]))
  );
  const [liveMessage, setLiveMessage] = useState("");

  useEffect(() => {
    const cleanup = subscribeToPipeline(
      sessionId,
      (event: PipelineEvent) => {
        if (event.agent && event.event === "agent_start") {
          setAgentStatus(prev => ({ ...prev, [event.agent!]: "active" }));
          setLiveMessage(event.message);
        }
        if (event.agent && event.event === "agent_complete") {
          setAgentStatus(prev => ({ ...prev, [event.agent!]: "complete" }));
          setLiveMessage(event.message);
        }
      },
      () => {}
    );
    return cleanup;
  }, [sessionId]);

  const checkpoints = AGENT_LABELS.map(a => ({
    label: a.label,
    status: agentStatus[a.key],
  }));

  return (
    <div className="bg-ink py-8 px-4 border-b border-warm-gray/10">
      <LedgerLine orientation="horizontal" checkpoints={checkpoints} />
      {liveMessage && (
        <p className="font-mono text-xs text-brass mt-6 text-center animate-pulse">
          {liveMessage}
        </p>
      )}
    </div>
  );
}
```

**Do not modify** the SSE subscription logic itself (`subscribeToPipeline`) — only how status is visually rendered.

## Step 2: Redesign Result Cards — Remove Glass, Add Ledger Card Style

Apply this exact card pattern to `MarketSnapshot.tsx`, `GapReport.tsx`, `RoadmapTimeline.tsx`, `CVComparison.tsx`:

```tsx
<div className="bg-parchment text-ink rounded-sm border border-brass/30 p-8 relative">
  {/* Small brass corner tick — evokes a stamped ledger entry */}
  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-brass" />

  <h3 className="font-display text-2xl mb-4">Market Snapshot</h3>
  {/* content */}
</div>
```

## Step 3: `MarketSnapshot.tsx` Specifics

```tsx
<div className="grid grid-cols-2 gap-4">
  <div>
    <span className="font-mono text-3xl text-brass">{demandLevel}</span>
    <p className="font-body text-xs text-ink/60 mt-1">Demand Level</p>
  </div>
  <div>
    <span className="font-mono text-3xl">
      {salaryMin.toLocaleString()}–{salaryMax.toLocaleString()}
    </span>
    <p className="font-body text-xs text-ink/60 mt-1">PKR / month</p>
  </div>
</div>
<div className="mt-4 flex flex-wrap gap-2">
  {topSkills.map(skill => (
    <span className="font-body text-xs bg-ink/5 border border-ink/10 px-3 py-1 rounded-sm">
      {skill}
    </span>
  ))}
</div>
```

## Step 4: `GapReport.tsx` Specifics — Readiness Score

Replace any circular progress indicator with a large mono numeral + ledger tick marks:

```tsx
<div className="flex items-baseline gap-2">
  <span className="font-mono text-6xl text-brass">{readinessScore}</span>
  <span className="font-mono text-2xl text-ink/40">/100</span>
</div>
<p className="font-body text-sm text-ink/70 mt-4">{summary}</p>

{/* Critical gaps use critical-red, moderate uses brass, strengths use teal */}
<div className="mt-6 space-y-2">
  {criticalGaps.map(gap => (
    <div className="flex items-start gap-2 border-l-2 border-critical-red pl-3">
      <span className="font-body text-sm">{gap.skill}</span>
      <span className="font-body text-xs text-ink/50">— {gap.reason}</span>
    </div>
  ))}
</div>
```

## Step 5: `RoadmapTimeline.tsx` Specifics — Vertical Ledger Line for Weeks

```tsx
<LedgerLine
  orientation="vertical"
  checkpoints={roadmap.thirty_day_plan.map(week => ({
    label: `Week ${week.week}: ${week.focus}`,
    status: "pending", // or derive from completion tracking if added later
  }))}
/>
```

## Step 6: `CVComparison.tsx` Specifics — Before/After

```tsx
<div className="grid md:grid-cols-2 gap-6">
  <div className="opacity-50">
    <p className="font-mono text-xs text-warm-gray uppercase mb-2">Original</p>
    <p className="font-body text-sm text-ink/60">{original}</p>
  </div>
  <div className="border-l-2 border-brass pl-6">
    <p className="font-mono text-xs text-brass uppercase mb-2">Rewritten</p>
    <p className="font-body text-sm">{rewritten}</p>
  </div>
</div>
<div className="mt-4">
  <span className="font-mono text-2xl text-brass">{atsScore}</span>
  <span className="font-body text-xs text-ink/60 ml-2">ATS Score Estimate</span>
</div>
```

---

## ✅ Phase 3 Complete When:
- [ ] `PipelineProgress.tsx` renders the LedgerLine with live SSE-driven checkpoint states (pending → active → complete)
- [ ] Ledger line visually "fills in" (ink drawing animation) as each agent completes — verify by watching a real pipeline run
- [ ] All 4 result cards (Market, Gap, Roadmap, CV) use solid parchment cards, brass corner tick, NO blur
- [ ] Readiness score and ATS score render as large brass monospace numerals, not circular progress rings
- [ ] Gap report color-codes correctly: critical = critical-red, moderate/strengths = brass/teal
- [ ] Roadmap uses vertical LedgerLine for week-by-week display
- [ ] All cards remain functionally connected to real session data — no mock data left in place
- [ ] Mobile: cards stack in single column, LedgerLine switches to vertical orientation if needed at small breakpoints

---

---

# PHASE 4 — Interview Page Redesign

**Goal:** Chat-style interview UI redesigned with the "margin notes" concept — user messages feel handwritten/personal, AI responses stay clean and structured.

---

## Step 1: Progress Indicator

Reuse `LedgerLine` at the top, but with 15 checkpoints (or grouped into 3: Technical/Behavioral/HR):

```tsx
<LedgerLine
  orientation="horizontal"
  checkpoints={[
    { label: "Technical", status: technicalStatus },
    { label: "Behavioral", status: behavioralStatus },
    { label: "HR", status: hrStatus },
  ]}
/>
<p className="font-mono text-xs text-warm-gray text-center mt-4">
  Question {questionNumber} of 15
</p>
```

## Step 2: Question Card

```tsx
<div className="bg-parchment text-ink rounded-sm border border-brass/30 p-8">
  <span className="font-mono text-xs text-brass uppercase">{difficulty}</span>
  <h3 className="font-display text-2xl mt-2">{question}</h3>
</div>
```

## Step 3: User Answer — "Handwritten Margin Note" Style

```tsx
<motion.div
  initial={{ opacity: 0, rotate: 0 }}
  animate={{ opacity: 1, rotate: -1.5 }}
  className="bg-ink border-l-2 border-brass ml-8 mt-6 p-6 max-w-lg"
>
  <p className="font-body text-sm text-parchment">{userAnswer}</p>
</motion.div>
```

Slight negative rotation (-1 to -2 degrees) gives the "jotted note" feel without being illegible or gimmicky. Do not overdo — this is the ONE playful touch in an otherwise disciplined UI.

## Step 4: Feedback Card — Clean, Structured (contrast to user's handwritten note)

```tsx
<div className="bg-parchment text-ink rounded-sm p-6 mt-4 border border-teal/30">
  <div className="flex items-center gap-3">
    <span className="font-mono text-3xl text-teal">{score}</span>
    <span className="font-mono text-sm text-ink/40">/ 10</span>
  </div>
  <p className="font-body text-sm mt-3"><strong>Good:</strong> {whatWasGood}</p>
  <p className="font-body text-sm mt-1"><strong>Missing:</strong> {whatWasMissing}</p>
  <ul className="mt-3 space-y-1">
    {hints.map(hint => (
      <li className="font-body text-xs text-ink/60">💡 {hint}</li>
    ))}
  </ul>
</div>
```

## Step 5: Final Score Screen

```tsx
<div className="text-center py-16">
  <span className="font-mono text-8xl text-brass">{finalScore}</span>
  <p className="font-display text-2xl mt-4">Interview Complete</p>
  <a href={`/dossier/${sessionId}`} className="inline-block mt-8 bg-brass text-ink px-8 py-4 rounded-sm font-body">
    View Career Dossier →
  </a>
</div>
```

---

## ✅ Phase 4 Complete When:
- [ ] LedgerLine progress indicator shows Technical/Behavioral/HR sections with live status
- [ ] Question cards render on parchment with brass difficulty label
- [ ] User answers appear as slightly rotated "margin note" style bubbles — verify rotation isn't excessive (max 2deg)
- [ ] Feedback cards are clean/structured with teal-toned score, NOT the handwritten style
- [ ] All 15 questions flow correctly, existing `submitAnswer()` API logic untouched
- [ ] Final score screen shows large brass mono numeral and links to dossier
- [ ] Mobile: chat flow remains readable, rotation effect reduced/removed on small screens if it hurts legibility

---

---

# PHASE 5 — Dossier Page Redesign

**Goal:** The final report page — should feel like the physical "ledger book" payoff of the whole journey. Print-friendly consideration since users may want to save/print this.

---

## Step 1: Page Structure

```tsx
<div className="max-w-3xl mx-auto bg-parchment text-ink px-12 py-16 rounded-sm border border-brass/20">
  <header className="border-b-2 border-brass pb-6 mb-8">
    <h1 className="font-display text-4xl">Career Dossier</h1>
    <p className="font-mono text-sm text-ink/60 mt-2">{candidateName} · {targetRole} · {targetCity}</p>
  </header>

  {/* Each section separated by a horizontal LedgerLine tick, not just a plain <hr> */}
  <section className="mb-10">
    <h2 className="font-display text-2xl mb-4">Market Intelligence</h2>
    {/* content */}
  </section>

  {/* repeat for Gap Analysis, Roadmap, CV Rewrite, Interview Summary */}
</div>
```

## Step 2: Download Button

```tsx
<button className="fixed bottom-8 right-8 bg-brass text-ink px-6 py-3 rounded-sm font-body
                    shadow-lg hover:bg-brass/90 transition-colors">
  Download PDF ↓
</button>
```

**Note:** The actual PDF generated by `pdf_generator.py` (backend/ReportLab) is a separate concern — this phase only redesigns the on-page preview. If time allows in a later iteration, update ReportLab styling to match (parchment background, brass accent lines) — but that's backend work, out of scope for this frontend-only redesign phase.

---

## ✅ Phase 5 Complete When:
- [ ] Dossier page renders all 5 sections (Market, Gap, Roadmap, CV, Interview) in the parchment ledger-book style
- [ ] Section dividers use brass ledger-tick styling, not plain HTML `<hr>`
- [ ] Download PDF button correctly triggers existing `getDossierUrl()` call — functionality unchanged
- [ ] Page is legible and well-spaced if a user tries browser print (Ctrl+P) — not required to be pixel-perfect, just usable

---

---

# PHASE 6 — About Page Redesign

**Goal:** Full About page rebuilt in the new design system. This replaces the earlier glassmorphism-based About page prompt entirely — same content, new visual treatment.

---

## Step 1: Hero Section

```tsx
<section className="min-h-[60vh] flex flex-col justify-center px-8 md:px-16 bg-ink">
  <h1 className="font-display text-5xl md:text-7xl text-parchment">
    Meet Ustaad
    <span className="block text-2xl text-warm-gray mt-2 font-body">اُستاد</span>
  </h1>
  <p className="font-body text-xl text-brass mt-6 max-w-xl">
    The career coach Pakistan never had.
  </p>
  <p className="font-body text-warm-gray mt-4 max-w-xl leading-relaxed">
    Ustaad is an AI-powered career intelligence platform built for tech
    graduates across Pakistan — whether you're from CS, IT, Software
    Engineering, Data Science, or any tech domain. Upload your CV, pick
    your target role, and Ustaad's 7-agent AI pipeline gives you a
    real-time market snapshot, honest skill gap analysis, a personalized
    learning roadmap, an ATS-optimized CV rewrite, and a mock interview
    with scored feedback — all in under 5 minutes.
  </p>
  <div className="flex gap-4 mt-8">
    <a href="/" className="bg-brass text-ink px-6 py-3 rounded-sm font-body">Try Ustaad →</a>
    <a href="https://github.com/Muhammad-Hassan12/Ustaad" className="border border-brass text-brass px-6 py-3 rounded-sm font-body">
      View on GitHub →
    </a>
  </div>
</section>
```

## Step 2: The Problem Section

```tsx
<section className="px-8 md:px-16 py-16 bg-ink border-l-4 border-brass ml-4 md:ml-16 max-w-2xl">
  <h2 className="font-display text-3xl mb-4">Why We Built This</h2>
  <p className="font-body text-warm-gray leading-relaxed">
    Every year, thousands of tech graduates in Pakistan enter the job
    market without a clear picture of what employers actually want.
    Generic CVs get ignored. Skills don't match market demand. Interview
    prep is guesswork. And there's no single tool that understands the
    Pakistani job market deeply enough to give real, actionable guidance.
    Ustaad changes that.
  </p>
</section>
```

## Step 3: The 7 Agents — Ledger-Style Grid

```tsx
<section className="px-8 md:px-16 py-16 bg-ink">
  <h2 className="font-display text-3xl mb-2">7 AI Agents. One Career Dossier.</h2>
  <p className="font-body text-warm-gray mb-10">
    Powered by Gemini 2.5 Flash — each agent handles one critical piece
    of your career puzzle.
  </p>

  <LedgerLine
    orientation="vertical"
    checkpoints={[
      { label: "Profile Agent — Parses your CV into a structured profile", status: "complete" },
      { label: "Market Intelligence — Real-time Pakistani job board research", status: "complete" },
      { label: "Gap Analysis — Readiness score against market demand", status: "complete" },
      { label: "Roadmap Agent — 30/60/90-day personalized learning plan", status: "complete" },
      { label: "CV Rewrite — ATS-optimized before/after comparison", status: "complete" },
      { label: "Interview Agent — Multi-turn mock interview with scoring", status: "complete" },
      { label: "Orchestrator — Supervises the pipeline, assembles the dossier", status: "complete" },
    ]}
  />
</section>
```

Using the LedgerLine here (vertical, all "complete" status since it's descriptive not live) ties the About page visually back to the dashboard's signature element — reinforcing brand consistency.

## Step 4: Tech Stack Pills

```tsx
<section className="px-8 md:px-16 py-16 bg-ink text-center">
  <h2 className="font-display text-2xl mb-8">Built With</h2>
  <div className="flex flex-wrap justify-center gap-3">
    {["Gemini 2.5 Flash", "FastAPI", "Next.js 14", "Supabase", "Serper.dev", "PyMuPDF", "Tailwind CSS"].map(tech => (
      <span className="font-mono text-xs border border-brass/40 text-brass px-4 py-2 rounded-sm">
        {tech}
      </span>
    ))}
  </div>
</section>
```

## Step 5: Built For — Competition Card

```tsx
<section className="px-8 md:px-16 py-16 flex justify-center">
  <div className="bg-parchment text-ink rounded-sm border border-brass p-10 text-center max-w-md">
    <p className="font-mono text-xs text-ink/50 uppercase">Submitted to</p>
    <p className="font-display text-2xl mt-2">Kaggle × Google</p>
    <p className="font-body text-sm mt-1">5-Day AI Agents Vibe Coding Capstone 2026</p>
    <span className="inline-block mt-4 font-mono text-xs bg-brass/10 text-brass px-3 py-1 rounded-sm">
      🏆 Capstone Project
    </span>
  </div>
</section>
```

## Step 6: The Team

```tsx
<section className="px-8 md:px-16 py-16 bg-ink">
  <h2 className="font-display text-3xl text-center mb-2">The Team</h2>
  <p className="font-body text-warm-gray text-center mb-12">
    Built by two developers from Karachi, Pakistan 🇵🇰
  </p>

  <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
    {/* Card 1 — Hassan */}
    <div className="bg-parchment text-ink rounded-sm border border-brass/30 p-8">
      <div className="w-14 h-14 rounded-full bg-brass text-ink flex items-center justify-center font-display text-xl">
        MH
      </div>
      <h3 className="font-display text-xl mt-4">Syed Muhammad Hassan</h3>
      <p className="font-mono text-xs text-teal mt-1">Backend Engineer & AI Agents</p>
      <p className="font-body text-sm text-ink/70 mt-3">
        GenAI developer and co-founder of AgenticEra Systems. Built the
        entire 7-agent pipeline, FastAPI backend, and orchestration logic.
      </p>
      <div className="flex gap-4 mt-4">
        <a href="https://github.com/Muhammad-Hassan12" className="text-ink/60 hover:text-brass">GitHub</a>
        <a href="https://www.linkedin.com/in/syed-muhammad-hassan-aa112928b/" className="text-ink/60 hover:text-brass">LinkedIn</a>
      </div>
    </div>

    {/* Card 2 — Abdul Mannan (identical structure, teal-toned avatar) */}
    <div className="bg-parchment text-ink rounded-sm border border-brass/30 p-8">
      <div className="w-14 h-14 rounded-full bg-teal text-parchment flex items-center justify-center font-display text-xl">
        AM
      </div>
      <h3 className="font-display text-xl mt-4">Abdul Mannan Fazlani</h3>
      <p className="font-mono text-xs text-teal mt-1">Frontend Engineer & UI/UX</p>
      <p className="font-body text-sm text-ink/70 mt-3">
        Full-stack and agentic systems developer at AgenticEra Systems.
        Built the entire Next.js frontend, dashboard, and interview UI.
      </p>
      <div className="flex gap-4 mt-4">
        <a href="https://github.com/abdulmannan991" className="text-ink/60 hover:text-brass">GitHub</a>
        <a href="https://www.linkedin.com/in/abdul-mannan-fazlani-47b274293/" className="text-ink/60 hover:text-brass">LinkedIn</a>
      </div>
    </div>
  </div>

  <p className="text-center font-body text-sm text-warm-gray mt-12">
    A product by AgenticEra Systems — AI automation for the real world.
  </p>
</section>
```

Use `lucide-react` `Github` and `Linkedin` icons alongside the text links instead of plain text, for visual polish — swap the plain `"GitHub"` / `"LinkedIn"` text above for icon + label.

---

## ✅ Phase 6 Complete When:
- [ ] About page hero matches landing page's asymmetric headline treatment
- [ ] Problem section uses the brass left-border "annotation" style consistent with landing page
- [ ] 7 Agents section uses vertical LedgerLine (all marked complete, descriptive not live)
- [ ] Tech stack pills render in mono font with brass border
- [ ] Competition card is a standalone parchment card, centered
- [ ] Both team cards render correctly with real avatar initials, bios, and all 4 social links working and opening in new tabs
- [ ] Fully responsive — team cards stack on mobile, hero text scales down appropriately
- [ ] `/about` route accessible from Navbar on every page

---

---

# PHASE 7 — Final Polish, Cross-Page Consistency & QA

**Goal:** Full visual audit across every page. Catch inconsistencies, verify motion/accessibility requirements, confirm nothing from the old glassmorphism design remains anywhere.

---

## Step 1: Global Search for Leftover Glass Styling

Run this search across the entire `frontend/` directory and manually verify/remove any remaining instances:

```bash
grep -r "backdrop-blur" frontend/
grep -r "bg-opacity" frontend/
grep -r "glass" frontend/ --include="*.tsx"
```

## Step 2: Cross-Page Consistency Checklist

Go through every page (`/`, `/about`, `/dashboard/[id]`, `/interview/[id]`, `/dossier/[id]`) and verify:

- [ ] Navbar and Footer identical across all pages
- [ ] Same brass/parchment/ink palette used consistently — no page reverting to old indigo/navy colors
- [ ] `rounded-sm` used consistently — no page has `rounded-2xl` or `rounded-full` leftover on cards (buttons/avatars are the only exception where full rounding is intentional)
- [ ] Fraunces used ONLY on headings, never accidentally applied to body paragraphs
- [ ] JetBrains Mono used consistently for ALL numeric data (scores, salaries, percentages) across every page

## Step 3: Motion & Accessibility Audit

- [ ] Toggle `prefers-reduced-motion` in OS settings, reload every page — confirm animations are disabled/instant
- [ ] Tab through every page using only keyboard — confirm brass focus outline appears on every interactive element (links, buttons, form inputs, dropzone)
- [ ] Test at 375px width (mobile) on every page — confirm no horizontal scroll, no cut-off text, LedgerLine reflows sensibly

## Step 4: Performance Check

- [ ] Confirm font loading doesn't cause layout shift (use `next/font` correctly, which handles this automatically — verify no manual `<link>` font tags left over from old design)
- [ ] Run Lighthouse in Chrome DevTools on the landing page — target 90+ on Performance and Accessibility

## Step 5: Screenshot Review

Take full-page screenshots of all 5 pages at both desktop (1440px) and mobile (375px) widths. Do a final visual pass comparing against the design principles:
- Is there exactly ONE signature element carrying the visual identity (the Ledger Line)? Confirm it's not diluted by other competing "clever" elements.
- Does every page feel like it belongs to the same product?
- Is the parchment/ink contrast comfortable to read for extended periods (dossier page especially)?

---

## ✅ Phase 7 Complete When:
- [ ] Zero instances of glassmorphism/blur remain in the codebase
- [ ] All 5 pages pass the cross-page consistency checklist
- [ ] Reduced motion respected sitewide
- [ ] Keyboard focus states visible sitewide
- [ ] Mobile responsive sitewide, verified at 375px
- [ ] Lighthouse Performance + Accessibility both 90+
- [ ] Final screenshot review confirms cohesive brand identity across all pages

---

---

## 📊 Phase Summary

| Phase | What Gets Built | Depends On |
|-------|-----------------|------------|
| Phase 1 | Design tokens, fonts, LedgerLine component, Navbar/Footer | Nothing — do first |
| Phase 2 | Landing page redesign | Phase 1 |
| Phase 3 | Dashboard + all result cards + live pipeline LedgerLine | Phase 1 |
| Phase 4 | Interview chat UI redesign | Phase 1, LedgerLine pattern from Phase 3 |
| Phase 5 | Dossier page redesign | Phase 1 |
| Phase 6 | About page full redesign | Phase 1, LedgerLine pattern from Phase 3 |
| Phase 7 | Cross-page QA, accessibility, performance audit | All previous phases |

**Estimated time:** 2-3 days for a solo pass, faster if split — Hassan can do Phase 1 + 3 (dashboard is the most complex/functional), Abdul Mannan can take Phase 2 + 4 + 5 + 6 (more purely visual pages), then both do Phase 7 together.

---

*Ustaad Redesign — "The Ledger" — AgenticEra Systems, Karachi*
