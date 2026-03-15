// ── Neon Survivors: Drop Table Calculations ──
// Pure TypeScript — NO Phaser imports.

// ════════════════════════════════════════════════════════════════
// § TYPES
// ════════════════════════════════════════════════════════════════

export type RarityTier = "common" | "uncommon" | "rare" | "epic" | "legendary";

export type DropTableEntry = {
  readonly name: string;
  readonly weight: number;
  readonly rarity: RarityTier;
};

export type DropTable = {
  readonly entries: readonly DropTableEntry[];
};

export type DropHistory = {
  readonly items: readonly string[];
  readonly maxSize: number;
};

export type PityState = {
  readonly killsSinceLastDrop: number;
  readonly pityThreshold: number;
};

export type DropRollResult = {
  readonly name: string;
  readonly rarity: RarityTier;
};

export type RarityDistribution = {
  readonly common: number;
  readonly uncommon: number;
  readonly rare: number;
  readonly epic: number;
  readonly legendary: number;
};

// ════════════════════════════════════════════════════════════════
// § CONSTANTS
// ════════════════════════════════════════════════════════════════

const RARITY_ORDER: readonly RarityTier[] = [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
];

/** Luck multiplier per rarity: common stays 1x, higher rarities scale more */
const LUCK_SCALING: Record<RarityTier, number> = {
  common: 0,
  uncommon: 0.5,
  rare: 1.0,
  epic: 1.5,
  legendary: 2.0,
};

// ════════════════════════════════════════════════════════════════
// § DROP TABLE MANAGEMENT
// ════════════════════════════════════════════════════════════════

/** Create a new empty drop table */
export function createDropTable(): DropTable {
  return { entries: [] };
}

/** Add an entry to the drop table */
export function addEntry(
  table: DropTable,
  name: string,
  weight: number,
  rarity: RarityTier,
): DropTable {
  if (weight <= 0) {
    return table;
  }
  const entry: DropTableEntry = { name, weight, rarity };
  return { entries: [...table.entries, entry] };
}

/** Remove an entry by name (removes first match) */
export function removeEntry(table: DropTable, name: string): DropTable {
  const idx = table.entries.findIndex((e) => e.name === name);
  if (idx === -1) return table;
  const newEntries = [
    ...table.entries.slice(0, idx),
    ...table.entries.slice(idx + 1),
  ];
  return { entries: newEntries };
}

/** Get total weight of all entries in the table */
export function getTotalWeight(table: DropTable): number {
  return table.entries.reduce((sum, e) => sum + e.weight, 0);
}

/** Filter table entries by rarity tier */
export function filterByRarity(
  table: DropTable,
  rarity: RarityTier,
): DropTable {
  return { entries: table.entries.filter((e) => e.rarity === rarity) };
}

// ════════════════════════════════════════════════════════════════
// § LUCK MODIFIER
// ════════════════════════════════════════════════════════════════

/** Apply luck modifier to a single entry's weight. Rare+ tiers get boosted. */
export function applyLuckToWeight(entry: DropTableEntry, luck: number): number {
  const scaling = LUCK_SCALING[entry.rarity];
  const multiplier = 1 + scaling * Math.max(0, luck);
  return entry.weight * multiplier;
}

/** Get adjusted weights for the entire table with luck applied */
export function getAdjustedWeights(
  table: DropTable,
  luck: number,
): readonly number[] {
  return table.entries.map((e) => applyLuckToWeight(e, luck));
}

// ════════════════════════════════════════════════════════════════
// § WEIGHTED RANDOM ROLL
// ════════════════════════════════════════════════════════════════

/**
 * Roll for a single drop using weighted random selection.
 * Returns null if table is empty.
 */
export function rollDrop(
  table: DropTable,
  rng: () => number,
  luck: number = 0,
): DropRollResult | null {
  if (table.entries.length === 0) return null;

  const weights = getAdjustedWeights(table, luck);
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  if (totalWeight <= 0) return null;

  const roll = rng() * totalWeight;
  let cumulative = 0;
  for (let i = 0; i < table.entries.length; i++) {
    cumulative += weights[i];
    if (roll < cumulative) {
      const entry = table.entries[i];
      return { name: entry.name, rarity: entry.rarity };
    }
  }
  // Fallback to last entry (edge case: rng() === 1.0)
  const last = table.entries[table.entries.length - 1];
  return { name: last.name, rarity: last.rarity };
}

/** Roll N times and return all results */
export function rollMultiple(
  table: DropTable,
  count: number,
  rng: () => number,
  luck: number = 0,
): readonly DropRollResult[] {
  const results: DropRollResult[] = [];
  for (let i = 0; i < count; i++) {
    const result = rollDrop(table, rng, luck);
    if (result !== null) {
      results.push(result);
    }
  }
  return results;
}

// ════════════════════════════════════════════════════════════════
// § PITY SYSTEM
// ════════════════════════════════════════════════════════════════

/** Create initial pity state */
export function createPityState(pityThreshold: number): PityState {
  return { killsSinceLastDrop: 0, pityThreshold: Math.max(1, pityThreshold) };
}

