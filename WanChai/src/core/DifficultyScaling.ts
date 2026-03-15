/**
 * Pure difficulty scaling logic extracted from ProgressionManager/RunScene.
 * NO Phaser imports (M-001). All balance numbers from config (M-002).
 */

import { BALANCE } from '../config/balance';

export interface DifficultyConfig {
  hpMult: number;
  speedMult: number;
  damageMult: number;
}

export interface DifficultyMultipliers {
  hpMult: number;
  speedMult: number;
  damageMult: number;
}

/**
 * Calculate cumulative difficulty multipliers for a given stage.
 * Each multiplier grows exponentially: base^(stage - 1).
 * Stage 1 always returns { 1, 1, 1 }.
 *
 * @param stage - 1-based stage number
 * @param diffConfig - per-stage multiplier config from balance.ts
 */
export function calculateStageDifficultyMultipliers(
  stage: number,
  diffConfig: DifficultyConfig,
): DifficultyMultipliers {
  if (stage <= 1) {
    return { hpMult: 1, speedMult: 1, damageMult: 1 };
  }
  const exp = stage - 1;
  return {
    hpMult: Math.pow(diffConfig.hpMult, exp),
    speedMult: Math.pow(diffConfig.speedMult, exp),
    damageMult: Math.pow(diffConfig.damageMult, exp),
  };
}

export interface PassiveStatConfig {
  valuePerLevel: number;
}

export interface BaseStats {
  attackSpeedMultiplier: number;
  damageMultiplier: number;
  baseArmorMultiplier: number;
  critChance: number;
  critDamage: number;
}

/**
 * Apply a passive upgrade effect to base stats (pure calculation).
 * Returns updated stats object (does not mutate input).
 *
 * @param passiveId - passive effect type
 * @param level - current level of the passive (>= 1)
 * @param baseStats - current stat values
 * @param config - passive definition config
 * @param metaDamageBase - meta progression damage bonus (for 'damage' passive recalc)
 * @param metaCritBase - meta progression crit bonus (for 'crit_chance' passive recalc)
 * @param weatherCritBonus - weather crit bonus (for 'crit_chance' passive recalc)
 * @param shopArmorMultiplier - shop armor multiplier (for 'base_armor' passive recalc)
 * @param combatCritMultiplier - base crit damage multiplier from balance (for 'crit_damage' passive)
 */
export function applyPassiveStatEffect(
  passiveId: string,
  level: number,
  baseStats: BaseStats,
  config: PassiveStatConfig,
  metaDamageBase: number = 0,
  metaCritBase: number = 0,
  weatherCritBonus: number = 0,
  shopArmorMultiplier: number = 1,
  combatCritMultiplier: number = 2.0,
): BaseStats {
  const result = { ...baseStats };

  switch (passiveId) {
    case 'attack_speed':
      result.attackSpeedMultiplier = 1 + config.valuePerLevel * level;
      break;
    case 'damage':
      result.damageMultiplier = 1 + metaDamageBase + config.valuePerLevel * level;
      break;
    case 'base_armor': {
      const passiveArmor = Math.max(BALANCE.MID_SHOP.minArmorMultiplier, 1 - config.valuePerLevel * level);
      result.baseArmorMultiplier = passiveArmor * shopArmorMultiplier;
      break;
    }
    case 'crit_chance':
      result.critChance = metaCritBase + config.valuePerLevel * level + weatherCritBonus;
      break;
    case 'crit_damage':
      result.critDamage = combatCritMultiplier + config.valuePerLevel * level;
      break;
    default:
      // Character-specific passives (burn, frost, etc.) are runtime-reactive
      break;
  }

  return result;
}

/**
 * Calculate composite crit chance from meta, passive, and weather sources.
 *
 * @param metaBase - base crit chance from meta progression
 * @param passiveLevel - current crit_chance passive level
 * @param passiveValuePerLevel - crit_chance value per level from PASSIVE_DEFS
 * @param weatherBonus - crit bonus from weather effects
 */
export function calculateCompositeCritChance(
  metaBase: number,
  passiveLevel: number,
  passiveValuePerLevel: number,
  weatherBonus: number = 0,
): number {
  const passiveBonus = passiveLevel > 0 ? passiveValuePerLevel * passiveLevel : 0;
  return metaBase + passiveBonus + weatherBonus;
}

/**
 * Calculate stage clear heal amount.
 */
export function calculateStageClearHeal(currentHp: number, baseMaxHp: number, healPercent: number): number {
  const healAmount = Math.ceil(baseMaxHp * healPercent);
  return Math.min(baseMaxHp, currentHp + healAmount);
}
