export interface SpawnCommand {
  enemyId: string;
  count: number;
  isElite: boolean;
}

import { SeededRandom } from './SeededRandom';

export interface WaveConfig {
  initialDelayMs: number;
  baseIntervalMs: number;
  minIntervalMs: number;
  intervalDecayPerMin: number;
  eliteChanceBase: number;
  eliteChancePerMin: number;
  bossTimeMinutes: number;
}

/**
 * Decides WHEN and WHAT to spawn. Pure TS.
 * The SpawnSystem (Phaser-side) handles WHERE and HOW.
 */
export class WaveDirector {
  private elapsed = 0;
  private timeSinceLastSpawn = 0;
  private bossSpawned = false;
  // Available enemy pool IDs (set externally)
  private enemyPool: string[] = ['basic'];
  // Boss ID (configurable per stage)
  private bossId = 'boss';

  constructor(
    private config: WaveConfig,
    private rng: SeededRandom,
  ) {}

  setEnemyPool(ids: string[]): void {
    this.enemyPool = ids;
  }

  setBossId(id: string): void {
    this.bossId = id;
  }

  /** Call every frame. Returns spawn commands (may be empty). */
  update(deltaMs: number): SpawnCommand[] {
    this.elapsed += deltaMs;
    if (this.elapsed < this.config.initialDelayMs) return [];

    this.timeSinceLastSpawn += deltaMs;

    const minutes = this.elapsed / 60000;
    const interval = Math.max(
      this.config.minIntervalMs,
      this.config.baseIntervalMs * Math.pow(this.config.intervalDecayPerMin, minutes),
    );

    if (this.timeSinceLastSpawn < interval) return [];
    this.timeSinceLastSpawn = 0;

    const commands: SpawnCommand[] = [];

    // Unlock enemy types over time (every ~12s for 60s stage)
    const unlockedCount = Math.min(this.enemyPool.length, 1 + Math.floor(minutes * 5));

    // Regular spawn (ramps from 1 to ~4 over 60s)
    const spawnCount = 1 + Math.floor(minutes * 3);
    const enemyId = this.enemyPool[this.rng.nextInt(0, unlockedCount)];
    const rawEliteChance = this.config.eliteChanceBase + this.config.eliteChancePerMin * minutes;
    const eliteChance = Math.min(rawEliteChance, 0.5); // cap at 50%
    const isElite = this.rng.next() < eliteChance;

    commands.push({ enemyId, count: spawnCount, isElite });

    // Boss at configured time
    if (!this.bossSpawned && minutes >= this.config.bossTimeMinutes) {
      this.bossSpawned = true;
      // Boss is NOT elite — already has massive base stats
      commands.push({ enemyId: this.bossId, count: 1, isElite: false });
    }

    return commands;
  }

  isBossSpawned(): boolean {
    return this.bossSpawned;
  }

  getElapsedMs(): number {
    return this.elapsed;
  }

  getElapsedMinutes(): number {
    return this.elapsed / 60000;
  }

  reset(): void {
    this.elapsed = 0;
    this.timeSinceLastSpawn = 0;
    this.bossSpawned = false;
  }
}
