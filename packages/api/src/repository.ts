import type { Decision } from '@creditiq/shared';
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
  ).all(limit) as DecisionSummary[];
}
