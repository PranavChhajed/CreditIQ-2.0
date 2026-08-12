// Uses node:test instead of Vitest: Vite/Vitest cannot resolve the node:sqlite builtin
// as of this project's Vite version (pre-bundling strips the 'node:' protocol).
import { strict as assert } from 'assert';
import { describe, it, beforeEach } from 'node:test';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from './routes.js';
import { openDb } from './db.js';

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
