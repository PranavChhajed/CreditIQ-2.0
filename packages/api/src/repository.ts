import type { Decision, DecisionOverride, GateCode, Grade, MonitoringSummary, OverrideReasonCode } from '@creditiq/shared';
import type { Db } from './db.js';

export function saveDecision(db: Db, decision: Decision): void {
  db.prepare(`
    INSERT OR REPLACE INTO decisions
      (applicant_id, outcome, grade, score, offer_amount, offer_tenure_months, offer_rate_pct, offer_emi,
       model_version, policy_version, reason_codes_json, trace_json)
    VALUES (@applicant_id, @outcome, @grade, @score, @offer_amount, @offer_tenure_months, @offer_rate_pct, @offer_emi,
            @model_version, @policy_version, @reason_codes_json, @trace_json)
  `).run({
    applicant_id: decision.applicant_id,
    outcome: decision.outcome,
    grade: decision.grade,
    score: decision.score,
    offer_amount: decision.offer_amount,
    offer_tenure_months: decision.offer_tenure_months,
    offer_rate_pct: decision.offer_rate_pct,
    offer_emi: decision.offer_emi,
    model_version: decision.model_version,
    policy_version: decision.policy_version,
    reason_codes_json: JSON.stringify(decision.reason_codes),
    trace_json: JSON.stringify(decision.trace),
  });
}

interface Row {
  applicant_id: string; outcome: string; grade: string | null; score: number | null;
  offer_amount: number | null; offer_tenure_months: number | null; offer_rate_pct: number | null;
  offer_emi: number | null; model_version: string; policy_version: string;
  reason_codes_json: string; trace_json: string; created_at: string;
}

function rowToDecision(row: Row): Decision {
  return {
    applicant_id: row.applicant_id,
    outcome: row.outcome as Decision['outcome'],
    grade: row.grade as Decision['grade'],
    score: row.score,
    offer_amount: row.offer_amount,
    offer_tenure_months: row.offer_tenure_months,
    offer_rate_pct: row.offer_rate_pct,
    offer_emi: row.offer_emi,
    model_version: row.model_version,
    policy_version: row.policy_version,
    reason_codes: JSON.parse(row.reason_codes_json),
    trace: JSON.parse(row.trace_json),
  };
}

export function getDecision(db: Db, applicantId: string): Decision | null {
  const row = db.prepare('SELECT * FROM decisions WHERE applicant_id = ?').get(applicantId) as Row | undefined;
  return row ? rowToDecision(row) : null;
}

export interface DecisionSummary {
  applicant_id: string; outcome: string; grade: string | null; score: number | null; created_at: string;
}

export function listDecisions(db: Db, limit: number): DecisionSummary[] {
  return db.prepare(
    'SELECT applicant_id, outcome, grade, score, created_at FROM decisions ORDER BY created_at DESC LIMIT ?',
  ).all(limit) as unknown as DecisionSummary[];
}

const SCORE_BUCKET_WIDTH = 100;

/** F15 — computed on read from the existing decisions table; no separate monitoring state is stored. */
export function getMonitoringSummary(db: Db): MonitoringSummary {
  const totalRow = db.prepare('SELECT COUNT(*) as count FROM decisions').get() as { count: number };

  const outcomeRows = db.prepare(
    'SELECT outcome, COUNT(*) as count FROM decisions GROUP BY outcome',
  ).all() as { outcome: string; count: number }[];
  const outcome_counts = { approve: 0, reject: 0 };
  for (const row of outcomeRows) {
    if (row.outcome === 'approve' || row.outcome === 'reject') outcome_counts[row.outcome] = row.count;
  }

  const gradeRows = db.prepare(
    'SELECT grade, COUNT(*) as count FROM decisions WHERE grade IS NOT NULL GROUP BY grade',
  ).all() as { grade: Grade; count: number }[];
  const grade_distribution: Partial<Record<Grade, number>> = {};
  for (const row of gradeRows) grade_distribution[row.grade] = row.count;

  const scoreRows = db.prepare('SELECT score FROM decisions WHERE score IS NOT NULL').all() as { score: number }[];
  const bucketCounts = new Map<number, number>();
  for (let min = 0; min < 1000; min += SCORE_BUCKET_WIDTH) bucketCounts.set(min, 0);
  for (const { score } of scoreRows) {
    const bucketMin = Math.min(900, Math.floor(score / SCORE_BUCKET_WIDTH) * SCORE_BUCKET_WIDTH);
    bucketCounts.set(bucketMin, (bucketCounts.get(bucketMin) ?? 0) + 1);
  }
  const score_distribution = [...bucketCounts.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([min, count]) => ({ min, max: min + SCORE_BUCKET_WIDTH - 1, count }));

  // score IS NULL means rejected before scoring (a gate failure or a validation failure) — gate_hit_counts
  // covers both, keyed by the rank-1 reason code, since that's the sole code recorded for a pre-score reject.
  const gateRows = db.prepare(
    'SELECT reason_codes_json FROM decisions WHERE score IS NULL',
  ).all() as { reason_codes_json: string }[];
  const gateCounts = new Map<GateCode, number>();
  for (const row of gateRows) {
    const codes = JSON.parse(row.reason_codes_json) as { code: GateCode }[];
    const first = codes[0]?.code;
    if (first) gateCounts.set(first, (gateCounts.get(first) ?? 0) + 1);
  }
  const gate_hit_counts = [...gateCounts.entries()]
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => b.count - a.count);

  return { total_decisions: totalRow.count, outcome_counts, grade_distribution, score_distribution, gate_hit_counts };
}

export function saveOverride(db: Db, override: DecisionOverride): void {
  db.prepare(`
    INSERT OR REPLACE INTO overrides
      (applicant_id, original_outcome, override_outcome, reason_code, reason_text, overridden_by)
    VALUES (@applicant_id, @original_outcome, @override_outcome, @reason_code, @reason_text, @overridden_by)
  `).run({
    applicant_id: override.applicant_id,
    original_outcome: override.original_outcome,
    override_outcome: override.override_outcome,
    reason_code: override.reason_code,
    reason_text: override.reason_text,
    overridden_by: override.overridden_by,
  });
}

interface OverrideRow {
  applicant_id: string; original_outcome: string; override_outcome: string;
  reason_code: string; reason_text: string | null; overridden_by: string; created_at: string;
}

export function getOverride(db: Db, applicantId: string): DecisionOverride | null {
  const row = db.prepare('SELECT * FROM overrides WHERE applicant_id = ?').get(applicantId) as OverrideRow | undefined;
  if (!row) return null;
  return {
    applicant_id: row.applicant_id,
    original_outcome: row.original_outcome as DecisionOverride['original_outcome'],
    override_outcome: row.override_outcome as DecisionOverride['override_outcome'],
    reason_code: row.reason_code as OverrideReasonCode,
    reason_text: row.reason_text,
    overridden_by: row.overridden_by,
    created_at: row.created_at,
  };
}
