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

  describe('boundary-value regression tests (spec §5 [min, next_min) intervals)', () => {
    it('gst_filing_punctuality at exactly 1 late filing resolves to 1 bucket → +30', () => {
      const raw = validPersonaBase('D');
      raw.gst_filing_profile = { late_filings_12m: 1, total_filings_12m: 12 };
      const fv = ingest(raw);
      const scores = scoreSegmentD(fv);
      expect(scores.find((s) => s.code === 'gst_filing_punctuality')?.points).toBe(30);
    });

    it('gst_filing_punctuality at exactly 3 late filings resolves to 3 bucket → -30', () => {
      const raw = validPersonaBase('D');
      raw.gst_filing_profile = { late_filings_12m: 3, total_filings_12m: 12 };
      const fv = ingest(raw);
      const scores = scoreSegmentD(fv);
      expect(scores.find((s) => s.code === 'gst_filing_punctuality')?.points).toBe(-30);
    });

    it('gst_filing_punctuality at exactly 6 late filings resolves to 6 bucket → -60', () => {
      const raw = validPersonaBase('D');
      raw.gst_filing_profile = { late_filings_12m: 6, total_filings_12m: 12 };
      const fv = ingest(raw);
      const scores = scoreSegmentD(fv);
      expect(scores.find((s) => s.code === 'gst_filing_punctuality')?.points).toBe(-60);
    });

    it('gst_filing_punctuality at exactly 9 late filings resolves to 9 bucket → -80', () => {
      const raw = validPersonaBase('D');
      raw.gst_filing_profile = { late_filings_12m: 9, total_filings_12m: 12 };
      const fv = ingest(raw);
      const scores = scoreSegmentD(fv);
      expect(scores.find((s) => s.code === 'gst_filing_punctuality')?.points).toBe(-80);
    });

    it('business_vintage at exactly 36 months resolves to 36 bucket → +20', () => {
      const raw = validPersonaBase('D');
      raw.gst_registration_vintage_months = 36;
      const fv = ingest(raw);
      const scores = scoreSegmentD(fv);
      expect(scores.find((s) => s.code === 'business_vintage')?.points).toBe(20);
    });

    it('business_vintage at exactly 60 months resolves to 60 bucket → +40', () => {
      const raw = validPersonaBase('D');
      raw.gst_registration_vintage_months = 60;
      const fv = ingest(raw);
      const scores = scoreSegmentD(fv);
      expect(scores.find((s) => s.code === 'business_vintage')?.points).toBe(40);
    });

    it('business_inflow_volatility at exactly 15% resolves to 15 bucket → +15', () => {
      const raw = validPersonaBase('D');
      raw.business_inflow_profile = { avg_monthly_inflow: 85000, volatility_pct: 15 };
      const fv = ingest(raw);
      const scores = scoreSegmentD(fv);
      expect(scores.find((s) => s.code === 'business_inflow_volatility')?.points).toBe(15);
    });

    it('business_inflow_volatility at exactly 30% resolves to 30 bucket → -20', () => {
      const raw = validPersonaBase('D');
      raw.business_inflow_profile = { avg_monthly_inflow: 85000, volatility_pct: 30 };
      const fv = ingest(raw);
      const scores = scoreSegmentD(fv);
      expect(scores.find((s) => s.code === 'business_inflow_volatility')?.points).toBe(-20);
    });

    it('business_inflow_volatility at exactly 50% resolves to 50 bucket → -40', () => {
      const raw = validPersonaBase('D');
      raw.business_inflow_profile = { avg_monthly_inflow: 85000, volatility_pct: 50 };
      const fv = ingest(raw);
      const scores = scoreSegmentD(fv);
      expect(scores.find((s) => s.code === 'business_inflow_volatility')?.points).toBe(-40);
    });
  });
});
