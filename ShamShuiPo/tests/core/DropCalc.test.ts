// ── Tests: DropCalc ──

import { describe, it, expect } from "vitest";
import { calculateDrops, DropResult } from "../../src/core/DropCalc";

// ════════════════════════════════════════════════════════════════
// § HELPERS
// ════════════════════════════════════════════════════════════════

/** Run calculateDrops N times and collect all results */
function runTrials(
  n: number,
  enemyTier: number,
  isBoss: boolean,
  playerHpRatio: number,
): DropResult[][] {
  return Array.from({ length: n }, () =>
    calculateDrops(enemyTier, isBoss, playerHpRatio),
  );
}

function countType(trials: DropResult[][], type: string): number {
  return trials.filter((drops) => drops.some((d) => d.type === type)).length;
}

// ════════════════════════════════════════════════════════════════
// § COIN DROPS
// ════════════════════════════════════════════════════════════════

describe("coin drops", () => {
  it("tier 1 drops coins roughly 30% of the time", () => {
    const N = 2000;
    const trials = runTrials(N, 1, false, 1);
    const coinCount = countType(trials, "coin");
    const rate = coinCount / N;
    // Allow ±7% tolerance for randomness
    expect(rate).toBeGreaterThan(0.2);
    expect(rate).toBeLessThan(0.4);
  });

  it("tier 2 drops coins roughly 50% of the time", () => {
    const N = 2000;
    const trials = runTrials(N, 2, false, 1);
    const coinCount = countType(trials, "coin");
    const rate = coinCount / N;
    expect(rate).toBeGreaterThan(0.4);
    expect(rate).toBeLessThan(0.6);
  });

  it("tier 3 drops coins roughly 80% of the time", () => {
    const N = 2000;
    const trials = runTrials(N, 3, false, 1);
    const coinCount = countType(trials, "coin");
    const rate = coinCount / N;
    expect(rate).toBeGreaterThan(0.7);
    expect(rate).toBeLessThan(0.9);
  });

  it("tier 1 coin value is always 1", () => {
    const N = 500;
    const trials = runTrials(N, 1, false, 1);
    for (const drops of trials) {
      const coin = drops.find((d) => d.type === "coin");
      if (coin) expect(coin.value).toBe(1);
    }
  });

  it("tier 2 coin value is 2 or 3", () => {
    const N = 500;
    const trials = runTrials(N, 2, false, 1);
    for (const drops of trials) {
      const coin = drops.find((d) => d.type === "coin");
      if (coin) {
        expect(coin.value).toBeGreaterThanOrEqual(2);
        expect(coin.value).toBeLessThanOrEqual(3);
      }
    }
  });

  it("tier 3 coin value is always 5", () => {
    const N = 500;
    const trials = runTrials(N, 3, false, 1);
    for (const drops of trials) {
      const coin = drops.find((d) => d.type === "coin");
      if (coin) expect(coin.value).toBe(5);
    }
  });
});

// ════════════════════════════════════════════════════════════════
// § BOSS DROPS
// ════════════════════════════════════════════════════════════════

describe("boss drops", () => {
  it("boss always drops coins", () => {
    const N = 200;
    const trials = runTrials(N, 3, true, 1);
    for (const drops of trials) {
      const coin = drops.find((d) => d.type === "coin");
      expect(coin).toBeDefined();
    }
  });

  it("boss coin value is 50", () => {
    const N = 100;
    const trials = runTrials(N, 3, true, 1);
    for (const drops of trials) {
      const coin = drops.find((d) => d.type === "coin");
      expect(coin!.value).toBe(50);
    }
  });
});

// ════════════════════════════════════════════════════════════════
// § HEALTH DROPS
// ════════════════════════════════════════════════════════════════

describe("health drops", () => {
  it("no health drops at full HP", () => {
    const N = 1000;
    const trials = runTrials(N, 2, false, 1);
    const healthCount = countType(trials, "health");
    expect(healthCount).toBe(0);
  });

  it("no health drops at HP >= 40%", () => {
    const N = 1000;
    const trials = runTrials(N, 2, false, 0.5);
    const healthCount = countType(trials, "health");
    expect(healthCount).toBe(0);
  });

  it("low HP increases health drop occurrence", () => {
    const N = 3000;
    const lowHpTrials = runTrials(N, 2, false, 0.1);
    const moderateHpTrials = runTrials(N, 2, false, 0.35);
    const lowHpRate = countType(lowHpTrials, "health") / N;
    const moderateRate = countType(moderateHpTrials, "health") / N;
    // At 10% HP: chance = 0.9 * 0.15 = 13.5%
    // At 35% HP: chance = 0.65 * 0.15 = 9.75%
    expect(lowHpRate).toBeGreaterThan(moderateRate);
  });

  it("tier 1 heal value is 5", () => {
    const N = 2000;
    const trials = runTrials(N, 1, false, 0.05);
    for (const drops of trials) {
      const health = drops.find((d) => d.type === "health");
      if (health) expect(health.value).toBe(5);
    }
  });

  it("boss heal value is 50", () => {
    const N = 1000;
    const trials = runTrials(N, 3, true, 0.05);
    for (const drops of trials) {
      const health = drops.find((d) => d.type === "health");
      if (health) expect(health.value).toBe(50);
    }
  });
});

// ════════════════════════════════════════════════════════════════
// § MAGNET BURST
// ════════════════════════════════════════════════════════════════

describe("magnet burst", () => {
  it("never drops from tier 1 enemies", () => {
    const N = 2000;
    const trials = runTrials(N, 1, false, 1);
    const magnetCount = countType(trials, "magnet_burst");
    expect(magnetCount).toBe(0);
  });

  it("never drops from tier 2 enemies", () => {
    const N = 2000;
    const trials = runTrials(N, 2, false, 1);
    const magnetCount = countType(trials, "magnet_burst");
    expect(magnetCount).toBe(0);
  });

  it("drops from tier 3 at roughly 5%", () => {
    const N = 5000;
    const trials = runTrials(N, 3, false, 1);
    const magnetCount = countType(trials, "magnet_burst");
    const rate = magnetCount / N;
    // 5% ± 3% tolerance
    expect(rate).toBeGreaterThan(0.02);
    expect(rate).toBeLessThan(0.08);
  });

  it("drops from bosses at roughly 5%", () => {
    const N = 5000;
    const trials = runTrials(N, 3, true, 1);
    const magnetCount = countType(trials, "magnet_burst");
    const rate = magnetCount / N;
    expect(rate).toBeGreaterThan(0.02);
    expect(rate).toBeLessThan(0.08);
  });

  it("magnet burst value is always 3 (radius multiplier)", () => {
    const N = 5000;
    const trials = runTrials(N, 3, false, 1);
    for (const drops of trials) {
      const magnet = drops.find((d) => d.type === "magnet_burst");
      if (magnet) expect(magnet.value).toBe(3);
    }
  });
});

// ════════════════════════════════════════════════════════════════
// § EDGE CASES
// ════════════════════════════════════════════════════════════════

describe("edge cases", () => {
  it("returns an array (possibly empty) for any valid input", () => {
    const result = calculateDrops(1, false, 1);
    expect(Array.isArray(result)).toBe(true);
  });

  it("full HP tier 1 can return empty array", () => {
    // Run enough times that at least one should be empty (70% chance each)
    const N = 50;
    const trials = runTrials(N, 1, false, 1);
    const emptyCount = trials.filter((d) => d.length === 0).length;
    expect(emptyCount).toBeGreaterThan(0);
  });
});
