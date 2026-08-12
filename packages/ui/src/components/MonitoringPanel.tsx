import { useEffect, useState } from 'react';
import type { MonitoringSummary } from '@creditiq/shared';
import { fetchMonitoringSummary } from '../api.js';

export function MonitoringPanel() {
  const [summary, setSummary] = useState<MonitoringSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMonitoringSummary()
      .then(setSummary)
      .catch(() => setError('Could not reach the decision service. Start the API on port 3001 and reload.'));
  }, []);

  if (error) return <p className="notice error">{error}</p>;
  if (!summary) return <p className="notice">Loading portfolio…</p>;

  if (summary.total_decisions === 0) {
    return (
      <section className="panel">
        <h2 className="panel-title">Nothing decided yet</h2>
        <p className="empty">Run an applicant from either of the other two tabs and the distributions will build up here.</p>
      </section>
    );
  }

  const maxScore = Math.max(1, ...summary.score_distribution.map((b) => b.count));
  const maxGate = Math.max(1, ...summary.gate_hit_counts.map((g) => g.count));
  const grades = Object.entries(summary.grade_distribution);
  const maxGrade = Math.max(1, ...grades.map(([, c]) => c ?? 0));

  return (
    <>
      <p className="eyebrow">Portfolio to date</p>
      <div className="metrics">
        <div className="metric">
          <div className="metric-figure">{summary.total_decisions}</div>
          <div className="metric-label">Decisions</div>
        </div>
        <div className="metric">
          <div className="metric-figure approve">{summary.outcome_counts.approve}</div>
          <div className="metric-label">Approved</div>
        </div>
        <div className="metric">
          <div className="metric-figure reject">{summary.outcome_counts.reject}</div>
          <div className="metric-label">Declined</div>
        </div>
      </div>

      <div className="charts">
        <section className="panel">
          <h2 className="panel-title">Score distribution</h2>
          {summary.score_distribution.map((b) => (
            <div className="bar-row" key={b.min}>
              <span className="bar-label">{b.min}–{b.max}</span>
              <span className="bar-track">
                <span className="bar-fill" style={{ width: `${(b.count / maxScore) * 100}%` }} />
              </span>
              <span className="bar-count">{b.count}</span>
            </div>
          ))}
        </section>

        <section className="panel">
          <h2 className="panel-title">Grades awarded</h2>
          {grades.length === 0 && <p className="empty">No graded decisions yet.</p>}
          {grades.map(([grade, count]) => (
            <div className="bar-row" key={grade}>
              <span className="bar-label">{grade}</span>
              <span className="bar-track">
                <span className="bar-fill" style={{ width: `${((count ?? 0) / maxGrade) * 100}%` }} />
              </span>
              <span className="bar-count">{count}</span>
            </div>
          ))}
        </section>

        <section className="panel">
          <h2 className="panel-title">Where files were stopped</h2>
          {summary.gate_hit_counts.length === 0 && (
            <p className="empty">No file has been stopped at a gate yet.</p>
          )}
          {summary.gate_hit_counts.map((g) => (
            <div className="bar-row" key={g.code}>
              <span className="bar-label wide">{g.code}</span>
              <span className="bar-track">
                <span className="bar-fill gate" style={{ width: `${(g.count / maxGate) * 100}%` }} />
              </span>
              <span className="bar-count">{g.count}</span>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
