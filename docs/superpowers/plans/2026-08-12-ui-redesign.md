# CreditIQ UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `packages/ui` as a routed, three-page site (Home, How It Works, Console) in the approved "credit file on a desk" visual language, with every real piece of functionality (17 personas, decisions, reason codes, trace, overrides, monitoring) wired to the live API — functionality proven working in a real browser before visual polish is layered on.

**Architecture:** Same React 18 + Vite app, same `@creditiq/shared` types, same `api.ts` fetch layer. Add `react-router-dom` for client-side routing. New `src/styles/` holds design tokens and shared primitives (paper card, desk chrome, buttons, mono utility). Existing components (`PersonaPicker`, `DecisionPanel`, `ReasonCodesList`, `WaterfallTrace`, `MonitoringPanel`, `OverridePanel`) are restructured into `src/pages/Console.tsx` and restyled in place — their fetch/loading/error logic does not change.

**Tech Stack:** React 18, react-router-dom (new dependency), Vite, TypeScript. IBM Plex Serif/Sans/Mono loaded via Google Fonts `<link>` in `index.html` (preconnect + stylesheet, not `@import`, for load performance). No new backend dependencies — `packages/shared`, `packages/engine`, `packages/api` are untouched.

## Global Constraints

- No changes to `packages/shared`, `packages/engine`, or `packages/api` — this plan touches `packages/ui` only. All 118 existing tests (`npm test` at repo root) must continue passing unmodified throughout.
- Color tokens are fixed, exactly: `--desk:#16241C`, `--paper:#EFEAE0`, `--ink:#1B241D`, `--ballpoint:#2B4C77`, `--stamp-red:#A3271D`, `--stamp-green:#2F6B3E` (spec §3).
- Typography: IBM Plex Serif for display only (hero headline + stamp text, nowhere else), IBM Plex Sans for body, IBM Plex Mono for all data (scores, amounts, reason codes, reference numbers, dates) (spec §3).
- Every task that touches a component wired to the live API must be verified against the real running dev servers (`npm run dev -w packages/api`, `npm run dev -w packages/ui`), not just `tsc --build` — this codebase's own convention (`packages/ui` has no automated test suite; see README) is manual browser verification, and this plan follows that convention with concrete, scripted verification steps per task.
- `prefers-reduced-motion: reduce` must disable the stamp animation and scroll-reveal transitions, showing final states immediately (spec §3).
- Functionality is built and proven first (Phase 1), visual system layered on second (Phase 2) — per explicit user direction, do not reorder.

---

## File Structure

```
packages/ui/
├── package.json                  [MODIFY: add react-router-dom]
├── index.html                    [MODIFY: add IBM Plex font links]
├── src/
│   ├── main.tsx                  [MODIFY: wrap in BrowserRouter]
│   ├── App.tsx                   [MODIFY: becomes route table only]
│   ├── api.ts                    [unchanged]
│   ├── styles/
│   │   ├── tokens.css            [CREATE: color/font custom properties]
│   │   └── global.css            [CREATE: reset + shared primitives]
│   ├── components/
│   │   ├── Layout.tsx            [CREATE: persistent desk nav + <Outlet/>]
│   │   ├── PersonaPicker.tsx     [MODIFY: card-based, featured + browse-all]
│   │   ├── DecisionPanel.tsx     [MODIFY: paper card + stamp verdict]
│   │   ├── ReasonCodesList.tsx   [MODIFY: ledger rows]
│   │   ├── WaterfallTrace.tsx    [MODIFY: checklist]
│   │   ├── MonitoringPanel.tsx   [MODIFY: ledger bar rows]
│   │   └── OverridePanel.tsx     [MODIFY: paper form]
│   └── pages/
│       ├── Home.tsx              [CREATE]
│       ├── HowItWorks.tsx        [CREATE]
│       └── Console.tsx           [CREATE: Decisions/Monitoring sub-view]
```

---

# PHASE 1 — Functionality first (minimal styling)

### Task 1: Routing skeleton

**Files:**
- Modify: `packages/ui/package.json`
- Create: `packages/ui/src/components/Layout.tsx`
- Create: `packages/ui/src/pages/Home.tsx` (placeholder body, real route)
- Create: `packages/ui/src/pages/HowItWorks.tsx` (placeholder body, real route)
- Create: `packages/ui/src/pages/Console.tsx` (placeholder body, real route)
- Modify: `packages/ui/src/App.tsx`
- Modify: `packages/ui/src/main.tsx`

**Interfaces:**
- Produces: three real routes (`/`, `/how-it-works`, `/console`) with working navigation, consumed by every later task.

- [ ] **Step 1: Add `react-router-dom`**

Edit `packages/ui/package.json`, add to `dependencies`:
```json
"react-router-dom": "^6.26.2"
```

- [ ] **Step 2: Install**

Run: `npm install` (from repo root)
Expected: installs cleanly, no errors.

- [ ] **Step 3: Write `packages/ui/src/components/Layout.tsx`**

```tsx
import { NavLink, Outlet } from 'react-router-dom';

export function Layout() {
  return (
    <div>
      <nav>
        <span>CREDITIQ</span>
        <NavLink to="/" end>Home</NavLink>
        <NavLink to="/how-it-works">How it works</NavLink>
        <NavLink to="/console">Console</NavLink>
      </nav>
      <Outlet />
    </div>
  );
}
```

- [ ] **Step 4: Write placeholder pages**

`packages/ui/src/pages/Home.tsx`:
```tsx
export function Home() {
  return <main><h1>CreditIQ</h1><p>Home page — content in Task 11.</p></main>;
}
```

`packages/ui/src/pages/HowItWorks.tsx`:
```tsx
export function HowItWorks() {
  return <main><h1>How it works</h1><p>Waterfall walkthrough — content in Task 12.</p></main>;
}
```

`packages/ui/src/pages/Console.tsx`:
```tsx
export function Console() {
  return <main><h1>Console</h1><p>Real tool — content in Tasks 2-4.</p></main>;
}
```

- [ ] **Step 5: Rewrite `packages/ui/src/App.tsx` as the route table**

```tsx
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout.js';
import { Home } from './pages/Home.js';
import { HowItWorks } from './pages/HowItWorks.js';
import { Console } from './pages/Console.js';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/console" element={<Console />} />
      </Route>
    </Routes>
  );
}
```

