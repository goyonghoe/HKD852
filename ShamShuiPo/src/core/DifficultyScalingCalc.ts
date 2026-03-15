// ── Neon Survivors: Difficulty Scaling Calculations ──
// Pure TypeScript — NO Phaser imports.
// Handles NG+ loop scaling and in-run minute-based difficulty.

import { DIFFICULTY, WAVE_TIMELINE, type WaveConfig } from "../config/balance";

// ════════════════════════════════════════════════════════════════
// § TYPES
// ════════════════════════════════════════════════════════════════

export interface ScaledDifficulty {
  hpMultiplier: number;
  damageMultiplier: number;
  speedMultiplier: number;
  coinMultiplier: number;
  spawnRateMultiplier: number;
}

// ════════════════════════════════════════════════════════════════
// § LOOP SCALING
// ════════════════════════════════════════════════════════════════

/**
 * Get difficulty multipliers for a given NG+ loop.
 * Loop 0 = first run (all multipliers 1.0).
 * Loop N = DIFFICULTY.loopXxx^N, capped at maxLoops.
 * Spawn rate increases by 20% per loop.
 */
export function getDifficultyForLoop(loop: number): ScaledDifficulty {
  const capped = Math.min(Math.max(loop, 0), DIFFICULTY.maxLoops);

  if (capped === 0) {
    return {
      hpMultiplier: 1.0,
      damageMultiplier: 1.0,
      speedMultiplier: 1.0,
      coinMultiplier: 1.0,
      spawnRateMultiplier: 1.0,
    };
  }

  return {
    hpMultiplier: DIFFICULTY.loopHpMultiplier ** capped,
    damageMultiplier: DIFFICULTY.loopDamageMultiplier ** capped,
    speedMultiplier: DIFFICULTY.loopSpeedMultiplier ** capped,
    coinMultiplier: DIFFICULTY.loopCoinMultiplier ** capped,
    spawnRateMultiplier: 1 + capped * 0.2,
  };
}

// ════════════════════════════════════════════════════════════════
// § WAVE + LOOP MERGE
// ════════════════════════════════════════════════════════════════

/**
 * Get the effective wave config for a given minute and NG+ loop.
 * Merges WAVE_TIMELINE entry with loop-based scaling.
 * Out-of-range minute clamps to the last timeline entry.
 */
export function getEffectiveWaveConfig(
  minute: number,
  loop: number,
): WaveConfig & ScaledDifficulty {
  const clampedMinute = Math.min(
    Math.max(Math.floor(minute), 0),
    WAVE_TIMELINE.length - 1,
  );
  const wave = WAVE_TIMELINE[clampedMinute];
  const loopScaling = getDifficultyForLoop(loop);

  return {
    ...wave,
    hpMultiplier: wave.hpMultiplier * loopScaling.hpMultiplier,
    damageMultiplier: wave.damageMultiplier * loopScaling.damageMultiplier,
    speedMultiplier: wave.speedMultiplier * loopScaling.speedMultiplier,
    coinMultiplier: loopScaling.coinMultiplier,
    spawnRateMultiplier: loopScaling.spawnRateMultiplier,
  };
}

// ════════════════════════════════════════════════════════════════
// § DIFFICULTY LABELS
// ════════════════════════════════════════════════════════════════

const LABELS: Record<number, string> = {
  0: "NORMAL",
  1: "HARD",
  2: "VERY HARD",
  3: "NIGHTMARE",
  4: "HELL",
};

/**
 * Get a human-readable difficulty label for a given loop.
 */
export function getDifficultyLabel(loop: number): string {
  if (loop >= 5) return "IMPOSSIBLE";
  return LABELS[Math.max(loop, 0)] ?? "IMPOSSIBLE";
}

// ════════════════════════════════════════════════════════════════
// § COMBINED ENEMY SCALING
// ════════════════════════════════════════════════════════════════

/**
 * Get the combined enemy stat multipliers for a given minute and loop.
 * Returns wave multiplier * loop multiplier for hp, damage, and speed.
 */
export function getEnemyScaling(
  minute: number,
  loop: number,
): { hp: number; damage: number; speed: number } {
  const effective = getEffectiveWaveConfig(minute, loop);

  return {
    hp: effective.hpMultiplier,
    damage: effective.damageMultiplier,
    speed: effective.speedMultiplier,
  };
}
