// ── Tests: CombatStatsCalc ──

import { describe, it, expect } from "vitest";
import {
  calculateWeaponDps,
  calculateTotalDps,
  calculateTTK,
  calculateSurvivability,
  calculateBuildSummary,
} from "../../src/core/CombatStatsCalc";
import { WEAPONS, WEAPON_LEVEL_SCALING } from "../../src/config/balance";
import type { WeaponSlot } from "../../src/types/game";

// ════════════════════════════════════════════════════════════════
// § calculateWeaponDps
// ════════════════════════════════════════════════════════════════

describe("calculateWeaponDps", () => {
  it("pistol level 1 base DPS = 10 * 2.0 * 1 = 20", () => {
    const info = calculateWeaponDps("pistol", 1, 0);
    expect(info.baseDps).toBe(20);
    expect(info.effectiveDps).toBe(20);
    expect(info.fireRate).toBe(2.0);
    expect(info.damagePerHit).toBe(10);
    expect(info.projectileCount).toBe(1);
  });

  it("pistol level 5 applies scaling multipliers", () => {
    const info = calculateWeaponDps("pistol", 5, 0);
    // level 5 index=4: dmg*2.5, fireRate*1.5, projBonus+2
    const expectedDamage = 10 * 2.5;
    const expectedFireRate = 2.0 * 1.5;
    const expectedProj = 1 + 2;
    const expectedDps = expectedDamage * expectedFireRate * expectedProj;

    expect(info.damagePerHit).toBe(expectedDamage);
    expect(info.fireRate).toBe(expectedFireRate);
    expect(info.projectileCount).toBe(expectedProj);
    expect(info.effectiveDps).toBe(expectedDps);
    // baseDps stays unscaled
    expect(info.baseDps).toBe(20);
  });

  it("shotgun level 1 base DPS = 8 * 0.8 * 5 = 32", () => {
    const info = calculateWeaponDps("shotgun", 1, 0);
    expect(info.baseDps).toBe(32);
    expect(info.effectiveDps).toBe(32);
    expect(info.projectileCount).toBe(5);
  });

  it("damage bonus multiplier applies correctly", () => {
    const noBonus = calculateWeaponDps("pistol", 1, 0);
    const withBonus = calculateWeaponDps("pistol", 1, 0.5);
    // damagePerHit should be 10 * 1.0 * (1+0.5) = 15
    expect(withBonus.damagePerHit).toBe(15);
    // effectiveDps should be 15 * 2.0 * 1 = 30
    expect(withBonus.effectiveDps).toBe(30);
    expect(withBonus.effectiveDps).toBe(noBonus.effectiveDps * 1.5);
  });

  it("unknown weapon returns zero for all values", () => {
    const info = calculateWeaponDps("nonexistent_weapon", 1, 0);
    expect(info.weaponId).toBe("nonexistent_weapon");
    expect(info.baseDps).toBe(0);
    expect(info.effectiveDps).toBe(0);
    expect(info.fireRate).toBe(0);
    expect(info.damagePerHit).toBe(0);
    expect(info.projectileCount).toBe(0);
  });

  it("clamps level below 1 to index 0", () => {
    const info = calculateWeaponDps("pistol", 0, 0);
    expect(info.effectiveDps).toBe(20); // same as level 1
  });

  it("clamps level above 5 to index 4", () => {
    const info5 = calculateWeaponDps("pistol", 5, 0);
    const info9 = calculateWeaponDps("pistol", 9, 0);
    expect(info9.effectiveDps).toBe(info5.effectiveDps);
  });
});

// ════════════════════════════════════════════════════════════════
// § calculateTotalDps
// ════════════════════════════════════════════════════════════════

describe("calculateTotalDps", () => {
  it("sums DPS from multiple weapons", () => {
    const weapons: WeaponSlot[] = [
      { weaponId: "pistol", level: 1, cooldownTimer: 0 },
      { weaponId: "shotgun", level: 1, cooldownTimer: 0 },
    ];
    const total = calculateTotalDps(weapons, 0);
    // pistol=20 + shotgun=32 = 52
    expect(total).toBe(52);
  });

  it("returns 0 for empty weapon list", () => {
    expect(calculateTotalDps([], 0)).toBe(0);
  });

  it("applies damage bonus across all weapons", () => {
    const weapons: WeaponSlot[] = [
      { weaponId: "pistol", level: 1, cooldownTimer: 0 },
    ];
    const total = calculateTotalDps(weapons, 0.5);
    expect(total).toBe(30); // 10*1.5*2.0*1
  });
});

// ════════════════════════════════════════════════════════════════
// § calculateTTK
// ════════════════════════════════════════════════════════════════

