// AttackSpeedCalc.ts — Attack Speed Scaling (pure TypeScript, immutable state)

export interface AttackSpeedConfig {
  readonly baseAttackSpeed: number; // attacks per second
  readonly maxAttackSpeed: number; // hard cap
  readonly minAttackInterval: number; // ms — hard floor
  readonly scalingType: "linear" | "multiplicative" | "diminishing";
}

export interface AttackSpeedState {
  readonly config: AttackSpeedConfig;
  readonly bonusPercent: number; // additive bonus percent e.g. 0.5 = 50%
  readonly bonusFlat: number; // attacks/sec
  readonly totalAttacks: number;
  readonly totalTime: number; // ms
}

const DEFAULT_CONFIG: AttackSpeedConfig = {
  baseAttackSpeed: 1.0,
  maxAttackSpeed: 10.0,
  minAttackInterval: 50,
  scalingType: "multiplicative",
};

export function createAttackSpeedState(
  config?: Partial<AttackSpeedConfig>,
): AttackSpeedState {
  return {
    config: { ...DEFAULT_CONFIG, ...config },
    bonusPercent: 0,
    bonusFlat: 0,
    totalAttacks: 0,
    totalTime: 0,
  };
}

export function getEffectiveAttackSpeed(state: AttackSpeedState): number {
  const { baseAttackSpeed, maxAttackSpeed, scalingType } = state.config;
  const { bonusPercent, bonusFlat } = state;

  let speed: number;
  switch (scalingType) {
    case "linear":
      speed = baseAttackSpeed + baseAttackSpeed * bonusPercent + bonusFlat;
      break;
    case "multiplicative":
      speed = baseAttackSpeed * (1 + bonusPercent) + bonusFlat;
      break;
    case "diminishing":
      speed =
        baseAttackSpeed * (1 + bonusPercent / (1 + bonusPercent)) + bonusFlat;
      break;
  }

  return Math.min(speed, maxAttackSpeed);
}

export function getAttackInterval(state: AttackSpeedState): number {
  const effective = getEffectiveAttackSpeed(state);
  const interval = effective > 0 ? 1000 / effective : Infinity;
  return Math.max(interval, state.config.minAttackInterval);
}

export function addBonusPercent(
  state: AttackSpeedState,
  percent: number,
): AttackSpeedState {
  return { ...state, bonusPercent: state.bonusPercent + percent };
}

export function addBonusFlat(
  state: AttackSpeedState,
  flat: number,
): AttackSpeedState {
  return { ...state, bonusFlat: state.bonusFlat + flat };
}

export function recordAttack(
  state: AttackSpeedState,
  deltaMs: number,
): AttackSpeedState {
  return {
    ...state,
    totalAttacks: state.totalAttacks + 1,
    totalTime: state.totalTime + deltaMs,
  };
}

export function getActualDPS(
  state: AttackSpeedState,
  damagePerHit: number,
): number {
  return getEffectiveAttackSpeed(state) * damagePerHit;
}

export function getAverageAttackSpeed(state: AttackSpeedState): number {
  if (state.totalTime <= 0) return 0;
  return state.totalAttacks / (state.totalTime / 1000);
}

export function resetStats(state: AttackSpeedState): AttackSpeedState {
  return {
    ...state,
    totalAttacks: 0,
    totalTime: 0,
  };
}

export function setScalingType(
  state: AttackSpeedState,
  scalingType: "linear" | "multiplicative" | "diminishing",
): AttackSpeedState {
  return {
    ...state,
    config: { ...state.config, scalingType },
  };
}

export function getStats(state: AttackSpeedState): {
  effectiveSpeed: number;
  interval: number;
  totalAttacks: number;
  averageSpeed: number;
} {
  return {
    effectiveSpeed: getEffectiveAttackSpeed(state),
    interval: getAttackInterval(state),
    totalAttacks: state.totalAttacks,
    averageSpeed: getAverageAttackSpeed(state),
  };
}
