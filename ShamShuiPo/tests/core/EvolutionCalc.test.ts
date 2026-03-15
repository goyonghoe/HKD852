import { describe, it, expect } from "vitest";
import {
  getAvailableEvolutions,
  canEvolve,
  getEvolutionProgress,
} from "../../src/core/EvolutionCalc";
import { EVOLUTIONS } from "../../src/config/balance";
import type { WeaponSlot, PassiveSlot } from "../../src/types/game";

// ── helpers ──────────────────────────────────────────────────────
function weapon(id: string, level = 5): WeaponSlot {
  return { weaponId: id, level, cooldownTimer: 0 };
}
function passive(id: string, level = 1): PassiveSlot {
  return { passiveId: id, level };
}

// ════════════════════════════════════════════════════════════════
// § getAvailableEvolutions
// ════════════════════════════════════════════════════════════════
describe("getAvailableEvolutions", () => {
  it("returns empty array when player has no weapons or passives", () => {
    expect(getAvailableEvolutions([], [])).toEqual([]);
  });

  it("returns evolution when weapon is level 5 and matching passive exists", () => {
    const weapons = [weapon("pistol", 5)];
    const passives = [passive("crit")];
    const result = getAvailableEvolutions(weapons, passives);
    expect(result).toHaveLength(1);
    expect(result[0].result).toBe("evo_pistol");
  });

  it("returns empty when weapon is level 4 (not max)", () => {
    const weapons = [weapon("pistol", 4)];
    const passives = [passive("crit")];
    expect(getAvailableEvolutions(weapons, passives)).toEqual([]);
  });

  it("returns empty when weapon is level 5 but passive is missing", () => {
    const weapons = [weapon("pistol", 5)];
    const passives = [passive("area")]; // wrong passive for pistol
    expect(getAvailableEvolutions(weapons, passives)).toEqual([]);
  });

  it("returns multiple evolutions when conditions are met simultaneously", () => {
    const weapons = [weapon("pistol", 5), weapon("shotgun", 5)];
    const passives = [passive("crit"), passive("area")];
    const result = getAvailableEvolutions(weapons, passives);
    expect(result).toHaveLength(2);
    const ids = result.map((r) => r.result);
    expect(ids).toContain("evo_pistol");
    expect(ids).toContain("evo_shotgun");
  });

  it("filters out already-evolved weapons", () => {
    const weapons = [
      weapon("pistol", 5),
      weapon("evo_pistol", 1), // already evolved
    ];
    const passives = [passive("crit")];
    expect(getAvailableEvolutions(weapons, passives)).toEqual([]);
  });
});

// ════════════════════════════════════════════════════════════════
// § canEvolve
// ════════════════════════════════════════════════════════════════
describe("canEvolve", () => {
  it("returns specific recipe when conditions are met", () => {
    const weapons = [weapon("shotgun", 5)];
    const passives = [passive("area")];
    const recipe = canEvolve("shotgun", weapons, passives);
    expect(recipe).not.toBeNull();
    expect(recipe!.result).toBe("evo_shotgun");
    expect(recipe!.resultName).toBe("Shrapnel Storm");
  });

  it("returns null when weapon level is too low", () => {
    const weapons = [weapon("shotgun", 3)];
    const passives = [passive("area")];
    expect(canEvolve("shotgun", weapons, passives)).toBeNull();
  });

  it("returns null when passive is missing", () => {
    const weapons = [weapon("shotgun", 5)];
    const passives = [passive("crit")]; // wrong passive
    expect(canEvolve("shotgun", weapons, passives)).toBeNull();
  });

  it("returns null for unknown weapon ID", () => {
    const weapons = [weapon("railgun", 5)];
    const passives = [passive("crit")];
    expect(canEvolve("railgun", weapons, passives)).toBeNull();
  });

  it("returns null when evolved weapon already owned", () => {
    const weapons = [weapon("laser", 5), weapon("evo_laser", 1)];
    const passives = [passive("cooldown")];
    expect(canEvolve("laser", weapons, passives)).toBeNull();
  });
});

// ════════════════════════════════════════════════════════════════
// § getEvolutionProgress
// ════════════════════════════════════════════════════════════════
describe("getEvolutionProgress", () => {
  it("shows detailed progress — weapon at level 3, no passive", () => {
    const weapons = [weapon("missile", 3)];
    const passives: PassiveSlot[] = [];
    const progress = getEvolutionProgress("missile", weapons, passives);

    expect(progress.recipe).not.toBeNull();
    expect(progress.recipe!.weapon).toBe("missile");
    expect(progress.hasWeaponMaxLevel).toBe(false);
    expect(progress.hasRequiredPassive).toBe(false);
    expect(progress.weaponLevel).toBe(3);
  });

  it("shows weapon max level reached but passive missing", () => {
    const weapons = [weapon("missile", 5)];
    const passives: PassiveSlot[] = [];
    const progress = getEvolutionProgress("missile", weapons, passives);

    expect(progress.hasWeaponMaxLevel).toBe(true);
    expect(progress.hasRequiredPassive).toBe(false);
  });

  it("shows both conditions met", () => {
    const weapons = [weapon("missile", 5)];
    const passives = [passive("damage")];
    const progress = getEvolutionProgress("missile", weapons, passives);

    expect(progress.hasWeaponMaxLevel).toBe(true);
    expect(progress.hasRequiredPassive).toBe(true);
    expect(progress.weaponLevel).toBe(5);
    expect(progress.recipe!.resultName).toBe("Nuke Launcher");
  });

  it("returns null recipe and zero level for unknown weapon", () => {
    const progress = getEvolutionProgress("railgun", [], []);

    expect(progress.recipe).toBeNull();
    expect(progress.hasWeaponMaxLevel).toBe(false);
    expect(progress.hasRequiredPassive).toBe(false);
    expect(progress.weaponLevel).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § All 8 evolution recipes work correctly
// ════════════════════════════════════════════════════════════════
describe("all 8 evolution recipes", () => {
  it.each(EVOLUTIONS.map((r) => [r.weapon, r.passive, r.result, r.resultName]))(
    "%s + %s → %s (%s)",
    (weaponId, passiveId, resultId) => {
      const weapons = [weapon(weaponId, 5)];
      const passives = [passive(passiveId)];

      // canEvolve should return the recipe
      const recipe = canEvolve(weaponId, weapons, passives);
      expect(recipe).not.toBeNull();
      expect(recipe!.result).toBe(resultId);

      // getAvailableEvolutions should include it
      const available = getAvailableEvolutions(weapons, passives);
      expect(available).toHaveLength(1);
      expect(available[0].result).toBe(resultId);

      // getEvolutionProgress should show both conditions met
      const progress = getEvolutionProgress(weaponId, weapons, passives);
      expect(progress.hasWeaponMaxLevel).toBe(true);
      expect(progress.hasRequiredPassive).toBe(true);
    },
  );
});
