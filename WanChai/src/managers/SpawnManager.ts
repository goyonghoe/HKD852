import Phaser from 'phaser';
import { BALANCE } from '../config/balance';
import { ENEMY_DEFS } from '../config/enemies';
import { GAME_WIDTH } from '../config/game-config';
import { WaveDirector } from '../core/WaveDirector';
import type { SeededRandom } from '../core/SeededRandom';
import type { Enemy } from '../objects/Enemy';
import { buildEliteFilteredPool, calculateBossRushSpawn } from '../core/SpawnPoolLogic';

export type ChallengeModifier = '' | 'eliteOnly' | 'bossRush' | 'doubleSpeed' | 'halfHp' | 'noShop';

export interface SpawnCallbacks {
  /** Called when boss is spawned (for ARIA messages, audio, VFX) */
  onBossSpawn: () => void;
}

/**
 * Manages wave and boss spawning logic.
 * Extracted from RunScene Phase 3.
 */
export class SpawnManager {
  private waveDirector!: WaveDirector;
  private spawnEnded = false;
  private bossStageActive = false;
  private bossSpawnedThisStage = false;
  private callbacks: SpawnCallbacks;
  private challengeModifier: ChallengeModifier = '';
  private bossRushTimer = 0;
  private bossRushIndex = 0;
  private spawnSide: 'left' | 'right' = 'right'; // Street Defense: always right

  constructor(callbacks: SpawnCallbacks) {
    this.callbacks = callbacks;
  }

  /** Set the challenge modifier. Call before create(). */
  setChallengeModifier(modifier: ChallengeModifier): void {
    this.challengeModifier = modifier;
  }

  /** Initialize the WaveDirector. Call during RunScene.create(). */
  create(rng: SeededRandom): void {
    this.waveDirector = new WaveDirector(
      {
        initialDelayMs: BALANCE.SPAWN.initialDelayMs,
        baseIntervalMs: BALANCE.SPAWN.baseIntervalMs,
        minIntervalMs: BALANCE.SPAWN.minIntervalMs,
        intervalDecayPerMin: BALANCE.SPAWN.intervalDecayPerMin,
        eliteChanceBase: BALANCE.SPAWN.eliteChanceBase,
        eliteChancePerMin: BALANCE.SPAWN.eliteChancePerMin,
        bossTimeMinutes: Infinity, // boss stages are separate — never auto-spawn boss
      },
      rng,
    );

    const stage1Config = BALANCE.STAGE.stages[0];
    const basePool = stage1Config.enemyPool ?? Object.keys(ENEMY_DEFS).filter((id) => !id.startsWith('boss'));
    const allIds = Object.keys(ENEMY_DEFS);

    const enemyPool = buildEliteFilteredPool(basePool, this.challengeModifier, BALANCE.CHALLENGE.t1EnemyIds, allIds);

    this.waveDirector.setEnemyPool(enemyPool);

    this.spawnEnded = false;
    this.bossStageActive = false;
    this.bossSpawnedThisStage = false;
    this.bossRushTimer = 0;
    this.bossRushIndex = 0;
  }

  /**
   * Phase 3: Spawn enemies for this frame.
   * Call during RunScene.update() when phase === 'playing'.
   */
  update(
    scaledDelta: number,
    stageTime: number,
    stage: number,
    activeEnemyCount: number,
    enemyGroup: Phaser.Physics.Arcade.Group,
    rng: SeededRandom,
    stageHpMult: number,
    stageSpeedMult: number,
    stageDamageMult: number,
  ): void {
    const stageConfig = BALANCE.STAGE.stages[stage - 1];

    // bossRush modifier: skip wave phases, spawn bosses on a timer
    if (this.challengeModifier === 'bossRush') {
      this.bossRushTimer += scaledDelta;
      const result = calculateBossRushSpawn(
        this.bossRushTimer,
        BALANCE.CHALLENGE.bossRushIntervalMs,
        BALANCE.CHALLENGE.bossRushPool,
        this.bossRushIndex,
      );
      this.bossRushTimer = result.newTimer;
      this.bossRushIndex = result.newIndex;
      if (result.shouldSpawn) {
        this.spawnEnemies(
          result.bossId,
          1,
          false,
          activeEnemyCount,
          enemyGroup,
          rng,
          stageHpMult,
          stageSpeedMult,
          stageDamageMult,
          stage,
        );
        this.callbacks.onBossSpawn();
      }
      return;
    }

    if (this.bossStageActive) {
      // Boss stage: spawn boss once at start, no wave spawning
      if (!this.bossSpawnedThisStage) {
        this.bossSpawnedThisStage = true;
        const bossId = stageConfig?.bossId ?? 'boss';
        this.spawnEnemies(
          bossId,
          1,
          false,
          activeEnemyCount,
          enemyGroup,
          rng,
          stageHpMult,
          stageSpeedMult,
          stageDamageMult,
          stage,
        );
        this.callbacks.onBossSpawn();
      }
    } else if (!this.spawnEnded) {
      // Wave stage: timed spawning
      const duration = stageConfig?.durationMs ?? 60000;
      if (stageTime >= duration) {
        this.spawnEnded = true;
      } else {
        const commands = this.waveDirector.update(scaledDelta);
        for (const cmd of commands) {
          this.spawnEnemies(
            cmd.enemyId,
            cmd.count,
            cmd.isElite,
            activeEnemyCount,
            enemyGroup,
            rng,
            stageHpMult,
            stageSpeedMult,
            stageDamageMult,
            stage,
          );
        }
      }
    }
  }

