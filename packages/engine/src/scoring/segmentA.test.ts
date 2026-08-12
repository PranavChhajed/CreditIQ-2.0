import { describe, it, expect } from 'vitest';
import { scoreSegmentA } from './segmentA.js';
import { ingest } from '../ingest.js';
import { validPersonaBase } from '@creditiq/shared/src/testFixtures.js';

describe('scoreSegmentA', () => {
  it('rewards long EPFO vintage and penalizes an unverifiable employer', () => {
    const raw = validPersonaBase('A');
    raw.epfo_employment_vintage_months = 70;
    raw.employer_category = 'unverifiable';
    const fv = ingest(raw);
    const scores = scoreSegmentA(fv);
    expect(scores.find((s) => s.code === 'epfo_vintage')?.points).toBe(45);
    expect(scores.find((s) => s.code === 'employer_category')?.points).toBe(-25);
  });

  it('returns exactly the 3 segment-A codes', () => {
    const fv = ingest(validPersonaBase('A'));
    const codes = scoreSegmentA(fv).map((s) => s.code).sort();
    expect(codes).toEqual(['employer_category', 'epfo_vintage', 'salary_stability'].sort());
  });

  describe('boundary-value regression tests (spec §5 [min, next_min) intervals)', () => {
    it('epfo_vintage at exactly 24 months resolves to 24 bucket → +10', () => {
      const raw = validPersonaBase('A');
      raw.epfo_employment_vintage_months = 24;
      const fv = ingest(raw);
      const scores = scoreSegmentA(fv);
      expect(scores.find((s) => s.code === 'epfo_vintage')?.points).toBe(10);
    });

    it('epfo_vintage at exactly 36 months resolves to 36 bucket → +25', () => {
      const raw = validPersonaBase('A');
      raw.epfo_employment_vintage_months = 36;
      const fv = ingest(raw);
      const scores = scoreSegmentA(fv);
      expect(scores.find((s) => s.code === 'epfo_vintage')?.points).toBe(25);
    });

    it('epfo_vintage at exactly 60 months resolves to 60 bucket → +45', () => {
      const raw = validPersonaBase('A');
      raw.epfo_employment_vintage_months = 60;
      const fv = ingest(raw);
      const scores = scoreSegmentA(fv);
      expect(scores.find((s) => s.code === 'epfo_vintage')?.points).toBe(45);
    });

    it('salary_stability at exactly 70% resolves to 70 bucket → -10', () => {
      const raw = validPersonaBase('A');
      raw.salary_inflow_profile = { avg_monthly_credit: 82000, stability_pct: 70 };
      const fv = ingest(raw);
      const scores = scoreSegmentA(fv);
      expect(scores.find((s) => s.code === 'salary_stability')?.points).toBe(-10);
    });

    it('salary_stability at exactly 85% resolves to 85 bucket → +15', () => {
      const raw = validPersonaBase('A');
      raw.salary_inflow_profile = { avg_monthly_credit: 82000, stability_pct: 85 };
      const fv = ingest(raw);
      const scores = scoreSegmentA(fv);
      expect(scores.find((s) => s.code === 'salary_stability')?.points).toBe(15);
    });

    it('salary_stability at exactly 95% resolves to 95 bucket → +35', () => {
      const raw = validPersonaBase('A');
      raw.salary_inflow_profile = { avg_monthly_credit: 82000, stability_pct: 95 };
      const fv = ingest(raw);
      const scores = scoreSegmentA(fv);
      expect(scores.find((s) => s.code === 'salary_stability')?.points).toBe(35);
    });
  });
});
