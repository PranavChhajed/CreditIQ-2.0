import { describe, it, expect } from 'vitest';
import { evaluateGates, firstFailure } from './gates.js';
import { ingest } from './ingest.js';
import { validPersonaBase } from '@creditiq/shared/src/testFixtures.js';

const PL_FOIR_CAP = 0.55;

describe('evaluateGates', () => {
  it('passes a clean applicant on every gate', () => {
    const fv = ingest(validPersonaBase('A'));
    const results = evaluateGates(fv, PL_FOIR_CAP);
    expect(results.every((r) => r.passed)).toBe(true);
    expect(firstFailure(results)).toBeNull();
  });

  it('fails BUR_LIVE_OVERDUE when overdue exceeds 500', () => {
    const raw = validPersonaBase('A');
    raw.live_overdue_amount = 501;
    const fv = ingest(raw);
    expect(firstFailure(evaluateGates(fv, PL_FOIR_CAP))).toBe('BUR_LIVE_OVERDUE');
  });

  it('passes at exactly 500 overdue (threshold is exclusive)', () => {
    const raw = validPersonaBase('A');
    raw.live_overdue_amount = 500;
    const fv = ingest(raw);
    expect(firstFailure(evaluateGates(fv, PL_FOIR_CAP))).toBeNull();
  });

  it('fails BUR_RECENT_SEVERE_DELINQ at 90+ DPD in 12m', () => {
    const raw = validPersonaBase('A');
    raw.max_dpd_12m = 90;
    const fv = ingest(raw);
    expect(firstFailure(evaluateGates(fv, PL_FOIR_CAP))).toBe('BUR_RECENT_SEVERE_DELINQ');
  });

  it('fails BUR_SUIT_FILED', () => {
    const raw = validPersonaBase('A');
    raw.suit_filed = true;
    const fv = ingest(raw);
    expect(firstFailure(evaluateGates(fv, PL_FOIR_CAP))).toBe('BUR_SUIT_FILED');
  });

  it('fails BUR_SETTLEMENT', () => {
    const raw = validPersonaBase('A');
    raw.settlement_last_24m = true;
    const fv = ingest(raw);
    expect(firstFailure(evaluateGates(fv, PL_FOIR_CAP))).toBe('BUR_SETTLEMENT');
  });

  it('fails BUR_ENQUIRY_VELOCITY above 6 distinct lenders in 30d', () => {
    const raw = validPersonaBase('A');
    raw.num_distinct_lenders_30d = 7;
    raw.num_enquiries_30d = 7;
    const fv = ingest(raw);
    expect(firstFailure(evaluateGates(fv, PL_FOIR_CAP))).toBe('BUR_ENQUIRY_VELOCITY');
  });

  it('fails BUR_THIN_FILE below 2 tradelines', () => {
    const raw = validPersonaBase('A');
    raw.num_tradelines = 1;
    const fv = ingest(raw);
    expect(firstFailure(evaluateGates(fv, PL_FOIR_CAP))).toBe('BUR_THIN_FILE');
  });

  it('fails BUR_THIN_FILE on no bureau hit', () => {
    const raw = validPersonaBase('A');
    raw.bureau_score = null;
    const fv = ingest(raw);
    expect(firstFailure(evaluateGates(fv, PL_FOIR_CAP))).toBe('BUR_THIN_FILE');
  });

  it('fails CAP_FOIR_EXCEEDED above the product cap', () => {
    const raw = validPersonaBase('A');
    raw.existing_monthly_obligations = 100000; // pushes FOIR well past 0.55
    const fv = ingest(raw);
    expect(firstFailure(evaluateGates(fv, PL_FOIR_CAP))).toBe('CAP_FOIR_EXCEEDED');
  });

  it('fails AGE_TENURE_MISMATCH when age + tenure/12 exceeds 60', () => {
    const raw = validPersonaBase('A');
    raw.applicant_age_years = 58;
    raw.requested_tenure_months = 36;
    const fv = ingest(raw);
    expect(firstFailure(evaluateGates(fv, PL_FOIR_CAP))).toBe('AGE_TENURE_MISMATCH');
  });

  it('fails EMP_INSUFFICIENT_VINTAGE for segment A under 12 months', () => {
    const raw = validPersonaBase('A');
    raw.epfo_employment_vintage_months = 6;
    const fv = ingest(raw);
    expect(firstFailure(evaluateGates(fv, PL_FOIR_CAP))).toBe('EMP_INSUFFICIENT_VINTAGE');
  });

  it('fails BIZ_INSUFFICIENT_VINTAGE for segment D under 24 months', () => {
    const raw = validPersonaBase('D');
    raw.gst_registration_vintage_months = 12;
    const fv = ingest(raw);
    const BL_FOIR_CAP = 0.50;
    expect(firstFailure(evaluateGates(fv, BL_FOIR_CAP))).toBe('BIZ_INSUFFICIENT_VINTAGE');
  });

  it('evaluates gates in the fixed spec order regardless of which fail', () => {
    const raw = validPersonaBase('A');
    raw.live_overdue_amount = 501;
    raw.suit_filed = true; // both would fail; overdue must win as it's earlier in order
    const fv = ingest(raw);
    expect(firstFailure(evaluateGates(fv, PL_FOIR_CAP))).toBe('BUR_LIVE_OVERDUE');
  });
});
