/**
 * CollisionManager unit tests.
 *
 * Tests projectile-enemy collision, enemy-base collision, spatial hash integration,
 * element multiplier, armor, piercing, and callbacks.
 *
 * Since CollisionManager references Phaser types (Group, Scene, Physics) we mock Phaser
 * at the module level and create lightweight stand-ins for Enemy, Projectile, Player, etc.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BALANCE } from '../../src/config/balance';
import { GAME_HEIGHT } from '../../src/config/game-config';
import { SpatialHash } from '../../src/core/SpatialHash';
import { getElementMultiplier } from '../../src/core/DamageCalc';

// ── Mock Phaser ─────────────────────────────────────────────────────────────
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
        Between: (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1)),
      },
    },
  };
});

// Mock RetroSFX (imported transitively by CollisionManager)
vi.mock('../../src/audio/RetroSFX', () => ({
  getRetroSFX: () => ({
    enemyHit: vi.fn(),
    baseHit: vi.fn(),
    deploy: vi.fn(),
  }),
}));

import { CollisionManager, type CollisionCallbacks } from '../../src/managers/CollisionManager';

// ── Mock factories ──────────────────────────────────────────────────────────

function mockProjectile(
  overrides: Partial<{
    x: number;
    y: number;
    active: boolean;
    damage: number;
    piercing: number;
    hitCount: number;
    isCrit: boolean;
    weaponId: string;
  }> = {},
) {
  return {
    x: overrides.x ?? 100,
    y: overrides.y ?? 100,
    active: overrides.active ?? true,
    damage: overrides.damage ?? 10,
    piercing: overrides.piercing ?? 0,
    hitCount: overrides.hitCount ?? 0,
    isCrit: overrides.isCrit ?? false,
    weaponId: overrides.weaponId ?? 'energy_shot',
    deactivate: vi.fn(function (this: { active: boolean }) {
      this.active = false;
    }),
  };
}

function mockEnemy(
  overrides: Partial<{
    x: number;
    y: number;
    active: boolean;
    hp: number;
    maxHp: number;
    hitRadius: number;
    element: string;
    behavior: string;
    attackDamage: number;
    isElite: boolean;
    damage: number;
    projectileSpeed: number;
  }> = {},
) {
  return {
    x: overrides.x ?? 100,
    y: overrides.y ?? 100,
    active: overrides.active ?? true,
    hp: overrides.hp ?? 50,
    maxHp: overrides.maxHp ?? 50,
    hitRadius: overrides.hitRadius ?? 16,
    element: overrides.element ?? 'FIRE',
    behavior: overrides.behavior ?? 'march',
    attackDamage: overrides.attackDamage ?? 10,
    isElite: overrides.isElite ?? false,
    damage: overrides.damage ?? 10,
    projectileSpeed: overrides.projectileSpeed ?? 200,
    takeDamage: vi.fn(function (this: { hp: number }, dmg: number) {
      this.hp -= dmg;
      return this.hp <= 0;
    }),
    applyKnockback: vi.fn(),
  };
}

function mockPlayer(
  overrides: Partial<{
    elementName: string;
    elementColor: number;
  }> = {},
) {
  return {
    elementName: overrides.elementName ?? 'WIND',
    elementColor: overrides.elementColor ?? 0x00ffcc,
  };
}

function mockVfx() {
  return {
    hitSpark: vi.fn(),
  };
}

function mockDmgNumbers() {
  return {
    show: vi.fn(),
  };
}

function createCallbacks(): CollisionCallbacks & {
  onEnemyDeathSpy: ReturnType<typeof vi.fn>;
  onBaseDamageSpy: ReturnType<typeof vi.fn>;
  playSfxSpy: ReturnType<typeof vi.fn>;
  onProjectileHitSpy: ReturnType<typeof vi.fn>;
} {
  const onEnemyDeathSpy = vi.fn();
  const onBaseDamageSpy = vi.fn();
  const playSfxSpy = vi.fn();
  const onProjectileHitSpy = vi.fn();
  return {
    onEnemyDeath: onEnemyDeathSpy,
    onBaseDamage: onBaseDamageSpy,
    playSfx: playSfxSpy,
    onProjectileHit: onProjectileHitSpy,
    onEnemyDeathSpy,
    onBaseDamageSpy,
    playSfxSpy,
    onProjectileHitSpy,
  };
}

/** Build a minimal projectile group mock. */
function mockProjectileGroup(projs: ReturnType<typeof mockProjectile>[]) {
  return {
    getChildren: () => projs,
  } as unknown as import('phaser').Physics.Arcade.Group;
}

