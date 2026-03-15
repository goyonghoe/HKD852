// ── Tests: PauseCalc ──

import { describe, it, expect } from "vitest";
import {
  createPauseState,
  pause,
  resume,
  getEffectiveElapsed,
  canPause,
  getPauseStats,
} from "../../src/core/PauseCalc";

// ════════════════════════════════════════════════════════════════
// § createPauseState
// ════════════════════════════════════════════════════════════════

describe("createPauseState", () => {
  it("initial state is not paused", () => {
    const s = createPauseState();
    expect(s.isPaused).toBe(false);
    expect(s.totalPausedTime).toBe(0);
    expect(s.pauseStartTime).toBeNull();
    expect(s.pauseCount).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § pause
// ════════════════════════════════════════════════════════════════

describe("pause", () => {
  it("sets isPaused and pauseStartTime", () => {
    const s = pause(createPauseState(), 5000);
    expect(s.isPaused).toBe(true);
    expect(s.pauseStartTime).toBe(5000);
    expect(s.pauseCount).toBe(1);
  });

  it("double pause does not change state", () => {
    const s1 = pause(createPauseState(), 5000);
    const s2 = pause(s1, 6000);
    expect(s2).toBe(s1); // same reference — unchanged
    expect(s2.pauseStartTime).toBe(5000);
    expect(s2.pauseCount).toBe(1);
  });

  it("increments pauseCount on each new pause", () => {
    let s = createPauseState();
    s = pause(s, 1000);
    s = resume(s, 2000);
    s = pause(s, 3000);
    s = resume(s, 4000);
    s = pause(s, 5000);
    expect(s.pauseCount).toBe(3);
  });
});

// ════════════════════════════════════════════════════════════════
// § resume
// ════════════════════════════════════════════════════════════════

describe("resume", () => {
  it("clears isPaused and accumulates paused time", () => {
    let s = pause(createPauseState(), 1000);
    s = resume(s, 3000);
    expect(s.isPaused).toBe(false);
    expect(s.pauseStartTime).toBeNull();
    expect(s.totalPausedTime).toBe(2000);
  });

  it("double resume does not change state", () => {
    const s1 = createPauseState();
    const s2 = resume(s1, 5000);
    expect(s2).toBe(s1); // same reference
    expect(s2.totalPausedTime).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § getEffectiveElapsed
// ════════════════════════════════════════════════════════════════

describe("getEffectiveElapsed", () => {
  it("subtracts total paused time when not currently paused", () => {
    let s = pause(createPauseState(), 2000);
    s = resume(s, 5000); // paused 3000ms
    // 10s total, 3s paused → 7s effective
    expect(getEffectiveElapsed(10000, s, 10000)).toBe(7000);
  });

  it("subtracts ongoing pause time when currently paused", () => {
    const s = pause(createPauseState(), 4000);
    // total 10s, paused since 4s, current 10s → ongoing pause = 6s
    expect(getEffectiveElapsed(10000, s, 10000)).toBe(4000);
  });

  it("never returns negative", () => {
    let s = pause(createPauseState(), 0);
    s = resume(s, 50000); // 50s paused
    // total elapsed only 10s, paused 50s → should clamp to 0
    expect(getEffectiveElapsed(10000, s, 10000)).toBe(0);
  });

  it("returns full elapsed when never paused", () => {
    const s = createPauseState();
    expect(getEffectiveElapsed(12345, s, 12345)).toBe(12345);
  });
});

// ════════════════════════════════════════════════════════════════
// § canPause
// ════════════════════════════════════════════════════════════════

describe("canPause", () => {
  it("allows pause during 'playing'", () => {
    expect(canPause("playing")).toBe(true);
  });

  it("allows pause during 'boss'", () => {
    expect(canPause("boss")).toBe(true);
  });

  it("disallows pause during 'level_up'", () => {
    expect(canPause("level_up")).toBe(false);
  });

  it("disallows pause during 'game_over'", () => {
    expect(canPause("game_over")).toBe(false);
  });

  it("disallows pause during 'victory'", () => {
    expect(canPause("victory")).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════
// § getPauseStats
// ════════════════════════════════════════════════════════════════

describe("getPauseStats", () => {
  it("returns zeroes for fresh state", () => {
    const stats = getPauseStats(createPauseState());
    expect(stats.totalPausedSeconds).toBe(0);
    expect(stats.pauseCount).toBe(0);
    expect(stats.averagePauseDuration).toBe(0);
  });

  it("calculates correct stats after pauses", () => {
    let s = createPauseState();
    s = pause(s, 1000);
    s = resume(s, 4000); // 3000ms
    s = pause(s, 6000);
    s = resume(s, 8000); // 2000ms
    // total: 5000ms = 5s, count: 2, avg: 2.5s
    const stats = getPauseStats(s);
    expect(stats.totalPausedSeconds).toBe(5);
    expect(stats.pauseCount).toBe(2);
    expect(stats.averagePauseDuration).toBe(2.5);
  });
});

// ════════════════════════════════════════════════════════════════
// § Multiple pause/resume cycles
// ════════════════════════════════════════════════════════════════

describe("multiple pause/resume cycles", () => {
  it("accumulates paused time correctly across many cycles", () => {
    let s = createPauseState();
    // Cycle 1: pause 1s–3s (2s)
    s = pause(s, 1000);
    s = resume(s, 3000);
    // Cycle 2: pause 5s–6s (1s)
    s = pause(s, 5000);
    s = resume(s, 6000);
    // Cycle 3: pause 8s–12s (4s)
    s = pause(s, 8000);
    s = resume(s, 12000);

    expect(s.totalPausedTime).toBe(7000); // 2+1+4 = 7s
    expect(s.pauseCount).toBe(3);
    expect(s.isPaused).toBe(false);

    // Effective elapsed at t=15s: 15s - 7s = 8s
    expect(getEffectiveElapsed(15000, s, 15000)).toBe(8000);
  });
});
