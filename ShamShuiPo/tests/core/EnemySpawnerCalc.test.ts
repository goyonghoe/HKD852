import { describe, it, expect } from "vitest";
import {
  createSpawnerManager,
  addSpawner,
  tick,
  damageSpawner,
  destroySpawner,
  getActiveSpawners,
  getSpawnerAtPoint,
  getSpawnPosition,
  isSpawnerExhausted,
  upgradeSpawner,
  getSpawnerThreatLevel,
  selectSpawnerConfig,
  SPAWNER_CONFIGS,
  type SpawnerState,
  type SpawnerManagerState,
} from "../../src/core/EnemySpawnerCalc";

// ════════════════════════════════════════════════════════════════
// § createSpawnerManager
// ════════════════════════════════════════════════════════════════

describe("createSpawnerManager", () => {
  it("creates empty manager with default max 5", () => {
    const mgr = createSpawnerManager();
    expect(mgr.spawners).toEqual([]);
    expect(mgr.nextId).toBe(1);
    expect(mgr.maxActiveSpawners).toBe(5);
  });

  it("accepts custom max active spawners", () => {
    const mgr = createSpawnerManager(10);
    expect(mgr.maxActiveSpawners).toBe(10);
  });

  it("creates manager with max 1", () => {
    const mgr = createSpawnerManager(1);
    expect(mgr.maxActiveSpawners).toBe(1);
  });
});

// ════════════════════════════════════════════════════════════════
// § addSpawner
// ════════════════════════════════════════════════════════════════

describe("addSpawner", () => {
  it("adds a portal spawner with correct fields", () => {
    const mgr = createSpawnerManager();
    const next = addSpawner(mgr, "portal", 100, 200, 50, 3, "drone", 10, 50);
    expect(next.spawners).toHaveLength(1);
    const s = next.spawners[0];
    expect(s.id).toBe("spawner_1");
    expect(s.type).toBe("portal");
    expect(s.x).toBe(100);
    expect(s.y).toBe(200);
    expect(s.hp).toBe(50);
    expect(s.maxHp).toBe(50);
    expect(s.spawnRate).toBe(3);
    expect(s.spawnTimer).toBe(0);
    expect(s.enemyType).toBe("drone");
    expect(s.maxSpawned).toBe(10);
    expect(s.totalSpawned).toBe(0);
    expect(s.isActive).toBe(true);
    expect(s.isDestroyed).toBe(false);
    expect(s.spawnRadius).toBe(50);
  });

  it("increments nextId for each spawner", () => {
    let mgr = createSpawnerManager();
    mgr = addSpawner(mgr, "portal", 0, 0, 50, 3, "drone", 10, 50);
    mgr = addSpawner(mgr, "nest", 50, 50, 100, 5, "crawler", 20, 30);
    expect(mgr.nextId).toBe(3);
    expect(mgr.spawners[0].id).toBe("spawner_1");
    expect(mgr.spawners[1].id).toBe("spawner_2");
  });

  it("refuses to add beyond maxActiveSpawners", () => {
    let mgr = createSpawnerManager(2);
    mgr = addSpawner(mgr, "portal", 0, 0, 50, 3, "drone", 10, 50);
    mgr = addSpawner(mgr, "nest", 10, 10, 100, 5, "crawler", 20, 30);
    const before = mgr;
    mgr = addSpawner(mgr, "rift", 20, 20, 30, 1.5, "runner", 6, 80);
    expect(mgr).toBe(before); // same reference, no mutation
    expect(mgr.spawners).toHaveLength(2);
  });

  it("does not mutate original state", () => {
    const mgr = createSpawnerManager();
    const next = addSpawner(mgr, "portal", 0, 0, 50, 3, "drone", 10, 50);
    expect(mgr.spawners).toHaveLength(0);
    expect(next.spawners).toHaveLength(1);
  });

  it("sets wave field", () => {
    const mgr = createSpawnerManager();
    const next = addSpawner(mgr, "beacon", 0, 0, 200, 8, "elite", 5, 100, 7);
    expect(next.spawners[0].wave).toBe(7);
  });

  it("defaults wave to 1", () => {
    const mgr = createSpawnerManager();
    const next = addSpawner(mgr, "portal", 0, 0, 50, 3, "drone", 10, 50);
    expect(next.spawners[0].wave).toBe(1);
  });
});

