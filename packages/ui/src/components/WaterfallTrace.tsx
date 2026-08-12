import { useState } from 'react';
import type { Decision, TraceStep } from '@creditiq/shared';

const STAGE_LABELS: Record<string, string> = {
  input_validation: 'Input validated',
  hard_gates: 'Hard gates',
  segment_routing: 'Routed to scorecard',
  scoring: 'Scored',
  grade_banding: 'Graded',
  policy_matrix: 'Policy matrix applied',
  product_caps: 'Product caps applied',
  reason_codes: 'Reason codes ranked',
  emit_decision: 'Decision emitted',
};

const MARKS: Record<TraceStep['outcome'], string> = { pass: '✓', fail: '✕', computed: '›' };

/** Pulls the one detail worth showing per stage; the rest stays in the record. */
function summarise(step: TraceStep): string | null {
  const d = step.detail as Record<string, unknown>;
  if (step.stage === 'hard_gates') {
    const gates = (d.gates as { passed: boolean }[] | undefined) ?? [];
    const failed = gates.filter((g) => !g.passed).length;
    return failed === 0 ? `all ${gates.length} passed` : `${failed} of ${gates.length} failed`;
  }
  if (step.stage === 'segment_routing') return `segment ${d.segment}`;
  if (step.stage === 'scoring') return `${d.score}`;
  if (step.stage === 'grade_banding') return `${d.grade}`;
  if (step.stage === 'policy_matrix' && d.offer_amount != null) {
    return `₹${Number(d.offer_amount).toLocaleString('en-IN')}`;
  }
  if (step.stage === 'reason_codes') return `${d.count} codes`;
  if (step.stage === 'emit_decision') return `${d.outcome}`;
  return null;
}

export function WaterfallTrace({ decision }: { decision: Decision }) {
  const [open, setOpen] = useState(false);

  return (
    <section className="panel">
      <h2 className="panel-title">Decision trail</h2>
      <button type="button" className="btn btn-link" onClick={() => setOpen((o) => !o)}>
        {open ? 'Hide' : 'Show'} all {decision.trace.length} steps
      </button>

      {open && (
        <div className="trace">
          {decision.trace.map((step) => {
            const detail = summarise(step);
            return (
              <div className="trace-step" key={step.step}>
                <span className={`trace-mark ${step.outcome}`}>{MARKS[step.outcome]}</span>
                <span className="trace-stage">{STAGE_LABELS[step.stage] ?? step.stage}</span>
                {detail && <span className="trace-detail">— {detail}</span>}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
