import type { RawApplicant, FeatureVector } from '@creditiq/shared';
import { QUALIFYING_RATE_PCT } from './version.js';

type Derived = Pick<
  FeatureVector,
  'drv_income_verified' | 'drv_foir_post_emi' | 'drv_ticket_to_income' |
  'drv_enquiry_per_lender' | 'drv_delinquency_recency_wt' | 'drv_proposed_emi'
>;

export function standardEmi(principal: number, annualRatePct: number, tenureMonths: number): number {
  const r = annualRatePct / 12 / 100;
  if (r === 0) return principal / tenureMonths;
  const factor = Math.pow(1 + r, tenureMonths);
  return (principal * r * factor) / (factor - 1);
}

function recencyDecay(monthsAgo: number): number {
  return 1 / (1 + monthsAgo / 12);
}

export function deriveFeatures(raw: RawApplicant): Derived {
  const incomeSources: number[] = [raw.avg_monthly_bank_inflow_6m];
  if (raw.segment === 'A' && raw.salary_inflow_profile) {
    incomeSources.push(raw.salary_inflow_profile.avg_monthly_credit);
  }
  if (raw.segment === 'D') {
    if (raw.business_inflow_profile) incomeSources.push(raw.business_inflow_profile.avg_monthly_inflow);
    if (raw.declared_annual_turnover != null) incomeSources.push(raw.declared_annual_turnover / 12);
  }
  const drv_income_verified = Math.min(...incomeSources);

  const drv_proposed_emi = standardEmi(raw.requested_amount, QUALIFYING_RATE_PCT, raw.requested_tenure_months);
  const drv_foir_post_emi = drv_income_verified > 0
    ? (raw.existing_monthly_obligations + drv_proposed_emi) / drv_income_verified
    : Number.POSITIVE_INFINITY;

  const drv_ticket_to_income = drv_income_verified > 0
    ? raw.requested_amount / (drv_income_verified * 12)
    : Number.POSITIVE_INFINITY;

  const drv_enquiry_per_lender = raw.num_enquiries_30d / Math.max(raw.num_distinct_lenders_30d, 1);

  const drv_delinquency_recency_wt = raw.delinquency_events.reduce(
    (sum, e) => sum + e.dpd * recencyDecay(e.months_ago),
    0,
  );

  return {
    drv_income_verified,
    drv_foir_post_emi,
    drv_ticket_to_income,
    drv_enquiry_per_lender,
    drv_delinquency_recency_wt,
    drv_proposed_emi,
  };
}
