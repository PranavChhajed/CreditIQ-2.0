import express, { type Express } from 'express';
import { decide } from '@creditiq/engine';
import { PERSONAS } from '@creditiq/engine/src/fixtures/personas.js';
import { OVERRIDE_REASON_CODES, type OverrideReasonCode } from '@creditiq/shared';
import type { Db } from './db.js';
import {
  saveDecision, getDecision, listDecisions, getMonitoringSummary, saveOverride, getOverride,
} from './repository.js';

export function createApp(db: Db): Express {
  const app = express();
  app.use(express.json());

  app.get('/api/personas', (_req, res) => {
    res.json(PERSONAS.map((p) => ({ id: p.id, label: p.label, segment: p.segment })));
  });

  app.post('/api/decisions', (req, res) => {
    const { applicant_id } = req.body as { applicant_id?: string };
    const persona = PERSONAS.find((p) => p.id === applicant_id);
    if (!persona) {
      res.status(404).json({ error: 'Unknown applicant_id' });
      return;
    }
    const decision = decide(persona.raw);
    saveDecision(db, decision);
    res.json(decision);
  });

  app.get('/api/decisions/:id', (req, res) => {
    const decision = getDecision(db, req.params.id);
    if (!decision) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json(decision);
  });

  app.get('/api/decisions', (req, res) => {
    const limit = Number(req.query.limit) || 20;
    res.json(listDecisions(db, limit));
  });

  app.get('/api/monitoring/summary', (_req, res) => {
    res.json(getMonitoringSummary(db));
  });

  app.post('/api/decisions/:id/override', (req, res) => {
    const decision = getDecision(db, req.params.id);
    if (!decision) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    const { override_outcome, reason_code, reason_text, overridden_by } = req.body as {
      override_outcome?: string; reason_code?: string; reason_text?: string; overridden_by?: string;
    };

    if (override_outcome !== 'approve' && override_outcome !== 'reject') {
      res.status(400).json({ error: 'override_outcome must be "approve" or "reject"' });
      return;
    }
    if (!reason_code || !OVERRIDE_REASON_CODES.includes(reason_code as OverrideReasonCode)) {
      res.status(400).json({ error: `reason_code must be one of: ${OVERRIDE_REASON_CODES.join(', ')}` });
      return;
    }
    if (!overridden_by || overridden_by.trim() === '') {
      res.status(400).json({ error: 'overridden_by is required' });
      return;
    }

    saveOverride(db, {
      applicant_id: decision.applicant_id,
      original_outcome: decision.outcome,
      override_outcome,
      reason_code: reason_code as OverrideReasonCode,
      reason_text: reason_text?.trim() || null,
      overridden_by: overridden_by.trim(),
      created_at: '', // server-assigned; ignored on write
    });
    res.json(getOverride(db, decision.applicant_id));
  });

  app.get('/api/decisions/:id/override', (req, res) => {
    const override = getOverride(db, req.params.id);
    if (!override) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json(override);
  });

  return app;
}
