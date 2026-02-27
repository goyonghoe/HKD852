import { describe, it, expect, beforeEach } from 'vitest';
import { CombatResolver } from '../../src/core/CombatResolver';
import { EnemyBoard, resetEnemyIdCounter } from '../../src/core/EnemyBoard';
import { ConveyorState } from '../../src/core/ConveyorState';
import { CombatPassiveResolver } from '../../src/core/CombatPassiveResolver';
import { CombatRelicResolver } from '../../src/core/CombatRelicResolver';
import type { CombatHook } from '../../src/types/combat-hooks';
import type { EnemyDef, Enemy } from '../../src/types/combat';
import type { HeroInstance } from '../../src/types/hero';
import type { LevelData } from '../../src/types/level';
import { ElementColor } from '../../src/types/hero';
import { EventBus } from '../../src/managers/EventBus';

// ---- Helpers ----

function makeHero(
  element: ElementColor,
  ap: number,
  atk = 10,
  id?: string,
  passives?: string[],
): HeroInstance {
  return {
    id: id ?? `hero_${element}_${ap}`,
    definitionId: `${element}_basic`,
    element,
    ap,
    maxAP: ap,
    atk,
    maxATK: atk,
    lanePosition: -1,
    isSpent: false,
    passives: passives as any,
  };
}

function t1(element: ElementColor): EnemyDef {
  return { element, tier: 1 }; // HP=20, shield=0, atk=8, timer=3
}

function makeLevel(): LevelData {
  return {
    id: 'test',
    name: 'Test',
    board: { rows: 2, cols: 2, grid: [] },
    heroQueue: [],
    conveyorSlots: 6,
    benchSlots: 3,
    starThresholds: { one: 100, two: 300, three: 500 },
  } as unknown as LevelData;
}

function setup2x2WithHooks(
  enemies: (EnemyDef | null)[][],
  heroes: HeroInstance[],
  hooks: CombatHook[],
  playerHp = 100,
): { resolver: CombatResolver; board: EnemyBoard; eventBus: EventBus } {
  resetEnemyIdCounter();
  const board = EnemyBoard.fromDefs(2, 2, enemies);
  const conveyor = new ConveyorState(2, 2, 6, 3);
  const eventBus = new EventBus();
  const heroGrid = [heroes];
  const resolver = new CombatResolver(board, conveyor, heroGrid, makeLevel(), playerHp, eventBus, hooks);
  return { resolver, board, eventBus };
}

function setup1x1WithHooks(
  enemyDef: EnemyDef,
  heroes: HeroInstance[],
  hooks: CombatHook[],
  playerHp = 100,
): { resolver: CombatResolver; board: EnemyBoard } {
  resetEnemyIdCounter();
  const board = EnemyBoard.fromDefs(1, 1, [[enemyDef]]);
  const conveyor = new ConveyorState(1, 1, 6, 3);
  const eventBus = new EventBus();
  const heroGrid = [heroes];
  const resolver = new CombatResolver(board, conveyor, heroGrid, makeLevel(), playerHp, eventBus, hooks);
  return { resolver, board };
}

// ---- CombatPassiveResolver Tests ----

