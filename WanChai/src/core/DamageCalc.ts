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
