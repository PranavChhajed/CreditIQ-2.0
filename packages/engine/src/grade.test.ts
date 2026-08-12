import { describe, it, expect } from 'vitest';
import { gradeForScore } from './grade.js';

describe('gradeForScore', () => {
  it('maps every band boundary from spec §6', () => {
    expect(gradeForScore(900)).toBe('A1');
    expect(gradeForScore(899)).toBe('A2');
    expect(gradeForScore(850)).toBe('A2');
    expect(gradeForScore(849)).toBe('A3');
    expect(gradeForScore(800)).toBe('A3');
    expect(gradeForScore(799)).toBe('B1');
    expect(gradeForScore(750)).toBe('B1');
    expect(gradeForScore(700)).toBe('B2');
    expect(gradeForScore(650)).toBe('B3');
    expect(gradeForScore(600)).toBe('C1');
    expect(gradeForScore(550)).toBe('C2');
    expect(gradeForScore(500)).toBe('C3');
    expect(gradeForScore(499)).toBeNull();
    expect(gradeForScore(0)).toBeNull();
  });
});
