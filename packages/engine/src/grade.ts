import type { Grade } from '@creditiq/shared';

const BANDS: { min: number; grade: Grade }[] = [
  { min: 900, grade: 'A1' }, { min: 850, grade: 'A2' }, { min: 800, grade: 'A3' },
  { min: 750, grade: 'B1' }, { min: 700, grade: 'B2' }, { min: 650, grade: 'B3' },
  { min: 600, grade: 'C1' }, { min: 550, grade: 'C2' }, { min: 500, grade: 'C3' },
];

/** Below 500 is D1-D3 territory, which is "not approved" — spec §6 treats it as no grade. */
export function gradeForScore(score: number): Grade | null {
  const sorted = [...BANDS].sort((a, b) => b.min - a.min);
  const match = sorted.find((b) => score >= b.min);
  return match ? match.grade : null;
}
