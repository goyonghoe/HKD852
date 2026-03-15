/**
 * TASK-080: PhaseManager unit tests.
 * Tests the game phase state machine: valid/invalid transitions, listeners,
 * isAny helper, reset, and edge cases.
 *
 * No Phaser imports — PhaseManager is pure TypeScript.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PhaseManager } from '../../src/managers/PhaseManager';
import type { GamePhase } from '../../src/types/game';

const ALL_PHASES: GamePhase[] = ['playing', 'levelup', 'paused', 'gameover', 'shop', 'stage_clear'];

describe('PhaseManager', () => {
  let pm: PhaseManager;

  beforeEach(() => {
    pm = new PhaseManager();
  });

  // ------------------------------------------------------------------
  // Initial state
  // ------------------------------------------------------------------
  describe('initial state', () => {
    it('starts in "playing" phase', () => {
      expect(pm.current).toBe('playing');
    });
  });

  // ------------------------------------------------------------------
  // current getter
  // ------------------------------------------------------------------
  describe('current getter', () => {
    it('returns current phase after transition', () => {
      pm.transition('levelup');
      expect(pm.current).toBe('levelup');
    });

    it('reflects every valid transition', () => {
      pm.transition('shop');
      expect(pm.current).toBe('shop');
      pm.transition('playing');
      expect(pm.current).toBe('playing');
      pm.transition('gameover');
      expect(pm.current).toBe('gameover');
    });
  });

  // ------------------------------------------------------------------
  // reset
  // ------------------------------------------------------------------
  describe('reset', () => {
    it('resets to "playing" from paused', () => {
      pm.transition('paused');
      pm.reset();
      expect(pm.current).toBe('playing');
    });

    it('resets from gameover back to playing', () => {
      pm.transition('gameover');
      pm.reset();
      expect(pm.current).toBe('playing');
    });

    it('resets from levelup', () => {
      pm.transition('levelup');
      pm.reset();
      expect(pm.current).toBe('playing');
    });

    it('resets from shop', () => {
      pm.transition('shop');
      pm.reset();
      expect(pm.current).toBe('playing');
    });

    it('resets from stage_clear', () => {
      pm.transition('stage_clear');
      pm.reset();
      expect(pm.current).toBe('playing');
    });

    it('reset when already playing is idempotent', () => {
      pm.reset();
      expect(pm.current).toBe('playing');
    });
  });

  // ------------------------------------------------------------------
  // Valid transitions from playing
  // ------------------------------------------------------------------
  describe('valid transitions from playing', () => {
    it('playing -> levelup', () => {
      expect(pm.transition('levelup')).toBe(true);
      expect(pm.current).toBe('levelup');
    });

    it('playing -> paused', () => {
      expect(pm.transition('paused')).toBe(true);
      expect(pm.current).toBe('paused');
    });

    it('playing -> gameover', () => {
      expect(pm.transition('gameover')).toBe(true);
      expect(pm.current).toBe('gameover');
    });

    it('playing -> shop', () => {
      expect(pm.transition('shop')).toBe(true);
      expect(pm.current).toBe('shop');
    });

    it('playing -> stage_clear', () => {
      expect(pm.transition('stage_clear')).toBe(true);
      expect(pm.current).toBe('stage_clear');
    });
  });

  // ------------------------------------------------------------------
  // Valid transitions from levelup
  // ------------------------------------------------------------------
  describe('valid transitions from levelup', () => {
    beforeEach(() => {
      pm.transition('levelup');
    });

    it('levelup -> playing', () => {
      expect(pm.transition('playing')).toBe(true);
      expect(pm.current).toBe('playing');
    });

    it('levelup -> gameover', () => {
      expect(pm.transition('gameover')).toBe(true);
      expect(pm.current).toBe('gameover');
    });
  });

  // ------------------------------------------------------------------
  // Valid transitions from paused
  // ------------------------------------------------------------------
  describe('valid transitions from paused', () => {
    beforeEach(() => {
      pm.transition('paused');
    });

    it('paused -> playing', () => {
      expect(pm.transition('playing')).toBe(true);
      expect(pm.current).toBe('playing');
    });
  });

  // ------------------------------------------------------------------
  // Valid transitions from shop
  // ------------------------------------------------------------------
  describe('valid transitions from shop', () => {
    beforeEach(() => {
      pm.transition('shop');
    });

    it('shop -> playing', () => {
      expect(pm.transition('playing')).toBe(true);
      expect(pm.current).toBe('playing');
    });
  });

  // ------------------------------------------------------------------
  // Valid transitions from stage_clear
  // ------------------------------------------------------------------
  describe('valid transitions from stage_clear', () => {
    beforeEach(() => {
      pm.transition('stage_clear');
    });

    it('stage_clear -> playing', () => {
      expect(pm.transition('playing')).toBe(true);
      expect(pm.current).toBe('playing');
    });

    it('stage_clear -> shop', () => {
      expect(pm.transition('shop')).toBe(true);
      expect(pm.current).toBe('shop');
    });

    it('stage_clear -> gameover', () => {
      expect(pm.transition('gameover')).toBe(true);
      expect(pm.current).toBe('gameover');
    });
  });

  // ------------------------------------------------------------------
  // Same-state no-op transitions
  // ------------------------------------------------------------------
  describe('same-state transitions (no-op)', () => {
    it('playing -> playing returns true', () => {
      expect(pm.transition('playing')).toBe(true);
      expect(pm.current).toBe('playing');
    });

    it('gameover -> gameover returns true', () => {
      pm.transition('gameover');
      expect(pm.transition('gameover')).toBe(true);
      expect(pm.current).toBe('gameover');
    });

    it('shop -> shop returns true', () => {
      pm.transition('shop');
      expect(pm.transition('shop')).toBe(true);
      expect(pm.current).toBe('shop');
    });
  });

  // ------------------------------------------------------------------
  // Invalid/rejected transitions
  // ------------------------------------------------------------------
  describe('invalid transitions', () => {
    it('paused -> levelup rejected', () => {
      pm.transition('paused');
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(pm.transition('levelup')).toBe(false);
      expect(pm.current).toBe('paused');
      warnSpy.mockRestore();
    });

    it('paused -> gameover rejected', () => {
      pm.transition('paused');
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(pm.transition('gameover')).toBe(false);
      expect(pm.current).toBe('paused');
      warnSpy.mockRestore();
    });

    it('paused -> shop rejected', () => {
      pm.transition('paused');
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(pm.transition('shop')).toBe(false);
      expect(pm.current).toBe('paused');
      warnSpy.mockRestore();
    });

    it('paused -> stage_clear rejected', () => {
      pm.transition('paused');
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(pm.transition('stage_clear')).toBe(false);
      expect(pm.current).toBe('paused');
      warnSpy.mockRestore();
    });

    it('gameover has no valid outgoing transitions', () => {
      pm.transition('gameover');
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const others: GamePhase[] = ['playing', 'levelup', 'paused', 'shop', 'stage_clear'];
      for (const phase of others) {
        expect(pm.transition(phase)).toBe(false);
        expect(pm.current).toBe('gameover');
      }
      warnSpy.mockRestore();
    });

    it('levelup -> paused rejected', () => {
      pm.transition('levelup');
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(pm.transition('paused')).toBe(false);
      expect(pm.current).toBe('levelup');
      warnSpy.mockRestore();
    });

    it('levelup -> shop rejected', () => {
      pm.transition('levelup');
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(pm.transition('shop')).toBe(false);
      expect(pm.current).toBe('levelup');
      warnSpy.mockRestore();
    });

    it('levelup -> stage_clear rejected', () => {
      pm.transition('levelup');
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(pm.transition('stage_clear')).toBe(false);
      expect(pm.current).toBe('levelup');
      warnSpy.mockRestore();
    });

    it('shop -> levelup rejected', () => {
      pm.transition('shop');
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(pm.transition('levelup')).toBe(false);
      expect(pm.current).toBe('shop');
      warnSpy.mockRestore();
    });

    it('shop -> paused rejected', () => {
      pm.transition('shop');
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(pm.transition('paused')).toBe(false);
      expect(pm.current).toBe('shop');
      warnSpy.mockRestore();
    });

    it('shop -> gameover rejected', () => {
      pm.transition('shop');
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(pm.transition('gameover')).toBe(false);
      expect(pm.current).toBe('shop');
      warnSpy.mockRestore();
    });

    it('shop -> stage_clear rejected', () => {
      pm.transition('shop');
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(pm.transition('stage_clear')).toBe(false);
      expect(pm.current).toBe('shop');
      warnSpy.mockRestore();
    });

    it('stage_clear -> levelup rejected', () => {
      pm.transition('stage_clear');
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(pm.transition('levelup')).toBe(false);
      expect(pm.current).toBe('stage_clear');
      warnSpy.mockRestore();
    });

    it('stage_clear -> paused rejected', () => {
      pm.transition('stage_clear');
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(pm.transition('paused')).toBe(false);
      expect(pm.current).toBe('stage_clear');
      warnSpy.mockRestore();
    });

    it('rejected transition logs console.warn', () => {
      pm.transition('paused');
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      pm.transition('shop');
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('paused'));
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('shop'));
      warnSpy.mockRestore();
    });
  });

  // ------------------------------------------------------------------
  // Listener callbacks
  // ------------------------------------------------------------------
  describe('listeners', () => {
    it('fires listener on valid transition with (from, to) args', () => {
      const spy = vi.fn();
      pm.onTransition(spy);
      pm.transition('levelup');
      expect(spy).toHaveBeenCalledWith('playing', 'levelup');
    });

    it('does not fire listener on same-state no-op', () => {
      const spy = vi.fn();
      pm.onTransition(spy);
      pm.transition('playing');
      expect(spy).not.toHaveBeenCalled();
    });

    it('does not fire listener on rejected transition', () => {
      pm.transition('paused');
      const spy = vi.fn();
      pm.onTransition(spy);
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      pm.transition('gameover');
      expect(spy).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('fires multiple listeners in registration order', () => {
      const order: number[] = [];
      pm.onTransition(() => order.push(1));
      pm.onTransition(() => order.push(2));
      pm.onTransition(() => order.push(3));
      pm.transition('levelup');
      expect(order).toEqual([1, 2, 3]);
    });

    it('clearListeners removes all listeners', () => {
      const spy = vi.fn();
      pm.onTransition(spy);
      pm.clearListeners();
      pm.transition('levelup');
      expect(spy).not.toHaveBeenCalled();
    });

    it('listener fires on each valid transition', () => {
      const calls: [GamePhase, GamePhase][] = [];
      pm.onTransition((from, to) => calls.push([from, to]));
      pm.transition('levelup');
      pm.transition('playing');
      pm.transition('shop');
      expect(calls).toEqual([
        ['playing', 'levelup'],
        ['levelup', 'playing'],
        ['playing', 'shop'],
      ]);
    });
  });

  // ------------------------------------------------------------------
  // isAny helper
  // ------------------------------------------------------------------
  describe('isAny', () => {
    it('returns true when current is in the argument list', () => {
      expect(pm.isAny('playing', 'paused')).toBe(true);
    });

    it('returns false when current is not in the argument list', () => {
      expect(pm.isAny('paused', 'gameover')).toBe(false);
    });

    it('returns true with single matching arg', () => {
      pm.transition('gameover');
      expect(pm.isAny('gameover')).toBe(true);
    });

    it('returns false with single non-matching arg', () => {
      expect(pm.isAny('gameover')).toBe(false);
    });

    it('works correctly after transition', () => {
      pm.transition('shop');
      expect(pm.isAny('shop', 'stage_clear')).toBe(true);
      expect(pm.isAny('playing', 'levelup')).toBe(false);
    });

    it('checks all 6 phases correctly', () => {
      for (const phase of ALL_PHASES) {
        const fresh = new PhaseManager();
        if (phase !== 'playing') {
          // Reset and force via internal knowledge
          fresh.transition(
            phase === 'levelup' ||
              phase === 'paused' ||
              phase === 'gameover' ||
              phase === 'shop' ||
              phase === 'stage_clear'
              ? phase
              : 'playing',
          );
        }
        // After potentially transitioning, check isAny
        expect(fresh.isAny(fresh.current)).toBe(true);
      }
    });
  });

  // ------------------------------------------------------------------
  // Transition chains (multi-step sequences)
  // ------------------------------------------------------------------
  describe('transition chains', () => {
    it('playing -> levelup -> playing -> shop -> playing -> gameover', () => {
      expect(pm.transition('levelup')).toBe(true);
      expect(pm.transition('playing')).toBe(true);
      expect(pm.transition('shop')).toBe(true);
      expect(pm.transition('playing')).toBe(true);
      expect(pm.transition('gameover')).toBe(true);
      expect(pm.current).toBe('gameover');
    });

    it('playing -> stage_clear -> shop -> playing -> paused -> playing', () => {
      expect(pm.transition('stage_clear')).toBe(true);
      expect(pm.transition('shop')).toBe(true);
      expect(pm.transition('playing')).toBe(true);
      expect(pm.transition('paused')).toBe(true);
      expect(pm.transition('playing')).toBe(true);
      expect(pm.current).toBe('playing');
    });

    it('playing -> stage_clear -> gameover (boss dies, game ends)', () => {
      expect(pm.transition('stage_clear')).toBe(true);
      expect(pm.transition('gameover')).toBe(true);
      expect(pm.current).toBe('gameover');
    });

    it('playing -> levelup -> gameover (die during level-up)', () => {
      expect(pm.transition('levelup')).toBe(true);
      expect(pm.transition('gameover')).toBe(true);
      expect(pm.current).toBe('gameover');
    });
  });
});
