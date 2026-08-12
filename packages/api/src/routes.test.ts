// Uses node:test instead of Vitest: Vite/Vitest cannot resolve the node:sqlite builtin
// as of this project's Vite version (pre-bundling strips the 'node:' protocol).
import { strict as assert } from 'assert';
import { describe, it, beforeEach } from 'node:test';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from './routes.js';
import { openDb } from './db.js';
import { PERSONAS } from '@creditiq/engine/src/fixtures/personas.js';

describe('routes', () => {
  let app: Express;

  beforeEach(() => {
    app = createApp(openDb(':memory:'));
  });

  it('GET /api/personas lists all 17 fixtures', async () => {
    const res = await request(app).get('/api/personas');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.length, 17);
    assert.ok(Object.hasOwn(res.body[0], 'id'));
    assert.ok(Object.hasOwn(res.body[0], 'label'));
  });

  it('POST /api/decisions runs a persona through the engine and persists it', async () => {
    const res = await request(app).post('/api/decisions').send({ applicant_id: 'demo-1-salaried-clean' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.outcome, 'approve');

    const fetched = await request(app).get(`/api/decisions/${res.body.applicant_id}`);
    assert.strictEqual(fetched.status, 200);
    assert.strictEqual(fetched.body.applicant_id, res.body.applicant_id);
  });

  it('POST /api/decisions with an unknown applicant_id returns 404', async () => {
    const res = await request(app).post('/api/decisions').send({ applicant_id: 'no-such-persona' });
    assert.strictEqual(res.status, 404);
  });

  it('GET /api/decisions/:id returns 404 for an unknown id', async () => {
    const res = await request(app).get('/api/decisions/does-not-exist');
    assert.strictEqual(res.status, 404);
  });

  it('GET /api/decisions lists recent decisions', async () => {
    await request(app).post('/api/decisions').send({ applicant_id: 'demo-1-salaried-clean' });
    const res = await request(app).get('/api/decisions');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.length, 1);
  });

  it('GET /api/monitoring/summary aggregates persisted decisions', async () => {
    await request(app).post('/api/decisions').send({ applicant_id: 'demo-1-salaried-clean' });
    await request(app).post('/api/decisions').send({ applicant_id: 'demo-3-live-overdue' });
    const res = await request(app).get('/api/monitoring/summary');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.total_decisions, 2);
    assert.strictEqual(res.body.outcome_counts.approve, 1);
    assert.strictEqual(res.body.outcome_counts.reject, 1);
    assert.strictEqual(res.body.gate_hit_counts[0].code, 'BUR_LIVE_OVERDUE');
  });

  it('POST /api/decisions/evaluate scores a custom applicant supplied in the request body', async () => {
    const persona = PERSONAS.find((p) => p.id === 'demo-2-msme-poor-gst')!;
    const custom = { ...persona.raw, applicant_id: 'custom-test-1' };
    const res = await request(app).post('/api/decisions/evaluate').send(custom);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.applicant_id, 'custom-test-1');
    assert.strictEqual(res.body.outcome, 'approve');
    assert.ok(res.body.score > 0);
    assert.ok(res.body.reason_codes.length > 0);

    // persisted, so it shows up in monitoring and can be overridden like any other decision
    const fetched = await request(app).get('/api/decisions/custom-test-1');
    assert.strictEqual(fetched.status, 200);
  });

  it('POST /api/decisions/evaluate reflects edited parameters in the resulting decision', async () => {
    const persona = PERSONAS.find((p) => p.id === 'demo-1-salaried-clean')!;
    const clean = { ...persona.raw, applicant_id: 'custom-clean' };
    const overdue = { ...persona.raw, applicant_id: 'custom-overdue', live_overdue_amount: 9000 };

    const cleanRes = await request(app).post('/api/decisions/evaluate').send(clean);
    const overdueRes = await request(app).post('/api/decisions/evaluate').send(overdue);

    assert.strictEqual(cleanRes.body.outcome, 'approve');
    assert.strictEqual(overdueRes.body.outcome, 'reject');
    assert.strictEqual(overdueRes.body.score, null);
    assert.strictEqual(overdueRes.body.reason_codes[0].code, 'BUR_LIVE_OVERDUE');
  });

  it('POST /api/decisions/evaluate returns a VAL_SCHEMA_INVALID decision for a malformed payload', async () => {
    const res = await request(app).post('/api/decisions/evaluate').send({ applicant_id: 'bad-1', segment: 'Z' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.outcome, 'reject');
    assert.strictEqual(res.body.reason_codes[0].code, 'VAL_SCHEMA_INVALID');
    assert.strictEqual(res.body.score, null);
  });

  it('POST /api/decisions/evaluate 400s when applicant_id is missing', async () => {
    const res = await request(app).post('/api/decisions/evaluate').send({ segment: 'A' });
    assert.strictEqual(res.status, 400);
  });

  it('POST /api/decisions/:id/override records an outcome override with a structured reason', async () => {
    await request(app).post('/api/decisions').send({ applicant_id: 'demo-3-live-overdue' });
    const res = await request(app).post('/api/decisions/demo-3-live-overdue/override').send({
      override_outcome: 'approve',
      reason_code: 'OVR_ADDITIONAL_DOCS_VERIFIED',
      reason_text: 'Confirmed cleared with lender.',
      overridden_by: 'jdoe',
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.original_outcome, 'reject');
    assert.strictEqual(res.body.override_outcome, 'approve');

    const fetched = await request(app).get('/api/decisions/demo-3-live-overdue/override');
    assert.strictEqual(fetched.status, 200);
    assert.strictEqual(fetched.body.reason_code, 'OVR_ADDITIONAL_DOCS_VERIFIED');
  });

  it('POST /api/decisions/:id/override 404s for a decision that has not been decided yet', async () => {
    const res = await request(app).post('/api/decisions/demo-3-live-overdue/override').send({
      override_outcome: 'approve', reason_code: 'OVR_OTHER', overridden_by: 'jdoe',
    });
    assert.strictEqual(res.status, 404);
  });

  it('POST /api/decisions/:id/override 400s on an invalid reason_code', async () => {
    await request(app).post('/api/decisions').send({ applicant_id: 'demo-3-live-overdue' });
    const res = await request(app).post('/api/decisions/demo-3-live-overdue/override').send({
      override_outcome: 'approve', reason_code: 'NOT_A_REAL_CODE', overridden_by: 'jdoe',
    });
    assert.strictEqual(res.status, 400);
  });

  it('POST /api/decisions/:id/override 400s when overridden_by is missing', async () => {
    await request(app).post('/api/decisions').send({ applicant_id: 'demo-3-live-overdue' });
    const res = await request(app).post('/api/decisions/demo-3-live-overdue/override').send({
      override_outcome: 'approve', reason_code: 'OVR_OTHER',
    });
    assert.strictEqual(res.status, 400);
  });

  it('GET /api/decisions/:id/override 404s when no override exists', async () => {
    await request(app).post('/api/decisions').send({ applicant_id: 'demo-1-salaried-clean' });
    const res = await request(app).get('/api/decisions/demo-1-salaried-clean/override');
    assert.strictEqual(res.status, 404);
  });
});
