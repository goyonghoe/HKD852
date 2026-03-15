/**
 * SummonCalc — Pure TypeScript summoned ally management
 * No Phaser imports. All functions are pure and return new state (immutable).
 */

// ── Types ──────────────────────────────────────────────────────────

export interface SummonConfig {
  readonly maxSummons: number;
  readonly baseDamage: number;
  readonly baseHP: number;
  readonly duration: number; // ms — 0 means permanent
  readonly attackSpeed: number; // attacks per second
  readonly moveSpeed: number; // pixels per second
}

export interface Summon {
  readonly id: string;
  readonly hp: number;
  readonly maxHp: number;
  readonly damage: number;
  readonly x: number;
  readonly y: number;
  readonly age: number; // ms
  readonly duration: number; // ms — 0 means permanent
  readonly active: boolean;
  readonly attackCooldown: number; // ms
}

export interface SummonState {
  readonly config: SummonConfig;
  readonly summons: readonly Summon[];
}

// ── Defaults ───────────────────────────────────────────────────────

const DEFAULT_CONFIG: SummonConfig = {
  maxSummons: 3,
  baseDamage: 10,
  baseHP: 30,
  duration: 10_000,
  attackSpeed: 1.0,
  moveSpeed: 100,
};

// ── ID Generator ───────────────────────────────────────────────────

let _nextId = 0;

function generateId(): string {
  return `summon_${++_nextId}`;
}

// ── Functions ──────────────────────────────────────────────────────

export function createSummonState(config?: Partial<SummonConfig>): SummonState {
  return {
    config: { ...DEFAULT_CONFIG, ...config },
    summons: [],
  };
}

export function spawnSummon(
  state: SummonState,
  x: number,
  y: number,
): SummonState {
  if (!canSpawn(state)) return state;

  const { config } = state;
  const summon: Summon = {
    id: generateId(),
    hp: config.baseHP,
    maxHp: config.baseHP,
    damage: config.baseDamage,
    x,
    y,
    age: 0,
    duration: config.duration,
    active: true,
    attackCooldown: 0,
  };

  return { ...state, summons: [...state.summons, summon] };
}

export function updateSummons(
  state: SummonState,
  deltaMs: number,
): SummonState {
  const updated = state.summons.map((s) => {
    if (!s.active) return s;

    const newAge = s.age + deltaMs;
    const newCooldown = Math.max(0, s.attackCooldown - deltaMs);
    const expired = s.duration > 0 && newAge >= s.duration;

    return {
      ...s,
      age: newAge,
      attackCooldown: newCooldown,
      active: !expired,
    };
  });

  return { ...state, summons: updated };
}

export function damageSummon(
  state: SummonState,
  id: string,
  damage: number,
): SummonState {
  const updated = state.summons.map((s) => {
    if (s.id !== id || !s.active) return s;
    const newHp = s.hp - damage;
    return { ...s, hp: newHp, active: newHp > 0 };
  });

  return { ...state, summons: updated };
}

export function canAttack(summon: Summon): boolean {
  return summon.active && summon.attackCooldown <= 0;
}

export function recordAttack(state: SummonState, id: string): SummonState {
  const cooldown = 1000 / state.config.attackSpeed;
  const updated = state.summons.map((s) => {
    if (s.id !== id) return s;
    return { ...s, attackCooldown: cooldown };
  });

  return { ...state, summons: updated };
}

export function getActiveSummons(state: SummonState): Summon[] {
  return state.summons.filter((s) => s.active);
}

export function getSummonCount(state: SummonState): number {
  return state.summons.filter((s) => s.active).length;
}

export function canSpawn(state: SummonState): boolean {
  return getSummonCount(state) < state.config.maxSummons;
}

export function removeSummon(state: SummonState, id: string): SummonState {
  return { ...state, summons: state.summons.filter((s) => s.id !== id) };
}

export function clearSummons(state: SummonState): SummonState {
  return { ...state, summons: [] };
}

export function healSummon(
  state: SummonState,
  id: string,
  amount: number,
): SummonState {
  const updated = state.summons.map((s) => {
    if (s.id !== id || !s.active) return s;
    return { ...s, hp: Math.min(s.maxHp, s.hp + amount) };
  });

  return { ...state, summons: updated };
}