/** Increment kill counter, returns updated pity state */
export function incrementPityCounter(pity: PityState): PityState {
  return { ...pity, killsSinceLastDrop: pity.killsSinceLastDrop + 1 };
}

/** Reset pity counter after a drop occurs */
export function resetPityCounter(pity: PityState): PityState {
  return { ...pity, killsSinceLastDrop: 0 };
}

/** Check if pity threshold is reached (guaranteed drop) */
export function isPityTriggered(pity: PityState): boolean {
  return pity.killsSinceLastDrop >= pity.pityThreshold;
}

/**
 * Perform a pity-aware roll. If pity is triggered, forces a drop
 * from rare+ entries (or any entry if no rare+ exist).
 * Returns [result, updatedPity].
 */
export function rollWithPity(
  table: DropTable,
  pity: PityState,
  rng: () => number,
  luck: number = 0,
): [DropRollResult | null, PityState] {
  if (table.entries.length === 0) {
    return [null, incrementPityCounter(pity)];
  }

  if (isPityTriggered(pity)) {
    // Force drop from rare+ pool, or all entries if no rare+ exist
    const rarePool = filterByRarity(table, "rare");
    const epicPool = filterByRarity(table, "epic");
    const legendaryPool = filterByRarity(table, "legendary");
    const combined: DropTableEntry[] = [
      ...rarePool.entries,
      ...epicPool.entries,
      ...legendaryPool.entries,
    ];
    const pityTable: DropTable =
      combined.length > 0 ? { entries: combined } : table;
    const result = rollDrop(pityTable, rng, luck);
    return [result, resetPityCounter(pity)];
  }

  const result = rollDrop(table, rng, luck);
  if (result !== null) {
    return [result, resetPityCounter(pity)];
  }
  return [null, incrementPityCounter(pity)];
}

// ════════════════════════════════════════════════════════════════
// § DROP HISTORY & NO-REPEAT
// ════════════════════════════════════════════════════════════════

/** Create drop history tracker */
export function createDropHistory(maxSize: number): DropHistory {
  return { items: [], maxSize: Math.max(1, maxSize) };
}

/** Record a drop in history */
export function recordDrop(
  history: DropHistory,
  itemName: string,
): DropHistory {
  const newItems = [...history.items, itemName];
  // Trim to maxSize from the end (keep most recent)
  const trimmed =
    newItems.length > history.maxSize
      ? newItems.slice(newItems.length - history.maxSize)
      : newItems;
  return { ...history, items: trimmed };
}

/** Get the last dropped item name, or null if empty */
export function getLastDrop(history: DropHistory): string | null {
  return history.items.length > 0
    ? history.items[history.items.length - 1]
    : null;
}

/** Check if an item was dropped recently (within history window) */
export function wasRecentlyDropped(
  history: DropHistory,
  itemName: string,
): boolean {
  return history.items.includes(itemName);
}

/**
 * Roll with no-repeat protection: if the rolled item matches the last drop,
 * reroll once. If the reroll is also the same, accept it.
 */
export function rollNoRepeat(
  table: DropTable,
  history: DropHistory,
  rng: () => number,
  luck: number = 0,
): [DropRollResult | null, DropHistory] {
  const result = rollDrop(table, rng, luck);
  if (result === null) return [null, history];

  const lastDrop = getLastDrop(history);
  if (
    lastDrop !== null &&
    result.name === lastDrop &&
    table.entries.length > 1
  ) {
    // Reroll once
    const reroll = rollDrop(table, rng, luck);
    if (reroll !== null) {
      const newHistory = recordDrop(history, reroll.name);
      return [reroll, newHistory];
    }
  }

  const newHistory = recordDrop(history, result.name);
  return [result, newHistory];
}

// ════════════════════════════════════════════════════════════════
// § DROP RATE STATISTICS
// ════════════════════════════════════════════════════════════════

/** Calculate the percentage drop chance for each rarity tier */
export function getDropRateByRarity(
  table: DropTable,
  luck: number = 0,
): RarityDistribution {
  const weights = getAdjustedWeights(table, luck);
  const total = weights.reduce((sum, w) => sum + w, 0);

  if (total <= 0) {
    return { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 };
  }

  const dist: Record<RarityTier, number> = {
    common: 0,
    uncommon: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
  };

  for (let i = 0; i < table.entries.length; i++) {
    dist[table.entries[i].rarity] += weights[i];
  }

  return {
    common: (dist.common / total) * 100,
    uncommon: (dist.uncommon / total) * 100,
    rare: (dist.rare / total) * 100,
    epic: (dist.epic / total) * 100,
    legendary: (dist.legendary / total) * 100,
  };
}

/** Get the rarity tier index (0=common ... 4=legendary) */
export function getRarityIndex(rarity: RarityTier): number {
  return RARITY_ORDER.indexOf(rarity);
}

/** Compare two rarity tiers: returns negative if a < b, 0 if equal, positive if a > b */
export function compareRarity(a: RarityTier, b: RarityTier): number {
  return getRarityIndex(a) - getRarityIndex(b);
}
