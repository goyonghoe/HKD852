export type TargetMode = 'nearest' | 'random' | 'aoe';
export type ProjectileType = 'bullet' | 'aoe' | 'laser' | 'chain' | 'homing' | 'bomb' | 'napalm';

export interface WeaponDef {
  readonly id: string;
  readonly name: string;
  readonly projectileType: ProjectileType;
  readonly targetMode: TargetMode;
  readonly baseDamage: number;
  readonly cooldownMs: number;
  readonly projectileSpeed: number;  // px/s, 0 for instant
  readonly projectileCount: number;
  readonly piercing: number;         // 0 = destroyed on hit
  readonly aoeRadius: number;        // 0 = no AOE
  readonly range: number;            // 0 = infinite
  readonly maxLevel: number;
}

export interface WeaponInstance {
  defId: string;
  level: number;
  cooldownRemaining: number;
}
