import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PassiveManager, PassiveCallbacks } from '../../src/managers/PassiveManager';
import { BALANCE } from '../../src/config/balance';
import { PASSIVE_DEFS } from '../../src/config/upgrades';

// ---- Minimal mock types ----

function makeEnemy(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    active: true,
    x: 400,
    y: 300,
    hp: 100,
    maxHp: 100,
    defId: 'basic',
    burnDamage: 0,
    burnRemainingMs: 0,
    burnTickTimer: 0,
    frostSlowMult: 1,
    frostRemainingMs: 0,
    knockbackImmune: false,
    setTint: vi.fn(),
    takeDamage: vi.fn((dmg: number) => {
      const e = overrides._self ?? enemy;
      (e as any).hp -= dmg;
      return (e as any).hp <= 0;
    }),
    body: {
      velocity: { x: 0, y: 0 },
      setVelocity: vi.fn(),
    },
    ...overrides,
  } as any;
  // capture reference for takeDamage closure
  const enemy = arguments[0]?._self;
}

function makeProjectile(overrides: Partial<Record<string, unknown>> = {}) {
  return { x: 200, y: 300, ...overrides } as any;
}

function makePlayer(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    x: 200,
    y: 600,
    attackSpeedMultiplier: 1,
    elementColor: 0x00ffff,
    ...overrides,
  } as any;
}

function makeScene() {
  return {
    physics: {
      world: { timeScale: 1 },
    },
    time: {
      delayedCall: vi.fn((ms: number, cb: () => void) => {
        // Store callback for manual triggering
        (makeScene as any)._lastDelayedCb = cb;
        return { destroy: vi.fn() };
      }),
    },
  } as any;
}

function makeVfx() {
  return {
    hitSpark: vi.fn(),
    bombFlash: vi.fn(),
    elementAuraPulse: vi.fn(),
  } as any;
}

function makeDmgNumbers() {
  return { show: vi.fn() } as any;
}

function makeCallbacks(overrides: Partial<PassiveCallbacks> = {}): PassiveCallbacks {
  return {
    onEnemyDeath: vi.fn(),
    getPhaseManager: vi.fn(() => ({ current: 'playing' })),
    ...overrides,
  } as any;
}

// ---- Tests ----

