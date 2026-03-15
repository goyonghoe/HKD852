import { describe, it, expect } from "vitest";
import {
  createBurstState,
  canFire,
  startBurst,
  updateBurst,
  getShotAngleOffset,
  getBurstProgress,
  getCooldownProgress,
  isFiring,
  isCoolingDown,
  resetBurst,
  getFireRate,
  getStats,
} from "../../src/core/BurstFireCalc";

// ─── createBurstState ──────────────────────────────────────────

describe("createBurstState", () => {
  it("creates state with default config", () => {
    const s = createBurstState();
    expect(s.config.shotsPerBurst).toBe(3);
    expect(s.config.burstInterval).toBe(80);
    expect(s.config.burstCooldown).toBe(600);
    expect(s.config.spreadAngle).toBe(15);
  });

  it("starts in ready phase", () => {
    const s = createBurstState();
    expect(s.phase).toBe("ready");
  });

  it("starts with zero counters", () => {
    const s = createBurstState();
    expect(s.shotsFired).toBe(0);
    expect(s.burstElapsed).toBe(0);
    expect(s.cooldownElapsed).toBe(0);
    expect(s.totalBursts).toBe(0);
    expect(s.totalShots).toBe(0);
  });

  it("accepts partial config overrides", () => {
    const s = createBurstState({ shotsPerBurst: 5, burstCooldown: 1000 });
    expect(s.config.shotsPerBurst).toBe(5);
    expect(s.config.burstCooldown).toBe(1000);
    expect(s.config.burstInterval).toBe(80); // default preserved
    expect(s.config.spreadAngle).toBe(15); // default preserved
  });

  it("accepts single field override", () => {
    const s = createBurstState({ spreadAngle: 45 });
    expect(s.config.spreadAngle).toBe(45);
    expect(s.config.shotsPerBurst).toBe(3);
  });

  it("accepts all fields overridden", () => {
    const s = createBurstState({
      shotsPerBurst: 7,
      burstInterval: 50,
      burstCooldown: 200,
      spreadAngle: 30,
    });
    expect(s.config.shotsPerBurst).toBe(7);
    expect(s.config.burstInterval).toBe(50);
    expect(s.config.burstCooldown).toBe(200);
    expect(s.config.spreadAngle).toBe(30);
  });

  it("handles shotsPerBurst=1", () => {
    const s = createBurstState({ shotsPerBurst: 1 });
    expect(s.config.shotsPerBurst).toBe(1);
  });
});

// ─── canFire ────────────────────────────────────────────────────

describe("canFire", () => {
  it("returns true when ready", () => {
    const s = createBurstState();
    expect(canFire(s)).toBe(true);
  });

  it("returns false when firing", () => {
    const s = startBurst(createBurstState());
    expect(canFire(s)).toBe(false);
  });

  it("returns false when cooling down", () => {
    // Single-shot burst goes straight to cooldown
    let s = startBurst(createBurstState({ shotsPerBurst: 1 }));
    const { newState } = updateBurst(s, 0);
    expect(canFire(newState)).toBe(false);
  });
});

// ─── startBurst ─────────────────────────────────────────────────

describe("startBurst", () => {
  it("sets phase to firing", () => {
    const s = startBurst(createBurstState());
    expect(s.phase).toBe("firing");
  });

  it("resets shotsFired to 0", () => {
    const s = startBurst(createBurstState());
    expect(s.shotsFired).toBe(0);
  });

  it("resets burstElapsed to 0", () => {
    const s = startBurst(createBurstState());
    expect(s.burstElapsed).toBe(0);
  });

  it("resets cooldownElapsed to 0", () => {
    const s = startBurst(createBurstState());
    expect(s.cooldownElapsed).toBe(0);
  });

  it("preserves config", () => {
    const cfg = { shotsPerBurst: 5, burstInterval: 100 };
    const s = startBurst(createBurstState(cfg));
    expect(s.config.shotsPerBurst).toBe(5);
    expect(s.config.burstInterval).toBe(100);
  });

  it("preserves totals", () => {
    // Simulate a completed burst to have totals, then start a new one
    let s = startBurst(createBurstState({ shotsPerBurst: 1 }));
    const { newState: after } = updateBurst(s, 0);
    // after is in cooldown with totalBursts=1, totalShots=1
    // Force ready by completing cooldown
    const { newState: ready } = updateBurst(after, 700);
    const s2 = startBurst(ready);
    expect(s2.totalBursts).toBe(1);
    expect(s2.totalShots).toBe(1);
  });

  it("does not mutate original state", () => {
    const original = createBurstState();
    const started = startBurst(original);
    expect(original.phase).toBe("ready");
    expect(started.phase).toBe("firing");
  });
});

