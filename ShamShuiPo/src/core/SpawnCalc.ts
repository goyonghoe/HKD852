// ── Neon Survivors: Spawn Calculations ──
// Pure TypeScript — NO Phaser imports.

import {
  WAVE_TIMELINE,
  ENEMIES,
  SPAWN,
  type WaveConfig,
  type EnemyDef,
} from "../config/balance";

// ════════════════════════════════════════════════════════════════
// § WAVE CONFIG
// ════════════════════════════════════════════════════════════════

/**
 * Get the WaveConfig for the given elapsed seconds.
 * Looks up the WAVE_TIMELINE by minute.
 */
export function getWaveConfig(elapsedSeconds: number): WaveConfig {
  const minute = Math.min(
    Math.floor(elapsedSeconds / 60),
    WAVE_TIMELINE.length - 1,
  );
  return WAVE_TIMELINE[minute];
}

// ════════════════════════════════════════════════════════════════
// § SPAWN POSITION
// ════════════════════════════════════════════════════════════════

/**
 * Generate a random spawn position on a ring around the player.
 */
export function getSpawnPosition(
  playerX: number,
  playerY: number,
  spawnRadius: number = SPAWN.spawnRadius,
): { x: number; y: number } {
  const angle = Math.random() * Math.PI * 2;
  return {
    x: playerX + Math.cos(angle) * spawnRadius,
    y: playerY + Math.sin(angle) * spawnRadius,
  };
}

// ════════════════════════════════════════════════════════════════
// § ENEMY SCALING
// ════════════════════════════════════════════════════════════════

/**
 * Scale an enemy's stats based on the current wave config multipliers.
 * Returns a new object with scaled values (does not mutate original).
 */
export function scaleEnemy(
  enemyDef: EnemyDef,
  waveConfig: WaveConfig,
): { hp: number; speed: number; damage: number } {
  return {
    hp: Math.round(enemyDef.hp * waveConfig.hpMultiplier),
    speed: Math.round(enemyDef.speed * waveConfig.speedMultiplier),
    damage: Math.round(enemyDef.damage * waveConfig.damageMultiplier),
  };
}

// ════════════════════════════════════════════════════════════════
// § SPAWN PROBABILITY
// ════════════════════════════════════════════════════════════════

/**
 * Determine whether an enemy should spawn this frame.
 * Uses a probability check based on dt and enemies per second.
 */
export function shouldSpawnEnemy(
  dt: number,
  enemiesPerSecond: number,
): boolean {
  // Probability of at least one spawn in dt seconds
  const probability = 1 - Math.pow(1 - enemiesPerSecond / 60, dt * 60);
  return Math.random() < probability;
}

// ════════════════════════════════════════════════════════════════
// § ENEMY SELECTION
// ════════════════════════════════════════════════════════════════

/**
 * Pick a random enemy ID from the wave's enemy pool.
 */
export function pickRandomEnemy(waveConfig: WaveConfig): string {
  const pool = waveConfig.enemyPool;
  if (pool.length === 0) return "drone";
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Get an enemy definition by ID.
 */
export function getEnemyDef(enemyId: string): EnemyDef | undefined {
  return ENEMIES[enemyId];
}
