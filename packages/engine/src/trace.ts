import type { TraceStep } from '@creditiq/shared';
import type { GateResult } from './gates.js';
import type { FactorScore } from './scoring/shared.js';

export function buildTrace(params: {
  validationPassed: boolean;
  gateResults: GateResult[] | null;
  segment: string | null;
  score: number | null;
  factors: FactorScore[] | null;
  grade: string | null;
  offerOutcome: string | null;
  offerAmount: number | null;
  reasonCodeCount: number | null;
}): TraceStep[] {
  const steps: TraceStep[] = [
    { step: 1, stage: 'input_validation', outcome: params.validationPassed ? 'pass' : 'fail', detail: {} },
  ];
  if (!params.validationPassed) return steps;

  steps.push({
    step: 2, stage: 'hard_gates',
    outcome: params.gateResults?.every((g) => g.passed) ? 'pass' : 'fail',
    detail: { gates: params.gateResults },
  });
  if (!params.gateResults?.every((g) => g.passed)) return steps;

  steps.push({ step: 3, stage: 'segment_routing', outcome: 'computed', detail: { segment: params.segment } });
  steps.push({ step: 4, stage: 'scoring', outcome: 'computed', detail: { score: params.score, factors: params.factors } });
  steps.push({ step: 5, stage: 'grade_banding', outcome: 'computed', detail: { grade: params.grade } });
  steps.push({ step: 6, stage: 'policy_matrix', outcome: 'computed', detail: { offer_amount: params.offerAmount } });
  steps.push({ step: 7, stage: 'product_caps', outcome: 'computed', detail: {} });
  steps.push({ step: 8, stage: 'reason_codes', outcome: 'computed', detail: { count: params.reasonCodeCount } });
  steps.push({ step: 9, stage: 'emit_decision', outcome: 'computed', detail: { outcome: params.offerOutcome } });
  return steps;
}