describe('PassiveManager', () => {
  let scene: ReturnType<typeof makeScene>;
  let callbacks: PassiveCallbacks;
  let pm: PassiveManager;
  const P = BALANCE.PASSIVE;

  beforeEach(() => {
    scene = makeScene();
    callbacks = makeCallbacks();
    pm = new PassiveManager(scene, callbacks);
  });

  // ============================================================
  // reset()
  // ============================================================
  describe('reset()', () => {
    it('clears all passive state to defaults', () => {
      // Dirty some internal state via public methods
      const passives = new Map([['torrent', 1]]);
      const enemy = makeEnemy();
      const proj = makeProjectile();
      const player = makePlayer();
      // Hit 3 times to activate torrent
      for (let i = 0; i < 3; i++) {
        pm.onProjectileHit(proj, enemy, 10, passives, [enemy], 1, player, makeVfx(), makeDmgNumbers());
      }
      pm.reset();
      // After reset, torrent combo should be back to 0 — hitting once should NOT activate buff
      const freshPlayer = makePlayer();
      pm.onProjectileHit(proj, enemy, 10, passives, [enemy], 1, freshPlayer, makeVfx(), makeDmgNumbers());
      // attackSpeedMultiplier should not have changed (torrent needs 3 consecutive hits)
      expect(freshPlayer.attackSpeedMultiplier).toBe(1);
    });
  });

  // ============================================================
  // onProjectileHit()
  // ============================================================
  describe('onProjectileHit()', () => {
    it('skips all effects if enemy is inactive', () => {
      const enemy = makeEnemy({ active: false });
      const passives = new Map([['burn', 3]]);
      const player = makePlayer();
      vi.spyOn(Math, 'random').mockReturnValue(0); // guarantee proc
      pm.onProjectileHit(makeProjectile(), enemy, 100, passives, [enemy], 1, player, makeVfx(), makeDmgNumbers());
      expect(enemy.burnDamage).toBe(0);
      vi.restoreAllMocks();
    });

    it('applies burn DOT when random < chance', () => {
      const enemy = makeEnemy();
      const passives = new Map([['burn', 2]]);
      vi.spyOn(Math, 'random').mockReturnValue(0); // always proc
      pm.onProjectileHit(makeProjectile(), enemy, 100, passives, [enemy], 1, makePlayer(), makeVfx(), makeDmgNumbers());
      expect(enemy.burnDamage).toBe(Math.ceil(100 * P.burnDamagePct));
      expect(enemy.burnRemainingMs).toBe(P.burnDurationMs);
      expect(enemy.burnTickTimer).toBe(P.burnTickIntervalMs);
      vi.restoreAllMocks();
    });

    it('does NOT apply burn when random >= chance', () => {
      const enemy = makeEnemy();
      const passives = new Map([['burn', 1]]);
      vi.spyOn(Math, 'random').mockReturnValue(0.99);
      pm.onProjectileHit(makeProjectile(), enemy, 100, passives, [enemy], 1, makePlayer(), makeVfx(), makeDmgNumbers());
      expect(enemy.burnDamage).toBe(0);
      vi.restoreAllMocks();
    });

    it('applies frost slow when random < chance', () => {
      const enemy = makeEnemy();
      const passives = new Map([['frost_shot', 2]]);
      vi.spyOn(Math, 'random').mockReturnValue(0);
      pm.onProjectileHit(makeProjectile(), enemy, 100, passives, [enemy], 1, makePlayer(), makeVfx(), makeDmgNumbers());
      expect(enemy.frostSlowMult).toBe(P.frostSlowMult);
      expect(enemy.frostRemainingMs).toBe(P.frostDurationMs);
      expect(enemy.setTint).toHaveBeenCalled();
      vi.restoreAllMocks();
    });

    it('applies gust knockback to non-immune enemies', () => {
      const enemy = makeEnemy({ knockbackImmune: false });
      const passives = new Map([['gust', 2]]);
      pm.onProjectileHit(makeProjectile(), enemy, 100, passives, [enemy], 1, makePlayer(), makeVfx(), makeDmgNumbers());
      expect(enemy.body.setVelocity).toHaveBeenCalled();
    });

    it('does NOT apply gust to knockback-immune enemies', () => {
      const enemy = makeEnemy({ knockbackImmune: true });
      const passives = new Map([['gust', 2]]);
      pm.onProjectileHit(makeProjectile(), enemy, 100, passives, [enemy], 1, makePlayer(), makeVfx(), makeDmgNumbers());
      expect(enemy.body.setVelocity).not.toHaveBeenCalled();
    });

    it('increments torrent counter and activates buff at threshold', () => {
      const passives = new Map([['torrent', 1]]);
      const enemy = makeEnemy();
      const player = makePlayer();
      const proj = makeProjectile();

      // Hit threshold - 1 times (no activation yet)
      for (let i = 0; i < P.torrentComboThreshold - 1; i++) {
        pm.onProjectileHit(proj, enemy, 10, passives, [enemy], 1, player, makeVfx(), makeDmgNumbers());
      }
      expect(player.attackSpeedMultiplier).toBe(1);

      // One more hit triggers torrent
      pm.onProjectileHit(proj, enemy, 10, passives, [enemy], 1, player, makeVfx(), makeDmgNumbers());
      expect(player.attackSpeedMultiplier).toBeGreaterThan(1);
    });

    it('applies hit-stop for boss enemies', () => {
      const enemy = makeEnemy({ defId: 'boss_circle' });
      const passives = new Map<string, number>();
      pm.onProjectileHit(makeProjectile(), enemy, 10, passives, [enemy], 1, makePlayer(), makeVfx(), makeDmgNumbers());
      expect(scene.physics.world.timeScale).toBe(BALANCE.JUICE.hitStopTimeScale);
      expect(scene.time.delayedCall).toHaveBeenCalled();
    });

    it('does NOT apply hit-stop for non-boss enemies', () => {
      const enemy = makeEnemy({ defId: 'basic' });
      const passives = new Map<string, number>();
      pm.onProjectileHit(makeProjectile(), enemy, 10, passives, [enemy], 1, makePlayer(), makeVfx(), makeDmgNumbers());
      expect(scene.physics.world.timeScale).toBe(1);
    });
  });

  // ============================================================
  // updateTimers()
  // ============================================================
  describe('updateTimers()', () => {
    it('ticks burn DOT on enemies with active burn', () => {
      const enemy = makeEnemy({
        burnDamage: 20,
        burnRemainingMs: 3000,
        burnTickTimer: 100, // about to tick
      });
      // Fix takeDamage to properly track hp
      enemy.takeDamage = vi.fn(() => false);

      const dmgNumbers = makeDmgNumbers();
      pm.updateTimers(200, new Map(), [enemy], 1, makePlayer(), makeVfx(), dmgNumbers, 1, 1);

      expect(enemy.burnRemainingMs).toBe(2800);
      expect(enemy.takeDamage).toHaveBeenCalledWith(20);
      expect(dmgNumbers.show).toHaveBeenCalled();
    });

    it('clears burnDamage when burnRemainingMs expires', () => {
      const enemy = makeEnemy({
        burnDamage: 20,
        burnRemainingMs: 100,
        burnTickTimer: 500,
      });
      enemy.takeDamage = vi.fn(() => false);

      pm.updateTimers(200, new Map(), [enemy], 1, makePlayer(), makeVfx(), makeDmgNumbers(), 1, 1);

      expect(enemy.burnRemainingMs).toBeLessThanOrEqual(0);
      expect(enemy.burnDamage).toBe(0);
    });

    it('calls onEnemyDeath when burn kills an enemy', () => {
      const enemy = makeEnemy({
        burnDamage: 999,
        burnRemainingMs: 3000,
        burnTickTimer: 0,
      });
      enemy.takeDamage = vi.fn(() => true); // dead

      pm.updateTimers(100, new Map(), [enemy], 1, makePlayer(), makeVfx(), makeDmgNumbers(), 1, 1);

      expect(callbacks.onEnemyDeath).toHaveBeenCalledWith(enemy);
    });

    it('decays torrent buff and resets attackSpeedMultiplier', () => {
      const passives = new Map([['torrent', 1]]);
      const enemy = makeEnemy();
      const player = makePlayer();

      // Activate torrent buff
      for (let i = 0; i < P.torrentComboThreshold; i++) {
        pm.onProjectileHit(makeProjectile(), enemy, 10, passives, [enemy], 1, player, makeVfx(), makeDmgNumbers());
      }
      const buffedSpeed = player.attackSpeedMultiplier;
      expect(buffedSpeed).toBeGreaterThan(1);

      // Decay the buff completely
      pm.updateTimers(P.torrentDurationMs + 1, passives, [], 0, player, makeVfx(), makeDmgNumbers(), 1, 1);

      // Should be reset to base attack speed
      const atkLevel = passives.get('attack_speed') ?? 0;
      const expected = 1 + (PASSIVE_DEFS['attack_speed']?.valuePerLevel ?? 0) * atkLevel;
      expect(player.attackSpeedMultiplier).toBe(expected);
    });

    it('decays lightspeed buff and resets attackSpeedMultiplier', () => {
      const passives = new Map<string, number>();
      const player = makePlayer();

      pm.applyLightspeedOnKill(P.lightspeedDurationMs, 1.5, player);
      expect(player.attackSpeedMultiplier).toBe(1.5);

      // Expire the buff
      pm.updateTimers(P.lightspeedDurationMs + 1, passives, [], 0, player, makeVfx(), makeDmgNumbers(), 1, 1);

      expect(player.attackSpeedMultiplier).toBe(1); // back to base
    });

    it('activates fortify armor buff after no-damage threshold', () => {
      const passives = new Map([
        ['fortify', 1],
        ['base_armor', 0],
      ]);
      const player = makePlayer();

      const result = pm.updateTimers(P.fortifyNoHitMs + 1, passives, [], 0, player, makeVfx(), makeDmgNumbers(), 1, 1);

      expect(result.newBaseArmorMultiplier).toBeDefined();
      expect(result.newBaseArmorMultiplier!).toBeLessThan(1); // fortify reduces damage
    });

    it('does NOT activate fortify before threshold', () => {
      const passives = new Map([['fortify', 1]]);
      const player = makePlayer();

      const result = pm.updateTimers(P.fortifyNoHitMs - 1, passives, [], 0, player, makeVfx(), makeDmgNumbers(), 1, 1);

      expect(result.newBaseArmorMultiplier).toBeUndefined();
    });

    it('dash_trail damages nearby enemies on tick', () => {
      const passives = new Map([['dash_trail', 2]]);
      const player = makePlayer({ x: 200, y: 600 });
      // Place enemy within dashTrailRadius
      const enemy = makeEnemy({ x: 210, y: 610 });
      enemy.takeDamage = vi.fn(() => false);
      const vfx = makeVfx();

      pm.updateTimers(P.dashTrailTickIntervalMs + 1, passives, [enemy], 1, player, vfx, makeDmgNumbers(), 1, 1);

      expect(enemy.takeDamage).toHaveBeenCalledWith(P.dashTrailDamagePerLevel * 2);
      expect(vfx.hitSpark).toHaveBeenCalled();
    });

    it('dash_trail does NOT damage enemies outside radius', () => {
      const passives = new Map([['dash_trail', 1]]);
      const player = makePlayer({ x: 200, y: 600 });
      const enemy = makeEnemy({ x: 9999, y: 9999 }); // far away
      enemy.takeDamage = vi.fn(() => false);

      pm.updateTimers(P.dashTrailTickIntervalMs + 1, passives, [enemy], 1, player, makeVfx(), makeDmgNumbers(), 1, 1);

      expect(enemy.takeDamage).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // applyHitStop()
  // ============================================================
  describe('applyHitStop()', () => {
    it('sets physics timeScale and schedules restore', () => {
      pm.applyHitStop(40);
      expect(scene.physics.world.timeScale).toBe(BALANCE.JUICE.hitStopTimeScale);
      expect(scene.time.delayedCall).toHaveBeenCalledWith(40, expect.any(Function));
    });

    it('does not double-apply while already active', () => {
      pm.applyHitStop(40);
      const callCount = (scene.time.delayedCall as ReturnType<typeof vi.fn>).mock.calls.length;
      pm.applyHitStop(40); // second call should be ignored
      expect((scene.time.delayedCall as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callCount);
    });

    it('restores timeScale when delayed callback fires', () => {
      pm.applyHitStop(40);
      // Fire the stored callback
      const cb = (scene.time.delayedCall as ReturnType<typeof vi.fn>).mock.calls[0][1];
      cb();
      expect(scene.physics.world.timeScale).toBe(1);
    });
  });

  // ============================================================
  // onBaseDamaged()
  // ============================================================
  describe('onBaseDamaged()', () => {
    it('returns null when fortify is not equipped', () => {
      const passives = new Map<string, number>();
      const result = pm.onBaseDamaged(passives, 1);
      expect(result).toBeNull();
    });

    it('resets fortify timer (no buff active yet -> returns null)', () => {
      const passives = new Map([['fortify', 1]]);
      const result = pm.onBaseDamaged(passives, 1);
      expect(result).toBeNull(); // buff wasn't active, just timer reset
    });

    it('deactivates fortify buff and recalculates armor', () => {
      const passives = new Map([
        ['fortify', 1],
        ['base_armor', 0],
      ]);
      const shopArmorMult = 0.9;

      // First activate fortify by passing enough time
      pm.updateTimers(
        P.fortifyNoHitMs + 1,
        passives,
        [],
        0,
        makePlayer(),
        makeVfx(),
        makeDmgNumbers(),
        1,
        shopArmorMult,
      );

      // Now take damage — should deactivate fortify
      const result = pm.onBaseDamaged(passives, shopArmorMult);
      expect(result).not.toBeNull();
      // Without fortify bonus, armor = passiveArmor * shopArmorMult
      const passiveArmor = Math.max(0.1, 1 - (PASSIVE_DEFS['base_armor']?.valuePerLevel ?? 0) * 0);
      expect(result).toBeCloseTo(passiveArmor * shopArmorMult);
    });
  });

  // ============================================================
  // applyLightspeedOnKill()
  // ============================================================
  describe('applyLightspeedOnKill()', () => {
    it('sets lightspeed buff and player attack speed', () => {
      const player = makePlayer();
      pm.applyLightspeedOnKill(5000, 1.4, player);
      expect(player.attackSpeedMultiplier).toBe(1.4);
    });
  });

  // ============================================================
  // shutdown()
  // ============================================================
  describe('shutdown()', () => {
    it('can be called without error', () => {
      expect(() => pm.shutdown()).not.toThrow();
    });
  });
});
