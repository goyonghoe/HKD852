import { describe, it, expect } from "vitest";
import {
  createWaveSchedule,
  generateWave,
  tick,
  getCurrentWave,
  getWaveProgress,
  getTimeRemaining,
  isWaveActive,
  isBossWave,
  skipBreak,
  getEnemyComposition,
  getTotalEnemies,
  getDifficultyRamp,
  estimateWaveDuration,
  type WaveConfig,
  type WaveScheduleState,
  type WaveEntry,
} from "../../src/core/WaveScheduleCalc";

// ── helpers ────────────────────────────────────────────────────

/** Tick state forward by a large delta to complete the current wave. */
function completeCurrentWave(state: WaveScheduleState): WaveScheduleState {
  const wave = getCurrentWave(state);
  if (!wave) return state;
  const result = tick(state, wave.duration + 1);
  return result.state;
}

/** Tick state forward through a break. */
function completeBreak(state: WaveScheduleState): WaveScheduleState {
  const wave = getCurrentWave(state);
  if (!wave) return state;
  const result = tick(state, wave.breakDuration + 1);
  return result.state;
}

// ── createWaveSchedule ─────────────────────────────────────────

describe("createWaveSchedule", () => {
  it("creates 10 waves by default", () => {
    const s = createWaveSchedule();
    expect(s.waves).toHaveLength(10);
  });

  it("respects custom totalWaves", () => {
    const s = createWaveSchedule(5);
    expect(s.waves).toHaveLength(5);
  });

  it("initializes at wave 0 with zeroed timers", () => {
    const s = createWaveSchedule();
    expect(s.currentWave).toBe(0);
    expect(s.waveTimer).toBe(0);
    expect(s.breakTimer).toBe(0);
    expect(s.isInBreak).toBe(false);
    expect(s.isComplete).toBe(false);
    expect(s.totalEnemiesSpawned).toBe(0);
  });

  it("creates a schedule with 1 wave", () => {
    const s = createWaveSchedule(1);
    expect(s.waves).toHaveLength(1);
  });

  it("wave numbers are sequential 1..N", () => {
    const s = createWaveSchedule(10);
    s.waves.forEach((w, i) => expect(w.waveNumber).toBe(i + 1));
  });
});

// ── generateWave ───────────────────────────────────────────────

describe("generateWave", () => {
  it("returns deterministic results for same seed", () => {
    const a = generateWave(1, 42);
    const b = generateWave(1, 42);
    expect(a).toEqual(b);
  });

  it("returns different results for different seeds", () => {
    const a = generateWave(1, 42);
    const b = generateWave(1, 99);
    // entries should differ (extremely unlikely to collide)
    expect(a.entries).not.toEqual(b.entries);
  });

  it("wave 1-3 has 1-2 enemy types and 10-20 enemies", () => {
    for (let w = 1; w <= 3; w++) {
      const wave = generateWave(w, 100 + w);
      const total = getTotalEnemies(wave);
      expect(wave.entries.length).toBeGreaterThanOrEqual(1);
      expect(wave.entries.length).toBeLessThanOrEqual(2);
      expect(total).toBeGreaterThanOrEqual(10);
      expect(total).toBeLessThanOrEqual(20);
    }
  });

  it("wave 4-6 has 2-3 enemy types and 20-35 enemies", () => {
    for (let w = 4; w <= 6; w++) {
      const wave = generateWave(w, 200 + w);
      const total = getTotalEnemies(wave);
      expect(wave.entries.length).toBeGreaterThanOrEqual(2);
      expect(wave.entries.length).toBeLessThanOrEqual(3);
      expect(total).toBeGreaterThanOrEqual(20);
      expect(total).toBeLessThanOrEqual(35);
    }
  });

  it("wave 7-9 has 3-4 enemy types and 30-50 enemies", () => {
    for (let w = 7; w <= 9; w++) {
      const wave = generateWave(w, 300 + w);
      const total = getTotalEnemies(wave);
      expect(wave.entries.length).toBeGreaterThanOrEqual(3);
      expect(wave.entries.length).toBeLessThanOrEqual(4);
      expect(total).toBeGreaterThanOrEqual(30);
      expect(total).toBeLessThanOrEqual(50);
    }
  });

  it("wave 5 is a mini-boss wave", () => {
    const wave = generateWave(5, 42);
    expect(wave.isBossWave).toBe(true);
    expect(wave.bossId).toBe("boss_mini");
  });

  it("wave 10 is a final boss wave", () => {
    const wave = generateWave(10, 42);
    expect(wave.isBossWave).toBe(true);
    expect(wave.bossId).toBe("boss_final");
  });

  it("non-boss waves have no bossId", () => {
    const wave = generateWave(3, 42);
    expect(wave.isBossWave).toBe(false);
    expect(wave.bossId).toBeUndefined();
  });

  it("boss waves have 8s break, normal waves 5s", () => {
    expect(generateWave(5, 42).breakDuration).toBe(8);
    expect(generateWave(10, 42).breakDuration).toBe(8);
    expect(generateWave(3, 42).breakDuration).toBe(5);
    expect(generateWave(1, 42).breakDuration).toBe(5);
  });

  it("all entries have valid enemy types", () => {
    const validTypes = new Set([
      "drone",
      "grunt",
      "tank",
      "sniper",
      "swarm",
      "elite",
    ]);
    for (let w = 1; w <= 10; w++) {
      const wave = generateWave(w, w * 13);
      wave.entries.forEach((e) =>
        expect(validTypes.has(e.enemyType)).toBe(true),
      );
    }
  });

  it("all entries have positive count and spawnDelay", () => {
    for (let w = 1; w <= 10; w++) {
      const wave = generateWave(w, w * 17);
      wave.entries.forEach((e) => {
        expect(e.count).toBeGreaterThan(0);
        expect(e.spawnDelay).toBeGreaterThan(0);
      });
    }
  });

  it("all entries have a formation", () => {
    const wave = generateWave(7, 42);
    wave.entries.forEach((e) => {
      expect(e.formation).toBeDefined();
    });
  });

  it("duration is at least 15 seconds", () => {
    for (let w = 1; w <= 10; w++) {
      expect(generateWave(w, 42).duration).toBeGreaterThanOrEqual(15);
    }
  });
});