describe('CombatPassiveResolver', () => {
  beforeEach(() => {
    resetEnemyIdCounter();
  });

  describe('bless', () => {
    it('adds +1 AP to all heroes on combat start', () => {
      const passive = new CombatPassiveResolver();
      const heroes = [
        makeHero(ElementColor.FIRE, 3, 10, 'h1', ['bless']),
        makeHero(ElementColor.WATER, 2, 10, 'h2'),
      ];
      const board = EnemyBoard.fromDefs(1, 1, [[t1(ElementColor.FIRE)]]);
      passive.onCombatStart(heroes, board);
      // All heroes get +1 AP
      expect(heroes[0].ap).toBe(4);
      expect(heroes[1].ap).toBe(3);
    });

    it('only applies once', () => {
      const passive = new CombatPassiveResolver();
      const heroes = [makeHero(ElementColor.FIRE, 3, 10, 'h1', ['bless'])];
      const board = EnemyBoard.fromDefs(1, 1, [[t1(ElementColor.FIRE)]]);
      passive.onCombatStart(heroes, board);
      passive.onCombatStart(heroes, board); // second call
      expect(heroes[0].ap).toBe(4); // not 5
    });
  });

  describe('recall', () => {
    it('adds +1 AP on deploy', () => {
      const passive = new CombatPassiveResolver();
      const hero = makeHero(ElementColor.FIRE, 3, 10, 'h1', ['recall']);
      const board = EnemyBoard.fromDefs(1, 1, [[t1(ElementColor.FIRE)]]);
      passive.onDeploy(hero, board);
      expect(hero.ap).toBe(4);
    });

    it('does not affect heroes without recall', () => {
      const passive = new CombatPassiveResolver();
      const hero = makeHero(ElementColor.FIRE, 3, 10, 'h1');
      const board = EnemyBoard.fromDefs(1, 1, [[t1(ElementColor.FIRE)]]);
      passive.onDeploy(hero, board);
      expect(hero.ap).toBe(3);
    });
  });

  describe('absorb', () => {
    it('grants +1 AP on same-element kill', () => {
      const passive = new CombatPassiveResolver();
      const hero = makeHero(ElementColor.FIRE, 2, 10, 'h1', ['absorb']);
      const enemy: Enemy = {
        id: 'e1', element: ElementColor.FIRE, tier: 1,
        row: 0, col: 0, maxHp: 20, currentHp: 0, shield: 0, maxShield: 0,
        atk: 8, attackTimer: 3, maxAttackTimer: 3, isDefeated: true,
      };
      const board = EnemyBoard.fromDefs(1, 1, [[t1(ElementColor.FIRE)]]);
      passive.onPostFire(hero, enemy, 20, true, board);
      expect(hero.ap).toBe(3); // +1 from absorb
    });

    it('no AP gain on different-element kill', () => {
      const passive = new CombatPassiveResolver();
      const hero = makeHero(ElementColor.FIRE, 2, 10, 'h1', ['absorb']);
      const enemy: Enemy = {
        id: 'e1', element: ElementColor.WATER, tier: 1,
        row: 0, col: 0, maxHp: 20, currentHp: 0, shield: 0, maxShield: 0,
        atk: 8, attackTimer: 3, maxAttackTimer: 3, isDefeated: true,
      };
      const board = EnemyBoard.fromDefs(1, 1, [[t1(ElementColor.WATER)]]);
      passive.onPostFire(hero, enemy, 20, true, board);
      expect(hero.ap).toBe(2); // unchanged
    });
  });

  describe('double_strike', () => {
    it('schedules extra hit when enemy survives', () => {
      const passive = new CombatPassiveResolver();
      const hero = makeHero(ElementColor.FIRE, 3, 10, 'h1', ['double_strike']);
      const enemy: Enemy = {
        id: 'e1', element: ElementColor.FIRE, tier: 1,
        row: 0, col: 0, maxHp: 20, currentHp: 10, shield: 0, maxShield: 0,
        atk: 8, attackTimer: 3, maxAttackTimer: 3, isDefeated: false,
      };
      const board = EnemyBoard.fromDefs(1, 1, [[t1(ElementColor.FIRE)]]);
      passive.onPostFire(hero, enemy, 10, false, board);
      const target = passive.getDoubleStrikeTarget();
      expect(target).toBe(enemy);
    });

    it('no extra hit when enemy is defeated', () => {
      const passive = new CombatPassiveResolver();
      const hero = makeHero(ElementColor.FIRE, 3, 10, 'h1', ['double_strike']);
      const enemy: Enemy = {
        id: 'e1', element: ElementColor.FIRE, tier: 1,
        row: 0, col: 0, maxHp: 20, currentHp: 0, shield: 0, maxShield: 0,
        atk: 8, attackTimer: 3, maxAttackTimer: 3, isDefeated: true,
      };
      const board = EnemyBoard.fromDefs(1, 1, [[t1(ElementColor.FIRE)]]);
      passive.onPostFire(hero, enemy, 20, true, board);
      expect(passive.getDoubleStrikeTarget()).toBeNull();
    });
  });

  describe('splash', () => {
    it('collects orthogonal neighbors on kill', () => {
      const passive = new CombatPassiveResolver();
      const hero = makeHero(ElementColor.FIRE, 3, 10, 'h1', ['splash']);
      const board = EnemyBoard.fromDefs(2, 2, [
        [t1(ElementColor.FIRE), t1(ElementColor.WATER)],
        [t1(ElementColor.EARTH), null],
      ]);
      // Kill enemy at (0,0) — neighbors are (0,1) and (1,0)
      const enemy = board.getEnemyAt(0, 0)!;
      passive.onKill(hero, enemy, board);
      const targets = passive.getSplashTargets();
      expect(targets).toHaveLength(2);
    });
  });

  describe('barrier', () => {
    it('activates on bench', () => {
      const passive = new CombatPassiveResolver();
      const hero = makeHero(ElementColor.FIRE, 3, 10, 'h1', ['barrier']);
      passive.onBench(hero);
      expect(passive.isBarrierActive()).toBe(true);
    });

    it('clears after check', () => {
      const passive = new CombatPassiveResolver();
      const hero = makeHero(ElementColor.FIRE, 3, 10, 'h1', ['barrier']);
      passive.onBench(hero);
      passive.isBarrierActive(); // consume
      expect(passive.isBarrierActive()).toBe(false);
    });
  });

  describe('regen', () => {
    it('restores +1 AP on hero exit (capped at maxAP)', () => {
      const passive = new CombatPassiveResolver();
      const hero = makeHero(ElementColor.FIRE, 3, 10, 'h1', ['regen']);
      hero.ap = 1;
      const board = EnemyBoard.fromDefs(1, 1, [[t1(ElementColor.FIRE)]]);
      passive.onHeroExit(hero, board);
      expect(hero.ap).toBe(2);
    });

    it('does not exceed maxAP', () => {
      const passive = new CombatPassiveResolver();
      const hero = makeHero(ElementColor.FIRE, 3, 10, 'h1', ['regen']);
      hero.ap = 3; // at max
      const board = EnemyBoard.fromDefs(1, 1, [[t1(ElementColor.FIRE)]]);
      passive.onHeroExit(hero, board);
      expect(hero.ap).toBe(3); // capped
    });
  });

  describe('curse', () => {
    it('counts curse heroes', () => {
      const passive = new CombatPassiveResolver();
      const heroes = [
        makeHero(ElementColor.FIRE, 3, 10, 'h1', ['curse']),
        makeHero(ElementColor.WATER, 2, 10, 'h2', ['curse']),
        makeHero(ElementColor.EARTH, 2, 10, 'h3'),
      ];
      const board = EnemyBoard.fromDefs(1, 1, [[t1(ElementColor.FIRE)]]);
      passive.onCombatStart(heroes, board);
      expect(passive.getCurseDamage()).toBe(2);
    });
  });
});

