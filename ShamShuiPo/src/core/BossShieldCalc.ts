/**
 * BossShieldCalc — pure TypeScript Boss Neon Shield logic.
 * NO Phaser imports. Immutable state management.
 *
 * SPEC-034 §4.6 — Confirmed mechanic:
 *   "실드 해제는 콤보 버프 상태가 아니라 파편을 직접 소비하는 방식이다."
 *   Shield breaking = player SPENDS fragments from inventory directly.
 *   This creates the core tradeoff: use fragments for combos (power)
 *   OR save them for boss shield breaking (progression).
 *
 * Different bosses may require a specific fragment type to be included.
 */

import { BOSS_NEON_SHIELDS } from "../config/balance";
import type { FragmentType } from "../types/game";

// ─── Types ────────────────────────────────────────────────────

export type BossType = "mini_boss" | "chapter_boss" | "final_boss";

export interface BossShieldState {
  readonly bossType: BossType;
  readonly shieldHp: number; // current neon charges remaining
  readonly maxShieldHp: number; // initial neon charges
  readonly broken: boolean; // true once shieldHp reaches 0
  readonly damageReduction: number; // damage reduction factor while shield is active
  readonly requiredFragmentCount: number; // fragments needed per throw
  readonly requiredFragmentType: string | null; // null = any, else must include this type
}

// ─── Factory ──────────────────────────────────────────────────

/**
 * Create the initial shield state for a given boss type.
 */
export function createShieldState(bossType: BossType): BossShieldState {
  const def = BOSS_NEON_SHIELDS[bossType];

  return {
    bossType,
    shieldHp: def.shieldHp,
    maxShieldHp: def.shieldHp,
    broken: false,
    damageReduction: def.damageReduction,
    requiredFragmentCount: def.requiredFragmentCount,
    requiredFragmentType: def.requiredFragmentType,
  };
}

// ─── Fragment Validation ──────────────────────────────────────

/**
 * Validate whether the provided fragments satisfy the shield's requirements.
 *
 * Rules (SPEC-034 §4.6):
 * - Must throw exactly `requiredFragmentCount` fragments
 * - If `requiredFragmentType` is set, at least one fragment must be of that type
 * - mini_boss: any 2 fragments
 * - chapter_boss: 3 fragments including 火
 * - final_boss: 3 fragments including phase-specific type (default 火)
 */
export function fragmentsSatisfyShield(
  fragments: FragmentType[],
  state: BossShieldState,
): boolean {
  if (fragments.length < state.requiredFragmentCount) return false;

  if (state.requiredFragmentType !== null) {
    const hasRequired = fragments.some((f) => f === state.requiredFragmentType);
    if (!hasRequired) return false;
  }

  return true;
}

/**
 * Check if the player can attempt a shield break with their current inventory.
 * Returns true only if the player holds enough fragments of the correct type.
 */
export function canAttemptShatterWithFragments(
  heldFragments: FragmentType[],
  state: BossShieldState,
): boolean {
  if (state.broken) return false;
  if (heldFragments.length < state.requiredFragmentCount) return false;

  if (state.requiredFragmentType !== null) {
    const hasRequired = heldFragments.some(
      (f) => f === state.requiredFragmentType,
    );
    if (!hasRequired) return false;
  }

  return true;
}

// ─── Shield Shattering ────────────────────────────────────────

/**
 * Apply fragments directly to the boss shield (SPEC-034 §4.6 core mechanic).
 *
 * The player throws `requiredFragmentCount` fragments at the boss shield.
 * If the fragments satisfy the shield requirement, the shield takes 1 "neon charge"
 * of damage and the spent fragments are removed from the player's inventory.
 *
 * If requirements are not met, state is returned unchanged and no fragments consumed.
 *
 * @param state          Current shield state
 * @param heldFragments  Player's current fragment inventory
 * @returns Updated shield state and remaining fragments after spending
 */
export function applyFragmentToShield(
  state: BossShieldState,
  heldFragments: FragmentType[],
): { state: BossShieldState; remainingFragments: FragmentType[] } {
  if (state.broken) {
    // Shield already broken — no change, no fragments consumed
    return { state, remainingFragments: [...heldFragments] };
  }

  if (!canAttemptShatterWithFragments(heldFragments, state)) {
    // Requirements not met — no change, no fragments consumed
    return { state, remainingFragments: [...heldFragments] };
  }

  // Select fragments to consume:
  // If there's a required type, ensure we include at least one of it.
  const remainingFragments = consumeFragmentsForShield(
    heldFragments,
    state.requiredFragmentCount,
    state.requiredFragmentType,
  );

  // Each valid throw deals 1 neon charge of damage to the shield
  const newHp = state.shieldHp - 1;
  const broken = newHp <= 0;

  const newState: BossShieldState = {
    ...state,
    shieldHp: Math.max(0, newHp),
    broken,
  };

  return { state: newState, remainingFragments };
}

/**
 * Consume the required number of fragments from the inventory.
 * Prefers consuming the required type first (if specified),
 * then fills remaining slots with any available fragment.
 *
 * Returns a new array (immutable — original is not mutated).
 */
function consumeFragmentsForShield(
  held: FragmentType[],
  count: number,
  requiredType: string | null,
): FragmentType[] {
  const remaining = [...held];
  let toConsume = count;

  // First, consume the required type (if any)
  if (requiredType !== null) {
    const idx = remaining.findIndex((f) => f === requiredType);
    if (idx !== -1) {
      remaining.splice(idx, 1);
      toConsume--;
    }
  }

  // Then consume remaining slots with any fragment (oldest first)
  while (toConsume > 0 && remaining.length > 0) {
    remaining.splice(0, 1);
    toConsume--;
  }

  return remaining;
}

// ─── State Queries ────────────────────────────────────────────

/**
 * Get the effective damage reduction for the current shield state.
 * Returns the configured damageReduction while the shield is active,
 * and 0 when the shield is broken (boss is fully vulnerable).
 */
export function getShieldDamageReduction(state: BossShieldState): number {
  return state.broken ? 0 : state.damageReduction;
}

/**
 * Return true if the shield has been broken (shieldHp reached 0).
 */
export function isShieldBroken(state: BossShieldState): boolean {
  return state.broken;
}

/**
 * Get the shield health as a 0.0–1.0 ratio for UI display.
 */
export function getShieldHpRatio(state: BossShieldState): number {
  if (state.maxShieldHp <= 0) return 0;
  return state.shieldHp / state.maxShieldHp;
}
