// ── Neon Survivors: Loot Table Calculations ──
// Pure TypeScript — NO Phaser imports.

// ════════════════════════════════════════════════════════════════
// § TYPES
// ════════════════════════════════════════════════════════════════

export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export interface LootEntry {
  id: string;
  rarity: Rarity;
  weight: number; // base weight (higher = more likely)
  minWave: number; // earliest wave this can drop (0 = always)
}

export interface LootResult {
  id: string;
  rarity: Rarity;
}

export interface LootTableConfig {
  entries: LootEntry[];
  luckBonus: number; // 0-1, increases rare+ drop rates
}

// ════════════════════════════════════════════════════════════════
// § RARITY COLORS
// ════════════════════════════════════════════════════════════════

const RARITY_COLORS: Record<Rarity, number> = {
  common: 0xcccccc, // gray
  uncommon: 0x00ff88, // green
  rare: 0x00ccff, // cyan
  epic: 0xcc66ff, // purple
  legendary: 0xffcc00, // gold
};

// ════════════════════════════════════════════════════════════════
// § LUCK MULTIPLIERS
// ════════════════════════════════════════════════════════════════

/**
 * Returns a weight multiplier for a given rarity based on luck.
 * Luck boosts rare+ drops; common is unaffected.
 *
 * - common:    1.0 (unaffected by luck)
 * - uncommon:  1.0 + luck * 0.5
 * - rare:      1.0 + luck * 1.0
 * - epic:      1.0 + luck * 2.0
 * - legendary: 1.0 + luck * 3.0
 */
export function getRarityMultiplier(rarity: Rarity, luck: number): number {
  switch (rarity) {
    case "common":
      return 1.0;
    case "uncommon":
      return 1.0 + luck * 0.5;
    case "rare":
      return 1.0 + luck * 1.0;
    case "epic":
      return 1.0 + luck * 2.0;
    case "legendary":
      return 1.0 + luck * 3.0;
  }
}

// ════════════════════════════════════════════════════════════════
// § EFFECTIVE WEIGHTS
// ════════════════════════════════════════════════════════════════

/**
 * Filters entries by minWave and applies luck multiplier to weights.
 */
export function getEffectiveWeights(
  config: LootTableConfig,
  currentWave: number,
): { id: string; weight: number }[] {
  return config.entries
    .filter((e) => currentWave >= e.minWave)
    .map((e) => ({
      id: e.id,
      weight: e.weight * getRarityMultiplier(e.rarity, config.luckBonus),
    }));
}

// ════════════════════════════════════════════════════════════════
// § LOOT SELECTION
// ════════════════════════════════════════════════════════════════

/**
 * Select a single loot entry from the weighted table.
 * @param roll 0-1 random value used to pick from weighted entries
 * @returns selected loot or null if no entries available
 */
export function selectLoot(
  config: LootTableConfig,
  currentWave: number,
  roll: number,
): LootResult | null {
  const weights = getEffectiveWeights(config, currentWave);
  if (weights.length === 0) return null;

  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
  if (totalWeight <= 0) return null;

  const target = roll * totalWeight;
  let cumulative = 0;

  for (const w of weights) {
    cumulative += w.weight;
    if (target < cumulative) {
      const entry = config.entries.find((e) => e.id === w.id)!;
      return { id: entry.id, rarity: entry.rarity };
    }
  }

  // Edge case: roll === 1.0 or floating point — return last entry
  const lastWeight = weights[weights.length - 1];
  const lastEntry = config.entries.find((e) => e.id === lastWeight.id)!;
  return { id: lastEntry.id, rarity: lastEntry.rarity };
}

/**
 * Select multiple loot entries (independent rolls, may include duplicates).
 */
export function selectMultipleLoot(
  config: LootTableConfig,
  currentWave: number,
  count: number,
  rolls: number[],
): LootResult[] {
  const results: LootResult[] = [];
  for (let i = 0; i < count; i++) {
    const roll = rolls[i] ?? 0;
    const result = selectLoot(config, currentWave, roll);
    if (result) results.push(result);
  }
  return results;
}

// ════════════════════════════════════════════════════════════════
// § UTILITIES
// ════════════════════════════════════════════════════════════════

/**
 * Returns hex color for a rarity tier.
 */
export function getRarityColor(rarity: Rarity): number {
  return RARITY_COLORS[rarity];
}

/**
 * Returns the probability (0-1) of a specific entry being selected.
 */
export function getDropChance(
  entry: LootEntry,
  config: LootTableConfig,
  currentWave: number,
): number {
  const weights = getEffectiveWeights(config, currentWave);
  if (weights.length === 0) return 0;

  const match = weights.find((w) => w.id === entry.id);
  if (!match) return 0;

  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
  if (totalWeight <= 0) return 0;

  return match.weight / totalWeight;
}
