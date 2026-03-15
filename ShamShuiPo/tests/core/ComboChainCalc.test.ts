import { describe, it, expect } from "vitest";
import {
  createComboChain,
  registerHit,
  tick,
  getMultiplier,
  getGrade,
  getTimerPercent,
  breakChain,
  getScoreBonus,
  isChainActive,
  extendWindow,
  getChainMilestone,
  resetStats,
  type ComboChainState,
} from "../../src/core/ComboChainCalc";

// ─── Helper ──────────────────────────────────────────────────

function buildChain(n: number, windowMs?: number): ComboChainState {
  let s = createComboChain(windowMs);
  for (let i = 0; i < n; i++) s = registerHit(s);
  return s;
}

// ─── createComboChain ────────────────────────────────────────

describe("createComboChain", () => {
  it("creates default state with 2000ms window", () => {
    const s = createComboChain();
    expect(s.windowMs).toBe(2000);
    expect(s.currentChain).toBe(0);
    expect(s.maxChain).toBe(0);
    expect(s.timer).toBe(0);
    expect(s.multiplier).toBe(1.0);
    expect(s.grade).toBe("none");
    expect(s.totalChains).toBe(0);
    expect(s.longestChain).toBe(0);
  });

  it("accepts custom window", () => {
    const s = createComboChain(3000);
    expect(s.windowMs).toBe(3000);
  });

  it("returns immutable state (spread does not mutate)", () => {
    const s = createComboChain();
    const s2 = registerHit(s);
    expect(s.currentChain).toBe(0);
    expect(s2.currentChain).toBe(1);
  });
});

// ─── registerHit ─────────────────────────────────────────────

describe("registerHit", () => {
  it("increments chain by 1", () => {
    const s = registerHit(createComboChain());
    expect(s.currentChain).toBe(1);
  });

  it("resets timer to windowMs", () => {
    const s = registerHit(createComboChain(1500));
    expect(s.timer).toBe(1500);
  });

  it("tracks maxChain correctly", () => {
    let s = buildChain(5);
    expect(s.maxChain).toBe(5);
    s = breakChain(s);
    s = registerHit(s);
    expect(s.maxChain).toBe(5);
    expect(s.currentChain).toBe(1);
  });

  it("updates multiplier on each hit", () => {
    const s = buildChain(5);
    expect(s.multiplier).toBe(1.2);
  });

  it("updates grade on each hit", () => {
    const s = buildChain(5);
    expect(s.grade).toBe("nice");
  });

  it("updates longestChain as chain grows", () => {
    const s = buildChain(10);
    expect(s.longestChain).toBe(10);
  });
});

// ─── tick ────────────────────────────────────────────────────

describe("tick", () => {
  it("decrements timer by dt", () => {
    const s = registerHit(createComboChain(2000));
    const s2 = tick(s, 500);
    expect(s2.timer).toBe(1500);
  });

  it("does nothing when chain is 0", () => {
    const s = createComboChain();
    const s2 = tick(s, 500);
    expect(s2).toBe(s);
  });

  it("breaks chain when timer reaches 0", () => {
    const s = registerHit(createComboChain(1000));
    const s2 = tick(s, 1000);
    expect(s2.currentChain).toBe(0);
    expect(s2.timer).toBe(0);
  });

  it("breaks chain when dt exceeds remaining timer", () => {
    const s = registerHit(createComboChain(500));
    const s2 = tick(s, 999);
    expect(s2.currentChain).toBe(0);
  });

  it("timer never goes below 0", () => {
    const s = registerHit(createComboChain(100));
    const s2 = tick(s, 5000);
    expect(s2.timer).toBe(0);
  });

  it("increments totalChains when chain breaks via timeout", () => {
    const s = buildChain(3);
    const s2 = tick(s, 3000);
    expect(s2.totalChains).toBe(1);
  });
});

// ─── getMultiplier ───────────────────────────────────────────

describe("getMultiplier", () => {
  it("returns 1.0x for chain 0-4", () => {
    expect(getMultiplier(buildChain(0))).toBe(1.0);
    expect(getMultiplier(buildChain(1))).toBe(1.0);
    expect(getMultiplier(buildChain(4))).toBe(1.0);
  });

  it("returns 1.2x for chain 5-9", () => {
    expect(getMultiplier(buildChain(5))).toBe(1.2);
    expect(getMultiplier(buildChain(9))).toBe(1.2);
  });

  it("returns 1.5x for chain 10-19", () => {
    expect(getMultiplier(buildChain(10))).toBe(1.5);
    expect(getMultiplier(buildChain(19))).toBe(1.5);
  });

  it("returns 2.0x for chain 20-49", () => {
    expect(getMultiplier(buildChain(20))).toBe(2.0);
    expect(getMultiplier(buildChain(49))).toBe(2.0);
  });

  it("returns 3.0x for chain 50-99", () => {
    expect(getMultiplier(buildChain(50))).toBe(3.0);
    expect(getMultiplier(buildChain(99))).toBe(3.0);
  });

  it("returns 5.0x for chain 100+", () => {
    expect(getMultiplier(buildChain(100))).toBe(5.0);
    expect(getMultiplier(buildChain(200))).toBe(5.0);
  });
});

