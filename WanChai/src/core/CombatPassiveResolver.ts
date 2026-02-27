import type { CombatHook, EnemyBoardView } from '../types/combat-hooks';
import type { HeroInstance } from '../types/hero';
import type { Enemy } from '../types/combat';
import type { BeltPosition } from '../types/puzzle';
import type { PassiveSkillId } from '../types/critter';

/**
 * CombatPassiveResolver — CombatHook for critter passive skills in Order Puzzle Combat.
 *
 * Adapted from PassiveResolver for the Enemy-based combat system.
 * Key differences from legacy:
 *  - `pierce` is not needed (universal targeting already hits any enemy)
 *  - `splash` targets enemies instead of cubes
 *  - `double_strike` returns Enemy instead of Cube
 *  - `curse` damages all enemies instead of cubes
 *  - `absorb` checks same-element kill on Enemy
 */
export class CombatPassiveResolver implements CombatHook {
  // --- splash ---
  private splashTargets: Array<{ row: number; col: number }> = [];

  // --- double_strike ---
  private doubleStrikeTarget: Enemy | null = null;
  private inDoubleStrike = false;

  // --- barrier ---
  private barrierActive = false;

  // --- bless ---
  private blessApplied = false;

  // --- curse ---
  private curseDamageCount = 0;

  // ---- CombatHook hooks ----

  onCombatStart(party: ReadonlyArray<HeroInstance>, _board: EnemyBoardView): void {
    if (!this.blessApplied) {
      const blessCount = this.countPassive(party, 'bless');
      if (blessCount > 0) {
        for (const hero of party) {
          (hero as { maxAP: number }).maxAP += 1;
          hero.ap += 1;
        }
        this.blessApplied = true;
      }
    }
    this.curseDamageCount = this.countPassive(party, 'curse');
  }

  onDeploy(hero: HeroInstance, _board: EnemyBoardView): void {
    if (this.hasPassive(hero, 'recall')) {
      hero.ap += 1;
    }
  }

  onPostFire(
    hero: HeroInstance,
    target: Enemy,
    _damage: number,
    defeated: boolean,
    _board: EnemyBoardView,
  ): void {
    // double_strike: if enemy was NOT defeated, schedule another hit
    if (!this.inDoubleStrike && !defeated && this.hasPassive(hero, 'double_strike')) {
      this.doubleStrikeTarget = target;
    }

    // absorb: +1 AP if same-element kill
    if (defeated && this.hasPassive(hero, 'absorb') && hero.element === target.element) {
      hero.ap += 1;
    }
  }

  onKill(hero: HeroInstance, enemy: Enemy, board: EnemyBoardView): void {
    if (this.hasPassive(hero, 'splash')) {
      const neighbors = this.getOrthogonalNeighbors(enemy.row, enemy.col, board);
      for (const n of neighbors) {
        this.splashTargets.push(n);
      }
    }
  }

  onBench(hero: HeroInstance): void {
    if (this.hasPassive(hero, 'barrier')) {
      this.barrierActive = true;
    }
  }

  onHeroExit(hero: HeroInstance, _board: EnemyBoardView): void {
    if (this.hasPassive(hero, 'regen')) {
      hero.ap = Math.min(hero.ap + 1, hero.maxAP);
    }
  }

  // ---- Pending-effect getters (return-and-clear) ----

  getSplashTargets(): Array<{ row: number; col: number }> {
    const targets = this.splashTargets.slice();
    this.splashTargets = [];
    return targets;
  }

  getDoubleStrikeTarget(): Enemy | null {
    const t = this.doubleStrikeTarget;
    this.doubleStrikeTarget = null;
    return t;
  }

  beginDoubleStrike(): void { this.inDoubleStrike = true; }
  endDoubleStrike(): void { this.inDoubleStrike = false; }

  isBarrierActive(): boolean {
    const v = this.barrierActive;
    this.barrierActive = false;
    return v;
  }

  getCurseDamage(): number {
    return this.curseDamageCount;
  }

  // ---- Private helpers ----

  private hasPassive(hero: HeroInstance, id: PassiveSkillId): boolean {
    return hero.passives?.includes(id) ?? false;
  }

  private countPassive(party: ReadonlyArray<HeroInstance>, id: PassiveSkillId): number {
    return party.filter((h) => this.hasPassive(h, id)).length;
  }

  private getOrthogonalNeighbors(
    row: number,
    col: number,
    board: EnemyBoardView,
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