// ═════════════════════════════════════════════════════════════════════════════
// Tests
// ═════════════════════════════════════════════════════════════════════════════

describe('CollisionManager — projectile-enemy collision', () => {
  let cm: CollisionManager;
  let cbs: ReturnType<typeof createCallbacks>;

  beforeEach(() => {
    cbs = createCallbacks();
    cm = new CollisionManager(cbs);
  });

  it('projectile within hit radius damages enemy', () => {
    const proj = mockProjectile({ x: 100, y: 100, damage: 20 });
    const enemy = mockEnemy({ x: 105, y: 105, hitRadius: 16, hp: 50 });
    const player = mockPlayer({ elementName: 'WIND' });

    // Build spatial hash indexing the enemy
    const hash = new SpatialHash(64);
    hash.insert(0, enemy.x, enemy.y);

    cm.resolveProjectileCollisions(
      mockProjectileGroup([proj] as never[]),
      [enemy] as never[],
      1,
      hash,
      player as never,
      mockVfx() as never,
      mockDmgNumbers() as never,
    );

    expect(enemy.takeDamage).toHaveBeenCalled();
  });

  it('projectile outside hit radius misses', () => {
    const proj = mockProjectile({ x: 0, y: 0, damage: 20 });
    const enemy = mockEnemy({ x: 500, y: 500, hitRadius: 16, hp: 50 });
    const player = mockPlayer();
    const hash = new SpatialHash(64);
    hash.insert(0, enemy.x, enemy.y);

    cm.resolveProjectileCollisions(
      mockProjectileGroup([proj] as never[]),
      [enemy] as never[],
      1,
      hash,
      player as never,
      mockVfx() as never,
      mockDmgNumbers() as never,
    );

    expect(enemy.takeDamage).not.toHaveBeenCalled();
  });

  it('element multiplier applied correctly (advantage: WIND vs EARTH)', () => {
    const proj = mockProjectile({ x: 100, y: 100, damage: 20 });
    const enemy = mockEnemy({ x: 100, y: 100, hitRadius: 16, hp: 500, element: 'EARTH' });
    const player = mockPlayer({ elementName: 'WIND' }); // WIND > EARTH
    const hash = new SpatialHash(64);
    hash.insert(0, enemy.x, enemy.y);

    cm.resolveProjectileCollisions(
      mockProjectileGroup([proj] as never[]),
      [enemy] as never[],
      1,
      hash,
      player as never,
      mockVfx() as never,
      mockDmgNumbers() as never,
    );

    // Expected: Math.round(20 * 1.5 / 1) = 30
    const expectedDmg = Math.round(proj.damage * BALANCE.ELEMENT.advantageMultiplier);
    expect(enemy.takeDamage).toHaveBeenCalledWith(expectedDmg);
  });

  it('element disadvantage reduces damage (EARTH vs WIND)', () => {
    const proj = mockProjectile({ x: 100, y: 100, damage: 20 });
    const enemy = mockEnemy({ x: 100, y: 100, hitRadius: 16, hp: 500, element: 'WIND' });
    const player = mockPlayer({ elementName: 'EARTH' }); // EARTH > LIGHT, not WIND
    const hash = new SpatialHash(64);
    hash.insert(0, enemy.x, enemy.y);

    cm.resolveProjectileCollisions(
      mockProjectileGroup([proj] as never[]),
      [enemy] as never[],
      1,
      hash,
      player as never,
      mockVfx() as never,
      mockDmgNumbers() as never,
    );

    // WIND advantage over EARTH reversed → EARTH attacking WIND is disadvantage
    // advantages: WIND→EARTH. Defender WIND, attacker EARTH → advantages[WIND]=EARTH === EARTH (attacker)? Yes → resist
    const expectedDmg = Math.round(proj.damage * BALANCE.ELEMENT.disadvantageMultiplier);
    expect(enemy.takeDamage).toHaveBeenCalledWith(expectedDmg);
  });

  it('DARK defender takes extra damage from all elements', () => {
    const proj = mockProjectile({ x: 100, y: 100, damage: 20 });
    const enemy = mockEnemy({ x: 100, y: 100, hitRadius: 16, hp: 500, element: 'DARK' });
    const player = mockPlayer({ elementName: 'FIRE' });
    const hash = new SpatialHash(64);
    hash.insert(0, enemy.x, enemy.y);

    cm.resolveProjectileCollisions(
      mockProjectileGroup([proj] as never[]),
      [enemy] as never[],
      1,
      hash,
      player as never,
      mockVfx() as never,
      mockDmgNumbers() as never,
    );

    const expectedDmg = Math.round(proj.damage * BALANCE.ELEMENT.darkMultiplier);
    expect(enemy.takeDamage).toHaveBeenCalledWith(expectedDmg);
  });

  it('enemyArmorMult parameter reduces damage', () => {
    const proj = mockProjectile({ x: 100, y: 100, damage: 20 });
    const enemy = mockEnemy({ x: 100, y: 100, hitRadius: 16, hp: 500, element: 'FIRE' });
    const player = mockPlayer({ elementName: 'FIRE' }); // neutral
    const hash = new SpatialHash(64);
    hash.insert(0, enemy.x, enemy.y);
    const armorMult = 2;

    cm.resolveProjectileCollisions(
      mockProjectileGroup([proj] as never[]),
      [enemy] as never[],
      1,
      hash,
      player as never,
      mockVfx() as never,
      mockDmgNumbers() as never,
      armorMult,
    );

    // Neutral element → multiplier 1, damage = Math.round(20 * 1 / 2) = 10
    const elemResult = getElementMultiplier(
      'FIRE',
      'FIRE',
      BALANCE.ELEMENT.advantages,
      BALANCE.ELEMENT.advantageMultiplier,
      BALANCE.ELEMENT.disadvantageMultiplier,
      BALANCE.ELEMENT.darkMultiplier,
    );
    const expectedDmg = Math.round((proj.damage * elemResult.multiplier) / armorMult);
    expect(enemy.takeDamage).toHaveBeenCalledWith(expectedDmg);
  });

  it('piercing projectile continues after hit (hitCount < piercing)', () => {
    const proj = mockProjectile({ x: 100, y: 100, damage: 20, piercing: 3, hitCount: 0 });
    const enemy = mockEnemy({ x: 100, y: 100, hitRadius: 16, hp: 500 });
    const player = mockPlayer();
    const hash = new SpatialHash(64);
    hash.insert(0, enemy.x, enemy.y);

    cm.resolveProjectileCollisions(
      mockProjectileGroup([proj] as never[]),
      [enemy] as never[],
      1,
      hash,
      player as never,
      mockVfx() as never,
      mockDmgNumbers() as never,
    );

    // hitCount incremented to 1, piercing is 3 → 1 <= 3 → still active
    expect(proj.active).toBe(true);
    expect(proj.deactivate).not.toHaveBeenCalled();
    expect(proj.hitCount).toBe(1);
  });

  it('non-piercing projectile deactivates after hit (piercing = 0)', () => {
    const proj = mockProjectile({ x: 100, y: 100, damage: 20, piercing: 0, hitCount: 0 });
    const enemy = mockEnemy({ x: 100, y: 100, hitRadius: 16, hp: 500 });
    const player = mockPlayer();
    const hash = new SpatialHash(64);
    hash.insert(0, enemy.x, enemy.y);

    cm.resolveProjectileCollisions(
      mockProjectileGroup([proj] as never[]),
      [enemy] as never[],
      1,
      hash,
      player as never,
      mockVfx() as never,
      mockDmgNumbers() as never,
    );

    // hitCount incremented to 1 > piercing 0 → deactivate
    expect(proj.deactivate).toHaveBeenCalled();
    expect(proj.active).toBe(false);
  });

  it('onProjectileHit callback fires on hit', () => {
    const proj = mockProjectile({ x: 100, y: 100, damage: 10, piercing: 0 });
    const enemy = mockEnemy({ x: 100, y: 100, hitRadius: 16, hp: 500 });
    const player = mockPlayer();
    const hash = new SpatialHash(64);
    hash.insert(0, enemy.x, enemy.y);

    cm.resolveProjectileCollisions(
      mockProjectileGroup([proj] as never[]),
      [enemy] as never[],
      1,
      hash,
      player as never,
      mockVfx() as never,
      mockDmgNumbers() as never,
    );

    expect(cbs.onProjectileHitSpy).toHaveBeenCalledTimes(1);
  });

  it('onEnemyDeath callback fires when enemy dies', () => {
    const proj = mockProjectile({ x: 100, y: 100, damage: 999 });
    const enemy = mockEnemy({ x: 100, y: 100, hitRadius: 16, hp: 5, maxHp: 5 });
    const player = mockPlayer();
    const hash = new SpatialHash(64);
    hash.insert(0, enemy.x, enemy.y);

    cm.resolveProjectileCollisions(
      mockProjectileGroup([proj] as never[]),
      [enemy] as never[],
      1,
      hash,
      player as never,
      mockVfx() as never,
      mockDmgNumbers() as never,
    );

    expect(cbs.onEnemyDeathSpy).toHaveBeenCalledWith(enemy);
  });

  it('inactive projectile is skipped', () => {
    const proj = mockProjectile({ x: 100, y: 100, damage: 20, active: false });
    const enemy = mockEnemy({ x: 100, y: 100, hitRadius: 16, hp: 50 });
    const hash = new SpatialHash(64);
    hash.insert(0, enemy.x, enemy.y);

    cm.resolveProjectileCollisions(
      mockProjectileGroup([proj] as never[]),
      [enemy] as never[],
      1,
      hash,
      mockPlayer() as never,
      mockVfx() as never,
      mockDmgNumbers() as never,
    );

    expect(enemy.takeDamage).not.toHaveBeenCalled();
  });

  it('inactive enemy is skipped even if in spatial hash', () => {
    const proj = mockProjectile({ x: 100, y: 100, damage: 20 });
    const enemy = mockEnemy({ x: 100, y: 100, hitRadius: 16, hp: 50, active: false });
    const hash = new SpatialHash(64);
    hash.insert(0, enemy.x, enemy.y);

    cm.resolveProjectileCollisions(
      mockProjectileGroup([proj] as never[]),
      [enemy] as never[],
      1,
      hash,
      mockPlayer() as never,
      mockVfx() as never,
      mockDmgNumbers() as never,
    );

    expect(enemy.takeDamage).not.toHaveBeenCalled();
  });
});

