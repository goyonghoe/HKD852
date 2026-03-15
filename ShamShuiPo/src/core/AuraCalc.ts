// AuraCalc.ts — Passive Damage Aura (pure TypeScript, immutable state)

export type ElementType = "fire" | "ice" | "electric" | "poison" | "none";

export interface AuraConfig {
  readonly radius: number;
  readonly damagePerTick: number;
  readonly tickInterval: number; // ms
  readonly elementType: ElementType;
}

export interface AuraState {
  readonly config: AuraConfig;
  readonly active: boolean;
  readonly tickElapsed: number; // ms
  readonly totalDamageDealt: number;
  readonly totalTicks: number;
}

const DEFAULT_CONFIG: AuraConfig = {
  radius: 80,
  damagePerTick: 5,
  tickInterval: 500,
  elementType: "none",
};

export function createAuraState(config?: Partial<AuraConfig>): AuraState {
  return {
    config: { ...DEFAULT_CONFIG, ...config },
    active: true,
    tickElapsed: 0,
    totalDamageDealt: 0,
    totalTicks: 0,
  };
}

export function updateAura(
  state: AuraState,
  deltaMs: number,
): { newState: AuraState; shouldTick: boolean } {
  if (!state.active) {
    return { newState: state, shouldTick: false };
  }

  const elapsed = state.tickElapsed + deltaMs;

  if (elapsed >= state.config.tickInterval) {
    return {
      newState: { ...state, tickElapsed: elapsed - state.config.tickInterval },
      shouldTick: true,
    };
  }

  return {
    newState: { ...state, tickElapsed: elapsed },
    shouldTick: false,
  };
}

export function getEnemiesInAura(
  playerX: number,
  playerY: number,
  radius: number,
  enemies: readonly { id: string; x: number; y: number }[],
): readonly { id: string; x: number; y: number }[] {
  const r2 = radius * radius;
  return enemies.filter((e) => {
    const dx = e.x - playerX;
    const dy = e.y - playerY;
    return dx * dx + dy * dy <= r2;
  });
}

export function applyAuraDamage(state: AuraState, hitCount: number): AuraState {
  return {
    ...state,
    totalDamageDealt:
      state.totalDamageDealt + state.config.damagePerTick * hitCount,
    totalTicks: state.totalTicks + 1,
  };
}

export function setRadius(state: AuraState, radius: number): AuraState {
  return { ...state, config: { ...state.config, radius } };
}

export function setDamage(state: AuraState, damagePerTick: number): AuraState {
  return { ...state, config: { ...state.config, damagePerTick } };
}

export function toggleAura(state: AuraState): AuraState {
  return { ...state, active: !state.active };
}

export function isActive(state: AuraState): boolean {
  return state.active;
}

export function getDPS(state: AuraState): number {
  return state.config.damagePerTick / (state.config.tickInterval / 1000);
}

export function getStats(state: AuraState): {
  totalDamageDealt: number;
  totalTicks: number;
  dps: number;
  radius: number;
} {
  return {
    totalDamageDealt: state.totalDamageDealt,
    totalTicks: state.totalTicks,
    dps: getDPS(state),
    radius: state.config.radius,
  };
}

export function resetStats(state: AuraState): AuraState {
  return {
    ...state,
    totalDamageDealt: 0,
    totalTicks: 0,
    tickElapsed: 0,
  };
}
