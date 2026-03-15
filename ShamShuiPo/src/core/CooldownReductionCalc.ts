// CooldownReductionCalc — Cooldown Reduction Stacking (multiplicative)
// Pure TypeScript, no Phaser imports, immutable state.

export interface CDRSource {
  readonly id: string;
  readonly percent: number; // 0-1
  readonly source: string; // e.g. 'passive', 'item', 'buff'
}

export interface CDRState {
  readonly sources: readonly CDRSource[];
  readonly maxCDR: number; // 0-1, hard cap
}

export function createCDRState(maxCDR: number = 0.75): CDRState {
  return { sources: [], maxCDR };
}

export function addCDRSource(
  state: CDRState,
  id: string,
  percent: number,
  source: string,
): CDRState {
  return {
    ...state,
    sources: [...state.sources, { id, percent, source }],
  };
}

export function removeCDRSource(state: CDRState, id: string): CDRState {
  return {
    ...state,
    sources: state.sources.filter((s) => s.id !== id),
  };
}

export function getEffectiveCDR(state: CDRState): number {
  if (state.sources.length === 0) return 0;
  const product = state.sources.reduce((acc, s) => acc * (1 - s.percent), 1);
  const raw = 1 - product;
  return Math.min(raw, state.maxCDR);
}

export function applyCDR(baseCooldown: number, cdr: number): number {
  return baseCooldown * (1 - cdr);
}

export function getReducedCooldown(
  state: CDRState,
  baseCooldown: number,
): number {
  return applyCDR(baseCooldown, getEffectiveCDR(state));
}

export function getCDRFromSource(state: CDRState, source: string): number {
  const matching = state.sources.filter((s) => s.source === source);
  if (matching.length === 0) return 0;
  const product = matching.reduce((acc, s) => acc * (1 - s.percent), 1);
  return 1 - product;
}

export function getSourceCount(state: CDRState): number {
  return state.sources.length;
}

export function clearSources(state: CDRState): CDRState {
  return { ...state, sources: [] };
}

export function updateSource(
  state: CDRState,
  id: string,
  percent: number,
): CDRState {
  return {
    ...state,
    sources: state.sources.map((s) => (s.id === id ? { ...s, percent } : s)),
  };
}

export function getCDRBreakdown(
  state: CDRState,
): readonly { source: string; totalPercent: number }[] {
  const groups = new Map<string, CDRSource[]>();
  for (const s of state.sources) {
    const arr = groups.get(s.source) ?? [];
    arr.push(s);
    groups.set(s.source, arr);
  }
  const result: { source: string; totalPercent: number }[] = [];
  for (const [source, sources] of groups) {
    const product = sources.reduce((acc, s) => acc * (1 - s.percent), 1);
    result.push({ source, totalPercent: 1 - product });
  }
  return result;
}

export function setMaxCDR(state: CDRState, maxCDR: number): CDRState {
  return { ...state, maxCDR };
}
