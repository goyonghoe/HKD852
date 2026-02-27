import type { HeroInstance } from '../types/hero';
import type { Enemy, EnemyAttackEvent, EnemyDefeatEvent } from '../types/combat';
import type {
  BeltPosition,
  BeltHero,
  BeltEdge,
} from '../types/puzzle';
import type { LevelData } from '../types/level';
import type { CombatHook, EnemyBoardView } from '../types/combat-hooks';
import { EnemyBoard } from './EnemyBoard';
import { ConveyorState } from './ConveyorState';
import { getCombatMatchType, getElementMultiplier, type MatchType } from './ElementAdvantage';
import { enemyDefeatScore, overkillBonus, calculateStars } from './ScoreCalculator';
import { EventBus } from '../managers/EventBus';
import { GameEvents } from '../types/events';
import { BALANCE } from '../config/balance';

/** Result of a single step in the hero's orbit */
export interface CombatStepResult {
  readonly heroId: string;
  readonly beltPos: BeltPosition;
  readonly enemyHit: {
    readonly enemyId: string;
    readonly damage: number;
    readonly matchType: MatchType;
    readonly defeated: boolean;
    readonly overkill: number;
  } | null;
  readonly apRemaining: number;
}

/** Result of a hero's full orbit */
export interface CombatOrbitResult {
  readonly heroId: string;
  readonly steps: CombatStepResult[];
  readonly totalDefeated: number;
  readonly totalDamageDealt: number;
  readonly completed: boolean; // true = full loop
}

/** Result of deploying a hero (includes enemy counter-attack phase) */
export interface CombatDeployResult {
  readonly success: boolean;
  readonly gameOver: boolean;
  readonly battleComplete: boolean;
  readonly orbit: CombatOrbitResult | null;
  readonly enemyAttacks: EnemyAttackEvent[];
  readonly score: number;
  readonly stars: number;
  readonly heroBenched: boolean;
  readonly playerHp: number;
  readonly gameOverReason?: 'no_heroes' | 'belt_full' | 'bench_full' | 'player_defeated';
}

/**
 * Combat resolver for Order Puzzle Combat (SPEC-021).
 *
 * Key differences from TurnResolver:
 * - Universal targeting: heroes fire at nearest enemy in LOS regardless of element
 * - Damage = heroATK × elementMultiplier
 * - Enemy counter-attacks after each hero orbit
 * - Player HP pool
 * - No gravity
 */
export class CombatResolver {
  readonly board: EnemyBoard;
  readonly conveyor: ConveyorState;
  private heroGrid: HeroInstance[][];
  private score = 0;
  private slingCombo = 0;
  private slingCooldownActive = false;
  private turnCount = 0;
  private isGameOver = false;
  private isBattleComplete = false;
  private playerHp: number;
  private readonly maxPlayerHp: number;
  private readonly level: LevelData;
  private readonly eventBus: EventBus;
  private readonly hooks: CombatHook[];
  private combatInitialized = false;

  constructor(
    board: EnemyBoard,
    conveyor: ConveyorState,
    heroGrid: HeroInstance[][],
    level: LevelData,
    playerHp?: number,
    eventBus?: EventBus,
    hooks?: CombatHook[],
  ) {
    this.board = board;
    this.conveyor = conveyor;
    this.heroGrid = heroGrid;
    this.level = level;
    this.maxPlayerHp = playerHp ?? BALANCE.COMBAT.PLAYER_BASE_HP;
    this.playerHp = this.maxPlayerHp;
    this.eventBus = eventBus ?? EventBus.getInstance();
    this.hooks = hooks ?? [];
  }

  /** Initialize combat — call onCombatStart hooks (must be called before first deploy) */
  initCombat(): void {
    if (this.combatInitialized) return;
    this.combatInitialized = true;
    const allHeroes = this.heroGrid.flat();
    for (const hook of this.hooks) {
      hook.onCombatStart?.(allHeroes, this.board);
    }
  }