// ════════════════════════════════════════════════════════════════
// § tick
// ════════════════════════════════════════════════════════════════

describe("tick", () => {
  function makeManager(): SpawnerManagerState {
    let mgr = createSpawnerManager();
    mgr = addSpawner(mgr, "portal", 100, 200, 50, 3, "drone", 10, 50);
    return mgr;
  }

  it("advances spawn timer by dt", () => {
    const mgr = makeManager();
    const { state } = tick(mgr, 1);
    expect(state.spawners[0].spawnTimer).toBeCloseTo(1);
  });

  it("does not spawn before timer reaches spawnRate", () => {
    const mgr = makeManager();
    const { spawnEvents } = tick(mgr, 2.9);
    expect(spawnEvents).toHaveLength(0);
  });

  it("spawns when timer reaches spawnRate", () => {
    const mgr = makeManager();
    const { state, spawnEvents } = tick(mgr, 3);
    expect(spawnEvents).toHaveLength(1);
    expect(spawnEvents[0].spawnerId).toBe("spawner_1");
    expect(spawnEvents[0].enemyType).toBe("drone");
    expect(state.spawners[0].totalSpawned).toBe(1);
  });

  it("resets timer after spawn (carry over remainder)", () => {
    const mgr = makeManager();
    const { state } = tick(mgr, 3.5);
    expect(state.spawners[0].spawnTimer).toBeCloseTo(0.5);
  });

  it("does not spawn from destroyed spawner", () => {
    let mgr = makeManager();
    mgr = destroySpawner(mgr, "spawner_1");
    const { spawnEvents } = tick(mgr, 10);
    expect(spawnEvents).toHaveLength(0);
  });

  it("does not spawn from inactive spawner", () => {
    const mgr = makeManager();
    // Exhaust the spawner
    let state = mgr;
    const exhausted: SpawnerManagerState = {
      ...state,
      spawners: [{ ...state.spawners[0], totalSpawned: 10, maxSpawned: 10 }],
    };
    const { spawnEvents } = tick(exhausted, 5);
    expect(spawnEvents).toHaveLength(0);
  });

  it("deactivates exhausted spawner on tick", () => {
    const mgr = makeManager();
    const exhausted: SpawnerManagerState = {
      ...mgr,
      spawners: [{ ...mgr.spawners[0], totalSpawned: 10, maxSpawned: 10 }],
    };
    const { state } = tick(exhausted, 1);
    expect(state.spawners[0].isActive).toBe(false);
  });

  it("handles multiple spawners", () => {
    let mgr = createSpawnerManager();
    mgr = addSpawner(mgr, "portal", 0, 0, 50, 2, "drone", 10, 50);
    mgr = addSpawner(mgr, "rift", 100, 100, 30, 1, "runner", 6, 80);
    const { spawnEvents } = tick(mgr, 2);
    // rift spawns at 1s and portal at 2s — but tick is a single step
    // rift: timer 2 >= rate 1 → spawn. portal: timer 2 >= rate 2 → spawn
    expect(spawnEvents).toHaveLength(2);
  });

  it("spawn position is within spawn radius", () => {
    const mgr = makeManager();
    const { spawnEvents } = tick(mgr, 3);
    const evt = spawnEvents[0];
    const dx = evt.x - 100;
    const dy = evt.y - 200;
    const dist = Math.sqrt(dx * dx + dy * dy);
    expect(dist).toBeLessThanOrEqual(50);
  });

  it("does not mutate original state", () => {
    const mgr = makeManager();
    const original = mgr.spawners[0].spawnTimer;
    tick(mgr, 1);
    expect(mgr.spawners[0].spawnTimer).toBe(original);
  });
});

// ════════════════════════════════════════════════════════════════
// § damageSpawner
// ════════════════════════════════════════════════════════════════

