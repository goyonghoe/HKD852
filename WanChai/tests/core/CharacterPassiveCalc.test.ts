import { describe, it, expect } from 'vitest';
import { applyCharacterPassive, type PlayerStats } from '../../src/core/CharacterPassiveCalc';
import { CHARACTERS, CHARACTER_LIST } from '../../src/config/characters';

function baseStats(): PlayerStats {
  return {
    attackSpeedMultiplier: 1,
    critChance: 0,
    damageMultiplier: 1,
    baseHp: 600,
    baseMaxHp: 600,
  };
}

describe('applyCharacterPassive', () => {
  it('HAI — attackSpeed +15% increases attackSpeedMultiplier', () => {
    const stats = baseStats();
    applyCharacterPassive(stats, CHARACTERS.hai.passive);
    expect(stats.attackSpeedMultiplier).toBeCloseTo(1.15);
    expect(stats.critChance).toBe(0);
    expect(stats.damageMultiplier).toBe(1);
    expect(stats.baseHp).toBe(600);
  });

  it('NOVA — critChance +10% adds to critChance', () => {
    const stats = baseStats();
    applyCharacterPassive(stats, CHARACTERS.nova.passive);
    expect(stats.critChance).toBeCloseTo(0.1);
    expect(stats.attackSpeedMultiplier).toBe(1);
    expect(stats.damageMultiplier).toBe(1);
  });

  it('SOL — damage +10% increases damageMultiplier', () => {
    const stats = baseStats();
    applyCharacterPassive(stats, CHARACTERS.sol.passive);
    expect(stats.damageMultiplier).toBeCloseTo(1.1);
    expect(stats.attackSpeedMultiplier).toBe(1);
    expect(stats.critChance).toBe(0);
  });

  it('MEI — cooldown -10% increases attackSpeedMultiplier', () => {
    const stats = baseStats();
    applyCharacterPassive(stats, CHARACTERS.mei.passive);
    expect(stats.attackSpeedMultiplier).toBeCloseTo(1.1);
    expect(stats.damageMultiplier).toBe(1);
  });

  it('KAI — hp +20% increases baseHp and baseMaxHp', () => {
    const stats = baseStats();
    applyCharacterPassive(stats, CHARACTERS.kai.passive);
    expect(stats.baseHp).toBe(720); // ceil(600 * 1.2)
    expect(stats.baseMaxHp).toBe(720);
    expect(stats.attackSpeedMultiplier).toBe(1);
  });

  it('hp passive syncs baseMaxHp to baseHp', () => {
    const stats = baseStats();
    stats.baseMaxHp = 999; // intentionally different
    applyCharacterPassive(stats, { type: 'hp', value: 0.5 });
    expect(stats.baseHp).toBe(900); // ceil(600 * 1.5)
    expect(stats.baseMaxHp).toBe(stats.baseHp);
  });

  it('stacks with pre-existing meta bonuses', () => {
    const stats = baseStats();
    stats.damageMultiplier = 1.2; // meta damage bonus already applied
    stats.critChance = 0.05; // meta crit bonus already applied
    applyCharacterPassive(stats, CHARACTERS.sol.passive);
    expect(stats.damageMultiplier).toBeCloseTo(1.2 * 1.1); // multiplicative
  });

  it('stacks critChance additively with meta', () => {
    const stats = baseStats();
    stats.critChance = 0.05;
    applyCharacterPassive(stats, CHARACTERS.nova.passive);
    expect(stats.critChance).toBeCloseTo(0.15); // additive
  });

  it('does not modify other stats for each passive type', () => {
    for (const char of CHARACTER_LIST) {
      const stats = baseStats();
      const before = { ...stats };
      applyCharacterPassive(stats, char.passive);

      switch (char.passive.type) {
        case 'attackSpeed':
        case 'cooldown':
          expect(stats.critChance).toBe(before.critChance);
          expect(stats.damageMultiplier).toBe(before.damageMultiplier);
          expect(stats.baseHp).toBe(before.baseHp);
          break;
        case 'critChance':
          expect(stats.attackSpeedMultiplier).toBe(before.attackSpeedMultiplier);
          expect(stats.damageMultiplier).toBe(before.damageMultiplier);
          expect(stats.baseHp).toBe(before.baseHp);
          break;
        case 'damage':
          expect(stats.attackSpeedMultiplier).toBe(before.attackSpeedMultiplier);
          expect(stats.critChance).toBe(before.critChance);
          expect(stats.baseHp).toBe(before.baseHp);
          break;
        case 'hp':
          expect(stats.attackSpeedMultiplier).toBe(before.attackSpeedMultiplier);
          expect(stats.critChance).toBe(before.critChance);
          expect(stats.damageMultiplier).toBe(before.damageMultiplier);
          break;
      }
    }
  });

  it('all 5 characters have defined passives', () => {
    expect(CHARACTER_LIST.length).toBe(5);
    const types = CHARACTER_LIST.map((c) => c.passive.type);
    expect(types).toContain('attackSpeed');
    expect(types).toContain('critChance');
    expect(types).toContain('damage');
    expect(types).toContain('cooldown');
    expect(types).toContain('hp');
  });

  it('all passive values are positive and <= 1', () => {
    for (const char of CHARACTER_LIST) {
      expect(char.passive.value).toBeGreaterThan(0);
      expect(char.passive.value).toBeLessThanOrEqual(1);
    }
  });
});

describe('CharacterSelect → RunScene wiring', () => {
  it('each character has a valid startWeapon', () => {
    for (const char of CHARACTER_LIST) {
      expect(char.startWeapon).toBeTruthy();
      expect(typeof char.startWeapon).toBe('string');
    }
  });

  it('each character has sprite keys for ingame + portrait + hand', () => {
    for (const char of CHARACTER_LIST) {
      expect(char.ingameKey).toBeTruthy();
      expect(char.portraitKey).toBeTruthy();
      expect(char.handSpriteKey).toBeTruthy();
      expect(char.idleAnimKey).toBeTruthy();
      expect(char.attackAnimKey).toBeTruthy();
    }
  });

  it('character IDs are unique', () => {
    const ids = CHARACTER_LIST.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('CHARACTERS record keys match .id field', () => {
    for (const [key, char] of Object.entries(CHARACTERS)) {
      expect(char.id).toBe(key);
    }
  });
});
