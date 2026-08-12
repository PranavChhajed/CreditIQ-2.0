import type { Grade, RawApplicant, Segment } from '@creditiq/shared';

function baseA(overrides: Partial<RawApplicant> = {}): RawApplicant {
  return {
    applicant_id: 'placeholder', applicant_age_years: 32, segment: 'A', requested_product: 'personal_loan',
    bureau_score: 780, num_tradelines: 5, credit_history_age_months: 72,
    live_overdue_amount: 0, max_dpd_12m: 0, suit_filed: false, settlement_last_24m: false,
    num_enquiries_30d: 1, num_distinct_lenders_30d: 1,
    credit_utilization_pct_current: 25, credit_utilization_pct_3m_ago: 28,
    delinquency_events: [], existing_monthly_obligations: 4000,
    avg_monthly_bank_inflow_6m: 90000, bank_inflow_volatility_pct: 4,
    insufficient_funds_bounce_count_6m: 0, technical_bounce_count_6m: 0, signature_mismatch_bounce_count_6m: 0,
    epfo_employment_vintage_months: 60, employer_category: 'govt_psu_listed',
    salary_inflow_profile: { avg_monthly_credit: 92000, stability_pct: 98 },
    gst_registration_vintage_months: null, gst_filing_profile: null,
    declared_annual_turnover: null, business_inflow_profile: null,
    requested_amount: 600000, requested_tenure_months: 36, loan_purpose: 'other',
    ...overrides,
  };
}

function baseD(overrides: Partial<RawApplicant> = {}): RawApplicant {
  return {
    applicant_id: 'placeholder', applicant_age_years: 38, segment: 'D', requested_product: 'business_loan',
    bureau_score: 718, num_tradelines: 4, credit_history_age_months: 60,
    live_overdue_amount: 0, max_dpd_12m: 0, suit_filed: false, settlement_last_24m: false,
    num_enquiries_30d: 1, num_distinct_lenders_30d: 1,
    credit_utilization_pct_current: 35, credit_utilization_pct_3m_ago: 38,
    delinquency_events: [], existing_monthly_obligations: 8000,
    avg_monthly_bank_inflow_6m: 110000, bank_inflow_volatility_pct: 12,
    insufficient_funds_bounce_count_6m: 0, technical_bounce_count_6m: 0, signature_mismatch_bounce_count_6m: 0,
    epfo_employment_vintage_months: null, employer_category: null, salary_inflow_profile: null,
    gst_registration_vintage_months: 48,
    gst_filing_profile: { late_filings_12m: 0, total_filings_12m: 12 },
    declared_annual_turnover: 1500000,
    business_inflow_profile: { avg_monthly_inflow: 105000, volatility_pct: 12 },
    requested_amount: 1200000, requested_tenure_months: 36, loan_purpose: 'working_capital',
    ...overrides,
  };
}

export interface Persona {
  id: string;
  label: string;
  segment: Segment;
  expectedOutcome: 'approve' | 'reject';
  /** The grade decide() actually returns for this persona (null for gate/score rejects). */
  expectedGrade: Grade | null;
  /**
   * Set only for gate-rejection personas: the specific gate code that must fire first,
   * so an accidental reorder of gates.ts can't silently swap which gate a persona
   * demonstrates without breaking the test suite.
   */
  expectedReasonCode?: string;
  raw: RawApplicant;
}

