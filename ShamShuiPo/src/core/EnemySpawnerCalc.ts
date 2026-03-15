// ── Neon Survivors: Enemy Spawner Calculations ──
// Pure TypeScript — NO Phaser imports. Immutable state transitions.

// ════════════════════════════════════════════════════════════════
// § PRNG
// ════════════════════════════════════════════════════════════════

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ════════════════════════════════════════════════════════════════
// § TYPES
// ════════════════════════════════════════════════════════════════

export type SpawnerType = "portal" | "nest" | "rift" | "beacon";

export type ThreatLevel = "low" | "medium" | "high";

export interface SpawnerState {
  readonly id: string;
  readonly type: SpawnerType;
  readonly x: number;
  readonly y: number;
  readonly hp: number;
  readonly maxHp: number;
  readonly spawnRate: number;
  readonly spawnTimer: number;
  readonly enemyType: string;
  readonly maxSpawned: number;
  readonly totalSpawned: number;
  readonly isActive: boolean;
  readonly isDestroyed: boolean;
  readonly spawnRadius: number;
  readonly wave: number;
}

export interface SpawnerManagerState {
  readonly spawners: readonly SpawnerState[];
  readonly nextId: number;
  readonly maxActiveSpawners: number;
}

export interface SpawnEvent {
  readonly spawnerId: string;
  readonly enemyType: string;
  readonly x: number;
  readonly y: number;
}

export interface TickResult {
  readonly state: SpawnerManagerState;
  readonly spawnEvents: readonly SpawnEvent[];
}

// ════════════════════════════════════════════════════════════════
// § SPAWNER CONFIGS
// ════════════════════════════════════════════════════════════════

export interface SpawnerConfig {
  readonly hp: number;
  readonly spawnRate: number;
  readonly maxSpawned: number;
  readonly spawnRadius: number;
}

export const SPAWNER_CONFIGS: Record<SpawnerType, SpawnerConfig> = {
  portal: { hp: 50, spawnRate: 3, maxSpawned: 10, spawnRadius: 50 },
  nest: { hp: 100, spawnRate: 5, maxSpawned: 20, spawnRadius: 30 },
  rift: { hp: 30, spawnRate: 1.5, maxSpawned: 6, spawnRadius: 80 },
  beacon: { hp: 200, spawnRate: 8, maxSpawned: 5, spawnRadius: 100 },
} as const;

// ════════════════════════════════════════════════════════════════
// § MANAGER CREATION
// ════════════════════════════════════════════════════════════════

export function createSpawnerManager(
  maxActive: number = 5,
): SpawnerManagerState {
  return {
    spawners: [],
    nextId: 1,
    maxActiveSpawners: maxActive,
  };
}

// ════════════════════════════════════════════════════════════════
// § ADD SPAWNER
// ════════════════════════════════════════════════════════════════

export function addSpawner(
  state: SpawnerManagerState,
  type: SpawnerType,
  x: number,
  y: number,
  hp: number,
  spawnRate: number,
  enemyType: string,
  maxSpawned: number,
  spawnRadius: number,
  wave: number = 1,
): SpawnerManagerState {
  const activeCount = getActiveSpawners(state).length;
  if (activeCount >= state.maxActiveSpawners) {
    return state;
  }

  const spawner: SpawnerState = {
    id: `spawner_${state.nextId}`,
    type,
    x,
    y,
    hp,
    maxHp: hp,
    spawnRate,
    spawnTimer: 0,
    enemyType,
    maxSpawned,
    totalSpawned: 0,
    isActive: true,
    isDestroyed: false,
    spawnRadius,
    wave,
  };

  return {
    ...state,
    spawners: [...state.spawners, spawner],
    nextId: state.nextId + 1,
  };
}

// ════════════════════════════════════════════════════════════════
// § TICK
// ════════════════════════════════════════════════════════════════

export function tick(state: SpawnerManagerState, dt: number): TickResult {
  const spawnEvents: SpawnEvent[] = [];
  let seedCounter = 0;

  const updatedSpawners = state.spawners.map((spawner) => {
    if (!spawner.isActive || spawner.isDestroyed) {
      return spawner;
    }

    if (isSpawnerExhausted(spawner)) {
      return { ...spawner, isActive: false };
    }

    const newTimer = spawner.spawnTimer + dt;

    if (newTimer >= spawner.spawnRate) {
      const pos = getSpawnPosition(spawner, seedCounter++);
      spawnEvents.push({
        spawnerId: spawner.id,
        enemyType: spawner.enemyType,
        x: pos.x,
        y: pos.y,
      });

      return {
        ...spawner,
        spawnTimer: newTimer - spawner.spawnRate,
        totalSpawned: spawner.totalSpawned + 1,
      };
    }

    return { ...spawner, spawnTimer: newTimer };
  });

  return {
    state: { ...state, spawners: updatedSpawners },
    spawnEvents,
  };
}

// ════════════════════════════════════════════════════════════════
// § DAMAGE & DESTROY
// ════════════════════════════════════════════════════════════════

export function damageSpawner(
  state: SpawnerManagerState,
  id: string,
  damage: number,
): SpawnerManagerState {
  const updatedSpawners = state.spawners.map((spawner) => {
    if (spawner.id !== id || spawner.isDestroyed) {
      return spawner;
    }

    const newHp = spawner.hp - damage;
    if (newHp <= 0) {
      return { ...spawner, hp: 0, isActive: false, isDestroyed: true };
    }
    return { ...spawner, hp: newHp };
  });

  return { ...state, spawners: updatedSpawners };
}

