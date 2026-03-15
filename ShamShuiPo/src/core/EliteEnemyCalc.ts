// ── EliteEnemyCalc ──────────────────────────────────────────────
// Pure TypeScript module for elite/miniboss enemy modifier system.
// NO Phaser imports. All functions are pure & deterministic.
// ────────────────────────────────────────────────────────────────

// ── Types ──────────────────────────────────────────────────────

export type EliteModifier =
  | "armored"
  | "swift"
  | "berserker"
  | "shielded"
  | "vampiric"
  | "splitting"
  | "teleporting"
  | "explosive";

export interface EliteConfig {
  readonly modifiers: readonly EliteModifier[];
  readonly hpMultiplier: number;
  readonly damageMultiplier: number;
  readonly speedMultiplier: number;
  readonly xpMultiplier: number;
  readonly sizeMultiplier: number;
}

export type EliteRank = "normal" | "elite" | "champion";
export type DeathEffect = "none" | "explode" | "split" | "both";

export interface ModifierEffect {
  readonly hpMultiplier: number;
  readonly damageMultiplier: number;
  readonly speedMultiplier: number;
  readonly xpMultiplier: number;
  readonly sizeMultiplier: number;
  readonly damageReduction: number;
  readonly shieldHits: number;
  readonly vampiricPercent: number;
  readonly splitCount: number;
  readonly splitHpPercent: number;
  readonly teleportDistance: number;
  readonly teleportCooldown: number;
  readonly explosionRadius: number;
}

// ── PRNG ───────────────────────────────────────────────────────

export function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Modifier Effect Definitions ────────────────────────────────

const BASE_EFFECT: ModifierEffect = {
  hpMultiplier: 1,
  damageMultiplier: 1,
  speedMultiplier: 1,
  xpMultiplier: 1,
  sizeMultiplier: 1,
  damageReduction: 0,
  shieldHits: 0,
  vampiricPercent: 0,
  splitCount: 0,
  splitHpPercent: 0,
  teleportDistance: 0,
  teleportCooldown: 0,
  explosionRadius: 0,
};

const MODIFIER_EFFECTS: Record<EliteModifier, Partial<ModifierEffect>> = {
  armored: {
    damageReduction: 0.5,
    sizeMultiplier: 1.3,
    speedMultiplier: 0.8,
  },
  swift: {
    speedMultiplier: 1.5,
    hpMultiplier: 0.8,
  },
  berserker: {
    damageMultiplier: 1.5,
    hpMultiplier: 0.9,
    // +20% attack speed is handled by damageMultiplier context;
    // the xpMultiplier reflects increased danger
  },
  shielded: {
    shieldHits: 3,
  },
  vampiric: {
    vampiricPercent: 0.1,
  },
  splitting: {
    splitCount: 2,
    splitHpPercent: 0.3,
  },
  teleporting: {
    teleportDistance: 100,
    teleportCooldown: 3,
  },
  explosive: {
    explosionRadius: 50,
  },
};

const ALL_MODIFIERS: readonly EliteModifier[] = [
  "armored",
  "swift",
  "berserker",
  "shielded",
  "vampiric",
  "splitting",
  "teleporting",
  "explosive",
];

// ── Functions ──────────────────────────────────────────────────

/** Get the stat effects of a single modifier. */
export function getModifierEffect(modifier: EliteModifier): ModifierEffect {
  return { ...BASE_EFFECT, ...MODIFIER_EFFECTS[modifier] };
}

/** Combine multipliers from multiple modifiers by multiplying them together. */
export function combineMultipliers(
  modifiers: readonly EliteModifier[],
): Pick<
  EliteConfig,
  | "hpMultiplier"
  | "damageMultiplier"
  | "speedMultiplier"
  | "xpMultiplier"
  | "sizeMultiplier"
> {
  let hp = 1;
  let damage = 1;
  let speed = 1;
  let size = 1;

  for (const mod of modifiers) {
    const effect = MODIFIER_EFFECTS[mod];
    hp *= effect.hpMultiplier ?? 1;
    damage *= effect.damageMultiplier ?? 1;
    speed *= effect.speedMultiplier ?? 1;
    size *= effect.sizeMultiplier ?? 1;
  }

  // XP scales with number of modifiers: base 1.5x per modifier
  const xp = modifiers.length === 0 ? 1 : Math.pow(1.5, modifiers.length);

  return {
    hpMultiplier: hp,
    damageMultiplier: damage,
    speedMultiplier: speed,
    xpMultiplier: xp,
    sizeMultiplier: size,
  };
}

