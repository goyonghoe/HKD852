/**
 * ChronoHackCalc — pure TypeScript Chrono Hack (크로노 핵) slow-mo system.
 * NO Phaser imports. Immutable state management.
 *
 * Handles gauge charging, activation, time scaling, and combat bonuses.
 */

import { CHRONO_HACK } from "../config/balance";

// ─── Interfaces ───────────────────────────────────────────────

export interface ChronoState {
  readonly gauge: number; // 0 to maxGauge
  readonly active: boolean;
  readonly remainingMs: number; // 0 when inactive
  readonly hasPassive: boolean; // Chrono Overclock passive
}

export interface ChronoActiveState extends ChronoState {
  readonly active: true;
  readonly remainingMs: number; // > 0 when active
}

// ─── Factory ──────────────────────────────────────────────────

export function createChronoState(hasPassive: boolean = false): ChronoState {
  return {
    gauge: 0,
    active: false,
    remainingMs: 0,
    hasPassive,
  };
}

// ─── Gauge Charging ───────────────────────────────────────────

/**
 * Add charge to the gauge based on enemy type.
 * Passive bonus increases charge rate by 20%.
 * Caps at maxGauge.
 */
export function chargeGauge(
  currentGauge: number,
  enemyType: "normal" | "elite" | "boss",
  hasPassive: boolean,
): number {
  let charge: number;
  switch (enemyType) {
    case "normal":
      charge = CHRONO_HACK.chargePerKill;
      break;
    case "elite":
      charge = CHRONO_HACK.chargePerEliteKill;
      break;
    case "boss":
      charge = CHRONO_HACK.chargePerBossKill;
      break;
  }

  if (hasPassive) {
    charge *= 1 + CHRONO_HACK.passiveBonus.chargeBoost;
  }

  return Math.min(currentGauge + charge, CHRONO_HACK.maxGauge);
}

// ─── Activation ───────────────────────────────────────────────

/**
 * Check if the gauge is full enough to activate.
 */
export function canActivate(gauge: number): boolean {
  return gauge >= CHRONO_HACK.maxGauge;
}

/**
 * Activate Chrono Hack — enter slow-mo state.
 * Returns the active state with timer set.
 */
export function activate(state: ChronoState): ChronoActiveState {
  if (!canActivate(state.gauge)) {
    throw new Error("Cannot activate Chrono Hack: gauge not full");
  }

  const duration =
    CHRONO_HACK.durationMs +
    (state.hasPassive ? CHRONO_HACK.passiveBonus.extraDurationMs : 0);

  return {
    ...state,
    active: true,
    remainingMs: duration,
    gauge: state.gauge, // gauge stays at max during active, resets on deactivate
  };
}

// ─── Tick ─────────────────────────────────────────────────────

/**
 * Tick the Chrono Hack timer. Auto-deactivates when timer reaches 0.
 */
export function tickChrono(
  state: ChronoActiveState,
  deltaMs: number,
): ChronoState {
  const newRemaining = state.remainingMs - deltaMs;

  if (newRemaining <= 0) {
    return deactivate(state);
  }

  return {
    ...state,
    remainingMs: newRemaining,
  };
}

// ─── State Queries ────────────────────────────────────────────

/**
 * Check if Chrono Hack is currently active.
 */
export function isActive(state: ChronoState): boolean {
  return state.active && state.remainingMs > 0;
}

/**
 * Get the current game time scale.
 * Returns gameSpeedDuring (0.3) when active, 1.0 otherwise.
 */
export function getTimeScale(state: ChronoState): number {
  return isActive(state) ? CHRONO_HACK.gameSpeedDuring : 1.0;
}

/**
 * Get player speed multiplier.
 * Player moves at normal speed during Chrono Hack (unaffected by slow-mo).
 */
export function getPlayerSpeedMultiplier(state: ChronoState): number {
  return isActive(state) ? CHRONO_HACK.playerSpeedMultiplier : 1.0;
}

/**
 * Get damage multiplier during Chrono Hack.
 */
export function getDamageMultiplier(state: ChronoState): number {
  return isActive(state) ? CHRONO_HACK.damageMultiplier : 1.0;
}

/**
 * Get critical chance bonus during Chrono Hack.
 */
export function getCritBonus(state: ChronoState): number {
  return isActive(state) ? CHRONO_HACK.critChanceBonus : 0;
}

// ─── Deactivation ─────────────────────────────────────────────

/**
 * Deactivate Chrono Hack — reset gauge to 0.
 */
export function deactivate(state: ChronoActiveState): ChronoState {
  return {
    ...state,
    active: false,
    remainingMs: 0,
    gauge: 0, // gauge resets to 0 after use
  };
}

// ─── Neon Synergy ─────────────────────────────────────────────

/**
 * Get the fragment lifetime freeze multiplier during Chrono Hack.
 *
 * During an active Chrono Hack, fragment timers on the field are paused
 * (multiplier = 0 means the lifetime counter should NOT advance).
 * When inactive, fragments age normally (multiplier = 1).
 *
 * Usage: newFragmentAge = currentAge + deltaMs * getFragmentFreezeMultiplier(state)
 */
export function getFragmentFreezeMultiplier(state: ChronoState): number {
  return isActive(state) ? 0 : 1;
}

/**
 * Get the bonus combo meter charge rate during Chrono Hack.
 *
 * While Chrono Hack is active the combo meter (e.g. kill-streak counter
 * used to earn bonus fragments) fills 1.5× faster.
 * Returns 1.5 when active, 1.0 when inactive.
 */
export function getComboMeterBonus(state: ChronoState): number {
  return isActive(state) ? CHRONO_HACK.comboMeterBonus : 1.0;
}
