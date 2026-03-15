/**
 * ArmorCalc — pure TypeScript flat + percent damage reduction module.
 * NO Phaser imports. Immutable state management.
 *
 * Handles armor scaling, flat reduction, percent reduction, and stat tracking.
 */

// ─── Interfaces ───────────────────────────────────────────────

export interface ArmorConfig {
  readonly baseArmor: number;
  readonly armorPerLevel: number;
  readonly flatReduction: number;
  readonly percentReduction: number;
  readonly maxPercentReduction: number;
}

export interface ArmorState {
  readonly config: ArmorConfig;
  readonly bonusArmor: number;
  readonly bonusFlatReduction: number;
  readonly bonusPercentReduction: number;
  readonly totalDamageBlocked: number;
  readonly hitsReceived: number;
}

// ─── Defaults ─────────────────────────────────────────────────

const DEFAULT_CONFIG: ArmorConfig = {
  baseArmor: 5,
  armorPerLevel: 1,
  flatReduction: 2,
  percentReduction: 0.05,
  maxPercentReduction: 0.8,
};

// ─── Factory ──────────────────────────────────────────────────

export function createArmorState(config?: Partial<ArmorConfig>): ArmorState {
  return {
    config: { ...DEFAULT_CONFIG, ...config },
    bonusArmor: 0,
    bonusFlatReduction: 0,
    bonusPercentReduction: 0,
    totalDamageBlocked: 0,
    hitsReceived: 0,
  };
}

// ─── Effective Armor ──────────────────────────────────────────

export function getEffectiveArmor(
  state: ArmorState,
  level: number = 1,
): number {
  const { baseArmor, armorPerLevel } = state.config;
  return baseArmor + state.bonusArmor + armorPerLevel * (level - 1);
}

// ─── Armor Reduction (diminishing returns) ────────────────────

export function getArmorReduction(armor: number): number {
  return armor / (armor + 100);
}

// ─── Total Percent Reduction (capped) ─────────────────────────

export function getTotalPercentReduction(state: ArmorState): number {
  const raw = state.config.percentReduction + state.bonusPercentReduction;
  return Math.min(raw, state.config.maxPercentReduction);
}

// ─── Damage Calculation ───────────────────────────────────────

export function calculateDamageAfterArmor(
  state: ArmorState,
  incomingDamage: number,
  level: number = 1,
): number {
  const armor = getEffectiveArmor(state, level);
  const armorReduction = getArmorReduction(armor);
  const percentReduction = getTotalPercentReduction(state);
  const totalFlat = state.config.flatReduction + state.bonusFlatReduction;

  const result =
    incomingDamage * (1 - armorReduction) * (1 - percentReduction) - totalFlat;

  return Math.max(result, 1);
}

// ─── Apply Damage (with stat tracking) ────────────────────────

export function applyDamage(
  state: ArmorState,
  incomingDamage: number,
  level: number = 1,
): { newState: ArmorState; finalDamage: number; blocked: number } {
  const finalDamage = calculateDamageAfterArmor(state, incomingDamage, level);
  const blocked = incomingDamage - finalDamage;

  const newState: ArmorState = {
    ...state,
    totalDamageBlocked: state.totalDamageBlocked + blocked,
    hitsReceived: state.hitsReceived + 1,
  };

  return { newState, finalDamage, blocked };
}

// ─── Bonus Management ─────────────────────────────────────────

export function addBonusArmor(state: ArmorState, bonus: number): ArmorState {
  return { ...state, bonusArmor: state.bonusArmor + bonus };
}

export function addFlatReduction(state: ArmorState, flat: number): ArmorState {
  return { ...state, bonusFlatReduction: state.bonusFlatReduction + flat };
}

export function addPercentReduction(
  state: ArmorState,
  percent: number,
): ArmorState {
  return {
    ...state,
    bonusPercentReduction: state.bonusPercentReduction + percent,
  };
}

// ─── Stats / Queries ──────────────────────────────────────────

export function getStats(state: ArmorState): {
  totalDamageBlocked: number;
  hitsReceived: number;
  averageBlocked: number;
} {
  return {
    totalDamageBlocked: state.totalDamageBlocked,
    hitsReceived: state.hitsReceived,
    averageBlocked:
      state.hitsReceived === 0
        ? 0
        : state.totalDamageBlocked / state.hitsReceived,
  };
}

export function resetStats(state: ArmorState): ArmorState {
  return {
    ...state,
    totalDamageBlocked: 0,
    hitsReceived: 0,
  };
}