  /** Deploy from a specific column of the hero grid */
  deployFromColumn(colIdx: number, rapidDeploy = false): CombatDeployResult {
    if (this.isGameOver || this.isBattleComplete) {
      return this.makeResult(false, false, false, null, []);
    }
    if (colIdx < 0 || colIdx >= this.heroGrid.length) {
      return this.makeResult(false, false, false, null, []);
    }
    const column = this.heroGrid[colIdx];
    if (column.length === 0) {
      return this.makeResult(false, false, false, null, []);
    }
    return this.deployHero(column, rapidDeploy);
  }

  /** Deploy the next hero from the first non-empty column */
  deployNextHero(rapidDeploy = false): CombatDeployResult {
    if (this.isGameOver || this.isBattleComplete) {
      return this.makeResult(false, false, false, null, []);
    }
    const colIdx = this.heroGrid.findIndex((col) => col.length > 0);
    if (colIdx === -1) {
      if (!this.board.allDefeated()) {
        this.isGameOver = true;
        this.eventBus.emit(GameEvents.GAME_OVER, { reason: 'no_heroes' });
        return this.makeResult(false, true, false, null, [], false, 'no_heroes');
      }
      return this.makeResult(false, false, false, null, []);
    }
    return this.deployFromColumn(colIdx, rapidDeploy);
  }

  /** Core deploy logic */
  private deployHero(column: HeroInstance[], rapidDeploy: boolean): CombatDeployResult {
    const totalRemaining = this.getTotalRemaining();
    if (totalRemaining === 0) {
      if (!this.board.allDefeated()) {
        this.isGameOver = true;
        this.eventBus.emit(GameEvents.GAME_OVER, { reason: 'no_heroes' });
        return this.makeResult(false, true, false, null, [], false, 'no_heroes');
      }
      return this.makeResult(false, false, false, null, []);
    }

    if (!this.conveyor.canDeploy()) {
      this.isGameOver = true;
      this.eventBus.emit(GameEvents.GAME_OVER, { reason: 'belt_full' });
      return this.makeResult(false, true, false, null, [], false, 'belt_full');
    }

    // Sling combo
    if (rapidDeploy && !this.slingCooldownActive) {
      this.slingCombo = Math.min(this.slingCombo + 1, BALANCE.MAX_SLING_COMBO);
      this.eventBus.emit(GameEvents.SLING_COMBO, { count: this.slingCombo });
    } else if (!rapidDeploy) {
      this.slingCombo = 0;
    }

    // Hook: onTurnStart
    for (const hook of this.hooks) {
      hook.onTurnStart?.(this.board, this.turnCount);
    }

    // Pop hero from column
    const hero = column.shift()!;
    this.turnCount++;
    this.eventBus.emit(GameEvents.QUEUE_CHANGED, { remaining: this.getTotalRemaining() });
    this.eventBus.emit(GameEvents.HERO_DEPLOYED, { hero });

    // Hook: onDeploy
    for (const hook of this.hooks) {
      hook.onDeploy?.(hero, this.board);
    }

    // Place on belt
    const beltHero = this.conveyor.deployHero(hero)!;

    // Simulate orbit (universal targeting + ATK-based damage)
    const orbit = this.simulateOrbit(beltHero);

    // Hook: onHeroExit
    for (const hook of this.hooks) {
      hook.onHeroExit?.(hero, this.board);
    }

    // Remove from belt after orbit
    this.conveyor.removeHero(hero.id);

    // Sling break: deployed rapidly but destroyed nothing
    if (rapidDeploy && !this.slingCooldownActive && orbit.totalDefeated === 0) {
      this.slingCombo = 0;
      this.slingCooldownActive = true;
      this.eventBus.emit(GameEvents.SLING_BREAK);
    }

    // Check win BEFORE enemy phase
    let battleComplete = false;
    if (this.board.allDefeated()) {
      this.isBattleComplete = true;
      battleComplete = true;
      this.eventBus.emit(GameEvents.LEVEL_COMPLETE, {
        score: this.score,
        stars: calculateStars(this.score, this.level),
      });
      this.eventBus.emit(GameEvents.BOARD_CLEARED);
    }

    // Enemy counter-attack phase (only if battle not yet won)
    let enemyAttacks: EnemyAttackEvent[] = [];
    if (!battleComplete) {
      enemyAttacks = this.executeEnemyPhase();
      if (this.isGameOver) {
        return this.makeResult(true, true, false, orbit, enemyAttacks, false, 'player_defeated');
      }
    }

    // Bench logic — with universal targeting, full loops are rare but possible
    // (e.g., if all enemies in LOS from every position are already defeated mid-orbit)
    let heroBenched = false;
    if (!battleComplete && !this.isGameOver) {
      const shouldBench = orbit.completed && hero.ap > 0;
      if (shouldBench) {
        hero.lanePosition = -2;
        const ok = this.conveyor.moveToWaiting(hero);
        if (ok) {
          heroBenched = true;
          // Hook: onBench
          for (const hook of this.hooks) {
            hook.onBench?.(hero);
          }
          this.eventBus.emit(GameEvents.HERO_BENCHED, { hero });
        }
        // bench_full is NOT fatal in new system — hero is simply discarded
      }

      // Check lose: no more heroes and board not cleared
      if (this.getTotalRemaining() === 0 && this.conveyor.waitingCount() === 0) {
        this.isGameOver = true;
        this.eventBus.emit(GameEvents.GAME_OVER, { reason: 'no_heroes' });
        return this.makeResult(true, true, false, orbit, enemyAttacks, heroBenched, 'no_heroes');
      }
    }

    return this.makeResult(true, false, battleComplete, orbit, enemyAttacks, heroBenched);
  }

