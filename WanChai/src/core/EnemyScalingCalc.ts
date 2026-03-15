/**
 * EnemyScalingCalc — Pure TypeScript module for enemy stat scaling.
 *
 * Extracted from Enemy.ts activate() (lines 138-215).
 * M-001: ZERO Phaser imports. All balance values passed as parameters.
 */

/** Calculate HP scaling multiplier based on elapsed time. */
export function calculateHpScale(minutesElapsed: number, hpScalePerMin: number): number {
  const safeMinutes = Math.max(0, minutesElapsed);
  return Math.pow(hpScalePerMin, safeMinutes);
}

/** Calculate speed scaling multiplier, capped at maxSpeedMultiplier. */
export function calculateSpeedScale(
  minutesElapsed: number,
  speedScalePerMin: number,
  maxSpeedMultiplier: number,
): number {
  const safeMinutes = Math.max(0, minutesElapsed);
  return Math.min(Math.pow(speedScalePerMin, safeMinutes), maxSpeedMultiplier);
}

/** Calculate damage scaling multiplier based on elapsed time. */
export function calculateDamageScale(minutesElapsed: number, damageScalePerMin: number): number {
  const safeMinutes = Math.max(0, minutesElapsed);
  return Math.pow(damageScalePerMin, safeMinutes);
}

/** Get elite stat multipliers. */
export function getEliteMultipliers(
  isElite: boolean,
  defKnockbackImmune = false,
): {
  hpMult: number;
  damageMult: number;
  xpMult: number;
  knockbackImmune: boolean;
} {
  if (isElite) {
    return { hpMult: 3, damageMult: 2, xpMult: 5, knockbackImmune: true };
  }
  return { hpMult: 1, damageMult: 1, xpMult: 1, knockbackImmune: defKnockbackImmune };
}

/** Calculate final enemy HP with elite/stage multipliers and boss cap. */
export function calculateEnemyHp(
  baseHp: number,
  hpScale: number,
  eliteHpMult: number,
  stageHpMult: number,
  isBoss: boolean,
  maxBossHp: number,
): number {
  let finalHp = Math.ceil(baseHp * hpScale * eliteHpMult * stageHpMult);
  if (isBoss && finalHp > maxBossHp) {
    finalHp = maxBossHp;
  }
  return finalHp;
}

/** Calculate final enemy speed with scaling and stage multiplier. */
export function calculateEnemySpeed(baseSpeed: number, speedScale: number, stageSpeedMult: number): number {
  return baseSpeed * speedScale * stageSpeedMult;
}

/** Calculate final enemy damage with scaling, elite, and stage multipliers.
 *  Boss ATK is capped at maxBossAtk (similar to maxBossHp cap). */
export function calculateEnemyDamage(
  baseDamage: number,
  damageScale: number,
  eliteDamageMult: number,
  stageDamageMult: number,
  isBoss = false,
  maxBossAtk = Infinity,
): number {
  let finalDamage = Math.ceil(baseDamage * damageScale * eliteDamageMult * stageDamageMult);
  if (isBoss && finalDamage > maxBossAtk) {
    finalDamage = maxBossAtk;
  }
  return finalDamage;
}

/** Calculate enemy XP value with elite multiplier. */
export function calculateEnemyXp(baseXp: number, eliteXpMult: number): number {
  return baseXp * eliteXpMult;
}

/** Calculate display size based on texture width and enemy type.
 * @param bossDisplaySize - configurable boss display size from BALANCE.STAGE.bossDisplaySize
 */
export function calculateDisplaySize(
  texWidth: number,
  isBoss: boolean,
  isElite: boolean,
  bossDisplaySize = 384,
): number {
  let displaySize: number;
  if (isBoss) {
    displaySize = bossDisplaySize; // _large sprites are 384px — 1:1 for crisp rendering
  } else if (texWidth >= 72) {
    displaySize = 120; // T2
  } else {
    displaySize = 96; // T1
  }
  if (isElite) {
    displaySize *= 1.4;
  }
  return displaySize;
}

/** Calculate sprite scale from display size and texture width. */
export function calculateSpriteScale(displaySize: number, texWidth: number): number {
  if (texWidth <= 0) return 1;
  return displaySize / texWidth;
}

/** Calculate hit radius based on display size, enemy type, and sprite availability. */
export function calculateHitRadius(
  displaySize: number,
  isBoss: boolean,
  isElite: boolean,
  hasLargeSprite: boolean,
): number {
  if (hasLargeSprite) {
    return Math.round(displaySize * 0.2);
  }
  // Fallback when no valid sprite (texWidth <= 0)
  if (isBoss) return 40;
  if (isElite) return 24;
  return 20;
}

/** Check if a behavior string is a boss behavior. */
export function isBossBehavior(behavior: string): boolean {
  return behavior === 'boss_chase' || behavior === 'boss_circle' || behavior === 'boss_burst';
}
