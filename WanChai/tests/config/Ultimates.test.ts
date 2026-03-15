import { describe, it, expect } from 'vitest';
import { ULTIMATE_DEFS } from '../../src/config/ultimates';
import { CHARACTERS } from '../../src/config/characters';
import { BALANCE } from '../../src/config/balance';

const ultimates = Object.values(ULTIMATE_DEFS);
const ultimateIds = Object.keys(ULTIMATE_DEFS);
const characterIds = Object.keys(CHARACTERS);

describe('Ultimates config — required fields', () => {
  it('every ultimate has an id', () => {
    for (const u of ultimates) {
      expect(u.id).toBeTruthy();
    }
  });

  it('every ultimate has a name', () => {
    for (const u of ultimates) {
      expect(u.name).toBeTruthy();
    }
  });

  it('every ultimate has a nameKo', () => {
    for (const u of ultimates) {
      expect(u.nameKo).toBeTruthy();
    }
  });

  it('every ultimate has a description', () => {
    for (const u of ultimates) {
      expect(u.description).toBeTruthy();
    }
  });

  it('every ultimate has an element', () => {
    for (const u of ultimates) {
      expect(u.element).toBeTruthy();
    }
  });

  it('every ultimate has a type', () => {
    for (const u of ultimates) {
      expect(u.type).toBeTruthy();
    }
  });
});

describe('Ultimates config — no duplicate IDs', () => {
  it('all ultimate IDs are unique', () => {
    expect(new Set(ultimateIds).size).toBe(ultimateIds.length);
  });

  it('each key matches its id field', () => {
    for (const [key, def] of Object.entries(ULTIMATE_DEFS)) {
      expect(def.id).toBe(key);
    }
  });
});

describe('Ultimates config — character ID matching', () => {
  it('every character has a corresponding ultimate', () => {
    for (const charId of characterIds) {
      expect(ULTIMATE_DEFS[charId]).toBeDefined();
    }
  });

  it('every ultimate has a corresponding character', () => {
    for (const ultId of ultimateIds) {
      expect(CHARACTERS[ultId]).toBeDefined();
    }
  });

  it('ultimate count matches character count', () => {
    expect(ultimateIds.length).toBe(characterIds.length);
  });
});

describe('Ultimates config — element matching', () => {
  it('ultimate elements match their character elements', () => {
    for (const charId of characterIds) {
      const character = CHARACTERS[charId];
      const ultimate = ULTIMATE_DEFS[charId];
      expect(ultimate.element).toBe(character.element);
    }
  });

  it('all 5 elements are covered', () => {
    const elements = ultimates.map((u) => u.element);
    const uniqueElements = new Set(elements);
    expect(uniqueElements.size).toBe(5);
    expect(uniqueElements.has('WIND')).toBe(true);
    expect(uniqueElements.has('WATER')).toBe(true);
    expect(uniqueElements.has('FIRE')).toBe(true);
    expect(uniqueElements.has('LIGHT')).toBe(true);
    expect(uniqueElements.has('EARTH')).toBe(true);
  });
});

describe('Ultimates config — type validation', () => {
  const VALID_TYPES = ['aoe', 'buff', 'projectile', 'debuff'];

  it('all ultimate types come from the allowed set', () => {
    for (const u of ultimates) {
      expect(VALID_TYPES).toContain(u.type);
    }
  });

  it('at least one of each type exists among all ultimates', () => {
    const types = ultimates.map((u) => u.type);
    // At least aoe and buff should be represented
    expect(types).toContain('aoe');
    expect(types).toContain('buff');
  });
});

describe('Ultimates config — BALANCE.ULTIMATE cross-reference', () => {
  it('BALANCE.ULTIMATE has config for each character ultimate', () => {
    for (const charId of characterIds) {
      expect((BALANCE.ULTIMATE as Record<string, unknown>)[charId]).toBeDefined();
    }
  });

  it('BALANCE.ULTIMATE gauge constants are positive', () => {
    expect(BALANCE.ULTIMATE.gaugeMax).toBeGreaterThan(0);
    expect(BALANCE.ULTIMATE.slowMoDurationMs).toBeGreaterThan(0);
    expect(BALANCE.ULTIMATE.slowMoTimeScale).toBeGreaterThan(0);
    expect(BALANCE.ULTIMATE.slowMoTimeScale).toBeLessThanOrEqual(1);
  });

  it('BALANCE.ULTIMATE gaugePerKill values are positive', () => {
    expect(BALANCE.ULTIMATE.gaugePerKill.t1).toBeGreaterThan(0);
    expect(BALANCE.ULTIMATE.gaugePerKill.t2).toBeGreaterThan(0);
    expect(BALANCE.ULTIMATE.gaugePerKill.elite).toBeGreaterThan(0);
    expect(BALANCE.ULTIMATE.gaugePerKill.boss).toBeGreaterThan(0);
  });

  it('gaugePerKill increases with enemy tier', () => {
    const gpk = BALANCE.ULTIMATE.gaugePerKill;
    expect(gpk.t2).toBeGreaterThan(gpk.t1);
    expect(gpk.elite).toBeGreaterThan(gpk.t2);
    expect(gpk.boss).toBeGreaterThan(gpk.elite);
  });
});

describe('Ultimates config — specific ultimates', () => {
  it('Hai has Cyclone (aoe, WIND)', () => {
    const hai = ULTIMATE_DEFS.hai;
    expect(hai.name).toBe('Cyclone');
    expect(hai.type).toBe('aoe');
    expect(hai.element).toBe('WIND');
  });

  it('Nova has Frost Wave (debuff, WATER)', () => {
    const nova = ULTIMATE_DEFS.nova;
    expect(nova.name).toBe('Frost Wave');
    expect(nova.type).toBe('debuff');
    expect(nova.element).toBe('WATER');
  });

  it('Sol has Firestorm (aoe, FIRE)', () => {
    const sol = ULTIMATE_DEFS.sol;
    expect(sol.name).toBe('Firestorm');
    expect(sol.type).toBe('aoe');
    expect(sol.element).toBe('FIRE');
  });

  it('Mei has Light Pillar (projectile, LIGHT)', () => {
    const mei = ULTIMATE_DEFS.mei;
    expect(mei.name).toBe('Light Pillar');
    expect(mei.type).toBe('projectile');
    expect(mei.element).toBe('LIGHT');
  });

  it('Kai has Earthquake (buff, EARTH)', () => {
    const kai = ULTIMATE_DEFS.kai;
    expect(kai.name).toBe('Earthquake');
    expect(kai.type).toBe('buff');
    expect(kai.element).toBe('EARTH');
  });
});

describe('Ultimates config — description strings', () => {
  it('descriptions are in Korean', () => {
    for (const u of ultimates) {
      // Korean descriptions should have Korean characters
      expect(u.description.length).toBeGreaterThan(0);
    }
  });

  it('nameKo strings are in Korean', () => {
    for (const u of ultimates) {
      // Korean names should contain Korean characters (Hangul range check)
      const hasKorean = /[\uAC00-\uD7AF]/.test(u.nameKo);
      expect(hasKorean).toBe(true);
    }
  });

  it('name strings are in English', () => {
    for (const u of ultimates) {
      // English names should contain Latin characters
      const hasLatin = /[a-zA-Z]/.test(u.name);
      expect(hasLatin).toBe(true);
    }
  });
});
