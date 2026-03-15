// ── Tests: DifficultyScalingCalc ──

import { describe, it, expect } from "vitest";
import {
  getDifficultyForLoop,
  getEffectiveWaveConfig,
  getDifficultyLabel,
  getEnemyScaling,
  type ScaledDifficulty,
} from "../../src/core/DifficultyScalingCalc";
import { DIFFICULTY, WAVE_TIMELINE } from "../../src/config/balance";

// ════════════════════════════════════════════════════════════════
// § getDifficultyForLoop
// ════════════════════════════════════════════════════════════════

describe("getDifficultyForLoop", () => {
  it("loop 0 returns base multipliers (all 1.0)", () => {
    const d = getDifficultyForLoop(0);
    expect(d.hpMultiplier).toBe(1.0);
    expect(d.damageMultiplier).toBe(1.0);
    expect(d.speedMultiplier).toBe(1.0);
    expect(d.coinMultiplier).toBe(1.0);
    expect(d.spawnRateMultiplier).toBe(1.0);
  });

  it("loop 1 doubles HP, 1.5x damage, 1.1x speed, 1.5x coins", () => {
    const d = getDifficultyForLoop(1);
    expect(d.hpMultiplier).toBe(2.0);
    expect(d.damageMultiplier).toBe(1.5);
    expect(d.speedMultiplier).toBeCloseTo(1.1);
    expect(d.coinMultiplier).toBe(1.5);
  });

  it("loop 2 scales exponentially", () => {
    const d = getDifficultyForLoop(2);
    expect(d.hpMultiplier).toBe(4.0); // 2^2
    expect(d.damageMultiplier).toBe(2.25); // 1.5^2
    expect(d.speedMultiplier).toBeCloseTo(1.21); // 1.1^2
    expect(d.coinMultiplier).toBe(2.25); // 1.5^2
  });

  it("loop capped at maxLoops (5)", () => {
    const d5 = getDifficultyForLoop(5);
    const d10 = getDifficultyForLoop(10);
    expect(d5.hpMultiplier).toBe(d10.hpMultiplier);
    expect(d5.damageMultiplier).toBe(d10.damageMultiplier);
    expect(d5.speedMultiplier).toBe(d10.speedMultiplier);
    expect(d5.coinMultiplier).toBe(d10.coinMultiplier);
    expect(d5.spawnRateMultiplier).toBe(d10.spawnRateMultiplier);
  });

  it("spawn rate scales with loop (20% per loop)", () => {
    expect(getDifficultyForLoop(0).spawnRateMultiplier).toBe(1.0);
    expect(getDifficultyForLoop(1).spawnRateMultiplier).toBe(1.2);
    expect(getDifficultyForLoop(2).spawnRateMultiplier).toBe(1.4);
    expect(getDifficultyForLoop(3).spawnRateMultiplier).toBe(1.6);
    expect(getDifficultyForLoop(5).spawnRateMultiplier).toBe(2.0);
  });

  it("negative loop treated as 0", () => {
    const d = getDifficultyForLoop(-1);
    expect(d.hpMultiplier).toBe(1.0);
    expect(d.spawnRateMultiplier).toBe(1.0);
  });
});

// ════════════════════════════════════════════════════════════════
// § getEffectiveWaveConfig
// ════════════════════════════════════════════════════════════════