// ─── getGrade ────────────────────────────────────────────────

describe("getGrade", () => {
  it("returns none for chain 0-4", () => {
    expect(getGrade(buildChain(0))).toBe("none");
    expect(getGrade(buildChain(4))).toBe("none");
  });

  it("returns nice for chain 5-14", () => {
    expect(getGrade(buildChain(5))).toBe("nice");
    expect(getGrade(buildChain(14))).toBe("nice");
  });

  it("returns great for chain 15-29", () => {
    expect(getGrade(buildChain(15))).toBe("great");
    expect(getGrade(buildChain(29))).toBe("great");
  });

  it("returns excellent for chain 30-74", () => {
    expect(getGrade(buildChain(30))).toBe("excellent");
    expect(getGrade(buildChain(74))).toBe("excellent");
  });

  it("returns legendary for chain 75-149", () => {
    expect(getGrade(buildChain(75))).toBe("legendary");
    expect(getGrade(buildChain(149))).toBe("legendary");
  });

  it("returns godlike for chain 150+", () => {
    expect(getGrade(buildChain(150))).toBe("godlike");
    expect(getGrade(buildChain(300))).toBe("godlike");
  });
});

// ─── getTimerPercent ─────────────────────────────────────────

describe("getTimerPercent", () => {
  it("returns 1.0 immediately after hit", () => {
    const s = registerHit(createComboChain(2000));
    expect(getTimerPercent(s)).toBe(1.0);
  });

  it("returns 0.5 at half timer", () => {
    const s = tick(registerHit(createComboChain(2000)), 1000);
    expect(getTimerPercent(s)).toBe(0.5);
  });

  it("returns 0 for no chain", () => {
    expect(getTimerPercent(createComboChain())).toBe(0);
  });

  it("clamps between 0 and 1", () => {
    const s = registerHit(createComboChain(1000));
    expect(getTimerPercent(s)).toBeLessThanOrEqual(1);
    expect(getTimerPercent(s)).toBeGreaterThanOrEqual(0);
  });

  it("returns 0 for zero windowMs", () => {
    expect(getTimerPercent(createComboChain(0))).toBe(0);
  });
});

// ─── breakChain ──────────────────────────────────────────────

describe("breakChain", () => {
  it("resets chain to 0", () => {
    const s = breakChain(buildChain(10));
    expect(s.currentChain).toBe(0);
  });

  it("resets timer to 0", () => {
    const s = breakChain(buildChain(5));
    expect(s.timer).toBe(0);
  });

  it("resets multiplier to 1.0", () => {
    const s = breakChain(buildChain(50));
    expect(s.multiplier).toBe(1.0);
  });

  it("resets grade to none", () => {
    const s = breakChain(buildChain(30));
    expect(s.grade).toBe("none");
  });

  it("records longestChain", () => {
    let s = buildChain(20);
    s = breakChain(s);
    expect(s.longestChain).toBe(20);
    s = buildChain(5);
    s = breakChain(s);
    expect(s.longestChain).toBe(5);
  });

  it("increments totalChains when chain > 0", () => {
    let s = buildChain(3);
    s = breakChain(s);
    expect(s.totalChains).toBe(1);
    s = registerHit(s);
    s = breakChain(s);
    expect(s.totalChains).toBe(2);
  });

  it("does not increment totalChains when chain is 0", () => {
    const s = breakChain(createComboChain());
    expect(s.totalChains).toBe(0);
  });

  it("preserves maxChain after break", () => {
    let s = buildChain(15);
    s = breakChain(s);
    expect(s.maxChain).toBe(15);
  });
});

// ─── getScoreBonus ───────────────────────────────────────────

describe("getScoreBonus", () => {
  it("returns baseScore at 1.0x multiplier", () => {
    const s = buildChain(2);
    expect(getScoreBonus(s, 100)).toBe(100);
  });

  it("returns baseScore * 1.2 at 5 chain", () => {
    const s = buildChain(5);
    expect(getScoreBonus(s, 100)).toBeCloseTo(120);
  });

  it("returns baseScore * 5.0 at 100+ chain", () => {
    const s = buildChain(100);
    expect(getScoreBonus(s, 200)).toBeCloseTo(1000);
  });

  it("returns 0 for 0 baseScore", () => {
    const s = buildChain(50);
    expect(getScoreBonus(s, 0)).toBe(0);
  });
});

// ─── isChainActive ───────────────────────────────────────────

