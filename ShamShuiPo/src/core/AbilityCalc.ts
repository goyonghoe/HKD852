/**
 * AbilityCalc — Pure TypeScript ability system with cooldowns, charges, and leveling
 * No Phaser imports. All functions are pure and return new state (immutable).
 */

// ── Types ──────────────────────────────────────────────────────────

export type AbilityId =
  | "dash"
  | "shield_burst"
  | "time_warp"
  | "neon_nova"
  | "cyber_strike"
  | "hack_pulse";

export interface AbilityDef {
  readonly id: AbilityId;
  readonly name: string;
  readonly description: string;
  readonly cooldown: number;
  readonly charges: number;
  readonly maxCharges: number;
  readonly activeDuration: number;
  readonly damageMultiplier?: number;
  readonly radiusOrRange?: number;
  readonly energyCost: number;
}

export interface AbilityState {
  readonly id: AbilityId;
  readonly cooldownRemaining: number;
  readonly chargesLeft: number;
  readonly isActive: boolean;
  readonly activeTimeRemaining: number;
  readonly level: number;
}

// ── Constants ──────────────────────────────────────────────────────

export const ABILITY_DEFS: Readonly<Record<AbilityId, AbilityDef>> = {
  dash: {
    id: "dash",
    name: "Dash",
    description: "Quick burst of speed to dodge attacks",
    cooldown: 3,
    charges: 2,
    maxCharges: 2,
    activeDuration: 0.3,
    energyCost: 15,
  },
  shield_burst: {
    id: "shield_burst",
    name: "Shield Burst",
    description: "Emit a protective energy shield around you",
    cooldown: 10,
    charges: 1,
    maxCharges: 1,
    activeDuration: 4,
    damageMultiplier: 0.5,
    radiusOrRange: 120,
    energyCost: 40,
  },
  time_warp: {
    id: "time_warp",
    name: "Time Warp",
    description: "Slow down time for all enemies",
    cooldown: 18,
    charges: 1,
    maxCharges: 1,
    activeDuration: 5,
    energyCost: 60,
  },
  neon_nova: {
    id: "neon_nova",
    name: "Neon Nova",
    description: "Unleash a radial burst of neon energy",
    cooldown: 12,
    charges: 1,
    maxCharges: 1,
    activeDuration: 0,
    damageMultiplier: 3.0,
    radiusOrRange: 200,
    energyCost: 50,
  },
  cyber_strike: {
    id: "cyber_strike",
    name: "Cyber Strike",
    description: "Launch a targeted cyber projectile",
    cooldown: 5,
    charges: 3,
    maxCharges: 3,
    activeDuration: 0,
    damageMultiplier: 2.0,
    radiusOrRange: 300,
    energyCost: 25,
  },
  hack_pulse: {
    id: "hack_pulse",
    name: "Hack Pulse",
    description: "Disable nearby enemies with a digital pulse",
    cooldown: 15,
    charges: 1,
    maxCharges: 1,
    activeDuration: 3,
    damageMultiplier: 1.5,
    radiusOrRange: 150,
    energyCost: 45,
  },
};

// ── Helpers ────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getDef(id: AbilityId): AbilityDef {
  return ABILITY_DEFS[id];
}

// ── Level scaling helpers ──────────────────────────────────────────

/** Cooldown reduction per level: 5% per level beyond 1 */
function levelCooldownMultiplier(level: number): number {
  return Math.max(0.5, 1 - (level - 1) * 0.05);
}

/** Damage scaling per level: +10% per level beyond 1 */
function levelDamageMultiplier(level: number): number {
  return 1 + (level - 1) * 0.1;
}

/** Radius scaling per level: +8% per level beyond 1 */
function levelRadiusMultiplier(level: number): number {
  return 1 + (level - 1) * 0.08;
}

/** Energy cost discount per level: 3% per level beyond 1 */
function levelEnergyCostMultiplier(level: number): number {
  return Math.max(0.5, 1 - (level - 1) * 0.03);
}

/** Extra charges granted at levels 4 and 8 */
function levelBonusCharges(level: number): number {
  let bonus = 0;
  if (level >= 4) bonus += 1;
  if (level >= 8) bonus += 1;
  return bonus;
}

// ── Factory ────────────────────────────────────────────────────────

