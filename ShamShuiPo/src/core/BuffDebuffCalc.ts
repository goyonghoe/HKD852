/**
 * BuffDebuffCalc — Pure TypeScript buff/debuff state management
 * No Phaser imports. All functions are pure and return new state (immutable).
 */

// ── Types ──────────────────────────────────────────────────────────

export type BuffType =
  | "damage_up"
  | "speed_up"
  | "fire_rate_up"
  | "shield"
  | "magnet_range"
  | "invincible"
  | "regen";

export type DebuffType =
  | "slow"
  | "weaken"
  | "dot"
  | "silence"
  | "curse"
  | "blind";

export interface BuffEntry {
  readonly id: string;
  readonly type: BuffType;
  readonly value: number;
  readonly duration: number;
  readonly elapsed: number;
  readonly source: string;
}

export interface DebuffEntry {
  readonly id: string;
  readonly type: DebuffType;
  readonly value: number;
  readonly duration: number;
  readonly elapsed: number;
  readonly source: string;
}

export interface BuffDebuffState {
  readonly buffs: readonly BuffEntry[];
  readonly debuffs: readonly DebuffEntry[];
  readonly nextId: number;
}

// ── Constants ──────────────────────────────────────────────────────

const MAX_BUFFS_PER_TYPE = 5;
const MAX_DEBUFFS_PER_TYPE = 3;

// ── Factory ────────────────────────────────────────────────────────

export function createState(): BuffDebuffState {
  return { buffs: [], debuffs: [], nextId: 1 };
}

// ── Add / Remove ───────────────────────────────────────────────────

export function addBuff(
  state: BuffDebuffState,
  type: BuffType,
  value: number,
  duration: number,
  source: string,
): BuffDebuffState {
  // Same type + same source → refresh duration, keep higher value
  const existing = state.buffs.find(
    (b) => b.type === type && b.source === source,
  );
  if (existing) {
    return {
      ...state,
      buffs: state.buffs.map((b) =>
        b === existing
          ? { ...b, value: Math.max(b.value, value), duration, elapsed: 0 }
          : b,
      ),
    };
  }

  // Cap per type
  const sameType = state.buffs.filter((b) => b.type === type);
  if (sameType.length >= MAX_BUFFS_PER_TYPE) {
    return state;
  }

  const entry: BuffEntry = {
    id: `buff_${state.nextId}`,
    type,
    value,
    duration,
    elapsed: 0,
    source,
  };
  return {
    ...state,
    buffs: [...state.buffs, entry],
    nextId: state.nextId + 1,
  };
}

export function addDebuff(
  state: BuffDebuffState,
  type: DebuffType,
  value: number,
  duration: number,
  source: string,
): BuffDebuffState {
  const existing = state.debuffs.find(
    (d) => d.type === type && d.source === source,
  );
  if (existing) {
    return {
      ...state,
      debuffs: state.debuffs.map((d) =>
        d === existing
          ? { ...d, value: Math.max(d.value, value), duration, elapsed: 0 }
          : d,
      ),
    };
  }

  const sameType = state.debuffs.filter((d) => d.type === type);
  if (sameType.length >= MAX_DEBUFFS_PER_TYPE) {
    return state;
  }

  const entry: DebuffEntry = {
    id: `debuff_${state.nextId}`,
    type,
    value,
    duration,
    elapsed: 0,
    source,
  };
  return {
    ...state,
    debuffs: [...state.debuffs, entry],
    nextId: state.nextId + 1,
  };
}

export function removeBuff(
  state: BuffDebuffState,
  id: string,
): BuffDebuffState {
  return { ...state, buffs: state.buffs.filter((b) => b.id !== id) };
}

export function removeDebuff(
  state: BuffDebuffState,
  id: string,
): BuffDebuffState {
  return { ...state, debuffs: state.debuffs.filter((d) => d.id !== id) };
}

// ── Tick ────────────────────────────────────────────────────────────

export function tick(state: BuffDebuffState, dt: number): BuffDebuffState {
  const buffs = state.buffs
    .map((b) => ({ ...b, elapsed: b.elapsed + dt }))
    .filter((b) => b.elapsed < b.duration);

  const debuffs = state.debuffs
    .map((d) => ({ ...d, elapsed: d.elapsed + dt }))
    .filter((d) => d.elapsed < d.duration);

  return { ...state, buffs, debuffs };
}

// ── Queries ─────────────────────────────────────────────────────────

export function getBuffMultiplier(
  state: BuffDebuffState,
  type: BuffType,
): number {
  const matching = state.buffs.filter((b) => b.type === type);
  if (matching.length === 0) return 1.0;
  return matching.reduce((acc, b) => acc * b.value, 1.0);
}

export function getDebuffMultiplier(
  state: BuffDebuffState,
  type: DebuffType,
): number {
  const matching = state.debuffs.filter((d) => d.type === type);
  if (matching.length === 0) return 1.0;
  return matching.reduce((acc, d) => acc * d.value, 1.0);
}

export function getDamageMultiplier(state: BuffDebuffState): number {
  return (
    getBuffMultiplier(state, "damage_up") * getDebuffMultiplier(state, "weaken")
  );
}

export function getSpeedMultiplier(state: BuffDebuffState): number {
  return (
    getBuffMultiplier(state, "speed_up") * getDebuffMultiplier(state, "slow")
  );
}

export function isInvincible(state: BuffDebuffState): boolean {
  return state.buffs.some((b) => b.type === "invincible");
}

export function isSilenced(state: BuffDebuffState): boolean {
  return state.debuffs.some((d) => d.type === "silence");
}

export function getActiveBuffCount(state: BuffDebuffState): number {
  return state.buffs.length;
}

export function getActiveDebuffCount(state: BuffDebuffState): number {
  return state.debuffs.length;
}

export function clearAllBuffs(state: BuffDebuffState): BuffDebuffState {
  return { ...state, buffs: [] };
}

export function clearAllDebuffs(state: BuffDebuffState): BuffDebuffState {
  return { ...state, debuffs: [] };
}

export function getDotDamage(state: BuffDebuffState): number {
  return state.debuffs
    .filter((d) => d.type === "dot")
    .reduce((sum, d) => sum + d.value, 0);
}
