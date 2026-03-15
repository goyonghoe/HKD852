/**
 * Pure damage calculation.
 * actual = base * damageMultiplier * (isCrit ? critMultiplier : 1)
 */
export interface DamageResult {
  damage: number;
  isCrit: boolean;
}

export function calculateDamage(
  baseDamage: number,
  damageMultiplier: number,
  critChance: number,
  critMultiplier: number,
  roll: number, // 0-1 random value
): DamageResult {
  const isCrit = roll < critChance;
  const damage = Math.ceil(baseDamage * damageMultiplier * (isCrit ? critMultiplier : 1));
  return { damage, isCrit };
}

/**
 * Element advantage multiplier.
 * Cycle: WIND > EARTH > LIGHT > FIRE > WATER > WIND
 * DARK: takes extra from all, deals extra to all (boss element)
 */
export type Effectiveness = 'effective' | 'resist' | 'neutral';

export interface ElementResult {
  multiplier: number;
  effectiveness: Effectiveness;
}

export function getElementMultiplier(
  attackerElement: string | null,
  defenderElement: string | null,
  advantages: Record<string, string>,
  advMult: number,
  disadvMult: number,
  darkMult: number,
): ElementResult {
  if (!attackerElement || !defenderElement) return { multiplier: 1, effectiveness: 'neutral' };

  // DARK defender: all attacks deal extra damage
  if (defenderElement === 'DARK') {
    return { multiplier: darkMult, effectiveness: 'effective' };
  }
  // DARK attacker: deals extra damage to all
  if (attackerElement === 'DARK') {
    return { multiplier: darkMult, effectiveness: 'effective' };
  }

  // Advantage cycle
  if (advantages[attackerElement] === defenderElement) {
    return { multiplier: advMult, effectiveness: 'effective' };
  }
  // Disadvantage (reverse lookup)
  if (advantages[defenderElement] === attackerElement) {
    return { multiplier: disadvMult, effectiveness: 'resist' };
  }

  return { multiplier: 1, effectiveness: 'neutral' };
}
