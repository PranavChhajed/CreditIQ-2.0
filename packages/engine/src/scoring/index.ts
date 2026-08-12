import type { FeatureVector } from '@creditiq/shared';
import { scoreSharedFactors, type FactorScore } from './shared.js';
import { scoreSegmentA } from './segmentA.js';
import { scoreSegmentD } from './segmentD.js';

const BASELINE_SCORE = 500;

export function computeScore(fv: FeatureVector): { score: number; factors: FactorScore[] } {
  const shared = scoreSharedFactors(fv);
  const segmentSpecific = fv.segment === 'A' ? scoreSegmentA(fv) : scoreSegmentD(fv);
  const factors = [...shared, ...segmentSpecific];
  const total = factors.reduce((sum, f) => sum + f.points, 0);
  const score = Math.min(1000, Math.max(0, BASELINE_SCORE + total));
  return { score, factors };
}