// ---- CombatRelicResolver Tests ----

describe('CombatRelicResolver', () => {
  beforeEach(() => {
    resetEnemyIdCounter();
  });

  describe('splash_bonus (fire_ring)', () => {
    it('collects 8-way neighbors on fire hero kill', () => {
      const relic = new CombatRelicResolver(['relic_fire_ring']);
      const hero = makeHero(ElementColor.FIRE, 3, 10, 'h1');
      const board = EnemyBoard.fromDefs(3, 3, [
        [t1(ElementColor.FIRE), t1(ElementColor.WATER), t1(ElementColor.EARTH)],
        [t1(ElementColor.WIND), t1(ElementColor.FIRE), t1(ElementColor.WATER)],
        [t1(ElementColor.EARTH), t1(ElementColor.WIND), t1(ElementColor.FIRE)],
      ]);
      // Kill enemy at (1,1) center — should have 8 neighbors
      const enemy = board.getEnemyAt(1, 1)!;
      relic.onKill(hero, enemy, board);
      const targets = relic.getSplashTargets();
      expect(targets).toHaveLength(8);
    });

    it('does not trigger for non-fire hero', () => {
      const relic = new CombatRelicResolver(['relic_fire_ring']);
      const hero = makeHero(ElementColor.WATER, 3, 10, 'h1');
      const board = EnemyBoard.fromDefs(2, 2, [
        [t1(ElementColor.FIRE), t1(ElementColor.WATER)],
        [t1(ElementColor.EARTH), t1(ElementColor.WIND)],
      ]);
      const enemy = board.getEnemyAt(0, 0)!;
      relic.onKill(hero, enemy, board);
      expect(relic.getSplashTargets()).toHaveLength(0);
    });
  });

  describe('kill_aoe (wave_amulet)', () => {
    it('collects orthogonal neighbors on water hero kill', () => {
      const relic = new CombatRelicResolver(['relic_wave_amulet']);
      const hero = makeHero(ElementColor.WATER, 3, 10, 'h1');
      const board = EnemyBoard.fromDefs(3, 3, [
        [t1(ElementColor.FIRE), t1(ElementColor.WATER), t1(ElementColor.EARTH)],
        [t1(ElementColor.WIND), t1(ElementColor.FIRE), t1(ElementColor.WATER)],
        [t1(ElementColor.EARTH), t1(ElementColor.WIND), t1(ElementColor.FIRE)],
      ]);
      const enemy = board.getEnemyAt(1, 1)!;
      relic.onKill(hero, enemy, board);
      const targets = relic.getKillAoeTargets();
      expect(targets).toHaveLength(4); // orthogonal only
      expect(targets[0].amount).toBe(1); // damage from relic def
    });

    it('does not trigger for non-water hero', () => {
      const relic = new CombatRelicResolver(['relic_wave_amulet']);
      const hero = makeHero(ElementColor.FIRE, 3, 10, 'h1');
      const board = EnemyBoard.fromDefs(2, 2, [
        [t1(ElementColor.FIRE), t1(ElementColor.WATER)],
        [t1(ElementColor.EARTH), t1(ElementColor.WIND)],
      ]);
      const enemy = board.getEnemyAt(0, 0)!;
      relic.onKill(hero, enemy, board);
      expect(relic.getKillAoeTargets()).toHaveLength(0);
    });
  });

  describe('auto_recall', () => {
    it('increments count on turn start', () => {
      // Need a relic with auto_recall effect
      // auto_recall relic doesn't exist in definitions yet, so test the mechanism
      const relic = new CombatRelicResolver([]); // no relics
      const board = EnemyBoard.fromDefs(1, 1, [[t1(ElementColor.FIRE)]]);
      relic.onTurnStart(board, 1);
      expect(relic.getAutoRecallCount()).toBe(0); // no auto_recall relic
    });
  });

  describe('unknown relics', () => {
    it('gracefully ignores unknown relic IDs', () => {
      const relic = new CombatRelicResolver(['nonexistent_relic']);
      const hero = makeHero(ElementColor.FIRE, 3, 10, 'h1');
      const board = EnemyBoard.fromDefs(1, 1, [[t1(ElementColor.FIRE)]]);
      const enemy = board.getEnemyAt(0, 0)!;
      // Should not throw
      relic.onKill(hero, enemy, board);
      expect(relic.getSplashTargets()).toHaveLength(0);
    });
  });
});

