import { SeededRandom } from './SeededRandom';
import { t } from '../lib/i18n';

export interface UpgradeChoice {
  type: 'weapon' | 'passive' | 'evolution';
  id: string;
  name: string;
  description: string;
  level: number; // the level it will become
  isNew: boolean; // new acquisition vs upgrade
  /** For evolution choices: the IDs of weapons consumed */
  recipe?: { primary: string; secondary: string };
}

export interface EvolutionRecipe {
  id: string;
  name: string;
  primary: string;
  primaryLevel: number;
  secondary: string;
  secondaryLevel: number;
}

/**
 * Selects N random upgrade choices for level-up.
 * Prioritizes evolution recipes (if conditions met), then upgrading owned weapons,
 * then new weapons, then passives.
 * Character-specific passives only appear for the matching character and get 2x weight.
 */
export function selectUpgrades(
  ownedWeapons: { id: string; level: number; maxLevel: number }[],
  ownedPassives: { id: string; level: number; maxLevel: number }[],
  allWeaponIds: string[],
  allPassiveIds: string[],
  weaponNames: Record<string, string>,
  passiveData: Record<string, { name: string; description: string; characterId?: string }>,
  count: number,
  maxWeapons: number,
  rng: SeededRandom,
  characterId?: string,
  evolutionRecipes?: EvolutionRecipe[],
  luckBonus?: number,
): UpgradeChoice[] {
  const pool: UpgradeChoice[] = [];

  // Helper: check if a passive is available for the current character
  const isPassiveAvailable = (pid: string): boolean => {
    const data = passiveData[pid];
    if (!data?.characterId) return true; // universal passive
    return data.characterId === characterId;
  };

  // 0. Check evolution recipes — guaranteed slot if conditions met
  const evoChoices: UpgradeChoice[] = [];
  if (evolutionRecipes) {
    for (const recipe of evolutionRecipes) {
      // Player must own both ingredients at required levels, and NOT already own the T2 weapon
      const hasPrimary = ownedWeapons.find((w) => w.id === recipe.primary && w.level >= recipe.primaryLevel);
      const hasSecondary = ownedWeapons.find((w) => w.id === recipe.secondary && w.level >= recipe.secondaryLevel);
      const alreadyOwns = ownedWeapons.find((w) => w.id === recipe.id);
      if (hasPrimary && hasSecondary && !alreadyOwns) {
        evoChoices.push({
          type: 'evolution',
          id: recipe.id,
          name: recipe.name,
          description: `${weaponNames[recipe.primary] ?? recipe.primary} + ${weaponNames[recipe.secondary] ?? recipe.secondary}`,
          level: 1,
          isNew: true,
          recipe: { primary: recipe.primary, secondary: recipe.secondary },
        });
      }
    }
  }

  // 1. Upgradable owned weapons (exclude T2 weapon IDs from normal new-weapon pool)
  const t2Ids = new Set(evolutionRecipes?.map((r) => r.id) ?? []);
  for (const w of ownedWeapons) {
    if (w.level < w.maxLevel) {
      pool.push({
        type: 'weapon',
        id: w.id,
        name: weaponNames[w.id] ?? w.id,
        description: t('levelup.level', { level: w.level + 1 }),
        level: w.level + 1,
        isNew: false,
      });
    }
  }

  // 2. New weapons (if under max) — exclude T2 weapons (acquired only via evolution)
  //    luckBonus adds extra copies to pool, increasing draw probability
  const extraNewWeaponWeight = Math.floor((luckBonus ?? 0) / 0.05); // +1 copy per 5% luck
  if (ownedWeapons.length < maxWeapons) {
    for (const wid of allWeaponIds) {
      if (t2Ids.has(wid)) continue; // T2 weapons not offered as regular new weapons
      if (!ownedWeapons.find((w) => w.id === wid)) {
        const entry: UpgradeChoice = {
          type: 'weapon',
          id: wid,
          name: weaponNames[wid] ?? wid,
          description: t('levelup.new_weapon'),
          level: 1,
          isNew: true,
        };
        pool.push(entry);
        for (let i = 0; i < extraNewWeaponWeight; i++) pool.push({ ...entry });
      }
    }
  }

  // 3. Upgradable passives (filtered by character)
  for (const p of ownedPassives) {
    if (p.level < p.maxLevel && isPassiveAvailable(p.id)) {
      const data = passiveData[p.id];
      const choice: UpgradeChoice = {
        type: 'passive',
        id: p.id,
        name: data?.name ?? p.id,
        description: data?.description ?? '',
        level: p.level + 1,
        isNew: false,
      };
      pool.push(choice);
      // 2x weight for character-specific passives
      if (data?.characterId) {
        pool.push({ ...choice });
      }
    }
  }

  // 4. New passives (filtered by character)
  for (const pid of allPassiveIds) {
    if (!ownedPassives.find((p) => p.id === pid) && isPassiveAvailable(pid)) {
      const data = passiveData[pid];
      const choice: UpgradeChoice = {
        type: 'passive',
        id: pid,
        name: data?.name ?? pid,
        description: data?.description ?? '',
        level: 1,
        isNew: true,
      };
      pool.push(choice);
      // 2x weight for character-specific passives
      if (data?.characterId) {
        pool.push({ ...choice });
      }
    }
  }

  // Shuffle (deterministic via SeededRandom)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = rng.nextInt(0, i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // Deduplicate: character passives appear twice for weighting, but only pick once
  const seen = new Set<string>();
  const result: UpgradeChoice[] = [];

  // Evolution choices get priority — always appear first if available
  for (const evo of evoChoices) {
    const key = `${evo.type}:${evo.id}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(evo);
      if (result.length === count) break;
    }
  }

  for (const choice of pool) {
    if (result.length >= count) break;
    const key = `${choice.type}:${choice.id}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(choice);
    }
  }

  return result;
}
