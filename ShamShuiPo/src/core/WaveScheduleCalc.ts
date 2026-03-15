// ── WaveScheduleCalc.ts ─────────────────────────────────────────
// Pure TypeScript wave scheduling for Neon Survivors.
// NO Phaser imports. All functions are pure & immutable.
// ────────────────────────────────────────────────────────────────

// ── Types ──────────────────────────────────────────────────────

export interface WaveEntry {
  readonly enemyType: string;
  readonly count: number;
  readonly spawnDelay: number;
  readonly formation?: string;
}

export interface WaveConfig {
  readonly waveNumber: number;
  readonly entries: readonly WaveEntry[];
  readonly duration: number;
  readonly breakDuration: number;
  readonly isBossWave: boolean;
  readonly bossId?: string;
  readonly difficulty: number;
}

export interface WaveScheduleState {
  readonly waves: readonly WaveConfig[];
  readonly currentWave: number;
  readonly waveTimer: number;
  readonly breakTimer: number;
  readonly isInBreak: boolean;
  readonly isComplete: boolean;
  readonly totalEnemiesSpawned: number;
}

export interface TickResult {
  readonly state: WaveScheduleState;
  readonly spawnEvents: readonly WaveEntry[] | null;
  readonly waveStarted: boolean;
  readonly waveEnded: boolean;
}

// ── PRNG ───────────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Constants ──────────────────────────────────────────────────

const ENEMY_TYPES = [
  "drone",
  "grunt",
  "tank",
  "sniper",
  "swarm",
  "elite",
] as const;
const FORMATIONS = ["line", "circle", "random", "vee", "cluster"] as const;

const BREAK_NORMAL = 5;
const BREAK_BOSS = 8;

const MINI_BOSS_WAVE = 5;
const FINAL_BOSS_WAVE = 10;

// ── Helpers ────────────────────────────────────────────────────

