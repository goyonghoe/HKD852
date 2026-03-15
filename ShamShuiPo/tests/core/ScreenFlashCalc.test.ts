// ── Tests: ScreenFlashCalc ──

import { describe, it, expect } from "vitest";
import {
  getFlashForEvent,
  isCriticalHp,
  getVignetteAlpha,
  type FlashEvent,
} from "../../src/core/ScreenFlashCalc";

describe("getFlashForEvent", () => {
  it("player_hit returns red flash with shake", () => {
    const cfg = getFlashForEvent("player_hit");
    expect(cfg.color).toBe(0xff0000);
    expect(cfg.alpha).toBe(0.2);
    expect(cfg.duration).toBe(200);
    expect(cfg.shake).toBe(true);
    expect(cfg.shakeIntensity).toBe(0.01);
  });

  it("level_up returns white flash without shake", () => {
    const cfg = getFlashForEvent("level_up");
    expect(cfg.color).toBe(0xffffff);
    expect(cfg.alpha).toBe(0.3);
    expect(cfg.duration).toBe(150);
    expect(cfg.shake).toBe(false);
    expect(cfg.shakeIntensity).toBe(0);
  });

  it("boss_spawn returns purple flash with shake", () => {
    const cfg = getFlashForEvent("boss_spawn");
    expect(cfg.color).toBe(0xff00ff);
    expect(cfg.alpha).toBe(0.25);
    expect(cfg.duration).toBe(400);
    expect(cfg.shake).toBe(true);
    expect(cfg.shakeIntensity).toBe(0.02);
  });

  it("boss_kill returns gold flash with shake", () => {
    const cfg = getFlashForEvent("boss_kill");
    expect(cfg.color).toBe(0xffd700);
    expect(cfg.alpha).toBe(0.35);
    expect(cfg.duration).toBe(500);
    expect(cfg.shake).toBe(true);
    expect(cfg.shakeIntensity).toBe(0.015);
  });

  it("critical_hp returns red flash without shake", () => {
    const cfg = getFlashForEvent("critical_hp");
    expect(cfg.color).toBe(0xff0000);
    expect(cfg.alpha).toBe(0.15);
    expect(cfg.duration).toBe(300);
    expect(cfg.shake).toBe(false);
    expect(cfg.shakeIntensity).toBe(0);
  });

  it("returns a copy (not a reference)", () => {
    const a = getFlashForEvent("player_hit");
    const b = getFlashForEvent("player_hit");
    a.alpha = 999;
    expect(b.alpha).toBe(0.2);
  });

  it("all events return valid configs", () => {
    const events: FlashEvent[] = [
      "player_hit",
      "level_up",
      "boss_spawn",
      "boss_kill",
      "critical_hp",
    ];
    for (const event of events) {
      const cfg = getFlashForEvent(event);
      expect(cfg.alpha).toBeGreaterThan(0);
      expect(cfg.alpha).toBeLessThanOrEqual(1);
      expect(cfg.duration).toBeGreaterThan(0);
      expect(cfg.shakeIntensity).toBeGreaterThanOrEqual(0);
      expect(cfg.shakeIntensity).toBeLessThanOrEqual(1);
    }
  });
});

describe("isCriticalHp", () => {
  it("returns true when HP is below default threshold (0.3)", () => {
    expect(isCriticalHp(20, 100)).toBe(true); // 0.2 < 0.3
  });

  it("returns false when HP is above default threshold", () => {
    expect(isCriticalHp(50, 100)).toBe(false); // 0.5 >= 0.3
  });

  it("returns true at exactly threshold (strict less-than)", () => {
    // 30/100 = 0.3, not less than 0.3 → false
    expect(isCriticalHp(30, 100)).toBe(false);
  });

  it("returns true just below threshold", () => {
    expect(isCriticalHp(29, 100)).toBe(true); // 0.29 < 0.3
  });

  it("respects custom threshold", () => {
    expect(isCriticalHp(50, 100, 0.6)).toBe(true); // 0.5 < 0.6
    expect(isCriticalHp(50, 100, 0.4)).toBe(false); // 0.5 >= 0.4
  });

  it("returns true when HP is 0", () => {
    expect(isCriticalHp(0, 100)).toBe(true);
  });

  it("returns true when maxHp is 0 (degenerate case)", () => {
    expect(isCriticalHp(0, 0)).toBe(true);
  });

  it("returns true when maxHp is negative", () => {
    expect(isCriticalHp(50, -10)).toBe(true);
  });
});

describe("getVignetteAlpha", () => {
  it("returns 0 when HP is above threshold", () => {
    expect(getVignetteAlpha(80, 100)).toBe(0); // 0.8 >= 0.3
  });

  it("returns 0 at exactly threshold", () => {
    expect(getVignetteAlpha(30, 100)).toBe(0); // 0.3 >= 0.3
  });

  it("returns maxAlpha when HP is 0", () => {
    expect(getVignetteAlpha(0, 100)).toBeCloseTo(0.4);
  });

  it("scales linearly between threshold and 0 HP", () => {
    // At 15% HP (halfway between 0 and 30% threshold)
    const alpha = getVignetteAlpha(15, 100);
    expect(alpha).toBeCloseTo(0.2); // half of maxAlpha (0.4)
  });

  it("respects custom maxAlpha", () => {
    expect(getVignetteAlpha(0, 100, 0.8)).toBeCloseTo(0.8);
  });

  it("returns maxAlpha when maxHp is 0", () => {
    expect(getVignetteAlpha(50, 0)).toBeCloseTo(0.4);
  });

  it("clamps negative HP to 0", () => {
    // Negative HP should not produce alpha > maxAlpha
    const alpha = getVignetteAlpha(-50, 100);
    expect(alpha).toBeCloseTo(0.4); // capped at maxAlpha
  });

  it("returns 0 for full HP", () => {
    expect(getVignetteAlpha(100, 100)).toBe(0);
  });
});
