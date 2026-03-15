import type { GamePhase } from '../types/game';

/**
 * Valid phase transitions (TASK-022).
 * Only transitions listed here are permitted.
 */
const VALID_TRANSITIONS: Record<GamePhase, readonly GamePhase[]> = {
  playing: ['levelup', 'paused', 'gameover', 'shop', 'stage_clear'],
  levelup: ['playing', 'gameover'],
  paused: ['playing'],
  gameover: [],
  shop: ['playing'],
  stage_clear: ['playing', 'shop', 'gameover'],
} as const;

export type PhaseListener = (from: GamePhase, to: GamePhase) => void;

/**
 * Formal state machine for game phases.
 * Enforces valid transitions only and emits events on change.
 */
export class PhaseManager {
  private _current: GamePhase = 'playing';
  private listeners: PhaseListener[] = [];

  get current(): GamePhase {
    return this._current;
  }

  /** Reset to initial state (call in create()). */
  reset(): void {
    this._current = 'playing';
  }

  /**
   * Attempt a phase transition.
   * @returns true if transition was valid and applied, false if rejected.
   */
  transition(to: GamePhase): boolean {
    if (this._current === to) return true; // no-op
    const allowed = VALID_TRANSITIONS[this._current];
    if (!allowed.includes(to)) {
      if (typeof console !== 'undefined') {
        console.warn(`[PhaseManager] Invalid transition: ${this._current} → ${to}`);
      }
      return false;
    }
    const from = this._current;
    this._current = to;
    for (const listener of this.listeners) {
      listener(from, to);
    }
    return true;
  }

  /** Register a listener for phase changes. */
  onTransition(listener: PhaseListener): void {
    this.listeners.push(listener);
  }

  /** Remove all listeners. */
  clearListeners(): void {
    this.listeners.length = 0;
  }

  /** Check if currently in one of the given phases. */
  isAny(...phases: GamePhase[]): boolean {
    return phases.includes(this._current);
  }
}