describe("isChainActive", () => {
  it("returns false for fresh state", () => {
    expect(isChainActive(createComboChain())).toBe(false);
  });

  it("returns true after hit", () => {
    expect(isChainActive(registerHit(createComboChain()))).toBe(true);
  });

  it("returns false after chain breaks", () => {
    const s = breakChain(buildChain(5));
    expect(isChainActive(s)).toBe(false);
  });

  it("returns false when timer is 0 but chain > 0 (edge)", () => {
    // Manually construct edge case
    const s: ComboChainState = {
      ...buildChain(3),
      timer: 0,
    };
    expect(isChainActive(s)).toBe(false);
  });
});

// ─── extendWindow ────────────────────────────────────────────

describe("extendWindow", () => {
  it("increases windowMs", () => {
    const s = extendWindow(createComboChain(2000), 500);
    expect(s.windowMs).toBe(2500);
  });

  it("also extends current timer", () => {
    let s = registerHit(createComboChain(2000));
    s = extendWindow(s, 500);
    expect(s.windowMs).toBe(2500);
    expect(s.timer).toBe(2500);
  });

  it("timer does not exceed new windowMs", () => {
    let s = registerHit(createComboChain(2000));
    s = tick(s, 500); // timer = 1500
    s = extendWindow(s, 300); // windowMs = 2300, timer = min(1800, 2300) = 1800
    expect(s.timer).toBe(1800);
    expect(s.windowMs).toBe(2300);
  });
});

// ─── getChainMilestone ───────────────────────────────────────

describe("getChainMilestone", () => {
  it("returns null for chain 0", () => {
    expect(getChainMilestone(buildChain(0))).toBeNull();
  });

  it("returns null for chain < 10", () => {
    expect(getChainMilestone(buildChain(9))).toBeNull();
  });

  it("returns 10 at chain 10", () => {
    expect(getChainMilestone(buildChain(10))).toBe(10);
  });

  it("returns 10 at chain 24", () => {
    expect(getChainMilestone(buildChain(24))).toBe(10);
  });

  it("returns 25 at chain 25", () => {
    expect(getChainMilestone(buildChain(25))).toBe(25);
  });

  it("returns 50 at chain 50", () => {
    expect(getChainMilestone(buildChain(50))).toBe(50);
  });

  it("returns 100 at chain 100", () => {
    expect(getChainMilestone(buildChain(100))).toBe(100);
  });

  it("returns 250 at chain 250", () => {
    expect(getChainMilestone(buildChain(250))).toBe(250);
  });

  it("returns 500 at chain 500+", () => {
    expect(getChainMilestone(buildChain(500))).toBe(500);
    expect(getChainMilestone(buildChain(999))).toBe(500);
  });
});

// ─── resetStats ──────────────────────────────────────────────

describe("resetStats", () => {
  it("resets totalChains to 0", () => {
    let s = buildChain(5);
    s = breakChain(s);
    s = resetStats(s);
    expect(s.totalChains).toBe(0);
  });

  it("resets longestChain to 0", () => {
    let s = buildChain(20);
    s = breakChain(s);
    s = resetStats(s);
    expect(s.longestChain).toBe(0);
  });

  it("preserves current chain and other state", () => {
    let s = buildChain(10);
    s = resetStats(s);
    expect(s.currentChain).toBe(10);
    expect(s.maxChain).toBe(10);
    expect(s.windowMs).toBe(2000);
  });
});

// ─── Integration / Edge Cases ────────────────────────────────

describe("integration", () => {
  it("full lifecycle: build → break → rebuild → stats", () => {
    let s = createComboChain(1000);

    // Build chain to 10
    for (let i = 0; i < 10; i++) s = registerHit(s);
    expect(s.currentChain).toBe(10);
    expect(s.multiplier).toBe(1.5);
    expect(s.grade).toBe("nice");

    // Break
    s = breakChain(s);
    expect(s.totalChains).toBe(1);
    expect(s.longestChain).toBe(10);
    expect(s.multiplier).toBe(1.0);

    // Rebuild to 20
    for (let i = 0; i < 20; i++) s = registerHit(s);
    expect(s.currentChain).toBe(20);
    expect(s.longestChain).toBe(20);
    expect(s.multiplier).toBe(2.0);
    expect(s.grade).toBe("great");

    // Break via timeout
    s = tick(s, 2000);
    expect(s.totalChains).toBe(2);
    expect(s.longestChain).toBe(20);
  });

  it("hit refreshes timer before it expires", () => {
    let s = registerHit(createComboChain(1000));
    s = tick(s, 800); // 200ms left
    expect(isChainActive(s)).toBe(true);
    s = registerHit(s); // refresh
    expect(s.timer).toBe(1000);
    expect(s.currentChain).toBe(2);
  });

  it("multiplier stored in state matches getMultiplier", () => {
    const s = buildChain(25);
    expect(s.multiplier).toBe(getMultiplier(s));
  });

  it("grade stored in state matches getGrade", () => {
    const s = buildChain(80);
    expect(s.grade).toBe(getGrade(s));
  });
});
