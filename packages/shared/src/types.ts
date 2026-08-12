export type Segment = 'A' | 'D';
export type Product = 'personal_loan' | 'business_loan';

export interface DelinquencyEvent {
  months_ago: number;
  dpd: number;
}

export interface SalaryInflowProfile {
  avg_monthly_credit: number;
  stability_pct: number;
}

export interface GstFilingProfile {
  late_filings_12m: number;
  total_filings_12m: number;
}

export interface BusinessInflowProfile {
  avg_monthly_inflow: number;
  volatility_pct: number;
}

export type EmployerCategory =
  | 'govt_psu_listed'
  | 'mid_size'
  | 'small_unlisted'
  | 'unverifiable';

export type LoanPurpose =
  | 'debt_consolidation'
  | 'medical'
  | 'education'
  | 'home_improvement'
  | 'business_expansion'
  | 'working_capital'
  | 'other';

/** Raw applicant input to ingestion — NOT the FeatureVector. Mock v1 shape. */
export interface RawApplicant {
  applicant_id: string;
  applicant_age_years: number;
  segment: Segment;
  requested_product: Product;
  bureau_score: number | null;
  num_tradelines: number;
  credit_history_age_months: number;
  live_overdue_amount: number;
  max_dpd_12m: number;
  suit_filed: boolean;
  settlement_last_24m: boolean;
  num_enquiries_30d: number;
  num_distinct_lenders_30d: number;
  credit_utilization_pct_current: number;
  credit_utilization_pct_3m_ago: number;
  delinquency_events: DelinquencyEvent[];
  existing_monthly_obligations: number;
  avg_monthly_bank_inflow_6m: number;
  bank_inflow_volatility_pct: number;
  insufficient_funds_bounce_count_6m: number;
  technical_bounce_count_6m: number;
  signature_mismatch_bounce_count_6m: number;
  epfo_employment_vintage_months: number | null;
  employer_category: EmployerCategory | null;
  salary_inflow_profile: SalaryInflowProfile | null;
  gst_registration_vintage_months: number | null;
  gst_filing_profile: GstFilingProfile | null;
  declared_annual_turnover: number | null;
  business_inflow_profile: BusinessInflowProfile | null;
  requested_amount: number;
  requested_tenure_months: number;
  loan_purpose: LoanPurpose;
}

/** The frozen 38-field contract (spec §2). Raw fields + 6 derived fields. */
export interface FeatureVector extends RawApplicant {
  drv_income_verified: number;
  drv_foir_post_emi: number;
  drv_ticket_to_income: number;
  drv_enquiry_per_lender: number;
  drv_delinquency_recency_wt: number;
  drv_proposed_emi: number;
}

export type GateCode =
  | 'VAL_SCHEMA_INVALID'
  | 'VAL_SEGMENT_PRODUCT_MISMATCH'
  | 'BUR_LIVE_OVERDUE'
  | 'BUR_RECENT_SEVERE_DELINQ'
  | 'BUR_SUIT_FILED'
  | 'BUR_SETTLEMENT'
  | 'BUR_ENQUIRY_VELOCITY'
  | 'BUR_THIN_FILE'
  | 'CAP_FOIR_EXCEEDED'
  | 'AGE_TENURE_MISMATCH'
  | 'EMP_INSUFFICIENT_VINTAGE'
  | 'BIZ_INSUFFICIENT_VINTAGE';

export type ScoreReasonCode =
  | 'bureau_score' | 'utilization_level' | 'utilization_trend' | 'foir'
  | 'insufficient_funds_bounces' | 'delinquency_recency' | 'credit_history_age'
  | 'enquiry_per_lender' | 'epfo_vintage' | 'employer_category' | 'salary_stability'
  | 'gst_filing_punctuality' | 'business_vintage' | 'business_inflow_volatility';

export type PolicyReasonCode = 'POL_AMOUNT_REDUCED' | 'POL_BELOW_MIN_TICKET';

export type ReasonCode = GateCode | ScoreReasonCode | PolicyReasonCode;

export type Grade =
  | 'A1' | 'A2' | 'A3' | 'B1' | 'B2' | 'B3' | 'C1' | 'C2' | 'C3'
  | 'D1' | 'D2' | 'D3';

export interface RankedReasonCode {
  rank: number;
  code: ReasonCode;
  sentence: string;
  points?: number;
}

export interface TraceStep {
  step: number;
  stage: string;
  outcome: 'pass' | 'fail' | 'computed';
  detail: Record<string, unknown>;
}

export interface Decision {
  applicant_id: string;
  outcome: 'approve' | 'reject';
  grade: Grade | null;
  score: number | null;
  offer_amount: number | null;
  offer_tenure_months: number | null;
  offer_rate_pct: number | null;
  offer_emi: number | null;
  reason_codes: RankedReasonCode[];
  trace: TraceStep[];
  model_version: string;
  policy_version: string;
}