// ─── updateBurst ────────────────────────────────────────────────

describe("updateBurst", () => {
  it("returns shouldFire=false when ready", () => {
    const s = createBurstState();
    const { newState, shouldFire } = updateBurst(s, 16);
    expect(shouldFire).toBe(false);
    expect(newState).toBe(s); // same reference, no change
  });

  it("fires first shot immediately on first update", () => {
    const s = startBurst(createBurstState());
    const { newState, shouldFire } = updateBurst(s, 16);
    expect(shouldFire).toBe(true);
    expect(newState.shotsFired).toBe(1);
  });

  it("does not fire second shot before burstInterval", () => {
    let s = startBurst(createBurstState({ burstInterval: 80 }));
    // First update fires shot 1
    const r1 = updateBurst(s, 16);
    expect(r1.shouldFire).toBe(true);
    // 50ms later — not yet 80ms for second shot
    const r2 = updateBurst(r1.newState, 50);
    expect(r2.shouldFire).toBe(false);
  });

  it("fires second shot when burstInterval reached", () => {
    let s = startBurst(createBurstState({ burstInterval: 80 }));
    const r1 = updateBurst(s, 16); // shot 1
    // Need total elapsed >= 80 for shot 2
    const r2 = updateBurst(r1.newState, 64); // elapsed = 16+64 = 80
    expect(r2.shouldFire).toBe(true);
    expect(r2.newState.shotsFired).toBe(2);
  });

  it("transitions to cooldown after last shot", () => {
    let s = startBurst(
      createBurstState({ shotsPerBurst: 2, burstInterval: 50 }),
    );
    const r1 = updateBurst(s, 10); // shot 1
    const r2 = updateBurst(r1.newState, 50); // shot 2 (elapsed=60 >= 50)
    expect(r2.shouldFire).toBe(true);
    expect(r2.newState.phase).toBe("cooldown");
    expect(r2.newState.shotsFired).toBe(2);
  });

  it("transitions cooldown to ready after burstCooldown", () => {
    let s = startBurst(
      createBurstState({ shotsPerBurst: 1, burstCooldown: 300 }),
    );
    const r1 = updateBurst(s, 0); // fires single shot → cooldown
    expect(r1.newState.phase).toBe("cooldown");
    const r2 = updateBurst(r1.newState, 300);
    expect(r2.newState.phase).toBe("ready");
    expect(r2.shouldFire).toBe(false);
  });

  it("stays in cooldown if not enough time", () => {
    let s = startBurst(
      createBurstState({ shotsPerBurst: 1, burstCooldown: 500 }),
    );
    const r1 = updateBurst(s, 0); // → cooldown
    const r2 = updateBurst(r1.newState, 200);
    expect(r2.newState.phase).toBe("cooldown");
    expect(r2.newState.cooldownElapsed).toBe(200);
  });

  it("increments totalBursts on burst completion", () => {
    let s = startBurst(createBurstState({ shotsPerBurst: 1 }));
    const { newState } = updateBurst(s, 0);
    expect(newState.totalBursts).toBe(1);
  });

  it("increments totalShots on each shot", () => {
    let s = startBurst(
      createBurstState({ shotsPerBurst: 2, burstInterval: 50 }),
    );
    const r1 = updateBurst(s, 10);
    expect(r1.newState.totalShots).toBe(1);
    const r2 = updateBurst(r1.newState, 50);
    expect(r2.newState.totalShots).toBe(2);
  });

  it("full burst cycle: 3 shots then cooldown then ready", () => {
    let s = startBurst(
      createBurstState({
        shotsPerBurst: 3,
        burstInterval: 80,
        burstCooldown: 600,
      }),
    );
    // Shot 1 (immediate)
    const r1 = updateBurst(s, 16);
    expect(r1.shouldFire).toBe(true);
    expect(r1.newState.phase).toBe("firing");

    // Shot 2 (at ~80ms)
    const r2 = updateBurst(r1.newState, 80);
    expect(r2.shouldFire).toBe(true);
    expect(r2.newState.phase).toBe("firing");

    // Shot 3 (at ~160ms) → cooldown
    const r3 = updateBurst(r2.newState, 80);
    expect(r3.shouldFire).toBe(true);
    expect(r3.newState.phase).toBe("cooldown");

    // Cooldown
    const r4 = updateBurst(r3.newState, 600);
    expect(r4.shouldFire).toBe(false);
    expect(r4.newState.phase).toBe("ready");
  });

  it("does not mutate original state during firing", () => {
    const s = startBurst(createBurstState());
    const original = { ...s };
    updateBurst(s, 16);
    expect(s.shotsFired).toBe(original.shotsFired);
    expect(s.burstElapsed).toBe(original.burstElapsed);
  });

  it("handles single-shot burst completing immediately", () => {
    let s = startBurst(createBurstState({ shotsPerBurst: 1 }));
    const { newState, shouldFire } = updateBurst(s, 0);
    expect(shouldFire).toBe(true);
    expect(newState.phase).toBe("cooldown");
    expect(newState.shotsFired).toBe(1);
    expect(newState.totalBursts).toBe(1);
    expect(newState.totalShots).toBe(1);
  });

  it("handles large deltaMs skipping through cooldown", () => {
    let s = startBurst(
      createBurstState({ shotsPerBurst: 1, burstCooldown: 100 }),
    );
    const r1 = updateBurst(s, 0); // → cooldown
    const r2 = updateBurst(r1.newState, 5000);
    expect(r2.newState.phase).toBe("ready");
  });
});

