import { describe, it, expect } from 'vitest';
import { validateInput } from './validate.js';
import { validPersonaBase } from '@creditiq/shared/src/testFixtures.js';

describe('validateInput', () => {
  it('accepts a valid raw applicant', () => {
    const result = validateInput(validPersonaBase('A'));
    expect(result.valid).toBe(true);
  });

  it('flags a segment/product mismatch distinctly from generic schema errors', () => {
    const bad = { ...validPersonaBase('A'), requested_product: 'business_loan' };
    const result = validateInput(bad);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.code).toBe('VAL_SEGMENT_PRODUCT_MISMATCH');
  });

  it('flags a generic schema violation', () => {
    const bad = { ...validPersonaBase('A'), bureau_score: 'not-a-number' };
    const result = validateInput(bad);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.code).toBe('VAL_SCHEMA_INVALID');
  });
});