// ── getDifficultyRamp ──────────────────────────────────────────

describe("getDifficultyRamp", () => {
  it("wave 1 has difficulty 1.0", () => {
    expect(getDifficultyRamp(1)).toBeCloseTo(1.0);
  });

  it("difficulty increases with wave number", () => {
    const d3 = getDifficultyRamp(3);
    const d7 = getDifficultyRamp(7);
    const d10 = getDifficultyRamp(10);
    expect(d7).toBeGreaterThan(d3);
    expect(d10).toBeGreaterThan(d7);
  });

  it("clamps wave number to minimum of 1", () => {
    expect(getDifficultyRamp(0)).toBeCloseTo(1.0);
    expect(getDifficultyRamp(-5)).toBeCloseTo(1.0);
  });

  it("wave 10 difficulty is approximately 2.98", () => {
    expect(getDifficultyRamp(10)).toBeCloseTo(2.98, 1);
  });
});

// ── tick ────────────────────────────────────────────────────────

describe("tick", () => {
  it("first tick starts wave 0 and emits spawn events", () => {
    const s = createWaveSchedule();
    const result = tick(s, 0.016);
    expect(result.waveStarted).toBe(true);
    expect(result.spawnEvents).not.toBeNull();
    expect(result.spawnEvents!.length).toBeGreaterThan(0);
  });

  it("subsequent ticks during wave do not emit spawn events", () => {
    const s = createWaveSchedule();
    const r1 = tick(s, 0.016);
    const r2 = tick(r1.state, 0.016);
    expect(r2.spawnEvents).toBeNull();
    expect(r2.waveStarted).toBe(false);
  });

  it("completing a wave sets waveEnded and enters break", () => {
    const s = createWaveSchedule();
    const r1 = tick(s, 0.016);
    const wave = getCurrentWave(r1.state)!;
    const r2 = tick(r1.state, wave.duration + 1);
    expect(r2.waveEnded).toBe(true);
    expect(r2.state.isInBreak).toBe(true);
  });

  it("break completes and starts next wave", () => {
    const s = createWaveSchedule();
    // Start wave 0
    let { state } = tick(s, 0.016);
    // Complete wave 0
    state = completeCurrentWave(state);
    // Complete break
    const result = tick(state, 100);
    expect(result.waveStarted).toBe(true);
    expect(result.state.currentWave).toBe(1);
    expect(result.state.isInBreak).toBe(false);
    expect(result.spawnEvents).not.toBeNull();
  });

  it("tracks totalEnemiesSpawned across waves", () => {
    const s = createWaveSchedule();
    const r1 = tick(s, 0.016);
    const wave0Total = getTotalEnemies(s.waves[0]);
    expect(r1.state.totalEnemiesSpawned).toBe(wave0Total);

    // Complete wave + break to get wave 1
    let state = completeCurrentWave(r1.state);
    const r2 = tick(state, 100); // complete break + start wave 1
    const wave1Total = getTotalEnemies(s.waves[1]);
    expect(r2.state.totalEnemiesSpawned).toBe(wave0Total + wave1Total);
  });

  it("completes schedule after last wave", () => {
    const s = createWaveSchedule(2);
    // Wave 0
    let { state } = tick(s, 0.016);
    state = completeCurrentWave(state);
    // Break -> Wave 1
    const r1 = tick(state, 100);
    state = completeCurrentWave(r1.state);
    // Break after last wave -> complete
    const r2 = tick(state, 100);
    expect(r2.state.isComplete).toBe(true);
  });

  it("ticking a complete state is a no-op", () => {
    const complete: WaveScheduleState = {
      waves: [],
      currentWave: 0,
      waveTimer: 0,
      breakTimer: 0,
      isInBreak: false,
      isComplete: true,
      totalEnemiesSpawned: 0,
    };
    const result = tick(complete, 1);
    expect(result.state).toEqual(complete);
    expect(result.spawnEvents).toBeNull();
    expect(result.waveStarted).toBe(false);
    expect(result.waveEnded).toBe(false);
  });

  it("handles empty wave schedule gracefully", () => {
    const s = createWaveSchedule(0);
    const result = tick(s, 0.016);
    expect(result.state.isComplete).toBe(true);
  });

  it("advances waveTimer correctly", () => {
    const s = createWaveSchedule();
    const r1 = tick(s, 0.5);
    expect(r1.state.waveTimer).toBeCloseTo(0.5);
    const r2 = tick(r1.state, 0.3);
    expect(r2.state.waveTimer).toBeCloseTo(0.8);
  });
});

