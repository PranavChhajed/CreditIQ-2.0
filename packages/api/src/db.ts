import { DatabaseSync } from 'node:sqlite';

export type Db = DatabaseSync;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS decisions (
  applicant_id TEXT PRIMARY KEY,
  outcome TEXT NOT NULL,
  grade TEXT,
  score INTEGER,
  offer_amount INTEGER,
  offer_tenure_months INTEGER,
  offer_rate_pct REAL,
  offer_emi REAL,
  model_version TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  reason_codes_json TEXT NOT NULL,
  trace_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

export function openDb(path: string): Db {
  const db = new DatabaseSync(path);
  db.exec(SCHEMA);
  return db;
}
