import { z } from 'zod';

const delinquencyEventSchema = z.object({
  months_ago: z.number().nonnegative(),
  dpd: z.number().nonnegative(),
});

const salaryInflowProfileSchema = z.object({
  avg_monthly_credit: z.number().nonnegative(),
  stability_pct: z.number().min(0).max(100),
});

const gstFilingProfileSchema = z.object({
  late_filings_12m: z.number().min(0).max(12),
  total_filings_12m: z.number().min(0).max(12),
});

const businessInflowProfileSchema = z.object({
  avg_monthly_inflow: z.number().nonnegative(),
  volatility_pct: z.number().nonnegative(),
});

export const rawApplicantSchema = z.object({
  applicant_id: z.string().min(1),
  applicant_age_years: z.number().min(18).max(100),
  segment: z.enum(['A', 'D']),
  requested_product: z.enum(['personal_loan', 'business_loan']),
  bureau_score: z.number().min(300).max(900).nullable(),
  num_tradelines: z.number().int().nonnegative(),
  credit_history_age_months: z.number().nonnegative(),
  live_overdue_amount: z.number().nonnegative(),
  max_dpd_12m: z.number().nonnegative(),
  suit_filed: z.boolean(),
  settlement_last_24m: z.boolean(),
  num_enquiries_30d: z.number().int().nonnegative(),
  num_distinct_lenders_30d: z.number().int().nonnegative(),
  credit_utilization_pct_current: z.number().min(0).max(100),
  credit_utilization_pct_3m_ago: z.number().min(0).max(100),
  delinquency_events: z.array(delinquencyEventSchema),
  existing_monthly_obligations: z.number().nonnegative(),
  avg_monthly_bank_inflow_6m: z.number().nonnegative(),
  bank_inflow_volatility_pct: z.number().nonnegative(),
  insufficient_funds_bounce_count_6m: z.number().int().nonnegative(),
  technical_bounce_count_6m: z.number().int().nonnegative(),
  signature_mismatch_bounce_count_6m: z.number().int().nonnegative(),
  epfo_employment_vintage_months: z.number().nonnegative().nullable(),
  employer_category: z.enum(['govt_psu_listed', 'mid_size', 'small_unlisted', 'unverifiable']).nullable(),
  salary_inflow_profile: salaryInflowProfileSchema.nullable(),
  gst_registration_vintage_months: z.number().nonnegative().nullable(),
  gst_filing_profile: gstFilingProfileSchema.nullable(),
  declared_annual_turnover: z.number().nonnegative().nullable(),
  business_inflow_profile: businessInflowProfileSchema.nullable(),
  requested_amount: z.number().positive(),
  requested_tenure_months: z.number().int().positive(),
  loan_purpose: z.enum([
    'debt_consolidation', 'medical', 'education', 'home_improvement',
    'business_expansion', 'working_capital', 'other',
  ]),
}).superRefine((data, ctx) => {
  const expectedProduct = data.segment === 'A' ? 'personal_loan' : 'business_loan';
  if (data.requested_product !== expectedProduct) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'VAL_SEGMENT_PRODUCT_MISMATCH',
      path: ['requested_product'],
    });
  }
});

export type RawApplicantInput = z.infer<typeof rawApplicantSchema>;