describe("getEffectiveWaveConfig", () => {
  it("minute 0 returns first entry", () => {
    const cfg = getEffectiveWaveConfig(0, 0);
    expect(cfg.minute).toBe(0);
    expect(cfg.enemyPool).toContain("drone");
    expect(cfg.hpMultiplier).toBe(1.0);
  });

  it("minute 10 returns last entry", () => {
    const lastIdx = WAVE_TIMELINE.length - 1;
    const cfg = getEffectiveWaveConfig(10, 0);
    expect(cfg.minute).toBe(WAVE_TIMELINE[lastIdx].minute);
  });

  it("out-of-range minute clamps to last entry", () => {
    const cfg20 = getEffectiveWaveConfig(20, 0);
    const cfgLast = getEffectiveWaveConfig(WAVE_TIMELINE.length - 1, 0);
    expect(cfg20.minute).toBe(cfgLast.minute);
    expect(cfg20.hpMultiplier).toBe(cfgLast.hpMultiplier);
    expect(cfg20.enemyPool).toEqual(cfgLast.enemyPool);
  });

  it("negative minute clamps to first entry", () => {
    const cfg = getEffectiveWaveConfig(-5, 0);
    expect(cfg.minute).toBe(0);
  });

  it("loop 0 preserves wave multipliers unchanged", () => {
    const wave = WAVE_TIMELINE[5]; // minute 5
    const cfg = getEffectiveWaveConfig(5, 0);
    expect(cfg.hpMultiplier).toBe(wave.hpMultiplier);
    expect(cfg.damageMultiplier).toBe(wave.damageMultiplier);
    expect(cfg.speedMultiplier).toBe(wave.speedMultiplier);
  });

  it("loop 1 multiplies wave scaling by loop scaling", () => {
    const wave = WAVE_TIMELINE[3]; // minute 3
    const cfg = getEffectiveWaveConfig(3, 1);
    expect(cfg.hpMultiplier).toBeCloseTo(wave.hpMultiplier * 2.0);
    expect(cfg.damageMultiplier).toBeCloseTo(wave.damageMultiplier * 1.5);
    expect(cfg.speedMultiplier).toBeCloseTo(wave.speedMultiplier * 1.1);
  });

  it("loop 0 minute 5 should have mini_boss spawn", () => {
    const cfg = getEffectiveWaveConfig(5, 0);
    expect(cfg.bossSpawn).toBe("mini_boss");
  });

  it("preserves event string from wave config", () => {
    const cfg = getEffectiveWaveConfig(0, 0);
    expect(cfg.event).toBe(WAVE_TIMELINE[0].event);
  });
});

// ════════════════════════════════════════════════════════════════
// § getDifficultyLabel
// ════════════════════════════════════════════════════════════════

describe("getDifficultyLabel", () => {
  it("returns correct labels for each loop", () => {
    expect(getDifficultyLabel(0)).toBe("NORMAL");
    expect(getDifficultyLabel(1)).toBe("HARD");
    expect(getDifficultyLabel(2)).toBe("VERY HARD");
    expect(getDifficultyLabel(3)).toBe("NIGHTMARE");
    expect(getDifficultyLabel(4)).toBe("HELL");
  });

  it("loop 5+ returns IMPOSSIBLE", () => {
    expect(getDifficultyLabel(5)).toBe("IMPOSSIBLE");
    expect(getDifficultyLabel(10)).toBe("IMPOSSIBLE");
    expect(getDifficultyLabel(999)).toBe("IMPOSSIBLE");
  });

  it("negative loop returns NORMAL", () => {
    expect(getDifficultyLabel(-1)).toBe("NORMAL");
  });
});

// ════════════════════════════════════════════════════════════════
// § getEnemyScaling
// ════════════════════════════════════════════════════════════════

describe("getEnemyScaling", () => {
  it("loop 0 minute 0 returns wave base multipliers", () => {
    const s = getEnemyScaling(0, 0);
    expect(s.hp).toBe(1.0);
    expect(s.damage).toBe(1.0);
    expect(s.speed).toBe(1.0);
  });

  it("combined scaling: wave * loop (minute 5, loop 1)", () => {
    const wave = WAVE_TIMELINE[5]; // minute 5
    const s = getEnemyScaling(5, 1);
    expect(s.hp).toBeCloseTo(wave.hpMultiplier * 2.0);
    expect(s.damage).toBeCloseTo(wave.damageMultiplier * 1.5);
    expect(s.speed).toBeCloseTo(wave.speedMultiplier * 1.1);
  });

  it("late-game high loop produces large multipliers", () => {
    const s = getEnemyScaling(10, 5);
    const wave = WAVE_TIMELINE[WAVE_TIMELINE.length - 1];
    const loopHp = DIFFICULTY.loopHpMultiplier ** 5; // 32
    expect(s.hp).toBeCloseTo(wave.hpMultiplier * loopHp);
    expect(s.hp).toBeGreaterThan(100); // 3.5 * 32 = 112
  });

  it("minute 7 loop 0 has expected wave multipliers", () => {
    const wave = WAVE_TIMELINE[7]; // minute 7
    const s = getEnemyScaling(7, 0);
    expect(s.hp).toBe(wave.hpMultiplier);
    expect(s.damage).toBe(wave.damageMultiplier);
    expect(s.speed).toBe(wave.speedMultiplier);
  });
});
