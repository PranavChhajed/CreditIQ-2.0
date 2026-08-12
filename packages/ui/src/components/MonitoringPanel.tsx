import { useEffect, useState } from 'react';
import type { MonitoringSummary } from '@creditiq/shared';
import { fetchMonitoringSummary } from '../api.js';

export function MonitoringPanel() {
  const [summary, setSummary] = useState<MonitoringSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMonitoringSummary()
      .then(setSummary)
      .catch(() => setError('Could not load monitoring summary — is the API server running on http://localhost:3001?'));
  }, []);

  if (error) return <p style={{ color: 'crimson' }}>{error}</p>;
  if (!summary) return <p>Loading monitoring summary…</p>;

  const maxScoreBucket = Math.max(1, ...summary.score_distribution.map((b) => b.count));
  const maxGateHit = Math.max(1, ...summary.gate_hit_counts.map((g) => g.count));

  return (
    <div>
      <p>{summary.total_decisions} decisions recorded — {summary.outcome_counts.approve} approved, {summary.outcome_counts.reject} rejected.</p>

      <section>
        <h3>Score distribution</h3>
        {summary.total_decisions === 0 ? (
          <p>No scored decisions yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {summary.score_distribution.map((b) => (
              <li key={b.min} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 80, fontVariantNumeric: 'tabular-nums' }}>{b.min}–{b.max}</span>
                <span
                  style={{ background: '#4a90d9', height: 14, width: `${(b.count / maxScoreBucket) * 200}px` }}
                />
                <span>{b.count}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3>Grade distribution</h3>
        {Object.keys(summary.grade_distribution).length === 0 ? (
          <p>No graded decisions yet.</p>
        ) : (
          <ul>
            {Object.entries(summary.grade_distribution).map(([grade, count]) => (
              <li key={grade}>{grade}: {count}</li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3>Gate-hit counts</h3>
        {summary.gate_hit_counts.length === 0 ? (
          <p>No gate or validation rejections yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {summary.gate_hit_counts.map((g) => (
              <li key={g.code} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 220, fontVariantNumeric: 'tabular-nums' }}>{g.code}</span>
                <span
                  style={{ background: '#d94a4a', height: 14, width: `${(g.count / maxGateHit) * 200}px` }}
                />
                <span>{g.count}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