export function destroySpawner(
  state: SpawnerManagerState,
  id: string,
): SpawnerManagerState {
  const updatedSpawners = state.spawners.map((spawner) => {
    if (spawner.id !== id) {
      return spawner;
    }
    return { ...spawner, hp: 0, isActive: false, isDestroyed: true };
  });

  return { ...state, spawners: updatedSpawners };
}

// ════════════════════════════════════════════════════════════════
// § QUERIES
// ════════════════════════════════════════════════════════════════

export function getActiveSpawners(
  state: SpawnerManagerState,
): readonly SpawnerState[] {
  return state.spawners.filter((s) => s.isActive && !s.isDestroyed);
}

export function getSpawnerAtPoint(
  state: SpawnerManagerState,
  px: number,
  py: number,
  radius: number,
): SpawnerState | null {
  let nearest: SpawnerState | null = null;
  let nearestDist = Infinity;

  for (const spawner of state.spawners) {
    if (spawner.isDestroyed) continue;

    const dx = spawner.x - px;
    const dy = spawner.y - py;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= radius && dist < nearestDist) {
      nearest = spawner;
      nearestDist = dist;
    }
  }

  return nearest;
}

// ════════════════════════════════════════════════════════════════
// § SPAWN POSITION
// ════════════════════════════════════════════════════════════════

export function getSpawnPosition(
  spawner: SpawnerState,
  seed: number,
): { x: number; y: number } {
  const rng = mulberry32(seed);
  const angle = rng() * Math.PI * 2;
  const distance = rng() * spawner.spawnRadius;

  return {
    x: spawner.x + Math.cos(angle) * distance,
    y: spawner.y + Math.sin(angle) * distance,
  };
}

// ════════════════════════════════════════════════════════════════
// § SPAWNER STATE CHECKS
// ════════════════════════════════════════════════════════════════

export function isSpawnerExhausted(spawner: SpawnerState): boolean {
  return spawner.totalSpawned >= spawner.maxSpawned;
}

// ════════════════════════════════════════════════════════════════
// § UPGRADE & SCALING
// ════════════════════════════════════════════════════════════════

export function upgradeSpawner(
  state: SpawnerManagerState,
  id: string,
  rateMultiplier: number,
): SpawnerManagerState {
  const updatedSpawners = state.spawners.map((spawner) => {
    if (spawner.id !== id || spawner.isDestroyed) {
      return spawner;
    }
    return { ...spawner, spawnRate: spawner.spawnRate * rateMultiplier };
  });

  return { ...state, spawners: updatedSpawners };
}

// ════════════════════════════════════════════════════════════════
// § THREAT ASSESSMENT
// ════════════════════════════════════════════════════════════════

export function getSpawnerThreatLevel(spawner: SpawnerState): ThreatLevel {
  const remainingSpawns = spawner.maxSpawned - spawner.totalSpawned;
  const spawnsPerSecond = 1 / spawner.spawnRate;

  // Threat score: higher spawn rate and more remaining = more dangerous
  const threatScore = spawnsPerSecond * remainingSpawns;

  if (threatScore >= 5) return "high";
  if (threatScore >= 2) return "medium";
  return "low";
}

// ════════════════════════════════════════════════════════════════
// § WAVE-BASED CONFIG SELECTION
// ════════════════════════════════════════════════════════════════

export interface WaveSpawnerConfig {
  readonly type: SpawnerType;
  readonly enemyType: string;
  readonly hp: number;
  readonly spawnRate: number;
  readonly maxSpawned: number;
  readonly spawnRadius: number;
}

const WAVE_ENEMY_POOL: readonly string[] = [
  "drone",
  "crawler",
  "runner",
  "tank",
  "sniper",
  "bomber",
  "elite_drone",
  "elite_tank",
];

export function selectSpawnerConfig(
  wave: number,
  seed: number,
): WaveSpawnerConfig {
  const rng = mulberry32(seed);

  // Wave determines which spawner types are available
  let availableTypes: SpawnerType[];
  if (wave <= 3) {
    availableTypes = ["portal", "nest"];
  } else if (wave <= 6) {
    availableTypes = ["portal", "nest", "rift"];
  } else {
    availableTypes = ["portal", "nest", "rift", "beacon"];
  }

  const typeIndex = Math.floor(rng() * availableTypes.length);
  const type = availableTypes[typeIndex];
  const baseConfig = SPAWNER_CONFIGS[type];

  // Scale difficulty with wave
  const waveMult = 1 + (wave - 1) * 0.1;
  const hp = Math.round(baseConfig.hp * waveMult);
  const spawnRate = Math.max(0.5, baseConfig.spawnRate / waveMult);
  const maxSpawned = Math.round(baseConfig.maxSpawned * waveMult);

  // Pick enemy type based on wave progression
  const maxEnemyIndex = Math.min(
    Math.floor(wave / 2) + 1,
    WAVE_ENEMY_POOL.length - 1,
  );
  const enemyIndex = Math.floor(rng() * (maxEnemyIndex + 1));
  const enemyType = WAVE_ENEMY_POOL[enemyIndex];

  return {
    type,
    enemyType,
    hp,
    spawnRate,
    maxSpawned,
    spawnRadius: baseConfig.spawnRadius,
  };
}
