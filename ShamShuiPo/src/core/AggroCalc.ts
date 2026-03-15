// AggroCalc.ts — Enemy Aggro / Threat Table (pure TypeScript, immutable)

export interface ThreatEntry {
  readonly targetId: string;
  readonly threat: number;
  readonly lastUpdateTime: number; // ms
}

export interface AggroConfig {
  readonly threatDecayRate: number; // per second
  readonly proximityThreatWeight: number;
  readonly damageThreatWeight: number;
  readonly maxThreatEntries: number;
}

export interface AggroState {
  readonly config: AggroConfig;
  readonly entries: readonly ThreatEntry[];
}

const DEFAULT_CONFIG: AggroConfig = {
  threatDecayRate: 5,
  proximityThreatWeight: 1.0,
  damageThreatWeight: 2.0,
  maxThreatEntries: 10,
};

export function createAggroState(config?: Partial<AggroConfig>): AggroState {
  return {
    config: { ...DEFAULT_CONFIG, ...config },
    entries: [],
  };
}

export function addThreat(
  state: AggroState,
  targetId: string,
  amount: number,
  currentTime: number,
): AggroState {
  if (amount <= 0) return state;

  const idx = state.entries.findIndex((e) => e.targetId === targetId);

  if (idx >= 0) {
    const existing = state.entries[idx];
    const updated: ThreatEntry = {
      targetId,
      threat: existing.threat + amount,
      lastUpdateTime: currentTime,
    };
    const newEntries = [
      ...state.entries.slice(0, idx),
      updated,
      ...state.entries.slice(idx + 1),
    ];
    return { ...state, entries: newEntries };
  }

  // New entry — enforce maxThreatEntries
  if (state.entries.length >= state.config.maxThreatEntries) {
    // Replace lowest threat entry if new amount exceeds it
    let minIdx = 0;
    let minThreat = state.entries[0].threat;
    for (let i = 1; i < state.entries.length; i++) {
      if (state.entries[i].threat < minThreat) {
        minThreat = state.entries[i].threat;
        minIdx = i;
      }
    }
    if (amount <= minThreat) return state;
    const newEntry: ThreatEntry = {
      targetId,
      threat: amount,
      lastUpdateTime: currentTime,
    };
    const newEntries = [
      ...state.entries.slice(0, minIdx),
      newEntry,
      ...state.entries.slice(minIdx + 1),
    ];
    return { ...state, entries: newEntries };
  }

  const newEntry: ThreatEntry = {
    targetId,
    threat: amount,
    lastUpdateTime: currentTime,
  };
  return { ...state, entries: [...state.entries, newEntry] };
}

export function addDamageThreat(
  state: AggroState,
  targetId: string,
  damage: number,
  currentTime: number,
): AggroState {
  if (damage <= 0) return state;
  return addThreat(
    state,
    targetId,
    damage * state.config.damageThreatWeight,
    currentTime,
  );
}

export function addProximityThreat(
  state: AggroState,
  targetId: string,
  distance: number,
  maxRange: number,
  currentTime: number,
): AggroState {
  if (distance < 0 || maxRange <= 0 || distance >= maxRange) return state;
  const factor = (1 - distance / maxRange) * state.config.proximityThreatWeight;
  if (factor <= 0) return state;
  return addThreat(state, targetId, factor, currentTime);
}

export function updateAggro(state: AggroState, deltaMs: number): AggroState {
  if (deltaMs <= 0) return state;
  const decayAmount = state.config.threatDecayRate * (deltaMs / 1000);
  const newEntries = state.entries
    .map((e) => ({
      ...e,
      threat: Math.max(0, e.threat - decayAmount),
    }))
    .filter((e) => e.threat > 0);
  return { ...state, entries: newEntries };
}

export function getTopThreat(state: AggroState): ThreatEntry | null {
  if (state.entries.length === 0) return null;
  let top = state.entries[0];
  for (let i = 1; i < state.entries.length; i++) {
    if (state.entries[i].threat > top.threat) {
      top = state.entries[i];
    }
  }
  return top;
}

export function getThreat(state: AggroState, targetId: string): number {
  const entry = state.entries.find((e) => e.targetId === targetId);
  return entry ? entry.threat : 0;
}

export function removeThreat(state: AggroState, targetId: string): AggroState {
  const newEntries = state.entries.filter((e) => e.targetId !== targetId);
  if (newEntries.length === state.entries.length) return state;
  return { ...state, entries: newEntries };
}

export function clearAggro(state: AggroState): AggroState {
  if (state.entries.length === 0) return state;
  return { ...state, entries: [] };
}

export function getEntryCount(state: AggroState): number {
  return state.entries.length;
}

export function getSortedEntries(state: AggroState): readonly ThreatEntry[] {
  return [...state.entries].sort((a, b) => b.threat - a.threat);
}
