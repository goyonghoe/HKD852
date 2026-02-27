import type { HeroInstance } from './hero';
import type { Cube, BeltPosition } from './puzzle';
import type { Enemy } from './combat';

// ---- Legacy (Cube-based) ----

export interface CombatPlugin {
  onCombatStart?(party: ReadonlyArray<HeroInstance>, board: CombatBoard): void;
  onTurnStart?(board: CombatBoard, turnCount: number): void;
  onDeploy?(hero: HeroInstance, board: CombatBoard): void;
  onPreFire?(hero: HeroInstance, pos: BeltPosition, board: CombatBoard, defaultTarget: Cube | null): Cube | null | 'skip';
  onPostFire?(hero: HeroInstance, target: Cube, damage: number, killed: boolean, board: CombatBoard): void;
  onKill?(hero: HeroInstance, cube: Cube, board: CombatBoard): void;
  onBench?(hero: HeroInstance): void;
  onHeroExit?(hero: HeroInstance, board: CombatBoard): void;
}

/** Minimal board interface for plugins (avoids importing BoardState directly in types) */
export interface CombatBoard {
  readonly rows: number;
  readonly cols: number;
  getCubeAt(row: number, col: number): Cube | null;
  remainingCubeCount(): number;
  isEmpty(): boolean;
}

// ---- Order Puzzle Combat (SPEC-021) — Enemy-based hooks ----

/** Read-only view of EnemyBoard for combat hooks */
export interface EnemyBoardView {
  readonly rows: number;
  readonly cols: number;
  getEnemyAt(row: number, col: number): Enemy | null;
  remainingEnemyCount(): number;
  allDefeated(): boolean;
}

/** Combat hook interface for Order Puzzle Combat (Enemy-based) */
export interface CombatHook {
  onCombatStart?(party: ReadonlyArray<HeroInstance>, board: EnemyBoardView): void;
  onTurnStart?(board: EnemyBoardView, turnCount: number): void;
  onDeploy?(hero: HeroInstance, board: EnemyBoardView): void;
  onPreFire?(hero: HeroInstance, pos: BeltPosition, board: EnemyBoardView, defaultTarget: Enemy | null): Enemy | null | 'skip';
  onPostFire?(hero: HeroInstance, target: Enemy, damage: number, defeated: boolean, board: EnemyBoardView): void;
  onKill?(hero: HeroInstance, enemy: Enemy, board: EnemyBoardView): void;
  onBench?(hero: HeroInstance): void;
  onHeroExit?(hero: HeroInstance, board: EnemyBoardView): void;
}