// ── getCurrentWave ─────────────────────────────────────────────

describe("getCurrentWave", () => {
  it("returns the first wave at start", () => {
    const s = createWaveSchedule();
    const wave = getCurrentWave(s);
    expect(wave).toBeDefined();
    expect(wave!.waveNumber).toBe(1);
  });

  it("returns undefined when complete", () => {
    const s: WaveScheduleState = {
      waves: createWaveSchedule().waves,
      currentWave: 10,
      waveTimer: 0,
      breakTimer: 0,
      isInBreak: false,
      isComplete: true,
      totalEnemiesSpawned: 0,
    };
    expect(getCurrentWave(s)).toBeUndefined();
  });
});

// ── getWaveProgress ────────────────────────────────────────────

describe("getWaveProgress", () => {
  it("starts at 0.1 for wave 0 of 10", () => {
    const s = createWaveSchedule();
    expect(getWaveProgress(s)).toBeCloseTo(0.1);
  });

  it("reaches 1.0 at last wave", () => {
    const s: WaveScheduleState = {
      ...createWaveSchedule(),
      currentWave: 9,
    };
    expect(getWaveProgress(s)).toBeCloseTo(1.0);
  });

  it("returns 0 for empty schedule", () => {
    const s = createWaveSchedule(0);
    expect(getWaveProgress(s)).toBe(0);
  });
});

// ── getTimeRemaining ───────────────────────────────────────────

describe("getTimeRemaining", () => {
  it("returns full duration at wave start", () => {
    const s = createWaveSchedule();
    const wave = getCurrentWave(s)!;
    expect(getTimeRemaining(s)).toBeCloseTo(wave.duration);
  });

  it("decreases after ticking", () => {
    const s = createWaveSchedule();
    const r = tick(s, 2);
    const wave = getCurrentWave(r.state)!;
    expect(getTimeRemaining(r.state)).toBeCloseTo(wave.duration - 2, 0);
  });

  it("returns break time remaining during break", () => {
    const s = createWaveSchedule();
    let { state } = tick(s, 0.016);
    state = completeCurrentWave(state);
    // In break now
    const remaining = getTimeRemaining(state);
    expect(remaining).toBeGreaterThan(0);
    expect(remaining).toBeLessThanOrEqual(8);
  });

  it("returns 0 when complete", () => {
    const s: WaveScheduleState = {
      ...createWaveSchedule(),
      isComplete: true,
    };
    expect(getTimeRemaining(s)).toBe(0);
  });
});