// ─── getShotAngleOffset ─────────────────────────────────────────

describe("getShotAngleOffset", () => {
  it("returns 0 for single-shot burst", () => {
    const cfg = {
      shotsPerBurst: 1,
      burstInterval: 80,
      burstCooldown: 600,
      spreadAngle: 15,
    };
    expect(getShotAngleOffset(0, cfg)).toBe(0);
  });

  it("first shot offset is -spreadAngle/2 in radians", () => {
    const cfg = {
      shotsPerBurst: 3,
      burstInterval: 80,
      burstCooldown: 600,
      spreadAngle: 30,
    };
    const expected = (-30 / 2) * (Math.PI / 180);
    expect(getShotAngleOffset(0, cfg)).toBeCloseTo(expected, 6);
  });

  it("last shot offset is +spreadAngle/2 in radians", () => {
    const cfg = {
      shotsPerBurst: 3,
      burstInterval: 80,
      burstCooldown: 600,
      spreadAngle: 30,
    };
    const expected = (30 / 2) * (Math.PI / 180);
    expect(getShotAngleOffset(2, cfg)).toBeCloseTo(expected, 6);
  });

  it("middle shot is centered (0) for odd count", () => {
    const cfg = {
      shotsPerBurst: 3,
      burstInterval: 80,
      burstCooldown: 600,
      spreadAngle: 30,
    };
    expect(getShotAngleOffset(1, cfg)).toBeCloseTo(0, 6);
  });

  it("offsets are symmetric for 5-shot burst", () => {
    const cfg = {
      shotsPerBurst: 5,
      burstInterval: 50,
      burstCooldown: 400,
      spreadAngle: 40,
    };
    const o0 = getShotAngleOffset(0, cfg);
    const o4 = getShotAngleOffset(4, cfg);
    expect(o0).toBeCloseTo(-o4, 6);
  });

  it("spread of 0 returns 0 for all shots", () => {
    const cfg = {
      shotsPerBurst: 3,
      burstInterval: 80,
      burstCooldown: 600,
      spreadAngle: 0,
    };
    expect(getShotAngleOffset(0, cfg)).toBeCloseTo(0, 6);
    expect(getShotAngleOffset(1, cfg)).toBeCloseTo(0, 6);
    expect(getShotAngleOffset(2, cfg)).toBeCloseTo(0, 6);
  });

  it("returns radians, not degrees", () => {
    const cfg = {
      shotsPerBurst: 2,
      burstInterval: 80,
      burstCooldown: 600,
      spreadAngle: 90,
    };
    const o0 = getShotAngleOffset(0, cfg);
    // -45 deg in radians = -PI/4 ≈ -0.785
    expect(Math.abs(o0)).toBeLessThan(Math.PI);
    expect(o0).toBeCloseTo(-Math.PI / 4, 6);
  });

  it("handles 2-shot burst", () => {
    const cfg = {
      shotsPerBurst: 2,
      burstInterval: 80,
      burstCooldown: 600,
      spreadAngle: 20,
    };
    const o0 = getShotAngleOffset(0, cfg);
    const o1 = getShotAngleOffset(1, cfg);
    expect(o0).toBeCloseTo(-o1, 6);
  });
});