  /** Spawn enemies into the group. */
  private spawnEnemies(
    defId: string,
    count: number,
    elite: boolean,
    activeEnemyCount: number,
    enemyGroup: Phaser.Physics.Arcade.Group,
    rng: SeededRandom,
    stageHpMult: number,
    stageSpeedMult: number,
    stageDamageMult: number,
    stage = 1,
  ): void {
    const def = ENEMY_DEFS[defId] ?? ENEMY_DEFS['basic'];
    if (!def) return;
    const isBoss = defId.startsWith('boss');
    // Hard cap: skip spawn if already at max (bosses always spawn)
    if (!isBoss && activeEnemyCount >= BALANCE.SPAWN.maxEnemiesOnScreen) return;
    const minutes = this.waveDirector.getElapsedMinutes();
    // Clamp spawn count to remaining capacity (bosses bypass)
    const capacity = BALANCE.SPAWN.maxEnemiesOnScreen - activeEnemyCount;
    const actualCount = isBoss ? count : Math.min(count, Math.max(0, capacity));

    for (let i = 0; i < actualCount; i++) {
      const enemy = enemyGroup.get() as Enemy | null;
      if (!enemy) return;

      // Street Defense: all enemies spawn from right side only
      const side: 'left' | 'right' = 'right';

      let sy: number;
      // Side-view: all enemies spawn from the right edge
      const sx = isBoss ? GAME_WIDTH + 80 : BALANCE.SPAWN.spawnRightX;

      // Y position based on category: ground enemies on floor, air enemies at varying heights
      if (def.category === 'air') {
        sy = BALANCE.SPAWN.airYMin + rng.next() * (BALANCE.SPAWN.airYMax - BALANCE.SPAWN.airYMin);
      } else {
        // Ground enemies spawn at fixed floor Y
        sy = BALANCE.SPAWN.groundY;
      }
      enemy.rng = rng; // TASK-011 RT: pass SeededRandom for combat-relevant randomness
      enemy.activate(def, sx, sy, minutes, elite, stageHpMult, stageSpeedMult, stageDamageMult, side, stage);
    }
  }

  /** Reset for a new stage. Call during nextStage(). */
  resetForStage(stage: number): void {
    const nextConfig = BALANCE.STAGE.stages[stage - 1];

    // bossRush: never enter boss stage mode — bosses spawn on timer
    if (this.challengeModifier === 'bossRush') {
      this.bossStageActive = false;
      this.bossSpawnedThisStage = false;
      this.spawnEnded = false;
      return;
    }

    this.bossStageActive = nextConfig?.type === 'boss';
    this.bossSpawnedThisStage = false;
    this.spawnEnded = false;

    if (!this.bossStageActive) {
      this.waveDirector.reset();
      const pool = nextConfig?.enemyPool;
      if (pool) {
        const allIds = Object.keys(ENEMY_DEFS);
        const filtered = buildEliteFilteredPool(pool, this.challengeModifier, BALANCE.CHALLENGE.t1EnemyIds, allIds);
        this.waveDirector.setEnemyPool(filtered);
      }
    }
  }

  /** Whether the wave spawn timer has ended (for victory check). */
  get isSpawnEnded(): boolean {
    return this.spawnEnded;
  }

  /** Whether current stage is a boss stage. */
  get isBossStage(): boolean {
    return this.bossStageActive;
  }

  /** Get the active challenge modifier. */
  getModifier(): ChallengeModifier {
    return this.challengeModifier;
  }

  /** WaveDirector elapsed minutes (used by spawnEnemies for difficulty scaling). */
  getElapsedMinutes(): number {
    return this.waveDirector.getElapsedMinutes();
  }

  shutdown(): void {
    // No Phaser objects owned — nothing to destroy
  }
}
