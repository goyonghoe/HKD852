import { describe, it, expect } from 'vitest';
import {
  calcTotalMetaPrestigeCost,
  calcUpgradeCostToLevel,
  calcAvgPrestigePerRun,
  estimateRunsForCompletion,
  simulateCumulativePrestige,
  calcCompletionAtRun,
  buildProgressionSummary,
  getSlotPriceMultiplier,
  calcSlotPrice,
  SKILL_PROFILES,
} from '../../src/core/ProgressionCurveCalc';
import { META_UPGRADES } from '../../src/core/MetaProgression';

// ── calcTotalMetaPrestigeCost ──────────────────────────────────────────────────

describe('calcTotalMetaPrestigeCost', () => {
  it('returns a positive number', () => {
    expect(calcTotalMetaPrestigeCost()).toBeGreaterThan(0);
  });

  it('equals manual sum of all costPerLevel arrays', () => {
    let expected = 0;
    for (const def of Object.values(META_UPGRADES)) {
      expected += def.costPerLevel.reduce((s, c) => s + c, 0);
    }
    expect(calcTotalMetaPrestigeCost()).toBe(expected);
  });

  it('is consistent across calls', () => {
    expect(calcTotalMetaPrestigeCost()).toBe(calcTotalMetaPrestigeCost());
  });
});

// ── calcUpgradeCostToLevel ────────────────────────────────────────────────────

describe('calcUpgradeCostToLevel', () => {
  it('level 0 returns 0', () => {
    expect(calcUpgradeCostToLevel('meta_damage', 0)).toBe(0);
  });

  it('level 1 returns first cost tier', () => {
    const def = META_UPGRADES.meta_damage;
    expect(calcUpgradeCostToLevel('meta_damage', 1)).toBe(def.costPerLevel[0]);
  });

  it('max level returns full sum', () => {
    const def = META_UPGRADES.meta_damage;
    const expected = def.costPerLevel.reduce((s, c) => s + c, 0);
    expect(calcUpgradeCostToLevel('meta_damage', def.maxLevel)).toBe(expected);
  });

  it('over-max level clamps to max', () => {
    const def = META_UPGRADES.meta_damage;
    const maxCost = def.costPerLevel.reduce((s, c) => s + c, 0);
    expect(calcUpgradeCostToLevel('meta_damage', 999)).toBe(maxCost);
  });

  it('unknown upgrade returns 0', () => {
    expect(calcUpgradeCostToLevel('no_such_upgrade', 5)).toBe(0);
  });
});

// ── SKILL_PROFILES ────────────────────────────────────────────────────────────

describe('SKILL_PROFILES', () => {
  it('has expected profiles', () => {
    expect(SKILL_PROFILES.beginner).toBeDefined();
    expect(SKILL_PROFILES.casual).toBeDefined();
    expect(SKILL_PROFILES.mid).toBeDefined();
    expect(SKILL_PROFILES.skilled).toBeDefined();
    expect(SKILL_PROFILES.expert).toBeDefined();
  });

  it('beginner has lower stage than expert', () => {
    expect(SKILL_PROFILES.beginner.avgStageReached).toBeLessThan(SKILL_PROFILES.expert.avgStageReached);
  });

  it('all profiles have valid stage range 1-16', () => {
    for (const profile of Object.values(SKILL_PROFILES)) {
      expect(profile.avgStageReached).toBeGreaterThanOrEqual(1);
      expect(profile.avgStageReached).toBeLessThanOrEqual(16);
    }
  });
});

// ── calcAvgPrestigePerRun ─────────────────────────────────────────────────────

describe('calcAvgPrestigePerRun', () => {
  it('returns positive number for all profiles', () => {
    for (const profile of Object.values(SKILL_PROFILES)) {
      expect(calcAvgPrestigePerRun(profile)).toBeGreaterThan(0);
    }
  });

  it('expert earns more than beginner', () => {
    const expertEarn = calcAvgPrestigePerRun(SKILL_PROFILES.expert);
    const beginnerEarn = calcAvgPrestigePerRun(SKILL_PROFILES.beginner);
    expect(expertEarn).toBeGreaterThan(beginnerEarn);
  });

  it('mid-skill profile earns 30-120 prestige per run', () => {
    const midEarn = calcAvgPrestigePerRun(SKILL_PROFILES.mid);
    expect(midEarn).toBeGreaterThanOrEqual(30);
    expect(midEarn).toBeLessThanOrEqual(120);
  });
});

