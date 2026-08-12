import { describe, it, expect } from 'vitest';
import { scoreSharedFactors } from './shared.js';
import { ingest } from '../ingest.js';
import { validPersonaBase } from '@creditiq/shared/src/testFixtures.js';

describe('scoreSharedFactors', () => {
  it('gives a clean applicant the maximum bureau_score points', () => {
    const raw = validPersonaBase('A');
    raw.bureau_score = 820;
    const fv = ingest(raw);
    const scores = scoreSharedFactors(fv);
    const bureau = scores.find((s) => s.code === 'bureau_score');
    expect(bureau?.points).toBe(90);
  });

  it('penalizes a rising utilization trend even at a moderate level', () => {
    const raw = validPersonaBase('A');
    raw.credit_utilization_pct_current = 65;
    raw.credit_utilization_pct_3m_ago = 50; // +15pp = worsened >10pp
    const fv = ingest(raw);
    const scores = scoreSharedFactors(fv);
    const trend = scores.find((s) => s.code === 'utilization_trend');
    expect(trend?.points).toBe(-35);
  });

  it('returns exactly the 8 shared factor codes', () => {
    const fv = ingest(validPersonaBase('A'));
    const codes = scoreSharedFactors(fv).map((s) => s.code).sort();
    expect(codes).toEqual([
      'bureau_score', 'credit_history_age', 'delinquency_recency', 'enquiry_per_lender',
      'foir', 'insufficient_funds_bounces', 'utilization_level', 'utilization_trend',
    ].sort());
  });
});
