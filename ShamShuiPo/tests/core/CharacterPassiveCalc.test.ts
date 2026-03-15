import { describe, it, expect } from "vitest";
import {
  calculateEffectiveStats,
  getStartingWeapon,
  getCharacterBonus,
  type PassiveSlot,
} from "../../src/core/CharacterPassiveCalc";

describe("CharacterPassiveCalc", () => {
  // ── Character passive bonuses (no in-run passives) ──

  it("biker base stats: speed should be 165 (150 * 1.1)", () => {
    const stats = calculateEffectiveStats("biker", []);
    expect(stats.speed).toBeCloseTo(165);
    expect(stats.hp).toBe(100);
    expect(stats.damage).toBeCloseTo(1.0);
  });

  it("punk base stats: damage multiplier should be 1.15", () => {
    const stats = calculateEffectiveStats("punk", []);
    expect(stats.damage).toBeCloseTo(1.15);
    expect(stats.speed).toBe(150);
    expect(stats.hp).toBe(100);
  });

  it("cyborg base stats: hp should be 120 (100 * 1.2)", () => {
    const stats = calculateEffectiveStats("cyborg", []);
    expect(stats.hp).toBeCloseTo(120);
    expect(stats.speed).toBe(150);
    expect(stats.damage).toBeCloseTo(1.0);
  });

  // ── In-run passive upgrades ──

  it("passive hp level 3 adds 60 flat HP", () => {
    const slots: PassiveSlot[] = [{ passiveId: "hp", level: 3 }];
    const stats = calculateEffectiveStats("biker", slots);
    // base 100 * 1.1 (biker move_speed, not hp) = 100 + 60 = 160
    expect(stats.hp).toBe(160);
  });

  it("passive armor level 2 adds 2 flat armor", () => {
    const slots: PassiveSlot[] = [{ passiveId: "armor", level: 2 }];
    const stats = calculateEffectiveStats("biker", slots);
    expect(stats.armor).toBe(2);
  });

  it("passive regen level 1 adds 0.5 HP/sec", () => {
    const slots: PassiveSlot[] = [{ passiveId: "regen", level: 1 }];
    const stats = calculateEffectiveStats("biker", slots);
    expect(stats.regenPerSec).toBeCloseTo(0.5);
  });

  it("passive magnet level 4 adds 95px", () => {
    const slots: PassiveSlot[] = [{ passiveId: "magnet", level: 4 }];
    const stats = calculateEffectiveStats("biker", slots);
    // base 50 + 95 = 145
    expect(stats.magnetRadius).toBe(145);
  });

  it("multiple passives stack correctly", () => {
    const slots: PassiveSlot[] = [
      { passiveId: "hp", level: 2 }, // +40 flat
      { passiveId: "armor", level: 3 }, // +3 flat
      { passiveId: "regen", level: 2 }, // +1.0 flat
      { passiveId: "magnet", level: 1 }, // +20px
    ];
    const stats = calculateEffectiveStats("cyborg", slots);
    // cyborg hp: 100 * 1.2 = 120, + 40 = 160
    expect(stats.hp).toBeCloseTo(160);
    expect(stats.armor).toBe(3);
    expect(stats.regenPerSec).toBeCloseTo(1.0);
    // magnet: 50 + 20 = 70
    expect(stats.magnetRadius).toBe(70);
  });

  // ── Meta bonuses ──

  it("meta bonuses apply on top of character + passives", () => {
    const slots: PassiveSlot[] = [{ passiveId: "hp", level: 1 }]; // +20 flat
    const meta = {
      hpBonus: 25,
      damageBonus: 0.1,
      speedBonus: 0.05,
      magnetBonus: 15,
    };
    const stats = calculateEffectiveStats("punk", slots, meta);

    // hp: base 100 + 20 (passive) + 25 (meta) = 145
    expect(stats.hp).toBeCloseTo(145);
    // damage: 1.0 * 1.15 (punk) * 1.0 (no damage passive) * 1.1 (meta) = 1.265
    expect(stats.damage).toBeCloseTo(1.265);
    // speed: 150 * 1.05 (meta) = 157.5
    expect(stats.speed).toBeCloseTo(157.5);
    // magnet: 50 + 15 = 65
    expect(stats.magnetRadius).toBe(65);
  });

  // ── Unknown character fallback ──

  it("unknown character falls back to biker", () => {
    const stats = calculateEffectiveStats("unknown_hero", []);
    // Should behave like biker: speed = 150 * 1.1 = 165
    expect(stats.speed).toBeCloseTo(165);
    expect(stats.hp).toBe(100);
  });

  // ── getStartingWeapon ──

  it("getStartingWeapon returns correct weapon for each character", () => {
    expect(getStartingWeapon("biker")).toBe("pistol");
    expect(getStartingWeapon("punk")).toBe("shotgun");
    expect(getStartingWeapon("cyborg")).toBe("laser");
  });

  it("getStartingWeapon falls back to biker weapon for unknown", () => {
    expect(getStartingWeapon("nonexistent")).toBe("pistol");
  });

  // ── Crit passives ──

  it("passive crit + crit_dmg both apply", () => {
    const slots: PassiveSlot[] = [
      { passiveId: "crit", level: 3 }, // +0.15 crit chance
      { passiveId: "crit_dmg", level: 2 }, // +0.4 crit multiplier
    ];
    const stats = calculateEffectiveStats("biker", slots);
    // critChance: 0.05 (base) + 0.15 = 0.20
    expect(stats.critChance).toBeCloseTo(0.2);
    // critMultiplier: 1.5 (base) + 0.4 = 1.9
    expect(stats.critMultiplier).toBeCloseTo(1.9);
  });

  // ── getCharacterBonus ──

  it("getCharacterBonus returns correct display text", () => {
    const bikerBonus = getCharacterBonus("biker");
    expect(bikerBonus.stat).toBe("move_speed");
    expect(bikerBonus.value).toBe(0.1);
    expect(bikerBonus.displayText).toBe("+10% Move Speed");

    const punkBonus = getCharacterBonus("punk");
    expect(punkBonus.stat).toBe("damage");
    expect(punkBonus.displayText).toBe("+15% Damage");

    const cyborgBonus = getCharacterBonus("cyborg");
    expect(cyborgBonus.stat).toBe("max_hp");
    expect(cyborgBonus.displayText).toBe("+20% Max HP");
  });
});
