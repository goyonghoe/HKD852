/**
 * TASK-078: LevelUpUIManager Unit Tests
 * Tests card creation, auto-select scoring, stat descriptions,
 * and destroyUI cleanup.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WEAPON_DEFS } from '../../src/config/weapons';
import { PASSIVE_DEFS } from '../../src/config/upgrades';

// Mock Phaser before importing LevelUpUIManager
vi.mock('phaser', () => {
  const BaseClass = class {
    constructor(..._args: unknown[]) {
      /* noop */
    }
  };
  return {
    default: {
      WEBGL: 1,
      AUTO: 0,
      Scene: BaseClass,
      Scale: { FIT: 1, CENTER_BOTH: 1 },
      GameObjects: {
        Graphics: BaseClass,
        Rectangle: BaseClass,
        Container: BaseClass,
        Sprite: BaseClass,
        Image: BaseClass,
        Text: BaseClass,
        Zone: BaseClass,
        Group: BaseClass,
      },
      Physics: {
        Arcade: {
          Sprite: BaseClass,
          Group: BaseClass,
          Body: BaseClass,
        },
      },
      Math: {
        Clamp: (val: number, min: number, max: number) => Math.min(Math.max(val, min), max),
      },
    },
  };
});

// Mock audio modules
vi.mock('../../src/audio/RetroSFX', () => ({
  getRetroSFX: () => ({
    levelUp: vi.fn(),
    tap: vi.fn(),
    stageClear: vi.fn(),
    levelClear: vi.fn(),
  }),
}));

// Mock i18n
vi.mock('../../src/lib/i18n', () => ({
  t: (key: string, params?: Record<string, unknown>) => {
    if (params) return `${key}:${JSON.stringify(params)}`;
    return key;
  },
}));

// Mock game-config
vi.mock('../../src/config/game-config', () => ({
  GAME_WIDTH: 720,
  GAME_HEIGHT: 1280,
}));

import { LevelUpUIManager, type LevelUpUICallbacks } from '../../src/managers/LevelUpUIManager';
import type { UpgradeChoice } from '../../src/core/UpgradeSelector';

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------

function makeMockScene() {
  const mockContainer = {
    setDepth: vi.fn().mockReturnThis(),
    add: vi.fn(),
    destroy: vi.fn(),
  };
  const mockRectangle = {
    setDepth: vi.fn().mockReturnThis(),
    setStrokeStyle: vi.fn().mockReturnThis(),
    setInteractive: vi.fn().mockReturnThis(),
    setOrigin: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
    width: 200,
    x: 0,
    y: 0,
  };
  const mockText = {
    setOrigin: vi.fn().mockReturnThis(),
    setColor: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
  };
  const mockImage = {
    setDisplaySize: vi.fn().mockReturnThis(),
    setAlpha: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
  };

  return {
    add: {
      container: vi.fn(() => ({ ...mockContainer })),
      rectangle: vi.fn(() => ({ ...mockRectangle })),
      text: vi.fn(() => ({ ...mockText })),
      image: vi.fn(() => ({ ...mockImage })),
    },
    textures: {
      exists: vi.fn(() => false),
    },
    tweens: {
      add: vi.fn(),
    },
    scale: {
      height: 1280,
    },
  } as unknown as import('phaser').Scene;
}

function makeCallbacks(): LevelUpUICallbacks & {
  _onUpgrade: ReturnType<typeof vi.fn>;
  _onSkip: ReturnType<typeof vi.fn>;
} {
  const onUpgrade = vi.fn();
  const onSkip = vi.fn();
  return {
    onUpgradeSelected: onUpgrade,
    onSkipSelected: onSkip,
    _onUpgrade: onUpgrade,
    _onSkip: onSkip,
  };
}

function makeWeaponChoice(overrides: Partial<UpgradeChoice> = {}): UpgradeChoice {
  return {
    type: 'weapon',
    id: 'energy_shot',
    name: 'Energy Shot',
    description: 'Basic energy shot',
    level: 2,
    isNew: false,
    ...overrides,
  };
}