// ─── getBurstProgress ───────────────────────────────────────────

describe("getBurstProgress", () => {
  it("returns 0 when ready", () => {
    const s = createBurstState();
    expect(getBurstProgress(s)).toBe(0);
  });

  it("returns 0 when just started (no shots fired yet)", () => {
    const s = startBurst(createBurstState());
    expect(getBurstProgress(s)).toBe(0);
  });

  it("returns partial progress during burst", () => {
    let s = startBurst(createBurstState({ shotsPerBurst: 4 }));
    const { newState } = updateBurst(s, 16); // fires shot 1
    expect(getBurstProgress(newState)).toBeCloseTo(0.25, 6);
  });

  it("returns 1 when in cooldown (burst complete)", () => {
    let s = startBurst(createBurstState({ shotsPerBurst: 1 }));
    const { newState } = updateBurst(s, 0);
    expect(getBurstProgress(newState)).toBe(1);
  });

  it("handles single-shot burst progress before firing", () => {
    const s = startBurst(createBurstState({ shotsPerBurst: 1 }));
    // shotsFired=0, phase=firing, shotsPerBurst=1
    expect(getBurstProgress(s)).toBe(0);
  });
});

// ─── getCooldownProgress ────────────────────────────────────────

describe("getCooldownProgress", () => {
  it("returns 0 when firing (not yet cooling down)", () => {
    const s = startBurst(createBurstState());
    expect(getCooldownProgress(s)).toBe(0);
  });

  it("returns 1 when ready (cooldown complete or not applicable)", () => {
    const s = createBurstState();
    expect(getCooldownProgress(s)).toBe(1);
  });

  it("returns partial progress during cooldown", () => {
    let s = startBurst(
      createBurstState({ shotsPerBurst: 1, burstCooldown: 400 }),
    );
    const r1 = updateBurst(s, 0); // → cooldown
    const r2 = updateBurst(r1.newState, 200); // 200/400 = 0.5
    expect(getCooldownProgress(r2.newState)).toBeCloseTo(0.5, 6);
  });

  it("returns 0 at start of cooldown", () => {
    let s = startBurst(
      createBurstState({ shotsPerBurst: 1, burstCooldown: 400 }),
    );
    const { newState } = updateBurst(s, 0); // → cooldown, elapsed=0
    expect(getCooldownProgress(newState)).toBeCloseTo(0, 6);
  });

  it("caps at 1", () => {
    let s = startBurst(
      createBurstState({ shotsPerBurst: 1, burstCooldown: 100 }),
    );
    const r1 = updateBurst(s, 0);
    // Give it just under the cooldown so it stays in cooldown phase
    const r2 = updateBurst(r1.newState, 99);
    expect(getCooldownProgress(r2.newState)).toBeLessThanOrEqual(1);
  });
});

// ─── isFiring ───────────────────────────────────────────────────

