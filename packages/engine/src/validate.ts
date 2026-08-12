import { rawApplicantSchema } from '@creditiq/shared';
import type { RawApplicant } from '@creditiq/shared';

export type ValidationResult =
  | { valid: true; data: RawApplicant }
  | { valid: false; code: 'VAL_SCHEMA_INVALID' | 'VAL_SEGMENT_PRODUCT_MISMATCH' };

export function validateInput(raw: unknown): ValidationResult {
  const result = rawApplicantSchema.safeParse(raw);
  if (result.success) return { valid: true, data: result.data as RawApplicant };
  const mismatch = result.error.issues.some((i) => i.message === 'VAL_SEGMENT_PRODUCT_MISMATCH');
  return { valid: false, code: mismatch ? 'VAL_SEGMENT_PRODUCT_MISMATCH' : 'VAL_SCHEMA_INVALID' };
}
