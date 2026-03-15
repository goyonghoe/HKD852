// ── Neon Survivors: Spawn Weight Calculations ──
// Pure TypeScript — NO Phaser imports.

// ════════════════════════════════════════════════════════════════
// § TYPES
// ════════════════════════════════════════════════════════════════

export interface SpawnEntry {
  readonly id: string;
  readonly weight: number;
  readonly minWave: number;
  readonly maxWave: number; // 0 = unlimited
}

export interface SpawnTable {
  readonly entries: readonly SpawnEntry[];
}

export interface SpawnResult {
  readonly selectedId: string;
  readonly probability: number;
}

// ════════════════════════════════════════════════════════════════
// § TABLE CONSTRUCTION
// ════════════════════════════════════════════════════════════════

/**
 * Create a spawn table from a list of entries.
 * Returns an immutable SpawnTable.
 */
export function createSpawnTable(entries: readonly SpawnEntry[]): SpawnTable {
  return { entries: [...entries] };
}

/**
 * Add a single entry to the table. Returns a new table.
 */
export function addEntry(table: SpawnTable, entry: SpawnEntry): SpawnTable {
  return { entries: [...table.entries, entry] };
}

/**
 * Remove all entries matching the given id. Returns a new table.
 */
export function removeEntry(table: SpawnTable, id: string): SpawnTable {
  return { entries: table.entries.filter((e) => e.id !== id) };
}

// ════════════════════════════════════════════════════════════════
// § WAVE FILTERING
// ════════════════════════════════════════════════════════════════

/**
 * Filter entries available at the given wave.
 * An entry is available when wave >= minWave AND (maxWave === 0 OR wave <= maxWave).
 */
export function getAvailableEntries(
  table: SpawnTable,
  wave: number,
): SpawnEntry[] {
  return table.entries.filter(
    (e) => wave >= e.minWave && (e.maxWave === 0 || wave <= e.maxWave),
  );
}

// ════════════════════════════════════════════════════════════════
// § WEIGHT MATH
// ════════════════════════════════════════════════════════════════

/**
 * Sum all weights in the given entries array.
 */
export function getTotalWeight(entries: readonly SpawnEntry[]): number {
  return entries.reduce((sum, e) => sum + e.weight, 0);
}

/**
 * Weighted random selection from entries available at the given wave.
 * Returns null if no entries are available.
 */
export function selectWeighted(
  table: SpawnTable,
  wave: number,
  rng: () => number = Math.random,
): SpawnResult | null {
  const available = getAvailableEntries(table, wave);
  if (available.length === 0) return null;

  const total = getTotalWeight(available);
  if (total <= 0) return null;

  const roll = rng() * total;
  let cumulative = 0;

  for (const entry of available) {
    cumulative += entry.weight;
    if (roll < cumulative) {
      return {
        selectedId: entry.id,
        probability: entry.weight / total,
      };
    }
  }

  // Fallback: last entry (handles floating-point edge case)
  const last = available[available.length - 1];
  return {
    selectedId: last.id,
    probability: last.weight / total,
  };
}

// ════════════════════════════════════════════════════════════════
// § PROBABILITY QUERIES
// ════════════════════════════════════════════════════════════════

/**
 * Get the probability (0-1) of a specific entry at a given wave.
 * Returns 0 if the entry is not available at that wave.
 */
export function getProbability(
  table: SpawnTable,
  id: string,
  wave: number,
): number {
  const available = getAvailableEntries(table, wave);
  const total = getTotalWeight(available);
  if (total <= 0) return 0;

  const entry = available.find((e) => e.id === id);
  if (!entry) return 0;

  return entry.weight / total;
}

/**
 * Get probabilities for all available entries at a given wave.
 * Returns a sorted-by-id list of { id, probability }.
 */
export function getAllProbabilities(
  table: SpawnTable,
  wave: number,
): readonly { id: string; probability: number }[] {
  const available = getAvailableEntries(table, wave);
  const total = getTotalWeight(available);
  if (total <= 0) return [];

  return available.map((e) => ({
    id: e.id,
    probability: e.weight / total,
  }));
}

// ════════════════════════════════════════════════════════════════
// § TABLE MUTATION (IMMUTABLE)
// ════════════════════════════════════════════════════════════════

/**
 * Set the weight of a specific entry by id. Returns a new table.
 * If the id is not found, the table is returned unchanged.
 */
export function setWeight(
  table: SpawnTable,
  id: string,
  weight: number,
): SpawnTable {
  return {
    entries: table.entries.map((e) => (e.id === id ? { ...e, weight } : e)),
  };
}

/**
 * Get the number of entries in the table.
 */
export function getEntryCount(table: SpawnTable): number {
  return table.entries.length;
}

/**
 * Scale all weights so they sum to 100. Returns a new table.
 * If total weight is 0, returns the table unchanged.
 */
export function normalizeWeights(table: SpawnTable): SpawnTable {
  const total = getTotalWeight(table.entries);
  if (total <= 0) return table;

  return {
    entries: table.entries.map((e) => ({
      ...e,
      weight: (e.weight / total) * 100,
    })),
  };
}
