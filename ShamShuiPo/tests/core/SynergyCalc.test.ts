import { describe, it, expect } from "vitest";
import {
  getAllSynergies,
  getActiveSynergies,
  calculateSynergyBonuses,
  getSynergyProgress,
  getSynergyDescription,
  getWeaponSynergies,
  hasSynergy,
} from "../../src/core/SynergyCalc";
import type { SynergyDef } from "../../src/core/SynergyCalc";

// ── helpers ──────────────────────────────────────────────────────
function weapon(id: string, level = 1) {
  return { id, level };
}
function passive(id: string, level = 1) {
  return { id, level };
}

// ════════════════════════════════════════════════════════════════
// § getAllSynergies
// ════════════════════════════════════════════════════════════════
describe("getAllSynergies", () => {
  it("returns 8 synergies", () => {
    expect(getAllSynergies()).toHaveLength(8);
  });

  it("returns a copy (not the internal array)", () => {
    const a = getAllSynergies();
    const b = getAllSynergies();
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });

  it("every synergy has at least one requirement and one bonus", () => {
    for (const s of getAllSynergies()) {
      expect(s.requirements.length).toBeGreaterThanOrEqual(1);
      expect(s.bonuses.length).toBeGreaterThanOrEqual(1);
    }
  });
});

// ════════════════════════════════════════════════════════════════
// § getSynergyProgress
// ════════════════════════════════════════════════════════════════
describe("getSynergyProgress", () => {
  const bulletStorm = getAllSynergies().find((s) => s.id === "bullet_storm")!;

  it("returns 0 when player has no items", () => {
    expect(getSynergyProgress(bulletStorm, [], [])).toBe(0);
  });

  it("returns 0.5 when only one of two requirements is met", () => {
    const weapons = [weapon("pistol", 3)];
    expect(getSynergyProgress(bulletStorm, weapons, [])).toBe(0.5);
  });

  it("returns partial progress for under-leveled items", () => {
    // pistol lv1/3 = 0.333, projectile lv1/2 = 0.5 → avg ≈ 0.417
    const progress = getSynergyProgress(
      bulletStorm,
      [weapon("pistol", 1)],
      [passive("projectile", 1)],
    );
    expect(progress).toBeCloseTo(0.417, 2);
  });

  it("returns 1 when all requirements are fully met", () => {
    expect(
      getSynergyProgress(
        bulletStorm,
        [weapon("pistol", 3)],
        [passive("projectile", 2)],
      ),
    ).toBe(1);
  });

  it("caps individual requirement progress at 1 for over-leveled items", () => {
    expect(
      getSynergyProgress(
        bulletStorm,
        [weapon("pistol", 5)],
        [passive("projectile", 5)],
      ),
    ).toBe(1);
  });
});

// ════════════════════════════════════════════════════════════════
// § getActiveSynergies
// ════════════════════════════════════════════════════════════════
describe("getActiveSynergies", () => {
  it("returns all 8 synergies with no items (all unfulfilled)", () => {
    const active = getActiveSynergies([], []);
    expect(active).toHaveLength(8);
    expect(active.every((a) => !a.fulfilled)).toBe(true);
  });

  it("marks Bullet Storm as fulfilled with correct items", () => {
    const active = getActiveSynergies(
      [weapon("pistol", 3)],
      [passive("projectile", 2)],
    );
    const bs = active.find((a) => a.synergy.id === "bullet_storm")!;
    expect(bs.fulfilled).toBe(true);
    expect(bs.progress).toBe(1);
  });

  it("marks Thunder God as unfulfilled when damage passive is lv2 (needs lv3)", () => {
    const active = getActiveSynergies(
      [weapon("lightning", 3)],
      [passive("damage", 2)],
    );
    const tg = active.find((a) => a.synergy.id === "thunder_god")!;
    expect(tg.fulfilled).toBe(false);
    expect(tg.progress).toBeLessThan(1);
  });

  it("can have multiple synergies fulfilled simultaneously", () => {
    const weapons = [weapon("pistol", 3), weapon("shotgun", 3)];
    const passives = [passive("projectile", 2), passive("area", 2)];
    const active = getActiveSynergies(weapons, passives);
    const fulfilled = active.filter((a) => a.fulfilled);
    expect(fulfilled.length).toBe(2);
  });
});

