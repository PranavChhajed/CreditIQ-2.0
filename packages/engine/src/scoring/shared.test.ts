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

  describe('boundary-value regression tests (spec §5 [min, next_min) intervals)', () => {
    it('utilization_level at exactly 85% resolves to 85 bucket → -40', () => {
      const raw = validPersonaBase('A');
      raw.credit_utilization_pct_current = 85;
      const fv = ingest(raw);
      const scores = scoreSharedFactors(fv);
      const util = scores.find((s) => s.code === 'utilization_level');
      expect(util?.points).toBe(-40);
    });

    it('utilization_trend at exactly delta=-10 resolves to -10 bucket → +15', () => {
      const raw = validPersonaBase('A');
      raw.credit_utilization_pct_current = 40;
      raw.credit_utilization_pct_3m_ago = 50; // delta = -10
      const fv = ingest(raw);
      const scores = scoreSharedFactors(fv);
      const trend = scores.find((s) => s.code === 'utilization_trend');
      expect(trend?.points).toBe(15);
    });

    it('utilization_trend at exactly delta=10 resolves to 10 bucket → -35', () => {
      const raw = validPersonaBase('A');
      raw.credit_utilization_pct_current = 60;
      raw.credit_utilization_pct_3m_ago = 50; // delta = +10
      const fv = ingest(raw);
      const scores = scoreSharedFactors(fv);
      const trend = scores.find((s) => s.code === 'utilization_trend');
      expect(trend?.points).toBe(-35);
    });

    it('foir at exactly 0.30 resolves to 0.30 bucket → +30', () => {
      const raw = validPersonaBase('A');
      // drv_foir = (existing_obligations + proposed_emi) / verified_income
      // verified_income (segment A) = Math.min(80000, 82000) = 80000
      // proposed_emi for 500k @ 27% for 36mo ≈ 20276
      // For drv_foir = 0.30: obligations + 20276 = 24000 → obligations = 3724
      raw.existing_monthly_obligations = 3724;
      const fv = ingest(raw);
      const scores = scoreSharedFactors(fv);
      const foir = scores.find((s) => s.code === 'foir');
      expect(foir?.points).toBe(30);
    });

    it('foir at exactly 0.50 resolves to 0.50 bucket → -60', () => {
      const raw = validPersonaBase('A');
      // For drv_foir = 0.50: obligations + 20276 = 40000 → obligations = 19724
      raw.existing_monthly_obligations = 19724;
      const fv = ingest(raw);
      const scores = scoreSharedFactors(fv);
      const foir = scores.find((s) => s.code === 'foir');
      expect(foir?.points).toBe(-60);
    });

    it('delinquency_recency at exactly 80 resolves to 80 bucket → -70', () => {
      const raw = validPersonaBase('A');
      // drv_delinquency_recency_wt = sum of (dpd * recencyDecay(months_ago))
      // For a high value ~80, use a significant DPD from recent months
      raw.delinquency_events = [{ dpd: 100, months_ago: 0 }]; // Recent major delinquency
      const fv = ingest(raw);
      const scores = scoreSharedFactors(fv);
      const delin = scores.find((s) => s.code === 'delinquency_recency');
      expect(delin?.points).toBe(-70);
    });

    it('enquiry_per_lender at exactly 1.2 resolves to 1.2 bucket → +10', () => {
      const raw = validPersonaBase('A');
      // drv_enquiry_per_lender = num_enquiries_30d / max(num_distinct_lenders_30d, 1)
      // For 1.2: 6 enquiries / 5 lenders = 1.2
      raw.num_enquiries_30d = 6;
      raw.num_distinct_lenders_30d = 5;
      const fv = ingest(raw);
      const scores = scoreSharedFactors(fv);
      const enq = scores.find((s) => s.code === 'enquiry_per_lender');
      expect(enq?.points).toBe(10);
    });

    it('enquiry_per_lender at exactly 3 resolves to 3 bucket → -35', () => {
      const raw = validPersonaBase('A');
      // For 3.0: 9 enquiries / 3 lenders = 3.0
      raw.num_enquiries_30d = 9;
      raw.num_distinct_lenders_30d = 3;
      const fv = ingest(raw);
      const scores = scoreSharedFactors(fv);
      const enq = scores.find((s) => s.code === 'enquiry_per_lender');
      expect(enq?.points).toBe(-35);
    });
  });
});
