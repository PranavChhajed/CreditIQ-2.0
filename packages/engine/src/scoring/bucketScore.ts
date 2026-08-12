export interface Bucket {
  min: number;
  points: number;
}

/** Returns the points of the bucket with the largest `min` that is <= value. Buckets need not be pre-sorted. */
export function bucketScore(value: number, buckets: Bucket[]): number {
  const sorted = [...buckets].sort((a, b) => a.min - b.min);
  let points = sorted[0].points;
  for (const b of sorted) {
    if (value >= b.min) points = b.points;
    else break;
  }
  return points;
}