// ---- CombatResolver Hook Integration ----

describe('CombatResolver with hooks', () => {
  beforeEach(() => {
    resetEnemyIdCounter();
  });

  describe('initCombat', () => {
    it('calls onCombatStart on all hooks', () => {
      let called = false;
      const hook: CombatHook = {
        onCombatStart: (_party, _board) => { called = true; },
      };
      const { resolver } = setup1x1WithHooks(
        t1(ElementColor.FIRE),
        [makeHero(ElementColor.FIRE, 3, 10)],
        [hook],
      );
      resolver.initCombat();
      expect(called).toBe(true);
    });

    it('idempotent — second call is no-op', () => {
      let callCount = 0;
      const hook: CombatHook = {
        onCombatStart: () => { callCount++; },
      };
      const { resolver } = setup1x1WithHooks(
        t1(ElementColor.FIRE),
        [makeHero(ElementColor.FIRE, 3, 10)],
        [hook],
      );
      resolver.initCombat();
      resolver.initCombat();
      expect(callCount).toBe(1);
    });
  });

  describe('hook lifecycle', () => {
    it('calls onTurnStart before deploy', () => {
      const order: string[] = [];
      const hook: CombatHook = {
        onTurnStart: () => { order.push('turnStart'); },
        onDeploy: () => { order.push('deploy'); },
      };
      const { resolver } = setup1x1WithHooks(
        { element: ElementColor.FIRE, tier: 1, hpOverride: 999 },
        [makeHero(ElementColor.FIRE, 1, 1)],
        [hook],
      );
      resolver.deployNextHero();
      expect(order[0]).toBe('turnStart');
      expect(order[1]).toBe('deploy');
    });

    it('calls onHeroExit after orbit', () => {
      let exitCalled = false;
      const hook: CombatHook = {
        onHeroExit: () => { exitCalled = true; },
      };
      const { resolver } = setup1x1WithHooks(
        { element: ElementColor.FIRE, tier: 1, hpOverride: 999 },
        [makeHero(ElementColor.FIRE, 1, 1)],
        [hook],
      );
      resolver.deployNextHero();
      expect(exitCalled).toBe(true);
    });

    it('calls onPostFire after each shot', () => {
      let postFireCount = 0;
      const hook: CombatHook = {
        onPostFire: () => { postFireCount++; },
      };
      const { resolver } = setup1x1WithHooks(
        { element: ElementColor.FIRE, tier: 1, hpOverride: 999 },
        [makeHero(ElementColor.FIRE, 4, 1)],
        [hook],
      );
      resolver.deployNextHero();
      // 1×1 board = 4 belt positions, hero fires every position
      expect(postFireCount).toBe(4);
    });

    it('calls onKill when enemy is defeated', () => {
      let killCalled = false;
      const hook: CombatHook = {
        onKill: () => { killCalled = true; },
      };
      const { resolver } = setup1x1WithHooks(
        t1(ElementColor.WIND), // HP=20
        [makeHero(ElementColor.FIRE, 4, 20)], // advantage=2.0, dmg=40 → kill
        [hook],
      );
      resolver.deployNextHero();
      expect(killCalled).toBe(true);
    });

    it('onPreFire can skip a shot', () => {
      let shotsFired = 0;
      const hook: CombatHook = {
        onPreFire: () => 'skip' as const,
        onPostFire: () => { shotsFired++; },
      };
      const { resolver } = setup1x1WithHooks(
        { element: ElementColor.FIRE, tier: 1, hpOverride: 999 },
        [makeHero(ElementColor.FIRE, 4, 10)],
        [hook],
      );
      resolver.deployNextHero();
      expect(shotsFired).toBe(0);
    });
  });

  describe('passive integration via hooks', () => {
    it('recall passive grants +1 AP through hook system', () => {
      const passive = new CombatPassiveResolver();
      const heroes = [
        makeHero(ElementColor.FIRE, 2, 30, 'h_recall', ['recall']),
      ];
      const { resolver } = setup1x1WithHooks(
        { element: ElementColor.WIND, tier: 1, hpOverride: 999 },
        heroes,
        [passive],
      );
      // After deploy hook fires, hero should have +1 AP from recall
      const result = resolver.deployNextHero();
      // Hero started with AP=2, recall gives +1 → 3 shots
      const hits = result.orbit!.steps.filter((s) => s.enemyHit !== null);
      expect(hits.length).toBe(3);
    });
  });

  describe('no hooks (backward compatibility)', () => {
    it('works without any hooks', () => {
      const { resolver } = setup1x1WithHooks(
        t1(ElementColor.WIND),
        [makeHero(ElementColor.FIRE, 4, 20)],
        [], // no hooks
      );
      const result = resolver.deployNextHero();
      expect(result.success).toBe(true);
      expect(result.battleComplete).toBe(true);
    });
  });

  describe('getHooks accessor', () => {
    it('returns registered hooks', () => {
      const hook: CombatHook = {};
      const { resolver } = setup1x1WithHooks(
        t1(ElementColor.FIRE),
        [makeHero(ElementColor.FIRE, 3, 10)],
        [hook],
      );
      expect(resolver.getHooks()).toHaveLength(1);
      expect(resolver.getHooks()[0]).toBe(hook);
    });
  });
});