describe("calculateTTK", () => {
  it("TTK for drone (15 HP) with pistol = 15/20 = 0.75s", () => {
    const weapons: WeaponSlot[] = [
      { weaponId: "pistol", level: 1, cooldownTimer: 0 },
    ];
    const ttk = calculateTTK(weapons, 0, 15);
    expect(ttk).toBe(0.75);
  });

  it("returns Infinity with zero DPS (no weapons)", () => {
    const ttk = calculateTTK([], 0, 100);
    expect(ttk).toBe(Infinity);
  });

  it("returns Infinity with unknown weapon only", () => {
    const weapons: WeaponSlot[] = [
      { weaponId: "nonexistent", level: 1, cooldownTimer: 0 },
    ];
    const ttk = calculateTTK(weapons, 0, 100);
    expect(ttk).toBe(Infinity);
  });

  it("TTK decreases with higher weapon level", () => {
    const w1: WeaponSlot[] = [
      { weaponId: "pistol", level: 1, cooldownTimer: 0 },
    ];
    const w5: WeaponSlot[] = [
      { weaponId: "pistol", level: 5, cooldownTimer: 0 },
    ];
    const ttk1 = calculateTTK(w1, 0, 150);
    const ttk5 = calculateTTK(w5, 0, 150);
    expect(ttk5).toBeLessThan(ttk1);
  });
});

// ════════════════════════════════════════════════════════════════
// § calculateSurvivability
// ════════════════════════════════════════════════════════════════

describe("calculateSurvivability", () => {
  it("basic stats with no armor or regen", () => {
    const stats = calculateSurvivability(100, 0, 0, 10);
    expect(stats.effectiveHp).toBe(100);
    expect(stats.ehpWithArmor).toBe(100); // no armor → no change
    expect(stats.survivalTimeAtDps).toBe(10); // 100/10
  });

  it("armor reduces effective hit damage and increases EHP", () => {
    // incomingDps=10, 2 hits/sec → 5 dmg/hit, armor=2 → 3 dmg/hit effective
    const stats = calculateSurvivability(100, 2, 0, 10);
    expect(stats.hitsToKill).toBeCloseTo(100 / 3, 5);
    expect(stats.ehpWithArmor).toBeGreaterThan(100);
    // ehpWithArmor = 100 * (5/3) ≈ 166.67
    expect(stats.ehpWithArmor).toBeCloseTo(166.667, 1);
  });

  it("regen extends survival time", () => {
    const noRegen = calculateSurvivability(100, 0, 0, 10);
    const withRegen = calculateSurvivability(100, 0, 5, 10);
    // noRegen: 100/10 = 10s
    // withRegen: 100/(10-5) = 20s
    expect(withRegen.survivalTimeAtDps).toBe(20);
    expect(withRegen.survivalTimeAtDps).toBeGreaterThan(
      noRegen.survivalTimeAtDps,
    );
  });

  it("regen >= incomingDps yields Infinity survival", () => {
    const stats = calculateSurvivability(100, 0, 10, 10);
    expect(stats.survivalTimeAtDps).toBe(Infinity);
  });

  it("zero incomingDps yields Infinity survival and base EHP", () => {
    const stats = calculateSurvivability(100, 5, 0, 0);
    expect(stats.survivalTimeAtDps).toBe(Infinity);
    expect(stats.ehpWithArmor).toBe(100);
  });

  it("armor cannot reduce hit damage below 1", () => {
    // incomingDps=4, 2 hits/sec → 2 dmg/hit, armor=10 → clamped to 1
    const stats = calculateSurvivability(100, 10, 0, 4);
    expect(stats.hitsToKill).toBe(100); // 100 / max(1, 2-10) = 100/1
  });
});

// ════════════════════════════════════════════════════════════════
// § calculateBuildSummary
// ════════════════════════════════════════════════════════════════

describe("calculateBuildSummary", () => {
  it("returns per-weapon breakdown and total", () => {
    const weapons: WeaponSlot[] = [
      { weaponId: "pistol", level: 1, cooldownTimer: 0 },
      { weaponId: "shotgun", level: 1, cooldownTimer: 0 },
      { weaponId: "laser", level: 1, cooldownTimer: 0 },
    ];
    const summary = calculateBuildSummary(weapons, 0);

    expect(summary.weaponCount).toBe(3);
    expect(summary.perWeapon).toHaveLength(3);
    expect(summary.perWeapon[0].weaponId).toBe("pistol");
    expect(summary.perWeapon[1].weaponId).toBe("shotgun");
    expect(summary.perWeapon[2].weaponId).toBe("laser");

    // pistol=20, shotgun=32, laser=4*8*1=32 → total=84
    expect(summary.totalDps).toBe(84);
    expect(summary.totalDps).toBe(
      summary.perWeapon.reduce((s, w) => s + w.effectiveDps, 0),
    );
  });

  it("empty weapons returns zero total", () => {
    const summary = calculateBuildSummary([], 0);
    expect(summary.totalDps).toBe(0);
    expect(summary.weaponCount).toBe(0);
    expect(summary.perWeapon).toHaveLength(0);
  });

  it("damage bonus applies to all weapons in summary", () => {
    const weapons: WeaponSlot[] = [
      { weaponId: "pistol", level: 1, cooldownTimer: 0 },
    ];
    const base = calculateBuildSummary(weapons, 0);
    const boosted = calculateBuildSummary(weapons, 1.0); // +100% damage
    expect(boosted.totalDps).toBe(base.totalDps * 2);
  });
});
