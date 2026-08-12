# CreditIQ — Product Requirements Document

**Version** 1.0
**Date** 11 August 2026
**Status** v1 in development
**Team** 2 engineers

---

## 1. Summary

CreditIQ is a lender-facing automated underwriting engine for the Indian credit market. It takes an applicant's financial data, applies a scorecard matched to their income type, and returns an approve/reject decision with a loan offer and plain-English reasons.

**The problem it solves:** Indian lenders assess a salaried employee and a small business owner with the same generic scorecard, because building separate ones is expensive. This misprices both. A salaried applicant's risk lives in employment stability and salary regularity; an MSME's lives in business cash flow and tax-filing discipline. One scorecard cannot see both.

**What makes it different:** segment-specific underwriting with full decision traceability. Every decision carries a ranked set of reason codes and a step-by-step audit trail, which is a regulatory requirement in Indian lending, not a nice-to-have.

---

## 2. Goals and non-goals

### Goals

| # | Goal | How we know it worked |
|---|---|---|
| G1 | Route applicants to the correct scorecard by income type | Segment A and D produce measurably different outcomes on comparable applicants |
| G2 | Return an auditable decision for every application | 100% of decisions carry a waterfall trace and ranked reason codes |
| G3 | Reject clearly ineligible applicants before scoring | Hard gates evaluated first; score never computed on a gate failure |
| G4 | Turn a risk grade into a concrete offer | Amount, tenure, rate produced for every approval |
| G5 | Keep policy separate from scoring | Limits and rates changeable without touching model code |

### Non-goals for v1

Explicitly out of scope. Listing these prevents scope creep and answers the obvious questions before they're asked.

- **Secured lending.** No home, vehicle, LAP, or gold. Collateral valuation, title verification and charge registration are a substantial branch of work.
- **A trained ML model.** No historical repayment data exists, so there is nothing to fit. See §9.
- **Live data integrations.** Mock data only. Real bureau, AA, GSTN and EPFO connections require commercial agreements.
- **New-to-credit applicants.** Rejected with a clear reason code. Thin-file lending needs its own scorecard and tighter caps.
- **Self-employed professionals (Segment C).** Deferred to keep v1 scope achievable.
- **Collections, servicing, disbursal.** Underwriting only.

---

## 3. Users

### Primary — Credit underwriter

Reviews applications the engine refers for manual decision, and overrides automated decisions where justified.

**Needs:** to see not just the decision but *why*; to understand which factors drove the score; to override with a recorded reason.

**Success:** can explain any decision to a customer or an auditor without opening the code.

### Secondary — Credit policy manager

Owns risk appetite. Adjusts limits, rates and cut-offs as portfolio performance emerges.

**Needs:** to change policy without an engineering deploy.

**Success:** limits and rates live in a versioned config file, editable independently of the scorecard.

### Tertiary — Compliance / audit

Verifies decisions are defensible and non-discriminatory.

**Needs:** a full record of inputs, score, model version and policy version for every decision; confidence that no prohibited or proxy variables are in use.

**Success:** any historical decision is reconstructable; the parameter list contains no protected attributes or their proxies.

---

## 4. Scope

### Products

| Product | Segment | Amount | Max tenure | FOIR cap |
|---|---|---|---|---|
| **Personal Loan** | A — Salaried | ₹50,000 – ₹15,00,000 | 60 months | 0.55 |
| **Business Loan** | D — MSME | ₹1,00,000 – ₹30,00,000 | 48 months | 0.50 |

Both unsecured. One product per segment — the engine enforces this.

Business loans permit a higher ceiling on a shorter tenure, reflecting a faster business cash cycle and a shorter risk horizon. The tighter FOIR cap reflects greater income lumpiness in the segment.

### Segments

**Segment A — Salaried, formal employment.** Income is a monthly salary credit, verifiable through EPFO contribution history. Risk concentrates in employment stability and existing obligation load.

**Segment D — MSME, GST-registered.** Income is a business surplus, verifiable through GST turnover and banking inflows. Risk concentrates in business cash flow, filing discipline and inflow volatility.

---

## 5. How the engine works

### The decision waterfall

Order is deliberate. Cheap deterministic checks run before expensive scoring, so an obviously ineligible application is rejected in microseconds with a clean reason.

| Step | Stage | Outcome |
|---|---|---|
| 1 | Input validation | Reject malformed input |
| 2 | Hard gates | Reject on any failure; **score never computed** |
| 3 | Segment routing | Select scorecard |
| 4 | Scoring | 0–1000 |
| 5 | Grade banding | A1 … D3 |
| 6 | Policy matrix | Amount, tenure, rate |
| 7 | Product caps | Apply ceilings |
| 8 | Reason codes | Rank top contributing factors |
| 9 | Emit decision | With full trace |

