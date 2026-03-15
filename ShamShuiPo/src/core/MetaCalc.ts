// ── Neon Survivors: Meta Progression Calculator ──
// Pure TypeScript — NO Phaser imports.
// Handles permanent upgrades, persistence, and meta bonuses.

import { META_UPGRADES, PLAYER_BASE } from "../config/balance";

// ════════════════════════════════════════════════════════════════
// § TYPES
// ════════════════════════════════════════════════════════════════

export interface MetaSave {
  coins: number;
  upgrades: Record<string, number>; // upgradeId → current level (0 = not purchased)
  totalRuns: number;
  bestScore: number;
  bestTime: number; // best survival time in seconds
}

export interface MetaBonuses {
  maxHpBonus: number; // flat HP added to base
  damageBonus: number; // % damage multiplier (0.1 = +10%)
  moveSpeedBonus: number; // % speed multiplier (0.03 = +3%)
  xpBonus: number; // % XP bonus (not currently in META_UPGRADES but reserved)
  startingWeaponLevel: number; // always 1 (no meta upgrade for this currently)
}

const STORAGE_KEY = "neon_survivors_meta";

// ════════════════════════════════════════════════════════════════
// § SAVE / LOAD
// ════════════════════════════════════════════════════════════════

export function getDefaultSave(): MetaSave {
  return {
    coins: 0,
    upgrades: {},
    totalRuns: 0,
    bestScore: 0,
    bestTime: 0,
  };
}

export function loadSave(): MetaSave {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultSave();

    const parsed = JSON.parse(raw) as Partial<MetaSave>;

    // Validate and merge with defaults to handle schema evolution
    const defaults = getDefaultSave();
    return {
      coins: typeof parsed.coins === "number" ? parsed.coins : defaults.coins,
      upgrades:
        parsed.upgrades && typeof parsed.upgrades === "object"
          ? parsed.upgrades
          : defaults.upgrades,
      totalRuns:
        typeof parsed.totalRuns === "number"
          ? parsed.totalRuns
          : defaults.totalRuns,
      bestScore:
        typeof parsed.bestScore === "number"
          ? parsed.bestScore
          : defaults.bestScore,
      bestTime:
        typeof parsed.bestTime === "number"
          ? parsed.bestTime
          : defaults.bestTime,
    };
  } catch {
    return getDefaultSave();
  }
}

export function saveMeta(save: MetaSave): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
  } catch {
    // Storage quota exceeded or unavailable — fail silently
  }
}

// ════════════════════════════════════════════════════════════════
// § UPGRADE LOGIC
// ════════════════════════════════════════════════════════════════

/**
 * Returns the coin cost to purchase the next level of an upgrade.
 * Returns Infinity if the upgrade is maxed or not found.
 */
export function getMetaUpgradeCost(
  upgradeId: string,
  currentLevel: number,
): number {
  const def = META_UPGRADES[upgradeId];
  if (!def) return Infinity;
  if (currentLevel >= def.maxLevel) return Infinity;
  if (currentLevel < 0) return Infinity;

  // costPerLevel[index] is cost to go from level index to level index+1
  const cost = def.costPerLevel[currentLevel];
  return typeof cost === "number" ? cost : Infinity;
}

/**
 * Returns true if the player can afford the next level of an upgrade.
 */
export function canAffordUpgrade(save: MetaSave, upgradeId: string): boolean {
  const def = META_UPGRADES[upgradeId];
  if (!def) return false;

  const currentLevel = save.upgrades[upgradeId] ?? 0;
  if (currentLevel >= def.maxLevel) return false;

  const cost = getMetaUpgradeCost(upgradeId, currentLevel);
  if (cost === Infinity) return false;

  // Diamonds-based upgrades use a separate check — currently not in player.diamonds
  // For simplicity, only coins upgrades are tracked here
  if (def.currency === "diamonds") return false; // diamonds not implemented in meta scene

  return save.coins >= cost;
}

/**
 * Purchases one level of the upgrade. Returns a new MetaSave.
 * Throws if player cannot afford or upgrade is maxed.
 */
export function purchaseUpgrade(save: MetaSave, upgradeId: string): MetaSave {
  const def = META_UPGRADES[upgradeId];
  if (!def) throw new Error(`Unknown upgrade: ${upgradeId}`);

  const currentLevel = save.upgrades[upgradeId] ?? 0;
  if (currentLevel >= def.maxLevel)
    throw new Error(`Upgrade ${upgradeId} is already maxed`);

  const cost = getMetaUpgradeCost(upgradeId, currentLevel);
  if (cost === Infinity)
    throw new Error(`Cannot determine cost for ${upgradeId}`);

  if (def.currency === "coins" && save.coins < cost) {
    throw new Error(`Not enough coins: have ${save.coins}, need ${cost}`);
  }

  const newUpgrades = { ...save.upgrades, [upgradeId]: currentLevel + 1 };
  const newCoins = def.currency === "coins" ? save.coins - cost : save.coins;

  return {
    ...save,
    coins: newCoins,
    upgrades: newUpgrades,
  };
}

// ════════════════════════════════════════════════════════════════
// § META BONUSES
// ════════════════════════════════════════════════════════════════

/**
 * Computes all meta bonuses from the current save state.
 */
export function getMetaBonuses(save: MetaSave): MetaBonuses {
  const hpLevel = save.upgrades["meta_hp"] ?? 0;
  const dmgLevel = save.upgrades["meta_damage"] ?? 0;
  const speedLevel = save.upgrades["meta_speed"] ?? 0;

  // Sum cumulative bonuses up to current level
  let maxHpBonus = 0;
  for (let i = 0; i < hpLevel; i++) {
    maxHpBonus += META_UPGRADES.meta_hp.valuePerLevel[i] ?? 0;
  }

  let damageBonus = 0;
  for (let i = 0; i < dmgLevel; i++) {
    damageBonus += META_UPGRADES.meta_damage.valuePerLevel[i] ?? 0;
  }

  let moveSpeedBonus = 0;
  for (let i = 0; i < speedLevel; i++) {
    moveSpeedBonus += META_UPGRADES.meta_speed.valuePerLevel[i] ?? 0;
  }

  return {
    maxHpBonus,
    damageBonus,
    moveSpeedBonus,
    xpBonus: 0, // no meta XP upgrade defined in balance.ts
    startingWeaponLevel: 1,
  };
}

// ════════════════════════════════════════════════════════════════
// § RUN REWARD
// ════════════════════════════════════════════════════════════════

/**
 * Records end-of-run results into meta save.
 * Updates best records, increments run count, adds coins.
 * Returns a new MetaSave.
 */
export function addRunReward(
  save: MetaSave,
  score: number,
  elapsed: number,
  coins: number,
): MetaSave {
  return {
    ...save,
    totalRuns: save.totalRuns + 1,
    bestScore: Math.max(save.bestScore, score),
    bestTime: Math.max(save.bestTime, elapsed),
    coins: save.coins + coins,
  };
}

// ════════════════════════════════════════════════════════════════
// § APPLIED STATS HELPER
// ════════════════════════════════════════════════════════════════

/**
 * Returns effective starting HP including meta bonus.
 */
export function getMetaStartingHp(save: MetaSave): number {
  const bonuses = getMetaBonuses(save);
  return PLAYER_BASE.hp + bonuses.maxHpBonus;
}

/**
 * Returns effective starting speed including meta bonus.
 */
export function getMetaStartingSpeed(save: MetaSave): number {
  const bonuses = getMetaBonuses(save);
  return PLAYER_BASE.speed * (1 + bonuses.moveSpeedBonus);
}
