import { describe, it, expect } from "vitest";
import {
  getWeaponVisual,
  getProjectileSize,
} from "../../src/core/WeaponVisualCalc";

describe("getWeaponVisual", () => {
  it("returns circle/cyan for pistol", () => {
    const v = getWeaponVisual("pistol");
    expect(v.shape).toBe("circle");
    expect(v.color).toBe(0x00ffff);
    expect(v.width).toBe(4);
  });

  it("returns circle/orange for shotgun", () => {
    const v = getWeaponVisual("shotgun");
    expect(v.shape).toBe("circle");
    expect(v.color).toBe(0xff8800);
    expect(v.glow).toBe(false);
    expect(v.trail).toBe(false);
  });

  it("returns line/cyan with glow+trail for laser", () => {
    const v = getWeaponVisual("laser");
    expect(v.shape).toBe("line");
    expect(v.color).toBe(0x00ffff);
    expect(v.height).toBe(60);
    expect(v.glow).toBe(true);
    expect(v.trail).toBe(true);
    expect(v.trailColor).toBe(0x00ffff);
  });

  it("returns triangle/red with orange trail for missile", () => {
    const v = getWeaponVisual("missile");
    expect(v.shape).toBe("triangle");
    expect(v.color).toBe(0xff4444);
    expect(v.trailColor).toBe(0xff6600);
  });

  it("returns rect/green with trail for boomerang", () => {
    const v = getWeaponVisual("boomerang");
    expect(v.shape).toBe("rect");
    expect(v.color).toBe(0x00ff88);
    expect(v.trail).toBe(true);
  });

  it("returns line/yellow with glow for lightning", () => {
    const v = getWeaponVisual("lightning");
    expect(v.shape).toBe("line");
    expect(v.color).toBe(0xffff00);
    expect(v.glow).toBe(true);
    expect(v.trail).toBe(false);
  });

  it("returns circle/orange-red with red trail for flamethrower", () => {
    const v = getWeaponVisual("flamethrower");
    expect(v.shape).toBe("circle");
    expect(v.color).toBe(0xff4400);
    expect(v.glow).toBe(true);
    expect(v.trailColor).toBe(0xff0000);
  });

  it("returns default white circle for unknown weapon", () => {
    const v = getWeaponVisual("unknown_weapon");
    expect(v.shape).toBe("circle");
    expect(v.color).toBe(0xffffff);
    expect(v.width).toBe(4);
    expect(v.glow).toBe(false);
    expect(v.trail).toBe(false);
  });
});

describe("getProjectileSize", () => {
  it("returns base size at level 1", () => {
    const size = getProjectileSize("pistol", 1);
    expect(size).toBe(4); // 4 * 1.0
  });

  it("scales to 1.6x at level 5", () => {
    const size = getProjectileSize("pistol", 5);
    expect(size).toBeCloseTo(4 * 1.6); // 4 * (1 + 4*0.15) = 6.4
  });

  it("scales missile width with level", () => {
    const size = getProjectileSize("missile", 3);
    expect(size).toBeCloseTo(8 * 1.3); // 8 * (1 + 2*0.15) = 10.4
  });
});
