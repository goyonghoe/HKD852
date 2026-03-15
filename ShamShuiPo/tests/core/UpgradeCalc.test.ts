// ── Tests: UpgradeCalc ──

import { describe, it, expect } from "vitest";
import { generateUpgradeChoices } from "../../src/core/UpgradeCalc";
import {
  WEAPONS,
  PASSIVES,
  RUN,
  WEAPON_LEVEL_SCALING,
} from "../../src/config/balance";
import type { WeaponSlot, PassiveSlot, UpgradeChoice } from "../../src/types/game";

describe("generateUpgradeChoices", () => {
  it("returns the requested number of choices", () => {
    const weapons: WeaponSlot[] = [
      { weaponId: "pistol", level: 1, cooldownTimer: 0 },
    ];
    const passives: PassiveSlot[] = [];
    const choices = generateUpgradeChoices(weapons, passives, 3);
    expect(choices.length).toBeLessThanOrEqual(3);
    expect(choices.length).toBeGreaterThan(0);
  });

  it("returns default number of choices (RUN.upgradeChoices)", () => {
    const weapons: WeaponSlot[] = [
      { weaponId: "pistol", level: 1, cooldownTimer: 0 },
    ];
    const choices = generateUpgradeChoices(weapons, []);
    expect(choices.length).toBeLessThanOrEqual(RUN.upgradeChoices);
    expect(choices.length).toBeGreaterThan(0);
  });

  it("offers no duplicate IDs", () => {
    const weapons: WeaponSlot[] = [
      { weaponId: "pistol", level: 1, cooldownTimer: 0 },
    ];
    const choices = generateUpgradeChoices(weapons, [], 3);
    const ids = choices.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("can offer new weapons when slots available", () => {
    const weapons: WeaponSlot[] = [
      { weaponId: "pistol", level: 1, cooldownTimer: 0 },
    ];
    // Run multiple times to account for randomness
    let foundNewWeapon = false;
    for (let i = 0; i < 50; i++) {
      const choices = generateUpgradeChoices(weapons, [], 3);
      if (choices.some((c) => c.type === "weapon" && c.isNew)) {
        foundNewWeapon = true;
        break;
      }
    }
    expect(foundNewWeapon).toBe(true);
  });

  it("can offer weapon upgrades for existing weapons", () => {
    const weapons: WeaponSlot[] = [
      { weaponId: "pistol", level: 1, cooldownTimer: 0 },
      { weaponId: "shotgun", level: 2, cooldownTimer: 0 },
    ];
    let foundUpgrade = false;
    for (let i = 0; i < 50; i++) {
      const choices = generateUpgradeChoices(weapons, [], 3);
      if (choices.some((c) => c.type === "weapon" && !c.isNew)) {
        foundUpgrade = true;
        break;
      }
    }
    expect(foundUpgrade).toBe(true);
  });

  it("can offer passive upgrades", () => {
    const weapons: WeaponSlot[] = [
      { weaponId: "pistol", level: 1, cooldownTimer: 0 },
    ];
    let foundPassive = false;
    for (let i = 0; i < 50; i++) {
      const choices = generateUpgradeChoices(weapons, [], 3);
      if (choices.some((c) => c.type === "passive")) {
        foundPassive = true;
        break;
      }
    }
    expect(foundPassive).toBe(true);
  });

  it("does not offer weapons beyond max level", () => {
    const maxLevel = WEAPON_LEVEL_SCALING.damageMultiplier.length;
    const weapons: WeaponSlot[] = [
      { weaponId: "pistol", level: maxLevel, cooldownTimer: 0 },
    ];
    for (let i = 0; i < 20; i++) {
      const choices = generateUpgradeChoices(weapons, [], 3);
      const pistolUpgrade = choices.find(
        (c) => c.id === "pistol" && c.type === "weapon",
      );
      expect(pistolUpgrade).toBeUndefined();
    }
  });

  it("does not offer passives beyond max level", () => {
    const weapons: WeaponSlot[] = [
      { weaponId: "pistol", level: 1, cooldownTimer: 0 },
    ];
    const passives: PassiveSlot[] = [
      { passiveId: "damage", level: PASSIVES.damage.maxLevel },
    ];
    for (let i = 0; i < 20; i++) {
      const choices = generateUpgradeChoices(weapons, passives, 3);
      const dmgUpgrade = choices.find(
        (c) => c.id === "damage" && c.type === "passive",
      );
      expect(dmgUpgrade).toBeUndefined();
    }
  });

  it("prioritizes evolution when conditions met", () => {
    const maxLevel = WEAPON_LEVEL_SCALING.damageMultiplier.length;
    const weapons: WeaponSlot[] = [
      { weaponId: "pistol", level: maxLevel, cooldownTimer: 0 },
    ];
    const passives: PassiveSlot[] = [{ passiveId: "crit", level: 1 }];
    const choices = generateUpgradeChoices(weapons, passives, 3);
    // Evolution should be offered (pistol + crit = evo_pistol)
    const evo = choices.find((c) => c.type === "evolution");
    expect(evo).toBeDefined();
    expect(evo!.id).toBe("evo_pistol");
  });

  it("handles fully maxed out loadout gracefully", () => {
    const maxLevel = WEAPON_LEVEL_SCALING.damageMultiplier.length;
    // Fill all weapon slots at max level
    const weaponIds = Object.keys(WEAPONS).slice(0, RUN.maxWeaponSlots);
    const weapons: WeaponSlot[] = weaponIds.map((id) => ({
      weaponId: id,
      level: maxLevel,
      cooldownTimer: 0,
    }));
    // Fill all passive slots at max level
    const passiveIds = Object.keys(PASSIVES).slice(0, RUN.maxPassiveSlots);
    const passives: PassiveSlot[] = passiveIds.map((id) => ({
      passiveId: id,
      level: PASSIVES[id].maxLevel,
    }));
    // Should not throw, may return fewer choices
    const choices = generateUpgradeChoices(weapons, passives, 3);
    expect(Array.isArray(choices)).toBe(true);
  });

  it("each choice has valid type field", () => {
    const weapons: WeaponSlot[] = [
      { weaponId: "pistol", level: 1, cooldownTimer: 0 },
    ];
    const choices = generateUpgradeChoices(weapons, [], 3);
    for (const choice of choices) {
      expect(["weapon", "passive", "evolution"]).toContain(choice.type);
    }
  });
});
