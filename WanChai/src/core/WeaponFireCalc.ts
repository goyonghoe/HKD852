/**
 * WeaponFireCalc — pure math functions for weapon firing calculations.
 * Extracted from WeaponSystem.ts for testability.
 *
 * RULE M-001: Zero Phaser imports (pure TS only).
 * RULE M-002: No magic numbers — all balance values parameterized.
 */

/**
 * Level-based damage multiplier.
 * Formula: 1 + (level - 1) * 0.2
 */
export function calculateLevelMultiplier(level: number): number {
  const safeLevel = Math.max(1, level);
  return 1 + (safeLevel - 1) * 0.2;
}

/**
 * Per-weapon projectile count formulas.
 * - energy_shot: 1 + floor(level / 2)        → 1,2,2,3,3,...
 * - shotgun:     baseCount + floor((level-1)/2)*2 → 3,3,5,5,7,...
 * - default:     baseCount + floor((level-1)*0.5)
 */
export function calculateProjectileCount(weaponId: string, level: number, baseCount: number): number {
  const safeLevel = Math.max(1, level);
  if (weaponId === 'energy_shot') {
    return 1 + Math.floor(safeLevel / 2);
  }
  if (weaponId === 'shotgun') {
    return baseCount + Math.floor((safeLevel - 1) / 2) * 2;
  }
  return baseCount + Math.floor((safeLevel - 1) * 0.5);
}

/**
 * Fan spread angle based on weapon type and projectile count.
 * - shotgun: count>1 → 0.12 + (count-3)*0.03   (3=0.12, 5=0.18, 7=0.24)
 * - default: count>1 → 0.15, else 0
 */
export function calculateSpreadAngle(weaponId: string, count: number): number {
  if (weaponId === 'shotgun') {
    return count > 1 ? 0.12 + (count - 3) * 0.03 : 0;
  }
  return count > 1 ? 0.15 : 0;
}

/**
 * Compute individual bullet angles in a fan pattern.
 * count=1: [baseAngle]
 * count>1: evenly spaced across spread, centered on baseAngle.
 */
export function calculateFanAngles(baseAngle: number, count: number, spread: number): number[] {
  if (count <= 1) return [baseAngle];

  const angles: number[] = [];
  for (let i = 0; i < count; i++) {
    angles.push(baseAngle - spread / 2 + (spread / (count - 1)) * i);
  }
  return angles;
}

/**
 * Piercing count that scales with level.
 * Formula: basePiercing + floor(level / 3)
 */
export function calculatePiercing(basePiercing: number, level: number): number {
  return basePiercing + Math.floor(level / 3);
}

/**
 * AOE radius that scales with level.
 * Formula: baseRadius + level * 10
 */
export function calculateAoeRadius(baseRadius: number, level: number): number {
  return baseRadius + level * 10;
}

/**
 * Homing missile parameters that scale with level.
 * - speed:    baseSpeed + level * 40
 * - turnRate: baseTurnRate + level * turnRatePerLevel
 * - count:    baseCount + floor((level-1) * 0.5)
 */
export function calculateHomingParams(
  level: number,
  baseSpeed: number,
  baseCount: number,
  baseTurnRate: number,
  turnRatePerLevel: number,
): { speed: number; turnRate: number; count: number } {
  return {
    speed: baseSpeed + level * 40,
    turnRate: baseTurnRate + level * turnRatePerLevel,
    count: baseCount + Math.floor((level - 1) * 0.5),
  };
}

/**
 * Homing missile spread angles (wider than fan pattern).
 * count=1: [baseAngle]
 * count>1: baseAngle + evenly spaced across [-0.3, +0.3] range
 */
export function calculateHomingSpreadAngles(baseAngle: number, count: number): number[] {
  if (count <= 1) return [baseAngle];

  const angles: number[] = [];
  for (let i = 0; i < count; i++) {
    angles.push(baseAngle + (-0.3 + (0.6 / (count - 1)) * i));
  }
  return angles;
}

/**
 * Chain lightning bounce count that scales with level.
 * Formula: baseCount + floor((level-1) * 0.5)
 */
export function calculateChainCount(baseCount: number, level: number): number {
  return baseCount + Math.floor((level - 1) * 0.5);
}

/**
 * Train formation positions (energy_shot pattern).
 * Each bullet is spaced behind the previous along the firing direction.
 * i=0 is the lead position (at player), i=1 is one spacing behind, etc.
 */
export function calculateTrainPositions(
  playerX: number,
  playerY: number,
  angle: number,
  count: number,
  spacing: number,
): Array<{ x: number; y: number }> {
  const dirX = Math.cos(angle);
  const dirY = Math.sin(angle);
  const positions: Array<{ x: number; y: number }> = [];

  for (let i = 0; i < count; i++) {
    positions.push({
      x: playerX - dirX * spacing * i,
      y: playerY - dirY * spacing * i,
    });
  }
  return positions;
}
