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
  // Legacy behaviors remapped to march/dash for downward movement
  | 'chase'
  | 'slow_chase';

export interface EnemyDef {
  readonly id: string;
  readonly shape: EnemyShape;
  readonly baseSize: number;        // radius in px
  readonly baseSpeed: number;       // px/s
  readonly baseHp: number;
  readonly baseDamage: number;
  readonly behavior: EnemyBehavior;
  readonly xpValue: number;
  readonly colorKey: string;        // key in colors.ts
  readonly isElite?: boolean;
}
