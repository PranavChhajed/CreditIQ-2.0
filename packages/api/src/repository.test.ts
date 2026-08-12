import { describe, it, expect, beforeEach } from 'vitest';
import { openDb } from './db.js';
import { saveDecision, getDecision, listDecisions } from './repository.js';
import { decide } from '@creditiq/engine';
import { PERSONAS } from '@creditiq/engine/src/fixtures/personas.js';

describe('repository', () => {
  let db: ReturnType<typeof openDb>;

  beforeEach(() => {
    db = openDb(':memory:');
  });

  it('round-trips a decision including reason codes and trace', () => {
    const persona = PERSONAS.find((p) => p.id === 'demo-2-msme-poor-gst')!;
    const decision = decide(persona.raw);
    saveDecision(db, decision);
    const fetched = getDecision(db, decision.applicant_id);
    expect(fetched?.outcome).toBe(decision.outcome);
    expect(fetched?.offer_amount).toBe(decision.offer_amount);
    expect(fetched?.reason_codes).toEqual(decision.reason_codes);
    expect(fetched?.trace).toEqual(decision.trace);
  });

  it('lists recent decisions', () => {
    const persona = PERSONAS[0];
    saveDecision(db, decide(persona.raw));
    const list = listDecisions(db, 10);
    expect(list.length).toBe(1);
  });

  it('returns null for an unknown applicant', () => {
    expect(getDecision(db, 'does-not-exist')).toBeNull();
  });
});
