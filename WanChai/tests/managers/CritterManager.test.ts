import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CritterManager, CritterCallbacks } from '../../src/managers/CritterManager';
import { BALANCE } from '../../src/config/balance';
// CRITTERS import removed - not used in tests directly

// ---- Mock Critter class ----
// We mock the Critter import so CritterManager doesn't need a real Phaser scene.

vi.mock('../../src/objects/Critter', () => {
  class MockCritter {
    def: any;
    x = 0;
    y = 0;
    shieldBlocksRemaining = 0;
    regenTicksRemaining = 0;
    regenTickTimer = 0;
    skillActive = false;
    skillTimer = 0;
    cooldownTimer = 0;

    constructor(_scene: any, _px: number, _py: number, def: any, _radius: number, _speed: number) {
      this.def = def;
      this.cooldownTimer = def.cooldownMs * 0.5;
    }

    updateOrbit = vi.fn((_delta: number, _px: number, _py: number) => false);
    flashSkill = vi.fn();
    activateSkill = vi.fn(function (this: any) {
      if (this.def.durationMs > 0) {
        this.skillActive = true;
        this.skillTimer = this.def.durationMs;
      }
    });
    consumeShieldBlock = vi.fn(function (this: any) {
      if (this.shieldBlocksRemaining > 0) {
        this.shieldBlocksRemaining--;
        if (this.shieldBlocksRemaining <= 0) {
          this.skillActive = false;
          this.skillTimer = 0;
        }
        return true;
      }
      return false;
    });
    destroy = vi.fn();
    setPosition = vi.fn();
    setAlpha = vi.fn();
    setDepth = vi.fn();
  }

  return { Critter: MockCritter };
});

// ---- Mock getCritterForElement ----
// Use the real implementation (it's pure data lookup, no Phaser deps)
// Already imported from critters.ts above

// ---- Helpers ----

function makeScene() {
  return {
    add: {
      sprite: vi.fn(() => ({
        setTint: vi.fn(),
        clearTint: vi.fn(),
        scaleX: 1,
        scaleY: 1,
        texture: { getSourceImage: () => ({ width: 40 }) },
      })),
      graphics: vi.fn(() => ({
        setDepth: vi.fn().mockReturnThis(),
        clear: vi.fn(),
        lineStyle: vi.fn(),
        strokeCircle: vi.fn(),
        destroy: vi.fn(),
      })),
      existing: vi.fn(),
    },
    time: {
      delayedCall: vi.fn((_ms: number, _cb: () => void) => ({
        destroy: vi.fn(),
      })),
    },
    tweens: {
      add: vi.fn(),
    },
    textures: {
      exists: vi.fn(() => true),
    },
  } as any;
}

function makeEnemy(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    active: true,
    x: 400,
    y: 400,
    hp: 100,
    maxHp: 100,
    takeDamage: vi.fn(function (this: any, dmg: number) {
      this.hp -= dmg;
      return this.hp <= 0;
    }),
    ...overrides,
  } as any;
}

function makePlayer(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    x: 200,
    y: 600,
    elementColor: 0x00ffff,
    ...overrides,
  } as any;
}

function makeRunState(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    baseHp: 600,
    baseMaxHp: 600,
    ...overrides,
  } as any;
}

function makeVfx() {
  return {
    elementAuraPulse: vi.fn(),
    bombFlash: vi.fn(),
    hitSpark: vi.fn(),
    lightning: vi.fn(),
  } as any;
}

function makeDmgNumbers() {
  return { show: vi.fn() } as any;
}

function makeCallbacks(overrides: Partial<CritterCallbacks> = {}): CritterCallbacks {
  const enemies: any[] = [];
  return {
    onEnemyDeath: vi.fn(),
    getActiveEnemies: vi.fn(() => enemies),
    getActiveEnemyCount: vi.fn(() => enemies.length),
    getRunState: vi.fn(() => makeRunState()),
    getPlayer: vi.fn(() => makePlayer()),
    getVfx: vi.fn(() => makeVfx()),
    getDmgNumbers: vi.fn(() => makeDmgNumbers()),
    ...overrides,
  };
}

// ---- Tests ----

