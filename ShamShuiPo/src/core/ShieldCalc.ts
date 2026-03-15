/**
 * ShieldCalc — Pure TypeScript energy shield calculations.
 * NO Phaser imports. All functions are pure and side-effect free.
 */

// ─── Types ───────────────────────────────────────────────────────

export interface ShieldConfig {
  readonly maxShield: number;
  /** Shield points recovered per second */
  readonly rechargeRate: number;
  /** Milliseconds after last hit before recharging starts */
  readonly rechargeDelay: number;
  /** Portion of damage absorbed by shield (0–1) */
  readonly damageReduction: number;
}

export interface ShieldState {
  readonly config: ShieldConfig;
  readonly current: number;
  readonly lastHitTime: number;
  readonly isRecharging: boolean;
  readonly totalAbsorbed: number;
}

// ─── Defaults ────────────────────────────────────────────────────

const DEFAULT_CONFIG: ShieldConfig = {
  maxShield: 50,
  rechargeRate: 10,
  rechargeDelay: 3000,
  damageReduction: 1.0,
};

// ─── Functions ───────────────────────────────────────────────────

export function createShieldState(config?: Partial<ShieldConfig>): ShieldState {
  const merged: ShieldConfig = { ...DEFAULT_CONFIG, ...config };
  return {
    config: merged,
    current: merged.maxShield,
    lastHitTime: 0,
    isRecharging: false,
    totalAbsorbed: 0,
  };
}

export function takeDamage(
  state: ShieldState,
  damage: number,
  currentTime: number,
): { newState: ShieldState; damageToHP: number } {
  const absorbable = damage * state.config.damageReduction;
  const absorbed = Math.min(absorbable, state.current);
  // Damage not absorbed by shield passes through to HP
  const damageToHP = damage - absorbed;

  return {
    newState: {
      ...state,
      current: state.current - absorbed,
      lastHitTime: currentTime,
      isRecharging: false,
      totalAbsorbed: state.totalAbsorbed + absorbed,
    },
    damageToHP: Math.max(0, damageToHP),
  };
}

export function updateShield(
  state: ShieldState,
  deltaMs: number,
  currentTime: number,
): ShieldState {
  if (state.current >= state.config.maxShield) {
    return state;
  }

  const elapsed = currentTime - state.lastHitTime;
  if (elapsed < state.config.rechargeDelay) {
    return state;
  }

  const rechargeAmount = state.config.rechargeRate * (deltaMs / 1000);
  const newCurrent = Math.min(
    state.current + rechargeAmount,
    state.config.maxShield,
  );

  return {
    ...state,
    current: newCurrent,
    isRecharging: newCurrent < state.config.maxShield,
  };
}

export function getShieldPercent(state: ShieldState): number {
  if (state.config.maxShield <= 0) return 0;
  return state.current / state.config.maxShield;
}

export function isShieldActive(state: ShieldState): boolean {
  return state.current > 0;
}

export function isFullShield(state: ShieldState): boolean {
  return state.current >= state.config.maxShield;
}

export function addShield(state: ShieldState, amount: number): ShieldState {
  return {
    ...state,
    current: Math.min(state.current + amount, state.config.maxShield),
  };
}

export function setMaxShield(
  state: ShieldState,
  maxShield: number,
): ShieldState {
  const newConfig: ShieldConfig = { ...state.config, maxShield };
  return {
    ...state,
    config: newConfig,
    current: Math.min(state.current, maxShield),
  };
}

export function resetShield(state: ShieldState): ShieldState {
  return {
    ...state,
    current: state.config.maxShield,
    lastHitTime: 0,
    isRecharging: false,
  };
}

export function getAbsorptionStats(state: ShieldState): {
  totalAbsorbed: number;
  currentPercent: number;
} {
  return {
    totalAbsorbed: state.totalAbsorbed,
    currentPercent: getShieldPercent(state),
  };
}