  /** Simulate hero traveling the entire belt with universal targeting */
  private simulateOrbit(beltHero: BeltHero): CombatOrbitResult {
    const steps: CombatStepResult[] = [];
    let totalDefeated = 0;
    let totalDamageDealt = 0;
    const hero = beltHero.hero;

    // Process starting position
    const startStep = this.processPosition(beltHero);
    steps.push(startStep);
    if (startStep.enemyHit) {
      totalDamageDealt += startStep.enemyHit.damage;
      if (startStep.enemyHit.defeated) totalDefeated++;
    }

    // Advance through the belt
    while (hero.ap > 0) {
      const completed = this.conveyor.advanceHero(beltHero);
      if (completed) {
        return { heroId: hero.id, steps, totalDefeated, totalDamageDealt, completed: true };
      }

      const step = this.processPosition(beltHero);
      steps.push(step);
      if (step.enemyHit) {
        totalDamageDealt += step.enemyHit.damage;
        if (step.enemyHit.defeated) totalDefeated++;
      }

      if (hero.ap <= 0) {
        hero.isSpent = true;
        this.eventBus.emit(GameEvents.HERO_SPENT, { hero });
        return { heroId: hero.id, steps, totalDefeated, totalDamageDealt, completed: false };
      }
    }

    hero.isSpent = true;
    this.eventBus.emit(GameEvents.HERO_SPENT, { hero });
    return { heroId: hero.id, steps, totalDefeated, totalDamageDealt, completed: false };
  }

