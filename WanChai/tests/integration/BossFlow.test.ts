/**
 * TASK-062: Integration test for Boss Clear serialization flow (M-014).
 * Tests the critical interaction between:
 *   - Boss death → pendingStageClear flag
 *   - Level-up UI → applyUpgrade → phase transitions
 *   - showStageClear guard logic
 *   - PhaseManager state machine
 *
 * Pure TypeScript + mocking — no Phaser imports.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PhaseManager } from '../../src/managers/PhaseManager';

// ── Mock Phase State Machine ─────────────────────────────────────────────────

/**
 * Simulates the ProgressionManager boss-clear flow using real PhaseManager.
 */
class BossClearFlowSimulator {
  phaseManager = new PhaseManager();
  pendingStageClear = false;
  pendingLevelUps = 0;
  showStageClearCalled = false;
  showLevelUpUICalled = false;
  onRunCompleteCalled = false;
  stageClearCount = 0;
  currentStage = 3;
  maxStages = 10;

  /** Simulates boss death event (sets pendingStageClear, may trigger levelup). */
  onBossDeath(triggersLevelUp: boolean): void {
    this.pendingStageClear = true;
    if (triggersLevelUp) {
      this.pendingLevelUps++;
      this.showLevelUpUI();
    } else {
      // No levelup — go directly to stage clear
      this.scheduleStageClear();
    }
  }

  /** Simulates showLevelUpUI (mirrors ProgressionManager.showLevelUpUI). */
  showLevelUpUI(): void {
    this.showLevelUpUICalled = true;
    this.phaseManager.transition('levelup');
  }

  /** Simulates applyUpgrade (mirrors ProgressionManager.applyUpgrade). */
  applyUpgrade(): void {
    this.pendingLevelUps--;

    // Check for more pending level-ups
    if (this.pendingLevelUps > 0) {
      this.showLevelUpUI();
      return;
    }

    // All level-ups resolved. Check pending stage clear (M-014 fix).
    if (this.pendingStageClear) {
      this.pendingStageClear = false;
      this.phaseManager.transition('playing');
      // Delayed call equivalent — immediately call for test
      this.scheduleStageClearAfterDelay();
      return;
    }

    this.phaseManager.transition('playing');
  }

  /** Simulates the delayed call that fires showStageClear. */
  private scheduleStageClearAfterDelay(): void {
    if (this.phaseManager.current === 'gameover') return;
    if (this.currentStage < this.maxStages) {
      this.showStageClear();
    } else {
      this.onRunComplete(true);
    }
  }

  /** Direct path to stage clear (no levelup in between). */
  private scheduleStageClear(): void {
    this.pendingStageClear = false;
    this.phaseManager.transition('playing');
    this.scheduleStageClearAfterDelay();
  }

  /** Simulates showStageClear with phase guard (mirrors ProgressionManager.showStageClear). */
  showStageClear(): void {
    if (this.phaseManager.isAny('stage_clear', 'levelup', 'gameover')) return;
    this.phaseManager.transition('stage_clear');
    this.showStageClearCalled = true;
    this.stageClearCount++;
  }

  /** Simulates run completion. */
  onRunComplete(_survived: boolean): void {
    if (this.phaseManager.current === 'gameover') return;
    this.phaseManager.transition('gameover');
    this.onRunCompleteCalled = true;
  }

