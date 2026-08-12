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
    <section>
      <h3>Manual override</h3>
      {override && (
        <p>
          Overridden to <strong>{override.override_outcome.toUpperCase()}</strong> by {override.overridden_by} on{' '}
          {new Date(override.created_at).toLocaleString()} — {OVERRIDE_REASON_LABELS[override.reason_code]}
          {override.reason_text && (
            <>
              <br />“{override.reason_text}”
            </>
          )}
        </p>
      )}
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Override outcome to:{' '}
            <select value={outcome} onChange={(e) => setOutcome(e.target.value as 'approve' | 'reject')}>
              <option value="approve">Approve</option>
              <option value="reject">Reject</option>
            </select>
          </label>
        </div>
        <div>
          <label>
            Reason:{' '}
            <select value={reasonCode} onChange={(e) => setReasonCode(e.target.value as OverrideReasonCode)}>
              {OVERRIDE_REASON_CODES.map((code) => (
                <option key={code} value={code}>{OVERRIDE_REASON_LABELS[code]}</option>
              ))}
            </select>
          </label>
        </div>
        <div>
          <label>
            Notes:{' '}
            <textarea value={reasonText} onChange={(e) => setReasonText(e.target.value)} rows={2} />
          </label>
        </div>
        <div>
          <label>
            Your name:{' '}
            <input value={overriddenBy} onChange={(e) => setOverriddenBy(e.target.value)} required />
          </label>
        </div>
        <button type="submit" disabled={submitting || !overriddenBy.trim()}>
          {submitting ? 'Saving…' : override ? 'Update override' : 'Submit override'}
        </button>
      </form>
    </section>
  );
}
