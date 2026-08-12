import { describe, it, expect } from 'vitest';
import { decide } from '../decide.js';
import { PERSONAS } from './personas.js';

describe('synthetic personas (PRD §12 acceptance test)', () => {
  it('has exactly 16 personas covering both segments', () => {
    expect(PERSONAS).toHaveLength(16);
    expect(PERSONAS.some((p) => p.segment === 'A')).toBe(true);
    expect(PERSONAS.some((p) => p.segment === 'D')).toBe(true);
  });

  for (const persona of PERSONAS) {
    it(`${persona.id}: outcome is ${persona.expectedOutcome}`, () => {
      const decision = decide(persona.raw);
      expect(decision.outcome).toBe(persona.expectedOutcome);
    });
  }

  it('Demo Case 1 approves at full requested amount', () => {
    const persona = PERSONAS.find((p) => p.id === 'demo-1-salaried-clean')!;
    const decision = decide(persona.raw);
    expect(decision.offer_amount).toBe(persona.raw.requested_amount);
  });

  it('Demo Case 2 approves at a REDUCED amount, not the full request', () => {
    const persona = PERSONAS.find((p) => p.id === 'demo-2-msme-poor-gst')!;
    const decision = decide(persona.raw);
    expect(decision.outcome).toBe('approve');
    expect(decision.offer_amount).toBeLessThan(persona.raw.requested_amount!);
    expect(decision.reason_codes.some((r) => r.code === 'gst_filing_punctuality')).toBe(true);
  });

  it('Demo Case 3 rejects at the gate with no score computed', () => {
    const persona = PERSONAS.find((p) => p.id === 'demo-3-live-overdue')!;
    const decision = decide(persona.raw);
    expect(decision.score).toBeNull();
    expect(decision.reason_codes[0].code).toBe('BUR_LIVE_OVERDUE');
  });
});