function makePassiveChoice(overrides: Partial<UpgradeChoice> = {}): UpgradeChoice {
  return {
    type: 'passive',
    id: 'attack_speed',
    name: 'Rapid Fire',
    description: '+10% attack speed',
    level: 1,
    isNew: true,
    ...overrides,
  };
}

function makeEvolutionChoice(overrides: Partial<UpgradeChoice> = {}): UpgradeChoice {
  return {
    type: 'evolution',
    id: 'plasma_gatling',
    name: 'Plasma Gatling',
    description: 'Energy Shot + Rapid Fire',
    level: 1,
    isNew: true,
    recipe: { primary: 'energy_shot', secondary: 'rapid_fire' },
    ...overrides,
  };
}

// ===============================================================
// 1. Card Creation (5 tests)
// ===============================================================

describe('LevelUpUIManager — Card Creation', () => {
  let manager: LevelUpUIManager;
  let scene: ReturnType<typeof makeMockScene>;
  let callbacks: ReturnType<typeof makeCallbacks>;

  beforeEach(() => {
    scene = makeMockScene();
    callbacks = makeCallbacks();
    manager = new LevelUpUIManager(scene as unknown as import('phaser').Scene, callbacks);
  });

  it('showChoices creates upgrade container', () => {
    const choices = [makeWeaponChoice()];
    manager.showChoices(choices);
    // Container should be created (scene.add.container called)
    expect(scene.add.container).toHaveBeenCalled();
  });

  it('showChoices with weapon choice creates card elements', () => {
    const choices = [makeWeaponChoice()];
    manager.showChoices(choices);
    // Should create rectangle for card background, backdrop, auto-select bar, skip button
    expect(scene.add.rectangle).toHaveBeenCalled();
    // Should create text for title, name, description, stat, level label, skip
    expect(scene.add.text).toHaveBeenCalled();
  });

  it('showChoices with evolution choice creates card elements', () => {
    const choices = [makeEvolutionChoice()];
    manager.showChoices(choices);
    expect(scene.add.container).toHaveBeenCalled();
    expect(scene.add.rectangle).toHaveBeenCalled();
  });

  it('showChoices with passive choice creates card elements', () => {
    const choices = [makePassiveChoice()];
    manager.showChoices(choices);
    expect(scene.add.text).toHaveBeenCalled();
  });

  it('showChoices with multiple choices creates multiple cards', () => {
    const choices = [makeWeaponChoice(), makePassiveChoice(), makeEvolutionChoice()];
    manager.showChoices(choices);
    // 3 card backgrounds + 1 backdrop + 1 auto-select bg + 1 auto-select fill + 1 skip bg = 7+
    const rectCallCount = (scene.add.rectangle as ReturnType<typeof vi.fn>).mock.calls.length;
    expect(rectCallCount).toBeGreaterThanOrEqual(7);
  });
});

// ===============================================================
// 2. Auto-Select Scoring (5 tests)
// ===============================================================

describe('LevelUpUIManager — scoreBestChoice', () => {
  it('returns undefined for empty choices', () => {
    expect(LevelUpUIManager.scoreBestChoice([])).toBeUndefined();
  });

  it('evolution scores highest (500+)', () => {
    const evo = makeEvolutionChoice();
    const weapon = makeWeaponChoice({ level: 5, isNew: false });
    const passive = makePassiveChoice();
    const best = LevelUpUIManager.scoreBestChoice([weapon, evo, passive]);
    expect(best).toBeDefined();
    expect(best!.type).toBe('evolution');
    expect(best!.id).toBe('plasma_gatling');
  });

  it('weapon upgrade scores higher than passive', () => {
    const weapon = makeWeaponChoice({ id: 'energy_shot', level: 3, isNew: false });
    const passive = makePassiveChoice({ id: 'attack_speed', isNew: true });
    const best = LevelUpUIManager.scoreBestChoice([passive, weapon]);
    expect(best!.type).toBe('weapon');
  });

  it('existing weapon upgrade scores higher than new weapon', () => {
    const existing = makeWeaponChoice({ id: 'energy_shot', level: 3, isNew: false });
    const newWeapon = makeWeaponChoice({ id: 'shuriken', level: 1, isNew: true });
    const best = LevelUpUIManager.scoreBestChoice([newWeapon, existing]);
    // existing: 100 + 50 + 30 + 10 = 190
    // new shuriken: 100 + 12 = 112
    expect(best!.isNew).toBe(false);
    expect(best!.id).toBe('energy_shot');
  });

  it('damage/crit_chance/attack_speed passives score 20 bonus over other passives', () => {
    const damagePassive = makePassiveChoice({ id: 'damage', isNew: true });
    const hpRegenPassive = makePassiveChoice({ id: 'hp_regen', isNew: true });
    const best = LevelUpUIManager.scoreBestChoice([hpRegenPassive, damagePassive]);
    // damage: 50 + 20 = 70
    // hp_regen: 50 = 50
    expect(best!.id).toBe('damage');
  });
});