describe("isFiring", () => {
  it("returns false when ready", () => {
    expect(isFiring(createBurstState())).toBe(false);
  });

  it("returns true when firing", () => {
    expect(isFiring(startBurst(createBurstState()))).toBe(true);
  });

  it("returns false when cooling down", () => {
    let s = startBurst(createBurstState({ shotsPerBurst: 1 }));
    const { newState } = updateBurst(s, 0);
    expect(isFiring(newState)).toBe(false);
  });
});

// ─── isCoolingDown ──────────────────────────────────────────────

describe("isCoolingDown", () => {
  it("returns false when ready", () => {
    expect(isCoolingDown(createBurstState())).toBe(false);
  });

  it("returns false when firing", () => {
    expect(isCoolingDown(startBurst(createBurstState()))).toBe(false);
  });

  it("returns true when cooling down", () => {
    let s = startBurst(createBurstState({ shotsPerBurst: 1 }));
    const { newState } = updateBurst(s, 0);
    expect(isCoolingDown(newState)).toBe(true);
  });
});

// ─── resetBurst ─────────────────────────────────────────────────

describe("resetBurst", () => {
  it("sets phase to ready", () => {
    let s = startBurst(createBurstState());
    expect(resetBurst(s).phase).toBe("ready");
  });

  it("preserves config", () => {
    const cfg = { shotsPerBurst: 7 };
    let s = startBurst(createBurstState(cfg));
    expect(resetBurst(s).config.shotsPerBurst).toBe(7);
  });

  it("preserves totals", () => {
    let s = startBurst(createBurstState({ shotsPerBurst: 1 }));
    const { newState } = updateBurst(s, 0);
    const reset = resetBurst(newState);
    expect(reset.totalBursts).toBe(1);
    expect(reset.totalShots).toBe(1);
  });

  it("resets shotsFired", () => {
    let s = startBurst(createBurstState());
    const { newState } = updateBurst(s, 16);
    expect(resetBurst(newState).shotsFired).toBe(0);
  });

  it("resets burstElapsed", () => {
    let s = startBurst(createBurstState());
    const { newState } = updateBurst(s, 100);
    expect(resetBurst(newState).burstElapsed).toBe(0);
  });

  it("resets cooldownElapsed", () => {
    let s = startBurst(
      createBurstState({ shotsPerBurst: 1, burstCooldown: 500 }),
    );
    const r1 = updateBurst(s, 0);
    const r2 = updateBurst(r1.newState, 200);
    expect(resetBurst(r2.newState).cooldownElapsed).toBe(0);
  });

  it("does not mutate original", () => {
    const s = startBurst(createBurstState());
    resetBurst(s);
    expect(s.phase).toBe("firing");
  });
});

// ─── getFireRate ────────────────────────────────────────────────

describe("getFireRate", () => {
  it("calculates effective fire rate for default config", () => {
    // Default: 3 shots, 80ms interval, 600ms cooldown
    // Firing time: (3-1)*80 = 160ms, cycle = 160+600 = 760ms
    // Rate = 3 / 0.76 ≈ 3.947
    const cfg = {
      shotsPerBurst: 3,
      burstInterval: 80,
      burstCooldown: 600,
      spreadAngle: 15,
    };
    expect(getFireRate(cfg)).toBeCloseTo(3 / 0.76, 2);
  });

  it("single shot: rate = 1 / (cooldown in seconds)", () => {
    const cfg = {
      shotsPerBurst: 1,
      burstInterval: 80,
      burstCooldown: 1000,
      spreadAngle: 0,
    };
    // Firing time: 0, cycle = 1000ms = 1s, rate = 1
    expect(getFireRate(cfg)).toBeCloseTo(1.0, 2);
  });

  it("higher shotsPerBurst increases effective rate", () => {
    const cfg3 = {
      shotsPerBurst: 3,
      burstInterval: 50,
      burstCooldown: 500,
      spreadAngle: 0,
    };
    const cfg5 = {
      shotsPerBurst: 5,
      burstInterval: 50,
      burstCooldown: 500,
      spreadAngle: 0,
    };
    expect(getFireRate(cfg5)).toBeGreaterThan(getFireRate(cfg3));
  });

  it("longer cooldown decreases effective rate", () => {
    const cfgFast = {
      shotsPerBurst: 3,
      burstInterval: 80,
      burstCooldown: 300,
      spreadAngle: 0,
    };
    const cfgSlow = {
      shotsPerBurst: 3,
      burstInterval: 80,
      burstCooldown: 900,
      spreadAngle: 0,
    };
    expect(getFireRate(cfgFast)).toBeGreaterThan(getFireRate(cfgSlow));
  });

  it("returns 0 for zero cycle time", () => {
    const cfg = {
      shotsPerBurst: 1,
      burstInterval: 0,
      burstCooldown: 0,
      spreadAngle: 0,
    };
    // cycle = 0, rate = 0 (avoid division by zero)
    expect(getFireRate(cfg)).toBe(0);
  });
});

