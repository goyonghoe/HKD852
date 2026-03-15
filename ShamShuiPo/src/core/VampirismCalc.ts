// VampirismCalc.ts — Lifesteal / Life Drain System
// Pure TypeScript, no Phaser imports, immutable state

export interface VampirismConfig {
  readonly baseLifesteal: number; // 0-1, percent of damage healed
  readonly maxHealPerHit: number; // cap per single hit
  readonly overkillHealing: boolean; // can heal from overkill damage
}

export interface VampirismState {
  readonly config: VampirismConfig;
  readonly totalHealed: number;
  readonly totalDamageDealt: number;
  readonly hitCount: number;
  readonly lastHealAmount: number;
}

const DEFAULT_CONFIG: VampirismConfig = {
  baseLifesteal: 0.05,
  maxHealPerHit: 20,
  overkillHealing: false,
};

export function createVampirismState(
  config?: Partial<VampirismConfig>,
): VampirismState {
  return {
    config: {
      ...DEFAULT_CONFIG,
      ...config,
      baseLifesteal: Math.min(
        1,
        Math.max(0, config?.baseLifesteal ?? DEFAULT_CONFIG.baseLifesteal),
      ),
    },
    totalHealed: 0,
    totalDamageDealt: 0,
    hitCount: 0,
    lastHealAmount: 0,
  };
}

export function calculateHeal(
  state: VampirismState,
  damageDealt: number,
  enemyHpRemaining: number,
): number {
  if (damageDealt <= 0) return 0;

  const effectiveDamage = state.config.overkillHealing
    ? damageDealt
    : Math.min(damageDealt, Math.max(0, enemyHpRemaining));

  const rawHeal = effectiveDamage * state.config.baseLifesteal;
  return Math.min(rawHeal, state.config.maxHealPerHit);
}

export function applyLifesteal(
  state: VampirismState,
  damageDealt: number,
  enemyHpRemaining: number,
): { newState: VampirismState; healAmount: number } {
  const healAmount = calculateHeal(state, damageDealt, enemyHpRemaining);

  const newState: VampirismState = {
    ...state,
    totalHealed: state.totalHealed + healAmount,
    totalDamageDealt: state.totalDamageDealt + damageDealt,
    hitCount: state.hitCount + 1,
    lastHealAmount: healAmount,
  };

  return { newState, healAmount };
}

export function getLifestealPercent(state: VampirismState): number {
  if (state.totalDamageDealt === 0) return 0;
  return state.totalHealed / state.totalDamageDealt;
}

export function getAverageHealPerHit(state: VampirismState): number {
  if (state.hitCount === 0) return 0;
  return state.totalHealed / state.hitCount;
}

export function setLifesteal(
  state: VampirismState,
  baseLifesteal: number,
): VampirismState {
  return {
    ...state,
    config: {
      ...state.config,
      baseLifesteal: Math.min(1, Math.max(0, baseLifesteal)),
    },
  };
}

export function setMaxHealPerHit(
  state: VampirismState,
  maxHealPerHit: number,
): VampirismState {
  return {
    ...state,
    config: {
      ...state.config,
      maxHealPerHit,
    },
  };
}

export function resetStats(state: VampirismState): VampirismState {
  return {
    ...state,
    totalHealed: 0,
    totalDamageDealt: 0,
    hitCount: 0,
    lastHealAmount: 0,
  };
}

export function getStats(state: VampirismState): {
  totalHealed: number;
  totalDamageDealt: number;
  hitCount: number;
  averageHeal: number;
  effectiveRate: number;
} {
  return {
    totalHealed: state.totalHealed,
    totalDamageDealt: state.totalDamageDealt,
    hitCount: state.hitCount,
    averageHeal: getAverageHealPerHit(state),
    effectiveRate: getLifestealPercent(state),
  };
}
