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

-- F14: one override per decision (latest replaces prior, same last-write-wins convention as
-- decisions above). The referenced decisions row is never mutated by an override.
CREATE TABLE IF NOT EXISTS overrides (
  applicant_id TEXT PRIMARY KEY,
  original_outcome TEXT NOT NULL,
  override_outcome TEXT NOT NULL,
  reason_code TEXT NOT NULL,
  reason_text TEXT,
  overridden_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (applicant_id) REFERENCES decisions(applicant_id)
);
`;

export function openDb(path: string): Db {
  const db = new DatabaseSync(path);
  db.exec(SCHEMA);
  return db;
}
