import { describe, it, expect } from "vitest";
import {
  calculateFinalScore,
  getScoreGrade,
  createComboState,
  registerKill,
  tickCombo,
} from "../../src/core/ScoreCalc";

// ─── calculateFinalScore ──────────────────────────────────────

describe("calculateFinalScore", () => {
  it("zero kills yields 0 base kill score", () => {
    const result = calculateFinalScore(0, 0, 0, 0, 0, 0);
    expect(result.baseKillScore).toBe(0);
  });

  it("zero everything yields grade F", () => {
    const result = calculateFinalScore(0, 0, 0, 0, 0, 0);
    expect(result.totalScore).toBe(0);
    expect(result.grade).toBe("F");
  });

  it("1 kill with no other stats yields grade D", () => {
    const result = calculateFinalScore(1, 0, 0, 0, 0, 0);
    expect(result.baseKillScore).toBe(10);
    expect(result.totalScore).toBe(10);
    expect(result.grade).toBe("D");
  });

  it("100 kills = 1000 base kill score", () => {
    const result = calculateFinalScore(100, 0, 0, 0, 0, 0);
    expect(result.baseKillScore).toBe(1000);
  });

  it("boss bonus adds 500 per boss", () => {
    const result = calculateFinalScore(0, 3, 0, 0, 0, 0);
    expect(result.bossBonus).toBe(1500);
  });

  it("survival bonus scales linearly with elapsed time", () => {
    // 300s = half of 600s cap → 500
    const result = calculateFinalScore(0, 0, 300, 0, 0, 0);
    expect(result.survivalBonus).toBe(500);
  });

  it("full 10min survival = 1000 bonus", () => {
    const result = calculateFinalScore(0, 0, 600, 0, 0, 0);
    expect(result.survivalBonus).toBe(1000);
  });

  it("survival bonus caps at 1000 even beyond 10min", () => {
    const result = calculateFinalScore(0, 0, 900, 0, 0, 0);
    expect(result.survivalBonus).toBe(1000);
  });

  it("level bonus = level * 50", () => {
    const result = calculateFinalScore(0, 0, 0, 10, 0, 0);
    expect(result.levelBonus).toBe(500);
  });

  it("coin bonus = floor(coins * 0.5)", () => {
    const result = calculateFinalScore(0, 0, 0, 0, 101, 0);
    expect(result.coinBonus).toBe(50); // floor(50.5)
  });

  it("combo multiplier caps at 2.0", () => {
    const result = calculateFinalScore(100, 0, 0, 0, 0, 200);
    expect(result.comboMultiplier).toBe(2.0);
    // baseKillScore=1000, multiplier=2.0 → 2000
    expect(result.totalScore).toBe(2000);
  });

  it("combo multiplier applies 1% per combo kill", () => {
    const result = calculateFinalScore(100, 0, 0, 0, 0, 50);
    expect(result.comboMultiplier).toBe(1.5);
    expect(result.totalScore).toBe(1500);
  });

  it("score breakdown totals correctly", () => {
    // kills=50 (500), bosses=2 (1000), elapsed=300 (500),
    // level=5 (250), coins=100 (50), maxCombo=10 (1.10)
    const result = calculateFinalScore(50, 2, 300, 5, 100, 10);
    expect(result.baseKillScore).toBe(500);
    expect(result.bossBonus).toBe(1000);
    expect(result.survivalBonus).toBe(500);
    expect(result.levelBonus).toBe(250);
    expect(result.coinBonus).toBe(50);
    expect(result.comboMultiplier).toBeCloseTo(1.1);
    const subtotal = 500 + 1000 + 500 + 250 + 50; // 2300
    expect(result.totalScore).toBe(Math.floor(subtotal * 1.1)); // 2530
  });
});

// ─── getScoreGrade ────────────────────────────────────────────

describe("getScoreGrade", () => {
  it("returns S for score > 10000", () => {
    expect(getScoreGrade(10001)).toBe("S");
    expect(getScoreGrade(99999)).toBe("S");
  });

  it("returns A for score 5001-10000", () => {
    expect(getScoreGrade(5001)).toBe("A");
    expect(getScoreGrade(10000)).toBe("A");
  });

  it("returns B for score 2501-5000", () => {
    expect(getScoreGrade(2501)).toBe("B");
    expect(getScoreGrade(5000)).toBe("B");
  });

  it("returns C for score 1001-2500", () => {
    expect(getScoreGrade(1001)).toBe("C");
    expect(getScoreGrade(2500)).toBe("C");
  });

  it("returns D for score 1-1000", () => {
    expect(getScoreGrade(1)).toBe("D");
    expect(getScoreGrade(1000)).toBe("D");
  });

  it("returns F for score 0", () => {
    expect(getScoreGrade(0)).toBe("F");
  });
});

// ─── Combo State ──────────────────────────────────────────────

describe("createComboState", () => {
  it("initializes with zeroes", () => {
    const state = createComboState();
    expect(state.current).toBe(0);
    expect(state.max).toBe(0);
    expect(state.timer).toBe(0);
  });
});

describe("registerKill", () => {
  it("increments current combo and resets timer", () => {
    const state = createComboState();
    const next = registerKill(state);
    expect(next.current).toBe(1);
    expect(next.max).toBe(1);
    expect(next.timer).toBe(2.0);
  });

  it("tracks max across multiple kills", () => {
    let state = createComboState();
    state = registerKill(state);
    state = registerKill(state);
    state = registerKill(state);
    expect(state.current).toBe(3);
    expect(state.max).toBe(3);
  });

  it("max persists after combo reset and new kills", () => {
    let state = createComboState();
    state = registerKill(state);
    state = registerKill(state);
    state = registerKill(state); // max=3
    // Simulate timer expiry
    state = tickCombo(state, 3.0); // current resets to 0
    expect(state.current).toBe(0);
    expect(state.max).toBe(3);
    // New kill
    state = registerKill(state);
    expect(state.current).toBe(1);
    expect(state.max).toBe(3); // max preserved
  });
});

describe("tickCombo", () => {
  it("reduces timer by dt", () => {
    let state = registerKill(createComboState()); // timer=2.0
    state = tickCombo(state, 0.5);
    expect(state.timer).toBeCloseTo(1.5);
    expect(state.current).toBe(1);
  });

  it("resets current to 0 when timer expires", () => {
    let state = registerKill(createComboState()); // timer=2.0
    state = tickCombo(state, 2.5);
    expect(state.current).toBe(0);
    expect(state.timer).toBe(0);
    expect(state.max).toBe(1); // max preserved
  });

  it("does nothing when current is already 0", () => {
    const state = createComboState();
    const next = tickCombo(state, 1.0);
    expect(next).toBe(state); // same reference
  });

  it("multiple kills extend the timer window", () => {
    let state = createComboState();
    state = registerKill(state); // timer=2.0
    state = tickCombo(state, 1.5); // timer=0.5
    state = registerKill(state); // timer resets to 2.0, current=2
    expect(state.current).toBe(2);
    expect(state.timer).toBe(2.0);
    state = tickCombo(state, 1.0); // timer=1.0, still alive
    expect(state.current).toBe(2);
  });
});