describe('CritterManager', () => {
  let scene: ReturnType<typeof makeScene>;
  let callbacks: CritterCallbacks;
  let cm: CritterManager;

  beforeEach(() => {
    scene = makeScene();
    callbacks = makeCallbacks();
    cm = new CritterManager(scene, callbacks);
  });

  // ============================================================
  // create()
  // ============================================================
  describe('create()', () => {
    it('creates critter for WATER element (dolphin)', () => {
      cm.create('WATER');
      expect(cm.critter).toBeDefined();
      expect(cm.critter!.def.element).toBe('WATER');
      expect(cm.critter!.def.skill).toBe('healPulse');
    });

    it('creates critter for FIRE element (lion)', () => {
      cm.create('FIRE');
      expect(cm.critter).toBeDefined();
      expect(cm.critter!.def.element).toBe('FIRE');
      expect(cm.critter!.def.skill).toBe('flameBurst');
    });

    it('creates critter for WIND element (kite)', () => {
      cm.create('WIND');
      expect(cm.critter).toBeDefined();
      expect(cm.critter!.def.element).toBe('WIND');
    });

    it('creates critter for EARTH element (pangolin)', () => {
      cm.create('EARTH');
      expect(cm.critter).toBeDefined();
      expect(cm.critter!.def.element).toBe('EARTH');
      expect(cm.critter!.def.skill).toBe('shieldBubble');
    });

    it('creates critter for LIGHT element (macaque)', () => {
      cm.create('LIGHT');
      expect(cm.critter).toBeDefined();
      expect(cm.critter!.def.element).toBe('LIGHT');
      expect(cm.critter!.def.skill).toBe('chainLightning');
    });

    it('does not create critter for unknown element', () => {
      cm.create('UNKNOWN');
      expect(cm.critter).toBeUndefined();
    });

    it('cleans up previous critter state on re-create', () => {
      cm.create('WATER');
      const _first = cm.critter;
      cm.create('FIRE');
      expect(cm.critter).toBeDefined();
      expect(cm.critter!.def.element).toBe('FIRE');
    });
  });

  // ============================================================
  // update()
  // ============================================================
  describe('update()', () => {
    it('does nothing when no critter exists', () => {
      // Should not throw
      expect(() => cm.update(16)).not.toThrow();
    });

    it('calls updateOrbit on the critter', () => {
      cm.create('WATER');
      cm.update(16);
      expect(cm.critter!.updateOrbit).toHaveBeenCalledWith(16, expect.any(Number), expect.any(Number));
    });

    it('processes regen ticks when regenTicksRemaining > 0', () => {
      const runState = makeRunState({ baseHp: 500, baseMaxHp: 600 });
      const dmgNumbers = makeDmgNumbers();
      const vfx = makeVfx();
      const cbs = makeCallbacks({
        getRunState: vi.fn(() => runState),
        getDmgNumbers: vi.fn(() => dmgNumbers),
        getVfx: vi.fn(() => vfx),
      });
      const mgr = new CritterManager(scene, cbs);
      mgr.create('WATER'); // koi is also WATER but dolphin comes first

      // Manually set regen state on critter
      const critter = mgr.critter!;
      critter.regenTicksRemaining = 3;
      critter.regenTickTimer = 0; // ready to tick immediately

      mgr.update(100);

      expect(critter.regenTicksRemaining).toBe(2);
      expect(runState.baseHp).toBe(500 + BALANCE.CRITTER.regenStreamHpPerTick);
      expect(dmgNumbers.show).toHaveBeenCalled();
    });

    it('fires critter skill when updateOrbit returns true', () => {
      const runState = makeRunState({ baseHp: 500, baseMaxHp: 600 });
      const dmgNumbers = makeDmgNumbers();
      const vfx = makeVfx();
      const cbs = makeCallbacks({
        getRunState: vi.fn(() => runState),
        getDmgNumbers: vi.fn(() => dmgNumbers),
        getVfx: vi.fn(() => vfx),
      });
      const mgr = new CritterManager(scene, cbs);
      mgr.create('WATER'); // dolphin — healPulse

      // Make updateOrbit return true (skill ready)
      mgr.critter!.updateOrbit = vi.fn(() => true);

      const hpBefore = runState.baseHp;
      mgr.update(16);

      // healPulse should have healed
      const expectedHeal = Math.ceil(runState.baseMaxHp * BALANCE.CRITTER.healPulsePercent);
      expect(runState.baseHp).toBe(Math.min(runState.baseMaxHp, hpBefore + expectedHeal));
      expect(dmgNumbers.show).toHaveBeenCalled();
      expect(vfx.elementAuraPulse).toHaveBeenCalled();
    });

    it('healPulse caps at baseMaxHp', () => {
      const runState = makeRunState({ baseHp: 595, baseMaxHp: 600 });
      const cbs = makeCallbacks({
        getRunState: vi.fn(() => runState),
        getDmgNumbers: vi.fn(() => makeDmgNumbers()),
        getVfx: vi.fn(() => makeVfx()),
      });
      const mgr = new CritterManager(scene, cbs);
      mgr.create('WATER');
      mgr.critter!.updateOrbit = vi.fn(() => true);

      mgr.update(16);
      expect(runState.baseHp).toBe(600); // capped
    });

    it('knockbackAura pushes nearby enemies', () => {
      const player = makePlayer({ x: 200, y: 600 });
      const enemy = makeEnemy({ x: 250, y: 600 }); // within aura radius
      const vfx = makeVfx();
      const cbs = makeCallbacks({
        getActiveEnemies: vi.fn(() => [enemy]),
        getActiveEnemyCount: vi.fn(() => 1),
        getPlayer: vi.fn(() => player),
        getVfx: vi.fn(() => vfx),
        getRunState: vi.fn(() => makeRunState()),
        getDmgNumbers: vi.fn(() => makeDmgNumbers()),
      });
      const mgr = new CritterManager(scene, cbs);
      mgr.create('WIND'); // kite — knockbackAura
      mgr.critter!.updateOrbit = vi.fn(() => true);

      const xBefore = enemy.x;
      mgr.update(16);

      // Enemy should have been pushed away
      expect(enemy.x).toBeGreaterThan(xBefore);
      expect(vfx.elementAuraPulse).toHaveBeenCalled();
    });

    it('flameBurst damages nearby enemies and triggers onEnemyDeath', () => {
      const player = makePlayer({ x: 200, y: 600 });
      const enemy = makeEnemy({ x: 210, y: 610, hp: 10, maxHp: 100 }); // within radius, low hp
      const vfx = makeVfx();
      const onEnemyDeath = vi.fn();
      const cbs = makeCallbacks({
        onEnemyDeath,
        getActiveEnemies: vi.fn(() => [enemy]),
        getActiveEnemyCount: vi.fn(() => 1),
        getPlayer: vi.fn(() => player),
        getVfx: vi.fn(() => vfx),
        getRunState: vi.fn(() => makeRunState()),
        getDmgNumbers: vi.fn(() => makeDmgNumbers()),
      });
      const mgr = new CritterManager(scene, cbs);
      mgr.create('FIRE'); // lion — flameBurst
      mgr.critter!.updateOrbit = vi.fn(() => true);

      mgr.update(16);

      expect(enemy.takeDamage).toHaveBeenCalledWith(BALANCE.CRITTER.flameBurstDamage);
      // Enemy had 10 hp, took 25 damage — should be dead
      expect(onEnemyDeath).toHaveBeenCalledWith(enemy);
      expect(vfx.bombFlash).toHaveBeenCalled();
    });

    it('chainLightning damages nearest enemies', () => {
      const player = makePlayer({ x: 200, y: 600 });
      const enemy1 = makeEnemy({ x: 300, y: 600, hp: 100 });
      const enemy2 = makeEnemy({ x: 350, y: 600, hp: 100 });
      const vfx = makeVfx();
      const cbs = makeCallbacks({
        getActiveEnemies: vi.fn(() => [enemy1, enemy2]),
        getActiveEnemyCount: vi.fn(() => 2),
        getPlayer: vi.fn(() => player),
        getVfx: vi.fn(() => vfx),
        getRunState: vi.fn(() => makeRunState()),
        getDmgNumbers: vi.fn(() => makeDmgNumbers()),
      });
      const mgr = new CritterManager(scene, cbs);
      mgr.create('LIGHT'); // macaque — chainLightning
      mgr.critter!.updateOrbit = vi.fn(() => true);

      mgr.update(16);

      expect(enemy1.takeDamage).toHaveBeenCalledWith(BALANCE.CRITTER.chainLightningDamage);
      expect(vfx.lightning).toHaveBeenCalled();
    });

    it('shieldBubble sets shieldBlocksRemaining and creates graphics', () => {
      const player = makePlayer({ x: 200, y: 600 });
      const cbs = makeCallbacks({
        getPlayer: vi.fn(() => player),
        getRunState: vi.fn(() => makeRunState()),
        getDmgNumbers: vi.fn(() => makeDmgNumbers()),
        getVfx: vi.fn(() => makeVfx()),
      });
      const mgr = new CritterManager(scene, cbs);
      mgr.create('EARTH'); // pangolin — shieldBubble
      mgr.critter!.updateOrbit = vi.fn(() => true);

      mgr.update(16);

      expect(mgr.critter!.shieldBlocksRemaining).toBe(BALANCE.CRITTER.shieldBubbleBlockCount);
      expect(scene.add.graphics).toHaveBeenCalled();
      expect(scene.time.delayedCall).toHaveBeenCalled(); // auto-expire timer
    });
  });

  // ============================================================
  // consumeShieldBlock()
  // ============================================================
  describe('consumeShieldBlock()', () => {
    it('returns false when no critter exists', () => {
      expect(cm.consumeShieldBlock()).toBe(false);
    });

    it('returns false when no shield blocks available', () => {
      cm.create('EARTH');
      cm.critter!.shieldBlocksRemaining = 0;
      expect(cm.consumeShieldBlock()).toBe(false);
    });

    it('returns true and decrements when shield blocks available', () => {
      cm.create('EARTH');
      cm.critter!.shieldBlocksRemaining = 2;
      expect(cm.consumeShieldBlock()).toBe(true);
      expect(cm.critter!.shieldBlocksRemaining).toBe(1);
    });

    it('consumes all blocks and deactivates skill', () => {
      cm.create('EARTH');
      cm.critter!.shieldBlocksRemaining = 1;
      cm.critter!.skillActive = true;
      const result = cm.consumeShieldBlock();
      expect(result).toBe(true);
      expect(cm.critter!.shieldBlocksRemaining).toBe(0);
      expect(cm.critter!.skillActive).toBe(false);
    });
  });

  // ============================================================
  // shieldBlocksRemaining getter
  // ============================================================
  describe('shieldBlocksRemaining', () => {
    it('returns 0 when no critter exists', () => {
      expect(cm.shieldBlocksRemaining).toBe(0);
    });

    it('returns critter shield blocks count', () => {
      cm.create('EARTH');
      cm.critter!.shieldBlocksRemaining = 3;
      expect(cm.shieldBlocksRemaining).toBe(3);
    });
  });

  // ============================================================
  // critter getter
  // ============================================================
  describe('critter getter', () => {
    it('returns undefined when no critter created', () => {
      expect(cm.critter).toBeUndefined();
    });

    it('returns critter instance after create', () => {
      cm.create('FIRE');
      expect(cm.critter).toBeDefined();
    });
  });

  // ============================================================
  // shutdown()
  // ============================================================
  describe('shutdown()', () => {
    it('destroys critter and clears reference', () => {
      cm.create('WATER');
      const critter = cm.critter!;
      cm.shutdown();
      expect(critter.destroy).toHaveBeenCalled();
      expect(cm.critter).toBeUndefined();
    });

    it('can be called without critter (no error)', () => {
      expect(() => cm.shutdown()).not.toThrow();
    });

    it('cleans up shield graphics and timers', () => {
      const player = makePlayer();
      const cbs = makeCallbacks({
        getPlayer: vi.fn(() => player),
        getRunState: vi.fn(() => makeRunState()),
        getDmgNumbers: vi.fn(() => makeDmgNumbers()),
        getVfx: vi.fn(() => makeVfx()),
      });
      const mgr = new CritterManager(scene, cbs);
      mgr.create('EARTH');
      mgr.critter!.updateOrbit = vi.fn(() => true);
      mgr.update(16); // triggers shieldBubble — creates graphics + timer

      mgr.shutdown();
      expect(mgr.critter).toBeUndefined();
    });
  });
});
