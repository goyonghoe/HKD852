import { SeededRandom } from './SeededRandom';

export interface UpgradeChoice {
  type: 'weapon' | 'passive';
  id: string;
  name: string;
  description: string;
  level: number;      // the level it will become
  isNew: boolean;     // new acquisition vs upgrade
}

/**
 * Selects N random upgrade choices for level-up.
 * Prioritizes upgrading owned weapons, then new weapons, then passives.
 */
export function selectUpgrades(
  ownedWeapons: { id: string; level: number; maxLevel: number }[],
  ownedPassives: { id: string; level: number; maxLevel: number }[],
  allWeaponIds: string[],
  allPassiveIds: string[],
  weaponNames: Record<string, string>,
  passiveData: Record<string, { name: string; description: string }>,
  count: number,
  maxWeapons: number,
  rng: SeededRandom,
): UpgradeChoice[] {
  const pool: UpgradeChoice[] = [];

  // 1. Upgradable owned weapons
  for (const w of ownedWeapons) {
    if (w.level < w.maxLevel) {
      pool.push({
        type: 'weapon',
        id: w.id,
        name: weaponNames[w.id] ?? w.id,
        description: `레벨 ${w.level + 1}`,
        level: w.level + 1,
        isNew: false,
      });
    }
  }

  // 2. New weapons (if under max)
  if (ownedWeapons.length < maxWeapons) {
    for (const wid of allWeaponIds) {
      if (!ownedWeapons.find(w => w.id === wid)) {
        pool.push({
          type: 'weapon',
          id: wid,
          name: weaponNames[wid] ?? wid,
          description: '신규 무기!',
          level: 1,
          isNew: true,
        });
      }
    }
  }

  // 3. Upgradable passives
  for (const p of ownedPassives) {
    if (p.level < p.maxLevel) {
      const data = passiveData[p.id];
      pool.push({
        type: 'passive',
        id: p.id,
        name: data?.name ?? p.id,
        description: data?.description ?? '',
        level: p.level + 1,
        isNew: false,
      });
    }
  }

  // 4. New passives
  for (const pid of allPassiveIds) {
    if (!ownedPassives.find(p => p.id === pid)) {
      const data = passiveData[pid];
      pool.push({
        type: 'passive',
        id: pid,
        name: data?.name ?? pid,
        description: data?.description ?? '',
        level: 1,
        isNew: true,
      });
    }
  }

  // Shuffle and pick (deterministic via SeededRandom)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = rng.nextInt(0, i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, count);
}
