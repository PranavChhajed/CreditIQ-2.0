import { describe, it, expect } from 'vitest';
import { detectAdvisories } from './advisories.js';
import { ingest } from './ingest.js';
import { validPersonaBase } from '@creditiq/shared/src/testFixtures.js';

describe('detectAdvisories', () => {
  it('flags debt consolidation with rising utilization (>=2pp)', () => {
    const raw = validPersonaBase('A');
    raw.loan_purpose = 'debt_consolidation';
    raw.credit_utilization_pct_current = 40;
    raw.credit_utilization_pct_3m_ago = 38; // +2pp
    const fv = ingest(raw);
    expect(detectAdvisories(fv)).toContain('ADV_DEBT_CONSOLIDATION_RISING_UTIL');
  });

  it('does not flag debt consolidation when utilization is flat or falling', () => {
    const raw = validPersonaBase('A');
    raw.loan_purpose = 'debt_consolidation';
    raw.credit_utilization_pct_current = 38;
    raw.credit_utilization_pct_3m_ago = 40; // falling
    const fv = ingest(raw);
    expect(detectAdvisories(fv)).toEqual([]);
  });

  it('does not flag rising utilization for a non-debt-consolidation purpose', () => {
    const raw = validPersonaBase('A');
    raw.loan_purpose = 'medical';
    raw.credit_utilization_pct_current = 60;
    raw.credit_utilization_pct_3m_ago = 40; // +20pp, clearly rising
    const fv = ingest(raw);
    expect(detectAdvisories(fv)).toEqual([]);
  });

  it('flags right at the 2pp threshold, not just above it', () => {
    const raw = validPersonaBase('A');
    raw.loan_purpose = 'debt_consolidation';
    raw.credit_utilization_pct_current = 42;
    raw.credit_utilization_pct_3m_ago = 40; // exactly +2pp
    const fv = ingest(raw);
    expect(detectAdvisories(fv)).toContain('ADV_DEBT_CONSOLIDATION_RISING_UTIL');
  });
});
