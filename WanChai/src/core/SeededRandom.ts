/**
 * Deterministic PRNG using mulberry32 algorithm.
 * Pure TypeScript — no Phaser dependency.
 */
export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  /** Returns a float in [0, 1) */
  next(): number {
    // mulberry32
    this.state |= 0;
    this.state = this.state + 0x6D2B79F5 | 0;
    let t = Math.imul(this.state ^ this.state >>> 15, 1 | this.state);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }

  /** Integer in [min, max) */
  nextInt(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min));
  }

  /** Pick a random element from array */
  pick<T>(arr: ReadonlyArray<T>): T {
    return arr[this.nextInt(0, arr.length)];
  }

  /** Fisher-Yates shuffle (returns new array) */
  shuffle<T>(arr: ReadonlyArray<T>): T[] {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i + 1);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /** Weighted pick from items with weights */
  weightedPick<T>(items: ReadonlyArray<T>, weights: ReadonlyArray<number>): T {
    const total = weights.reduce((s, w) => s + w, 0);
    let r = this.next() * total;
    for (let i = 0; i < items.length; i++) {
      r -= weights[i];
      if (r <= 0) return items[i];
    }
    return items[items.length - 1];
  }

  /** Get current state (for save/restore) */
  getState(): number { return this.state; }
}
