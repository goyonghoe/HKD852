// ── Tests: PowerUpCalc ──

import { describe, it, expect } from "vitest";
import {
  createPowerUpState,
  getPowerUpDef,
  activatePowerUp,
  tickPowerUps,
  isOnCooldown,
  getCooldownRemaining,
  hasActivePowerUp,
  getDamageMultiplier,
  getSpeedMultiplier,
  getMagnetMultiplier,
  isInvincible,
  PowerUpState,
} from "../../src/core/PowerUpCalc";

// ════════════════════════════════════════════════════════════════
// § createPowerUpState
// ════════════════════════════════════════════════════════════════

describe("createPowerUpState", () => {
  it("returns empty active list", () => {
    const s = createPowerUpState();
    expect(s.active).toEqual([]);
  });

  it("returns empty cooldowns", () => {
    const s = createPowerUpState();
    expect(s.cooldowns).toEqual({});
  });
});

// ════════════════════════════════════════════════════════════════
// § getPowerUpDef
// ════════════════════════════════════════════════════════════════

describe("getPowerUpDef", () => {
  it("bomb is instant with 300px radius and 30s cooldown", () => {
    const def = getPowerUpDef("bomb");
    expect(def.duration).toBe(0);
    expect(def.value).toBe(300);
    expect(def.cooldown).toBe(30);
  });

  it("magnet_burst lasts 3s with 20s cooldown", () => {
    const def = getPowerUpDef("magnet_burst");
    expect(def.duration).toBe(3);
    expect(def.cooldown).toBe(20);
  });

  it("invincibility lasts 5s with 60s cooldown", () => {
    const def = getPowerUpDef("invincibility");
    expect(def.duration).toBe(5);
    expect(def.cooldown).toBe(60);
  });

  it("double_damage lasts 8s with 2x value and 45s cooldown", () => {
    const def = getPowerUpDef("double_damage");
    expect(def.duration).toBe(8);
    expect(def.value).toBe(2);
    expect(def.cooldown).toBe(45);
  });

  it("speed_boost lasts 6s with 1.5x value and 30s cooldown", () => {
    const def = getPowerUpDef("speed_boost");
    expect(def.duration).toBe(6);
    expect(def.value).toBe(1.5);
    expect(def.cooldown).toBe(30);
  });

  it("xp_magnet lasts 10s with 3x value and 25s cooldown", () => {
    const def = getPowerUpDef("xp_magnet");
    expect(def.duration).toBe(10);
    expect(def.value).toBe(3);
    expect(def.cooldown).toBe(25);
  });

  it("returns a copy (mutation-safe)", () => {
    const def1 = getPowerUpDef("bomb");
    def1.cooldown = 999;
    const def2 = getPowerUpDef("bomb");
    expect(def2.cooldown).toBe(30);
  });
});

// ════════════════════════════════════════════════════════════════
// § activatePowerUp
// ════════════════════════════════════════════════════════════════

describe("activatePowerUp", () => {
  it("adds a duration-based power-up to active list", () => {
    const s = activatePowerUp(createPowerUpState(), "invincibility");
    expect(s.active).toHaveLength(1);
    expect(s.active[0].type).toBe("invincibility");
    expect(s.active[0].duration).toBe(5);
    expect(s.active[0].isActive).toBe(true);
  });

  it("starts cooldown on activation", () => {
    const s = activatePowerUp(createPowerUpState(), "invincibility");
    expect(s.cooldowns["invincibility"]).toBe(60);
  });

  it("bomb (instant) does not persist in active list", () => {
    const s = activatePowerUp(createPowerUpState(), "bomb");
    expect(s.active).toHaveLength(0);
  });

  it("bomb still starts cooldown", () => {
    const s = activatePowerUp(createPowerUpState(), "bomb");
    expect(s.cooldowns["bomb"]).toBe(30);
  });

  it("ignores activation if already on cooldown", () => {
    let s = activatePowerUp(createPowerUpState(), "speed_boost");
    s = activatePowerUp(s, "speed_boost");
    // Should still only have 1 active
    expect(s.active).toHaveLength(1);
  });

  it("ignores activation if already active", () => {
    let s = activatePowerUp(createPowerUpState(), "double_damage");
    // Manually clear cooldown but keep active
    s = { ...s, cooldowns: {} };
    s = activatePowerUp(s, "double_damage");
    expect(s.active).toHaveLength(1);
  });

  it("allows multiple different power-ups simultaneously", () => {
    let s = createPowerUpState();
    s = activatePowerUp(s, "speed_boost");
    s = activatePowerUp(s, "double_damage");
    s = activatePowerUp(s, "xp_magnet");
    expect(s.active).toHaveLength(3);
  });
});

// ════════════════════════════════════════════════════════════════
// § tickPowerUps
// ════════════════════════════════════════════════════════════════

