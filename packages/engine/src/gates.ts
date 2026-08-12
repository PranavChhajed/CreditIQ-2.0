import type { FeatureVector, GateCode } from '@creditiq/shared';

export interface GateResult {
  code: GateCode;
  passed: boolean;
  detail: Record<string, unknown>;
}

/** Order is fixed — spec §4. Every gate is evaluated (not short-circuited here) so the trace is complete; decide.ts picks the first failure. */
export function evaluateGates(fv: FeatureVector, foirCap: number): GateResult[] {
  const results: GateResult[] = [];

  results.push({
    code: 'BUR_LIVE_OVERDUE',
    passed: fv.live_overdue_amount <= 500,
    detail: { live_overdue_amount: fv.live_overdue_amount },
  });
  results.push({
    code: 'BUR_RECENT_SEVERE_DELINQ',
    passed: fv.max_dpd_12m < 90,
    detail: { max_dpd_12m: fv.max_dpd_12m },
  });
  results.push({
    code: 'BUR_SUIT_FILED',
    passed: !fv.suit_filed,
    detail: { suit_filed: fv.suit_filed },
  });
  results.push({
    code: 'BUR_SETTLEMENT',
    passed: !fv.settlement_last_24m,
    detail: { settlement_last_24m: fv.settlement_last_24m },
  });
  results.push({
    code: 'BUR_ENQUIRY_VELOCITY',
    passed: fv.num_distinct_lenders_30d <= 6,
    detail: { num_distinct_lenders_30d: fv.num_distinct_lenders_30d },
  });
  results.push({
    code: 'BUR_THIN_FILE',
    passed: fv.num_tradelines >= 2 && fv.bureau_score !== null,
    detail: { num_tradelines: fv.num_tradelines, bureau_score: fv.bureau_score },
  });
  results.push({
    code: 'CAP_FOIR_EXCEEDED',
    passed: fv.drv_foir_post_emi <= foirCap,
    detail: { drv_foir_post_emi: fv.drv_foir_post_emi, foirCap },
  });
  results.push({
    code: 'AGE_TENURE_MISMATCH',
    passed: fv.applicant_age_years + fv.requested_tenure_months / 12 <= 60,
    detail: { applicant_age_years: fv.applicant_age_years, requested_tenure_months: fv.requested_tenure_months },
  });

  if (fv.segment === 'A') {
    results.push({
      code: 'EMP_INSUFFICIENT_VINTAGE',
      passed: (fv.epfo_employment_vintage_months ?? 0) >= 12,
      detail: { epfo_employment_vintage_months: fv.epfo_employment_vintage_months },
    });
  } else {
    results.push({
      code: 'BIZ_INSUFFICIENT_VINTAGE',
      passed: (fv.gst_registration_vintage_months ?? 0) >= 24,
      detail: { gst_registration_vintage_months: fv.gst_registration_vintage_months },
    });
  }

  return results;
}

export function firstFailure(results: GateResult[]): GateCode | null {
  const failed = results.find((r) => !r.passed);
  return failed ? failed.code : null;
}
