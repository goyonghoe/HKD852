import { describe, it, expect } from "vitest";
import {
  createDashState,
  canDash,
  startDash,
  updateDash,
  getDashPosition,
  isDashComplete,
  isInvincible,
  getCharges,
  getCooldownPercent,
  resetDash,
} from "../../src/core/DashCalc";

// ─── createDashState ───────────────────────────────────────────

describe("createDashState", () => {
  it("returns defaults when no config provided", () => {
    const s = createDashState();
    expect(s.config.distance).toBe(150);
    expect(s.config.duration).toBe(200);
    expect(s.config.cooldown).toBe(1000);
    expect(s.config.iFrames).toBe(true);
    expect(s.config.maxCharges).toBe(2);
    expect(s.config.rechargeTime).toBe(3000);
  });

  it("starts with max charges", () => {
    const s = createDashState({ maxCharges: 5 });
    expect(s.charges).toBe(5);
  });

  it("starts not dashing", () => {
    const s = createDashState();
    expect(s.isDashing).toBe(false);
  });

  it("starts with zero elapsed timers", () => {
    const s = createDashState();
    expect(s.dashElapsed).toBe(0);
    expect(s.cooldownElapsed).toBe(0);
    expect(s.rechargeElapsed).toBe(0);
  });

  it("starts with zero direction and position", () => {
    const s = createDashState();
    expect(s.dashDirX).toBe(0);
    expect(s.dashDirY).toBe(0);
    expect(s.startX).toBe(0);
    expect(s.startY).toBe(0);
  });

  it("overrides partial config", () => {
    const s = createDashState({ distance: 300, iFrames: false });
    expect(s.config.distance).toBe(300);
    expect(s.config.iFrames).toBe(false);
    expect(s.config.duration).toBe(200); // default kept
  });

  it("returns immutable object (different reference on each call)", () => {
    const a = createDashState();
    const b = createDashState();
    expect(a).not.toBe(b);
    expect(a.config).not.toBe(b.config);
  });
});

// ─── canDash ───────────────────────────────────────────────────

describe("canDash", () => {
  it("returns true for fresh state", () => {
    expect(canDash(createDashState())).toBe(true);
  });

  it("returns false when currently dashing", () => {
    let s = createDashState();
    s = startDash(s, 1, 0, 0, 0);
    expect(canDash(s)).toBe(false);
  });

  it("returns false when charges are 0", () => {
    let s = createDashState({ maxCharges: 1 });
    s = startDash(s, 1, 0, 0, 0);
    s = updateDash(s, 200); // finish dash
    expect(s.charges).toBe(0);
    expect(canDash(s)).toBe(false);
  });

  it("returns true after dash completes if charges remain", () => {
    let s = createDashState({ maxCharges: 2 });
    s = startDash(s, 1, 0, 0, 0);
    s = updateDash(s, 200);
    expect(canDash(s)).toBe(true);
  });
});

// ─── startDash ─────────────────────────────────────────────────

