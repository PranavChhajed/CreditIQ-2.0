import type { FeatureVector } from '@creditiq/shared';
import { bucketScore, type Bucket } from './bucketScore.js';
import type { FactorScore } from './shared.js';

const GST_PUNCTUALITY_ASC: Bucket[] = [
  { min: -Infinity, points: 80 }, { min: 1, points: 30 }, { min: 3, points: -30 },
  { min: 6, points: -60 }, { min: 9, points: -80 },
];

const BUSINESS_VINTAGE: Bucket[] = [
  { min: -Infinity, points: 0 }, { min: 36, points: 20 }, { min: 60, points: 40 },
];

const INFLOW_VOLATILITY: Bucket[] = [
  { min: -Infinity, points: 40 }, { min: 15, points: 15 }, { min: 30, points: -20 }, { min: 50, points: -40 },
];

export function scoreSegmentD(fv: FeatureVector): FactorScore[] {
  return [
    {
      code: 'gst_filing_punctuality',
      points: bucketScore(fv.gst_filing_profile?.late_filings_12m ?? 12, GST_PUNCTUALITY_ASC),
    },
    { code: 'business_vintage', points: bucketScore(fv.gst_registration_vintage_months ?? 0, BUSINESS_VINTAGE) },
    {
      code: 'business_inflow_volatility',
      points: bucketScore(fv.business_inflow_profile?.volatility_pct ?? 100, INFLOW_VOLATILITY),
    },
  ];
}