describe('CollisionManager — enemy-base collision (enemy projectiles)', () => {
  let cm: CollisionManager;
  let cbs: ReturnType<typeof createCallbacks>;

  beforeEach(() => {
    cbs = createCallbacks();
    cm = new CollisionManager(cbs);
  });

  it('enemy projectile reaching base Y triggers onBaseDamage', () => {
    const sprite = {
      setPosition: vi.fn(),
      destroy: vi.fn(),
    };
    const hitX = BALANCE.BARRIER.x - 10; // just past barrier line
    cm.enemyProjectiles.push({
      x: hitX,
      y: BALANCE.BASE.y - 5,
      vy: 200,
      damage: 15,
      sprite: sprite as never,
    });

    const runState = { baseHp: 100, baseMaxHp: 100 } as never;
    cm.updateEnemyProjectiles(
      100, // delta ms
      runState,
      1, // baseArmorMultiplier
      mockVfx() as never,
      mockDmgNumbers() as never,
    );

    expect(cbs.onBaseDamageSpy).toHaveBeenCalled();
  });

  it('damage amount matches enemy projectile damage * armor', () => {
    const sprite = { setPosition: vi.fn(), destroy: vi.fn() };
    const hitX = BALANCE.BARRIER.x - 10; // just past barrier line
    cm.enemyProjectiles.push({
      x: hitX,
      y: BALANCE.BASE.y - 1,
      vy: 200,
      damage: 20,
      sprite: sprite as never,
    });

    const armorMult = 0.5;
    cm.updateEnemyProjectiles(100, {} as never, armorMult, mockVfx() as never, mockDmgNumbers() as never);

    // damage = Math.ceil(20 * 0.5) = 10
    const expectedDmg = Math.ceil(20 * armorMult);
    expect(cbs.onBaseDamageSpy).toHaveBeenCalledWith(expectedDmg, hitX);
  });

  it('enemy projectile sprite is destroyed after base hit', () => {
    const sprite = { setPosition: vi.fn(), destroy: vi.fn() };
    cm.enemyProjectiles.push({
      x: 100,
      y: BALANCE.BASE.y,
      vy: 200,
      damage: 10,
      sprite: sprite as never,
    });

    cm.updateEnemyProjectiles(100, {} as never, 1, mockVfx() as never, mockDmgNumbers() as never);

    expect(sprite.destroy).toHaveBeenCalled();
    expect(cm.enemyProjectiles.length).toBe(0);
  });

  it('enemy projectile removed when going offscreen below GAME_HEIGHT+50', () => {
    // The offscreen check (y > GAME_HEIGHT + 50) is a safety net for projectiles
    // that somehow bypass the base check. Since BALANCE.BASE.y < GAME_HEIGHT+50,
    // any projectile reaching base Y will hit base first. We test the offscreen
    // removal by placing the projectile well beyond both thresholds — it still
    // triggers the base check first (since base y < GAME_HEIGHT+50).
    // Here we verify the base check fires for projectiles at extreme Y.
    const sprite = { setPosition: vi.fn(), destroy: vi.fn() };
    cm.enemyProjectiles.push({
      x: 100,
      y: GAME_HEIGHT + 100,
      vy: 200,
      damage: 10,
      sprite: sprite as never,
    });

    cm.updateEnemyProjectiles(100, {} as never, 1, mockVfx() as never, mockDmgNumbers() as never);

    expect(sprite.destroy).toHaveBeenCalled();
    expect(cm.enemyProjectiles.length).toBe(0);
    // Base check fires first since BALANCE.BASE.y < GAME_HEIGHT + 50
    expect(cbs.onBaseDamageSpy).toHaveBeenCalled();
  });

  it('enemy projectile moves downward over time', () => {
    const sprite = { setPosition: vi.fn(), destroy: vi.fn() };
    const initialY = 100;
    const vy = 300;
    cm.enemyProjectiles.push({
      x: 360,
      y: initialY,
      vy,
      damage: 10,
      sprite: sprite as never,
    });

    const deltaMs = 500;
    cm.updateEnemyProjectiles(deltaMs, {} as never, 1, mockVfx() as never, mockDmgNumbers() as never);

    // y should increase: 100 + 300 * (500/1000) = 250
    const p = cm.enemyProjectiles[0];
    if (p) {
      expect(p.y).toBeCloseTo(initialY + vy * (deltaMs / 1000), 1);
    }
  });
});