describe("startDash", () => {
  it("sets isDashing to true", () => {
    const s = startDash(createDashState(), 1, 0, 100, 200);
    expect(s.isDashing).toBe(true);
  });

  it("consumes one charge", () => {
    const s = startDash(createDashState(), 1, 0, 0, 0);
    expect(s.charges).toBe(1);
  });

  it("stores start position", () => {
    const s = startDash(createDashState(), 1, 0, 42, 99);
    expect(s.startX).toBe(42);
    expect(s.startY).toBe(99);
  });

  it("normalizes direction vector", () => {
    const s = startDash(createDashState(), 3, 4, 0, 0);
    expect(s.dashDirX).toBeCloseTo(0.6);
    expect(s.dashDirY).toBeCloseTo(0.8);
  });

  it("normalizes diagonal direction", () => {
    const s = startDash(createDashState(), 1, 1, 0, 0);
    const inv = 1 / Math.SQRT2;
    expect(s.dashDirX).toBeCloseTo(inv);
    expect(s.dashDirY).toBeCloseTo(inv);
  });

  it("handles negative directions", () => {
    const s = startDash(createDashState(), -1, 0, 0, 0);
    expect(s.dashDirX).toBeCloseTo(-1);
    expect(s.dashDirY).toBeCloseTo(0);
  });

  it("handles zero direction (no movement)", () => {
    const s = startDash(createDashState(), 0, 0, 0, 0);
    expect(s.dashDirX).toBe(0);
    expect(s.dashDirY).toBe(0);
  });

  it("resets dashElapsed to 0", () => {
    const s = startDash(createDashState(), 1, 0, 0, 0);
    expect(s.dashElapsed).toBe(0);
  });

  it("returns same state if canDash is false (no charges)", () => {
    let s = createDashState({ maxCharges: 1 });
    s = startDash(s, 1, 0, 0, 0);
    s = updateDash(s, 200);
    const before = s;
    const after = startDash(s, 0, 1, 10, 10);
    expect(after).toBe(before);
  });

  it("returns same state if currently dashing", () => {
    let s = createDashState();
    s = startDash(s, 1, 0, 0, 0);
    const before = s;
    const after = startDash(s, 0, 1, 10, 10);
    expect(after).toBe(before);
  });

  it("does not mutate original state", () => {
    const original = createDashState();
    startDash(original, 1, 0, 0, 0);
    expect(original.isDashing).toBe(false);
    expect(original.charges).toBe(2);
  });
});

// ─── updateDash ────────────────────────────────────────────────

describe("updateDash", () => {
  it("advances dashElapsed during a dash", () => {
    let s = startDash(createDashState(), 1, 0, 0, 0);
    s = updateDash(s, 50);
    expect(s.dashElapsed).toBe(50);
  });

  it("ends dash when elapsed >= duration", () => {
    let s = startDash(createDashState({ duration: 200 }), 1, 0, 0, 0);
    s = updateDash(s, 200);
    expect(s.isDashing).toBe(false);
  });

  it("ends dash when elapsed exceeds duration", () => {
    let s = startDash(createDashState({ duration: 200 }), 1, 0, 0, 0);
    s = updateDash(s, 300);
    expect(s.isDashing).toBe(false);
    expect(s.dashElapsed).toBe(300);
  });

  it("does not change dashElapsed when not dashing", () => {
    let s = createDashState();
    s = updateDash(s, 100);
    expect(s.dashElapsed).toBe(0);
  });

  it("advances rechargeElapsed when charges < max", () => {
    let s = createDashState({ maxCharges: 2, rechargeTime: 3000 });
    s = startDash(s, 1, 0, 0, 0);
    // recharge runs even during dash: 200ms dash + 1000ms idle = 1200ms total
    s = updateDash(s, 200); // finish dash, charges=1, rechargeElapsed=200
    s = updateDash(s, 1000);
    expect(s.rechargeElapsed).toBe(1200);
  });

  it("grants a charge when rechargeTime is reached", () => {
    let s = createDashState({ maxCharges: 2, rechargeTime: 1000 });
    s = startDash(s, 1, 0, 0, 0); // charges -> 1
    s = updateDash(s, 200); // finish dash
    s = updateDash(s, 1000); // recharge complete
    expect(s.charges).toBe(2);
  });

  it("does not exceed maxCharges", () => {
    let s = createDashState({ maxCharges: 2 });
    s = updateDash(s, 10000);
    expect(s.charges).toBe(2);
  });

  it("resets rechargeElapsed when fully charged", () => {
    let s = createDashState({ maxCharges: 2, rechargeTime: 1000 });
    s = startDash(s, 1, 0, 0, 0);
    s = updateDash(s, 200);
    s = updateDash(s, 1500); // grants charge, leftover 500 but fully charged
    expect(s.rechargeElapsed).toBe(0);
  });

  it("carries over leftover recharge time across multiple charges", () => {
    // Use a long rechargeTime so dash duration doesn't auto-recharge
    let z = createDashState({
      maxCharges: 3,
      rechargeTime: 5000,
      duration: 50,
    });
    z = startDash(z, 1, 0, 0, 0); // charges: 2
    z = updateDash(z, 50); // finish dash
    z = startDash(z, 1, 0, 0, 0); // charges: 1
    z = updateDash(z, 50);
    z = startDash(z, 1, 0, 0, 0); // charges: 0
    z = updateDash(z, 50); // finish dash, rechargeElapsed=150 (3x50ms)
    expect(z.charges).toBe(0);

    // Now test with short rechargeTime for leftover carry
    let s = createDashState({ maxCharges: 2, rechargeTime: 100, duration: 10 });
    s = startDash(s, 1, 0, 0, 0); // charges: 1
    s = updateDash(s, 10); // finish dash, rechargeElapsed=10
    s = startDash(s, 1, 0, 0, 0); // charges: 0
    s = updateDash(s, 10); // finish dash, rechargeElapsed=20
    expect(s.charges).toBe(0);
    // 250ms more recharge: total = 20+250 = 270ms → 2 charges (200ms), leftover 70ms
    // but maxCharges=2 so rechargeElapsed resets to 0
    s = updateDash(s, 250);
    expect(s.charges).toBe(2);
    expect(s.rechargeElapsed).toBe(0); // fully charged → reset
  });

  it("does not mutate original state", () => {
    const s = startDash(createDashState(), 1, 0, 0, 0);
    const copy = s;
    updateDash(s, 100);
    expect(copy.dashElapsed).toBe(0);
  });

  it("handles zero delta gracefully", () => {
    let s = startDash(createDashState(), 1, 0, 0, 0);
    s = updateDash(s, 0);
    expect(s.dashElapsed).toBe(0);
    expect(s.isDashing).toBe(true);
  });
});