export function createAbilityState(id: AbilityId): AbilityState {
  const def = getDef(id);
  return {
    id,
    cooldownRemaining: 0,
    chargesLeft: def.charges,
    isActive: false,
    activeTimeRemaining: 0,
    level: 1,
  };
}

// ── Queries ────────────────────────────────────────────────────────

export function canActivate(state: AbilityState): boolean {
  if (state.cooldownRemaining > 0) return false;
  if (state.chargesLeft <= 0) return false;
  if (state.isActive) return false;
  return true;
}

// ── Mutations (immutable — return new state) ──────────────────────

export function activate(state: AbilityState): AbilityState {
  if (!canActivate(state)) return state;

  const def = getDef(state.id);
  const scaledCooldown = def.cooldown * levelCooldownMultiplier(state.level);
  const hasActiveDuration = def.activeDuration > 0;

  return {
    ...state,
    chargesLeft: state.chargesLeft - 1,
    cooldownRemaining: scaledCooldown,
    isActive: hasActiveDuration,
    activeTimeRemaining: hasActiveDuration ? def.activeDuration : 0,
  };
}

export function tickAbility(state: AbilityState, dt: number): AbilityState {
  if (dt <= 0) return state;

  const def = getDef(state.id);
  const maxCharges = def.maxCharges + levelBonusCharges(state.level);

  let cooldownRemaining = Math.max(0, state.cooldownRemaining - dt);
  let activeTimeRemaining = state.activeTimeRemaining;
  let isActive = state.isActive;
  let chargesLeft = state.chargesLeft;

  // Tick active duration
  if (isActive && activeTimeRemaining > 0) {
    activeTimeRemaining = Math.max(0, activeTimeRemaining - dt);
    if (activeTimeRemaining <= 0) {
      isActive = false;
    }
  }

  // Regenerate a charge when cooldown expires (if below max)
  if (
    cooldownRemaining <= 0 &&
    state.cooldownRemaining > 0 &&
    chargesLeft < maxCharges
  ) {
    chargesLeft = Math.min(chargesLeft + 1, maxCharges);
  }

  return {
    ...state,
    cooldownRemaining,
    chargesLeft,
    isActive,
    activeTimeRemaining,
  };
}

export function deactivate(state: AbilityState): AbilityState {
  if (!state.isActive) return state;

  return {
    ...state,
    isActive: false,
    activeTimeRemaining: 0,
  };
}

export function upgradeAbility(state: AbilityState): AbilityState {
  const newLevel = state.level + 1;
  const def = getDef(state.id);
  const newMaxCharges = def.maxCharges + levelBonusCharges(newLevel);

  return {
    ...state,
    level: newLevel,
    // If upgrading grants bonus charges, give them immediately
    chargesLeft: Math.min(
      Math.max(
        state.chargesLeft,
        state.chargesLeft +
          (newMaxCharges - (def.maxCharges + levelBonusCharges(state.level))),
      ),
      newMaxCharges,
    ),
  };
}

// ── Computed values ───────────────────────────────────────────────

export function getAbilityDamage(
  state: AbilityState,
  baseDamage: number,
): number {
  const def = getDef(state.id);
  if (def.damageMultiplier == null) return 0;
  return baseDamage * def.damageMultiplier * levelDamageMultiplier(state.level);
}

export function getAbilityRadius(state: AbilityState): number {
  const def = getDef(state.id);
  if (def.radiusOrRange == null) return 0;
  return def.radiusOrRange * levelRadiusMultiplier(state.level);
}

export function getCooldownPercent(state: AbilityState): number {
  const def = getDef(state.id);
  const scaledCooldown = def.cooldown * levelCooldownMultiplier(state.level);
  if (scaledCooldown <= 0) return 0;
  return clamp(state.cooldownRemaining / scaledCooldown, 0, 1);
}

export function calculateEnergyCost(state: AbilityState): number {
  const def = getDef(state.id);
  return def.energyCost * levelEnergyCostMultiplier(state.level);
}

// ── Batch operations ──────────────────────────────────────────────

export function resetAllCooldowns(states: AbilityState[]): AbilityState[] {
  return states.map((s) => {
    const def = getDef(s.id);
    const maxCharges = def.maxCharges + levelBonusCharges(s.level);
    return {
      ...s,
      cooldownRemaining: 0,
      chargesLeft: maxCharges,
    };
  });
}

export function getReadyAbilities(states: AbilityState[]): AbilityState[] {
  return states.filter(canActivate);
}