// ===============================================================
// 3. Stat Description Generation (5 tests)
// ===============================================================

describe('LevelUpUIManager — getUpgradeStatDesc', () => {
  it('evolution stat desc includes DMG and CD', () => {
    const evo = makeEvolutionChoice({ id: 'plasma_gatling' });
    const desc = LevelUpUIManager.getUpgradeStatDesc(evo);
    expect(desc).toContain('DMG');
    expect(desc).toContain('CD');
    expect(desc).toContain(`${WEAPON_DEFS['plasma_gatling'].baseDamage}`);
    expect(desc).toContain(`${WEAPON_DEFS['plasma_gatling'].cooldownMs}ms`);
  });

  it('evolution stat desc includes piercing if > 0', () => {
    const evo = makeEvolutionChoice({ id: 'plasma_gatling' });
    const desc = LevelUpUIManager.getUpgradeStatDesc(evo);
    // plasma_gatling has piercing=2
    expect(desc).toContain('stat.piercing');
  });

  it('new weapon stat desc includes base stats', () => {
    const choice = makeWeaponChoice({ id: 'missile', level: 1, isNew: true });
    const desc = LevelUpUIManager.getUpgradeStatDesc(choice);
    expect(desc).toContain('DMG');
    expect(desc).toContain(`${WEAPON_DEFS['missile'].baseDamage}`);
    expect(desc).toContain('CD');
    // missile has aoeRadius > 0
    expect(desc).toContain('stat.aoe');
  });

  it('weapon upgrade stat desc shows level change', () => {
    const choice = makeWeaponChoice({ id: 'energy_shot', level: 3, isNew: false });
    const desc = LevelUpUIManager.getUpgradeStatDesc(choice);
    // Should show DMG multiplier change
    expect(desc).toContain('DMG');
    expect(desc).toContain('\u2192'); // arrow
  });

  it('passive stat desc uses correct effect formatter', () => {
    const atkSpeed = makePassiveChoice({ id: 'attack_speed' });
    const desc = LevelUpUIManager.getUpgradeStatDesc(atkSpeed);
    expect(desc).toContain('stat.attack_speed');
  });

  it('passive stat desc for damage', () => {
    const dmg = makePassiveChoice({ id: 'damage' });
    const desc = LevelUpUIManager.getUpgradeStatDesc(dmg);
    expect(desc).toContain('stat.damage');
  });

  it('passive stat desc for base_armor', () => {
    const armor = makePassiveChoice({ id: 'base_armor' });
    const desc = LevelUpUIManager.getUpgradeStatDesc(armor);
    expect(desc).toContain('stat.base_armor');
  });

  it('passive stat desc for hp_regen', () => {
    const regen = makePassiveChoice({ id: 'hp_regen' });
    const desc = LevelUpUIManager.getUpgradeStatDesc(regen);
    expect(desc).toContain('stat.hp_regen');
  });

  it('passive stat desc for crit_chance', () => {
    const crit = makePassiveChoice({ id: 'crit_chance' });
    const desc = LevelUpUIManager.getUpgradeStatDesc(crit);
    expect(desc).toContain('stat.crit_chance');
  });

  it('passive stat desc for crit_damage', () => {
    const critDmg = makePassiveChoice({ id: 'crit_damage' });
    const desc = LevelUpUIManager.getUpgradeStatDesc(critDmg);
    expect(desc).toContain('stat.crit_damage');
  });

  it('character passive falls through to description', () => {
    const burn = makePassiveChoice({ id: 'burn' });
    const desc = LevelUpUIManager.getUpgradeStatDesc(burn);
    // burn effect type falls through to default: pdef.description
    expect(desc).toBe(PASSIVE_DEFS['burn'].description);
  });

  it('returns empty string for unknown weapon', () => {
    const unknown = makeWeaponChoice({ id: 'nonexistent_weapon' });
    const desc = LevelUpUIManager.getUpgradeStatDesc(unknown);
    expect(desc).toBe('');
  });

  it('returns empty string for unknown evolution', () => {
    const unknown: UpgradeChoice = {
      type: 'evolution',
      id: 'nonexistent',
      name: 'X',
      description: '',
      level: 1,
      isNew: true,
    };
    const desc = LevelUpUIManager.getUpgradeStatDesc(unknown);
    expect(desc).toBe('');
  });

  it('returns empty string for unknown passive', () => {
    const unknown = makePassiveChoice({ id: 'nonexistent_passive' });
    const desc = LevelUpUIManager.getUpgradeStatDesc(unknown);
    expect(desc).toBe('');
  });
});