// ─── getDashPosition ──────────────────────────────────────────

describe("getDashPosition", () => {
  it("returns start position at elapsed=0", () => {
    let s = startDash(createDashState({ distance: 150 }), 1, 0, 100, 200);
    const pos = getDashPosition(s);
    expect(pos.x).toBeCloseTo(100);
    expect(pos.y).toBeCloseTo(200);
  });

  it("returns midpoint at half duration", () => {
    let s = startDash(
      createDashState({ distance: 200, duration: 100 }),
      1,
      0,
      0,
      0,
    );
    s = updateDash(s, 50);
    const pos = getDashPosition(s);
    expect(pos.x).toBeCloseTo(100);
    expect(pos.y).toBeCloseTo(0);
  });

  it("returns full distance at end of dash", () => {
    let s = startDash(
      createDashState({ distance: 150, duration: 200 }),
      1,
      0,
      10,
      20,
    );
    s = updateDash(s, 200);
    const pos = getDashPosition(s);
    expect(pos.x).toBeCloseTo(160);
    expect(pos.y).toBeCloseTo(20);
  });

  it("clamps t to 1 when elapsed exceeds duration", () => {
    let s = startDash(
      createDashState({ distance: 100, duration: 100 }),
      1,
      0,
      0,
      0,
    );
    s = updateDash(s, 999);
    const pos = getDashPosition(s);
    expect(pos.x).toBeCloseTo(100);
  });

  it("handles diagonal direction correctly", () => {
    let s = startDash(
      createDashState({ distance: 100, duration: 100 }),
      1,
      1,
      0,
      0,
    );
    s = updateDash(s, 100);
    const pos = getDashPosition(s);
    const inv = 1 / Math.SQRT2;
    expect(pos.x).toBeCloseTo(100 * inv);
    expect(pos.y).toBeCloseTo(100 * inv);
  });

  it("handles negative direction", () => {
    let s = startDash(
      createDashState({ distance: 100, duration: 100 }),
      -1,
      0,
      50,
      50,
    );
    s = updateDash(s, 100);
    const pos = getDashPosition(s);
    expect(pos.x).toBeCloseTo(-50);
    expect(pos.y).toBeCloseTo(50);
  });

  it("returns startPos for non-dashing state with zero elapsed", () => {
    const s = createDashState();
    const pos = getDashPosition(s);
    expect(pos.x).toBe(0);
    expect(pos.y).toBe(0);
  });
});