// ════════════════════════════════════════════════════════════════
// § calculateSynergyBonuses
// ════════════════════════════════════════════════════════════════
describe("calculateSynergyBonuses", () => {
  it("returns empty object when no synergies are fulfilled", () => {
    expect(calculateSynergyBonuses([], [])).toEqual({});
  });

  it("returns +30% fireRate for Bullet Storm", () => {
    const bonuses = calculateSynergyBonuses(
      [weapon("pistol", 3)],
      [passive("projectile", 2)],
    );
    expect(bonuses.fireRate).toBe(30);
  });

  it("returns -25% cooldown for Rocket Barrage", () => {
    const bonuses = calculateSynergyBonuses(
      [weapon("missile", 3)],
      [passive("cooldown", 2)],
    );
    expect(bonuses.cooldown).toBe(-25);
  });

  it("accumulates multiple bonuses from Orbital Defense (armor + orbitSpeed)", () => {
    const bonuses = calculateSynergyBonuses(
      [weapon("orbital", 3)],
      [passive("armor", 2)],
    );
    expect(bonuses.armor).toBe(15);
    expect(bonuses.orbitSpeed).toBe(15);
  });

  it("stacks bonuses when multiple synergies share a stat (Scatter Shot + Inferno → area passives)", () => {
    // Scatter Shot needs area lv2, Inferno needs area lv3
    // Both fulfilled when area is lv3
    const weapons = [weapon("shotgun", 3), weapon("flamethrower", 3)];
    const passives = [passive("area", 3)];
    const bonuses = calculateSynergyBonuses(weapons, passives);
    expect(bonuses.spreadArea).toBe(25);
    expect(bonuses.burnArea).toBe(35);
  });
});

// ════════════════════════════════════════════════════════════════
// § getSynergyDescription
// ════════════════════════════════════════════════════════════════
describe("getSynergyDescription", () => {
  it("includes synergy name", () => {
    const synergy = getAllSynergies().find((s) => s.id === "bullet_storm")!;
    const desc = getSynergyDescription(synergy);
    expect(desc).toContain("Bullet Storm");
  });

  it("includes requirement ids and levels", () => {
    const synergy = getAllSynergies().find((s) => s.id === "laser_focus")!;
    const desc = getSynergyDescription(synergy);
    expect(desc).toContain("laser");
    expect(desc).toContain("lv3");
    expect(desc).toContain("crit");
    expect(desc).toContain("lv2");
  });

  it("includes bonus values with percent sign", () => {
    const synergy = getAllSynergies().find((s) => s.id === "thunder_god")!;
    const desc = getSynergyDescription(synergy);
    expect(desc).toContain("+40%");
    expect(desc).toContain("chainDamage");
  });

  it("shows negative values for cooldown reduction", () => {
    const synergy = getAllSynergies().find((s) => s.id === "rocket_barrage")!;
    const desc = getSynergyDescription(synergy);
    expect(desc).toContain("-25%");
  });
});

// ════════════════════════════════════════════════════════════════
// § getWeaponSynergies
// ════════════════════════════════════════════════════════════════
describe("getWeaponSynergies", () => {
  it("returns 1 synergy for pistol", () => {
    const synergies = getWeaponSynergies("pistol");
    expect(synergies).toHaveLength(1);
    expect(synergies[0].id).toBe("bullet_storm");
  });

  it("returns empty for unknown weapon", () => {
    expect(getWeaponSynergies("banana_launcher")).toEqual([]);
  });

  it("returns correct synergy for each known weapon", () => {
    const weaponSynergyMap: Record<string, string> = {
      pistol: "bullet_storm",
      shotgun: "scatter_shot",
      laser: "laser_focus",
      missile: "rocket_barrage",
      boomerang: "boomerang_master",
      lightning: "thunder_god",
      flamethrower: "inferno",
      orbital: "orbital_defense",
    };
    for (const [weaponId, synergyId] of Object.entries(weaponSynergyMap)) {
      const synergies = getWeaponSynergies(weaponId);
      expect(synergies.some((s) => s.id === synergyId)).toBe(true);
    }
  });
});

// ════════════════════════════════════════════════════════════════
// § hasSynergy
// ════════════════════════════════════════════════════════════════
describe("hasSynergy", () => {
  it("returns false for unknown synergy id", () => {
    expect(hasSynergy("nonexistent", [], [])).toBe(false);
  });

  it("returns false when requirements not met", () => {
    expect(hasSynergy("bullet_storm", [], [])).toBe(false);
  });

  it("returns false when weapon level is too low", () => {
    expect(
      hasSynergy(
        "bullet_storm",
        [weapon("pistol", 2)],
        [passive("projectile", 2)],
      ),
    ).toBe(false);
  });

  it("returns true when all requirements met exactly", () => {
    expect(
      hasSynergy(
        "bullet_storm",
        [weapon("pistol", 3)],
        [passive("projectile", 2)],
      ),
    ).toBe(true);
  });

  it("returns true when items exceed required levels", () => {
    expect(
      hasSynergy(
        "thunder_god",
        [weapon("lightning", 5)],
        [passive("damage", 5)],
      ),
    ).toBe(true);
  });
});
