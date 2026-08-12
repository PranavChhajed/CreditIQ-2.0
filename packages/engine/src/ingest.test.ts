import { describe, it, expect } from 'vitest';
import { ingest } from './ingest.js';
import { validPersonaBase } from '@creditiq/shared/src/testFixtures.js';

describe('ingest', () => {
  it('produces a FeatureVector carrying all raw fields plus 6 derived fields', () => {
    const raw = validPersonaBase('D');
    const fv = ingest(raw);
    expect(fv.applicant_id).toBe(raw.applicant_id);
    expect(fv.drv_income_verified).toBeGreaterThan(0);
    expect(fv.drv_proposed_emi).toBeGreaterThan(0);
  });
});
