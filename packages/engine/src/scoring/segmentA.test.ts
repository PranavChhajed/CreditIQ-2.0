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
});