function pickRandom<T>(arr: readonly T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function pickN<T>(arr: readonly T[], n: number, rng: () => number): T[] {
  const shuffled = [...arr].sort(() => rng() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

// ── Wave tier config ───────────────────────────────────────────

interface WaveTier {
  readonly minTypes: number;
  readonly maxTypes: number;
  readonly minEnemies: number;
  readonly maxEnemies: number;
}

function getWaveTier(waveNumber: number): WaveTier {
  if (waveNumber <= 3)
    return { minTypes: 1, maxTypes: 2, minEnemies: 10, maxEnemies: 20 };
  if (waveNumber <= 6)
    return { minTypes: 2, maxTypes: 3, minEnemies: 20, maxEnemies: 35 };
  return { minTypes: 3, maxTypes: 4, minEnemies: 30, maxEnemies: 50 };
}

// ── Public API ─────────────────────────────────────────────────

/** Difficulty multiplier curve: gentle ramp from 1.0 to ~3.0 */
export function getDifficultyRamp(waveNumber: number): number {
  const clamped = Math.max(1, waveNumber);
  return 1 + (clamped - 1) * 0.22;
}

/** Procedurally generate a single wave config. */
export function generateWave(waveNumber: number, seed: number): WaveConfig {
  const rng = mulberry32(seed + waveNumber * 7919);
  const tier = getWaveTier(waveNumber);

  const isBoss = waveNumber === FINAL_BOSS_WAVE;
  const isMiniBoss = waveNumber === MINI_BOSS_WAVE;

  const typeCount =
    tier.minTypes + Math.floor(rng() * (tier.maxTypes - tier.minTypes + 1));
  const totalEnemies =
    tier.minEnemies +
    Math.floor(rng() * (tier.maxEnemies - tier.minEnemies + 1));

  const selectedTypes = pickN(ENEMY_TYPES, typeCount, rng);

  // Distribute enemies among types
  const entries: WaveEntry[] = [];
  let remaining = totalEnemies;

  for (let i = 0; i < selectedTypes.length; i++) {
    const isLast = i === selectedTypes.length - 1;
    const share = isLast
      ? remaining
      : Math.max(
          1,
          Math.floor((remaining / (selectedTypes.length - i)) * (0.5 + rng())),
        );
    const count = Math.min(share, remaining);
    remaining -= count;

    entries.push({
      enemyType: selectedTypes[i],
      count,
      spawnDelay: lerp(0.3, 1.2, rng()),
      formation: pickRandom(FORMATIONS, rng),
    });
  }

  // Ensure no zero-count entries (give remaining to last)
  if (remaining > 0 && entries.length > 0) {
    const last = entries[entries.length - 1];
    entries[entries.length - 1] = { ...last, count: last.count + remaining };
  }

  const difficulty = getDifficultyRamp(waveNumber);
  const baseDuration = estimateWaveDurationFromEntries(entries);
  const duration = Math.max(15, baseDuration + 5);

  const breakDuration = isBoss || isMiniBoss ? BREAK_BOSS : BREAK_NORMAL;

  let bossId: string | undefined;
  if (isBoss) bossId = "boss_final";
  else if (isMiniBoss) bossId = "boss_mini";

  return {
    waveNumber,
    entries,
    duration,
    breakDuration,
    isBossWave: isBoss || isMiniBoss,
    bossId,
    difficulty,
  };
}

/** Generate the full wave schedule. */
export function createWaveSchedule(totalWaves: number = 10): WaveScheduleState {
  const baseSeed = 42;
  const waves: WaveConfig[] = [];

  for (let i = 1; i <= totalWaves; i++) {
    waves.push(generateWave(i, baseSeed));
  }

  return {
    waves,
    currentWave: 0,
    waveTimer: 0,
    breakTimer: 0,
    isInBreak: false,
    isComplete: false,
    totalEnemiesSpawned: 0,
  };
}

/** Get the current wave config. Returns undefined if schedule is complete or not started. */
export function getCurrentWave(
  state: WaveScheduleState,
): WaveConfig | undefined {
  if (state.currentWave < 0 || state.currentWave >= state.waves.length)
    return undefined;
  return state.waves[state.currentWave];
}

/** Progress ratio: currentWave / totalWaves (0 to 1). */
export function getWaveProgress(state: WaveScheduleState): number {
  if (state.waves.length === 0) return 0;
  return Math.min(1, (state.currentWave + 1) / state.waves.length);
}

/** Seconds remaining in current wave or break. */
export function getTimeRemaining(state: WaveScheduleState): number {
  if (state.isComplete) return 0;
  const wave = getCurrentWave(state);
  if (!wave) return 0;

  if (state.isInBreak) {
    return Math.max(0, wave.breakDuration - state.breakTimer);
  }
  return Math.max(0, wave.duration - state.waveTimer);
}

/** True if a wave is actively running (not in break, not complete). */
export function isWaveActive(state: WaveScheduleState): boolean {
  return (
    !state.isInBreak &&
    !state.isComplete &&
    state.currentWave < state.waves.length
  );
}

/** True if the current wave is a boss wave. */
export function isBossWave(state: WaveScheduleState): boolean {
  const wave = getCurrentWave(state);
  return wave?.isBossWave ?? false;
}

/** Skip the current break timer. Returns new state. */
export function skipBreak(state: WaveScheduleState): WaveScheduleState {
  if (!state.isInBreak) return state;

  const wave = getCurrentWave(state);
  if (!wave) return state;

  return {
    ...state,
    breakTimer: wave.breakDuration,
  };
}

/** Enemy composition summary: { enemyType: totalCount }. */
export function getEnemyComposition(
  waveConfig: WaveConfig,
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const entry of waveConfig.entries) {
    result[entry.enemyType] = (result[entry.enemyType] ?? 0) + entry.count;
  }
  return result;
}

/** Total enemy count across all entries in a wave. */
export function getTotalEnemies(waveConfig: WaveConfig): number {
  return waveConfig.entries.reduce((sum, e) => sum + e.count, 0);
}

/** Estimate wave duration based on enemy count and spawn delays. */
export function estimateWaveDuration(waveConfig: WaveConfig): number {
  return estimateWaveDurationFromEntries([...waveConfig.entries]);
}

function estimateWaveDurationFromEntries(
  entries: readonly WaveEntry[],
): number {
  let total = 0;
  for (const entry of entries) {
    total += entry.count * entry.spawnDelay;
  }
  return Math.ceil(total);
}

/** Advance wave/break timers. Returns new state + events. */
export function tick(state: WaveScheduleState, dt: number): TickResult {
  if (state.isComplete) {
    return { state, spawnEvents: null, waveStarted: false, waveEnded: false };
  }

  // ── First tick: start wave 0 ──
  if (state.currentWave === 0 && state.waveTimer === 0 && !state.isInBreak) {
    const wave = getCurrentWave(state);
    if (!wave) {
      return {
        state: { ...state, isComplete: true },
        spawnEvents: null,
        waveStarted: false,
        waveEnded: false,
      };
    }

    const spawnEvents = [...wave.entries];
    const totalSpawned = state.totalEnemiesSpawned + getTotalEnemies(wave);

    return {
      state: { ...state, waveTimer: dt, totalEnemiesSpawned: totalSpawned },
      spawnEvents,
      waveStarted: true,
      waveEnded: false,
    };
  }

  // ── In break: count down ──
  if (state.isInBreak) {
    const wave = getCurrentWave(state);
    if (!wave) {
      return {
        state: { ...state, isComplete: true },
        spawnEvents: null,
        waveStarted: false,
        waveEnded: false,
      };
    }

    const newBreakTimer = state.breakTimer + dt;

    if (newBreakTimer >= wave.breakDuration) {
      // Break ended — move to next wave
      const nextWave = state.currentWave + 1;

      if (nextWave >= state.waves.length) {
        return {
          state: {
            ...state,
            isComplete: true,
            isInBreak: false,
            breakTimer: newBreakTimer,
          },
          spawnEvents: null,
          waveStarted: false,
          waveEnded: false,
        };
      }

      const nextWaveConfig = state.waves[nextWave];
      const spawnEvents = [...nextWaveConfig.entries];
      const totalSpawned =
        state.totalEnemiesSpawned + getTotalEnemies(nextWaveConfig);

      return {
        state: {
          ...state,
          currentWave: nextWave,
          waveTimer: 0,
          breakTimer: 0,
          isInBreak: false,
          totalEnemiesSpawned: totalSpawned,
        },
        spawnEvents,
        waveStarted: true,
        waveEnded: false,
      };
    }

    return {
      state: { ...state, breakTimer: newBreakTimer },
      spawnEvents: null,
      waveStarted: false,
      waveEnded: false,
    };
  }

  // ── Active wave: count timer ──
  const wave = getCurrentWave(state);
  if (!wave) {
    return {
      state: { ...state, isComplete: true },
      spawnEvents: null,
      waveStarted: false,
      waveEnded: false,
    };
  }

  const newWaveTimer = state.waveTimer + dt;

  if (newWaveTimer >= wave.duration) {
    // Wave ended — enter break
    return {
      state: {
        ...state,
        waveTimer: newWaveTimer,
        isInBreak: true,
        breakTimer: 0,
      },
      spawnEvents: null,
      waveStarted: false,
      waveEnded: true,
    };
  }

  return {
    state: { ...state, waveTimer: newWaveTimer },
    spawnEvents: null,
    waveStarted: false,
    waveEnded: false,
  };
}
