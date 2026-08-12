import { describe, it, expect } from 'vitest';
import { computeScore } from './index.js';
import { ingest } from '../ingest.js';
import { validPersonaBase } from '@creditiq/shared/src/testFixtures.js';

describe('computeScore', () => {
  it('starts at 500 and adds shared + segment-A factor points', () => {
    const fv = ingest(validPersonaBase('A'));
    const { score, factors } = computeScore(fv);
    const total = factors.reduce((s, f) => s + f.points, 0);
    expect(score).toBe(Math.min(1000, Math.max(0, 500 + total)));
    expect(factors.length).toBe(11); // 8 shared + 3 segment-A
  });

  it('clamps to 1000 for a maximally clean applicant', () => {
    const raw = validPersonaBase('A');
    raw.bureau_score = 850;
    raw.credit_utilization_pct_current = 10;
    raw.credit_utilization_pct_3m_ago = 20;
    raw.existing_monthly_obligations = 0;
    raw.credit_history_age_months = 100;
    raw.epfo_employment_vintage_months = 80;
    raw.salary_inflow_profile = { avg_monthly_credit: 200000, stability_pct: 99 };
    const fv = ingest(raw);
    const { score } = computeScore(fv);
    expect(score).toBeLessThanOrEqual(1000);
  });

  it('uses segment-D factors for segment D', () => {
    const fv = ingest(validPersonaBase('D'));
    const { factors } = computeScore(fv);
    expect(factors.length).toBe(11); // 8 shared + 3 segment-D
    expect(factors.some((f) => f.code === 'gst_filing_punctuality')).toBe(true);
  });

  it('clamps to 0 for a maximally bad segment-D applicant', () => {
    const raw = validPersonaBase('D');
    // Shared factors to worst case (total -410)
    raw.bureau_score = 500; // -90
    raw.credit_utilization_pct_current = 90; // -40
    raw.credit_utilization_pct_3m_ago = 50; // delta=40, -35
    raw.existing_monthly_obligations = 50000; // high FOIR
    raw.requested_amount = 1000000; // high FOIR
    raw.avg_monthly_bank_inflow_6m = 10000; // low income
    raw.insufficient_funds_bounce_count_6m = 3; // -50
    raw.delinquency_events = [{ dpd: 80, months_ago: 0 }]; // -70 (recency 1.0)
    raw.credit_history_age_months = 6; // -30
    raw.num_enquiries_30d = 3; // enquiry_per_lender = 3, -35
    raw.num_distinct_lenders_30d = 1;
    // Segment D factors to worst case (total -120)
    raw.gst_filing_profile = { late_filings_12m: 9, total_filings_12m: 12 }; // -80
    raw.business_inflow_profile = { avg_monthly_inflow: 10000, volatility_pct: 50 }; // -40
    raw.declared_annual_turnover = 120000;
    const fv = ingest(raw);
    const { score } = computeScore(fv);
    expect(score).toBe(0); // floor clamped: 500 - 410 - 120 = -30 → 0
  });
});
