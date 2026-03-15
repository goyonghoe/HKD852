/**
 * BossPhaseCalc — Pure TypeScript module for boss phase transition logic.
 *
 * TASK-121: Boss Phase Transition System
 * M-001: ZERO Phaser imports. All balance values passed as parameters.
 */

export interface BossPhaseState {
  /** Current phase (1 = normal, 2 = enraged, 3 = desperate) */
  phase: 1 | 2 | 3;
  /** Whether Phase 2 transition has already occurred */
  hasTransitioned: boolean;
  /** Whether Phase 3 transition has already occurred */
  hasTransitionedP3: boolean;
  /** Remaining invulnerability time in ms (0 = vulnerable) */
  invulnerabilityMs: number;
}

export interface BossPhase2Stats {
  /** Multiplier applied to base speed */
  speedMult: number;
  /** Multiplier applied to base damage */
  damageMult: number;
}

/**
 * Create initial boss phase state (Phase 1, no transition).
 */
export function createBossPhaseState(): BossPhaseState {
  return {
    phase: 1,
    hasTransitioned: false,
    hasTransitionedP3: false,
    invulnerabilityMs: 0,
  };
}

/**
 * Check whether the boss should transition to Phase 2.
 * Returns true if HP ratio crossed below threshold and transition hasn't occurred yet.
 */
export function shouldTransitionToPhase2(
  currentHp: number,
  maxHp: number,
  threshold: number,
  hasTransitioned: boolean,
): boolean {
  if (hasTransitioned) return false;
  if (maxHp <= 0) return false;
  return currentHp / maxHp <= threshold;
}

/**
 * Execute phase transition: returns new BossPhaseState with Phase 2 active
 * and invulnerability timer set.
 */
export function transitionToPhase2(invulnerabilityMs: number): BossPhaseState {
  return {
    phase: 2,
    hasTransitioned: true,
    hasTransitionedP3: false,
    invulnerabilityMs,
  };
}

/**
 * Check whether the boss should transition to Phase 3.
 * Returns true if HP ratio crossed below threshold and P3 transition hasn't occurred yet.
 */
export function shouldTransitionToPhase3(
  currentHp: number,
  maxHp: number,
  threshold: number,
  hasTransitionedP3: boolean,
): boolean {
  if (hasTransitionedP3) return false;
  if (maxHp <= 0) return false;
  return currentHp / maxHp <= threshold;
}

/**
 * Execute Phase 3 transition: returns new BossPhaseState with Phase 3 active.
 */
export function transitionToPhase3(prevState: BossPhaseState, invulnerabilityMs: number): BossPhaseState {
  return {
    phase: 3,
    hasTransitioned: prevState.hasTransitioned,
    hasTransitionedP3: true,
    invulnerabilityMs,
  };
}

/**
 * Get Phase 3 stat multipliers for a given boss behavior type.
 * Phase 3 reuses Phase 2 multipliers (speed/damage maintained at elevated levels).
 */
export function getPhase3Stats(
  phase: 1 | 2 | 3,
  behavior: string,
  speedMultMap: Record<string, number>,
  damageMultMap: Record<string, number>,
): BossPhase2Stats {
  if (phase < 3) {
    return { speedMult: 1, damageMult: 1 };
  }
  return {
    speedMult: speedMultMap[behavior] ?? 1,
    damageMult: damageMultMap[behavior] ?? 1,
  };
}

/**
 * Tick the invulnerability timer. Returns updated state.
 */
export function tickInvulnerability(state: BossPhaseState, deltaMs: number): BossPhaseState {
  if (state.invulnerabilityMs <= 0) return state;
  const remaining = state.invulnerabilityMs - deltaMs;
  return {
    ...state,
    invulnerabilityMs: remaining > 0 ? remaining : 0,
  };
}

/**
 * Check if the boss is currently invulnerable (during phase transition).
 */
export function isInvulnerable(state: BossPhaseState): boolean {
  return state.invulnerabilityMs > 0;
}

/**
 * Get Phase 2 stat multipliers for a given boss behavior type.
 * Returns { speedMult: 1, damageMult: 1 } for Phase 1 or unknown types.
 */
export function getPhase2Stats(
  phase: 1 | 2 | 3,
  behavior: string,
  speedMultMap: Record<string, number>,
  damageMultMap: Record<string, number>,
): BossPhase2Stats {
  if (phase === 1) {
    return { speedMult: 1, damageMult: 1 };
  }
  return {
    speedMult: speedMultMap[behavior] ?? 1,
    damageMult: damageMultMap[behavior] ?? 1,
  };
}