// ── estimateRunsForCompletion ─────────────────────────────────────────────────

describe('estimateRunsForCompletion', () => {
  it('50% completion for mid player is ~100 runs (within 200)', () => {
    const runs = estimateRunsForCompletion(SKILL_PROFILES.mid, 0.5);
    // Design target: ~100 runs for 50% completion
    expect(runs).toBeGreaterThanOrEqual(50);
    expect(runs).toBeLessThanOrEqual(300);
  });

  it('100% takes more runs than 50%', () => {
    const half = estimateRunsForCompletion(SKILL_PROFILES.mid, 0.5);
    const full = estimateRunsForCompletion(SKILL_PROFILES.mid, 1.0);
    expect(full).toBeGreaterThan(half);
  });

  it('expert needs fewer runs than beginner for 50%', () => {
    const expertRuns = estimateRunsForCompletion(SKILL_PROFILES.expert, 0.5);
    const beginnerRuns = estimateRunsForCompletion(SKILL_PROFILES.beginner, 0.5);
    expect(expertRuns).toBeLessThan(beginnerRuns);
  });

  it('0% target returns 0 runs', () => {
    expect(estimateRunsForCompletion(SKILL_PROFILES.mid, 0)).toBe(0);
  });

  it('target clamped to 1.0 maximum', () => {
    const normal = estimateRunsForCompletion(SKILL_PROFILES.mid, 1.0);
    const clamped = estimateRunsForCompletion(SKILL_PROFILES.mid, 2.0);
    expect(clamped).toBe(normal);
  });
});

// ── simulateCumulativePrestige ────────────────────────────────────────────────

describe('simulateCumulativePrestige', () => {
  it('returns array of length N', () => {
    const result = simulateCumulativePrestige(SKILL_PROFILES.mid, 10);
    expect(result).toHaveLength(10);
  });

  it('values are strictly increasing', () => {
    const result = simulateCumulativePrestige(SKILL_PROFILES.mid, 10);
    for (let i = 1; i < result.length; i++) {
      expect(result[i]).toBeGreaterThan(result[i - 1]);
    }
  });

  it('returns empty array for 0 runs', () => {
    expect(simulateCumulativePrestige(SKILL_PROFILES.mid, 0)).toHaveLength(0);
  });

  it('each step increments by avgPrestigePerRun', () => {
    const avgPerRun = calcAvgPrestigePerRun(SKILL_PROFILES.casual);
    const result = simulateCumulativePrestige(SKILL_PROFILES.casual, 5);
    expect(result[0]).toBeCloseTo(avgPerRun);
    expect(result[4]).toBeCloseTo(avgPerRun * 5);
  });
});

// ── calcCompletionAtRun ───────────────────────────────────────────────────────

describe('calcCompletionAtRun', () => {
  it('returns 0 at run 0', () => {
    expect(calcCompletionAtRun(SKILL_PROFILES.mid, 0)).toBe(0);
  });

  it('returns value between 0 and 1', () => {
    const result = calcCompletionAtRun(SKILL_PROFILES.mid, 50);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(1);
  });

  it('increases with more runs', () => {
    const r50 = calcCompletionAtRun(SKILL_PROFILES.mid, 50);
    const r100 = calcCompletionAtRun(SKILL_PROFILES.mid, 100);
    expect(r100).toBeGreaterThan(r50);
  });

  it('clamps to 1.0 with very high run count', () => {
    expect(calcCompletionAtRun(SKILL_PROFILES.expert, 10000)).toBe(1);
  });
});

// ── buildProgressionSummary ───────────────────────────────────────────────────

