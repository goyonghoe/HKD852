import type { Enemy, EnemyDef, EnemyTier, DamageResult } from '../types/combat';
import type { EnemyBoardView } from '../types/combat-hooks';
import type { ElementColor } from '../types/hero';
import type { LevelData } from '../types/level';
import { BALANCE } from '../config/balance';

let enemyIdCounter = 0;

function nextEnemyId(): string {
  return `enemy_${++enemyIdCounter}`;
}

/** Reset ID counter (for testing) */
export function resetEnemyIdCounter(): void {
  enemyIdCounter = 0;
}

/**
 * Enemy board for Order Puzzle Combat (SPEC-021).
 *
 * Key differences from BoardState:
 * - Universal targeting: findNearest* returns nearest enemy regardless of element
 * - Shield-first damage model
 * - Enemy attack timers
 * - No gravity (enemies stay in fixed positions)
 *
 * Grid is stored as [row][col], row 0 = bottom.
 */
export class EnemyBoard implements EnemyBoardView {
  private grid: (Enemy | null)[][];
  readonly rows: number;
  readonly cols: number;

  constructor(rows: number, cols: number) {
    this.rows = rows;
    this.cols = cols;
    this.grid = Array.from({ length: rows }, () =>
      new Array<Enemy | null>(cols).fill(null),
    );
  }

