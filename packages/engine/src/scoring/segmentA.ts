import type { FeatureVector, EmployerCategory } from '@creditiq/shared';
import { bucketScore, type Bucket } from './bucketScore.js';
import type { FactorScore } from './shared.js';

const EPFO_VINTAGE: Bucket[] = [
  { min: -Infinity, points: -10 }, { min: 24, points: 10 }, { min: 36, points: 25 }, { min: 60, points: 45 },
];

const EMPLOYER_CATEGORY_POINTS: Record<EmployerCategory, number> = {
  govt_psu_listed: 25, mid_size: 10, small_unlisted: -15, unverifiable: -25,
};

const SALARY_STABILITY: Bucket[] = [
  { min: -Infinity, points: -35 }, { min: 70, points: -10 }, { min: 85, points: 15 }, { min: 95, points: 35 },
];

export function scoreSegmentA(fv: FeatureVector): FactorScore[] {
  return [
    { code: 'epfo_vintage', points: bucketScore(fv.epfo_employment_vintage_months ?? 0, EPFO_VINTAGE) },
    { code: 'employer_category', points: EMPLOYER_CATEGORY_POINTS[fv.employer_category ?? 'unverifiable'] },
    {
      code: 'salary_stability',
      points: bucketScore(fv.salary_inflow_profile?.stability_pct ?? 0, SALARY_STABILITY),
    },
  ];
}
