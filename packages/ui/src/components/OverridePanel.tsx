import { useEffect, useState, type FormEvent } from 'react';
import type { Decision, DecisionOverride, OverrideReasonCode } from '@creditiq/shared';
import { OVERRIDE_REASON_CODES, OVERRIDE_REASON_LABELS } from '@creditiq/shared';
import { fetchOverride, submitOverride } from '../api.js';

export function OverridePanel({ decision }: { decision: Decision }) {
  const [override, setOverride] = useState<DecisionOverride | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [outcome, setOutcome] = useState<'approve' | 'reject'>(decision.outcome === 'approve' ? 'reject' : 'approve');
  const [reasonCode, setReasonCode] = useState<OverrideReasonCode>(OVERRIDE_REASON_CODES[0]);
  const [reasonText, setReasonText] = useState('');
  const [overriddenBy, setOverriddenBy] = useState('');

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchOverride(decision.applicant_id)
      .then(setOverride)
      .catch(() => setError('Could not load override status.'))
      .finally(() => setLoading(false));
  }, [decision.applicant_id]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const saved = await submitOverride(decision.applicant_id, {
        override_outcome: outcome, reason_code: reasonCode, reason_text: reasonText, overridden_by: overriddenBy,
      });
      setOverride(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit override.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p>Loading override status…</p>;

  return (
    <section className="panel">
      <h2 className="panel-title">Override this decision</h2>
      {override && (
        <p className="override-note">
          Changed to <strong>{override.override_outcome === 'approve' ? 'approved' : 'declined'}</strong> by{' '}
          {override.overridden_by} on {new Date(override.created_at).toLocaleString()} —{' '}
          {OVERRIDE_REASON_LABELS[override.reason_code]}
          {override.reason_text && (
            <>
              <br /><q>{override.reason_text}</q>
            </>
          )}
        </p>
      )}
      {error && <p className="notice error">{error}</p>}
      <form onSubmit={handleSubmit} className="grid">
        <div className="field">
          <label className="field-label" htmlFor="ovr-outcome">Change outcome to</label>
          <select
            id="ovr-outcome" className="input" value={outcome}
            onChange={(e) => setOutcome(e.target.value as 'approve' | 'reject')}
          >
            <option value="approve">Approve</option>
            <option value="reject">Decline</option>
          </select>
        </div>
        <div className="field">
          <label className="field-label" htmlFor="ovr-reason">Reason</label>
          <select
            id="ovr-reason" className="input" value={reasonCode}
            onChange={(e) => setReasonCode(e.target.value as OverrideReasonCode)}
          >
            {OVERRIDE_REASON_CODES.map((code) => (
              <option key={code} value={code}>{OVERRIDE_REASON_LABELS[code]}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="field-label" htmlFor="ovr-notes">Notes</label>
          <textarea
            id="ovr-notes" className="input" value={reasonText} rows={2}
            onChange={(e) => setReasonText(e.target.value)}
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="ovr-name">Your name</label>
          <input
            id="ovr-name" className="input" value={overriddenBy} required
            onChange={(e) => setOverriddenBy(e.target.value)}
          />
          <button
            type="submit" className="btn btn-primary" style={{ marginTop: 10, alignSelf: 'flex-start' }}
            disabled={submitting || !overriddenBy.trim()}
          >
            {submitting ? 'Saving…' : override ? 'Update override' : 'Record override'}
          </button>
        </div>
      </form>
    </section>
  );
}