// ===============================================================
// 4. destroyUI Cleanup (3 tests)
// ===============================================================

describe('LevelUpUIManager — destroyUI', () => {
  let manager: LevelUpUIManager;
  let scene: ReturnType<typeof makeMockScene>;
  let callbacks: ReturnType<typeof makeCallbacks>;

  beforeEach(() => {
    scene = makeMockScene();
    callbacks = makeCallbacks();
    manager = new LevelUpUIManager(scene as unknown as import('phaser').Scene, callbacks);
  });

  it('destroyUI clears auto-select bar state', () => {
    manager.showChoices([makeWeaponChoice()]);
    expect(manager.hasAutoSelectBarFill).toBe(true);
    manager.destroyUI();
    expect(manager.hasAutoSelectBarFill).toBe(false);
  });

  it('destroyUI clears selected choice', () => {
    manager.showChoices([makeWeaponChoice()]);
    expect(manager.getSelectedChoice()).toBeDefined();
    manager.destroyUI();
    expect(manager.getSelectedChoice()).toBeUndefined();
  });

  it('destroyUI on fresh instance does not throw', () => {
    expect(() => manager.destroyUI()).not.toThrow();
  });
});

// ===============================================================
// 5. Auto-Select Timer (3 tests)
// ===============================================================

describe('LevelUpUIManager — Auto-Select Timer', () => {
  let manager: LevelUpUIManager;
  let scene: ReturnType<typeof makeMockScene>;
  let callbacks: ReturnType<typeof makeCallbacks>;

  beforeEach(() => {
    scene = makeMockScene();
    callbacks = makeCallbacks();
    manager = new LevelUpUIManager(scene as unknown as import('phaser').Scene, callbacks);
  });

  it('hasAutoSelectBarFill is false initially', () => {
    expect(manager.hasAutoSelectBarFill).toBe(false);
  });

  it('updateAutoSelect does nothing when no bar exists', () => {
    expect(() => manager.updateAutoSelect()).not.toThrow();
  });

  it('hasAutoSelectBarFill is true after showChoices', () => {
    manager.showChoices([makeWeaponChoice()]);
    expect(manager.hasAutoSelectBarFill).toBe(true);
  });
});

// ===============================================================
// 6. getSelectedChoice (2 tests)
// ===============================================================

describe('LevelUpUIManager — getSelectedChoice', () => {
  it('returns undefined before showChoices', () => {
    const scene = makeMockScene();
    const callbacks = makeCallbacks();
    const manager = new LevelUpUIManager(scene as unknown as import('phaser').Scene, callbacks);
    expect(manager.getSelectedChoice()).toBeUndefined();
  });

  it('returns best choice after showChoices', () => {
    const scene = makeMockScene();
    const callbacks = makeCallbacks();
    const manager = new LevelUpUIManager(scene as unknown as import('phaser').Scene, callbacks);
    const evo = makeEvolutionChoice();
    const weapon = makeWeaponChoice();
    manager.showChoices([weapon, evo]);
    const selected = manager.getSelectedChoice();
    expect(selected).toBeDefined();
    expect(selected!.type).toBe('evolution');
  });
});
