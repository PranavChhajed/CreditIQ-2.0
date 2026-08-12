import { describe, it, expect } from 'vitest';
import { bucketScore } from './bucketScore.js';

describe('bucketScore', () => {
  const buckets = [
    { min: -Infinity, points: -90 },
    { min: 550, points: -50 },
    { min: 600, points: -20 },
    { min: 650, points: 15 },
    { min: 700, points: 40 },
    { min: 750, points: 65 },
    { min: 800, points: 90 },
  ];

  it('picks the highest bucket whose min is <= value', () => {
    expect(bucketScore(820, buckets)).toBe(90);
    expect(bucketScore(800, buckets)).toBe(90);
    expect(bucketScore(799, buckets)).toBe(65);
    expect(bucketScore(300, buckets)).toBe(-90);
  });

  it('supports descending-points buckets for lower-is-better metrics', () => {
    const trendBuckets = [
      { min: -Infinity, points: 35 },
      { min: -10, points: 15 },
      { min: -2, points: 0 },
      { min: 2, points: -20 },
      { min: 10, points: -35 },
    ];
    expect(bucketScore(-15, trendBuckets)).toBe(35);
    expect(bucketScore(0, trendBuckets)).toBe(0);
    expect(bucketScore(15, trendBuckets)).toBe(-35);
  });
});