- [ ] **Step 6: Wrap in `BrowserRouter`** — modify `packages/ui/src/main.tsx`:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.js';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
```

- [ ] **Step 7: Typecheck**

Run: `npx tsc --build` (from repo root)
Expected: clean, no errors.

- [ ] **Step 8: Verify routing in a real browser**

Run: `npm run dev -w packages/api` and `npm run dev -w packages/ui` (background, wait for both to serve — poll `curl -sf http://localhost:3001/api/personas` and `curl -sf http://localhost:5173`).
Using browser automation (`claude-in-chrome` or `chromium-cli`, per this repo's established pattern — see prior session's use of `claude-in-chrome` for this exact app): navigate to `http://localhost:5173`, confirm "CreditIQ" + "Home page" text renders. Click "How it works" nav link, confirm URL becomes `/how-it-works` and heading changes. Click "Console", confirm URL becomes `/console` and heading changes. Check console for errors (`read_console_messages`, `onlyErrors: true`).
Expected: all three routes render, nav works, zero console errors.

- [ ] **Step 9: Commit**

```bash
git add packages/ui/package.json package-lock.json packages/ui/src/components/Layout.tsx packages/ui/src/pages packages/ui/src/App.tsx packages/ui/src/main.tsx
git commit -m "feat(ui): add react-router-dom, route skeleton for Home/How it works/Console"
```

---

### Task 2: Console — functional applicant picker (cards) wired to real API

**Files:**
- Modify: `packages/ui/src/components/PersonaPicker.tsx`
- Modify: `packages/ui/src/pages/Console.tsx`

**Interfaces:**
- Consumes: `fetchPersonas(): Promise<PersonaSummary[]>`, `submitDecision(id): Promise<Decision>` from `api.ts` (unchanged).
- Produces: `PersonaPicker` now takes `{ onSelect: (id: string) => void, selectedId: string | null }` and renders three featured case cards (`demo-1-salaried-clean`, `demo-2-msme-poor-gst`, `demo-3-live-overdue`) plus a "browse all 17" expandable section grouped by segment — consumed by `Console.tsx`.

- [ ] **Step 1: Rewrite `packages/ui/src/components/PersonaPicker.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { fetchPersonas, type PersonaSummary } from '../api.js';

const FEATURED_IDS = ['demo-1-salaried-clean', 'demo-2-msme-poor-gst', 'demo-3-live-overdue'];
const FEATURED_BLURBS: Record<string, string> = {
  'demo-1-salaried-clean': 'Full approval, best rate. The happy path.',
  'demo-2-msme-poor-gst': 'Approved — at a reduced limit. The core thesis.',
  'demo-3-live-overdue': 'Rejected at the gate. No score computed.',
};

export function PersonaPicker({ onSelect, selectedId }: { onSelect: (id: string) => void; selectedId: string | null }) {
  const [personas, setPersonas] = useState<PersonaSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [browsingAll, setBrowsingAll] = useState(false);

  useEffect(() => {
    fetchPersonas()
      .then(setPersonas)
      .catch(() => setError('Could not load applicants — is the API server running on http://localhost:3001?'));
  }, []);

  if (error) return <p role="alert">{error}</p>;

  const featured = FEATURED_IDS
    .map((id) => personas.find((p) => p.id === id))
    .filter((p): p is PersonaSummary => p !== undefined);
  const segmentA = personas.filter((p) => p.segment === 'A');
  const segmentD = personas.filter((p) => p.segment === 'D');

  return (
    <div>
      <p>Featured cases</p>
      <div>
        {featured.map((p) => (
          <button key={p.id} type="button" onClick={() => onSelect(p.id)} aria-pressed={selectedId === p.id}>
            <span>{p.segment === 'A' ? 'Segment A' : 'Segment D'}</span>
            <span>{p.label}</span>
            <span>{FEATURED_BLURBS[p.id]}</span>
          </button>
        ))}
      </div>

      <button type="button" onClick={() => setBrowsingAll((b) => !b)}>
        {browsingAll ? 'Hide' : `Browse all ${personas.length} applicants`}
      </button>

      {browsingAll && (
        <div>
          <div>
            <p>Segment A — Salaried</p>
            {segmentA.map((p) => (
              <button key={p.id} type="button" onClick={() => onSelect(p.id)} aria-pressed={selectedId === p.id}>
                {p.label}
              </button>
            ))}
          </div>
          <div>
            <p>Segment D — MSME</p>
            {segmentD.map((p) => (
              <button key={p.id} type="button" onClick={() => onSelect(p.id)} aria-pressed={selectedId === p.id}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Wire it into `packages/ui/src/pages/Console.tsx`**

```tsx
import { useState } from 'react';
import type { Decision } from '@creditiq/shared';
import { PersonaPicker } from '../components/PersonaPicker.js';
import { submitDecision } from '../api.js';

