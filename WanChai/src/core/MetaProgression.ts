import type { MetaState } from '../types/game';

export interface MetaUpgradeDef {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly maxLevel: number;
  readonly costPerLevel: number[]; // gold cost for each level
  readonly effect: string;
  readonly valuePerLevel: number;
}

export const META_UPGRADES: Record<string, MetaUpgradeDef> = {
  meta_damage: {
    id: 'meta_damage',
    name: '기본 화력',
    description: '기본 공격력 +10%',
    maxLevel: 5,
    costPerLevel: [50, 100, 200, 400, 800],
    effect: 'damage',
    valuePerLevel: 0.1,
  },
  meta_hp: {
    id: 'meta_hp',
    name: '기지 강화',
    description: '기지 HP +15%',
    maxLevel: 5,
    costPerLevel: [50, 100, 200, 400, 800],
    effect: 'base_hp',
    valuePerLevel: 0.15,
  },
  meta_xp: {
    id: 'meta_xp',
    name: 'XP 부스터',
    description: 'XP 획득량 +20%',
    maxLevel: 3,
    costPerLevel: [100, 250, 600],
    effect: 'xp_bonus',
    valuePerLevel: 0.2,
  },
  meta_crit: {
    id: 'meta_crit',
    name: '정밀 조준',
    description: '치명타 확률 +3%',
    maxLevel: 5,
    costPerLevel: [60, 120, 250, 500, 1000],
    effect: 'crit_chance',
    valuePerLevel: 0.03,
  },
  meta_magnet: {
    id: 'meta_magnet',
    name: 'XP 흡수 범위',
    description: 'XP 흡수 범위 +20%',
    maxLevel: 3,
    costPerLevel: [100, 200, 400],
    effect: 'xp_magnet',
    valuePerLevel: 0.2,
  },
  meta_armor: {
    id: 'meta_armor',
    name: '기지 방어력',
    description: '기지 방어력 +8%',
    maxLevel: 5,
    costPerLevel: [80, 160, 250, 400, 600],
    effect: 'meta_armor',
    valuePerLevel: 0.08,
  },
  meta_luck: {
    id: 'meta_luck',
    name: '행운',
    description: '레어 무기 드롭률 +5%',
    maxLevel: 3,
    costPerLevel: [150, 300, 600],
    effect: 'rare_drop',
    valuePerLevel: 0.05,
  },
};

/** Check if an upgrade can be purchased */
export function canPurchase(meta: MetaState, upgradeId: string): boolean {
  const def = META_UPGRADES[upgradeId];
  if (!def) return false;
  const level = meta.upgrades[upgradeId] ?? 0;
  if (level >= def.maxLevel) return false;
  return meta.totalGold >= def.costPerLevel[level];
}

/** Purchase an upgrade. Returns new MetaState. */
export function purchaseUpgrade(meta: MetaState, upgradeId: string): MetaState {
  const def = META_UPGRADES[upgradeId];
  if (!def) return meta;
  const level = meta.upgrades[upgradeId] ?? 0;
  if (level >= def.maxLevel) return meta;
  const cost = def.costPerLevel[level];
  if (meta.totalGold < cost) return meta;

  return {
    ...meta,
    totalGold: meta.totalGold - cost,
    upgrades: {
      ...meta.upgrades,
      [upgradeId]: level + 1,
    },
  };
}

/** Get total multiplier for a given effect from meta upgrades */
export function getMetaBonus(meta: MetaState, effect: string): number {
  let bonus = 0;
  for (const [id, def] of Object.entries(META_UPGRADES)) {
    if (def.effect === effect) {
      const level = meta.upgrades[id] ?? 0;
      bonus += def.valuePerLevel * level;
    }
  }
  return bonus;
}