**Why gates come first.** An applicant currently overdue on an existing loan should not receive a credit score at all. Scoring them implies the score could rescue them, which it cannot. This also produces cleaner reason codes: the customer is told about the overdue account, not given a score breakdown that buries it.

### Hard gates

| Gate | Threshold | Reason code |
|---|---|---|
| Live overdue | > ₹500 | `BUR_LIVE_OVERDUE` |
| Severe recent delinquency | 90+ DPD in 12m | `BUR_RECENT_SEVERE_DELINQ` |
| Legal action | Suit filed | `BUR_SUIT_FILED` |
| Settlement | Any in 24m | `BUR_SETTLEMENT` |
| Enquiry velocity | > 6 distinct lenders in 30d | `BUR_ENQUIRY_VELOCITY` |
| Thin file | < 2 tradelines or no bureau hit | `BUR_THIN_FILE` |
| Capacity | FOIR > product cap | `CAP_FOIR_EXCEEDED` |
| Age vs tenure | Age + tenure > 60 years | `AGE_TENURE_MISMATCH` |
| Employment vintage (A) | < 12 months EPFO | `EMP_INSUFFICIENT_VINTAGE` |
| Business vintage (D) | < 24 months | `BIZ_INSUFFICIENT_VINTAGE` |

**On enquiry velocity:** the count of *distinct lenders* matters more than the raw enquiry count. Six enquiries at one bank is rate shopping. Six at six different NBFCs is loan stacking, and a strong early-warning signal for first-payment default.

**On age:** used only as a mechanical constraint — the loan must end before retirement. It is not a general risk factor, and "young equals risky" is precisely the misuse this framing guards against.

### Scoring

Every applicant starts at 500 and moves on weighted factors. Shared factors apply to both segments; each segment adds its own.

**Shared:** bureau score, credit utilisation level and 3-month trend, FOIR, insufficient-funds bounces, recency-weighted delinquency, credit history age, enquiries per lender.

**Segment A adds:** EPFO employment vintage, employer category, salary inflow stability.

**Segment D adds:** GST filing punctuality, business vintage, business inflow volatility.

Three design decisions worth stating explicitly:

**GST filing punctuality is the heaviest single Segment D factor, weighted above turnover — which is not scored at all.** A business filing late seven months out of twelve is signalling operational and cash stress. Unlike stated turnover, filing history is tamper-resistant.

**Utilisation trend is scored separately from level.** A borrower at 60% and climbing is more dangerous than one at 75% and stable. Level alone misses the direction.

**Bounces are counted by reason code.** Only insufficient-funds bounces are scored. Technical and signature-mismatch bounces carry almost no signal, and collapsing them into a single count dilutes a strong predictor.

### Grade bands

| Grade | Score | Grade | Score |
|---|---|---|---|
| A1 | 900+ | B3 | 650–699 |
| A2 | 850–899 | C1 | 600–649 |
| A3 | 800–849 | C2 | 550–599 |
| B1 | 750–799 | C3 | 500–549 |
| B2 | 700–749 | D1–D3 | Below 500 — not approved |

### Policy matrix

Grade maps to a multiple of verified monthly income, a maximum tenure and a rate. Offer = `min(requested, income × multiplier)`, then capped by product ceiling.

Where the offer is below the requested amount, the decision remains **approve** — at a reduced amount, with a reason code explaining the reduction. A partial offer is a better outcome for both sides than a rejection.

**The matrix lives in its own versioned config file.** Business appetite changes far more often than the model does, and a rate change should never require touching scoring code.

---

## 6. Requirements

### Functional

| ID | Requirement | Priority |
|---|---|---|
| F1 | Validate every input against the schema before processing | Must |
| F2 | Evaluate hard gates before any scoring | Must |
| F3 | Route to the correct scorecard by segment | Must |
| F4 | Enforce one product per segment | Must |
| F5 | Produce a 0–1000 score and a grade | Must |
| F6 | Emit ranked reason codes on every decision | Must |
| F7 | Emit a step-by-step waterfall trace | Must |
| F8 | Produce a concrete offer on approval | Must |
| F9 | Apply product caps after the policy matrix | Must |
| F10 | Stamp model and policy version on every decision | Must |
| F11 | Generate synthetic applicants across defined personas | Must |
| F12 | Underwriter UI showing decision, score and reasons | Should |
| F13 | Flag debt-consolidation purpose combined with rising utilisation | Should |
| F14 | Record manual overrides with structured reasons | Could |
| F15 | Score distribution and gate-hit monitoring | Could |

