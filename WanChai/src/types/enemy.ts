export type EnemyShape = 'circle' | 'triangle' | 'rect' | 'diamond' | 'hexagon';
export type EnemyBehavior =
  | 'march'
  | 'zigzag'
  | 'dash'
  | 'slow_march'
  | 'split_on_death'
  | 'boss_chase'
  | 'boss_circle'
  | 'boss_burst'
  | 'shoot'
  | 'teleport'
  // Legacy behaviors remapped to march/dash for downward movement
  | 'chase'
  | 'slow_chase';

export type EnemyAttackStyle = 'melee' | 'ranged' | 'suicide';

/** Side-view enemy category: ground units walk on the floor, air units fly at varying heights. */
export type EnemyCategory = 'ground' | 'air';

export interface EnemyDef {
  readonly id: string;
  readonly shape: EnemyShape;
  readonly baseSize: number; // radius in px
  readonly baseSpeed: number; // px/s
  readonly baseHp: number;
  readonly baseDamage: number;
  readonly behavior: EnemyBehavior;
  readonly xpValue: number;
  readonly colorKey: string; // key in colors.ts
  readonly category: EnemyCategory; // 'ground' or 'air' — determines spawn Y and movement style
  readonly isElite?: boolean;
  readonly knockbackImmune?: boolean; // true = ignores knockback (bosses, tanks)
  readonly attackStyle?: EnemyAttackStyle; // default 'melee'
  readonly attackInterval?: number; // ms between attacks (default 2000)
  readonly projectileSpeed?: number; // ranged only (default 200)
}
