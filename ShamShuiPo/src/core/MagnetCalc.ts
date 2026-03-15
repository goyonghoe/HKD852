// MagnetCalc.ts — pure TypeScript, NO Phaser imports
// Calculates magnet/pickup radius and attraction behavior.

import { PLAYER_BASE, PASSIVES } from "../config/balance";

// ── Types ──

export interface PickupTarget {
  id: string;
  x: number;
  y: number;
}

// ── Functions ──

/**
 * Effective magnet radius = base + passive bonus + meta bonus.
 * magnetPassiveLevel: 0 = no passive equipped, 1-5 = passive level.
 */
export function getEffectiveMagnetRadius(
  magnetPassiveLevel: number,
  metaMagnetBonus: number,
): number {
  const base = PLAYER_BASE.magnetRadius;
  const passiveValues = PASSIVES.magnet.values;
  const passiveBonus =
    magnetPassiveLevel >= 1 && magnetPassiveLevel <= passiveValues.length
      ? passiveValues[magnetPassiveLevel - 1]
      : 0;
  return base + passiveBonus + metaMagnetBonus;
}

/**
 * Returns all pickups within radius of player using squared distance check.
 */
export function getPickupsInRange(
  playerX: number,
  playerY: number,
  radius: number,
  pickups: PickupTarget[],
): PickupTarget[] {
  const r2 = radius * radius;
  return pickups.filter((p) => {
    const dx = p.x - playerX;
    const dy = p.y - playerY;
    return dx * dx + dy * dy <= r2;
  });
}

/**
 * Returns new position of pickup, moved toward player by pullStrength fraction (0-1).
 * pullStrength=1.0 → teleport to player.
 * pullStrength=0.3 → move 30% of the way toward player.
 */
export function calculateMagnetPull(
  playerX: number,
  playerY: number,
  pickupX: number,
  pickupY: number,
  pullStrength: number,
): { x: number; y: number } {
  return {
    x: pickupX + (playerX - pickupX) * pullStrength,
    y: pickupY + (playerY - pickupY) * pullStrength,
  };
}

/**
 * Magnet burst radius = baseRadius * burstMultiplier.
 * Used for magnet burst pickup drops that vacuum a wider area.
 */
export function getMagnetBurstRadius(
  baseRadius: number,
  burstMultiplier: number,
): number {
  return baseRadius * burstMultiplier;
}

/**
 * Returns true if pickup is within collectRadius of player.
 * collectRadius is typically much smaller than magnet radius;
 * used to trigger actual item pickup (vs just pulling toward player).
 */
export function shouldAutoCollect(
  playerX: number,
  playerY: number,
  pickupX: number,
  pickupY: number,
  collectRadius: number,
): boolean {
  const dx = pickupX - playerX;
  const dy = pickupY - playerY;
  return dx * dx + dy * dy <= collectRadius * collectRadius;
}
