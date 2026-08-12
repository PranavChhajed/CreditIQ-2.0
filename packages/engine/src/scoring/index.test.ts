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
});
