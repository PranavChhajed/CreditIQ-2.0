import type { AdvisoryReasonCode, FeatureVector } from '@creditiq/shared';

/** Matches the existing utilization-trend scoring bucket boundary (scoring/shared.ts UTIL_TREND) where a rise starts costing points — F13 defines "rising" the same way scoring already does. */
const RISING_UTILIZATION_THRESHOLD_PP = 2;

export function detectAdvisories(fv: FeatureVector): AdvisoryReasonCode[] {
  const advisories: AdvisoryReasonCode[] = [];

  const utilizationDeltaPp = fv.credit_utilization_pct_current - fv.credit_utilization_pct_3m_ago;
  if (fv.loan_purpose === 'debt_consolidation' && utilizationDeltaPp >= RISING_UTILIZATION_THRESHOLD_PP) {
    advisories.push('ADV_DEBT_CONSOLIDATION_RISING_UTIL');
  }

  return advisories;
}
