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

  it('GET /api/personas lists all 16 fixtures', async () => {
    const res = await request(app).get('/api/personas');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.length, 16);
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
});
