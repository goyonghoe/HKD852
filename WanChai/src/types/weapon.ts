export type TargetMode = 'nearest' | 'random' | 'aoe';
export type ProjectileType = 'bullet' | 'aoe' | 'laser' | 'chain' | 'homing' | 'bomb' | 'napalm';

export type WeaponRarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';

export interface WeaponRecipe {
  readonly primary: string;
  readonly primaryLevel: number;
  readonly secondary: string;
  readonly secondaryLevel: number;
}

export interface WeaponDef {
  readonly id: string;
  readonly name: string;
  readonly projectileType: ProjectileType;
  readonly targetMode: TargetMode;
  readonly baseDamage: number;
  readonly cooldownMs: number;
  readonly projectileSpeed: number; // px/s, 0 for instant
  readonly projectileCount: number;
  readonly piercing: number; // 0 = destroyed on hit
  readonly aoeRadius: number; // 0 = no AOE
  readonly range: number; // 0 = infinite
  readonly maxLevel: number;
  readonly tier?: number; // 1 = default, 2 = evolved
  readonly recipe?: WeaponRecipe; // T2 evolution recipe
}

export interface WeaponInstance {
  defId: string;
  level: number;
  cooldownRemaining: number;
  rarity?: WeaponRarity; // assigned on drop; absent = Common
}