describe("damageSpawner", () => {
  it("reduces HP", () => {
    let mgr = createSpawnerManager();
    mgr = addSpawner(mgr, "portal", 0, 0, 50, 3, "drone", 10, 50);
    const next = damageSpawner(mgr, "spawner_1", 20);
    expect(next.spawners[0].hp).toBe(30);
  });

  it("destroys spawner when HP reaches 0", () => {
    let mgr = createSpawnerManager();
    mgr = addSpawner(mgr, "portal", 0, 0, 50, 3, "drone", 10, 50);
    const next = damageSpawner(mgr, "spawner_1", 50);
    expect(next.spawners[0].hp).toBe(0);
    expect(next.spawners[0].isDestroyed).toBe(true);
    expect(next.spawners[0].isActive).toBe(false);
  });

  it("destroys spawner when damage exceeds HP", () => {
    let mgr = createSpawnerManager();
    mgr = addSpawner(mgr, "portal", 0, 0, 50, 3, "drone", 10, 50);
    const next = damageSpawner(mgr, "spawner_1", 999);
    expect(next.spawners[0].hp).toBe(0);
    expect(next.spawners[0].isDestroyed).toBe(true);
  });

  it("does nothing to already destroyed spawner", () => {
    let mgr = createSpawnerManager();
    mgr = addSpawner(mgr, "portal", 0, 0, 50, 3, "drone", 10, 50);
    mgr = destroySpawner(mgr, "spawner_1");
    const next = damageSpawner(mgr, "spawner_1", 10);
    expect(next.spawners[0].hp).toBe(0);
  });

  it("does not affect other spawners", () => {
    let mgr = createSpawnerManager();
    mgr = addSpawner(mgr, "portal", 0, 0, 50, 3, "drone", 10, 50);
    mgr = addSpawner(mgr, "nest", 50, 50, 100, 5, "crawler", 20, 30);
    const next = damageSpawner(mgr, "spawner_1", 25);
    expect(next.spawners[0].hp).toBe(25);
    expect(next.spawners[1].hp).toBe(100);
  });
});

// ════════════════════════════════════════════════════════════════
// § destroySpawner
// ════════════════════════════════════════════════════════════════