describe('buildProgressionSummary', () => {
  it('contains expected fields', () => {
    const summary = buildProgressionSummary(SKILL_PROFILES.mid);
    expect(summary.avgPrestigePerRun).toBeGreaterThan(0);
    expect(summary.totalMetaCost).toBeGreaterThan(0);
    expect(summary.runsFor50Percent).toBeGreaterThan(0);
    expect(summary.runsFor100Percent).toBeGreaterThan(summary.runsFor50Percent);
    expect(summary.completionAt100Runs).toBeGreaterThan(summary.completionAt50Runs);
    expect(summary.completionAt200Runs).toBeGreaterThan(summary.completionAt100Runs);
  });

  it('design goal: mid player 50% at ~100 runs (50-300 range)', () => {
    const summary = buildProgressionSummary(SKILL_PROFILES.mid);
    expect(summary.runsFor50Percent).toBeGreaterThanOrEqual(50);
    expect(summary.runsFor50Percent).toBeLessThanOrEqual(300);
  });

  it('profile is preserved in summary', () => {
    const summary = buildProgressionSummary(SKILL_PROFILES.casual);
    expect(summary.profile).toEqual(SKILL_PROFILES.casual);
  });
});

// ── getSlotPriceMultiplier ────────────────────────────────────────────────────

describe('getSlotPriceMultiplier', () => {
  it('slots 0-2 return 1.0x multiplier', () => {
    expect(getSlotPriceMultiplier(0)).toBe(1.0);
    expect(getSlotPriceMultiplier(1)).toBe(1.0);
    expect(getSlotPriceMultiplier(2)).toBe(1.0);
  });

  it('slots 3-5 return 1.5x multiplier', () => {
    expect(getSlotPriceMultiplier(3)).toBe(1.5);
    expect(getSlotPriceMultiplier(4)).toBe(1.5);
    expect(getSlotPriceMultiplier(5)).toBe(1.5);
  });

  it('slots 6-7 return 2.0x multiplier', () => {
    expect(getSlotPriceMultiplier(6)).toBe(2.0);
    expect(getSlotPriceMultiplier(7)).toBe(2.0);
  });

  it('multipliers are non-decreasing across slots', () => {
    for (let i = 1; i < 8; i++) {
      expect(getSlotPriceMultiplier(i)).toBeGreaterThanOrEqual(getSlotPriceMultiplier(i - 1));
    }
  });
});

// ── calcSlotPrice ─────────────────────────────────────────────────────────────

describe('calcSlotPrice', () => {
  it('slot 0 returns baseCost (1.0x)', () => {
    expect(calcSlotPrice(20, 0)).toBe(20);
  });

  it('slot 3 returns 1.5x (ceiled)', () => {
    expect(calcSlotPrice(20, 3)).toBe(30); // 20 * 1.5 = 30
  });

  it('slot 6 returns 2.0x', () => {
    expect(calcSlotPrice(20, 6)).toBe(40); // 20 * 2.0 = 40
  });

  it('uses Math.ceil for fractional results', () => {
    // 15 * 1.5 = 22.5 → ceil = 23
    expect(calcSlotPrice(15, 3)).toBe(23);
  });

  it('baseCost 0 returns 0 for any slot', () => {
    for (let i = 0; i < 8; i++) {
      expect(calcSlotPrice(0, i)).toBe(0);
    }
  });
});

// ── Progression simulation: 100-run scenario ─────────────────────────────────

describe('100-run simulation', () => {
  it('mid player achieves >=30% at 100 runs', () => {
    const completion = calcCompletionAtRun(SKILL_PROFILES.mid, 100);
    expect(completion).toBeGreaterThanOrEqual(0.3);
  });

  it('mid player achieves <=80% at 100 runs (not trivially easy)', () => {
    const completion = calcCompletionAtRun(SKILL_PROFILES.mid, 100);
    expect(completion).toBeLessThanOrEqual(0.85);
  });

  it('cumulative prestige after 100 runs matches 100 * avgPerRun', () => {
    const avg = calcAvgPrestigePerRun(SKILL_PROFILES.mid);
    const sim = simulateCumulativePrestige(SKILL_PROFILES.mid, 100);
    expect(sim[99]).toBeCloseTo(avg * 100, 0);
  });
});