// ─── isDashComplete ───────────────────────────────────────────

describe("isDashComplete", () => {
  it("returns false for fresh state", () => {
    expect(isDashComplete(createDashState())).toBe(false);
  });

  it("returns false while still dashing", () => {
    let s = startDash(createDashState(), 1, 0, 0, 0);
    s = updateDash(s, 50);
    expect(isDashComplete(s)).toBe(false);
  });

  it("returns true after dash finishes", () => {
    let s = startDash(createDashState({ duration: 200 }), 1, 0, 0, 0);
    s = updateDash(s, 200);
    expect(isDashComplete(s)).toBe(true);
  });

  it("returns true when elapsed exceeds duration", () => {
    let s = startDash(createDashState({ duration: 100 }), 1, 0, 0, 0);
    s = updateDash(s, 500);
    expect(isDashComplete(s)).toBe(true);
  });
});

// ─── isInvincible ─────────────────────────────────────────────

describe("isInvincible", () => {
  it("returns false when not dashing", () => {
    expect(isInvincible(createDashState())).toBe(false);
  });

  it("returns true when dashing with iFrames enabled", () => {
    const s = startDash(createDashState({ iFrames: true }), 1, 0, 0, 0);
    expect(isInvincible(s)).toBe(true);
  });

  it("returns false when dashing with iFrames disabled", () => {
    const s = startDash(createDashState({ iFrames: false }), 1, 0, 0, 0);
    expect(isInvincible(s)).toBe(false);
  });

  it("returns false after dash completes even with iFrames", () => {
    let s = startDash(
      createDashState({ iFrames: true, duration: 100 }),
      1,
      0,
      0,
      0,
    );
    s = updateDash(s, 100);
    expect(isInvincible(s)).toBe(false);
  });
});

// ─── getCharges ───────────────────────────────────────────────

describe("getCharges", () => {
  it("returns maxCharges for fresh state", () => {
    expect(getCharges(createDashState({ maxCharges: 3 }))).toBe(3);
  });

  it("decreases after startDash", () => {
    const s = startDash(createDashState({ maxCharges: 2 }), 1, 0, 0, 0);
    expect(getCharges(s)).toBe(1);
  });

  it("returns 0 after all charges used", () => {
    let s = createDashState({ maxCharges: 1 });
    s = startDash(s, 1, 0, 0, 0);
    s = updateDash(s, 200);
    expect(getCharges(s)).toBe(0);
  });

  it("increases after recharge", () => {
    let s = createDashState({ maxCharges: 2, rechargeTime: 500 });
    s = startDash(s, 1, 0, 0, 0);
    s = updateDash(s, 200); // dash ends
    s = updateDash(s, 500); // recharge 1
    expect(getCharges(s)).toBe(2);
  });
});

// ─── getCooldownPercent ───────────────────────────────────────

describe("getCooldownPercent", () => {
  it("returns 0 when fully charged", () => {
    expect(getCooldownPercent(createDashState())).toBe(0);
  });

  it("returns progress toward next charge", () => {
    // Use duration=0-ish to avoid recharge accumulation during dash
    let s = createDashState({ maxCharges: 2, rechargeTime: 1000, duration: 0 });
    s = startDash(s, 1, 0, 0, 0); // charges: 1, instantly completes
    s = updateDash(s, 0); // end dash (duration=0)
    s = updateDash(s, 500); // 50% recharge
    expect(getCooldownPercent(s)).toBeCloseTo(0.5);
  });

  it("returns 0 after full recharge", () => {
    let s = createDashState({ maxCharges: 2, rechargeTime: 1000 });
    s = startDash(s, 1, 0, 0, 0);
    s = updateDash(s, 200);
    s = updateDash(s, 1000);
    expect(getCooldownPercent(s)).toBe(0);
  });

  it("clamps to 0-1 range", () => {
    const s = createDashState({ maxCharges: 2, rechargeTime: 1000 });
    expect(getCooldownPercent(s)).toBeGreaterThanOrEqual(0);
    expect(getCooldownPercent(s)).toBeLessThanOrEqual(1);
  });
});