// ── isWaveActive ───────────────────────────────────────────────

describe("isWaveActive", () => {
  it("returns true during an active wave", () => {
    const s = createWaveSchedule();
    expect(isWaveActive(s)).toBe(true);
  });

  it("returns false during break", () => {
    const s: WaveScheduleState = {
      ...createWaveSchedule(),
      isInBreak: true,
    };
    expect(isWaveActive(s)).toBe(false);
  });

  it("returns false when complete", () => {
    const s: WaveScheduleState = {
      ...createWaveSchedule(),
      isComplete: true,
    };
    expect(isWaveActive(s)).toBe(false);
  });
});

// ── isBossWave ─────────────────────────────────────────────────

describe("isBossWave", () => {
  it("returns false on wave 1", () => {
    const s = createWaveSchedule();
    expect(isBossWave(s)).toBe(false);
  });

  it("returns true on wave 5 (mini-boss)", () => {
    const s: WaveScheduleState = {
      ...createWaveSchedule(),
      currentWave: 4, // 0-indexed → wave 5
    };
    expect(isBossWave(s)).toBe(true);
  });

  it("returns true on wave 10 (final boss)", () => {
    const s: WaveScheduleState = {
      ...createWaveSchedule(),
      currentWave: 9, // 0-indexed → wave 10
    };
    expect(isBossWave(s)).toBe(true);
  });
});

// ── skipBreak ──────────────────────────────────────────────────

describe("skipBreak", () => {
  it("sets breakTimer to breakDuration", () => {
    const base = createWaveSchedule();
    const s: WaveScheduleState = { ...base, isInBreak: true, breakTimer: 1 };
    const result = skipBreak(s);
    const wave = getCurrentWave(result)!;
    expect(result.breakTimer).toBe(wave.breakDuration);
  });

  it("is a no-op when not in break", () => {
    const s = createWaveSchedule();
    const result = skipBreak(s);
    expect(result).toEqual(s);
  });

  it("next tick after skipBreak starts the next wave", () => {
    const base = createWaveSchedule();
    const s: WaveScheduleState = { ...base, isInBreak: true, breakTimer: 0 };
    const skipped = skipBreak(s);
    const result = tick(skipped, 0.016);
    expect(result.waveStarted).toBe(true);
    expect(result.state.currentWave).toBe(1);
  });
});

// ── getEnemyComposition ────────────────────────────────────────

describe("getEnemyComposition", () => {
  it("aggregates counts by enemy type", () => {
    const wave: WaveConfig = {
      waveNumber: 1,
      entries: [
        { enemyType: "drone", count: 5, spawnDelay: 0.5 },
        { enemyType: "grunt", count: 3, spawnDelay: 0.8 },
        { enemyType: "drone", count: 2, spawnDelay: 0.5 },
      ],
      duration: 30,
      breakDuration: 5,
      isBossWave: false,
      difficulty: 1.0,
    };
    const comp = getEnemyComposition(wave);
    expect(comp["drone"]).toBe(7);
    expect(comp["grunt"]).toBe(3);
  });

  it("returns empty object for no entries", () => {
    const wave: WaveConfig = {
      waveNumber: 1,
      entries: [],
      duration: 15,
      breakDuration: 5,
      isBossWave: false,
      difficulty: 1.0,
    };
    expect(getEnemyComposition(wave)).toEqual({});
  });
});

// ── getTotalEnemies ────────────────────────────────────────────

describe("getTotalEnemies", () => {
  it("sums all entry counts", () => {
    const wave: WaveConfig = {
      waveNumber: 1,
      entries: [
        { enemyType: "drone", count: 10, spawnDelay: 0.5 },
        { enemyType: "grunt", count: 5, spawnDelay: 0.8 },
      ],
      duration: 30,
      breakDuration: 5,
      isBossWave: false,
      difficulty: 1.0,
    };
    expect(getTotalEnemies(wave)).toBe(15);
  });

  it("returns 0 for empty entries", () => {
    const wave: WaveConfig = {
      waveNumber: 1,
      entries: [],
      duration: 15,
      breakDuration: 5,
      isBossWave: false,
      difficulty: 1.0,
    };
    expect(getTotalEnemies(wave)).toBe(0);
  });
});

// ── estimateWaveDuration ───────────────────────────────────────

