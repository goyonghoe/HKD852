/**
 * Pure character passive calculation — no Phaser imports.
 * Applies the character's innate passive bonus to player stats.
 */

export interface PassiveInput {
  type: 'attackSpeed' | 'critChance' | 'damage' | 'cooldown' | 'hp';
  value: number;
}

export interface PlayerStats {
  attackSpeedMultiplier: number;
  critChance: number;
  damageMultiplier: number;
  baseHp: number;
  baseMaxHp: number;
}

/**
 * Apply a character's innate passive to player stats (mutates and returns).
 * - attackSpeed: multiply attackSpeedMultiplier by (1 + value)
 * - critChance: add value to critChance
 * - damage: multiply damageMultiplier by (1 + value)
 * - cooldown: multiply attackSpeedMultiplier by (1 + value) — faster cooldown = higher atk speed
 * - hp: multiply baseHp/baseMaxHp by (1 + value), ceil
 */
export function applyCharacterPassive(stats: PlayerStats, passive: PassiveInput): PlayerStats {
  switch (passive.type) {
    case 'attackSpeed':
      stats.attackSpeedMultiplier *= 1 + passive.value;
      break;
    case 'critChance':
      stats.critChance += passive.value;
      break;
    case 'damage':
      stats.damageMultiplier *= 1 + passive.value;
      break;
    case 'cooldown':
      stats.attackSpeedMultiplier *= 1 + passive.value;
      break;
    case 'hp':
      stats.baseHp = Math.ceil(stats.baseHp * (1 + passive.value));
      stats.baseMaxHp = stats.baseHp;
      break;
  }
  return stats;
}