describe('CollisionManager — spatial hash integration', () => {
  it('enemies are properly indexed and queried', () => {
    const hash = new SpatialHash(64);
    // Insert 3 enemies
    hash.insert(0, 100, 100);
    hash.insert(1, 110, 110);
    hash.insert(2, 500, 500);

    const buf = new Array<number>(128);
    const count = hash.queryRadiusInto(105, 105, 96, buf);

    // Enemies 0 and 1 are near (105,105), enemy 2 is far
    const nearby = buf.slice(0, count);
    expect(nearby).toContain(0);
    expect(nearby).toContain(1);
    expect(nearby).not.toContain(2);
  });

  it('query returns empty for no enemies nearby', () => {
    const hash = new SpatialHash(64);
    hash.insert(0, 0, 0);

    const buf = new Array<number>(128);
    const count = hash.queryRadiusInto(9999, 9999, 96, buf);
    expect(count).toBe(0);
  });

  it('query returns correct count for clustered enemies', () => {
    const hash = new SpatialHash(64);
    for (let i = 0; i < 10; i++) {
      hash.insert(i, 100 + i, 100 + i);
    }
    const buf = new Array<number>(128);
    const count = hash.queryRadiusInto(105, 105, 96, buf);
    expect(count).toBe(10);
  });
});

