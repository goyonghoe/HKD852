/**
 * Pure ultimate ability calculations.
 * Extracted from UltimateManager.ts for testability.
 * NO Phaser imports — pure TypeScript only (M-001).
 */

export interface Position {
  x: number;
  y: number;
}

export interface EnemyTarget {
  x: number;
  y: number;
  hp: number;
  active: boolean;
}

export interface CycloneResult {
  hitIndices: number[];
  knockbacks: { index: number; vx: number; vy: number }[];
  killIndices: number[];
}

export interface BeamResult {
  hitIndices: number[];
  killIndices: number[];
}

/**
 * Hai Cyclone: radius-based hit detection + knockback vectors.
 * Hits all active enemies within radius of playerPos, applies damage,
 * and calculates knockback vectors for survivors.
 */
export function calculateCycloneHits(
  playerPos: Position,
  radius: number,
  damage: number,
  knockbackForce: number,
  enemies: readonly EnemyTarget[],
): CycloneResult {
  const hitIndices: number[] = [];
  const knockbacks: { index: number; vx: number; vy: number }[] = [];
  const killIndices: number[] = [];
  const radiusSq = radius * radius;

  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];
    if (!enemy.active) continue;

    const dx = enemy.x - playerPos.x;
    const dy = enemy.y - playerPos.y;

    if (dx * dx + dy * dy < radiusSq) {
      hitIndices.push(i);
      const remainingHp = enemy.hp - damage;

      if (remainingHp <= 0) {
        killIndices.push(i);
      } else {
        const angle = Math.atan2(dy, dx);
        knockbacks.push({
          index: i,
          vx: Math.cos(angle) * knockbackForce,
          vy: Math.sin(angle) * knockbackForce,
        });
      }
    }
  }

  return { hitIndices, knockbacks, killIndices };
}

/**
 * Mei Light Pillar: vertical beam hit detection (width-based).
 * Hits all active enemies whose X falls within playerX +/- beamHalfWidth.
 */
export function calculateBeamHits(
  playerX: number,
  beamHalfWidth: number,
  damage: number,
  enemies: readonly EnemyTarget[],
): BeamResult {
  const hitIndices: number[] = [];
  const killIndices: number[] = [];

  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];
    if (!enemy.active) continue;

    if (enemy.x >= playerX - beamHalfWidth && enemy.x <= playerX + beamHalfWidth) {
      hitIndices.push(i);
      if (enemy.hp - damage <= 0) {
        killIndices.push(i);
      }
    }
  }

  return { hitIndices, killIndices };
}

/**
 * Kai Earthquake: apply armor buff.
 * Reduces armor multiplier by buffPercent (e.g., 0.5 = 50% reduction).
 * Formula: currentArmor * (1 - buffPercent)
 */
export function applyArmorBuff(currentArmor: number, buffPercent: number): number {
  return currentArmor * (1 - buffPercent);
}

/**
 * Kai Earthquake: remove armor buff (inverse of apply).
 * Formula: currentArmor / (1 - buffPercent)
 * Guards against buffPercent >= 1.0 (division by zero).
 */
export function removeArmorBuff(currentArmor: number, buffPercent: number): number {
  if (buffPercent >= 1.0) return currentArmor;
  return currentArmor / (1 - buffPercent);
}

/**
 * Sol Firestorm: calculate number of DOT ticks.
 * Guards against zero/negative interval by returning 0.
 */
export function calculateDOTTicks(durationMs: number, intervalMs: number): number {
  if (intervalMs <= 0) return 0;
  return Math.floor(durationMs / intervalMs);
}

/**
 * Sol Firestorm: calculate total DOT damage over all ticks.
 */
export function calculateTotalDOTDamage(dotDamage: number, ticks: number): number {
  return dotDamage * ticks;
}

/**
 * Nova Frost Wave: count active enemies eligible for freeze.
 */
export function countFreezeTargets(enemies: readonly EnemyTarget[]): number {
  let count = 0;
  for (let i = 0; i < enemies.length; i++) {
    if (enemies[i].active) count++;
  }
  return count;
}
