export interface PassiveDef {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly maxLevel: number;
  readonly effect: PassiveEffect;
  readonly valuePerLevel: number;
}

export type PassiveEffect =
  | 'move_speed'
  | 'attack_speed'
  | 'damage'
  | 'base_armor'
  | 'hp_regen'
  | 'crit_chance'
  | 'crit_damage';
