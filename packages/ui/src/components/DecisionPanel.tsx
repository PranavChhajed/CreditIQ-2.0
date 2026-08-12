import type { Decision } from '@creditiq/shared';

export function DecisionPanel({ decision }: { decision: Decision }) {
  const approved = decision.outcome === 'approve';
  const reduced = decision.reason_codes.some((r) => r.code === 'POL_AMOUNT_REDUCED');
  const stampText = approved ? (reduced ? 'APPROVED\nREDUCED' : 'APPROVED') : 'REJECTED';

  return (
    <section className="panel file">
      <div className="file-no">File {decision.applicant_id}</div>

      {approved ? (
        <>
          {decision.grade && (
            <div className="file-grade">GRADE {decision.grade} · SCORE {decision.score}</div>
          )}
          <p className="file-amount">₹{decision.offer_amount?.toLocaleString('en-IN')}</p>
          <p className="file-terms">
            {decision.offer_tenure_months} months<br />
            {decision.offer_rate_pct}% p.a.<br />
            EMI ₹{decision.offer_emi?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
        </>
      ) : (
        <>
          <p className="file-outcome reject">Not approved</p>
          <p className="file-terms">
            {decision.score === null
              ? 'Closed before scoring — see the reason below.'
              : `Score ${decision.score}, below the approval threshold.`}
          </p>
        </>
      )}

      <p className="file-versions">
        model {decision.model_version} · policy {decision.policy_version}
      </p>

      <div className={`stamp ${approved ? 'approve' : 'reject'}`} aria-hidden="true">{stampText}</div>
    </section>
  );
}
