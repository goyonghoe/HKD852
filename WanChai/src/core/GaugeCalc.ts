/**
 * Pure gauge calculations for ultimates and XP.
 * No Phaser imports — pure TypeScript only (M-001).
 */

export interface GaugeResult {
  newValue: number;
  isReady: boolean;
}

/**
 * Add gauge from a single kill. Clamps to gaugeMax.
 */
export function addGaugeFromKill(currentGauge: number, gaugeMax: number, gaugePerKill: number): GaugeResult {
  const newValue = Math.min(currentGauge + gaugePerKill, gaugeMax);
  return { newValue, isReady: newValue >= gaugeMax };
}

/**
 * Check if gauge is at or above max (ultimate ready).
 */
export function isGaugeReady(current: number, max: number): boolean {
  return current >= max;
}

/**
 * Reset gauge after ultimate activation.
 */
export function resetGauge(): number {
  return 0;
}

/**
 * Calculate gauge display percentage (0-100), clamped.
 * Returns 0 if max <= 0 (guard against division by zero).
 */
export function calculateGaugePercent(current: number, max: number): number {
  if (max <= 0) return 0;
  return Math.max(0, Math.min((current / max) * 100, 100));
}

/**
 * Estimate kills needed to fill gauge from current state.
 * Returns 0 if already full, Infinity if gaugePerKill <= 0.
 */
export function estimateKillsToFull(currentGauge: number, gaugeMax: number, gaugePerKill: number): number {
  const remaining = gaugeMax - currentGauge;
  if (remaining <= 0) return 0;
  if (gaugePerKill <= 0) return Infinity;
  return Math.ceil(remaining / gaugePerKill);
}

/**
 * XP gauge percentage for HUD (0-100).
 * Returns 0 if xpToNextLevel <= 0 (guard against division by zero).
 */
export function calculateXpPercent(currentXp: number, xpToNextLevel: number): number {
  if (xpToNextLevel <= 0) return 0;
  return Math.min((currentXp / xpToNextLevel) * 100, 100);
}

/**
 * Batch gauge fill from multiple kills at once (e.g., AOE).
 * Clamps to gaugeMax.
 */
export function batchGaugeFill(currentGauge: number, gaugeMax: number, kills: { gaugePerKill: number }[]): GaugeResult {
  let total = currentGauge;
  for (const kill of kills) {
    total += kill.gaugePerKill;
  }
  const newValue = Math.min(total, gaugeMax);
  return { newValue, isReady: newValue >= gaugeMax };
}

/**
 * Validate gauge config: gaugeMax must be positive, gaugePerKill must be positive.
 */
export function validateGaugeConfig(gaugeMax: number, gaugePerKill: number): boolean {
  return gaugeMax > 0 && gaugePerKill > 0;
}
