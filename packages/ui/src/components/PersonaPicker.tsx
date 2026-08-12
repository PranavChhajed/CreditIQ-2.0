import { useEffect, useState } from 'react';
import { fetchPersonas, type PersonaSummary } from '../api.js';

export function PersonaPicker({ onSelect }: { onSelect: (id: string) => void }) {
  const [personas, setPersonas] = useState<PersonaSummary[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPersonas()
      .then(setPersonas)
      .catch(() => setError('Could not reach the decision service. Start the API on port 3001 and reload.'));
  }, []);

  if (error) return <p className="notice error">{error}</p>;

  return (
    <section className="panel">
      <h2 className="panel-title">Pick a prepared applicant</h2>
      <div className="field" style={{ maxWidth: 460 }}>
        <label className="field-label" htmlFor="persona-select">
          {personas.length} files on record, across both segments
        </label>
        <select
          id="persona-select"
          className="input"
          value={selected}
          onChange={(e) => {
            setSelected(e.target.value);
            onSelect(e.target.value);
          }}
        >
          <option value="" disabled>Choose a file…</option>
          <optgroup label="Segment A — Salaried">
            {personas.filter((p) => p.segment === 'A').map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </optgroup>
          <optgroup label="Segment D — MSME">
            {personas.filter((p) => p.segment === 'D').map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </optgroup>
        </select>
      </div>
    </section>
  );
}
