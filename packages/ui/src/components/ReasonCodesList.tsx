export function ReasonCodesList({ decision }: { decision: any }) {
  return (
    <section>
      <h3>Reason codes</h3>
      <ol>
        {decision.reason_codes.map((r: any) => (
          <li key={r.code}>
            <strong>{r.code}</strong>{typeof r.points === 'number' ? ` (${r.points > 0 ? '+' : ''}${r.points} pts)` : ''}
            <br />
            <span>{r.sentence}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
