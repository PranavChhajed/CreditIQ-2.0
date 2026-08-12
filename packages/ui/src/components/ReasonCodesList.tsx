import type { Decision } from '@creditiq/shared';

export function ReasonCodesList({ decision }: { decision: Decision }) {
  return (
    <section className="panel">
      <h2 className="panel-title">Why this decision</h2>
      {decision.reason_codes.map((r) => (
        <div className="reason" key={r.code}>
          <div>
            <span className="reason-code">{r.rank}. {r.code}</span>
            <span className="reason-sentence">{r.sentence}</span>
          </div>
          {typeof r.points === 'number' && (
            <span className={`reason-points ${r.points > 0 ? 'pos' : 'neg'}`}>
              {r.points > 0 ? '+' : ''}{r.points}
            </span>
          )}
        </div>
      ))}
    </section>
  );
}
