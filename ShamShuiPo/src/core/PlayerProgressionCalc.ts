/**
 * PlayerProgressionCalc — Pure TypeScript module for per-run player stat
 * progression and level-up calculations in Neon Survivors.
 *
 * NO Phaser imports. All functions are pure and return new objects (immutable).
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PlayerStats {
  readonly maxHp: number;
  readonly currentHp: number;
  readonly damage: number;
  readonly speed: number;
  readonly fireRate: number;
  readonly armor: number;
  readonly critChance: number;
  readonly critDamage: number;
  readonly magnetRange: number;
  readonly xpMultiplier: number;
  readonly level: number;
  readonly xp: number;
  readonly xpToNext: number;
}

export type GrowthType = "linear" | "diminishing" | "exponential";

export interface StatGrowth {
  readonly stat: keyof PlayerStats;
  readonly baseValue: number;
  readonly growthPerLevel: number;
  readonly growthType: GrowthType;
  readonly cap?: number;
}

export interface AddXpResult {
  readonly stats: PlayerStats;
  readonly leveledUp: boolean;
  readonly levelsGained: number;
}

export type CharacterId = "kai" | "mei" | "punk" | "cyborg" | "biker";

// ─── Character Presets ───────────────────────────────────────────────────────

const CHARACTER_PRESETS: Record<
  CharacterId,
  Omit<PlayerStats, "level" | "xp" | "xpToNext">
> = {
  kai: {
    maxHp: 100,
    currentHp: 100,
    damage: 10,
    speed: 200,
    fireRate: 1.0,
    armor: 5,
    critChance: 5,
    critDamage: 1.5,
    magnetRange: 60,
    xpMultiplier: 1.0,
  },
  mei: {
    maxHp: 70,
    currentHp: 70,
    damage: 15,
    speed: 220,
    fireRate: 1.2,
    armor: 2,
    critChance: 10,
    critDamage: 1.8,
    magnetRange: 50,
    xpMultiplier: 1.0,
  },
  punk: {
    maxHp: 150,
    currentHp: 150,
    damage: 8,
    speed: 170,
    fireRate: 0.8,
    armor: 12,
    critChance: 3,
    critDamage: 1.3,
    magnetRange: 55,
    xpMultiplier: 1.0,
  },
  cyborg: {
    maxHp: 90,
    currentHp: 90,
    damage: 12,
    speed: 250,
    fireRate: 1.1,
    armor: 4,
    critChance: 7,
    critDamage: 1.6,
    magnetRange: 65,
    xpMultiplier: 1.1,
  },
  biker: {
    maxHp: 120,
    currentHp: 120,
    damage: 13,
    speed: 190,
    fireRate: 0.9,
    armor: 8,
    critChance: 6,
    critDamage: 1.5,
    magnetRange: 55,
    xpMultiplier: 1.0,
  },
};

// ─── Default Stat Growth Curves ──────────────────────────────────────────────

export const DEFAULT_GROWTHS: readonly StatGrowth[] = [
  { stat: "maxHp", baseValue: 0, growthPerLevel: 8, growthType: "linear" },
  {
    stat: "damage",
    baseValue: 0,
    growthPerLevel: 1.5,
    growthType: "diminishing",
  },
  {
    stat: "speed",
    baseValue: 0,
    growthPerLevel: 2,
    growthType: "linear",
    cap: 350,
  },
  {
    stat: "fireRate",
    baseValue: 0,
    growthPerLevel: 0.02,
    growthType: "linear",
    cap: 2.0,
  },
  { stat: "armor", baseValue: 0, growthPerLevel: 1, growthType: "linear" },
  {
    stat: "critChance",
    baseValue: 0,
    growthPerLevel: 0.5,
    growthType: "linear",
    cap: 50,
  },
] as const;

// ─── XP Curve ────────────────────────────────────────────────────────────────

/** XP required to reach the given level: 100 * level^1.5 (rounded). */
export function getXpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.round(100 * Math.pow(level, 1.5));
}

// ─── Stat Growth Calculation ─────────────────────────────────────────────────

