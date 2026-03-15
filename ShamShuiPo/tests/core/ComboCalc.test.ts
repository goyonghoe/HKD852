import { describe, it, expect } from "vitest";
import {
  createComboState,
  createComboConfig,
  registerKill,
  tickCombo,
  calcMultiplier,
  getMultiplier,
  getComboTier,
  getTierForCount,
  calcScoreBonus,
  getComboScore,
  isComboActive,
  isInGracePeriod,
  isFrozen,
  getTimerPercent,
  getGracePercent,
  getTimeRemaining,
  getMaxCombo,
  freezeCombo,
  unfreezeCombo,
  breakCombo,
  resetCombo,
  addScore,
} from "../../src/core/ComboCalc";

// ── createComboState ──

describe("createComboState", () => {
  it("returns zero state", () => {
    const s = createComboState();
    expect(s.count).toBe(0);
    expect(s.maxCombo).toBe(0);
    expect(s.timer).toBe(0);
    expect(s.multiplier).toBe(1);
    expect(s.frozen).toBe(false);
  });
});

// ── createComboConfig ──

describe("createComboConfig", () => {
  it("returns defaults", () => {
    const c = createComboConfig();
    expect(c.comboWindow).toBe(3);
    expect(c.maxMultiplier).toBe(5);
  });

  it("accepts overrides", () => {
    const c = createComboConfig({ comboWindow: 5, maxMultiplier: 10 });
    expect(c.comboWindow).toBe(5);
    expect(c.maxMultiplier).toBe(10);
  });
});

// ── registerKill ──

describe("registerKill", () => {
  it("increments count", () => {
    const s = registerKill(createComboState(), 0);
    expect(s.count).toBe(1);
  });

  it("resets timer to comboWindow", () => {
    const c = createComboConfig({ comboWindow: 4 });
    const s = registerKill(createComboState(), 0, c);
    expect(s.timer).toBe(4);
  });

  it("updates multiplier", () => {
    const s = registerKill(createComboState(), 0);
    expect(s.multiplier).toBeCloseTo(1.1);
  });

  it("tracks maxCombo", () => {
    let s = createComboState();
    for (let i = 0; i < 5; i++) s = registerKill(s, i);
    expect(s.maxCombo).toBe(5);
  });

  it("updates lastKillTime", () => {
    const s = registerKill(createComboState(), 42);
    expect(s.lastKillTime).toBe(42);
  });

  it("clears grace period on kill", () => {
    let s = registerKill(createComboState(), 0);
    s = tickCombo(s, 10); // expire into grace
    expect(s.inGracePeriod).toBe(true);
    s = registerKill(s, 5);
    expect(s.inGracePeriod).toBe(false);
  });
});

// ── tickCombo ──

describe("tickCombo", () => {
  it("decrements timer", () => {
    let s = registerKill(createComboState(), 0);
    s = tickCombo(s, 1);
    expect(s.timer).toBeCloseTo(2);
  });

  it("no-op when no combo active", () => {
    const s = tickCombo(createComboState(), 1);
    expect(s.count).toBe(0);
  });

  it("enters grace period when timer expires", () => {
    let s = registerKill(createComboState(), 0);
    s = tickCombo(s, 4); // timer was 3, exceeds
    expect(s.inGracePeriod).toBe(true);
    expect(s.timer).toBe(0);
  });

  it("breaks combo when grace expires", () => {
    let s = registerKill(createComboState(), 0);
    s = tickCombo(s, 4); // enter grace
    s = tickCombo(s, 2); // grace expires (1s default)
    expect(s.count).toBe(0);
  });

  it("does not decay when frozen", () => {
    let s = registerKill(createComboState(), 0);
    s = freezeCombo(s, 5);
    const timerBefore = s.timer;
    s = tickCombo(s, 1);
    expect(s.timer).toBe(timerBefore); // unchanged
    expect(s.freezeTimer).toBeCloseTo(4);
  });

  it("unfreezes when freeze timer runs out", () => {
    let s = registerKill(createComboState(), 0);
    s = freezeCombo(s, 1);
    s = tickCombo(s, 2);
    expect(s.frozen).toBe(false);
  });
});

// ── calcMultiplier ──

describe("calcMultiplier", () => {
  it("returns base for count 0", () => {
    expect(calcMultiplier(0)).toBe(1);
  });

  it("scales with count", () => {
    expect(calcMultiplier(10)).toBeCloseTo(2);
  });

  it("caps at maxMultiplier", () => {
    expect(calcMultiplier(1000)).toBe(5);
  });
});

// ── getMultiplier ──

describe("getMultiplier", () => {
  it("returns state multiplier", () => {
    const s = registerKill(createComboState(), 0);
    expect(getMultiplier(s)).toBeCloseTo(1.1);
  });
});

// ── Tiers ──

