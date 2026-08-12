// Uses node:test instead of Vitest: Vite/Vitest cannot resolve the node:sqlite builtin
// as of this project's Vite version (pre-bundling strips the 'node:' protocol).
import { strict as assert } from 'assert';
import { test } from 'node:test';
import { openDb } from './db.js';
import { saveDecision, getDecision, listDecisions } from './repository.js';
import { decide } from '@creditiq/engine';
import { PERSONAS } from '@creditiq/engine/src/fixtures/personas.js';

test('repository', async (t) => {
  await t.test('round-trips a decision including reason codes and trace', () => {
    const db = openDb(':memory:');
    const persona = PERSONAS.find((p) => p.id === 'demo-2-msme-poor-gst')!;
    const decision = decide(persona.raw);
    saveDecision(db, decision);
    const fetched = getDecision(db, decision.applicant_id);
    assert.equal(fetched?.outcome, decision.outcome);
    assert.equal(fetched?.offer_amount, decision.offer_amount);
    assert.deepEqual(fetched?.reason_codes, decision.reason_codes);
    assert.deepEqual(fetched?.trace, decision.trace);
  });

  await t.test('lists recent decisions', () => {
    const db = openDb(':memory:');
    const persona = PERSONAS[0];
    saveDecision(db, decide(persona.raw));
    const list = listDecisions(db, 10);
    assert.equal(list.length, 1);
  });

  await t.test('returns null for an unknown applicant', () => {
    const db = openDb(':memory:');
    assert.equal(getDecision(db, 'does-not-exist'), null);
  });
});
