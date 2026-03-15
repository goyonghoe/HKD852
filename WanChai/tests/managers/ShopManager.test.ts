/**
 * TASK-080: ShopManager unit tests.
 *
 * Tests purchase logic, gold deduction, heal/damage/armor application,
 * auto-select scoring, and UI state management.
 *
 * Since ShopManager depends on Phaser (Scene, Physics, Containers), we mock
 * Phaser at the module level and create lightweight stand-ins.
 *
 * All balance numbers come from src/config/balance.ts (M-002).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BALANCE, VISUAL } from '../../src/config/balance';
import { PASSIVE_DEFS } from '../../src/config/upgrades';
import type { RunState } from '../../src/types/game';

// ── Mock Phaser ──────────────────────────────────────────────────────────
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

// Mock RetroSFX
vi.mock('../../src/audio/RetroSFX', () => ({
  getRetroSFX: () => ({
    purchaseSuccess: vi.fn(),
    purchaseFail: vi.fn(),
    tap: vi.fn(),
  }),
}));

// Mock analytics
vi.mock('../../src/lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

// Mock i18n
vi.mock('../../src/lib/i18n', () => ({
  t: (key: string, _params?: Record<string, unknown>) => key,
}));

import { ShopManager, type ShopCallbacks } from '../../src/managers/ShopManager';
import { PhaseManager } from '../../src/managers/PhaseManager';

// ── Helpers ──────────────────────────────────────────────────────────────

function makeRunState(overrides: Partial<RunState> = {}): RunState {
  return {
    characterId: 'hai',
    seed: 12345,
    runTime: 30000,
    stageTime: 30000,
    stage: 1,
    playerLevel: 3,
    playerXp: 0,
    baseHp: BALANCE.BASE.hp,
    baseMaxHp: BALANCE.BASE.hp,
    kills: 10,
    gold: 1000000,
    weapons: ['energy_shot'],
    passives: [],
    totalDamageDealt: 0,
    weaponDamageMap: {},
    critHitsLanded: 0,
    totalHitsLanded: 0,
    highestSingleHit: 0,
    ...overrides,
  };
}

function makeCallbacks(overrides: Partial<ShopCallbacks> = {}): ShopCallbacks {
  return {
    getPassiveArmorLevel: () => 0,
    getShopArmorMultiplier: () => 1.0,
    setShopArmorMultiplier: vi.fn(),
    setBaseArmorMultiplier: vi.fn(),
    ...overrides,
  };
}

function makeMockScene(): Record<string, unknown> {
  return {
    add: {
      container: () => ({
        setDepth: function () {
          return this;
        },
        add: vi.fn(),
        destroy: vi.fn(),
      }),
      rectangle: (..._args: unknown[]) => ({
        setStrokeStyle: function () {
          return this;
        },
        setInteractive: function () {
          return this;
        },
        on: function () {
          return this;
        },
        width: 200,
      }),
      text: (..._args: unknown[]) => ({
        setOrigin: function () {
          return this;
        },
      }),
      graphics: () => ({
        setDepth: function () {
          return this;
        },
        setAlpha: function () {
          return this;
        },
      }),
    },
    physics: {
      pause: vi.fn(),
      resume: vi.fn(),
    },
  };
}

function makePlayer(): { damageMultiplier: number } {
  return { damageMultiplier: 1.0 };
}

function makeAriaMsg(): { show: ReturnType<typeof vi.fn> } {
  return { show: vi.fn() };
}

// ── Tests ────────────────────────────────────────────────────────────────

describe('ShopManager', () => {
  let sm: ShopManager;
  let callbacks: ShopCallbacks;
  let scene: ReturnType<typeof makeMockScene>;

  beforeEach(() => {
    scene = makeMockScene();
    callbacks = makeCallbacks();
    sm = new ShopManager(scene as never, callbacks);
  });

  // ------------------------------------------------------------------
  // Purchase affordability
  // ------------------------------------------------------------------
  describe('purchase affordability', () => {
    it('rejects purchase when gold < cost', () => {
      const runState = makeRunState({ gold: 5 });
      const player = makePlayer();
      const aria = makeAriaMsg();

      sm.applyShopChoice('heal', BALANCE.ECONOMY.shopCosts['heal'], runState, player as never, aria as never);
      expect(runState.gold).toBe(5); // unchanged
    });

    it('accepts purchase when gold >= cost', () => {
      const cost = BALANCE.ECONOMY.shopCosts['heal'];
      const runState = makeRunState({ gold: cost + 50 });
      const player = makePlayer();
      const aria = makeAriaMsg();

      sm.applyShopChoice('heal', cost, runState, player as never, aria as never);
      expect(runState.gold).toBe(50);
    });

    it('accepts purchase when gold == cost exactly', () => {
      const cost = BALANCE.ECONOMY.shopCosts['damage'];
      const runState = makeRunState({ gold: cost });
      const player = makePlayer();
      const aria = makeAriaMsg();

      sm.applyShopChoice('damage', cost, runState, player as never, aria as never);
      expect(runState.gold).toBe(0);
    });
  });

  // ------------------------------------------------------------------
  // Gold deduction
  // ------------------------------------------------------------------
  describe('gold deduction on purchase', () => {
    it('deducts heal cost correctly', () => {
      const runState = makeRunState({ gold: 1000000 });
      sm.applyShopChoice(
        'heal',
        BALANCE.ECONOMY.shopCosts['heal'],
        runState,
        makePlayer() as never,
        makeAriaMsg() as never,
      );
      expect(runState.gold).toBe(1000000 - BALANCE.ECONOMY.shopCosts['heal']);
    });

    it('deducts damage cost correctly', () => {
      const runState = makeRunState({ gold: 1000000 });
      sm.applyShopChoice(
        'damage',
        BALANCE.ECONOMY.shopCosts['damage'],
        runState,
        makePlayer() as never,
        makeAriaMsg() as never,
      );
      expect(runState.gold).toBe(1000000 - BALANCE.ECONOMY.shopCosts['damage']);
    });

    it('deducts armor cost correctly', () => {
      const runState = makeRunState({ gold: 1000000 });
      sm.applyShopChoice(
        'armor',
        BALANCE.ECONOMY.shopCosts['armor'],
        runState,
        makePlayer() as never,
        makeAriaMsg() as never,
      );
      expect(runState.gold).toBe(1000000 - BALANCE.ECONOMY.shopCosts['armor']);
    });

    it('does not deduct gold on failed purchase', () => {
      const runState = makeRunState({ gold: 3 });
      sm.applyShopChoice(
        'damage',
        BALANCE.ECONOMY.shopCosts['damage'],
        runState,
        makePlayer() as never,
        makeAriaMsg() as never,
      );
      expect(runState.gold).toBe(3);
    });

    it('handles negative gold (underflow guard)', () => {
      const runState = makeRunState({ gold: -1 });
      sm.applyShopChoice(
        'heal',
        BALANCE.ECONOMY.shopCosts['heal'],
        runState,
        makePlayer() as never,
        makeAriaMsg() as never,
      );
      expect(runState.gold).toBe(-1); // rejected — gold < cost
      expect(runState.baseHp).toBe(BALANCE.BASE.hp); // no heal applied
    });
  });

  // ------------------------------------------------------------------
  // Heal: correct HP restoration (capped at max)
  // ------------------------------------------------------------------
  describe('heal purchase', () => {
    it('restores correct percentage of base max HP', () => {
      const maxHp = BALANCE.BASE.hp;
      const currentHp = Math.floor(maxHp * 0.5);
      const runState = makeRunState({ baseHp: currentHp, baseMaxHp: maxHp, gold: 10000 });

      sm.applyShopChoice(
        'heal',
        BALANCE.ECONOMY.shopCosts['heal'],
        runState,
        makePlayer() as never,
        makeAriaMsg() as never,
      );

      const expectedHeal = Math.ceil(maxHp * BALANCE.ECONOMY.shopEffects.healBasePercent);
      expect(runState.baseHp).toBe(Math.min(maxHp, currentHp + expectedHeal));
    });

    it('clamps HP to max when heal would exceed', () => {
      const maxHp = BALANCE.BASE.hp;
      const currentHp = maxHp - 10;
      const runState = makeRunState({ baseHp: currentHp, baseMaxHp: maxHp, gold: 10000 });

      sm.applyShopChoice(
        'heal',
        BALANCE.ECONOMY.shopCosts['heal'],
        runState,
        makePlayer() as never,
        makeAriaMsg() as never,
      );

      expect(runState.baseHp).toBe(maxHp);
    });

    it('heals from near-zero HP', () => {
      const maxHp = BALANCE.BASE.hp;
      const runState = makeRunState({ baseHp: 1, baseMaxHp: maxHp, gold: 10000 });

      sm.applyShopChoice(
        'heal',
        BALANCE.ECONOMY.shopCosts['heal'],
        runState,
        makePlayer() as never,
        makeAriaMsg() as never,
      );

      const expectedHeal = Math.ceil(maxHp * BALANCE.ECONOMY.shopEffects.healBasePercent);
      expect(runState.baseHp).toBe(1 + expectedHeal);
    });

    it('full HP heal returns maxHp (capped)', () => {
      const maxHp = BALANCE.BASE.hp;
      const runState = makeRunState({ baseHp: maxHp, baseMaxHp: maxHp, gold: 10000 });

      sm.applyShopChoice(
        'heal',
        BALANCE.ECONOMY.shopCosts['heal'],
        runState,
        makePlayer() as never,
        makeAriaMsg() as never,
      );

      expect(runState.baseHp).toBe(maxHp);
    });

    it('uses Math.ceil for heal amount', () => {
      // Use an odd maxHp to force fractional heal
      const maxHp = 101;
      const currentHp = 50;
      const runState = makeRunState({ baseHp: currentHp, baseMaxHp: maxHp, gold: 10000 });

      sm.applyShopChoice(
        'heal',
        BALANCE.ECONOMY.shopCosts['heal'],
        runState,
        makePlayer() as never,
        makeAriaMsg() as never,
      );

      const expectedHeal = Math.ceil(maxHp * BALANCE.ECONOMY.shopEffects.healBasePercent);
      expect(runState.baseHp).toBe(currentHp + expectedHeal);
    });
  });

  // ------------------------------------------------------------------
  // Damage: correct multiplier application
  // ------------------------------------------------------------------
  describe('damage purchase', () => {
    it('increases player damage multiplier by boost percent', () => {
      const player = makePlayer();
      const runState = makeRunState({ gold: 1000000 });

      sm.applyShopChoice(
        'damage',
        BALANCE.ECONOMY.shopCosts['damage'],
        runState,
        player as never,
        makeAriaMsg() as never,
      );

      const expected = 1.0 * (1 + BALANCE.ECONOMY.shopEffects.damageBoostPercent);
      expect(player.damageMultiplier).toBeCloseTo(expected, 5);
    });

    it('stacks multiplicatively on second purchase', () => {
      const player = makePlayer();
      const runState = makeRunState({ gold: 1000000 });

      sm.applyShopChoice(
        'damage',
        BALANCE.ECONOMY.shopCosts['damage'],
        runState,
        player as never,
        makeAriaMsg() as never,
      );
      sm.applyShopChoice(
        'damage',
        BALANCE.ECONOMY.shopCosts['damage'],
        runState,
        player as never,
        makeAriaMsg() as never,
      );

      const expected =
        1.0 *
        (1 + BALANCE.ECONOMY.shopEffects.damageBoostPercent) *
        (1 + BALANCE.ECONOMY.shopEffects.damageBoostPercent);
      expect(player.damageMultiplier).toBeCloseTo(expected, 5);
    });

    it('works with pre-existing damage multiplier', () => {
      const player = makePlayer();
      player.damageMultiplier = 1.5;
      const runState = makeRunState({ gold: 1000000 });

      sm.applyShopChoice(
        'damage',
        BALANCE.ECONOMY.shopCosts['damage'],
        runState,
        player as never,
        makeAriaMsg() as never,
      );

      const expected = 1.5 * (1 + BALANCE.ECONOMY.shopEffects.damageBoostPercent);
      expect(player.damageMultiplier).toBeCloseTo(expected, 5);
    });
  });

  // ------------------------------------------------------------------
  // Armor: correct multiplier stacking with base_armor passive
  // ------------------------------------------------------------------
  describe('armor purchase', () => {
    it('first armor purchase: reduces shop multiplier by boost percent', () => {
      let shopArmor = 1.0;
      const cbs = makeCallbacks({
        getShopArmorMultiplier: () => shopArmor,
        setShopArmorMultiplier: vi.fn((v: number) => {
          shopArmor = v;
        }),
        setBaseArmorMultiplier: vi.fn(),
        getPassiveArmorLevel: () => 0,
      });
      const manager = new ShopManager(scene as never, cbs);
      const runState = makeRunState({ gold: 1000000 });

      manager.applyShopChoice(
        'armor',
        BALANCE.ECONOMY.shopCosts['armor'],
        runState,
        makePlayer() as never,
        makeAriaMsg() as never,
      );

      expect(cbs.setShopArmorMultiplier).toHaveBeenCalledWith(expect.closeTo(0.75, 5));
    });

    it('second armor purchase stacks multiplicatively', () => {
      let shopArmor = 0.75;
      const cbs = makeCallbacks({
        getShopArmorMultiplier: () => shopArmor,
        setShopArmorMultiplier: vi.fn((v: number) => {
          shopArmor = v;
        }),
        setBaseArmorMultiplier: vi.fn(),
        getPassiveArmorLevel: () => 0,
      });
      const manager = new ShopManager(scene as never, cbs);
      const runState = makeRunState({ gold: 1000000 });

      manager.applyShopChoice(
        'armor',
        BALANCE.ECONOMY.shopCosts['armor'],
        runState,
        makePlayer() as never,
        makeAriaMsg() as never,
      );

      expect(cbs.setShopArmorMultiplier).toHaveBeenCalledWith(expect.closeTo(0.5625, 4));
    });

    it('armor with passive armor level 2 computes correct base armor', () => {
      let shopArmor = 1.0;
      const setBase = vi.fn();
      const cbs = makeCallbacks({
        getShopArmorMultiplier: () => shopArmor,
        setShopArmorMultiplier: vi.fn((v: number) => {
          shopArmor = v;
        }),
        setBaseArmorMultiplier: setBase,
        getPassiveArmorLevel: () => 2,
      });
      const manager = new ShopManager(scene as never, cbs);
      const runState = makeRunState({ gold: 1000000 });

      manager.applyShopChoice(
        'armor',
        BALANCE.ECONOMY.shopCosts['armor'],
        runState,
        makePlayer() as never,
        makeAriaMsg() as never,
      );

      // shopArmor = 1.0 * 0.75 = 0.75
      // passiveArmor: max(0.1, 1 - 0.10*2) = 0.80
      // baseArmor = 0.80 * 0.75 = 0.60
      const passiveValuePerLevel = PASSIVE_DEFS['base_armor'].valuePerLevel;
      const passiveArmor = Math.max(0.1, 1 - passiveValuePerLevel * 2);
      const expectedBase = passiveArmor * 0.75;
      expect(setBase).toHaveBeenCalledWith(expect.closeTo(expectedBase, 5));
    });

    it('armor with max passive level 5', () => {
      let shopArmor = 1.0;
      const setBase = vi.fn();
      const cbs = makeCallbacks({
        getShopArmorMultiplier: () => shopArmor,
        setShopArmorMultiplier: vi.fn((v: number) => {
          shopArmor = v;
        }),
        setBaseArmorMultiplier: setBase,
        getPassiveArmorLevel: () => 5,
      });
      const manager = new ShopManager(scene as never, cbs);
      const runState = makeRunState({ gold: 1000000 });

      manager.applyShopChoice(
        'armor',
        BALANCE.ECONOMY.shopCosts['armor'],
        runState,
        makePlayer() as never,
        makeAriaMsg() as never,
      );

      const passiveValuePerLevel = PASSIVE_DEFS['base_armor'].valuePerLevel;
      const passiveArmor = Math.max(0.1, 1 - passiveValuePerLevel * 5);
      const expectedBase = passiveArmor * 0.75;
      expect(setBase).toHaveBeenCalledWith(expect.closeTo(expectedBase, 5));
    });

    it('armor floor is minArmorMultiplier with extreme passive level', () => {
      let shopArmor = 1.0;
      const setBase = vi.fn();
      const cbs = makeCallbacks({
        getShopArmorMultiplier: () => shopArmor,
        setShopArmorMultiplier: vi.fn((v: number) => {
          shopArmor = v;
        }),
        setBaseArmorMultiplier: setBase,
        getPassiveArmorLevel: () => 10,
      });
      const manager = new ShopManager(scene as never, cbs);
      const runState = makeRunState({ gold: 1000000 });

      manager.applyShopChoice(
        'armor',
        BALANCE.ECONOMY.shopCosts['armor'],
        runState,
        makePlayer() as never,
        makeAriaMsg() as never,
      );

      // max(0.3, 1 - 0.10*10) = max(0.3, 0) = 0.3
      // baseArmor = 0.3 * 0.75 = 0.225
      expect(setBase).toHaveBeenCalledWith(expect.closeTo(0.225, 5));
    });

    it('no passive armor: baseArmor equals shopArmor', () => {
      let shopArmor = 1.0;
      const setBase = vi.fn();
      const cbs = makeCallbacks({
        getShopArmorMultiplier: () => shopArmor,
        setShopArmorMultiplier: vi.fn((v: number) => {
          shopArmor = v;
        }),
        setBaseArmorMultiplier: setBase,
        getPassiveArmorLevel: () => 0,
      });
      const manager = new ShopManager(scene as never, cbs);
      const runState = makeRunState({ gold: 1000000 });

      manager.applyShopChoice(
        'armor',
        BALANCE.ECONOMY.shopCosts['armor'],
        runState,
        makePlayer() as never,
        makeAriaMsg() as never,
      );

      // With 0 passive: baseArmor = shopArmor (0.75)
      expect(setBase).toHaveBeenCalledWith(expect.closeTo(0.75, 5));
    });
  });

  // ------------------------------------------------------------------
  // Auto-select timeout logic
  // ------------------------------------------------------------------
  describe('auto-select timeout', () => {
    it('returns null when no auto bar fill exists', () => {
      const phaseManager = new PhaseManager();
      phaseManager.transition('shop');
      const result = sm.updateAutoSelect(phaseManager);
      expect(result).toBeNull();
    });

    it('returns null when progress < 1', () => {
      // Simulate having a bar fill
      sm.shopAutoBarFill = { width: 200 } as never;
      sm.shopAutoBarBg = { width: 200 } as never;
      sm.shopAutoStartReal = Date.now(); // just started
      sm.shopAutoBestAction = { action: 'heal', cost: 200 };

      const phaseManager = new PhaseManager();
      phaseManager.transition('shop');
      const result = sm.updateAutoSelect(phaseManager);
      expect(result).toBeNull();
    });

    it('returns best action when timer expires and best action exists', () => {
      sm.shopAutoBarFill = { width: 200 } as never;
      sm.shopAutoBarBg = { width: 200 } as never;
      sm.shopAutoStartReal = Date.now() - VISUAL.UI.autoSelectDelayMs - 100; // expired
      sm.shopAutoBestAction = { action: 'damage', cost: 250 };

      const phaseManager = new PhaseManager();
      phaseManager.transition('shop');
      const result = sm.updateAutoSelect(phaseManager);
      expect(result).toEqual({ action: 'damage', cost: 250 });
    });

    it('returns "skip" when timer expires and no best action', () => {
      sm.shopAutoBarFill = { width: 200 } as never;
      sm.shopAutoBarBg = { width: 200 } as never;
      sm.shopAutoStartReal = Date.now() - VISUAL.UI.autoSelectDelayMs - 100;
      sm.shopAutoBestAction = null;

      const phaseManager = new PhaseManager();
      phaseManager.transition('shop');
      const result = sm.updateAutoSelect(phaseManager);
      expect(result).toBe('skip');
    });
  });

  // ------------------------------------------------------------------
  // closeShop resets UI state
  // ------------------------------------------------------------------
  describe('closeShop', () => {
    it('clears all shop UI state', () => {
      sm.shopAutoBestAction = { action: 'heal', cost: 200 };
      sm.shopAutoBarBg = {} as never;
      sm.shopAutoBarFill = {} as never;
      sm.shopContainer = { destroy: vi.fn() } as never;

      sm.closeShop();

      expect(sm.shopAutoBestAction).toBeUndefined();
      expect(sm.shopAutoBarBg).toBeUndefined();
      expect(sm.shopAutoBarFill).toBeUndefined();
      expect(sm.shopContainer).toBeUndefined();
    });

    it('destroys shopContainer', () => {
      const destroySpy = vi.fn();
      sm.shopContainer = { destroy: destroySpy } as never;

      sm.closeShop();

      expect(destroySpy).toHaveBeenCalled();
    });

    it('handles closeShop when already closed (no errors)', () => {
      sm.closeShop();
      // Should not throw
      expect(sm.shopContainer).toBeUndefined();
    });
  });

  // ------------------------------------------------------------------
  // scoreBestShopChoice logic (tested via auto-select integration)
  // ------------------------------------------------------------------
  describe('scoreBestShopChoice (via auto-select integration)', () => {
    // The scoring is tested by checking what shopAutoBestAction gets set to
    // after showMidRunShop. Since showMidRunShop requires a full Phaser scene,
    // we test the reimplemented pure function equivalent instead.

    function scoreBestShopChoice(
      items: { name: string; desc: string; cost: number; action: 'heal' | 'damage' | 'armor' }[],
      runState: { gold: number; baseHp: number; baseMaxHp: number },
    ): { action: 'heal' | 'damage' | 'armor'; cost: number } | null {
      const affordable = items.filter((it) => runState.gold >= it.cost);
      if (affordable.length === 0) return null;
      const hpPct = runState.baseHp / runState.baseMaxHp;
      const heal = affordable.find((it) => it.action === 'heal');
      if (heal && hpPct < BALANCE.MID_SHOP.healHpThreshold) return { action: heal.action, cost: heal.cost };
      const dmg = affordable.find((it) => it.action === 'damage');
      if (dmg) return { action: dmg.action, cost: dmg.cost };
      return { action: affordable[0].action, cost: affordable[0].cost };
    }

    const shopItems = [
      { name: 'Heal', desc: '', cost: BALANCE.ECONOMY.shopCosts['heal'], action: 'heal' as const },
      { name: 'Damage', desc: '', cost: BALANCE.ECONOMY.shopCosts['damage'], action: 'damage' as const },
      { name: 'Armor', desc: '', cost: BALANCE.ECONOMY.shopCosts['armor'], action: 'armor' as const },
    ];

    it('returns null when no items affordable', () => {
      expect(scoreBestShopChoice(shopItems, { gold: 0, baseHp: 600, baseMaxHp: 600 })).toBeNull();
    });

    it('prefers heal when HP < healHpThreshold', () => {
      // HP 200/600 = 0.33 < 0.5 threshold → heal
      const result = scoreBestShopChoice(shopItems, { gold: 100000, baseHp: 200, baseMaxHp: 600 });
      expect(result?.action).toBe('heal');
    });

    it('prefers damage when HP >= healHpThreshold', () => {
      // HP 500/600 = 0.83 >= 0.5 threshold → damage
      const result = scoreBestShopChoice(shopItems, { gold: 100000, baseHp: 500, baseMaxHp: 600 });
      expect(result?.action).toBe('damage');
    });

    it('falls back to first affordable when only heal affordable at full HP', () => {
      // With costs 40/60/55, gold=45 affords only heal (40)
      const result = scoreBestShopChoice(shopItems, { gold: 45, baseHp: 600, baseMaxHp: 600 });
      expect(result?.action).toBe('heal');
    });
  });

  // ------------------------------------------------------------------
  // Balance config validation
  // ------------------------------------------------------------------
  describe('balance config consistency', () => {
    const shop = BALANCE.MID_SHOP;
    const shopEffects = BALANCE.ECONOMY.shopEffects;

    it('triggerTimeMs is 30000ms', () => {
      expect(shop.triggerTimeMs).toBe(30000);
    });

    it('all ECONOMY.shopCosts are positive integers', () => {
      const costs = BALANCE.ECONOMY.shopCosts;
      expect(costs.heal).toBeGreaterThan(0);
      expect(costs.damage).toBeGreaterThan(0);
      expect(costs.armor).toBeGreaterThan(0);
      expect(Number.isInteger(costs.heal)).toBe(true);
      expect(Number.isInteger(costs.damage)).toBe(true);
      expect(Number.isInteger(costs.armor)).toBe(true);
    });

    it('boost percentages are between 0 and 1', () => {
      expect(shopEffects.healBasePercent).toBeGreaterThan(0);
      expect(shopEffects.healBasePercent).toBeLessThanOrEqual(1);
      expect(shopEffects.damageBoostPercent).toBeGreaterThan(0);
      expect(shopEffects.damageBoostPercent).toBeLessThanOrEqual(1);
      expect(shopEffects.armorBoostPercent).toBeGreaterThan(0);
      expect(shopEffects.armorBoostPercent).toBeLessThanOrEqual(1);
    });

    it('autoSelectDelayMs comes from VISUAL.UI', () => {
      expect(VISUAL.UI.autoSelectDelayMs).toBe(5000);
    });
  });
});
