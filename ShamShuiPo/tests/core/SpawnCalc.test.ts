// ── Tests: SpawnCalc ──

import { describe, it, expect } from "vitest";
import {
  getWaveConfig,
  getSpawnPosition,
  scaleEnemy,
  shouldSpawnEnemy,
  pickRandomEnemy,
  getEnemyDef,
} from "../../src/core/SpawnCalc";
import { WAVE_TIMELINE, ENEMIES, SPAWN } from "../../src/config/balance";

describe("getWaveConfig", () => {
  it("returns minute 0 config at start of run", () => {
    const config = getWaveConfig(0);
    expect(config.minute).toBe(0);
    expect(config.enemyPool).toContain("drone");
  });

  it("returns minute 1 config at 60 seconds", () => {
    const config = getWaveConfig(60);
    expect(config.minute).toBe(1);
  });

  it("returns correct config at 90 seconds (still minute 1)", () => {
    const config = getWaveConfig(90);
    expect(config.minute).toBe(1);
  });

  it("clamps to last wave config beyond 10 minutes", () => {
    const config = getWaveConfig(9999);
    expect(config.minute).toBe(WAVE_TIMELINE[WAVE_TIMELINE.length - 1].minute);
  });

  it("has boss spawn at minute 5", () => {
    const config = getWaveConfig(300); // 5 minutes
    expect(config.bossSpawn).toBe("mini_boss");
  });

  it("enemies per second increases over time", () => {
    const early = getWaveConfig(0);
    const late = getWaveConfig(540);
    expect(late.enemiesPerSecond).toBeGreaterThan(early.enemiesPerSecond);
  });
});

describe("getSpawnPosition", () => {
  it("spawns at correct distance from player", () => {
    const pos = getSpawnPosition(360, 640);
    const dx = pos.x - 360;
    const dy = pos.y - 640;
    const dist = Math.sqrt(dx * dx + dy * dy);
    expect(dist).toBeCloseTo(SPAWN.spawnRadius, 0);
  });

  it("respects custom spawn radius", () => {
    const customRadius = 200;
    const pos = getSpawnPosition(0, 0, customRadius);
    const dist = Math.sqrt(pos.x * pos.x + pos.y * pos.y);
    expect(dist).toBeCloseTo(customRadius, 0);
  });

  it("produces varied positions across calls", () => {
    const positions = Array.from({ length: 20 }, () =>
      getSpawnPosition(360, 640),
    );
    const uniqueX = new Set(positions.map((p) => Math.round(p.x)));
    // With 20 random samples, we expect more than 1 unique x value
    expect(uniqueX.size).toBeGreaterThan(1);
  });

  it("works at origin", () => {
    const pos = getSpawnPosition(0, 0);
    const dist = Math.sqrt(pos.x * pos.x + pos.y * pos.y);
    expect(dist).toBeCloseTo(SPAWN.spawnRadius, 0);
  });
});

describe("scaleEnemy", () => {
  it("returns unscaled stats with 1.0 multipliers", () => {
    const wave = getWaveConfig(0); // minute 0: all multipliers 1.0
    const drone = ENEMIES.drone;
    const scaled = scaleEnemy(drone, wave);
    expect(scaled.hp).toBe(drone.hp);
    expect(scaled.speed).toBe(drone.speed);
    expect(scaled.damage).toBe(drone.damage);
  });

  it("scales hp with wave multiplier", () => {
    const wave = getWaveConfig(420); // minute 7: hpMultiplier 2.0
    const drone = ENEMIES.drone;
    const scaled = scaleEnemy(drone, wave);
    expect(scaled.hp).toBe(Math.round(drone.hp * wave.hpMultiplier));
  });

  it("scales all stats independently", () => {
    const wave = getWaveConfig(540); // minute 9
    const enforcer = ENEMIES.enforcer;
    const scaled = scaleEnemy(enforcer, wave);
    expect(scaled.hp).toBe(Math.round(enforcer.hp * wave.hpMultiplier));
    expect(scaled.speed).toBe(Math.round(enforcer.speed * wave.speedMultiplier));
    expect(scaled.damage).toBe(
      Math.round(enforcer.damage * wave.damageMultiplier),
    );
  });

  it("does not mutate the original enemy def", () => {
    const wave = getWaveConfig(420);
    const originalHp = ENEMIES.drone.hp;
    scaleEnemy(ENEMIES.drone, wave);
    expect(ENEMIES.drone.hp).toBe(originalHp);
  });

  it("late-game enemies are significantly tougher", () => {
    const earlyWave = getWaveConfig(0);
    const lateWave = getWaveConfig(600);
    const earlyScaled = scaleEnemy(ENEMIES.drone, earlyWave);
    const lateScaled = scaleEnemy(ENEMIES.drone, lateWave);
    expect(lateScaled.hp).toBeGreaterThan(earlyScaled.hp * 2);
  });
});

describe("shouldSpawnEnemy", () => {
  it("returns a boolean", () => {
    const result = shouldSpawnEnemy(0.016, 2);
    expect(typeof result).toBe("boolean");
  });

  it("never spawns with 0 enemies per second", () => {
    // With 0 EPS the probability formula gives 0
    let spawned = false;
    for (let i = 0; i < 100; i++) {
      if (shouldSpawnEnemy(0.016, 0)) spawned = true;
    }
    expect(spawned).toBe(false);
  });

  it("high spawn rate over long dt has high probability", () => {
    // With very high spawn rate over 1 second, most calls should return true
    let spawnCount = 0;
    for (let i = 0; i < 100; i++) {
      if (shouldSpawnEnemy(1, 60)) spawnCount++;
    }
    expect(spawnCount).toBeGreaterThan(90);
  });
});

describe("pickRandomEnemy", () => {
  it("returns an enemy from the wave pool", () => {
    const wave = getWaveConfig(0);
    const enemyId = pickRandomEnemy(wave);
    expect(wave.enemyPool).toContain(enemyId);
  });

  it("defaults to drone for empty pool", () => {
    const emptyWave = { ...getWaveConfig(0), enemyPool: [] as string[] };
    expect(pickRandomEnemy(emptyWave)).toBe("drone");
  });

  it("picks from full late-game pool", () => {
    const wave = getWaveConfig(420); // minute 7: large pool
    const picks = new Set(
      Array.from({ length: 100 }, () => pickRandomEnemy(wave)),
    );
    // Should pick at least 2 different enemy types
    expect(picks.size).toBeGreaterThan(1);
  });
});

describe("getEnemyDef", () => {
  it("returns drone definition", () => {
    const def = getEnemyDef("drone");
    expect(def).toBeDefined();
    expect(def!.id).toBe("drone");
    expect(def!.hp).toBe(ENEMIES.drone.hp);
  });

  it("returns undefined for unknown enemy", () => {
    const def = getEnemyDef("nonexistent");
    expect(def).toBeUndefined();
  });

  it("all defined enemies have valid tier", () => {
    for (const id of Object.keys(ENEMIES)) {
      const def = getEnemyDef(id);
      expect(def).toBeDefined();
      expect([1, 2, 3]).toContain(def!.tier);
    }
  });
});