  /** Build an EnemyBoard from a 2D array of enemy definitions */
  static fromDefs(rows: number, cols: number, defs: (EnemyDef | null)[][]): EnemyBoard {
    const board = new EnemyBoard(rows, cols);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const def = defs[row]?.[col];
        if (def) {
          const tierStats = BALANCE.COMBAT.ENEMY_TIER[def.tier];
          const hp = def.hpOverride ?? tierStats.hp;
          const shield = def.shieldOverride ?? tierStats.shield;
          const atk = def.atkOverride ?? tierStats.atk;
          const timer = def.timerOverride ?? tierStats.timer;

          board.grid[row][col] = {
            id: nextEnemyId(),
            element: def.element,
            tier: def.tier,
            row,
            col,
            maxHp: hp,
            currentHp: hp,
            shield,
            maxShield: shield,
            atk,
            attackTimer: timer,
            maxAttackTimer: timer,
            isDefeated: false,
          };
        }
      }
    }

    return board;
  }

  /**
   * Build an EnemyBoard from LevelData.
   * Uses `enemyGrid` if present; otherwise auto-converts `board.grid`.
   *
   * Auto-convert rules:
   *  - Each non-null cell → enemy with that element
   *  - Tier based on difficulty (easy=T1, normal=T1, hard→T2, boss→T2)
   *  - Armored cells → +1 tier (capped at T3) + shield from armor HP × 5
   */
  static fromLevelData(level: LevelData): EnemyBoard {
    const { rows, cols } = level.board;

    // Explicit enemyGrid takes priority
    if (level.enemyGrid) {
      return EnemyBoard.fromDefs(rows, cols, level.enemyGrid);
    }

    // Auto-convert from board.grid
    const armoredMap = new Map<string, number>();
    if (level.board.armored) {
      for (const a of level.board.armored) {
        armoredMap.set(`${a.row},${a.col}`, a.hp);
      }
    }

    const baseTier: EnemyTier = level.difficulty === 'hard' || level.difficulty === 'boss' ? 2 : 1;

    const defs: (EnemyDef | null)[][] = [];
    for (let r = 0; r < rows; r++) {
      const row: (EnemyDef | null)[] = [];
      for (let c = 0; c < cols; c++) {
        const element = level.board.grid[r]?.[c] as ElementColor | null;
        if (!element) {
          row.push(null);
          continue;
        }

        const armorHp = armoredMap.get(`${r},${c}`);
        let tier: EnemyTier = baseTier;
        let shieldOverride: number | undefined;

        if (armorHp !== undefined) {
          tier = Math.min(baseTier + 1, 3) as EnemyTier;
          shieldOverride = armorHp * 5;
        }

        row.push({ element, tier, ...(shieldOverride !== undefined && { shieldOverride }) });
      }
      defs.push(row);
    }

    return EnemyBoard.fromDefs(rows, cols, defs);
  }

  // ---- Universal Targeting (no element filter) ----

  /**
   * Find nearest enemy shooting DOWN into a column (from top edge).
   * Returns the first non-defeated enemy from the top of the grid.
   */
  findNearestFromTop(col: number): Enemy | null {
    if (col < 0 || col >= this.cols) return null;
    for (let row = this.rows - 1; row >= 0; row--) {
      const enemy = this.grid[row][col];
      if (enemy && !enemy.isDefeated) return enemy;
    }
    return null;
  }

  /**
   * Find nearest enemy shooting UP into a column (from bottom edge).
   * Returns the first non-defeated enemy from the bottom of the grid.
   */
  findNearestFromBottom(col: number): Enemy | null {
    if (col < 0 || col >= this.cols) return null;
    for (let row = 0; row < this.rows; row++) {
      const enemy = this.grid[row][col];
      if (enemy && !enemy.isDefeated) return enemy;
    }
    return null;
  }

  /**
   * Find nearest enemy shooting LEFT into a row (from right edge).
   * Returns the first non-defeated enemy from the right of the grid.
   */
  findNearestFromRight(row: number): Enemy | null {
    if (row < 0 || row >= this.rows) return null;
    for (let col = this.cols - 1; col >= 0; col--) {
      const enemy = this.grid[row][col];
      if (enemy && !enemy.isDefeated) return enemy;
    }
    return null;
  }

  /**
   * Find nearest enemy shooting RIGHT into a row (from left edge).
   * Returns the first non-defeated enemy from the left of the grid.
   */
  findNearestFromLeft(row: number): Enemy | null {
    if (row < 0 || row >= this.rows) return null;
    for (let col = 0; col < this.cols; col++) {
      const enemy = this.grid[row][col];
      if (enemy && !enemy.isDefeated) return enemy;
    }
    return null;
  }

  // ---- Damage ----

  /**
   * Apply damage to an enemy with shield-first absorption.
   *
   * Shield absorbs damage first. Overflow goes to HP.
   * Returns defeat status and overkill amount.
   */
  damageEnemy(enemyId: string, amount: number): DamageResult {
    const enemy = this.findEnemyById(enemyId);
    if (!enemy || enemy.isDefeated) {
      return { defeated: false, overkill: 0, shieldDamage: 0, hpDamage: 0 };
    }

    let remaining = amount;
    let shieldDamage = 0;
    let hpDamage = 0;

    // Shield absorbs first
    if (enemy.shield > 0) {
      shieldDamage = Math.min(enemy.shield, remaining);
      enemy.shield -= shieldDamage;
      remaining -= shieldDamage;
    }

    // Remainder goes to HP
    if (remaining > 0) {
      hpDamage = remaining;
      enemy.currentHp -= hpDamage;
    }

    let defeated = false;
    let overkill = 0;

    if (enemy.currentHp <= 0) {
      overkill = Math.abs(enemy.currentHp);
      enemy.currentHp = 0;
      enemy.isDefeated = true;
      this.grid[enemy.row][enemy.col] = null;
      defeated = true;
    }

    return { defeated, overkill, shieldDamage, hpDamage };
  }

  // ---- Timer Management ----

  /**
   * Decrement all alive enemy attack timers by 1.
   * Returns enemies whose timer reached 0 (ready to attack).
   */
  tickEnemyTimers(): Enemy[] {
    const ready: Enemy[] = [];

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const enemy = this.grid[row][col];
        if (enemy && !enemy.isDefeated) {
          enemy.attackTimer--;
          if (enemy.attackTimer <= 0) {
            ready.push(enemy);
          }
        }
      }
    }

    return ready;
  }

  /** Reset an enemy's attack timer to its max value */
  resetEnemyTimer(enemyId: string): void {
    const enemy = this.findEnemyById(enemyId);
    if (enemy && !enemy.isDefeated) {
      enemy.attackTimer = enemy.maxAttackTimer;
    }
  }

  // ---- Queries ----

  /** Check if all enemies are defeated */
  allDefeated(): boolean {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const enemy = this.grid[row][col];
        if (enemy && !enemy.isDefeated) return false;
      }
    }
    return true;
  }

  /** Count remaining non-defeated enemies */
  remainingEnemyCount(): number {
    let count = 0;
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const enemy = this.grid[row][col];
        if (enemy && !enemy.isDefeated) count++;
      }
    }
    return count;
  }

  /** Get enemy at position */
  getEnemyAt(row: number, col: number): Enemy | null {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return null;
    return this.grid[row][col];
  }

  /** Get a read-only snapshot of the grid */
  getSnapshot(): ReadonlyArray<ReadonlyArray<Enemy | null>> {
    return this.grid;
  }

  /** Find all non-defeated enemies matching a predicate */
  findEnemies(predicate: (enemy: Enemy) => boolean): Enemy[] {
    const result: Enemy[] = [];
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const enemy = this.grid[row][col];
        if (enemy && !enemy.isDefeated && predicate(enemy)) {
          result.push(enemy);
        }
      }
    }
    return result;
  }

  // ---- Internal ----

  private findEnemyById(enemyId: string): Enemy | null {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const enemy = this.grid[row][col];
        if (enemy?.id === enemyId) return enemy;
      }
    }
    // Also check defeated enemies (they're removed from grid but might be referenced)
    return null;
  }
}
