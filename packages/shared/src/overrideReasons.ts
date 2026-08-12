import type { OverrideReasonCode } from './types.js';

/** Underwriter-facing labels for override reasons — an internal audit taxonomy, distinct from REASON_CODE_SENTENCES (which are customer-safe explanations of the automated decision itself). */
export const OVERRIDE_REASON_LABELS: Record<OverrideReasonCode, string> = {
  OVR_ADDITIONAL_DOCS_VERIFIED: 'Additional documentation verified outside the automated data sources',
  OVR_RISK_APPETITE_EXCEPTION: 'Underwriter judgment within acceptable risk appetite',
  OVR_POLICY_EXCEPTION: 'Approved exception to standard policy',
  OVR_DATA_QUALITY_ISSUE: 'Automated decision relied on data later found to be incorrect or incomplete',
  OVR_OTHER: 'Other (see notes)',
};

export const OVERRIDE_REASON_CODES = Object.keys(OVERRIDE_REASON_LABELS) as OverrideReasonCode[];