describe("estimateWaveDuration", () => {
  it("calculates sum of count * spawnDelay", () => {
    const wave: WaveConfig = {
      waveNumber: 1,
      entries: [
        { enemyType: "drone", count: 10, spawnDelay: 0.5 },
        { enemyType: "grunt", count: 5, spawnDelay: 1.0 },
      ],
      duration: 30,
      breakDuration: 5,
      isBossWave: false,
      difficulty: 1.0,
    };
    // 10*0.5 + 5*1.0 = 10
    expect(estimateWaveDuration(wave)).toBe(10);
  });

  it("returns 0 for empty entries", () => {
    const wave: WaveConfig = {
      waveNumber: 1,
      entries: [],
      duration: 15,
      breakDuration: 5,
      isBossWave: false,
      difficulty: 1.0,
    };
    expect(estimateWaveDuration(wave)).toBe(0);
  });
});

// ── Immutability ───────────────────────────────────────────────

describe("immutability", () => {
  it("tick does not mutate original state", () => {
    const s = createWaveSchedule();
    const original = { ...s };
    tick(s, 1);
    expect(s.waveTimer).toBe(original.waveTimer);
    expect(s.currentWave).toBe(original.currentWave);
    expect(s.isInBreak).toBe(original.isInBreak);
  });

  it("skipBreak does not mutate original state", () => {
    const s: WaveScheduleState = { ...createWaveSchedule(), isInBreak: true };
    const originalBreakTimer = s.breakTimer;
    skipBreak(s);
    expect(s.breakTimer).toBe(originalBreakTimer);
  });
});

// ── Full run simulation ────────────────────────────────────────

describe("full run simulation", () => {
  it("can complete all 10 waves", () => {
    let state = createWaveSchedule();
    let totalWavesStarted = 0;
    let totalWavesEnded = 0;

    // Start wave 0
    let result = tick(state, 0.016);
    state = result.state;
    if (result.waveStarted) totalWavesStarted++;

    for (let i = 0; i < 100 && !state.isComplete; i++) {
      // Complete current wave
      const wave = getCurrentWave(state);
      if (!wave) break;

      if (!state.isInBreak) {
        result = tick(state, wave.duration + 1);
        state = result.state;
        if (result.waveEnded) totalWavesEnded++;
      }

      // Complete break
      if (state.isInBreak) {
        result = tick(state, 100);
        state = result.state;
        if (result.waveStarted) totalWavesStarted++;
      }
    }

    expect(state.isComplete).toBe(true);
    expect(totalWavesStarted).toBe(10);
    expect(totalWavesEnded).toBe(10);
  });

  it("totalEnemiesSpawned equals sum of all wave enemies", () => {
    const schedule = createWaveSchedule();
    const expectedTotal = schedule.waves.reduce(
      (sum, w) => sum + getTotalEnemies(w),
      0,
    );

    let state: WaveScheduleState = schedule;
    // Start
    let result = tick(state, 0.016);
    state = result.state;

    for (let i = 0; i < 100 && !state.isComplete; i++) {
      const wave = getCurrentWave(state);
      if (!wave) break;
      if (!state.isInBreak) {
        result = tick(state, wave.duration + 1);
        state = result.state;
      }
      if (state.isInBreak) {
        result = tick(state, 100);
        state = result.state;
      }
    }

    expect(state.totalEnemiesSpawned).toBe(expectedTotal);
  });
});

// ── Edge cases ─────────────────────────────────────────────────

describe("edge cases", () => {
  it("very large dt completes wave in one tick", () => {
    const s = createWaveSchedule();
    const r1 = tick(s, 0.016); // start
    const r2 = tick(r1.state, 99999);
    expect(r2.waveEnded).toBe(true);
  });

  it("zero dt does not advance timers beyond initial", () => {
    const s = createWaveSchedule();
    const r1 = tick(s, 0.016); // start wave
    const r2 = tick(r1.state, 0);
    expect(r2.state.waveTimer).toBeCloseTo(r1.state.waveTimer);
  });

  it("generateWave with very high wave number still works", () => {
    const wave = generateWave(100, 42);
    expect(wave.waveNumber).toBe(100);
    expect(wave.entries.length).toBeGreaterThan(0);
    expect(getTotalEnemies(wave)).toBeGreaterThanOrEqual(30);
  });

  it("no Phaser imports in module", async () => {
    // Read the source file and verify no phaser import
    const source = await import("../../src/core/WaveScheduleCalc");
    // If it imported Phaser, this test file would fail to load in node env
    expect(source.createWaveSchedule).toBeDefined();
    expect(source.generateWave).toBeDefined();
  });
});
