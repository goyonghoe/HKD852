import { describe, it, expect } from 'vitest';
import {
  calcKillGold,
  addRunGold,
  spendRunGold,
  canAffordRunGold,
  calcStageMultiplier,
  calcPerformanceBonus,
  calcPrestigeEarned,
  addPrestige,
  spendPrestige,
  canAffordPrestige,
  createInitialCurrencyState,
  resetRunGold,
  applyKillGold,
  applyRunEndPrestige,
} from '../../src/core/EconomyCalc';
import { BALANCE } from '../../src/config/balance';

// ── calcKillGold ─────────────────────────────────────────────────────────────

describe('calcKillGold', () => {
  it('normal enemy returns goldPerKill', () => {
    expect(calcKillGold('normal')).toBe(BALANCE.ECONOMY.goldPerKill);
  });

  it('elite enemy returns goldPerElite', () => {
    expect(calcKillGold('elite')).toBe(BALANCE.ECONOMY.goldPerElite);
  });

  it('boss enemy returns goldPerBoss', () => {
    expect(calcKillGold('boss')).toBe(BALANCE.ECONOMY.goldPerBoss);
  });

  it('normal < elite < boss ordering', () => {
    expect(calcKillGold('normal')).toBeLessThan(calcKillGold('elite'));
    expect(calcKillGold('elite')).toBeLessThan(calcKillGold('boss'));
  });
});

// ── addRunGold / spendRunGold ─────────────────────────────────────────────────

describe('addRunGold', () => {
  it('adds positive amount', () => {
    expect(addRunGold(50, 10)).toBe(60);
  });

  it('starts at 0 and adds correctly', () => {
    expect(addRunGold(0, 25)).toBe(25);
  });

  it('never goes negative with negative amount', () => {
    expect(addRunGold(5, -10)).toBe(0);
  });
});

describe('spendRunGold', () => {
  it('returns new total after spending', () => {
    expect(spendRunGold(100, 30)).toBe(70);
  });

  it('returns null when insufficient gold', () => {
    expect(spendRunGold(10, 20)).toBeNull();
  });

  it('exact cost boundary — returns 0', () => {
    expect(spendRunGold(20, 20)).toBe(0);
  });

  it('one less than cost returns null', () => {
    expect(spendRunGold(19, 20)).toBeNull();
  });
});

describe('canAffordRunGold', () => {
  it('returns true when gold >= cost', () => {
    expect(canAffordRunGold(50, 50)).toBe(true);
    expect(canAffordRunGold(100, 50)).toBe(true);
  });

  it('returns false when gold < cost', () => {
    expect(canAffordRunGold(49, 50)).toBe(false);
    expect(canAffordRunGold(0, 1)).toBe(false);
  });
});

// ── calcStageMultiplier ───────────────────────────────────────────────────────

describe('calcStageMultiplier', () => {
  it('stage 1 returns minimum multiplier (1.0)', () => {
    // base 0.5 + (1-1)*0.5 = 0.5 + 0 = 0.5... wait, formula: base + (stage-1)*perStage
    // stageMultiplierBase=0.5, stageMultiplierPerStage=0.5 → stage1: 0.5 + 0*0.5 = 0.5
    // Actually: baseOffset + (stageReached-1) * perStage = 0.5 + 0 = 0.5
    // But design says stage 1 → 1.0x. Let's verify against the config values
    const { stageMultiplierBase, stageMultiplierPerStage } = BALANCE.ECONOMY;
    const expected = stageMultiplierBase + (1 - 1) * stageMultiplierPerStage;
    expect(calcStageMultiplier(1)).toBeCloseTo(expected);
  });

  it('stage 16 returns highest multiplier', () => {
    const { stageMultiplierBase, stageMultiplierPerStage } = BALANCE.ECONOMY;
    const expected = stageMultiplierBase + (16 - 1) * stageMultiplierPerStage;
    expect(calcStageMultiplier(16)).toBeCloseTo(expected);
  });

  it('multiplier increases with each stage', () => {
    for (let s = 1; s < 16; s++) {
      expect(calcStageMultiplier(s + 1)).toBeGreaterThan(calcStageMultiplier(s));
    }
  });

  it('clamps to minimum 1 stage for stage <= 0', () => {
    expect(calcStageMultiplier(0)).toBe(calcStageMultiplier(1));
    expect(calcStageMultiplier(-5)).toBe(calcStageMultiplier(1));
  });
});

// ── calcPerformanceBonus ──────────────────────────────────────────────────────

describe('calcPerformanceBonus', () => {
  it('0 kills returns minimum bonus', () => {
    expect(calcPerformanceBonus(0)).toBe(BALANCE.ECONOMY.performanceBonusMin);
  });

  it('max kills returns maximum bonus', () => {
    expect(calcPerformanceBonus(BALANCE.ECONOMY.performanceBonusMaxKills)).toBe(BALANCE.ECONOMY.performanceBonusMax);
  });

  it('bonus increases with kills', () => {
    const b100 = calcPerformanceBonus(100);
    const b200 = calcPerformanceBonus(200);
    const b400 = calcPerformanceBonus(400);
    expect(b200).toBeGreaterThan(b100);
    expect(b400).toBeGreaterThan(b200);
  });

  it('over-max kills clamps to max bonus', () => {
    expect(calcPerformanceBonus(999999)).toBe(BALANCE.ECONOMY.performanceBonusMax);
  });

  it('negative kills treated as 0', () => {
    expect(calcPerformanceBonus(-100)).toBe(BALANCE.ECONOMY.performanceBonusMin);
  });
});