  /** Process one belt position: fire at nearest enemy in LOS (universal targeting) */
  private processPosition(beltHero: BeltHero): CombatStepResult {
    const hero = beltHero.hero;
    const pos = this.conveyor.getPosition(beltHero.currentSeq);

    if (hero.ap <= 0) {
      return { heroId: hero.id, beltPos: pos, enemyHit: null, apRemaining: hero.ap };
    }

    // Universal targeting: find nearest enemy in LOS regardless of element
    let enemy = this.findTarget(pos);

    // Hook: onPreFire — allow hooks to override or skip target
    for (const hook of this.hooks) {
      const override = hook.onPreFire?.(hero, pos, this.board, enemy);
      if (override === 'skip') {
        return { heroId: hero.id, beltPos: pos, enemyHit: null, apRemaining: hero.ap };
      }
      if (override !== undefined && override !== null) {
        enemy = override;
      }
    }

    if (!enemy) {
      // No enemy in LOS — skip, no AP consumed
      return { heroId: hero.id, beltPos: pos, enemyHit: null, apRemaining: hero.ap };
    }

    // Calculate damage: ATK × element multiplier
    const matchType = getCombatMatchType(hero.element, enemy.element);
    const multiplier = getElementMultiplier(matchType);
    const damage = Math.floor(hero.atk * multiplier);

    // Apply damage
    hero.ap--;
    const result = this.board.damageEnemy(enemy.id, damage);

    // Hook: onPostFire
    for (const hook of this.hooks) {
      hook.onPostFire?.(hero, enemy, damage, result.defeated, this.board);
    }

    // Score
    if (result.defeated) {
      beltHero.shotsThisCycle++;
      const defeatEvent: EnemyDefeatEvent = {
        enemyId: enemy.id,
        element: enemy.element,
        tier: enemy.tier,
        row: enemy.row,
        col: enemy.col,
        fromEdge: pos.edge,
        matchType,
        overkillDamage: result.overkill,
      };

      const points = enemyDefeatScore(enemy.tier, this.slingCombo, matchType)
        + overkillBonus(result.overkill);
      this.score += points;

      // Hook: onKill
      for (const hook of this.hooks) {
        hook.onKill?.(hero, enemy, this.board);
      }

      // Drain pending splash/AoE effects from hooks
      this.drainPendingEffects();

      this.eventBus.emit(GameEvents.ENEMY_DEFEATED, defeatEvent);
      this.eventBus.emit(GameEvents.SCORE_CHANGED, { score: this.score });
    } else {
      this.eventBus.emit(GameEvents.ENEMY_DAMAGED, {
        enemyId: enemy.id,
        damage,
        matchType,
        remainingHp: enemy.currentHp,
        remainingShield: enemy.shield,
      });
    }

    return {
      heroId: hero.id,
      beltPos: pos,
      enemyHit: {
        enemyId: enemy.id,
        damage,
        matchType,
        defeated: result.defeated,
        overkill: result.overkill,
      },
      apRemaining: hero.ap,
    };
  }

  /** Find nearest enemy in LOS from a belt position (no element filter) */
  private findTarget(pos: BeltPosition): Enemy | null {
    switch (pos.edge) {
      case 'top':    return this.board.findNearestFromTop(pos.index);
      case 'bottom': return this.board.findNearestFromBottom(pos.index);
      case 'right':  return this.board.findNearestFromRight(pos.index);
      case 'left':   return this.board.findNearestFromLeft(pos.index);
    }
  }

  /** Execute enemy counter-attack phase: tick timers, apply attacks */
  private executeEnemyPhase(): EnemyAttackEvent[] {
    const readyEnemies = this.board.tickEnemyTimers();
    this.eventBus.emit(GameEvents.ENEMY_TIMER_TICK, {
      readyCount: readyEnemies.length,
    });

    const attacks: EnemyAttackEvent[] = [];
    for (const enemy of readyEnemies) {
      this.playerHp -= enemy.atk;
      this.board.resetEnemyTimer(enemy.id);

      const event: EnemyAttackEvent = {
        enemyId: enemy.id,
        damage: enemy.atk,
        playerHpAfter: Math.max(0, this.playerHp),
      };
      attacks.push(event);
      this.eventBus.emit(GameEvents.ENEMY_ATTACK, event);
      this.eventBus.emit(GameEvents.PLAYER_HP_CHANGED, { hp: this.playerHp, maxHp: this.maxPlayerHp });
    }

    if (this.playerHp <= 0) {
      this.playerHp = 0;
      this.isGameOver = true;
      this.eventBus.emit(GameEvents.GAME_OVER, { reason: 'player_defeated' });
    }

    return attacks;
  }

