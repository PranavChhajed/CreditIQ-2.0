import type { RankedReasonCode, ReasonCode } from '@creditiq/shared';
import { REASON_CODE_SENTENCES } from '@creditiq/shared';
import type { FactorScore } from './scoring/shared.js';

/** Ranks scored factors by |points| descending, top 5 — spec §8. Gate failures are ranked separately by decide.ts (always rank 1, sole entry). */
export function rankScoreFactors(factors: FactorScore[]): RankedReasonCode[] {
  return [...factors]
    .sort((a, b) => Math.abs(b.points) - Math.abs(a.points))
    .slice(0, 5)
    .map((f, i) => ({
      rank: i + 1,
      code: f.code as ReasonCode,
      sentence: REASON_CODE_SENTENCES[f.code as ReasonCode],
      points: f.points,
    }));
}

export function gateReasonCode(code: ReasonCode): RankedReasonCode[] {
  return [{ rank: 1, code, sentence: REASON_CODE_SENTENCES[code] }];
}

export function policyReasonCode(code: ReasonCode, existing: RankedReasonCode[]): RankedReasonCode[] {
  return [...existing, { rank: existing.length + 1, code, sentence: REASON_CODE_SENTENCES[code] }];
}