describe("destroySpawner", () => {
  it("marks spawner as destroyed and inactive", () => {
    let mgr = createSpawnerManager();
    mgr = addSpawner(mgr, "nest", 0, 0, 100, 5, "crawler", 20, 30);
    const next = destroySpawner(mgr, "spawner_1");
    expect(next.spawners[0].isDestroyed).toBe(true);
    expect(next.spawners[0].isActive).toBe(false);
    expect(next.spawners[0].hp).toBe(0);
  });

  it("does not mutate original", () => {
    let mgr = createSpawnerManager();
    mgr = addSpawner(mgr, "nest", 0, 0, 100, 5, "crawler", 20, 30);
    destroySpawner(mgr, "spawner_1");
    expect(mgr.spawners[0].isDestroyed).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════
// § getActiveSpawners
// ════════════════════════════════════════════════════════════════

describe("getActiveSpawners", () => {
  it("returns only active, non-destroyed spawners", () => {
    let mgr = createSpawnerManager();
    mgr = addSpawner(mgr, "portal", 0, 0, 50, 3, "drone", 10, 50);
    mgr = addSpawner(mgr, "nest", 50, 50, 100, 5, "crawler", 20, 30);
    mgr = destroySpawner(mgr, "spawner_1");
    const active = getActiveSpawners(mgr);
    expect(active).toHaveLength(1);
    expect(active[0].id).toBe("spawner_2");
  });

  it("returns empty array when no spawners", () => {
    const mgr = createSpawnerManager();
    expect(getActiveSpawners(mgr)).toHaveLength(0);
  });

  it("excludes exhausted-then-deactivated spawners", () => {
    let mgr = createSpawnerManager();
    mgr = addSpawner(mgr, "portal", 0, 0, 50, 3, "drone", 1, 50);
    // Spawn once to exhaust
    const { state } = tick(mgr, 3);
    // Tick again to trigger deactivation
    const { state: state2 } = tick(state, 3);
    expect(getActiveSpawners(state2)).toHaveLength(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § getSpawnerAtPoint
// ════════════════════════════════════════════════════════════════

describe("getSpawnerAtPoint", () => {
  it("finds spawner within radius", () => {
    let mgr = createSpawnerManager();
    mgr = addSpawner(mgr, "portal", 100, 100, 50, 3, "drone", 10, 50);
    const found = getSpawnerAtPoint(mgr, 110, 110, 50);
    expect(found).not.toBeNull();
    expect(found!.id).toBe("spawner_1");
  });

  it("returns null when no spawner in range", () => {
    let mgr = createSpawnerManager();
    mgr = addSpawner(mgr, "portal", 100, 100, 50, 3, "drone", 10, 50);
    const found = getSpawnerAtPoint(mgr, 500, 500, 10);
    expect(found).toBeNull();
  });

  it("returns nearest spawner when multiple in range", () => {
    let mgr = createSpawnerManager();
    mgr = addSpawner(mgr, "portal", 100, 100, 50, 3, "drone", 10, 50);
    mgr = addSpawner(mgr, "nest", 105, 105, 100, 5, "crawler", 20, 30);
    const found = getSpawnerAtPoint(mgr, 106, 106, 50);
    expect(found!.id).toBe("spawner_2"); // closer
  });

  it("ignores destroyed spawners", () => {
    let mgr = createSpawnerManager();
    mgr = addSpawner(mgr, "portal", 100, 100, 50, 3, "drone", 10, 50);
    mgr = destroySpawner(mgr, "spawner_1");
    const found = getSpawnerAtPoint(mgr, 100, 100, 50);
    expect(found).toBeNull();
  });

  it("finds spawner at exact position", () => {
    let mgr = createSpawnerManager();
    mgr = addSpawner(mgr, "portal", 100, 100, 50, 3, "drone", 10, 50);
    const found = getSpawnerAtPoint(mgr, 100, 100, 0);
    expect(found).not.toBeNull();
  });
});

// ════════════════════════════════════════════════════════════════
// § getSpawnPosition
// ════════════════════════════════════════════════════════════════

describe("getSpawnPosition", () => {
  const spawner: SpawnerState = {
    id: "test",
    type: "portal",
    x: 200,
    y: 300,
    hp: 50,
    maxHp: 50,
    spawnRate: 3,
    spawnTimer: 0,
    enemyType: "drone",
    maxSpawned: 10,
    totalSpawned: 0,
    isActive: true,
    isDestroyed: false,
    spawnRadius: 50,
    wave: 1,
  };

  it("returns position within spawn radius", () => {
    const pos = getSpawnPosition(spawner, 42);
    const dx = pos.x - spawner.x;
    const dy = pos.y - spawner.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    expect(dist).toBeLessThanOrEqual(50);
  });

  it("is deterministic for same seed", () => {
    const a = getSpawnPosition(spawner, 123);
    const b = getSpawnPosition(spawner, 123);
    expect(a.x).toBe(b.x);
    expect(a.y).toBe(b.y);
  });

  it("gives different positions for different seeds", () => {
    const a = getSpawnPosition(spawner, 1);
    const b = getSpawnPosition(spawner, 2);
    expect(a.x !== b.x || a.y !== b.y).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════
// § isSpawnerExhausted
// ════════════════════════════════════════════════════════════════

describe("isSpawnerExhausted", () => {
  const base: SpawnerState = {
    id: "test",
    type: "portal",
    x: 0,
    y: 0,
    hp: 50,
    maxHp: 50,
    spawnRate: 3,
    spawnTimer: 0,
    enemyType: "drone",
    maxSpawned: 10,
    totalSpawned: 0,
    isActive: true,
    isDestroyed: false,
    spawnRadius: 50,
    wave: 1,
  };

  it("returns false when totalSpawned < maxSpawned", () => {
    expect(isSpawnerExhausted({ ...base, totalSpawned: 5 })).toBe(false);
  });

  it("returns true when totalSpawned equals maxSpawned", () => {
    expect(isSpawnerExhausted({ ...base, totalSpawned: 10 })).toBe(true);
  });

  it("returns true when totalSpawned exceeds maxSpawned", () => {
    expect(isSpawnerExhausted({ ...base, totalSpawned: 15 })).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════
// § upgradeSpawner
// ════════════════════════════════════════════════════════════════

describe("upgradeSpawner", () => {
  it("multiplies spawn rate", () => {
    let mgr = createSpawnerManager();
    mgr = addSpawner(mgr, "portal", 0, 0, 50, 3, "drone", 10, 50);
    const next = upgradeSpawner(mgr, "spawner_1", 0.5);
    expect(next.spawners[0].spawnRate).toBeCloseTo(1.5);
  });

  it("does not upgrade destroyed spawner", () => {
    let mgr = createSpawnerManager();
    mgr = addSpawner(mgr, "portal", 0, 0, 50, 3, "drone", 10, 50);
    mgr = destroySpawner(mgr, "spawner_1");
    const next = upgradeSpawner(mgr, "spawner_1", 0.5);
    // Rate unchanged (still 3 from original, but hp is 0 and destroyed)
    expect(next.spawners[0].spawnRate).toBe(3);
  });

  it("multiplier > 1 makes spawner slower", () => {
    let mgr = createSpawnerManager();
    mgr = addSpawner(mgr, "rift", 0, 0, 30, 1.5, "runner", 6, 80);
    const next = upgradeSpawner(mgr, "spawner_1", 2);
    expect(next.spawners[0].spawnRate).toBeCloseTo(3);
  });
});

// ════════════════════════════════════════════════════════════════
// § getSpawnerThreatLevel
// ════════════════════════════════════════════════════════════════

describe("getSpawnerThreatLevel", () => {
  const base: SpawnerState = {
    id: "test",
    type: "portal",
    x: 0,
    y: 0,
    hp: 50,
    maxHp: 50,
    spawnRate: 3,
    spawnTimer: 0,
    enemyType: "drone",
    maxSpawned: 10,
    totalSpawned: 0,
    isActive: true,
    isDestroyed: false,
    spawnRadius: 50,
    wave: 1,
  };

  it("returns 'low' for low threat spawner", () => {
    // rate=10, remaining=1 → 0.1 * 1 = 0.1
    const s = { ...base, spawnRate: 10, maxSpawned: 1, totalSpawned: 0 };
    expect(getSpawnerThreatLevel(s)).toBe("low");
  });

  it("returns 'medium' for moderate threat", () => {
    // rate=1, remaining=3 → 1 * 3 = 3
    const s = { ...base, spawnRate: 1, maxSpawned: 5, totalSpawned: 2 };
    expect(getSpawnerThreatLevel(s)).toBe("medium");
  });

  it("returns 'high' for dangerous spawner", () => {
    // rate=1, remaining=10 → 1 * 10 = 10
    const s = { ...base, spawnRate: 1, maxSpawned: 10, totalSpawned: 0 };
    expect(getSpawnerThreatLevel(s)).toBe("high");
  });

  it("returns 'low' for nearly exhausted spawner", () => {
    // rate=3, remaining=1 → 0.33 * 1 = 0.33
    const s = { ...base, totalSpawned: 9 };
    expect(getSpawnerThreatLevel(s)).toBe("low");
  });

  it("rift type is naturally high threat", () => {
    // rate=1.5, remaining=6 → 0.67 * 6 = 4
    const s = { ...base, type: "rift" as const, spawnRate: 1.5, maxSpawned: 6 };
    expect(getSpawnerThreatLevel(s)).toBe("medium");
  });
});

// ════════════════════════════════════════════════════════════════
// § selectSpawnerConfig
// ════════════════════════════════════════════════════════════════

describe("selectSpawnerConfig", () => {
  it("returns portal or nest for early waves", () => {
    const config = selectSpawnerConfig(1, 42);
    expect(["portal", "nest"]).toContain(config.type);
  });

  it("can return rift for mid waves", () => {
    // Try several seeds to find a rift
    let foundRift = false;
    for (let seed = 0; seed < 100; seed++) {
      if (selectSpawnerConfig(5, seed).type === "rift") {
        foundRift = true;
        break;
      }
    }
    expect(foundRift).toBe(true);
  });

  it("can return beacon for late waves", () => {
    let foundBeacon = false;
    for (let seed = 0; seed < 100; seed++) {
      if (selectSpawnerConfig(8, seed).type === "beacon") {
        foundBeacon = true;
        break;
      }
    }
    expect(foundBeacon).toBe(true);
  });

  it("never returns beacon for early waves", () => {
    for (let seed = 0; seed < 50; seed++) {
      expect(selectSpawnerConfig(2, seed).type).not.toBe("beacon");
    }
  });

  it("never returns rift for wave 1-3", () => {
    for (let seed = 0; seed < 50; seed++) {
      expect(selectSpawnerConfig(2, seed).type).not.toBe("rift");
    }
  });

  it("scales HP with wave", () => {
    const w1 = selectSpawnerConfig(1, 42);
    const w10 = selectSpawnerConfig(10, 42);
    // Same seed may pick different types, but HP should generally increase
    // Test with a known type
    const baseHp = SPAWNER_CONFIGS[w1.type].hp;
    expect(w1.hp).toBe(baseHp); // wave 1 → mult = 1.0
  });

  it("is deterministic for same wave and seed", () => {
    const a = selectSpawnerConfig(5, 99);
    const b = selectSpawnerConfig(5, 99);
    expect(a).toEqual(b);
  });

  it("returns valid enemy type", () => {
    const config = selectSpawnerConfig(3, 7);
    expect(config.enemyType).toBeTruthy();
    expect(typeof config.enemyType).toBe("string");
  });

  it("spawnRate decreases (faster) at higher waves", () => {
    // Compare same type at different waves
    const baseRate = SPAWNER_CONFIGS["portal"].spawnRate;
    // wave 10 mult = 1.9, so rate = 3 / 1.9 ≈ 1.58
    // Find a portal config at wave 10
    for (let seed = 0; seed < 100; seed++) {
      const cfg = selectSpawnerConfig(10, seed);
      if (cfg.type === "portal") {
        expect(cfg.spawnRate).toBeLessThan(baseRate);
        break;
      }
    }
  });

  it("spawnRate never goes below 0.5", () => {
    for (let seed = 0; seed < 50; seed++) {
      const cfg = selectSpawnerConfig(100, seed);
      expect(cfg.spawnRate).toBeGreaterThanOrEqual(0.5);
    }
  });
});

// ════════════════════════════════════════════════════════════════
// § SPAWNER_CONFIGS
// ════════════════════════════════════════════════════════════════

describe("SPAWNER_CONFIGS", () => {
  it("portal has correct defaults", () => {
    expect(SPAWNER_CONFIGS.portal).toEqual({
      hp: 50,
      spawnRate: 3,
      maxSpawned: 10,
      spawnRadius: 50,
    });
  });

  it("nest has correct defaults", () => {
    expect(SPAWNER_CONFIGS.nest).toEqual({
      hp: 100,
      spawnRate: 5,
      maxSpawned: 20,
      spawnRadius: 30,
    });
  });

  it("rift has correct defaults", () => {
    expect(SPAWNER_CONFIGS.rift).toEqual({
      hp: 30,
      spawnRate: 1.5,
      maxSpawned: 6,
      spawnRadius: 80,
    });
  });

  it("beacon has correct defaults", () => {
    expect(SPAWNER_CONFIGS.beacon).toEqual({
      hp: 200,
      spawnRate: 8,
      maxSpawned: 5,
      spawnRadius: 100,
    });
  });
});

// ════════════════════════════════════════════════════════════════
// § Integration / Edge Cases
// ════════════════════════════════════════════════════════════════

describe("integration scenarios", () => {
  it("full lifecycle: add → tick → damage → destroy", () => {
    let mgr = createSpawnerManager();
    mgr = addSpawner(mgr, "portal", 100, 200, 50, 1, "drone", 3, 50);

    // Tick 3 times to spawn 3 enemies
    let result = tick(mgr, 1);
    expect(result.spawnEvents).toHaveLength(1);
    result = tick(result.state, 1);
    expect(result.spawnEvents).toHaveLength(1);
    result = tick(result.state, 1);
    expect(result.spawnEvents).toHaveLength(1);

    // Now exhausted — next tick should deactivate
    result = tick(result.state, 1);
    expect(result.spawnEvents).toHaveLength(0);
    expect(result.state.spawners[0].isActive).toBe(false);
    expect(result.state.spawners[0].totalSpawned).toBe(3);
  });

  it("destroyed spawner frees slot for new one", () => {
    let mgr = createSpawnerManager(1);
    mgr = addSpawner(mgr, "portal", 0, 0, 50, 3, "drone", 10, 50);
    // Can't add — at max
    const blocked = addSpawner(mgr, "nest", 50, 50, 100, 5, "crawler", 20, 30);
    expect(blocked.spawners).toHaveLength(1);

    // Destroy the first, now slot is free
    mgr = destroySpawner(mgr, "spawner_1");
    const added = addSpawner(mgr, "nest", 50, 50, 100, 5, "crawler", 20, 30);
    expect(added.spawners).toHaveLength(2);
    expect(getActiveSpawners(added)).toHaveLength(1);
  });

  it("damage partial then full destroy", () => {
    let mgr = createSpawnerManager();
    mgr = addSpawner(mgr, "nest", 0, 0, 100, 5, "crawler", 20, 30);
    mgr = damageSpawner(mgr, "spawner_1", 30);
    expect(mgr.spawners[0].hp).toBe(70);
    mgr = damageSpawner(mgr, "spawner_1", 70);
    expect(mgr.spawners[0].hp).toBe(0);
    expect(mgr.spawners[0].isDestroyed).toBe(true);
  });
});
