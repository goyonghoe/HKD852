// ── Tests: WeaponCalc ──

import { describe, it, expect } from "vitest";
import {
  calculateDamage,
  calculateFireRate,
  getProjectileCount,
  getWeaponArea,
  getPierceCount,
  checkEvolution,
  calculateCritDamage,
} from "../../src/core/WeaponCalc";
import {
  WEAPONS,
  WEAPON_LEVEL_SCALING,
  PLAYER_BASE,
} from "../../src/config/balance";
import type { PassiveSlot } from "../../src/types/game";

describe("calculateDamage", () => {
  it("returns base damage at level 1 with no passives", () => {
    const dmg = calculateDamage("pistol", 1, []);
    expect(dmg).toBe(WEAPONS.pistol.baseDamage);
  });

  it("scales damage with weapon level", () => {
    const dmg1 = calculateDamage("pistol", 1, []);
    const dmg3 = calculateDamage("pistol", 3, []);
    expect(dmg3).toBeGreaterThan(dmg1);
  });

  it("applies passive damage bonus", () => {
    const passives: PassiveSlot[] = [{ passiveId: "damage", level: 1 }];
    const dmgBase = calculateDamage("pistol", 1, []);
    const dmgWithPassive = calculateDamage("pistol", 1, passives);
    expect(dmgWithPassive).toBeGreaterThan(dmgBase);
  });

  it("applies meta damage bonus", () => {
    const dmgBase = calculateDamage("pistol", 1, []);
    const dmgWithMeta = calculateDamage("pistol", 1, [], 0.2);
    expect(dmgWithMeta).toBeGreaterThan(dmgBase);
  });

  it("returns 0 for unknown weapon", () => {
    const dmg = calculateDamage("nonexistent", 1, []);
    expect(dmg).toBe(0);
  });
});

describe("calculateFireRate", () => {
  it("returns base fire rate at level 1", () => {
    const rate = calculateFireRate("pistol", 1, []);
    expect(rate).toBe(WEAPONS.pistol.fireRate);
  });

  it("increases with weapon level", () => {
    const rate1 = calculateFireRate("pistol", 1, []);
    const rate5 = calculateFireRate("pistol", 5, []);
    expect(rate5).toBeGreaterThan(rate1);
  });

  it("increases with cooldown passive", () => {
    const passives: PassiveSlot[] = [{ passiveId: "cooldown", level: 1 }];
    const rateBase = calculateFireRate("pistol", 1, []);
    const rateWithCd = calculateFireRate("pistol", 1, passives);
    expect(rateWithCd).toBeGreaterThan(rateBase);
  });
});

describe("getProjectileCount", () => {
  it("returns base projectile count at level 1", () => {
    const count = getProjectileCount("shotgun", 1, []);
    expect(count).toBe(WEAPONS.shotgun.projectileCount);
  });

  it("adds level bonus at higher levels", () => {
    const count1 = getProjectileCount("pistol", 1, []);
    const count5 = getProjectileCount("pistol", 5, []);
    expect(count5).toBeGreaterThan(count1);
  });

  it("adds projectile passive bonus", () => {
    const passives: PassiveSlot[] = [{ passiveId: "projectile", level: 1 }];
    const countBase = getProjectileCount("pistol", 1, []);
    const countWithPassive = getProjectileCount("pistol", 1, passives);
    expect(countWithPassive).toBe(countBase + 1);
  });
});

describe("getWeaponArea", () => {
  it("returns base area at level 1", () => {
    const area = getWeaponArea("missile", 1, []);
    expect(area).toBe(WEAPONS.missile.area);
  });

  it("scales with area passive", () => {
    const passives: PassiveSlot[] = [{ passiveId: "area", level: 1 }];
    const areaBase = getWeaponArea("missile", 1, []);
    const areaWithPassive = getWeaponArea("missile", 1, passives);
    expect(areaWithPassive).toBeGreaterThan(areaBase);
  });
});

describe("getPierceCount", () => {
  it("returns base pierce at level 1", () => {
    const pierce = getPierceCount("laser", 1);
    expect(pierce).toBe(WEAPONS.laser.pierce);
  });

  it("adds pierce bonus at higher levels", () => {
    const pierce1 = getPierceCount("laser", 1);
    const pierce5 = getPierceCount("laser", 5);
    expect(pierce5).toBeGreaterThan(pierce1);
  });
});

describe("checkEvolution", () => {
  it("returns null when weapon not at max level", () => {
    const result = checkEvolution("pistol", 3, ["crit"]);
    expect(result).toBeNull();
  });

  it("returns null when required passive not owned", () => {
    const maxLevel = WEAPON_LEVEL_SCALING.damageMultiplier.length;
    const result = checkEvolution("pistol", maxLevel, ["damage"]);
    expect(result).toBeNull();
  });

  it("returns recipe when conditions met", () => {
    const maxLevel = WEAPON_LEVEL_SCALING.damageMultiplier.length;
    const result = checkEvolution("pistol", maxLevel, ["crit"]);
    expect(result).not.toBeNull();
    expect(result!.result).toBe("evo_pistol");
  });
});

describe("calculateCritDamage", () => {
  it("applies base crit multiplier", () => {
    const critDmg = calculateCritDamage(100, []);
    expect(critDmg).toBe(Math.round(100 * PLAYER_BASE.critMultiplier));
  });

  it("adds crit_dmg passive bonus", () => {
    const passives: PassiveSlot[] = [{ passiveId: "crit_dmg", level: 1 }];
    const critBase = calculateCritDamage(100, []);
    const critWithPassive = calculateCritDamage(100, passives);
    expect(critWithPassive).toBeGreaterThan(critBase);
  });
});
