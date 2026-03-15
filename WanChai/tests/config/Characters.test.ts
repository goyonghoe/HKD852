import { describe, it, expect } from 'vitest';
import { CHARACTERS } from '../../src/config/characters';

describe('Characters config', () => {
  const chars = Object.values(CHARACTERS);

  it('has exactly 5 characters', () => {
    expect(chars).toHaveLength(5);
  });

  it('all characters have required fields', () => {
    for (const c of chars) {
      expect(c.id).toBeTruthy();
      expect(c.name).toBeTruthy();
      expect(c.nameKo).toBeTruthy();
      expect(c.element).toBeTruthy();
      expect(c.startWeapon).toBeTruthy();
      expect(c.passive).toBeTruthy();
      expect(c.passive.type).toBeTruthy();
      expect(c.passive.value).toBeGreaterThan(0);
      expect(c.portraitKey).toBeTruthy();
      expect(c.ingameKey).toBeTruthy();
    }
  });

  it('all characters have handSpriteKey for arm layer', () => {
    for (const c of chars) {
      expect(c.handSpriteKey).toBeTruthy();
      expect(c.handSpriteKey).toMatch(/^hand_/);
    }
  });

  it('all characters have unique elements', () => {
    const elements = chars.map((c) => c.element);
    expect(new Set(elements).size).toBe(elements.length);
  });

  it('all characters have unique start weapons', () => {
    const weapons = chars.map((c) => c.startWeapon);
    expect(new Set(weapons).size).toBe(weapons.length);
  });

  it('passive values are reasonable (0-1 range)', () => {
    for (const c of chars) {
      expect(c.passive.value).toBeGreaterThan(0);
      expect(c.passive.value).toBeLessThanOrEqual(1);
    }
  });

  it('HAI is the default Wind character', () => {
    expect(CHARACTERS.hai).toBeDefined();
    expect(CHARACTERS.hai.element).toBe('WIND');
    expect(CHARACTERS.hai.startWeapon).toBe('energy_shot');
  });
});

describe('Character unlock conditions (TASK-041)', () => {
  it('HAI and NOVA are always unlocked (no unlockCondition)', () => {
    expect(CHARACTERS.hai.unlockCondition).toBeUndefined();
    expect(CHARACTERS.nova.unlockCondition).toBeUndefined();
  });

  it('SOL requires runsCompleted >= 3', () => {
    const cond = CHARACTERS.sol.unlockCondition;
    expect(cond).toBeDefined();
    expect(cond!.type).toBe('runsCompleted');
    expect(cond!.value).toBe(3);
  });

  it('MEI requires totalGold >= 500', () => {
    const cond = CHARACTERS.mei.unlockCondition;
    expect(cond).toBeDefined();
    expect(cond!.type).toBe('totalGold');
    expect(cond!.value).toBe(500);
  });

  it('KAI requires bestKills >= 200', () => {
    const cond = CHARACTERS.kai.unlockCondition;
    expect(cond).toBeDefined();
    expect(cond!.type).toBe('bestKills');
    expect(cond!.value).toBe(200);
  });

  it('unlockConditions have description strings', () => {
    for (const c of Object.values(CHARACTERS)) {
      if (c.unlockCondition) {
        expect(c.unlockCondition.description).toBeTruthy();
      }
    }
  });
});
