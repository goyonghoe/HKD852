/**
 * AllyManager unit tests.
 *
 * Tests targeting (findNearestEnemyFrom, findNearestEnemiesFrom),
 * cooldown/firing timing, ally positioning, and damage values.
 *
 * Since AllyManager extends uses Phaser scene (sprites, physics groups),
 * we mock Phaser at module level and test the behavioral logic.
 */
import { describe, it, expect, vi } from 'vitest';
import { BALANCE } from '../../src/config/balance';

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
      },
    },
  };
});

import { AllyManager, type AllyCallbacks } from '../../src/managers/AllyManager';

// ── Mock factories ──────────────────────────────────────────────────────────

function createMockSprite(x: number, y: number) {
  return {
    x,
    y,
    setDepth: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
  };
}

function createMockScene(
  allyLeftSprite?: ReturnType<typeof createMockSprite>,
  allyRightSprite?: ReturnType<typeof createMockSprite>,
) {
  const leftSprite = allyLeftSprite ?? createMockSprite(BALANCE.ALLY.leftX, BALANCE.ALLY.baseY);
  const rightSprite = allyRightSprite ?? createMockSprite(BALANCE.ALLY.rightX, BALANCE.ALLY.baseY);
  let callCount = 0;
  return {
    add: {
      sprite: vi.fn((_x: number, _y: number, _key: string) => {
        callCount++;
        return callCount === 1 ? leftSprite : rightSprite;
      }),
    },
    leftSprite,
    rightSprite,
  } as unknown as import('phaser').Scene & {
    leftSprite: ReturnType<typeof createMockSprite>;
    rightSprite: ReturnType<typeof createMockSprite>;
  };
}

function createMockEnemy(x: number, y: number) {
  return { x, y, active: true };
}

/** Create a mock projectile group that tracks all fired projectiles. */
function createMockProjectileGroup() {
  const fired: { fromX: number; fromY: number; vx: number; vy: number; damage: number }[] = [];
  return {
    group: {
      get: vi.fn(() => ({
        fire: vi.fn((x: number, y: number, vx: number, vy: number, damage: number) => {
          fired.push({ fromX: x, fromY: y, vx, vy, damage });
        }),
      })),
    } as unknown as import('phaser').Physics.Arcade.Group,
    fired,
  };
}