describe("tickPowerUps", () => {
  it("reduces duration of active power-ups", () => {
    let s = activatePowerUp(createPowerUpState(), "invincibility");
    s = tickPowerUps(s, 2);
    expect(s.active[0].duration).toBe(3);
  });

  it("removes expired power-ups", () => {
    let s = activatePowerUp(createPowerUpState(), "magnet_burst");
    s = tickPowerUps(s, 3); // exactly 3s → duration becomes 0 → removed
    expect(s.active).toHaveLength(0);
  });

  it("reduces cooldowns", () => {
    let s = activatePowerUp(createPowerUpState(), "bomb");
    s = tickPowerUps(s, 10);
    expect(s.cooldowns["bomb"]).toBe(20);
  });

  it("removes cooldowns that reach zero", () => {
    let s = activatePowerUp(createPowerUpState(), "magnet_burst");
    s = tickPowerUps(s, 20); // cooldown was 20s
    expect(s.cooldowns["magnet_burst"]).toBeUndefined();
  });

  it("handles multiple ticks correctly", () => {
    let s = activatePowerUp(createPowerUpState(), "speed_boost");
    s = tickPowerUps(s, 2);
    s = tickPowerUps(s, 2);
    s = tickPowerUps(s, 2); // 6s total → speed_boost expires
    expect(s.active).toHaveLength(0);
    expect(s.cooldowns["speed_boost"]).toBe(24); // 30 - 6
  });
});

// ════════════════════════════════════════════════════════════════
// § isOnCooldown / getCooldownRemaining
// ════════════════════════════════════════════════════════════════

describe("isOnCooldown", () => {
  it("returns false for fresh state", () => {
    expect(isOnCooldown(createPowerUpState(), "bomb")).toBe(false);
  });

  it("returns true after activation", () => {
    const s = activatePowerUp(createPowerUpState(), "bomb");
    expect(isOnCooldown(s, "bomb")).toBe(true);
  });

  it("returns false after cooldown expires", () => {
    let s = activatePowerUp(createPowerUpState(), "magnet_burst");
    s = tickPowerUps(s, 20);
    expect(isOnCooldown(s, "magnet_burst")).toBe(false);
  });
});

describe("getCooldownRemaining", () => {
  it("returns 0 for no cooldown", () => {
    expect(getCooldownRemaining(createPowerUpState(), "bomb")).toBe(0);
  });

  it("returns remaining seconds", () => {
    let s = activatePowerUp(createPowerUpState(), "invincibility");
    s = tickPowerUps(s, 15);
    expect(getCooldownRemaining(s, "invincibility")).toBe(45);
  });
});

// ════════════════════════════════════════════════════════════════
// § hasActivePowerUp
// ════════════════════════════════════════════════════════════════

describe("hasActivePowerUp", () => {
  it("returns false for fresh state", () => {
    expect(hasActivePowerUp(createPowerUpState(), "speed_boost")).toBe(false);
  });

  it("returns true while active", () => {
    const s = activatePowerUp(createPowerUpState(), "speed_boost");
    expect(hasActivePowerUp(s, "speed_boost")).toBe(true);
  });

  it("returns false after expiry", () => {
    let s = activatePowerUp(createPowerUpState(), "speed_boost");
    s = tickPowerUps(s, 6);
    expect(hasActivePowerUp(s, "speed_boost")).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════
// § Multiplier helpers
// ════════════════════════════════════════════════════════════════

describe("getDamageMultiplier", () => {
  it("returns 1 with no active power-ups", () => {
    expect(getDamageMultiplier(createPowerUpState())).toBe(1);
  });

  it("returns 2 with double_damage active", () => {
    const s = activatePowerUp(createPowerUpState(), "double_damage");
    expect(getDamageMultiplier(s)).toBe(2);
  });

  it("returns 1 after double_damage expires", () => {
    let s = activatePowerUp(createPowerUpState(), "double_damage");
    s = tickPowerUps(s, 8);
    expect(getDamageMultiplier(s)).toBe(1);
  });
});

describe("getSpeedMultiplier", () => {
  it("returns 1 with no active power-ups", () => {
    expect(getSpeedMultiplier(createPowerUpState())).toBe(1);
  });

  it("returns 1.5 with speed_boost active", () => {
    const s = activatePowerUp(createPowerUpState(), "speed_boost");
    expect(getSpeedMultiplier(s)).toBe(1.5);
  });
});

describe("getMagnetMultiplier", () => {
  it("returns 1 with no active power-ups", () => {
    expect(getMagnetMultiplier(createPowerUpState())).toBe(1);
  });

  it("returns 3 with xp_magnet active", () => {
    const s = activatePowerUp(createPowerUpState(), "xp_magnet");
    expect(getMagnetMultiplier(s)).toBe(3);
  });
});

describe("isInvincible", () => {
  it("returns false with no active power-ups", () => {
    expect(isInvincible(createPowerUpState())).toBe(false);
  });

  it("returns true with invincibility active", () => {
    const s = activatePowerUp(createPowerUpState(), "invincibility");
    expect(isInvincible(s)).toBe(true);
  });

  it("returns false after invincibility expires", () => {
    let s = activatePowerUp(createPowerUpState(), "invincibility");
    s = tickPowerUps(s, 5);
    expect(isInvincible(s)).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════
// § Edge cases
// ════════════════════════════════════════════════════════════════

describe("edge cases", () => {
  it("re-activation works after cooldown expires", () => {
    let s = activatePowerUp(createPowerUpState(), "magnet_burst");
    s = tickPowerUps(s, 20); // cooldown + duration expire
    s = activatePowerUp(s, "magnet_burst");
    expect(s.active).toHaveLength(1);
    expect(s.cooldowns["magnet_burst"]).toBe(20);
  });

  it("unrelated power-ups do not affect each other's multipliers", () => {
    let s = createPowerUpState();
    s = activatePowerUp(s, "speed_boost");
    expect(getDamageMultiplier(s)).toBe(1);
    expect(getMagnetMultiplier(s)).toBe(1);
    expect(isInvincible(s)).toBe(false);
  });
});