  // ---- Accessors ----

  getScore(): number { return this.score; }
  getSlingCombo(): number { return this.slingCombo; }
  getTurnCount(): number { return this.turnCount; }
  getPlayerHp(): number { return this.playerHp; }
  getMaxPlayerHp(): number { return this.maxPlayerHp; }
  getIsGameOver(): boolean { return this.isGameOver; }
  getIsBattleComplete(): boolean { return this.isBattleComplete; }

  getTotalRemaining(): number {
    return this.heroGrid.reduce((sum, col) => sum + col.length, 0);
  }

  getHeroGrid(): ReadonlyArray<ReadonlyArray<HeroInstance>> {
    return this.heroGrid;
  }

  getGridCols(): number {
    return this.heroGrid.length;
  }

  peekColumn(colIdx: number): HeroInstance | null {
    return this.heroGrid[colIdx]?.[0] ?? null;
  }

  getBenchCount(): number {
    return this.conveyor.waitingCount();
  }

  resetSlingCooldown(): void {
    this.slingCooldownActive = false;
  }

  getHooks(): ReadonlyArray<CombatHook> {
    return this.hooks;
  }

  // ---- Internal ----

  /**
   * Drain pending splash/AoE/double-strike effects from hooks.
   * Called after a kill to apply secondary damage.
   */
  private drainPendingEffects(): void {
    for (const hook of this.hooks) {
      // Splash targets (passive splash + relic splash_bonus)
      if ('getSplashTargets' in hook && typeof (hook as any).getSplashTargets === 'function') {
        const targets: Array<{ row: number; col: number }> = (hook as any).getSplashTargets();
        for (const t of targets) {
          const enemy = this.board.getEnemyAt(t.row, t.col);
          if (enemy && !enemy.isDefeated) {
            this.board.damageEnemy(enemy.id, BALANCE.COMBAT.SPLASH_DAMAGE);
          }
        }
      }

      // Kill AoE (relic wave_amulet)
      if ('getKillAoeTargets' in hook && typeof (hook as any).getKillAoeTargets === 'function') {
        const targets: Array<{ row: number; col: number; amount: number }> = (hook as any).getKillAoeTargets();
        for (const t of targets) {
          const enemy = this.board.getEnemyAt(t.row, t.col);
          if (enemy && !enemy.isDefeated) {
            this.board.damageEnemy(enemy.id, t.amount);
          }
        }
      }

      // Double-strike (passive)
      if ('getDoubleStrikeTarget' in hook && typeof (hook as any).getDoubleStrikeTarget === 'function') {
        const dblHook = hook as any;
        const target: Enemy | null = dblHook.getDoubleStrikeTarget();
        if (target && !target.isDefeated) {
          dblHook.beginDoubleStrike?.();
          this.board.damageEnemy(target.id, BALANCE.COMBAT.DOUBLE_STRIKE_DAMAGE);
          dblHook.endDoubleStrike?.();
        }
      }
    }
  }

  private makeResult(
    success: boolean,
    gameOver: boolean,
    battleComplete: boolean,
    orbit: CombatOrbitResult | null,
    enemyAttacks: EnemyAttackEvent[],
    heroBenched = false,
    gameOverReason?: 'no_heroes' | 'belt_full' | 'bench_full' | 'player_defeated',
  ): CombatDeployResult {
    return {
      success,
      gameOver: gameOver || this.isGameOver,
      battleComplete,
      orbit,
      enemyAttacks,
      score: this.score,
      stars: battleComplete ? calculateStars(this.score, this.level) : 0,
      heroBenched,
      playerHp: this.playerHp,
      gameOverReason,
    };
  }
}
