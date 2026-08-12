import type { Decision, Grade } from '@creditiq/shared';
import { validateInput } from './validate.js';
import { ingest } from './ingest.js';
import { evaluateGates, firstFailure } from './gates.js';
import { computeScore } from './scoring/index.js';
import { gradeForScore } from './grade.js';
import { computeOffer, loadPolicy } from './policy.js';
import { rankScoreFactors, gateReasonCode, policyReasonCode } from './rank.js';
import { buildTrace } from './trace.js';
import { MODEL_VERSION } from './version.js';

const policy = loadPolicy();

export function decide(rawInput: unknown): Decision {
  const validation = validateInput(rawInput);
  if (!validation.valid) {
    return {
      applicant_id: typeof (rawInput as any)?.applicant_id === 'string' ? (rawInput as any).applicant_id : 'unknown',
      outcome: 'reject', grade: null, score: null,
      offer_amount: null, offer_tenure_months: null, offer_rate_pct: null, offer_emi: null,
      reason_codes: gateReasonCode(validation.code),
      trace: buildTrace({
        validationPassed: false, gateResults: null, segment: null, score: null,
        factors: null, grade: null, offerOutcome: null, offerAmount: null, reasonCodeCount: null,
      }),
      model_version: MODEL_VERSION, policy_version: policy.version,
    };
  }

  const raw = validation.data;
  const fv = ingest(raw);
  const productPolicy = policy.products[fv.requested_product];
  const gateResults = evaluateGates(fv, productPolicy.foir_cap);
  const failedGate = firstFailure(gateResults);

  if (failedGate) {
    return {
      applicant_id: fv.applicant_id, outcome: 'reject', grade: null, score: null,
      offer_amount: null, offer_tenure_months: null, offer_rate_pct: null, offer_emi: null,
      reason_codes: gateReasonCode(failedGate),
      trace: buildTrace({
        validationPassed: true, gateResults, segment: fv.segment, score: null,
        factors: null, grade: null, offerOutcome: null, offerAmount: null, reasonCodeCount: null,
      }),
      model_version: MODEL_VERSION, policy_version: policy.version,
    };
  }

  const { score, factors } = computeScore(fv);
  const grade = gradeForScore(score);

  if (!grade) {
    const reasonCodes = rankScoreFactors(factors);
    return {
      applicant_id: fv.applicant_id, outcome: 'reject', grade: null, score,
      offer_amount: null, offer_tenure_months: null, offer_rate_pct: null, offer_emi: null,
      reason_codes: reasonCodes,
      trace: buildTrace({
        validationPassed: true, gateResults, segment: fv.segment, score, factors,
        grade: null, offerOutcome: 'reject', offerAmount: null, reasonCodeCount: reasonCodes.length,
      }),
      model_version: MODEL_VERSION, policy_version: policy.version,
    };
  }

  const offer = computeOffer(
    {
      product: fv.requested_product, grade: grade as Grade, requestedAmount: fv.requested_amount,
      requestedTenureMonths: fv.requested_tenure_months, incomeVerified: fv.drv_income_verified,
    },
    policy,
  );

  let reasonCodes = rankScoreFactors(factors);
  if (offer.reasonCode) reasonCodes = policyReasonCode(offer.reasonCode, reasonCodes);

  const offerEmiRate = offer.ratePct;
  const offerEmi = offer.outcome === 'approve' && offer.amount && offer.tenureMonths && offerEmiRate
    ? standardEmiForTrace(offer.amount, offerEmiRate, offer.tenureMonths)
    : null;

  return {
    applicant_id: fv.applicant_id, outcome: offer.outcome, grade: grade as Grade, score,
    offer_amount: offer.amount, offer_tenure_months: offer.tenureMonths, offer_rate_pct: offer.ratePct,
    offer_emi: offerEmi, reason_codes: reasonCodes,
    trace: buildTrace({
      validationPassed: true, gateResults, segment: fv.segment, score, factors, grade,
      offerOutcome: offer.outcome, offerAmount: offer.amount, reasonCodeCount: reasonCodes.length,
    }),
    model_version: MODEL_VERSION, policy_version: policy.version,
  };
}

function standardEmiForTrace(principal: number, annualRatePct: number, tenureMonths: number): number {
  const r = annualRatePct / 12 / 100;
  const factor = Math.pow(1 + r, tenureMonths);
  return (principal * r * factor) / (factor - 1);
}