// ─── getStats ───────────────────────────────────────────────────

describe("getStats", () => {
  it("returns zeros for fresh state", () => {
    const s = createBurstState();
    const stats = getStats(s);
    expect(stats.totalBursts).toBe(0);
    expect(stats.totalShots).toBe(0);
    expect(stats.averageShotsPerBurst).toBe(0);
  });

  it("tracks after one complete burst", () => {
    let s = startBurst(createBurstState({ shotsPerBurst: 1 }));
    const { newState } = updateBurst(s, 0);
    const stats = getStats(newState);
    expect(stats.totalBursts).toBe(1);
    expect(stats.totalShots).toBe(1);
    expect(stats.averageShotsPerBurst).toBe(1);
  });

  it("calculates correct average over multiple bursts", () => {
    // Simulate two full single-shot bursts
    let s = startBurst(
      createBurstState({ shotsPerBurst: 1, burstCooldown: 100 }),
    );
    let r = updateBurst(s, 0); // burst 1
    r = updateBurst(r.newState, 100); // cooldown complete
    s = startBurst(r.newState);
    r = updateBurst(s, 0); // burst 2
    const stats = getStats(r.newState);
    expect(stats.totalBursts).toBe(2);
    expect(stats.totalShots).toBe(2);
    expect(stats.averageShotsPerBurst).toBe(1);
  });

  it("averageShotsPerBurst is 0 when totalBursts is 0", () => {
    const stats = getStats(createBurstState());
    expect(stats.averageShotsPerBurst).toBe(0);
  });
});

// ─── Integration: multi-burst cycle ─────────────────────────────

describe("integration: multi-burst cycle", () => {
  it("completes two full burst cycles correctly", () => {
    const cfg = { shotsPerBurst: 2, burstInterval: 50, burstCooldown: 200 };
    let s = createBurstState(cfg);

    // Burst 1
    expect(canFire(s)).toBe(true);
    s = startBurst(s);
    let r = updateBurst(s, 10); // shot 1
    expect(r.shouldFire).toBe(true);
    r = updateBurst(r.newState, 50); // shot 2 → cooldown
    expect(r.shouldFire).toBe(true);
    expect(r.newState.phase).toBe("cooldown");

    // Cooldown
    r = updateBurst(r.newState, 200); // → ready
    expect(r.newState.phase).toBe("ready");

    // Burst 2
    s = startBurst(r.newState);
    r = updateBurst(s, 10); // shot 1
    expect(r.shouldFire).toBe(true);
    r = updateBurst(r.newState, 50); // shot 2 → cooldown
    expect(r.shouldFire).toBe(true);

    const stats = getStats(r.newState);
    expect(stats.totalBursts).toBe(2);
    expect(stats.totalShots).toBe(4);
    expect(stats.averageShotsPerBurst).toBe(2);
  });

  it("reset mid-burst preserves totals but returns to ready", () => {
    let s = startBurst(createBurstState({ shotsPerBurst: 3 }));
    const r = updateBurst(s, 16); // shot 1
    const reset = resetBurst(r.newState);
    expect(reset.phase).toBe("ready");
    expect(reset.totalShots).toBe(1);
    expect(reset.totalBursts).toBe(0); // burst wasn't completed
    expect(canFire(reset)).toBe(true);
  });
});
