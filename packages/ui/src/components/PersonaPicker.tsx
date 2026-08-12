import { useEffect, useState } from 'react';
import { fetchPersonas, type PersonaSummary } from '../api.js';

export function PersonaPicker({ onSelect }: { onSelect: (id: string) => void }) {
  const [personas, setPersonas] = useState<PersonaSummary[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPersonas()
      .then(setPersonas)
      .catch(() => {
        setError('Could not load applicants — is the API server running on http://localhost:3001?');
      });
  }, []);

  if (error) {
    return (
      <div>
        <p style={{ color: 'crimson' }}>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor="persona-select">Applicant</label>
      <select
        id="persona-select"
        value={selected}
        onChange={(e) => {
          setSelected(e.target.value);
          onSelect(e.target.value);
        }}
      >
        <option value="" disabled>Select an applicant…</option>
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
  );
}