export function Console() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSelect(id: string) {
    setSelectedId(id);
    setLoading(true);
    setError(null);
    setDecision(null);
    try {
      const result = await submitDecision(id);
      setDecision(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit decision.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>Console</h1>
      <PersonaPicker onSelect={handleSelect} selectedId={selectedId} />
      {loading && <p>Evaluating application…</p>}
      {error && <p role="alert">{error}</p>}
      {decision && !loading && !error && (
        <div>
          <p>Outcome: {decision.outcome}</p>
          <p>Grade: {decision.grade ?? 'n/a'} · Score: {decision.score ?? 'n/a'}</p>
          <p>Reason codes: {decision.reason_codes.length}</p>
          <p>Trace steps: {decision.trace.length}</p>
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --build`
Expected: clean.

- [ ] **Step 4: Verify in browser — every one of the 17 personas actually runs**

With both dev servers running: navigate to `http://localhost:5173/console`. Click each of the 3 featured cards in turn; confirm each shows a different `Outcome:`/`Grade:` line matching what was verified in the prior session (demo-1 → approve/A1, demo-2 → approve/B2, demo-3 → reject/null). Click "Browse all 17 applicants", confirm it expands showing Segment A and Segment D groups, click 2-3 more entries from the browse-all list, confirm each produces a real decision (different outcome/grade per persona). Check console for errors.
Expected: all clicks produce real, distinct decisions from the live engine; zero console errors.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/PersonaPicker.tsx packages/ui/src/pages/Console.tsx
git commit -m "feat(ui): card-based applicant picker wired to real decision API"
```

---

### Task 3: Console — real reason codes, trace, and override wired in

**Files:**
- Modify: `packages/ui/src/components/ReasonCodesList.tsx` (no logic change — confirm still matches `Decision` shape)
- Modify: `packages/ui/src/components/WaterfallTrace.tsx` (no logic change — confirm still matches `Decision` shape)
- Modify: `packages/ui/src/components/OverridePanel.tsx` (no logic change — confirm still matches API)
- Modify: `packages/ui/src/pages/Console.tsx`

**Interfaces:**
- Consumes: `ReasonCodesList({decision})`, `WaterfallTrace({decision})`, `OverridePanel({decision})` — all already correct from the prior session, unchanged props.
- Produces: full decision detail (not just the summary stub from Task 2) rendered in `Console.tsx`.

- [ ] **Step 1: Replace the decision-summary stub in `packages/ui/src/pages/Console.tsx`**

```tsx
import { useState } from 'react';
import type { Decision } from '@creditiq/shared';
import { PersonaPicker } from '../components/PersonaPicker.js';
import { DecisionPanel } from '../components/DecisionPanel.js';
import { ReasonCodesList } from '../components/ReasonCodesList.js';
import { WaterfallTrace } from '../components/WaterfallTrace.js';
import { OverridePanel } from '../components/OverridePanel.js';
import { submitDecision } from '../api.js';

export function Console() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSelect(id: string) {
    setSelectedId(id);
    setLoading(true);
    setError(null);
    setDecision(null);
    try {
      const result = await submitDecision(id);
      setDecision(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit decision.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>Console</h1>
      <PersonaPicker onSelect={handleSelect} selectedId={selectedId} />
      {loading && <p>Evaluating application…</p>}
      {error && <p role="alert">{error}</p>}
      {decision && !loading && !error && (
        <>
          <DecisionPanel decision={decision} />
          <ReasonCodesList decision={decision} />
          <WaterfallTrace decision={decision} />
          <OverridePanel decision={decision} />
        </>
      )}
    </main>
  );
}
```

(`DecisionPanel`, `ReasonCodesList`, `WaterfallTrace`, `OverridePanel` are the exact components from the prior session — not modified in this task. Confirming here that their props (`{decision}`) already match `Decision` exactly, so no changes are needed to them yet; Task 8-10 restyle them without touching this contract.)

- [ ] **Step 2: Typecheck**

Run: `npx tsc --build`
Expected: clean.

- [ ] **Step 3: Verify override functionality end-to-end in browser**

Navigate to `http://localhost:5173/console`. Select "demo-3-live-overdue" (a gate reject). Scroll to the override form. Fill: outcome → Approve, reason → any, name → "test-reviewer". Submit. Confirm the override display updates to show "Overridden to APPROVE by test-reviewer…". Reload the page, re-select the same persona, confirm the override still shows (persisted, fetched via `GET /api/decisions/:id/override`). Then select a *different*, never-overridden persona (e.g. "demo-1-salaried-clean") and confirm the override section shows a clean empty form — **no stale override bleeding across applicants** (this exact behavior was manually verified in the prior session and must not regress).
Expected: override persists across reload; switching applicants shows no stale state.

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/pages/Console.tsx
git commit -m "feat(ui): wire reason codes, trace, and override into Console decision view"
```

---

### Task 4: Console — Monitoring sub-view

**Files:**
- Modify: `packages/ui/src/components/MonitoringPanel.tsx` (no logic change — confirm still matches `MonitoringSummary` shape)
- Modify: `packages/ui/src/pages/Console.tsx`

**Interfaces:**
- Consumes: `MonitoringPanel()` (self-fetching, unchanged from prior session).
- Produces: a `Decisions` / `Monitoring` sub-nav inside Console, consumed visually in Phase 2 but functionally complete here.

- [ ] **Step 1: Add sub-view state and the Monitoring tab to `packages/ui/src/pages/Console.tsx`**

```tsx
import { useState } from 'react';
import type { Decision } from '@creditiq/shared';
import { PersonaPicker } from '../components/PersonaPicker.js';
import { DecisionPanel } from '../components/DecisionPanel.js';
import { ReasonCodesList } from '../components/ReasonCodesList.js';
import { WaterfallTrace } from '../components/WaterfallTrace.js';
import { OverridePanel } from '../components/OverridePanel.js';
import { MonitoringPanel } from '../components/MonitoringPanel.js';
import { submitDecision } from '../api.js';

export function Console() {
  const [subView, setSubView] = useState<'decisions' | 'monitoring'>('decisions');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSelect(id: string) {
    setSelectedId(id);
    setLoading(true);
    setError(null);
    setDecision(null);
    try {
      const result = await submitDecision(id);
      setDecision(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit decision.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>Console</h1>
      <nav>
        <button type="button" disabled={subView === 'decisions'} onClick={() => setSubView('decisions')}>Decisions</button>
        <button type="button" disabled={subView === 'monitoring'} onClick={() => setSubView('monitoring')}>Monitoring</button>
      </nav>

      {subView === 'decisions' && (
        <>
          <PersonaPicker onSelect={handleSelect} selectedId={selectedId} />
          {loading && <p>Evaluating application…</p>}
          {error && <p role="alert">{error}</p>}
          {decision && !loading && !error && (
            <>
              <DecisionPanel decision={decision} />
              <ReasonCodesList decision={decision} />
              <WaterfallTrace decision={decision} />
              <OverridePanel decision={decision} />
            </>
          )}
        </>
      )}

      {subView === 'monitoring' && <MonitoringPanel />}
    </main>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --build`
Expected: clean.

- [ ] **Step 3: Verify in browser — Phase 1 full functional regression**

With both dev servers running: navigate to `/console`, run 2-3 decisions via the picker (as in Task 2/3). Switch to "Monitoring" sub-view, confirm the score distribution, grade distribution, and gate-hit counts reflect the decisions just run (e.g. if a gate-reject persona was run, its gate code should show a count ≥1 in "Gate-hit counts"). Switch back to "Decisions", confirm the previously selected applicant's decision is still showing (state preserved across sub-view switches). Check console for errors.

This is the **Phase 1 completion checkpoint** — at this point every real function (17 personas, decisions, reason codes, trace, overrides, monitoring) works end-to-end against the live API with only plain/unstyled markup. Confirm this explicitly before moving to Phase 2.

- [ ] **Step 4: Run full test suite to confirm no backend regression**

Run: `npm test` (from repo root)
Expected: 118 tests passing (3 shared, 97 engine, 18 api), unchanged from before this plan.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/pages/Console.tsx
git commit -m "feat(ui): wire Monitoring sub-view into Console — Phase 1 functional complete"
```

---

# PHASE 2 — Visual system

### Task 5: Design tokens and global primitives

**Files:**
- Modify: `packages/ui/index.html`
- Create: `packages/ui/src/styles/tokens.css`
- Create: `packages/ui/src/styles/global.css`
- Modify: `packages/ui/src/main.tsx`

**Interfaces:**
- Produces: CSS custom properties (`--desk`, `--paper`, `--ink`, `--ballpoint`, `--stamp-red`, `--stamp-green`, `--font-display`, `--font-body`, `--font-mono`) and utility classes (`.desk`, `.paper-card`, `.btn-primary`, `.btn-secondary`, `.mono`, `.stamp`) — consumed by every component task from here on.

- [ ] **Step 1: Add IBM Plex font loading to `packages/ui/index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>CreditIQ — Underwriter</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Serif:wght@600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Write `packages/ui/src/styles/tokens.css`**

```css
:root {
  --desk: #16241C;
  --paper: #EFEAE0;
  --ink: #1B241D;
  --ink-muted: #4d564e;
  --ink-faint: #6b6250;
  --paper-line: #d8d0bd;
  --ballpoint: #2B4C77;
  --stamp-red: #A3271D;
  --stamp-green: #2F6B3E;
  --desk-text: #DCE3D9;
  --desk-text-muted: #93A393;
  --desk-line: #2A3A2C;

  --font-display: 'IBM Plex Serif', Georgia, serif;
  --font-body: 'IBM Plex Sans', system-ui, sans-serif;
  --font-mono: 'IBM Plex Mono', ui-monospace, 'SFMono-Regular', monospace;
}
```

- [ ] **Step 3: Write `packages/ui/src/styles/global.css`**

```css
@import './tokens.css';

* { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--desk);
  color: var(--ink);
  font-family: var(--font-body);
}

.mono { font-family: var(--font-mono); }

.desk {
  background: radial-gradient(ellipse at 50% -20%, #1e3327 0%, var(--desk) 60%);
  min-height: 100vh;
}

.paper-card {
  background: var(--paper);
  color: var(--ink);
  border-radius: 3px;
  box-shadow: 0 20px 50px -18px rgba(0, 0, 0, 0.5);
  padding: 24px 28px;
}

.btn-primary {
  background: var(--ballpoint);
  color: #F1EEE4;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.04em;
  padding: 13px 22px;
  border: none;
  border-radius: 2px;
  cursor: pointer;
}
.btn-primary:hover { filter: brightness(1.1); }
.btn-primary:focus-visible { outline: 2px solid var(--desk-text); outline-offset: 2px; }

.btn-secondary {
  background: transparent;
  border: 1px solid var(--paper-line);
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.04em;
  padding: 12px 20px;
  border-radius: 2px;
  cursor: pointer;
}
.btn-secondary:focus-visible { outline: 2px solid var(--ballpoint); outline-offset: 2px; }

.stamp {
  font-family: var(--font-mono);
  font-weight: 700;
  letter-spacing: 0.04em;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  mix-blend-mode: multiply;
  transform: rotate(-13deg) scale(0);
  opacity: 0;
  animation: stampland 0.5s cubic-bezier(.2, 1.4, .4, 1) 0.2s forwards;
}
.stamp.approve { border: 2.5px solid var(--stamp-green); color: var(--stamp-green); }
.stamp.reject { border: 2.5px solid var(--stamp-red); color: var(--stamp-red); }

@keyframes stampland {
  to { transform: rotate(-13deg) scale(1); opacity: 0.88; }
}

@media (prefers-reduced-motion: reduce) {
  .stamp { animation: none; transform: rotate(-13deg) scale(1); opacity: 0.88; }
  * { scroll-behavior: auto !important; }
}

a:focus-visible, button:focus-visible, [tabindex]:focus-visible {
  outline: 2px solid var(--ballpoint);
  outline-offset: 2px;
}
```

- [ ] **Step 4: Import global styles in `packages/ui/src/main.tsx`**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles/global.css';
import App from './App.js';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
```

- [ ] **Step 5: Verify fonts load and tokens apply**

Run both dev servers. Navigate to `http://localhost:5173`. Using `read_page` or a `javascript_tool` check (`getComputedStyle(document.body).fontFamily`), confirm IBM Plex Sans is applied to `body`. Zoom/screenshot to confirm no FOUT/layout shift issues, no console errors (missing font 404s, etc.).

- [ ] **Step 6: Commit**

```bash
git add packages/ui/index.html packages/ui/src/styles packages/ui/src/main.tsx
git commit -m "feat(ui): design tokens and global primitives (paper/desk/stamp/mono)"
```

---

### Task 6: Style the Layout (desk nav chrome)

**Files:**
- Modify: `packages/ui/src/components/Layout.tsx`

**Interfaces:**
- No interface change — visual only.

- [ ] **Step 1: Restyle `packages/ui/src/components/Layout.tsx`**

```tsx
import type { CSSProperties } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const navLinkStyle = ({ isActive }: { isActive: boolean }): CSSProperties => ({
  color: isActive ? '#F1EEE4' : 'var(--desk-text-muted)',
  borderBottom: isActive ? '1px solid var(--ballpoint)' : '1px solid transparent',
  paddingBottom: 3,
  textDecoration: 'none',
});

export function Layout() {
  return (
    <div className="desk">
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '22px 40px', color: 'var(--desk-text)', fontSize: 13 }}>
        <span className="mono" style={{ fontWeight: 500, letterSpacing: '0.05em', color: '#F1EEE4' }}>CREDITIQ</span>
        <div style={{ display: 'flex', gap: 30 }}>
          <NavLink to="/" end style={navLinkStyle}>Home</NavLink>
          <NavLink to="/how-it-works" style={navLinkStyle}>How it works</NavLink>
          <NavLink to="/console" style={navLinkStyle}>Console</NavLink>
        </div>
      </nav>
      <Outlet />
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --build`
Expected: clean.

- [ ] **Step 3: Verify in browser**

Navigate to `http://localhost:5173`. Confirm dark desk background fills the viewport behind the nav, "CREDITIQ" wordmark is in mono, active nav link is underlined in ballpoint blue and brighter than inactive links. Click through all three routes, confirm active state updates correctly.

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/components/Layout.tsx
git commit -m "style(ui): desk-chrome navigation"
```

---

### Task 7: Style PersonaPicker (paper cards)

**Files:**
- Modify: `packages/ui/src/components/PersonaPicker.tsx`

**Interfaces:**
- No interface change — visual only, same `{onSelect, selectedId}` props.

- [ ] **Step 1: Add styling to the featured cards, browse-all toggle, and grouped lists**

Replace the return statement in `packages/ui/src/components/PersonaPicker.tsx` with:

```tsx
  return (
    <div style={{ padding: '0 40px 30px' }}>
      <p className="mono" style={{ fontSize: 11, letterSpacing: '0.1em', color: 'var(--desk-text-muted)', textTransform: 'uppercase' }}>
        Featured cases
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        {featured.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p.id)}
            aria-pressed={selectedId === p.id}
            className="paper-card"
            style={{
              textAlign: 'left', cursor: 'pointer', border: selectedId === p.id ? '2px solid var(--ballpoint)' : 'none',
              padding: '16px 16px 14px', font: 'inherit',
            }}
          >
            <span className="mono" style={{ display: 'block', fontSize: 9.5, color: 'var(--ink-faint)', letterSpacing: '0.08em', marginBottom: 8 }}>
              {p.segment === 'A' ? 'SEGMENT A' : 'SEGMENT D'}
            </span>
            <span style={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, marginBottom: 6, lineHeight: 1.3 }}>
              {p.label}
            </span>
            <span style={{ display: 'block', fontSize: 11.5, color: 'var(--ink-muted)', lineHeight: 1.45 }}>
              {FEATURED_BLURBS[p.id]}
            </span>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setBrowsingAll((b) => !b)}
        className="mono"
        style={{ background: 'none', border: 'none', color: 'var(--ballpoint)', fontSize: 11, cursor: 'pointer', padding: '18px 0 0' }}
      >
        {browsingAll ? 'Hide' : `Browse all ${personas.length} applicants →`}
      </button>

      {browsingAll && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 16 }}>
          <div className="paper-card" style={{ padding: '18px 20px' }}>
            <p className="mono" style={{ fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '0.08em', marginBottom: 10 }}>SEGMENT A — SALARIED</p>
            {segmentA.map((p) => (
              <button
                key={p.id} type="button" onClick={() => onSelect(p.id)} aria-pressed={selectedId === p.id}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', background: 'none',
                  border: 'none', borderBottom: '1px dashed var(--paper-line)', padding: '9px 0',
                  fontSize: 12.5, color: selectedId === p.id ? 'var(--ballpoint)' : 'var(--ink)', cursor: 'pointer',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="paper-card" style={{ padding: '18px 20px' }}>
            <p className="mono" style={{ fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '0.08em', marginBottom: 10 }}>SEGMENT D — MSME</p>
            {segmentD.map((p) => (
              <button
                key={p.id} type="button" onClick={() => onSelect(p.id)} aria-pressed={selectedId === p.id}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', background: 'none',
                  border: 'none', borderBottom: '1px dashed var(--paper-line)', padding: '9px 0',
                  fontSize: 12.5, color: selectedId === p.id ? 'var(--ballpoint)' : 'var(--ink)', cursor: 'pointer',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --build`
Expected: clean.

- [ ] **Step 3: Verify in browser**

Navigate to `/console`. Confirm featured cards render as paper cards on the dark desk, selecting one shows a ballpoint-blue border (`aria-pressed` reflected visually). Confirm "Browse all 17 applicants" expands two paper-card columns grouped by segment, each entry clickable. Re-run the Task 2 functional check (click several personas, confirm real distinct decisions) to confirm restyling didn't break behavior.

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/components/PersonaPicker.tsx
git commit -m "style(ui): paper-card applicant picker"
```

---

### Task 8: Style DecisionPanel (paper file + stamp verdict)

**Files:**
- Modify: `packages/ui/src/components/DecisionPanel.tsx`

**Interfaces:**
- No interface change — visual only, same `{decision}` prop.

- [ ] **Step 1: Rewrite `packages/ui/src/components/DecisionPanel.tsx`**

```tsx
import type { Decision } from '@creditiq/shared';

export function DecisionPanel({ decision }: { decision: Decision }) {
  const isApprove = decision.outcome === 'approve';
  const stampLabel = isApprove
    ? (decision.reason_codes.some((r) => r.code === 'POL_AMOUNT_REDUCED') ? 'APPROVED\nREDUCED' : 'APPROVED')
    : 'REJECTED';

  return (
    <div className="paper-card" style={{ maxWidth: 380, position: 'relative', overflow: 'hidden', margin: '0 40px 20px' }}>
      <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-faint)', letterSpacing: '0.08em', borderBottom: '1px solid var(--paper-line)', paddingBottom: 10, marginBottom: 16 }}>
        FILE NO. {decision.applicant_id.toUpperCase()}
      </div>

      {decision.grade && (
        <div className="mono" style={{ fontSize: 11.5, color: 'var(--ink-muted)', marginBottom: 4 }}>
          GRADE {decision.grade} · SCORE {decision.score}
        </div>
      )}

      {isApprove && (
        <>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, marginBottom: 14 }}>
            ₹{decision.offer_amount?.toLocaleString('en-IN')}
          </div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-muted)', lineHeight: 1.8 }}>
            {decision.offer_tenure_months} months<br />
            {decision.offer_rate_pct}% p.a.<br />
            EMI ₹{decision.offer_emi?.toFixed(0)}
          </div>
        </>
      )}

      <div className="mono" style={{ fontSize: 10, color: 'var(--ink-faint)', marginTop: 16 }}>
        model {decision.model_version} · policy {decision.policy_version}
      </div>

      <div
        className={`stamp ${isApprove ? 'approve' : 'reject'}`}
        style={{ position: 'absolute', top: 18, right: -10, width: 92, height: 92, fontSize: 10.5, whiteSpace: 'pre-line' }}
      >
        {stampLabel}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --build`
Expected: clean.

- [ ] **Step 3: Verify in browser**

Navigate to `/console`, select "Demo Case 1" (clean approval) — confirm a green "APPROVED" stamp animates in (scale/rotate) on the file. Select "Demo Case 2" (reduced limit) — confirm stamp reads "APPROVED REDUCED". Select "Demo Case 3" (gate reject) — confirm a red "REJECTED" stamp, and no offer-amount block renders. Then, using `javascript_tool`, emulate `prefers-reduced-motion: reduce` (`matchMedia` override or OS-level toggle if available) and confirm the stamp appears instantly at full opacity with no animation.

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/components/DecisionPanel.tsx
git commit -m "style(ui): paper file card with animated stamp verdict"
```

---

### Task 9: Style ReasonCodesList (ledger rows) and WaterfallTrace (checklist)

**Files:**
- Modify: `packages/ui/src/components/ReasonCodesList.tsx`
- Modify: `packages/ui/src/components/WaterfallTrace.tsx`

**Interfaces:**
- No interface change — visual only, same `{decision}` props.

- [ ] **Step 1: Rewrite `packages/ui/src/components/ReasonCodesList.tsx`**

```tsx
import type { Decision } from '@creditiq/shared';

export function ReasonCodesList({ decision }: { decision: Decision }) {
  return (
    <div className="paper-card" style={{ maxWidth: 460, margin: '0 40px 16px' }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, margin: '0 0 12px' }}>Reason codes</h3>
      {decision.reason_codes.map((r) => (
        <div key={r.code} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '8px 0', borderBottom: '1px dashed var(--paper-line)' }}>
          <div>
            <span className="mono" style={{ fontSize: 11.5 }}>{r.rank}. {r.code}</span>
            <span style={{ display: 'block', fontSize: 10.5, color: 'var(--ink-faint)', marginTop: 2 }}>{r.sentence}</span>
          </div>
          {typeof r.points === 'number' && (
            <span className="mono" style={{ fontSize: 11.5, color: r.points > 0 ? 'var(--stamp-green)' : 'var(--stamp-red)', flexShrink: 0, marginLeft: 12 }}>
              {r.points > 0 ? '+' : ''}{r.points}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Rewrite `packages/ui/src/components/WaterfallTrace.tsx`**

```tsx
import { useState } from 'react';
import type { Decision } from '@creditiq/shared';

export function WaterfallTrace({ decision }: { decision: Decision }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="paper-card" style={{ maxWidth: 460, margin: '0 40px 16px' }}>
      <button
        type="button" onClick={() => setOpen((o) => !o)} className="mono"
        style={{ background: 'none', border: 'none', padding: 0, fontSize: 12, color: 'var(--ballpoint)', cursor: 'pointer' }}
      >
        {open ? 'Hide' : 'Show'} waterfall trace ({decision.trace.length} steps)
      </button>
      {open && (
        <div className="mono" style={{ fontSize: 11.5, color: 'var(--ink-muted)', lineHeight: 2, marginTop: 12 }}>
          {decision.trace.map((step) => (
            <div key={step.step}>
              <span style={{ color: step.outcome === 'fail' ? 'var(--stamp-red)' : 'var(--stamp-green)' }}>
                {step.outcome === 'fail' ? '✗' : '✓'}
              </span>{' '}
              {step.stage}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --build`
Expected: clean.

- [ ] **Step 4: Verify in browser**

Select "Demo Case 2" — confirm reason codes render as dashed-divider rows with green/red mono point deltas, including the F13 advisory code (`ADV_DEBT_CONSOLIDATION_RISING_UTIL` on the `a-debt-consolidation-rising-util` persona) rendering with no point value shown (since it has none). Expand the waterfall trace, confirm checkmarks render per step and a gate-reject persona shows a red ✗ on its failing step.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/ReasonCodesList.tsx packages/ui/src/components/WaterfallTrace.tsx
git commit -m "style(ui): ledger-row reason codes and checklist waterfall trace"
```

---

### Task 10: Style OverridePanel and MonitoringPanel

**Files:**
- Modify: `packages/ui/src/components/OverridePanel.tsx`
- Modify: `packages/ui/src/components/MonitoringPanel.tsx`

**Interfaces:**
- No interface change — visual only.

- [ ] **Step 1: Restyle `packages/ui/src/components/OverridePanel.tsx`**

Wrap the existing return JSX's outer `<section>` in `className="paper-card"` with `style={{ maxWidth: 460, margin: '0 40px 40px' }}`, style the `<h3>` with `style={{ fontFamily: 'var(--font-display)', fontSize: 14, margin: '0 0 12px' }}`, and restyle the form controls:

```tsx
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <label className="mono" style={{ fontSize: 11 }}>
          Override outcome to:{' '}
          <select value={outcome} onChange={(e) => setOutcome(e.target.value as 'approve' | 'reject')} className="mono" style={{ padding: '6px 8px', border: '1px solid var(--paper-line)', borderRadius: 2 }}>
            <option value="approve">Approve</option>
            <option value="reject">Reject</option>
          </select>
        </label>
        <label className="mono" style={{ fontSize: 11 }}>
          Reason:{' '}
          <select value={reasonCode} onChange={(e) => setReasonCode(e.target.value as OverrideReasonCode)} className="mono" style={{ padding: '6px 8px', border: '1px solid var(--paper-line)', borderRadius: 2, width: '100%', marginTop: 4 }}>
            {OVERRIDE_REASON_CODES.map((code) => (
              <option key={code} value={code}>{OVERRIDE_REASON_LABELS[code]}</option>
            ))}
          </select>
        </label>
        <label className="mono" style={{ fontSize: 11 }}>
          Notes:{' '}
          <textarea value={reasonText} onChange={(e) => setReasonText(e.target.value)} rows={2} style={{ width: '100%', marginTop: 4, padding: 8, border: '1px solid var(--paper-line)', borderRadius: 2, fontFamily: 'var(--font-body)' }} />
        </label>
        <label className="mono" style={{ fontSize: 11 }}>
          Your name:{' '}
          <input value={overriddenBy} onChange={(e) => setOverriddenBy(e.target.value)} required style={{ padding: '6px 8px', border: '1px solid var(--paper-line)', borderRadius: 2 }} />
        </label>
        <button type="submit" disabled={submitting || !overriddenBy.trim()} className="btn-primary" style={{ alignSelf: 'flex-start', opacity: submitting || !overriddenBy.trim() ? 0.5 : 1 }}>
          {submitting ? 'Saving…' : override ? 'Update override' : 'Submit override'}
        </button>
      </form>
```

(Keep the existing `useState`/`useEffect`/`handleSubmit` logic and the `{override && (...)}` display block entirely as-is — only the JSX returned by the form and its wrapping `<section>` change.)

- [ ] **Step 2: Restyle `packages/ui/src/components/MonitoringPanel.tsx`**

Replace the bar-rendering `<li>` styling (keep all data logic/`useEffect`/`fetchMonitoringSummary` calls unchanged) with paper-card sections and mono ledger-style bars:

```tsx
  return (
    <div style={{ padding: '0 40px 40px' }}>
      <p className="mono" style={{ fontSize: 12, color: 'var(--desk-text)', marginBottom: 20 }}>
        {summary.total_decisions} decisions recorded — {summary.outcome_counts.approve} approved, {summary.outcome_counts.reject} rejected.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr', gap: 14 }}>
        <div className="paper-card">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 13, margin: '0 0 12px' }}>Score distribution</h3>
          {summary.score_distribution.map((b) => (
            <div key={b.min} className="mono" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, marginBottom: 6 }}>
              <span style={{ width: 56 }}>{b.min}–{b.max}</span>
              <span style={{ background: 'var(--ballpoint)', height: 8, width: `${Math.max(2, (b.count / maxScoreBucket) * 90)}px`, borderRadius: 1 }} />
              <span>{b.count}</span>
            </div>
          ))}
        </div>

        <div className="paper-card">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 13, margin: '0 0 12px' }}>Grade distribution</h3>
          {Object.entries(summary.grade_distribution).map(([grade, count]) => (
            <div key={grade} className="mono" style={{ fontSize: 11, marginBottom: 4 }}>{grade}: {count}</div>
          ))}
        </div>

        <div className="paper-card">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 13, margin: '0 0 12px' }}>Gate-hit counts</h3>
          {summary.gate_hit_counts.length === 0 && <p style={{ fontSize: 11, color: 'var(--ink-faint)' }}>No gate or validation rejections yet.</p>}
          {summary.gate_hit_counts.map((g) => (
            <div key={g.code} className="mono" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, marginBottom: 6 }}>
              <span style={{ width: 130 }}>{g.code}</span>
              <span style={{ background: 'var(--stamp-red)', height: 8, width: `${Math.max(2, (g.count / maxGateHit) * 90)}px`, borderRadius: 1 }} />
              <span>{g.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
```

(Keep the `maxScoreBucket`/`maxGateHit` `Math.max(1, ...)` computations from the original component unchanged above this return.)

- [ ] **Step 3: Typecheck**

Run: `npx tsc --build`
Expected: clean.

- [ ] **Step 4: Verify in browser**

Confirm the override form renders as a paper card with mono labels and a ballpoint submit button; submit one, confirm it still works exactly as verified in Task 3. Switch to Monitoring, confirm three paper-card panels with mono bar rows render real data.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/OverridePanel.tsx packages/ui/src/components/MonitoringPanel.tsx
git commit -m "style(ui): paper-card override form and monitoring dashboard"
```

---

### Task 11: Home page (hero + waterfall preview scenes)

**Files:**
- Modify: `packages/ui/src/pages/Home.tsx`

**Interfaces:**
- No data fetching — static illustrative content using real PRD figures (demo-case-2 numbers), links to `/console` and `/how-it-works` via `react-router-dom`'s `Link`.

- [ ] **Step 1: Write `packages/ui/src/pages/Home.tsx`**

```tsx
import { Link } from 'react-router-dom';

export function Home() {
  return (
    <main>
      <section style={{ minHeight: '78vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px 40px 80px' }}>
        <div className="mono" style={{ fontSize: 11, letterSpacing: '0.16em', color: 'var(--desk-text-muted)', textTransform: 'uppercase', marginBottom: 26 }}>
          File no. CIQ–2026–000000 · Segment A/D · Unsecured
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: '#F5F2E8', fontSize: 56, lineHeight: 1.1, letterSpacing: '-0.015em', maxWidth: 760, margin: '0 0 26px' }}>
          One scorecard can't see<br />a salary <span style={{ color: '#7FA8D8' }}>and</span> a business.
        </h1>
        <p style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--desk-text-muted)', maxWidth: 460, margin: '0 0 40px' }}>
          CreditIQ scores salaried and MSME applicants on what actually predicts their risk. Every decision carries a full, defensible trail.
        </p>
        <div style={{ display: 'flex', gap: 16 }}>
          <Link to="/console" className="btn-primary" style={{ textDecoration: 'none' }}>OPEN A FILE →</Link>
          <Link to="/how-it-works" className="btn-secondary" style={{ textDecoration: 'none', color: 'var(--desk-text)', borderColor: 'var(--desk-line)' }}>HOW IT WORKS</Link>
        </div>
      </section>

      <section style={{ textAlign: 'center', padding: '80px 40px 50px' }}>
        <div className="mono" style={{ fontSize: 11, letterSpacing: '0.16em', color: 'var(--desk-text-muted)', textTransform: 'uppercase', marginBottom: 18 }}>How it works</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 30, color: '#F5F2E8', fontWeight: 700, margin: '0 auto 14px', maxWidth: 520 }}>
          Nine steps. Same file, start to finish.
        </h2>
        <p style={{ color: 'var(--desk-text-muted)', fontSize: 14.5, maxWidth: 420, margin: '0 auto' }}>
          Cheap, deterministic checks run before anything expensive.
        </p>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 50, alignItems: 'center', maxWidth: 1000, margin: '0 auto', padding: '60px 56px' }}>
        <div className="paper-card">
          <div className="mono" style={{ fontSize: 12.5, lineHeight: 2 }}>
            <div><span style={{ color: 'var(--stamp-green)', fontWeight: 600 }}>✓</span> No live overdue on any account</div>
            <div><span style={{ color: 'var(--stamp-green)', fontWeight: 600 }}>✓</span> No severe delinquency in 12 months</div>
            <div><span style={{ color: 'var(--stamp-green)', fontWeight: 600 }}>✓</span> No suit filed, no recent settlement</div>
          </div>
        </div>
        <div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--desk-text-muted)', letterSpacing: '0.1em', marginBottom: 12 }}>STEP 2 · HARD GATES</div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: '#F5F2E8', margin: '0 0 12px', fontWeight: 700 }}>Rejected here, and no score is ever computed.</h3>
          <p style={{ color: 'var(--desk-text-muted)', fontSize: 14.5, lineHeight: 1.6, maxWidth: 340 }}>
            A file with a live overdue account doesn't get a score — scoring it would imply the number could rescue it. It can't.
          </p>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 50, alignItems: 'center', maxWidth: 1000, margin: '0 auto', padding: '60px 56px' }}>
        <div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--desk-text-muted)', letterSpacing: '0.1em', marginBottom: 12 }}>STEP 4–5 · SCORING &amp; GRADE</div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: '#F5F2E8', margin: '0 0 12px', fontWeight: 700 }}>Filing discipline outweighs turnover.</h3>
          <p style={{ color: 'var(--desk-text-muted)', fontSize: 14.5, lineHeight: 1.6, maxWidth: 340 }}>
            A 718 bureau score with a generic model approves in full. CreditIQ reduces the limit — late GST filing predicts MSME stress better than declared turnover does.
          </p>
        </div>
        <div className="paper-card">
          <div className="mono" style={{ fontSize: 12.5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px dashed var(--paper-line)' }}><span>GST filing — late 7 of 12 months</span><span style={{ color: 'var(--stamp-red)' }}>−60</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px dashed var(--paper-line)' }}><span>Bureau score, 718</span><span style={{ color: 'var(--stamp-green)' }}>+40</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, fontWeight: 600 }}><span>SCORE</span><span>715 · GRADE B2</span></div>
          </div>
        </div>
      </section>

      <section style={{ textAlign: 'center', padding: '70px 40px 100px' }}>
        <Link to="/console" className="btn-primary" style={{ textDecoration: 'none' }}>OPEN A FILE →</Link>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --build`
Expected: clean.

- [ ] **Step 3: Verify in browser**

Navigate to `http://localhost:5173/`. Confirm the hero fills most of the viewport, serif headline renders once, both CTA buttons work (`/console` and `/how-it-works` links navigate correctly). Scroll down, confirm the two scene panels render legibly. Check console for errors, confirm no layout overflow at 375px viewport width (mobile check via `resize_window` or responsive emulation).

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/pages/Home.tsx
git commit -m "feat(ui): Home page — hero and waterfall preview scenes"
```

---

### Task 12: How It Works page (full waterfall walkthrough)

**Files:**
- Modify: `packages/ui/src/pages/HowItWorks.tsx`

**Interfaces:**
- No data fetching — static content using real PRD gate/scoring/policy figures.

- [ ] **Step 1: Write `packages/ui/src/pages/HowItWorks.tsx`**

```tsx
import { Link } from 'react-router-dom';

const STEPS = [
  { tag: 'STEP 1 · VALIDATION', title: 'Malformed input is rejected before anything else runs.', body: 'Every field is checked against the 38-field FeatureVector schema. A missing or malformed field fails here, cleanly, before any business logic runs.' },
  { tag: 'STEP 2 · HARD GATES', title: 'Ten deterministic checks. Fail any one, and no score is ever computed.', body: 'Live overdue balance, severe delinquency, suits filed, settlements, enquiry velocity, thin file, capacity (FOIR), age-vs-tenure, and employment/business vintage — evaluated in a fixed order, every time.' },
  { tag: 'STEP 3 · SEGMENT ROUTING', title: 'The file forks. The scorecard doesn’t.', body: 'Segment A (salaried) is read for employment stability and salary regularity. Segment D (MSME) is read for business cash flow and filing discipline. One product per segment, enforced.' },
  { tag: 'STEP 4 · SCORING', title: 'Every applicant starts at 500 and moves on weighted factors.', body: 'Shared factors — bureau score, utilization level and trend, FOIR, bounces, delinquency recency, history age, enquiries per lender — plus segment-specific factors on top.' },
  { tag: 'STEP 5 · GRADE BANDING', title: 'The 0–1000 score becomes a grade: A1 through D3.', body: 'A1 is 900 and above. Below 500 is D-band and not approved — no offer is computed for those.' },
  { tag: 'STEP 6–7 · POLICY & CAPS', title: 'Grade becomes a concrete offer, then product ceilings apply.', body: 'Grade maps to an income multiplier, tenure, and rate from a versioned policy file — never hardcoded in scoring logic. Where the computed offer falls below the request, the decision stays approve, at a reduced amount.' },
  { tag: 'STEP 8 · REASON CODES', title: 'The top five factors, ranked by how much they moved the score.', body: 'Every reason code maps to a plain-English, customer-safe sentence — nothing a customer sees requires reading code.' },
  { tag: 'STEP 9 · DECISION', title: 'A stamped, versioned, reconstructable record.', body: 'Every decision carries the model version and policy version that produced it, so any historical decision can be reconstructed exactly.' },
];

export function HowItWorks() {
  return (
    <main>
      <section style={{ textAlign: 'center', padding: '90px 40px 60px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 40, color: '#F5F2E8', fontWeight: 700, margin: '0 auto 16px', maxWidth: 620 }}>
          Nine steps. Same file, start to finish.
        </h1>
        <p style={{ color: 'var(--desk-text-muted)', fontSize: 15, maxWidth: 480, margin: '0 auto' }}>
          Order is deliberate — cheap, deterministic checks run before expensive scoring, so an obviously ineligible file closes in microseconds with a clean reason.
        </p>
      </section>

      {STEPS.map((s, i) => (
        <section key={s.tag} style={{ maxWidth: 720, margin: '0 auto', padding: '50px 56px', borderTop: i === 0 ? 'none' : '1px solid var(--desk-line)' }}>
          <div className="mono" style={{ fontSize: 11, color: 'var(--desk-text-muted)', letterSpacing: '0.1em', marginBottom: 12 }}>{s.tag}</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: '#F5F2E8', margin: '0 0 12px', fontWeight: 700 }}>{s.title}</h2>
          <p style={{ color: 'var(--desk-text-muted)', fontSize: 15, lineHeight: 1.65, maxWidth: 560 }}>{s.body}</p>
        </section>
      ))}

      <section style={{ textAlign: 'center', padding: '60px 40px 110px' }}>
        <Link to="/console" className="btn-primary" style={{ textDecoration: 'none' }}>SEE IT DECIDE →</Link>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --build`
Expected: clean.

- [ ] **Step 3: Verify in browser**

Navigate to `/how-it-works`. Confirm all 9 steps render in order with dividers between them, the closing CTA links to `/console`. Check console for errors and confirm no horizontal overflow at 375px width.

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/pages/HowItWorks.tsx
git commit -m "feat(ui): How It Works page — full 9-step waterfall walkthrough"
```

---

### Task 13: Final integration pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npm test` (from repo root)
Expected: all 118 tests passing (3 shared, 97 engine, 18 api) — unchanged from before this plan, confirming zero backend regression.

- [ ] **Step 2: Typecheck the whole workspace**

Run: `npx tsc --build`
Expected: clean across all four packages.

- [ ] **Step 3: Full browser walkthrough**

With both dev servers running, using browser automation:
1. `/` — screenshot, confirm hero + 2 scene panels render, check console errors.
2. Click "How it works" — screenshot, confirm all 9 steps render, check console errors.
3. Click "Console" — run at least 4 personas across both segments (2 approve, 1 reduced-limit, 1 gate-reject), confirm each produces a correct, distinct stamped decision with correct reason codes and trace.
4. Submit one override, confirm it displays and persists on reload.
5. Switch to Monitoring, confirm real aggregated data (matching the decisions just run) renders in all three panels.
6. Resize to 375px width on each page, confirm no horizontal scroll/overflow.
7. Tab through the Console page with keyboard only, confirm visible focus outlines on every interactive element (cards, nav links, form fields, buttons).

Expected: zero console errors across the entire walkthrough; every real function verified working in the final visual system.

- [ ] **Step 4: Stop dev servers**

Kill both background dev server processes.

- [ ] **Step 5: Final commit** (only if any fixups were needed in Step 3/7)

```bash
git add -A
git commit -m "fix(ui): final integration fixes from full walkthrough"
```

(Skip this step if no fixes were needed.)