describe("combo tiers", () => {
  it("none for < 5", () => {
    expect(getTierForCount(0)).toBe("none");
    expect(getTierForCount(4)).toBe("none");
  });

  it("bronze for 5+", () => {
    expect(getTierForCount(5)).toBe("bronze");
  });

  it("silver for 10+", () => {
    expect(getTierForCount(10)).toBe("silver");
  });

  it("gold for 25+", () => {
    expect(getTierForCount(25)).toBe("gold");
  });

  it("platinum for 50+", () => {
    expect(getTierForCount(50)).toBe("platinum");
  });

  it("diamond for 100+", () => {
    expect(getTierForCount(100)).toBe("diamond");
  });

  it("getComboTier uses state count", () => {
    let s = createComboState();
    for (let i = 0; i < 10; i++) s = registerKill(s, i);
    expect(getComboTier(s)).toBe("silver");
  });
});

// ── Score ──

describe("score", () => {
  it("calcScoreBonus multiplies base by multiplier", () => {
    let s = createComboState();
    for (let i = 0; i < 10; i++) s = registerKill(s, i);
    const bonus = calcScoreBonus(s, 100);
    expect(bonus).toBeCloseTo(200);
  });

  it("getComboScore returns count * multiplier", () => {
    let s = createComboState();
    for (let i = 0; i < 5; i++) s = registerKill(s, i);
    expect(getComboScore(s)).toBeCloseTo(5 * 1.5);
  });

  it("addScore accumulates", () => {
    let s = createComboState();
    s = addScore(s, 100);
    s = addScore(s, 50);
    expect(s.totalScore).toBe(150);
  });
});

// ── Queries ──

describe("queries", () => {
  it("isComboActive", () => {
    expect(isComboActive(createComboState())).toBe(false);
    const s = registerKill(createComboState(), 0);
    expect(isComboActive(s)).toBe(true);
  });

  it("isInGracePeriod", () => {
    let s = registerKill(createComboState(), 0);
    expect(isInGracePeriod(s)).toBe(false);
    s = tickCombo(s, 4);
    expect(isInGracePeriod(s)).toBe(true);
  });

  it("isFrozen", () => {
    let s = registerKill(createComboState(), 0);
    expect(isFrozen(s)).toBe(false);
    s = freezeCombo(s, 5);
    expect(isFrozen(s)).toBe(true);
  });

  it("getTimerPercent", () => {
    let s = registerKill(createComboState(), 0);
    expect(getTimerPercent(s)).toBe(100);
    s = tickCombo(s, 1.5);
    expect(getTimerPercent(s)).toBeCloseTo(50);
  });

  it("getGracePercent", () => {
    let s = registerKill(createComboState(), 0);
    expect(getGracePercent(s)).toBe(0);
    s = tickCombo(s, 4);
    expect(getGracePercent(s)).toBeGreaterThan(0);
  });

  it("getTimeRemaining", () => {
    let s = registerKill(createComboState(), 0);
    s = tickCombo(s, 1);
    expect(getTimeRemaining(s)).toBeCloseTo(2);
  });

  it("getMaxCombo", () => {
    let s = createComboState();
    for (let i = 0; i < 7; i++) s = registerKill(s, i);
    expect(getMaxCombo(s)).toBe(7);
  });
});

// ── Freeze ──

describe("freeze", () => {
  it("freezeCombo sets frozen state", () => {
    let s = registerKill(createComboState(), 0);
    s = freezeCombo(s, 3);
    expect(s.frozen).toBe(true);
    expect(s.freezeTimer).toBe(3);
  });

  it("freezeCombo no-op when no combo", () => {
    const s = freezeCombo(createComboState(), 5);
    expect(s.frozen).toBe(false);
  });

  it("unfreezeCombo clears freeze", () => {
    let s = registerKill(createComboState(), 0);
    s = freezeCombo(s, 3);
    s = unfreezeCombo(s);
    expect(s.frozen).toBe(false);
    expect(s.freezeTimer).toBe(0);
  });
});

// ── breakCombo / resetCombo ──

describe("break and reset", () => {
  it("breakCombo preserves maxCombo", () => {
    let s = createComboState();
    for (let i = 0; i < 5; i++) s = registerKill(s, i);
    s = breakCombo(s);
    expect(s.count).toBe(0);
    expect(s.maxCombo).toBe(5);
  });

  it("resetCombo clears everything", () => {
    let s = createComboState();
    for (let i = 0; i < 5; i++) s = registerKill(s, i);
    s = resetCombo();
    expect(s.count).toBe(0);
    expect(s.maxCombo).toBe(0);
  });
});

// ── Immutability ──

describe("immutability", () => {
  it("registerKill does not mutate input", () => {
    const s = createComboState();
    registerKill(s, 0);
    expect(s.count).toBe(0);
  });

  it("tickCombo does not mutate input", () => {
    const s = registerKill(createComboState(), 0);
    tickCombo(s, 1);
    expect(s.timer).toBe(3);
  });
});
