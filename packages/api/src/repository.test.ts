// Uses node:test instead of Vitest: Vite/Vitest cannot resolve the node:sqlite builtin
// as of this project's Vite version (pre-bundling strips the 'node:' protocol).
import { strict as assert } from 'assert';
import { test } from 'node:test';
import { openDb } from './db.js';
import { saveDecision, getDecision, listDecisions, getMonitoringSummary, saveOverride, getOverride } from './repository.js';
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

  await t.test('getMonitoringSummary aggregates outcomes, grades, score buckets, and gate hits', () => {
    const db = openDb(':memory:');
    const clean = PERSONAS.find((p) => p.id === 'demo-1-salaried-clean')!;
    const overdue = PERSONAS.find((p) => p.id === 'demo-3-live-overdue')!;
    saveDecision(db, decide(clean.raw));
    saveDecision(db, decide({ ...overdue.raw, applicant_id: 'overdue-2' }));
    saveDecision(db, decide(overdue.raw));

    const summary = getMonitoringSummary(db);
    assert.equal(summary.total_decisions, 3);
    assert.equal(summary.outcome_counts.approve, 1);
    assert.equal(summary.outcome_counts.reject, 2);
    assert.equal(summary.grade_distribution.A1, 1);
    assert.equal(summary.score_distribution.reduce((sum, b) => sum + b.count, 0), 1);
    assert.deepEqual(summary.gate_hit_counts, [{ code: 'BUR_LIVE_OVERDUE', count: 2 }]);
  });

  await t.test('saveOverride/getOverride round-trips an outcome override, decision row untouched', () => {
    const db = openDb(':memory:');
    const persona = PERSONAS.find((p) => p.id === 'demo-3-live-overdue')!;
    const decision = decide(persona.raw);
    saveDecision(db, decision);

    saveOverride(db, {
      applicant_id: decision.applicant_id,
      original_outcome: decision.outcome,
      override_outcome: 'approve',
      reason_code: 'OVR_ADDITIONAL_DOCS_VERIFIED',
      reason_text: 'Overdue was a bureau reporting lag; bank statement confirms it was cleared.',
      overridden_by: 'jdoe',
      created_at: '',
    });

    const override = getOverride(db, decision.applicant_id);
    assert.equal(override?.original_outcome, 'reject');
    assert.equal(override?.override_outcome, 'approve');
    assert.equal(override?.reason_code, 'OVR_ADDITIONAL_DOCS_VERIFIED');
    assert.equal(override?.overridden_by, 'jdoe');
    assert.ok(override?.created_at);

    const untouchedDecision = getDecision(db, decision.applicant_id);
    assert.equal(untouchedDecision?.outcome, 'reject');
  });

  await t.test('getOverride returns null when no override exists', () => {
    const db = openDb(':memory:');
    assert.equal(getOverride(db, 'no-such-applicant'), null);
  });
});
