import { describe, it, expect } from 'vitest';
import { scoreSegmentD } from './segmentD.js';
import { ingest } from '../ingest.js';
import { validPersonaBase } from '@creditiq/shared/src/testFixtures.js';

describe('scoreSegmentD', () => {
  it('is the heaviest single factor: 7 late filings out of 12 costs 60 points', () => {
    const raw = validPersonaBase('D');
    raw.gst_filing_profile = { late_filings_12m: 7, total_filings_12m: 12 };
    const fv = ingest(raw);
    const scores = scoreSegmentD(fv);
    expect(scores.find((s) => s.code === 'gst_filing_punctuality')?.points).toBe(-60);
  });

  it('does not score declared_annual_turnover at all', () => {
    const fv = ingest(validPersonaBase('D'));
    const codes = scoreSegmentD(fv).map((s) => s.code);
    expect(codes).not.toContain('turnover');
    expect(codes.sort()).toEqual(['business_inflow_volatility', 'business_vintage', 'gst_filing_punctuality'].sort());
  });
});