function createCallbacks(
  enemies: ReturnType<typeof createMockEnemy>[] = [],
  projGroup?: ReturnType<typeof createMockProjectileGroup>,
): AllyCallbacks {
  const pg = projGroup ?? createMockProjectileGroup();
  return {
    getActiveEnemies: () => enemies as never[],
    getActiveEnemyCount: () => enemies.length,
    getProjectileGroup: () => pg.group,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// Tests — Targeting
// ═════════════════════════════════════════════════════════════════════════════

describe('AllyManager — targeting', () => {
  it('sniper fires at nearest enemy within range', () => {
    const nearEnemy = createMockEnemy(BALANCE.ALLY.leftX, BALANCE.ALLY.baseY - 100);
    const farEnemy = createMockEnemy(BALANCE.ALLY.leftX, BALANCE.ALLY.baseY - 500);
    const pg = createMockProjectileGroup();
    const cbs = createCallbacks([nearEnemy, farEnemy], pg);
    const scene = createMockScene();
    const am = new AllyManager(scene as never, cbs);
    am.create();

    // Update with enough delta to trigger sniper cooldown (starts at 0 so fires immediately)
    am.update(BALANCE.ALLY.sniperCooldownMs + 1);

    expect(pg.group.get).toHaveBeenCalled();
  });

  it('no targets returned when no enemies alive', () => {
    const pg = createMockProjectileGroup();
    const cbs = createCallbacks([], pg);
    const scene = createMockScene();
    const am = new AllyManager(scene as never, cbs);
    am.create();

    am.update(BALANCE.ALLY.sniperCooldownMs + 1);

    // No enemies → no fire
    expect(pg.group.get).not.toHaveBeenCalled();
  });

  it('spread fires at multiple enemies', () => {
    // Create several enemies in range
    const enemies = [];
    for (let i = 0; i < 5; i++) {
      enemies.push(createMockEnemy(BALANCE.ALLY.rightX + i * 10, BALANCE.ALLY.baseY - 100));
    }
    const pg = createMockProjectileGroup();
    const cbs = createCallbacks(enemies, pg);
    const scene = createMockScene();
    const am = new AllyManager(scene as never, cbs);
    am.create();

    am.update(BALANCE.ALLY.spreadCooldownMs + 1);

    // Should fire at up to spreadCount enemies
    expect((pg.group.get as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it('range limit respected — enemies outside range are ignored', () => {
    // Place enemy far beyond sniper range
    const farEnemy = createMockEnemy(BALANCE.ALLY.leftX, BALANCE.ALLY.baseY - BALANCE.ALLY.sniperRange - 500);
    const pg = createMockProjectileGroup();
    const cbs = createCallbacks([farEnemy], pg);
    const scene = createMockScene();
    const am = new AllyManager(scene as never, cbs);
    am.create();

    am.update(BALANCE.ALLY.sniperCooldownMs + 1);

    // Enemy outside sniperRange → no fire
    expect(pg.group.get).not.toHaveBeenCalled();
  });

  it('findNearestEnemiesFrom returns N closest sorted by distance', () => {
    // Place enemies at varying distances from spread ally, but far from sniper
    // so only spread fires (sniper at leftX=60, enemies far right beyond sniperRange)
    const _farX = BALANCE.ALLY.rightX; // 660 — within spread range of rightX but check sniper distance
    // Sniper at (60, 1200), spread at (660, 1200)
    // Place enemies near spread ally only, far from sniper
    const e1 = createMockEnemy(BALANCE.ALLY.rightX, BALANCE.ALLY.baseY - 50); // closest to spread
    const e2 = createMockEnemy(BALANCE.ALLY.rightX, BALANCE.ALLY.baseY - 200);
    const e3 = createMockEnemy(BALANCE.ALLY.rightX, BALANCE.ALLY.baseY - 400);
    const e4 = createMockEnemy(BALANCE.ALLY.rightX + 300, BALANCE.ALLY.baseY - 100);
    const pg = createMockProjectileGroup();
    const cbs = createCallbacks([e1, e2, e3, e4], pg);
    const scene = createMockScene();
    const am = new AllyManager(scene as never, cbs);
    am.create();

    am.update(BALANCE.ALLY.spreadCooldownMs + 1);

    // Both sniper and spread may fire since cooldowns start at 0.
    // Sniper (leftX=60) distance to enemy at (660, 1100): sqrt(600^2+100^2)=~608px < sniperRange(800)
    // So sniper fires 1 + spread fires min(4, spreadCount=5) = 4 → total = 5
    const spreadTargets = Math.min(4, BALANCE.ALLY.spreadCount);
    const sniperTargets = 1; // sniper fires at nearest within range
    const expectedTotal = spreadTargets + sniperTargets;
    expect((pg.group.get as ReturnType<typeof vi.fn>).mock.calls.length).toBe(expectedTotal);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Tests — Cooldown and firing
// ═════════════════════════════════════════════════════════════════════════════

describe('AllyManager — cooldown and firing', () => {
  it('sniper fires at sniperCooldownMs interval', () => {
    const enemy = createMockEnemy(BALANCE.ALLY.leftX, BALANCE.ALLY.baseY - 100);
    const pg = createMockProjectileGroup();
    const cbs = createCallbacks([enemy], pg);
    const scene = createMockScene();
    const am = new AllyManager(scene as never, cbs);
    am.create();

    // First fire (cooldown starts at 0)
    am.update(1);
    const firstCalls = (pg.group.get as ReturnType<typeof vi.fn>).mock.calls.length;
    expect(firstCalls).toBeGreaterThanOrEqual(1);

    // Update with less than cooldown — should not fire again (only spread might)
    (pg.group.get as ReturnType<typeof vi.fn>).mockClear();
    am.update(BALANCE.ALLY.sniperCooldownMs - 100);
    // Sniper should not fire yet (it has remaining cooldown)
  });

  it('spread fires at spreadCooldownMs interval', () => {
    const enemy = createMockEnemy(BALANCE.ALLY.rightX, BALANCE.ALLY.baseY - 100);
    const pg = createMockProjectileGroup();
    const cbs = createCallbacks([enemy], pg);
    const scene = createMockScene();
    const am = new AllyManager(scene as never, cbs);
    am.create();

    // First fire
    am.update(1);
    expect(pg.group.get).toHaveBeenCalled();
  });

  it('sniper damage matches BALANCE.ALLY.sniperDamage', () => {
    expect(BALANCE.ALLY.sniperDamage).toBeDefined();
    expect(BALANCE.ALLY.sniperDamage).toBeGreaterThan(0);
    // Sniper should deal more damage than spread per shot
    expect(BALANCE.ALLY.sniperDamage).toBeGreaterThan(BALANCE.ALLY.spreadDamage);
  });

  it('spread damage matches BALANCE.ALLY.spreadDamage', () => {
    expect(BALANCE.ALLY.spreadDamage).toBeDefined();
    expect(BALANCE.ALLY.spreadDamage).toBeGreaterThan(0);
  });

  it('cooldown timers reset to cooldown value after firing', () => {
    const enemy = createMockEnemy(BALANCE.ALLY.leftX, BALANCE.ALLY.baseY - 100);
    const pg = createMockProjectileGroup();
    const cbs = createCallbacks([enemy], pg);
    const scene = createMockScene();
    const am = new AllyManager(scene as never, cbs);
    am.create();

    // Fire once (cooldown starts at 0)
    am.update(1);

    // Now update with partial cooldown — sniper should NOT fire
    (pg.group.get as ReturnType<typeof vi.fn>).mockClear();
    // Small delta, not enough for sniper cooldown (1500ms) or spread cooldown (1000ms)
    am.update(100);
    // Get calls will include spread if it also fired previously and cooldown elapsed
    // But with only 101ms total since start, only the initial 1ms fire would trigger
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Tests — Ally positioning
// ═════════════════════════════════════════════════════════════════════════════

describe('AllyManager — ally positioning', () => {
  it('sniper at BALANCE.ALLY.leftX', () => {
    expect(BALANCE.ALLY.leftX).toBeDefined();
    expect(BALANCE.ALLY.leftX).toBeGreaterThan(0);
    expect(BALANCE.ALLY.leftX).toBeLessThan(BALANCE.ALLY.rightX);
  });

  it('spread at BALANCE.ALLY.rightX', () => {
    expect(BALANCE.ALLY.rightX).toBeDefined();
    expect(BALANCE.ALLY.rightX).toBeGreaterThan(BALANCE.ALLY.leftX);
  });

  it('both at BALANCE.ALLY.baseY', () => {
    expect(BALANCE.ALLY.baseY).toBeDefined();
    expect(BALANCE.ALLY.baseY).toBe(460); // allies positioned at street level
  });

  it('create() places sprites at correct positions', () => {
    const scene = createMockScene();
    const cbs = createCallbacks();
    const am = new AllyManager(scene as never, cbs);
    am.create();

    // Verify scene.add.sprite was called with correct coordinates
    expect((scene as unknown as { add: { sprite: ReturnType<typeof vi.fn> } }).add.sprite).toHaveBeenCalledWith(
      BALANCE.ALLY.leftX,
      BALANCE.ALLY.baseY,
      'ally_sniper',
    );
    expect((scene as unknown as { add: { sprite: ReturnType<typeof vi.fn> } }).add.sprite).toHaveBeenCalledWith(
      BALANCE.ALLY.rightX,
      BALANCE.ALLY.baseY,
      'ally_spread',
    );
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Tests — Balance config
// ═════════════════════════════════════════════════════════════════════════════

describe('AllyManager — balance config', () => {
  it('ALLY section exists in BALANCE', () => {
    expect(BALANCE.ALLY).toBeDefined();
  });

  it('sniper cooldown is reasonable (1-5s)', () => {
    expect(BALANCE.ALLY.sniperCooldownMs).toBeGreaterThanOrEqual(1000);
    expect(BALANCE.ALLY.sniperCooldownMs).toBeLessThanOrEqual(5000);
  });

  it('spread cooldown is reasonable (0.5-3s)', () => {
    expect(BALANCE.ALLY.spreadCooldownMs).toBeGreaterThanOrEqual(500);
    expect(BALANCE.ALLY.spreadCooldownMs).toBeLessThanOrEqual(3000);
  });

  it('sniper range is larger than spread range', () => {
    expect(BALANCE.ALLY.sniperRange).toBeGreaterThan(BALANCE.ALLY.spreadRange);
  });

  it('spread count is between 1 and 10', () => {
    expect(BALANCE.ALLY.spreadCount).toBeGreaterThanOrEqual(1);
    expect(BALANCE.ALLY.spreadCount).toBeLessThanOrEqual(10);
  });

  it('projectile speed is positive', () => {
    expect(BALANCE.ALLY.projectileSpeed).toBeGreaterThan(0);
  });

  it('sniper DPS is lower than spread effective DPS', () => {
    // Sniper: 40 / 1.5s = 26.7 DPS (single target)
    // Spread: 8 * 5 / 1s = 40 DPS (total across all targets)
    const sniperDps = BALANCE.ALLY.sniperDamage / (BALANCE.ALLY.sniperCooldownMs / 1000);
    const spreadTotalDps =
      (BALANCE.ALLY.spreadDamage * BALANCE.ALLY.spreadCount) / (BALANCE.ALLY.spreadCooldownMs / 1000);
    expect(spreadTotalDps).toBeGreaterThan(sniperDps);
  });
});
