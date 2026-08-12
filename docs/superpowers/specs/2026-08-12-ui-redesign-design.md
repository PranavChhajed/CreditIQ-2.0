# CreditIQ UI Redesign — Design Spec

**Date** 2026-08-12
**Status** Approved for implementation planning
**Source** PRD.md v1.0, plus the existing working implementation (`packages/shared`, `packages/engine`, `packages/api`, `packages/ui`) built and tested earlier in this workstream (F1–F15, 118 passing tests).

**What this is not**: this spec does not change the engine, API, database schema, or data model in any way. It is a front-end-only redesign — new visual language, new page structure, new components — sitting on top of the exact same tested backend. Every number, field, and endpoint referenced below already exists and already works.

---

## 1. Why

The current UI (`packages/ui`) is functionally complete but visually bare — a single unstyled screen with an HTML `<select>` and inline styles. It has no explanation of what the product does or why, and doesn't read as something you'd ship. This redesign turns it into a real, presentable site while changing zero backend behavior.

## 2. Ground-truth functional inventory

This is the actual, current API surface. The redesigned UI must call these endpoints for real — no invented data, no hardcoded numbers standing in for live values.

| Endpoint | Returns | Used by |
|---|---|---|
| `GET /api/personas` | `{id, label, segment}[]` — all 17 fixtures | Console applicant picker |
| `POST /api/decisions {applicant_id}` | Full `Decision` (see below), persisted | Running a case |
| `GET /api/decisions/:id` | Persisted `Decision` | Reloading a result |
| `GET /api/decisions?limit=` | Recent decision summaries | (available; not required in v1 UI) |
| `GET /api/monitoring/summary` | `MonitoringSummary` (see below) | Monitoring view |
| `POST /api/decisions/:id/override {override_outcome, reason_code, reason_text?, overridden_by}` | Saved `DecisionOverride` | Override form submit |
| `GET /api/decisions/:id/override` | `DecisionOverride` or 404 | Override form load |

**`Decision`** (`packages/shared/src/types.ts`): `applicant_id`, `outcome` (`approve`\|`reject`), `grade` (`A1`–`D3` or `null`), `score` (0–1000 or `null`), `offer_amount`, `offer_tenure_months`, `offer_rate_pct`, `offer_emi`, `reason_codes: RankedReasonCode[]` (`rank`, `code`, `sentence`, optional `points`), `trace: TraceStep[]` (`step`, `stage`, `outcome`, `detail`), `model_version`, `policy_version`. Trace length varies 2 (gate reject) to 9 (full approve) steps — must render whatever length comes back, not a fixed count.

**`MonitoringSummary`**: `total_decisions`, `outcome_counts {approve, reject}`, `grade_distribution` (partial map of grade → count), `score_distribution` (10 buckets of 100, each `{min, max, count}`), `gate_hit_counts` (`{code, count}[]`, sorted descending).

**`DecisionOverride`**: `applicant_id`, `original_outcome`, `override_outcome`, `reason_code` (one of the 5 real `OverrideReasonCode`s: `OVR_ADDITIONAL_DOCS_VERIFIED`, `OVR_RISK_APPETITE_EXCEPTION`, `OVR_POLICY_EXCEPTION`, `OVR_DATA_QUALITY_ISSUE`, `OVR_OTHER`), `reason_text`, `overridden_by`, `created_at`.

**17 personas**, segment A (salaried) and D (MSME), including the 3 PRD §12 demo cases and the F13 advisory persona (`a-debt-consolidation-rising-util`).

Nothing in the redesign may reduce this surface. Every field above must have a real place to render.

## 3. Visual system (approved via visual companion)

**Concept**: the product is presented as a credit file — the physical culture of Indian lending paperwork (bureau printouts, GST acknowledgments, EPFO passbooks, sanction letters). Nothing is official until it's stamped.

**Color tokens** (fixed, six, each tied to a physical referent):
```css
--desk: #16241C;      /* underwriter's blotter — dominant background */
--paper: #EFEAE0;     /* aged ledger paper — surface for document cards */
--ink: #1B241D;        /* fountain ink — body text on paper */
--ballpoint: #2B4C77;  /* form ballpoint blue — links, actions, focus */
--stamp-red: #A3271D;  /* rejection ink — reject states, gate failures */
--stamp-green: #2F6B3E;/* approval ink — approve states, positive deltas */
```
Composition: dark `--desk` is the page's structural background; `--paper` cards are the only light surfaces, floating on the desk like real documents. Site chrome (nav) stays on the desk; all real content sits on paper.

**Type**: IBM Plex Serif (display — the hero thesis line and stamp text only, nowhere else), IBM Plex Sans (body), IBM Plex Mono (all data: scores, amounts, reason codes, reference numbers, dates).

**Signature element**: the stamp. The instant a decision is computed, a rotated, ink-textured verdict (`APPROVED` / `APPROVED REDUCED` / `REJECTED`) lands on the file with a quick scale-punch animation (`prefers-reduced-motion` disables the animation, keeps the final state).

## 4. Site structure

Single React app, client-side routed (`react-router-dom`, new dependency for `packages/ui`).

- **`/` — Home**: hero as case-file cover sheet (full-viewport, IBM Plex Serif headline, two CTAs: "Open a file" → `/console`, "How it works" → `/how-it-works`). Below the fold: three scroll-revealed scenes previewing the waterfall (gates checklist, segment fork, score ledger) using real PRD figures (the demo-case-2 numbers), each linking deeper into `/how-it-works`.
- **`/how-it-works`**: the full 9-step waterfall as sequential scenes (validate → gates → route → score → grade → policy → caps → reasons → decision), each using the structural devices proven in the mockup — an accumulating checklist for gates, a literal document fork for segment routing, a ledger tally for scoring — captioned with real PRD explanations (§5's "why gates come first," §5's GST-vs-turnover reasoning, etc.), not generic copy.
- **`/console`** — the real tool, two sub-views:
  - **Decisions** (default): featured case cards (3, pulled from real persona data — demo-1, demo-2, demo-3) + "browse all 17" (grouped by segment, real `GET /api/personas`) → selecting one calls `POST /api/decisions` for real → renders the file (grade/score/offer terms + live stamp), reason codes panel (real ranked codes + sentences + point deltas, advisory codes correctly show no points), trace panel (real step count, collapsible), and the override form (real 5-code select, real submit to `POST /api/decisions/:id/override`, real re-fetch via `GET .../override` on selection change — no stale override bleeding across applicants, matching the behavior already verified in the current implementation).
  - **Monitoring**: real `GET /api/monitoring/summary` — score histogram (10 real buckets), grade distribution, gate-hit counts, restyled as ledger-style bar rows in the same paper/ink language.

## 5. Component approach

Existing components (`DecisionPanel`, `ReasonCodesList`, `WaterfallTrace`, `MonitoringPanel`, `OverridePanel`, `PersonaPicker`, `api.ts`) are restyled and restructured, not thrown away — their data-fetching logic (fetch calls, loading/error states, the no-stale-override-on-applicant-switch behavior) is already correct and tested manually; the work is presentation, plus the new card-based picker and page routing.

## 6. Explicitly out of scope

No backend/schema/engine changes. No new API endpoints beyond the 7 that exist. No changes to scoring, gates, or policy logic. No new personas. Existing test suites (118 tests across `shared`/`engine`/`api`) must continue to pass unmodified — this is presentation-layer work only.