  /** Simulates nextStage (player clicks continue on stage clear screen). */
  nextStage(): void {
    this.currentStage++;
    this.pendingStageClear = false;
    this.phaseManager.transition('playing');
  }
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('TASK-062: Boss clear + levelup serialization (M-014)', () => {
  let sim: BossClearFlowSimulator;

  beforeEach(() => {
    sim = new BossClearFlowSimulator();
  });

  it('boss death + simultaneous levelup: levelup shown first', () => {
    sim.onBossDeath(true);
    expect(sim.phaseManager.current).toBe('levelup');
    expect(sim.showLevelUpUICalled).toBe(true);
    expect(sim.pendingStageClear).toBe(true);
  });

  it('after applyUpgrade with pending stage clear: phase goes to playing then stage_clear', () => {
    sim.onBossDeath(true);
    sim.applyUpgrade();
    expect(sim.pendingStageClear).toBe(false);
    expect(sim.showStageClearCalled).toBe(true);
    expect(sim.phaseManager.current).toBe('stage_clear');
  });

  it('boss death without levelup: direct stage_clear', () => {
    sim.onBossDeath(false);
    expect(sim.showStageClearCalled).toBe(true);
    expect(sim.phaseManager.current).toBe('stage_clear');
    expect(sim.pendingStageClear).toBe(false);
  });

  it('multiple level-ups resolve before stage clear', () => {
    sim.pendingStageClear = true;
    sim.pendingLevelUps = 3;
    sim.phaseManager.transition('levelup');

    // Apply 3 upgrades
    sim.applyUpgrade(); // pendingLevelUps: 2 → shows another levelup
    expect(sim.phaseManager.current).toBe('levelup');
    sim.applyUpgrade(); // pendingLevelUps: 1 → shows another levelup
    expect(sim.phaseManager.current).toBe('levelup');
    sim.applyUpgrade(); // pendingLevelUps: 0 → triggers stage clear
    expect(sim.showStageClearCalled).toBe(true);
    expect(sim.phaseManager.current).toBe('stage_clear');
  });

  it('duplicate showStageClear guard: phase already stage_clear', () => {
    sim.onBossDeath(false);
    expect(sim.stageClearCount).toBe(1);
    // Try to show stage clear again — should be blocked by isAny guard
    sim.showStageClear();
    expect(sim.stageClearCount).toBe(1); // no duplicate
  });

  it('showStageClear guard blocks during levelup phase', () => {
    sim.phaseManager.transition('levelup');
    sim.showStageClear();
    expect(sim.showStageClearCalled).toBe(false);
    expect(sim.phaseManager.current).toBe('levelup');
  });

  it('showStageClear guard blocks during gameover phase', () => {
    sim.phaseManager.transition('gameover');
    sim.showStageClear();
    expect(sim.showStageClearCalled).toBe(false);
  });

  it('final stage boss clear triggers onRunComplete instead of stage clear', () => {
    sim.currentStage = 10;
    sim.maxStages = 10;
    sim.onBossDeath(false);
    expect(sim.onRunCompleteCalled).toBe(true);
    expect(sim.showStageClearCalled).toBe(false);
    expect(sim.phaseManager.current).toBe('gameover');
  });

  it('final stage with levelup: resolves levelup then run complete', () => {
    sim.currentStage = 10;
    sim.maxStages = 10;
    sim.onBossDeath(true);
    expect(sim.phaseManager.current).toBe('levelup');
    sim.applyUpgrade();
    expect(sim.onRunCompleteCalled).toBe(true);
    expect(sim.phaseManager.current).toBe('gameover');
  });

  it('nextStage resets phase to playing and increments stage', () => {
    sim.onBossDeath(false);
    expect(sim.phaseManager.current).toBe('stage_clear');
    sim.nextStage();
    expect(sim.phaseManager.current).toBe('playing');
    expect(sim.currentStage).toBe(4);
  });
});

describe('TASK-062: PhaseManager valid transitions', () => {
  let pm: PhaseManager;

  beforeEach(() => {
    pm = new PhaseManager();
  });

  it('starts in playing phase', () => {
    expect(pm.current).toBe('playing');
  });

  it('playing → levelup is valid', () => {
    expect(pm.transition('levelup')).toBe(true);
    expect(pm.current).toBe('levelup');
  });

  it('levelup → playing is valid', () => {
    pm.transition('levelup');
    expect(pm.transition('playing')).toBe(true);
    expect(pm.current).toBe('playing');
  });

  it('levelup → gameover is valid', () => {
    pm.transition('levelup');
    expect(pm.transition('gameover')).toBe(true);
  });

  it('levelup → stage_clear is INVALID', () => {
    pm.transition('levelup');
    expect(pm.transition('stage_clear')).toBe(false);
    expect(pm.current).toBe('levelup');
  });

  it('playing → stage_clear is valid', () => {
    expect(pm.transition('stage_clear')).toBe(true);
    expect(pm.current).toBe('stage_clear');
  });

  it('stage_clear → playing is valid', () => {
    pm.transition('stage_clear');
    expect(pm.transition('playing')).toBe(true);
  });

  it('gameover is terminal (no outgoing transitions)', () => {
    pm.transition('gameover');
    expect(pm.transition('playing')).toBe(false);
    expect(pm.transition('levelup')).toBe(false);
    expect(pm.current).toBe('gameover');
  });

  it('isAny returns true when current phase matches', () => {
    pm.transition('levelup');
    expect(pm.isAny('levelup', 'gameover')).toBe(true);
    expect(pm.isAny('playing', 'stage_clear')).toBe(false);
  });

  it('reset returns to playing', () => {
    pm.transition('gameover');
    pm.reset();
    expect(pm.current).toBe('playing');
  });

  it('transition listener fires on valid transition', () => {
    const listener = vi.fn();
    pm.onTransition(listener);
    pm.transition('levelup');
    expect(listener).toHaveBeenCalledWith('playing', 'levelup');
  });

  it('transition listener does not fire on invalid transition', () => {
    const listener = vi.fn();
    pm.onTransition(listener);
    pm.transition('gameover');
    pm.transition('playing'); // invalid from gameover
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