export const PERSONAS: Persona[] = [
  {
    id: 'demo-1-salaried-clean', label: 'Demo Case 1: Salaried, clean → full approval', segment: 'A',
    expectedOutcome: 'approve', expectedGrade: 'A1', raw: baseA({ applicant_id: 'demo-1-salaried-clean' }),
  },
  {
    id: 'a-clean-mid-grade', label: 'Salaried, mid-grade, partial reduction', segment: 'A', expectedOutcome: 'approve',
    expectedGrade: 'B2',
    raw: baseA({
      applicant_id: 'a-clean-mid-grade', bureau_score: 660, epfo_employment_vintage_months: 30,
      salary_inflow_profile: { avg_monthly_credit: 60000, stability_pct: 80 },
      requested_amount: 650000, avg_monthly_bank_inflow_6m: 58000,
    }),
  },
  {
    id: 'demo-2-msme-poor-gst', label: 'Demo Case 2: MSME, clean bureau, poor GST filing → reduced limit',
    segment: 'D', expectedOutcome: 'approve', expectedGrade: 'B2',
    raw: baseD({
      applicant_id: 'demo-2-msme-poor-gst',
      gst_filing_profile: { late_filings_12m: 7, total_filings_12m: 12 },
      requested_amount: 1000000,
    }),
  },
  {
    id: 'd-clean-high-grade', label: 'MSME, clean, high grade', segment: 'D', expectedOutcome: 'approve',
    expectedGrade: 'A1',
    raw: baseD({
      applicant_id: 'd-clean-high-grade', bureau_score: 800, gst_registration_vintage_months: 84,
      requested_amount: 900000,
    }),
  },
  {
    id: 'demo-3-live-overdue', label: 'Demo Case 3: Live overdue → gate reject', segment: 'A',
    expectedOutcome: 'reject', expectedGrade: null, expectedReasonCode: 'BUR_LIVE_OVERDUE',
    raw: baseA({ applicant_id: 'demo-3-live-overdue', live_overdue_amount: 5000 }),
  },
  {
    id: 'gate-severe-delinquency', label: 'Severe recent delinquency → gate reject', segment: 'A',
    expectedOutcome: 'reject', expectedGrade: null, expectedReasonCode: 'BUR_RECENT_SEVERE_DELINQ',
    raw: baseA({ applicant_id: 'gate-severe-delinquency', max_dpd_12m: 95 }),
  },
  {
    id: 'gate-suit-filed', label: 'Suit filed → gate reject', segment: 'A',
    expectedOutcome: 'reject', expectedGrade: null, expectedReasonCode: 'BUR_SUIT_FILED',
    raw: baseA({ applicant_id: 'gate-suit-filed', suit_filed: true }),
  },
  {
    id: 'gate-settlement', label: 'Settlement in 24m → gate reject', segment: 'D',
    expectedOutcome: 'reject', expectedGrade: null, expectedReasonCode: 'BUR_SETTLEMENT',
    raw: baseD({ applicant_id: 'gate-settlement', settlement_last_24m: true }),
  },
  {
    id: 'gate-enquiry-velocity', label: 'Enquiry velocity (7 lenders/30d) → gate reject', segment: 'A',
    expectedOutcome: 'reject', expectedGrade: null, expectedReasonCode: 'BUR_ENQUIRY_VELOCITY',
    raw: baseA({ applicant_id: 'gate-enquiry-velocity', num_distinct_lenders_30d: 7, num_enquiries_30d: 9 }),
  },
  {
    id: 'gate-thin-file', label: 'Thin file / no bureau hit → gate reject', segment: 'A',
    expectedOutcome: 'reject', expectedGrade: null, expectedReasonCode: 'BUR_THIN_FILE',
    raw: baseA({ applicant_id: 'gate-thin-file', bureau_score: null, num_tradelines: 0 }),
  },
  {
    id: 'gate-foir-exceeded', label: 'FOIR exceeds product cap → gate reject', segment: 'D',
    expectedOutcome: 'reject', expectedGrade: null, expectedReasonCode: 'CAP_FOIR_EXCEEDED',
    raw: baseD({ applicant_id: 'gate-foir-exceeded', existing_monthly_obligations: 90000 }),
  },
  {
    id: 'gate-age-tenure', label: 'Age + tenure > 60 → gate reject', segment: 'A',
    expectedOutcome: 'reject', expectedGrade: null, expectedReasonCode: 'AGE_TENURE_MISMATCH',
    raw: baseA({ applicant_id: 'gate-age-tenure', applicant_age_years: 55, requested_tenure_months: 72 }),
  },
  {
    id: 'gate-emp-vintage', label: 'Segment A, <12mo EPFO vintage → gate reject', segment: 'A',
    expectedOutcome: 'reject', expectedGrade: null, expectedReasonCode: 'EMP_INSUFFICIENT_VINTAGE',
    raw: baseA({ applicant_id: 'gate-emp-vintage', epfo_employment_vintage_months: 5 }),
  },
  {
    id: 'gate-biz-vintage', label: 'Segment D, <24mo GST vintage → gate reject', segment: 'D',
    expectedOutcome: 'reject', expectedGrade: null, expectedReasonCode: 'BIZ_INSUFFICIENT_VINTAGE',
    raw: baseD({
      applicant_id: 'gate-biz-vintage', gst_registration_vintage_months: 10, requested_amount: 900000,
    }),
  },
  {
    id: 'd-borderline-min-ticket', label: 'MSME, borderline score, min ticket', segment: 'D',
    expectedOutcome: 'approve', expectedGrade: 'B3',
    raw: baseD({
      applicant_id: 'd-borderline-min-ticket', bureau_score: 620,
      gst_filing_profile: { late_filings_12m: 4, total_filings_12m: 12 },
      gst_registration_vintage_months: 26, requested_amount: 150000,
      avg_monthly_bank_inflow_6m: 40000, business_inflow_profile: { avg_monthly_inflow: 38000, volatility_pct: 35 },
      declared_annual_turnover: 480000,
    }),
  },
  {
    id: 'a-score-below-500', label: 'Salaried, passes gates but scores below 500 → score reject', segment: 'A',
    expectedOutcome: 'reject', expectedGrade: null,
    raw: baseA({
      applicant_id: 'a-score-below-500', bureau_score: 610, credit_utilization_pct_current: 80,
      credit_utilization_pct_3m_ago: 60, existing_monthly_obligations: 8000,
      delinquency_events: [{ months_ago: 2, dpd: 45 }, { months_ago: 5, dpd: 60 }], max_dpd_12m: 60,
      credit_history_age_months: 14, epfo_employment_vintage_months: 13,
      employer_category: 'unverifiable', salary_inflow_profile: { avg_monthly_credit: 35000, stability_pct: 60 },
      avg_monthly_bank_inflow_6m: 35000, num_enquiries_30d: 5, num_distinct_lenders_30d: 3,
      insufficient_funds_bounce_count_6m: 2, requested_amount: 150000,
    }),
  },
  {
    id: 'a-debt-consolidation-rising-util', label: 'Salaried, debt consolidation with rising utilization (F13 advisory)',
    segment: 'A', expectedOutcome: 'approve', expectedGrade: 'A2',
    raw: baseA({
      applicant_id: 'a-debt-consolidation-rising-util', loan_purpose: 'debt_consolidation',
      credit_utilization_pct_current: 45, credit_utilization_pct_3m_ago: 40,
    }),
  },
];
