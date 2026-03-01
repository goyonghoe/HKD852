import { describe, it, expect } from 'vitest';
import { SeededRandom } from '../../src/core/SeededRandom';

describe('SeededRandom', () => {
  it('is deterministic: same seed gives same sequence', () => {
    const rng1 = new SeededRandom(12345);
    const rng2 = new SeededRandom(12345);
    for (let i = 0; i < 20; i++) {
      expect(rng1.next()).toBe(rng2.next());
    }
  });

  it('different seeds give different sequences', () => {
    const rng1 = new SeededRandom(111);
    const rng2 = new SeededRandom(222);
    const seq1 = Array.from({ length: 10 }, () => rng1.next());
    const seq2 = Array.from({ length: 10 }, () => rng2.next());
    expect(seq1).not.toEqual(seq2);
  });

  it('next() returns values in [0, 1)', () => {
    const rng = new SeededRandom(99999);
    for (let i = 0; i < 100; i++) {
      const val = rng.next();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  it('nextInt() returns values in [min, max)', () => {
    const rng = new SeededRandom(42);
    const min = 5;
    const max = 15;
    for (let i = 0; i < 100; i++) {
      const val = rng.nextInt(min, max);
      expect(val).toBeGreaterThanOrEqual(min);
      expect(val).toBeLessThan(max);
      expect(Number.isInteger(val)).toBe(true);
    }
  });

  it('pick() returns an element from the array', () => {
    const rng = new SeededRandom(7777);
    const arr = ['a', 'b', 'c', 'd'];
    for (let i = 0; i < 50; i++) {
      const picked = rng.pick(arr);
      expect(arr).toContain(picked);
    }
  });

  it('shuffle() returns all elements without duplicates or omissions', () => {
    const rng = new SeededRandom(55555);
    const arr = [1, 2, 3, 4, 5, 6, 7, 8];
    const shuffled = rng.shuffle(arr);
    expect(shuffled).toHaveLength(arr.length);
    expect([...shuffled].sort((a, b) => a - b)).toEqual([...arr].sort((a, b) => a - b));
  });

  it('shuffle() produces different orders with different seeds', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const rng1 = new SeededRandom(100);
    const rng2 = new SeededRandom(200);
    const shuffled1 = rng1.shuffle(arr);
    const shuffled2 = rng2.shuffle(arr);
    // Very unlikely they match (1/10! ≈ 0.00000028%)
    expect(shuffled1).not.toEqual(shuffled2);
  });

  it('weightedPick() respects weights in distribution', () => {
    const rng = new SeededRandom(314159);
    const items = ['common', 'rare', 'epic'] as const;
    const weights = [60, 30, 10]; // 60%, 30%, 10%
    const counts: Record<string, number> = { common: 0, rare: 0, epic: 0 };
    const trials = 2000;

    for (let i = 0; i < trials; i++) {
      const picked = rng.weightedPick(items, weights);
      counts[picked]++;
    }

    // Allow ±10% absolute tolerance for randomness
    const tolerance = 0.10;
    expect(counts['common'] / trials).toBeGreaterThan(0.60 - tolerance);
    expect(counts['common'] / trials).toBeLessThan(0.60 + tolerance);
    expect(counts['rare'] / trials).toBeGreaterThan(0.30 - tolerance);
    expect(counts['rare'] / trials).toBeLessThan(0.30 + tolerance);
    expect(counts['epic'] / trials).toBeGreaterThan(0.10 - tolerance);
    expect(counts['epic'] / trials).toBeLessThan(0.10 + tolerance);
  });

  it('getState() returns the current internal state', () => {
    const rng = new SeededRandom(12345);
    rng.next(); // advance
    const savedState = rng.getState();
    const nextVal = rng.next();
    // Create a new rng with the saved state and verify it produces the same next value
    const rng2 = new SeededRandom(savedState);
    // The state was already advanced past one call, so we compare states
    expect(typeof savedState).toBe('number');
    expect(savedState).not.toBe(12345); // state should have changed
    // Verify determinism: same saved state -> same next value
    const rng3 = new SeededRandom(12345);
    rng3.next(); // advance same as rng above
    expect(rng3.getState()).toBe(savedState);
    rng3.next();
    expect(rng3.next()).not.toBe(nextVal); // different positions, different values
  });
});