### Non-functional

| ID | Requirement |
|---|---|
| N1 | Decision returned in under 100ms per application |
| N2 | Deterministic — identical input always produces identical output |
| N3 | Every reason code maps to a customer-safe sentence |
| N4 | No protected attributes or their proxies in the parameter set |
| N5 | Full input vector reconstructable from the decision record |
| N6 | Policy config changeable without a code deploy |

**On N2, determinism.** This is a hard requirement, not a preference. The same applicant must receive the same decision every time, or the decision cannot be defended to a regulator. It is also the main architectural reason the credit decision itself is not delegated to a language model.

---

## 7. Excluded parameters

This section exists because what a credit model *refuses* to use is as important as what it uses.

### Prohibited

Religion, caste, community, gender, marital status, disability, political affiliation, mother tongue.

### Excluded because they silently carry the above

Salutation and honorifics; surname-derived community inference; name-based religion classification; photograph-derived attributes; application language.

**Surname inference deserves specific mention.** In India, surname is a near-direct caste and regional signal. Any feature engineering touching the name field beyond exact identity matching is a compliance incident waiting to happen.

### Excluded proxies — legal and widely used, refused anyway

| Parameter | Why refused |
|---|---|
| **Raw pincode** | Direct proxy for community and class in Indian cities. Textbook redlining |
| **Device make, model, price** | Near-clean proxy for income class and social background |
| **College or degree prestige** | Proxies caste, class and region |
| **Number of dependants** | Proxy for marital and family status. Verified obligations capture the same expense reality legitimately |

### Restricted under RBI Digital Lending Directions

Contacts list, call logs, SMS scraping, media access, social graph, continuous location. Both prohibited and — on the evidence — weakly predictive relative to their intrusiveness.

### Excluded for poor predictive quality

Self-declared income without corroboration; years at current address; email domain; count of bank accounts held.

**The test applied throughout:** a parameter that predicts well but has no plausible causal path to repayment is usually a proxy for something that cannot be used. Predictive lift alone is not sufficient justification.

---

## 8. Architecture

### Two-layer split

```
Ingestion  →  FeatureVector  →  Decision engine  →  Decision
```

The `FeatureVector` is a frozen contract of 38 fields — 2 routing, 13 bureau, 5 banking, 3 employment (Segment A), 4 business (Segment D), 4 loan, 6 derived, plus identity. Ingestion produces it; the decision engine consumes it. Neither layer knows anything about the other's internals.

**Why this matters beyond team coordination:** when v2 replaces mock data with live bureau, AA and GSTN integrations, only the ingestion layer changes. The decision engine never learns the data source changed.

### Derived features

Six values are computed during ingestion rather than scored raw, because the derived form carries more signal:

| Feature | Definition |
|---|---|
| `drv_income_verified` | Conservative income — the **minimum** across available independent sources |
| `drv_foir_post_emi` | Total obligations including the proposed EMI, over income |
| `drv_ticket_to_income` | Loan amount over annual income |
| `drv_enquiry_per_lender` | Enquiries over distinct lenders |
| `drv_delinquency_recency_wt` | Delinquency severity decayed by recency |
| `drv_proposed_emi` | EMI at the indicative rate |

**Taking the minimum across income sources is deliberate.** It is conservative, defensible under audit, and creates the right incentive — applicants providing corroborating documentation receive better terms.

**Recency weighting on delinquency** ensures a 30-day delay three months ago outweighs a 90-day delay thirty months ago. Recent behaviour predicts near-term repayment better than distant severity.

---

## 9. On the absence of a trained model

**Position: v1 deliberately uses an expert-judgment scorecard, not machine learning.**

Supervised learning needs labelled outcomes — which applicants actually defaulted. That data does not exist until real loans have been disbursed and observed for 12 to 18 months.

The available shortcut is to generate synthetic applicants, label some as defaulters by rule, train on it, and report a high AUC. **We tested this: it produces 0.998 AUC on a held-out set.** The number is worthless — the model has only rediscovered the rule that generated the labels. It measures nothing about real borrowers.

Public datasets do not solve this either. Lending Club and Home Credit contain no Indian data sources — no GST filing punctuality, no EPFO continuity, no CIBIL semantics — and their applicant populations differ fundamentally. Fitting weights on them and deploying against Indian applicants produces a model that is confidently wrong.

