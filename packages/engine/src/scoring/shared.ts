import type { FeatureVector, ScoreReasonCode } from '@creditiq/shared';
import { bucketScore, type Bucket } from './bucketScore.js';

export interface FactorScore {
  code: ScoreReasonCode;
  points: number;
}

const BUREAU_SCORE: Bucket[] = [
  { min: -Infinity, points: -90 }, { min: 550, points: -50 }, { min: 600, points: -20 },
  { min: 650, points: 15 }, { min: 700, points: 40 }, { min: 750, points: 65 }, { min: 800, points: 90 },
];

const UTIL_LEVEL: Bucket[] = [
  { min: -Infinity, points: 40 }, { min: 30, points: 20 }, { min: 50, points: 0 },
  { min: 70, points: -20 }, { min: 85, points: -40 },
];

// keyed by delta = current - 3m_ago; negative delta = utilization went down = improved
const UTIL_TREND: Bucket[] = [
  { min: -Infinity, points: 35 }, { min: -10, points: 15 }, { min: -2, points: 0 },
  { min: 2, points: -20 }, { min: 10, points: -35 },
];

const FOIR: Bucket[] = [
  { min: -Infinity, points: 60 }, { min: 0.30, points: 30 }, { min: 0.40, points: 0 },
  { min: 0.45, points: -30 }, { min: 0.50, points: -60 },
];

const BOUNCES: Bucket[] = [
  { min: -Infinity, points: 50 }, { min: 1, points: 10 }, { min: 2, points: -25 }, { min: 3, points: -50 },
];

const DELINQUENCY_RECENCY: Bucket[] = [
  { min: -Infinity, points: 70 }, { min: 0.01, points: 30 }, { min: 15, points: -20 },
  { min: 40, points: -50 }, { min: 80, points: -70 },
];

const HISTORY_AGE: Bucket[] = [
  { min: -Infinity, points: -30 }, { min: 12, points: -15 }, { min: 24, points: 0 },
  { min: 48, points: 15 }, { min: 84, points: 30 },
];

const ENQUIRY_PER_LENDER: Bucket[] = [
  { min: -Infinity, points: 35 }, { min: 1.2, points: 10 }, { min: 2, points: -15 }, { min: 3, points: -35 },
];

export function scoreSharedFactors(fv: FeatureVector): FactorScore[] {
  return [
    { code: 'bureau_score', points: bucketScore(fv.bureau_score ?? -Infinity, BUREAU_SCORE) },
    { code: 'utilization_level', points: bucketScore(fv.credit_utilization_pct_current, UTIL_LEVEL) },
    {
      code: 'utilization_trend',
      points: bucketScore(fv.credit_utilization_pct_current - fv.credit_utilization_pct_3m_ago, UTIL_TREND),
    },
    { code: 'foir', points: bucketScore(fv.drv_foir_post_emi, FOIR) },
    { code: 'insufficient_funds_bounces', points: bucketScore(fv.insufficient_funds_bounce_count_6m, BOUNCES) },
    { code: 'delinquency_recency', points: bucketScore(fv.drv_delinquency_recency_wt, DELINQUENCY_RECENCY) },
    { code: 'credit_history_age', points: bucketScore(fv.credit_history_age_months, HISTORY_AGE) },
    { code: 'enquiry_per_lender', points: bucketScore(fv.drv_enquiry_per_lender, ENQUIRY_PER_LENDER) },
  ];
}
