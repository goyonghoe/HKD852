import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PhaseManager } from '../../src/managers/PhaseManager';
import type { GamePhase } from '../../src/types/game';

describe('PhaseManager', () => {
  let pm: PhaseManager;

  beforeEach(() => {
    pm = new PhaseManager();
  });

  describe('initial state', () => {
    it('starts in "playing" phase', () => {
      expect(pm.current).toBe('playing');
    });
  });

  describe('reset', () => {
    it('resets to "playing" from any state', () => {
      pm.transition('paused');
      expect(pm.current).toBe('paused');
      pm.reset();
      expect(pm.current).toBe('playing');
    });

    it('reset from gameover back to playing', () => {
      pm.transition('gameover');
      pm.reset();
      expect(pm.current).toBe('playing');
    });
  });

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

  describe('valid transitions from paused', () => {
    beforeEach(() => {
      pm.transition('paused');
    });

    it('paused -> playing', () => {
      expect(pm.transition('playing')).toBe(true);
      expect(pm.current).toBe('playing');
    });
  });

  describe('valid transitions from shop', () => {
    beforeEach(() => {
      pm.transition('shop');
    });

    it('shop -> playing', () => {
      expect(pm.transition('playing')).toBe(true);
      expect(pm.current).toBe('playing');
    });
  });

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

  describe('invalid transitions', () => {
    it('playing -> playing (same state) returns true as no-op', () => {
      expect(pm.transition('playing')).toBe(true);
      expect(pm.current).toBe('playing');
    });

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

    it('gameover has no valid transitions', () => {
      pm.transition('gameover');
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const phases: GamePhase[] = ['playing', 'levelup', 'paused', 'shop', 'stage_clear'];
      for (const phase of phases) {
        expect(pm.transition(phase)).toBe(false);
        expect(pm.current).toBe('gameover');
      }
      warnSpy.mockRestore();
    });

    it('gameover -> gameover (same state) returns true as no-op', () => {
      pm.transition('gameover');
      expect(pm.transition('gameover')).toBe(true);
      expect(pm.current).toBe('gameover');
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

    it('shop -> stage_clear rejected', () => {
      pm.transition('shop');
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(pm.transition('stage_clear')).toBe(false);
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
  });

  describe('listeners', () => {
    it('fires listener on valid transition', () => {
      const spy = vi.fn();
      pm.onTransition(spy);
      pm.transition('levelup');
      expect(spy).toHaveBeenCalledWith('playing', 'levelup');
    });

    it('does not fire listener on same-state no-op', () => {
      const spy = vi.fn();
      pm.onTransition(spy);
      pm.transition('playing'); // same state
      expect(spy).not.toHaveBeenCalled();
    });

    it('does not fire listener on rejected transition', () => {
      const spy = vi.fn();
      pm.transition('paused');
      pm.onTransition(spy);
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      pm.transition('gameover'); // invalid from paused
      expect(spy).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('fires multiple listeners in order', () => {
      const order: number[] = [];
      pm.onTransition(() => order.push(1));
      pm.onTransition(() => order.push(2));
      pm.transition('levelup');
      expect(order).toEqual([1, 2]);
    });

    it('clearListeners removes all listeners', () => {
      const spy = vi.fn();
      pm.onTransition(spy);
      pm.clearListeners();
      pm.transition('levelup');
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('isAny', () => {
    it('returns true when current is in the list', () => {
      expect(pm.isAny('playing', 'paused')).toBe(true);
    });

    it('returns false when current is not in the list', () => {
      expect(pm.isAny('paused', 'gameover')).toBe(false);
    });

    it('returns true with single matching arg', () => {
      pm.transition('gameover');
      expect(pm.isAny('gameover')).toBe(true);
    });

    it('works after transition', () => {
      pm.transition('shop');
      expect(pm.isAny('shop', 'stage_clear')).toBe(true);
      expect(pm.isAny('playing', 'levelup')).toBe(false);
    });
  });

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
  });
});