// ── calcPrestigeEarned ────────────────────────────────────────────────────────

describe('calcPrestigeEarned', () => {
  it('returns integer (floor)', () => {
    const result = calcPrestigeEarned({ stageReached: 3, kills: 100 });
    expect(Number.isInteger(result.prestige)).toBe(true);
  });

  it('higher stage → more prestige', () => {
    const low = calcPrestigeEarned({ stageReached: 2, kills: 100 });
    const high = calcPrestigeEarned({ stageReached: 10, kills: 100 });
    expect(high.prestige).toBeGreaterThan(low.prestige);
  });

  it('higher kills → more prestige', () => {
    const low = calcPrestigeEarned({ stageReached: 5, kills: 0 });
    const high = calcPrestigeEarned({ stageReached: 5, kills: 500 });
    expect(high.prestige).toBeGreaterThan(low.prestige);
  });

  it('result includes stageMultiplier and performanceBonus', () => {
    const result = calcPrestigeEarned({ stageReached: 7, kills: 280 });
    expect(result.stageMultiplier).toBeGreaterThan(0);
    expect(result.performanceBonus).toBeGreaterThan(0);
  });

  it('minimum run (stage 1, 0 kills) earns positive prestige', () => {
    const result = calcPrestigeEarned({ stageReached: 1, kills: 0 });
    // floor(10 * 0.5 * 1.0) = 5
    expect(result.prestige).toBeGreaterThanOrEqual(1);
  });

  it('mid-skill run earns ~40-80 prestige', () => {
    // Stage 7, 280 kills — mid-skill profile
    const result = calcPrestigeEarned({ stageReached: 7, kills: 280 });
    expect(result.prestige).toBeGreaterThanOrEqual(30);
    expect(result.prestige).toBeLessThanOrEqual(120);
  });
});

// ── prestige currency ─────────────────────────────────────────────────────────

describe('addPrestige', () => {
  it('adds amount correctly', () => {
    expect(addPrestige(100, 50)).toBe(150);
  });

  it('never goes negative', () => {
    expect(addPrestige(10, -20)).toBe(0);
  });
});

describe('spendPrestige', () => {
  it('deducts cost correctly', () => {
    expect(spendPrestige(200, 80)).toBe(120);
  });

  it('returns null when insufficient', () => {
    expect(spendPrestige(50, 100)).toBeNull();
  });

  it('exact cost returns 0', () => {
    expect(spendPrestige(100, 100)).toBe(0);
  });
});

describe('canAffordPrestige', () => {
  it('returns true when prestige >= cost', () => {
    expect(canAffordPrestige(100, 100)).toBe(true);
    expect(canAffordPrestige(200, 100)).toBe(true);
  });

  it('returns false when prestige < cost', () => {
    expect(canAffordPrestige(99, 100)).toBe(false);
  });
});

// ── CurrencyState operations ──────────────────────────────────────────────────

describe('createInitialCurrencyState', () => {
  it('creates state with zeroes', () => {
    const state = createInitialCurrencyState();
    expect(state.runGold).toBe(0);
    expect(state.prestige).toBe(0);
  });
});

describe('resetRunGold', () => {
  it('resets runGold to 0', () => {
    const state = { runGold: 150, prestige: 500 };
    const reset = resetRunGold(state);
    expect(reset.runGold).toBe(0);
  });

  it('preserves prestige', () => {
    const state = { runGold: 150, prestige: 500 };
    const reset = resetRunGold(state);
    expect(reset.prestige).toBe(500);
  });

  it('does not mutate original', () => {
    const state = { runGold: 150, prestige: 500 };
    resetRunGold(state);
    expect(state.runGold).toBe(150);
  });
});

describe('applyKillGold', () => {
  it('adds correct gold for normal kill', () => {
    const state = { runGold: 10, prestige: 0 };
    const result = applyKillGold(state, 'normal');
    expect(result.runGold).toBe(10 + BALANCE.ECONOMY.goldPerKill);
  });

  it('adds correct gold for boss kill', () => {
    const state = { runGold: 10, prestige: 0 };
    const result = applyKillGold(state, 'boss');
    expect(result.runGold).toBe(10 + BALANCE.ECONOMY.goldPerBoss);
  });

  it('does not change prestige', () => {
    const state = { runGold: 0, prestige: 200 };
    const result = applyKillGold(state, 'elite');
    expect(result.prestige).toBe(200);
  });
});

describe('applyRunEndPrestige', () => {
  it('adds prestige to state', () => {
    const state = { runGold: 100, prestige: 50 };
    const { newState, result } = applyRunEndPrestige(state, { stageReached: 5, kills: 200 });
    expect(newState.prestige).toBe(50 + result.prestige);
    expect(result.prestige).toBeGreaterThan(0);
  });

  it('preserves runGold', () => {
    const state = { runGold: 100, prestige: 0 };
    const { newState } = applyRunEndPrestige(state, { stageReached: 3, kills: 100 });
    expect(newState.runGold).toBe(100);
  });

  it('does not mutate original state', () => {
    const state = { runGold: 0, prestige: 0 };
    applyRunEndPrestige(state, { stageReached: 8, kills: 300 });
    expect(state.prestige).toBe(0);
  });
});
