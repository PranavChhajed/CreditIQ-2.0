import { describe, it, expect } from 'vitest';
import { decide } from './decide.js';
import { validPersonaBase } from '@creditiq/shared/src/testFixtures.js';

describe('decide', () => {
  it('rejects at the gate with no score computed', () => {
    const raw = validPersonaBase('A');
    raw.live_overdue_amount = 5000;
    const decision = decide(raw);
    expect(decision.outcome).toBe('reject');
    expect(decision.score).toBeNull();
    expect(decision.reason_codes).toHaveLength(1);
    expect(decision.reason_codes[0].code).toBe('BUR_LIVE_OVERDUE');
    expect(decision.trace.find((t) => t.stage === 'scoring')).toBeUndefined();
  });

  it('approves a clean applicant with a full trace and stamped versions', () => {
    const raw = validPersonaBase('A');
    const decision = decide(raw);
    expect(decision.outcome).toBe('approve');
    expect(decision.score).toBeGreaterThan(0);
    expect(decision.grade).not.toBeNull();
    expect(decision.offer_amount).toBeGreaterThan(0);
    expect(decision.model_version).toBeTruthy();
    expect(decision.policy_version).toBeTruthy();
    expect(decision.trace.length).toBe(9);
  });

  it('rejects invalid input before any gate runs', () => {
    const decision = decide({ not: 'a valid applicant' });
    expect(decision.outcome).toBe('reject');
    expect(decision.reason_codes[0].code).toBe('VAL_SCHEMA_INVALID');
    expect(decision.trace).toHaveLength(1);
  });
});
