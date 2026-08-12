import express, { type Express } from 'express';
import { decide } from '@creditiq/engine';
import { PERSONAS } from '@creditiq/engine/src/fixtures/personas.js';
import type { Db } from './db.js';
import { saveDecision, getDecision, listDecisions } from './repository.js';

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

  return app;
}
