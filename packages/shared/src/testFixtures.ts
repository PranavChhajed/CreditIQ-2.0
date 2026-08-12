import type { RawApplicant, Segment } from './types.js';

export function validPersonaBase(segment: Segment): RawApplicant {
  const common: Omit<RawApplicant, 'segment' | 'requested_product' | 'epfo_employment_vintage_months' | 'employer_category' | 'salary_inflow_profile' | 'gst_registration_vintage_months' | 'gst_filing_profile' | 'declared_annual_turnover' | 'business_inflow_profile'> = {
    applicant_id: 'test-applicant',
    applicant_age_years: 30,
    bureau_score: 780,
    num_tradelines: 4,
    credit_history_age_months: 60,
    live_overdue_amount: 0,
    max_dpd_12m: 0,
    suit_filed: false,
    settlement_last_24m: false,
    num_enquiries_30d: 1,
    num_distinct_lenders_30d: 1,
    credit_utilization_pct_current: 25,
    credit_utilization_pct_3m_ago: 30,
    delinquency_events: [],
    existing_monthly_obligations: 5000,
    avg_monthly_bank_inflow_6m: 80000,
    bank_inflow_volatility_pct: 5,
    insufficient_funds_bounce_count_6m: 0,
    technical_bounce_count_6m: 0,
    signature_mismatch_bounce_count_6m: 0,
    requested_amount: 500000,
    requested_tenure_months: 36,
    loan_purpose: 'other',
  };
  if (segment === 'A') {
    return {
      ...common,
      segment: 'A',
      requested_product: 'personal_loan',
      epfo_employment_vintage_months: 48,
      employer_category: 'govt_psu_listed',
      salary_inflow_profile: { avg_monthly_credit: 82000, stability_pct: 97 },
      gst_registration_vintage_months: null,
      gst_filing_profile: null,
      declared_annual_turnover: null,
      business_inflow_profile: null,
    };
  }
  return {
    ...common,
    segment: 'D',
    requested_product: 'business_loan',
    epfo_employment_vintage_months: null,
    employer_category: null,
    salary_inflow_profile: null,
    gst_registration_vintage_months: 48,
    gst_filing_profile: { late_filings_12m: 0, total_filings_12m: 12 },
    declared_annual_turnover: 1200000,
    business_inflow_profile: { avg_monthly_inflow: 85000, volatility_pct: 10 },
  };
}
