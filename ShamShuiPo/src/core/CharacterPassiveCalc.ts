// ── CharacterPassiveCalc ──
// Pure TypeScript — NO Phaser imports.
// Applies character-specific passive bonuses + in-run passives + meta bonuses to base stats.

import { getCharacter } from "../config/characters";
import { PLAYER_BASE, PASSIVES, type PassiveDef } from "../config/balance";

// ── Types ──

export interface PassiveSlot {
  passiveId: string;
  level: number; // 1-indexed
}

export interface MetaBonuses {
  hpBonus?: number;
  damageBonus?: number;
  speedBonus?: number;
  magnetBonus?: number;
}

export interface EffectiveStats {
  hp: number;
  speed: number;
  damage: number; // multiplier (1.0 = base)
  critChance: number;
  critMultiplier: number;
  magnetRadius: number;
  armor: number;
  regenPerSec: number;
}

// ── Functions ──

/**
 * Calculate effective player stats by layering:
 * 1. PLAYER_BASE values
 * 2. Character passive bonus (% based)
 * 3. In-run passive upgrades from passiveSlots
 * 4. Optional meta bonuses
 */
export function calculateEffectiveStats(
  characterId: string,
  passiveSlots: PassiveSlot[],
  metaBonuses?: MetaBonuses,
): EffectiveStats {
  const character = getCharacter(characterId);

  // Start with base values
  let hp = PLAYER_BASE.hp;
  let speed = PLAYER_BASE.speed;
  let damage = 1.0; // multiplier
  let critChance = PLAYER_BASE.critChance;
  let critMultiplier = PLAYER_BASE.critMultiplier;
  let magnetRadius = PLAYER_BASE.magnetRadius;
  let armor = PLAYER_BASE.armor;
  let regenPerSec = PLAYER_BASE.regenPerSec;

  // Apply character passive bonus (percentage-based)
  const { stat, value } = character.passiveBonus;
  switch (stat) {
    case "move_speed":
      speed *= 1 + value;
      break;
    case "damage":
      damage *= 1 + value;
      break;
    case "max_hp":
      hp *= 1 + value;
      break;
  }

  // Apply in-run passive upgrades
  for (const slot of passiveSlots) {
    const passiveDef: PassiveDef | undefined = PASSIVES[slot.passiveId];
    if (!passiveDef || slot.level < 1) continue;

    const levelIndex = Math.min(slot.level - 1, passiveDef.values.length - 1);
    const val = passiveDef.values[levelIndex];

    switch (slot.passiveId) {
      // Percentage-based passives
      case "damage":
        damage *= 1 + val;
        break;
      case "speed":
        speed *= 1 + val;
        break;
      case "crit":
        critChance += val;
        break;
      case "crit_dmg":
        critMultiplier += val;
        break;
      case "area":
      case "cooldown":
      case "luck":
      case "xp_bonus":
        // These affect other systems, not EffectiveStats directly
        break;

      // Flat-value passives
      case "hp":
        hp += val;
        break;
      case "magnet":
        magnetRadius += val;
        break;
      case "armor":
        armor += val;
        break;
      case "regen":
        regenPerSec += val;
        break;
      case "projectile":
        // Flat count, affects weapon system not base stats
        break;
    }
  }

  // Apply meta bonuses (flat additions)
  if (metaBonuses) {
    if (metaBonuses.hpBonus) hp += metaBonuses.hpBonus;
    if (metaBonuses.damageBonus) damage *= 1 + metaBonuses.damageBonus;
    if (metaBonuses.speedBonus) speed *= 1 + metaBonuses.speedBonus;
    if (metaBonuses.magnetBonus) magnetRadius += metaBonuses.magnetBonus;
  }

  return {
    hp,
    speed,
    damage,
    critChance,
    critMultiplier,
    magnetRadius,
    armor,
    regenPerSec,
  };
}

/** Returns the character's starting weapon ID. */
export function getStartingWeapon(characterId: string): string {
  return getCharacter(characterId).startingWeapon;
}

/** Returns the character's passive bonus info with human-readable text. */
export function getCharacterBonus(characterId: string): {
  stat: string;
  value: number;
  displayText: string;
} {
  const character = getCharacter(characterId);
  const { stat, value } = character.passiveBonus;
  const percent = Math.round(value * 100);

  let displayText: string;
  switch (stat) {
    case "move_speed":
      displayText = `+${percent}% Move Speed`;
      break;
    case "damage":
      displayText = `+${percent}% Damage`;
      break;
    case "max_hp":
      displayText = `+${percent}% Max HP`;
      break;
    default:
      displayText = `+${percent}% ${stat}`;
  }

  return { stat, value, displayText };
}
