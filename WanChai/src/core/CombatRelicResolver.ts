import type { CombatHook, EnemyBoardView } from '../types/combat-hooks';
import type { HeroInstance } from '../types/hero';
import type { Enemy } from '../types/combat';
import type { BeltPosition } from '../types/puzzle';
import type { RelicDefinition, RelicEffect } from '../types/relic';
import { RELIC_DEFINITIONS } from '../data/relics/definitions';

/**
 * CombatRelicResolver — CombatHook for relic effects in Order Puzzle Combat.
 *
 * Adapted from RelicResolver for Enemy-based combat.
 * Key differences:
 *  - `los_ignore` and `element_ignore` are no-ops (universal targeting already covers)
 *  - `blight_bane` is a no-op (no blight modifiers in combat mode)
 *  - `splash_bonus` and `kill_aoe` target enemies instead of cubes
 */
export class CombatRelicResolver implements CombatHook {
  private readonly relics: RelicDefinition[];

  // --- splash_bonus (fire_ring) ---
  private splashTargets: Array<{ row: number; col: number }> = [];

  // --- kill_aoe (wave_amulet) ---
  private killAoeTargets: Array<{ row: number; col: number; amount: number }> = [];

  // --- auto_recall ---
  private pendingAutoRecall = 0;

  constructor(relicIds: string[]) {
    this.relics = relicIds
      .map((id) => RELIC_DEFINITIONS[id])
      .filter((r): r is RelicDefinition => r !== undefined);
  }

  // ---- CombatHook hooks ----

  onTurnStart(_board: EnemyBoardView, _turnCount: number): void {
    const recallEffect = this.getEffect('auto_recall');
    if (recallEffect && recallEffect.type === 'auto_recall') {
      this.pendingAutoRecall += recallEffect.count;
    }
  }

  onKill(hero: HeroInstance, enemy: Enemy, board: EnemyBoardView): void {
    // splash_bonus (fire_ring): fire hero → 8-way splash on kill
    const splashEffect = this.getEffect('splash_bonus');
    if (
      splashEffect &&
      splashEffect.type === 'splash_bonus' &&
      hero.element === splashEffect.element
    ) {
      const allNeighbors = this.getAllNeighbors(enemy.row, enemy.col, board);
      for (const n of allNeighbors) {
        this.splashTargets.push(n);
      }
    }

    // kill_aoe (wave_amulet): water hero → orthogonal AoE on kill
    const aoeEffect = this.getEffect('kill_aoe');
    if (
      aoeEffect &&
      aoeEffect.type === 'kill_aoe' &&
      hero.element === aoeEffect.element
    ) {
      const neighbors = this.getOrthogonalNeighbors(enemy.row, enemy.col, board);
      for (const n of neighbors) {
        this.killAoeTargets.push({ row: n.row, col: n.col, amount: aoeEffect.damage });
      }
    }
  }

  // ---- Pending-effect getters (return-and-clear) ----

  getSplashTargets(): Array<{ row: number; col: number }> {
    const targets = this.splashTargets.slice();
    this.splashTargets = [];
    return targets;
  }

  getKillAoeTargets(): Array<{ row: number; col: number; amount: number }> {
    const targets = this.killAoeTargets.slice();
    this.killAoeTargets = [];
    return targets;
  }

  getAutoRecallCount(): number {
    const count = this.pendingAutoRecall;
    this.pendingAutoRecall = 0;
    return count;
  }

  // ---- Private helpers ----

  private hasEffect(type: string): boolean {
    return this.relics.some((r) => r.effect.type === type);
  }

  private getEffect(type: string): RelicEffect | undefined {
    return this.relics.find((r) => r.effect.type === type)?.effect;
  }

  /** All 8 neighbors (orthogonal + diagonal) that are alive */
  private getAllNeighbors(
    row: number, col: number, board: EnemyBoardView,
  ): Array<{ row: number; col: number }> {
    const deltas = [
      { dr: -1, dc: 0 }, { dr: 1, dc: 0 },
      { dr: 0, dc: -1 }, { dr: 0, dc: 1 },
      { dr: -1, dc: -1 }, { dr: -1, dc: 1 },
      { dr: 1, dc: -1 }, { dr: 1, dc: 1 },
    ];
    const result: Array<{ row: number; col: number }> = [];
    for (const { dr, dc } of deltas) {
      const nr = row + dr;
      const nc = col + dc;
      const enemy = board.getEnemyAt(nr, nc);
      if (enemy && !enemy.isDefeated) {
        result.push({ row: nr, col: nc });
      }
    }
    return result;
  }

  /** Orthogonal neighbors only */
  private getOrthogonalNeighbors(
    row: number, col: number, board: EnemyBoardView,
  ): Array<{ row: number; col: number }> {
    const deltas = [
      { dr: -1, dc: 0 }, { dr: 1, dc: 0 },
      { dr: 0, dc: -1 }, { dr: 0, dc: 1 },
    ];
    const result: Array<{ row: number; col: number }> = [];
    for (const { dr, dc } of deltas) {
      const nr = row + dr;
      const nc = col + dc;
      const enemy = board.getEnemyAt(nr, nc);
      if (enemy && !enemy.isDefeated) {
        result.push({ row: nr, col: nc });
      }
    }
    return result;
  }
}