// ─── resetDash ────────────────────────────────────────────────

describe("resetDash", () => {
  it("restores charges to max", () => {
    let s = createDashState({ maxCharges: 3 });
    s = startDash(s, 1, 0, 0, 0);
    s = updateDash(s, 200);
    s = startDash(s, 1, 0, 0, 0);
    s = resetDash(s);
    expect(s.charges).toBe(3);
  });

  it("sets isDashing to false", () => {
    let s = startDash(createDashState(), 1, 0, 0, 0);
    s = resetDash(s);
    expect(s.isDashing).toBe(false);
  });

  it("zeroes all elapsed timers", () => {
    let s = startDash(createDashState(), 1, 0, 0, 0);
    s = updateDash(s, 50);
    s = resetDash(s);
    expect(s.dashElapsed).toBe(0);
    expect(s.cooldownElapsed).toBe(0);
    expect(s.rechargeElapsed).toBe(0);
  });

  it("zeroes direction and position", () => {
    let s = startDash(createDashState(), 1, 1, 42, 99);
    s = resetDash(s);
    expect(s.dashDirX).toBe(0);
    expect(s.dashDirY).toBe(0);
    expect(s.startX).toBe(0);
    expect(s.startY).toBe(0);
  });

  it("preserves config", () => {
    const s = resetDash(createDashState({ distance: 999 }));
    expect(s.config.distance).toBe(999);
  });

  it("allows dashing again after reset", () => {
    let s = createDashState({ maxCharges: 1 });
    s = startDash(s, 1, 0, 0, 0);
    s = updateDash(s, 200);
    expect(canDash(s)).toBe(false);
    s = resetDash(s);
    expect(canDash(s)).toBe(true);
  });
});

// ─── Integration / edge cases ─────────────────────────────────

describe("integration", () => {
  it("full dash cycle: start → update → complete → recharge → dash again", () => {
    let s = createDashState({
      maxCharges: 1,
      duration: 100,
      rechargeTime: 500,
    });
    expect(canDash(s)).toBe(true);

    s = startDash(s, 0, -1, 360, 640);
    expect(s.isDashing).toBe(true);
    expect(getCharges(s)).toBe(0);

    s = updateDash(s, 100);
    expect(isDashComplete(s)).toBe(true);
    expect(canDash(s)).toBe(false);

    s = updateDash(s, 500);
    expect(getCharges(s)).toBe(1);
    expect(canDash(s)).toBe(true);

    s = startDash(s, 1, 0, 100, 100);
    expect(s.isDashing).toBe(true);
  });

  it("multiple dashes consume multiple charges", () => {
    let s = createDashState({ maxCharges: 3, duration: 50 });
    s = startDash(s, 1, 0, 0, 0);
    s = updateDash(s, 50);
    s = startDash(s, 1, 0, 0, 0);
    s = updateDash(s, 50);
    s = startDash(s, 1, 0, 0, 0);
    s = updateDash(s, 50);
    expect(getCharges(s)).toBe(0);
    expect(canDash(s)).toBe(false);
  });

  it("gradual recharge with partial updates", () => {
    let s = createDashState({ maxCharges: 2, rechargeTime: 1000 });
    s = startDash(s, 1, 0, 0, 0);
    s = updateDash(s, 200);
    // 10 updates of 100ms each = 1000ms recharge
    for (let i = 0; i < 10; i++) {
      s = updateDash(s, 100);
    }
    expect(getCharges(s)).toBe(2);
  });

  it("immutability across entire lifecycle", () => {
    const s0 = createDashState();
    const s1 = startDash(s0, 1, 0, 0, 0);
    const s2 = updateDash(s1, 100);
    const s3 = resetDash(s2);

    // All should be different references
    expect(s0).not.toBe(s1);
    expect(s1).not.toBe(s2);
    expect(s2).not.toBe(s3);

    // Original unchanged
    expect(s0.isDashing).toBe(false);
    expect(s0.charges).toBe(2);
  });
});