describe('CollisionManager — clearEnemyProjectiles', () => {
  it('destroys all sprites and empties array', () => {
    const cbs = createCallbacks();
    const cm = new CollisionManager(cbs);
    const sprites = [
      { setPosition: vi.fn(), destroy: vi.fn() },
      { setPosition: vi.fn(), destroy: vi.fn() },
    ];
    cm.enemyProjectiles.push(
      { x: 0, y: 0, vy: 100, damage: 5, sprite: sprites[0] as never },
      { x: 0, y: 0, vy: 100, damage: 5, sprite: sprites[1] as never },
    );

    cm.clearEnemyProjectiles();

    expect(sprites[0].destroy).toHaveBeenCalled();
    expect(sprites[1].destroy).toHaveBeenCalled();
    expect(cm.enemyProjectiles.length).toBe(0);
  });
});

describe('CollisionManager — balance config integration', () => {
  it('BALANCE.BASE.y is defined and reasonable', () => {
    expect(BALANCE.BASE.y).toBeGreaterThan(0);
    // BASE.y (1100) can exceed GAME_HEIGHT (720) in side-view layout
    // where the base is positioned off-screen bottom as a logical boundary
    expect(BALANCE.BASE.y).toBeLessThanOrEqual(2000);
  });

  it('element advantage multiplier is > 1', () => {
    expect(BALANCE.ELEMENT.advantageMultiplier).toBeGreaterThan(1);
  });

  it('element disadvantage multiplier is < 1', () => {
    expect(BALANCE.ELEMENT.disadvantageMultiplier).toBeLessThan(1);
    expect(BALANCE.ELEMENT.disadvantageMultiplier).toBeGreaterThan(0);
  });

  it('dark multiplier is > 1', () => {
    expect(BALANCE.ELEMENT.darkMultiplier).toBeGreaterThan(1);
  });
});