**This mirrors real lending practice.** Lenders launch on expert-judgment scorecards and refit empirically once performance data accumulates. Even mature lenders predominantly use logistic regression rather than gradient boosting, because RBI requires an explainable rejection reason for every decline. A model that cannot decompose into "this factor cost 40 points" is a regulatory problem regardless of accuracy.

The architecture is designed for empirical refitting. Weights are isolated in a single module; replacing judgment-set values with fitted coefficients requires no structural change.

---

## 10. Roadmap

### v2 — Live data

Replace mock ingestion with bureau, Account Aggregator, GSTN, EPFO and ITR integrations. Only the ingestion layer changes.

Add **confidence tiering** so the engine degrades gracefully when a source is unavailable, rather than erroring:

| Tier | Data available | Effect |
|---|---|---|
| T1 | Bureau + AA + segment source | Full limit, best pricing |
| T2 | One source missing | 70% limit, +100bps |
| T3 | Bureau only | 40% limit, +250bps, tenure ≤ 24m |
| T4 | Thin bureau file | Minimum ticket |

### v3 — Coverage

- **Segment C** — self-employed professionals, on ITR and professional registration
- **Thin-file scorecard** — alternative signals: rent, utility, insurance continuity, with capped exposure and a graduation path at 6 months of clean conduct
- **Secured products** — home, vehicle, LAP. Adds LTV, valuation, title and charge registration

### v4 — Learning

- Empirical refit once ~500 observed defaults per segment exist
- **Reject inference** — the model only observes approved loans, so without correction it narrows progressively into existing policy blind spots. A random-approval holdout on marginal applications is expensive and the only clean source of counterfactual data
- Drift monitoring with auto-retirement of features whose relationship inverts

### Agricultural lending

Deferred as a distinct workstream. Agri breaks the core model structurally: income is seasonal rather than monthly, repayment is harvest-aligned rather than EMI-based, and risk is **covariate** — a drought hits every borrower in a district simultaneously, which is fundamentally different from idiosyncratic default risk and requires district-and-crop concentration limits.

Distinctive parameters would include land holding and irrigation source, crop pattern and district scale-of-finance, KCC conduct, crop insurance coverage, and rainfall deviation. Irrigation source is the highest-signal single variable — rain-fed land carries several times the income volatility of assured-irrigation land at identical acreage.

---

## 11. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Judgment weights poorly calibrated | Mispriced risk | Conservative launch thresholds; monitor score distribution; refit when data allows |
| Synthetic data hides real-world edge cases | Production failures | Deliberate edge-case fixtures; graceful degradation |
| Contract drift between layers | Integration failure | Frozen schema, shared enums, validation both sides |
| Proxy discrimination via an unexamined feature | Regulatory and reputational | Exclusion list; no name-derived features; fairness testing before live launch |
| Overconfidence in synthetic metrics | Misleading stakeholders | No accuracy figure reported; position documented in §9 |

---

## 12. Success criteria

### v1 demo

- [ ] Both segments produce valid decisions across all personas
- [ ] Gate rejections short-circuit before scoring
- [ ] Every decision carries ranked reason codes and a trace
- [ ] Product caps enforced correctly
- [ ] Score distribution is plausible — not clustered at a single value
- [ ] Three demo cases run end to end

### Demo cases

| # | Case | Expected | Demonstrates |
|---|---|---|---|
| 1 | Salaried, clean → Personal Loan | Approve, full amount, best rate | Happy path |
| 2 | MSME, clean bureau but poor GST filing → Business Loan | **Approve at reduced limit** | Segment-specific insight |
| 3 | Live overdue | Reject at gate, no score | Waterfall short-circuit and clear reasons |

**Case 2 is the core demonstration.** The applicant has a 718 bureau score and a clean repayment record. A generic scorecard approves at full value. CreditIQ reduces the limit, because the business files GST late seven months out of twelve — and filing punctuality is a better predictor of MSME stress than turnover is. That difference is the entire product thesis in a single application.

---

## Appendix — Glossary

| Term | Meaning |
|---|---|
| **AA** | Account Aggregator — RBI framework for consented financial data sharing |
| **DPD** | Days Past Due |
| **EPFO** | Employees' Provident Fund Organisation — verifies formal employment |
| **FOIR** | Fixed Obligation to Income Ratio — obligations over income |
| **KCC** | Kisan Credit Card |
| **LTV** | Loan to Value |
| **MSME** | Micro, Small and Medium Enterprise |
| **NTC** | New to Credit — no bureau history |
| **Thin file** | Minimal credit history, insufficient for standard scoring |
| **Tradeline** | An individual credit account on a bureau report |
