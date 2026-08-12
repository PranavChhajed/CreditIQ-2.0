export function DecisionPanel({ decision }: { decision: any }) {
  const badgeColor = decision.outcome === 'approve' ? 'green' : 'crimson';
  return (
    <section>
      <h2 style={{ color: badgeColor }}>{decision.outcome.toUpperCase()}</h2>
      {decision.grade && <p>Grade: {decision.grade} (score {decision.score})</p>}
      {decision.outcome === 'approve' && (
        <ul>
          <li>Amount: ₹{decision.offer_amount?.toLocaleString('en-IN')}</li>
          <li>Tenure: {decision.offer_tenure_months} months</li>
          <li>Rate: {decision.offer_rate_pct}% p.a.</li>
          <li>EMI: ₹{decision.offer_emi?.toFixed(0)}</li>
        </ul>
      )}
      <p style={{ fontSize: '0.8em', color: '#666' }}>
        model {decision.model_version} · policy {decision.policy_version}
      </p>
    </section>
  );
}