/** Calculate the bonus value a growth curve provides at the given level. */
export function getStatAtLevel(growth: StatGrowth, level: number): number {
  if (level <= 1) return growth.baseValue;
  const levelsGained = level - 1;

  let value: number;
  switch (growth.growthType) {
    case "linear":
      value = growth.baseValue + growth.growthPerLevel * levelsGained;
      break;
    case "diminishing":
      // Each subsequent level gives slightly less: sum of growthPerLevel / sqrt(i)
      value = growth.baseValue;
      for (let i = 1; i <= levelsGained; i++) {
        value += growth.growthPerLevel / Math.sqrt(i);
      }
      break;
    case "exponential":
      value =
        growth.baseValue +
        growth.growthPerLevel * (Math.pow(1.1, levelsGained) - 1);
      break;
  }

  if (growth.cap !== undefined) {
    value = Math.min(value, growth.cap);
  }
  return value;
}

// ─── Factory ─────────────────────────────────────────────────────────────────

/** Create starting stats for a character. Defaults to 'kai'. */
export function createPlayerStats(
  characterId: CharacterId = "kai",
): PlayerStats {
  const preset = CHARACTER_PRESETS[characterId];
  if (!preset) {
    throw new Error(`Unknown character: ${characterId}`);
  }
  return {
    ...preset,
    level: 1,
    xp: 0,
    xpToNext: getXpForLevel(2),
  };
}

// ─── Stat Growth Application ─────────────────────────────────────────────────

/** Apply a single stat growth curve to stats, returning new stats. */
export function applyStatGrowth(
  stats: PlayerStats,
  growth: StatGrowth,
): PlayerStats {
  const bonus = getStatAtLevel(growth, stats.level);
  const basePreset = getBaseForStat(stats, growth.stat);
  let newValue = basePreset + bonus;

  if (growth.cap !== undefined) {
    newValue = Math.min(newValue, growth.cap);
  }

  const patch: Record<string, number> = { [growth.stat]: newValue };

  // If maxHp increased, also increase currentHp by the same delta
  if (growth.stat === "maxHp") {
    const hpDelta = newValue - stats.maxHp;
    if (hpDelta > 0) {
      patch.currentHp = Math.min(stats.currentHp + hpDelta, newValue);
    }
  }

  return { ...stats, ...patch } as PlayerStats;
}

function getBaseForStat(stats: PlayerStats, stat: keyof PlayerStats): number {
  // We approximate the base by reverse-calculating from level 1 preset
  // For simplicity, just return the current value (growth is additive from base)
  return stats[stat] as number;
}

/** Apply one level-up: increment level, recalculate xpToNext, apply all default growths. */
export function levelUp(stats: PlayerStats): PlayerStats {
  const newLevel = stats.level + 1;
  let updated: PlayerStats = {
    ...stats,
    level: newLevel,
    xpToNext: getXpForLevel(newLevel + 1),
  };

  // Apply each default growth increment for this level
  for (const growth of DEFAULT_GROWTHS) {
    const prevBonus = getStatAtLevel(growth, stats.level);
    const newBonus = getStatAtLevel(growth, newLevel);
    const delta = newBonus - prevBonus;

    if (delta > 0) {
      const currentVal = updated[growth.stat] as number;
      let newVal = currentVal + delta;
      if (growth.cap !== undefined) {
        newVal = Math.min(newVal, growth.cap);
      }

      const patch: Record<string, number> = { [growth.stat]: newVal };
      if (growth.stat === "maxHp") {
        patch.currentHp = Math.min(updated.currentHp + delta, newVal);
      }
      updated = { ...updated, ...patch } as PlayerStats;
    }
  }

  return updated;
}

// ─── XP System ───────────────────────────────────────────────────────────────

