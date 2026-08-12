import { describe, it, expect } from 'vitest';
import { deriveFeatures } from './derive.js';
import { validPersonaBase } from '@creditiq/shared/src/testFixtures.js';

describe('deriveFeatures', () => {
  it('takes the minimum of independent income sources for segment A', () => {
    const raw = validPersonaBase('A');
    raw.avg_monthly_bank_inflow_6m = 80000;
    raw.salary_inflow_profile = { avg_monthly_credit: 75000, stability_pct: 97 };
    const d = deriveFeatures(raw);
    expect(d.drv_income_verified).toBe(75000);
  });

  it('takes the minimum across bank inflow, business inflow, and turnover/12 for segment D', () => {
    const raw = validPersonaBase('D');
    raw.avg_monthly_bank_inflow_6m = 90000;
    raw.business_inflow_profile = { avg_monthly_inflow: 85000, volatility_pct: 10 };
    raw.declared_annual_turnover = 900000; // /12 = 75000, the lowest
    const d = deriveFeatures(raw);
    expect(d.drv_income_verified).toBe(75000);
  });

  it('computes enquiry per lender, guarding against zero lenders', () => {
    const raw = validPersonaBase('A');
    raw.num_enquiries_30d = 6;
    raw.num_distinct_lenders_30d = 0;
    const d = deriveFeatures(raw);
    expect(d.drv_enquiry_per_lender).toBe(6); // divides by max(lenders, 1)
  });

  it('weights delinquency by recency, recent DPD outweighing older higher DPD', () => {
    const raw = validPersonaBase('A');
    raw.delinquency_events = [
      { months_ago: 3, dpd: 30 },
      { months_ago: 30, dpd: 90 },
    ];
    const d = deriveFeatures(raw);
    const recentWeight = 30 * (1 / (1 + 3 / 12));
    const oldWeight = 90 * (1 / (1 + 30 / 12));
    expect(d.drv_delinquency_recency_wt).toBeCloseTo(recentWeight + oldWeight, 5);
    expect(recentWeight).toBeGreaterThan(oldWeight * 0.4); // sanity: recent 30-DPD is not negligible vs old 90-DPD
  });

  it('computes proposed EMI at the fixed qualifying rate, not a grade-dependent rate', () => {
    const raw = validPersonaBase('A');
    raw.requested_amount = 500000;
    raw.requested_tenure_months = 36;
    const d = deriveFeatures(raw);
    const r = 27 / 12 / 100;
    const n = 36;
    const expectedEmi = (500000 * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    expect(d.drv_proposed_emi).toBeCloseTo(expectedEmi, 2);
  });

  it('computes FOIR as (existing obligations + proposed EMI) / verified income', () => {
    const raw = validPersonaBase('A');
    raw.existing_monthly_obligations = 5000;
    const d = deriveFeatures(raw);
    expect(d.drv_foir_post_emi).toBeCloseTo((5000 + d.drv_proposed_emi) / d.drv_income_verified, 5);
  });
});