/** Create an EliteConfig from a set of modifiers. */
export function createEliteConfig(modifiers: EliteModifier[]): EliteConfig {
  const unique = [...new Set(modifiers)];
  const multipliers = combineMultipliers(unique);

  return {
    modifiers: unique,
    ...multipliers,
  };
}

/** Check if config has any elite modifiers. */
export function isElite(config: EliteConfig): boolean {
  return config.modifiers.length > 0;
}

/** Get the rank of an elite enemy based on modifier count. */
export function getEliteRank(config: EliteConfig): EliteRank {
  const count = config.modifiers.length;
  if (count === 0) return "normal";
  if (count <= 2) return "elite";
  return "champion";
}

/**
 * Roll elite modifiers for a wave using deterministic PRNG.
 *
 * Spawn rules:
 * - Wave 1-3: no elites
 * - Wave 4-6: 5% chance, max 1 modifier
 * - Wave 7-9: 10% chance, max 2 modifiers
 * - Wave 10+: 15% chance, max 3 modifiers
 */
export function rollEliteModifiers(
  wave: number,
  seed: number,
): EliteModifier[] {
  const rng = mulberry32(seed);

  // Wave 1-3: no elites
  if (wave <= 3) return [];

  let chance: number;
  let maxMods: number;

  if (wave <= 6) {
    chance = 0.05;
    maxMods = 1;
  } else if (wave <= 9) {
    chance = 0.1;
    maxMods = 2;
  } else {
    chance = 0.15;
    maxMods = 3;
  }

  // Roll for elite spawn
  if (rng() >= chance) return [];

  // Determine number of modifiers (1 to maxMods)
  const modCount = Math.min(maxMods, Math.floor(rng() * maxMods) + 1);

  // Pick random modifiers without duplicates
  const available = [...ALL_MODIFIERS];
  const selected: EliteModifier[] = [];

  for (let i = 0; i < modCount && available.length > 0; i++) {
    const idx = Math.floor(rng() * available.length);
    selected.push(available[idx]);
    available.splice(idx, 1);
  }

  return selected;
}

/** Calculate actual damage after armor reduction. */
export function applyDamageReduction(
  config: EliteConfig,
  rawDamage: number,
): number {
  if (!config.modifiers.includes("armored")) return rawDamage;
  const reduction = MODIFIER_EFFECTS.armored.damageReduction ?? 0;
  return rawDamage * (1 - reduction);
}

/** Check if the config has the splitting modifier. */
export function shouldSplit(config: EliteConfig): boolean {
  return config.modifiers.includes("splitting");
}

/** Get config for split copies: 30% HP multiplier, splitting modifier removed. */
export function getSplitConfig(config: EliteConfig): EliteConfig {
  const newModifiers = config.modifiers.filter((m) => m !== "splitting");
  const multipliers = combineMultipliers(newModifiers);

  return {
    modifiers: newModifiers,
    hpMultiplier: multipliers.hpMultiplier * 0.3,
    damageMultiplier: multipliers.damageMultiplier,
    speedMultiplier: multipliers.speedMultiplier,
    xpMultiplier: multipliers.xpMultiplier * 0.3, // reduced XP for splits
    sizeMultiplier: multipliers.sizeMultiplier * 0.7, // smaller copies
  };
}

/** Determine what happens on death. */
export function getDeathEffect(config: EliteConfig): DeathEffect {
  const hasSplit = config.modifiers.includes("splitting");
  const hasExplosive = config.modifiers.includes("explosive");

  if (hasSplit && hasExplosive) return "both";
  if (hasSplit) return "split";
  if (hasExplosive) return "explode";
  return "none";
}

/** Calculate XP reward: base XP multiplied by elite multiplier. */
export function getXpReward(baseXp: number, config: EliteConfig): number {
  return baseXp * config.xpMultiplier;
}
