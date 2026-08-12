import { describe, it, expect } from 'vitest';
import { rawApplicantSchema } from './featureVectorSchema.js';
import { validPersonaBase } from './testFixtures.js';

describe('rawApplicantSchema', () => {
  it('accepts a valid segment-A applicant', () => {
    const result = rawApplicantSchema.safeParse(validPersonaBase('A'));
    expect(result.success).toBe(true);
  });

  it('rejects a mismatched segment/product pair', () => {
    const bad = { ...validPersonaBase('A'), requested_product: 'business_loan' };
    const result = rawApplicantSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it('rejects an out-of-range bureau score', () => {
    const bad = { ...validPersonaBase('A'), bureau_score: 950 };
    const result = rawApplicantSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });
});