/** Add XP to the player. Handles multi-level-ups. XP multiplier is applied. */
export function addXp(stats: PlayerStats, amount: number): AddXpResult {
  let current = { ...stats };
  let totalXp = current.xp + Math.round(amount * current.xpMultiplier);
  let levelsGained = 0;

  while (totalXp >= current.xpToNext) {
    totalXp -= current.xpToNext;
    current = levelUp(current);
    levelsGained++;
  }

  current = { ...current, xp: totalXp };

  return {
    stats: current,
    leveledUp: levelsGained > 0,
    levelsGained,
  };
}

// ─── Combat Calculations ─────────────────────────────────────────────────────

/** Effective damage factoring in crit: damage * (1 + critChance/100 * (critDamage - 1)). */
export function getEffectiveDamage(stats: PlayerStats): number {
  return stats.damage * (1 + (stats.critChance / 100) * (stats.critDamage - 1));
}

/** Effective toughness: maxHp * (1 + armor/100). */
export function getEffectiveToughness(stats: PlayerStats): number {
  return stats.maxHp * (1 + stats.armor / 100);
}

/** Damage per second: effectiveDamage * weaponFireRate * playerFireRate. */
export function getDPS(stats: PlayerStats, weaponFireRate: number): number {
  return getEffectiveDamage(stats) * weaponFireRate * stats.fireRate;
}

/** Composite power level score for matchmaking/display. */
export function getPowerLevel(stats: PlayerStats): number {
  const dmgScore = getEffectiveDamage(stats) * 2;
  const toughScore = getEffectiveToughness(stats) * 0.5;
  const speedScore = stats.speed * 0.1;
  const fireRateScore = stats.fireRate * 10;
  return Math.round(dmgScore + toughScore + speedScore + fireRateScore);
}

// ─── HP Management ───────────────────────────────────────────────────────────

/** Heal the player by amount, capped at maxHp. */
export function heal(stats: PlayerStats, amount: number): PlayerStats {
  return {
    ...stats,
    currentHp: Math.min(stats.currentHp + amount, stats.maxHp),
  };
}

/** Take damage with armor reduction. Armor reduces damage by armor%. Floor at 0 HP. */
export function takeDamage(stats: PlayerStats, amount: number): PlayerStats {
  const reduction = amount * (stats.armor / 100);
  const actualDamage = Math.max(0, amount - reduction);
  return {
    ...stats,
    currentHp: Math.max(0, stats.currentHp - actualDamage),
  };
}

/** Check if the player is dead. */
export function isDead(stats: PlayerStats): boolean {
  return stats.currentHp <= 0;
}

/** Get HP as a 0-1 percentage. */
export function getHpPercent(stats: PlayerStats): number {
  if (stats.maxHp <= 0) return 0;
  return stats.currentHp / stats.maxHp;
}

// ─── Buffs & Reset ───────────────────────────────────────────────────────────

/** Apply a multiplicative buff to a single stat. Returns new stats. */
export function applyBuff(
  stats: PlayerStats,
  stat: keyof PlayerStats,
  multiplier: number,
): PlayerStats {
  const currentVal = stats[stat] as number;
  const newVal = currentVal * multiplier;
  const patch: Record<string, number> = { [stat]: newVal };

  if (stat === "maxHp" && newVal > stats.maxHp) {
    // Increase currentHp proportionally
    const ratio = stats.currentHp / stats.maxHp;
    patch.currentHp = newVal * ratio;
  }

  return { ...stats, ...patch } as PlayerStats;
}

/** Recalculate stats from base character preset + level growths. */
export function resetToBase(stats: PlayerStats, level: number): PlayerStats {
  // Try to find which character this was; fall back to kai
  let charId: CharacterId = "kai";
  for (const [id, preset] of Object.entries(CHARACTER_PRESETS)) {
    // Match by checking base stats at level 1
    if (
      preset.magnetRange === stats.magnetRange &&
      preset.xpMultiplier === stats.xpMultiplier
    ) {
      charId = id as CharacterId;
      break;
    }
  }

  let rebuilt = createPlayerStats(charId);
  // Level up to the desired level
  for (let i = 1; i < level; i++) {
    rebuilt = levelUp(rebuilt);
  }
  // Preserve xp
  rebuilt = { ...rebuilt, xp: stats.xp };
  return rebuilt;
}
