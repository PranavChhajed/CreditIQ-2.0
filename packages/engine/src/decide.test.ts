import { describe, it, expect } from 'vitest';
import { decide } from './decide.js';
import { validPersonaBase } from '@creditiq/shared/src/testFixtures.js';

describe('decide', () => {
  it('rejects at the gate with no score computed', () => {
    const raw = validPersonaBase('A');
    raw.live_overdue_amount = 5000;
    const decision = decide(raw);
    expect(decision.outcome).toBe('reject');
    expect(decision.score).toBeNull();
    expect(decision.reason_codes).toHaveLength(1);
    expect(decision.reason_codes[0].code).toBe('BUR_LIVE_OVERDUE');
    expect(decision.trace.find((t) => t.stage === 'scoring')).toBeUndefined();
  });

  it('approves a clean applicant with a full trace and stamped versions', () => {
    const raw = validPersonaBase('A');
    const decision = decide(raw);
    expect(decision.outcome).toBe('approve');
    expect(decision.score).toBeGreaterThan(0);
    expect(decision.grade).not.toBeNull();
    expect(decision.offer_amount).toBeGreaterThan(0);
    expect(decision.model_version).toBeTruthy();
    expect(decision.policy_version).toBeTruthy();
    expect(decision.trace.length).toBe(9);
  });

  it('rejects invalid input before any gate runs', () => {
    const decision = decide({ not: 'a valid applicant' });
    expect(decision.outcome).toBe('reject');
    expect(decision.reason_codes[0].code).toBe('VAL_SCHEMA_INVALID');
    expect(decision.trace).toHaveLength(1);
  });

  it('rejects on score alone when every gate passes but the score lands below 500 (grade null)', () => {
    const raw = validPersonaBase('A');
    // Every gate-relevant field stays within its passing threshold (live_overdue_amount, max_dpd_12m,
    // suit_filed, settlement_last_24m, num_distinct_lenders_30d, num_tradelines/bureau_score-not-null,
    // FOIR under the 0.55 cap, age+tenure, epfo vintage >= 12) while every scoring factor is pushed to
    // its worst non-gate-triggering bucket.
    raw.bureau_score = 500;
    raw.credit_utilization_pct_current = 90;
    raw.credit_utilization_pct_3m_ago = 50;
    raw.insufficient_funds_bounce_count_6m = 3;
    raw.delinquency_events = [{ dpd: 89, months_ago: 0 }];
    raw.credit_history_age_months = 6;
    raw.num_enquiries_30d = 3;
    raw.num_distinct_lenders_30d = 1;
    raw.epfo_employment_vintage_months = 12;
    raw.employer_category = 'unverifiable';
    raw.salary_inflow_profile = { avg_monthly_credit: 50000, stability_pct: 0 };
    raw.avg_monthly_bank_inflow_6m = 50000;
    raw.existing_monthly_obligations = 10000;
    raw.requested_amount = 400000;
    raw.requested_tenure_months = 36;

    const decision = decide(raw);
    expect(decision.outcome).toBe('reject');
    expect(typeof decision.score).toBe('number');
    expect(decision.score).not.toBeNull();
    expect(decision.grade).toBeNull();
    expect(decision.offer_amount).toBeNull();
    expect(decision.reason_codes.length).toBeGreaterThan(0);
    for (const rc of decision.reason_codes) {
      expect(rc.code.startsWith('BUR_') || rc.code.startsWith('CAP_')).toBe(false);
    }
  });

  it('rejects with POL_BELOW_MIN_TICKET when the eligible amount falls below the product minimum', () => {
    const raw = validPersonaBase('A');
    // Income so low that even the best possible grade (A1, 12x multiplier) keeps the eligible amount
    // under the personal_loan product minimum (50000); requested_amount is kept small enough to also
    // stay under the FOIR gate cap regardless of which grade is actually attained.
    raw.avg_monthly_bank_inflow_6m = 3000;
    raw.salary_inflow_profile = { avg_monthly_credit: 3000, stability_pct: 90 };
    raw.existing_monthly_obligations = 0;
    raw.requested_amount = 40000;
    raw.requested_tenure_months = 36;

    const decision = decide(raw);
    expect(decision.outcome).toBe('reject');
    expect(decision.offer_amount).toBeNull();
    expect(decision.reason_codes.some((rc) => rc.code === 'POL_BELOW_MIN_TICKET')).toBe(true);
  });

  it('approves with a reduced offer and appends POL_AMOUNT_REDUCED after the ranked scoring factors', () => {
    const raw = validPersonaBase('A');
    // Income/grade combination whose eligible amount (income * grade multiplier) is comfortably above
    // the product minimum but below the requested amount, forcing a reduced-but-approved offer.
    raw.avg_monthly_bank_inflow_6m = 40000;
    raw.salary_inflow_profile = { avg_monthly_credit: 40000, stability_pct: 90 };
    raw.existing_monthly_obligations = 2000;
    raw.requested_amount = 480000;
    raw.requested_tenure_months = 36;

    const decision = decide(raw);
    expect(decision.outcome).toBe('approve');
    expect(decision.offer_amount).not.toBeNull();
    expect(decision.offer_amount as number).toBeLessThan(raw.requested_amount);
    expect(decision.reason_codes.some((rc) => rc.code === 'POL_AMOUNT_REDUCED')).toBe(true);
    const policyIndex = decision.reason_codes.findIndex((rc) => rc.code === 'POL_AMOUNT_REDUCED');
    expect(policyIndex).toBe(decision.reason_codes.length - 1);
    expect(policyIndex).toBeGreaterThan(0);
  });
});
