import { describe, it, expect } from 'vitest';
import {
  getTutorialSteps,
  getTutorialHints,
  isTutorialFinished,
  createTutorialState,
  processTutorialEvent,
  type TutorialState,
} from '../../src/core/TutorialHintCalc';

// === New 4-step system ===

describe('getTutorialSteps', () => {
  it('returns exactly 4 steps', () => {
    expect(getTutorialSteps()).toHaveLength(4);
  });

  it('steps have sequential IDs', () => {
    const steps = getTutorialSteps();
    expect(steps[0].id).toBe('step1_movement');
    expect(steps[1].id).toBe('step2_weapons');
    expect(steps[2].id).toBe('step3_levelup');
    expect(steps[3].id).toBe('step4_supply');
  });

  it('all steps have required fields', () => {
    for (const step of getTutorialSteps()) {
      expect(step.key).toBeTruthy();
      expect(step.trigger).toBeDefined();
      expect(step.dismissCondition).toBeDefined();
      expect(step.timeoutMs).toBeGreaterThan(0);
      expect(step.depth).toBeGreaterThan(0);
    }
  });

  it('step1 is timer-triggered at 500ms', () => {
    const step = getTutorialSteps()[0];
    expect(step.trigger).toEqual({ type: 'timer', delayMs: 500 });
  });

  it('step2 is event-triggered on enemy_killed', () => {
    const step = getTutorialSteps()[1];
    expect(step.trigger).toEqual({ type: 'event', event: 'enemy_killed', threshold: 1 });
  });

  it('step3 is phase-triggered on levelup', () => {
    const step = getTutorialSteps()[2];
    expect(step.trigger).toEqual({ type: 'phase', phase: 'levelup' });
  });

  it('step4 is phase-triggered on shop', () => {
    const step = getTutorialSteps()[3];
    expect(step.trigger).toEqual({ type: 'phase', phase: 'shop' });
  });

  it('steps 1-2 have depth 1500, steps 3-4 have depth 2100', () => {
    const steps = getTutorialSteps();
    expect(steps[0].depth).toBe(1500);
    expect(steps[1].depth).toBe(1500);
    expect(steps[2].depth).toBe(2100);
    expect(steps[3].depth).toBe(2100);
  });

  it('step3 has accentColor true', () => {
    expect(getTutorialSteps()[2].accentColor).toBe(true);
  });

  it('step1 has left-right arrows', () => {
    const step = getTutorialSteps()[0];
    expect(step.showArrows).toBe(true);
    expect(step.arrowDirection).toBe('left-right');
  });

  it('step3 and step4 have down arrows', () => {
    expect(getTutorialSteps()[2].arrowDirection).toBe('down');
    expect(getTutorialSteps()[3].arrowDirection).toBe('down');
  });
});

describe('createTutorialState', () => {
  it('starts at step 0, not showing, not completed', () => {
    const state = createTutorialState();
    expect(state.currentStep).toBe(0);
    expect(state.activeHintShowing).toBe(false);
    expect(state.completed).toBe(false);
    expect(state.killCount).toBe(0);
  });
});

describe('processTutorialEvent — Step 1 (Movement)', () => {
  const steps = getTutorialSteps();

  it('shows step1 when timer reaches 500ms', () => {
    const state = createTutorialState();
    const actions = processTutorialEvent(state, steps, { type: 'timer_elapsed', elapsedMs: 500 });
    expect(actions).toEqual([{ type: 'show_hint', stepIndex: 0 }]);
    expect(state.activeHintShowing).toBe(true);
  });

  it('does NOT show step1 before 500ms', () => {
    const state = createTutorialState();
    const actions = processTutorialEvent(state, steps, { type: 'timer_elapsed', elapsedMs: 300 });
    expect(actions).toHaveLength(0);
  });

  it('dismisses step1 on drag_horizontal', () => {
    const state = createTutorialState();
    processTutorialEvent(state, steps, { type: 'timer_elapsed', elapsedMs: 500 });
    const actions = processTutorialEvent(state, steps, { type: 'drag_horizontal' });
    expect(actions).toEqual([{ type: 'dismiss_hint', stepIndex: 0 }]);
    expect(state.currentStep).toBe(1);
    expect(state.activeHintShowing).toBe(false);
  });

  it('dismisses step1 on hint_timeout', () => {
    const state = createTutorialState();
    processTutorialEvent(state, steps, { type: 'timer_elapsed', elapsedMs: 500 });
    const actions = processTutorialEvent(state, steps, { type: 'hint_timeout' });
    expect(actions).toEqual([{ type: 'dismiss_hint', stepIndex: 0 }]);
    expect(state.currentStep).toBe(1);
  });
});

describe('processTutorialEvent — Step 2 (Weapons)', () => {
  const steps = getTutorialSteps();

  function advanceToStep2(): TutorialState {
    const state = createTutorialState();
    processTutorialEvent(state, steps, { type: 'timer_elapsed', elapsedMs: 500 });
    processTutorialEvent(state, steps, { type: 'hint_timeout' });
    return state;
  }

  it('shows step2 on first enemy kill', () => {
    const state = advanceToStep2();
    const actions = processTutorialEvent(state, steps, { type: 'enemy_killed' });
    expect(actions).toEqual([{ type: 'show_hint', stepIndex: 1 }]);
  });

  it('dismisses step2 when kill count reaches 4', () => {
    const state = advanceToStep2();
    processTutorialEvent(state, steps, { type: 'enemy_killed' }); // kill 1 -> shows hint
    processTutorialEvent(state, steps, { type: 'enemy_killed' }); // kill 2
    processTutorialEvent(state, steps, { type: 'enemy_killed' }); // kill 3
    const actions = processTutorialEvent(state, steps, { type: 'enemy_killed' }); // kill 4 -> dismiss
    expect(actions).toEqual([{ type: 'dismiss_hint', stepIndex: 1 }]);
    expect(state.currentStep).toBe(2);
  });

  it('dismisses step2 on timeout', () => {
    const state = advanceToStep2();
    processTutorialEvent(state, steps, { type: 'enemy_killed' }); // shows
    const actions = processTutorialEvent(state, steps, { type: 'hint_timeout' });
    expect(actions).toEqual([{ type: 'dismiss_hint', stepIndex: 1 }]);
    expect(state.currentStep).toBe(2);
  });
});

describe('processTutorialEvent — Step 3 (Level Up)', () => {
  const steps = getTutorialSteps();

  function advanceToStep3(): TutorialState {
    const state = createTutorialState();
    processTutorialEvent(state, steps, { type: 'timer_elapsed', elapsedMs: 500 });
    processTutorialEvent(state, steps, { type: 'hint_timeout' }); // dismiss step1
    processTutorialEvent(state, steps, { type: 'enemy_killed' }); // trigger step2
    processTutorialEvent(state, steps, { type: 'hint_timeout' }); // dismiss step2
    return state;
  }

  it('shows step3 when phase changes to levelup', () => {
    const state = advanceToStep3();
    const actions = processTutorialEvent(state, steps, { type: 'phase_change', phase: 'levelup' });
    expect(actions).toEqual([{ type: 'show_hint', stepIndex: 2 }]);
  });

  it('does NOT show step3 on non-levelup phase', () => {
    const state = advanceToStep3();
    const actions = processTutorialEvent(state, steps, { type: 'phase_change', phase: 'playing' });
    expect(actions).toHaveLength(0);
  });

  it('dismisses step3 when phase exits levelup', () => {
    const state = advanceToStep3();
    processTutorialEvent(state, steps, { type: 'phase_change', phase: 'levelup' }); // shows
    const actions = processTutorialEvent(state, steps, { type: 'phase_change', phase: 'playing' }); // exits
    expect(actions).toEqual([{ type: 'dismiss_hint', stepIndex: 2 }]);
    expect(state.currentStep).toBe(3);
  });
});

describe('processTutorialEvent — Step 4 (Supply) + Completion', () => {
  const steps = getTutorialSteps();

  function advanceToStep4(): TutorialState {
    const state = createTutorialState();
    processTutorialEvent(state, steps, { type: 'timer_elapsed', elapsedMs: 500 });
    processTutorialEvent(state, steps, { type: 'hint_timeout' });
    processTutorialEvent(state, steps, { type: 'enemy_killed' });
    processTutorialEvent(state, steps, { type: 'hint_timeout' });
    processTutorialEvent(state, steps, { type: 'phase_change', phase: 'levelup' });
    processTutorialEvent(state, steps, { type: 'phase_change', phase: 'playing' });
    return state;
  }

  it('shows step4 when phase changes to shop', () => {
    const state = advanceToStep4();
    const actions = processTutorialEvent(state, steps, { type: 'phase_change', phase: 'shop' });
    expect(actions).toEqual([{ type: 'show_hint', stepIndex: 3 }]);
  });

  it('dismisses step4 and completes tutorial on phase exit', () => {
    const state = advanceToStep4();
    processTutorialEvent(state, steps, { type: 'phase_change', phase: 'shop' }); // shows
    const actions = processTutorialEvent(state, steps, { type: 'phase_change', phase: 'playing' }); // exits
    expect(actions).toEqual([{ type: 'dismiss_hint', stepIndex: 3 }, { type: 'complete' }]);
    expect(state.completed).toBe(true);
    expect(state.currentStep).toBe(4);
  });

  it('no actions after completion', () => {
    const state = advanceToStep4();
    processTutorialEvent(state, steps, { type: 'phase_change', phase: 'shop' });
    processTutorialEvent(state, steps, { type: 'phase_change', phase: 'playing' }); // completes
    const actions = processTutorialEvent(state, steps, { type: 'enemy_killed' });
    expect(actions).toHaveLength(0);
  });
});

describe('processTutorialEvent — one hint at a time', () => {
  const steps = getTutorialSteps();

  it('ignores triggers for next step while current hint is showing', () => {
    const state = createTutorialState();
    processTutorialEvent(state, steps, { type: 'timer_elapsed', elapsedMs: 500 }); // showing step1
    // Enemy killed should NOT trigger step2 while step1 is showing
    const actions = processTutorialEvent(state, steps, { type: 'enemy_killed' });
    expect(actions).toHaveLength(0);
  });
});

// === Legacy compatibility ===

describe('getTutorialHints (legacy)', () => {
  it('returns exactly 2 hints', () => {
    const hints = getTutorialHints(1200);
    expect(hints).toHaveLength(2);
  });

  it('first hint is move with arrows', () => {
    const hints = getTutorialHints(1200);
    expect(hints[0].key).toBe('tutorial.move');
    expect(hints[0].showArrows).toBe(true);
  });

  it('second hint is auto_fire without arrows', () => {
    const hints = getTutorialHints(1200);
    expect(hints[1].key).toBe('tutorial.auto_fire');
    expect(hints[1].showArrows).toBe(false);
  });

  it('move hint Y is playerBaseY - 100', () => {
    const hints = getTutorialHints(1000);
    expect(hints[0].y).toBe(900);
  });

  it('hints are ordered by delayMs', () => {
    const hints = getTutorialHints(1200);
    expect(hints[0].delayMs).toBeLessThan(hints[1].delayMs);
  });

  it('hints do not overlap in time', () => {
    const hints = getTutorialHints(1200);
    const firstEnd = hints[0].delayMs + hints[0].durationMs;
    expect(firstEnd).toBeLessThanOrEqual(hints[1].delayMs);
  });
});

describe('isTutorialFinished (legacy)', () => {
  const hints = getTutorialHints(1200);
  const lastEnd = hints[hints.length - 1].delayMs + hints[hints.length - 1].durationMs;

  it('returns false before all hints complete', () => {
    expect(isTutorialFinished(hints, 0)).toBe(false);
    expect(isTutorialFinished(hints, 4000)).toBe(false);
    expect(isTutorialFinished(hints, lastEnd - 1)).toBe(false);
  });

  it('returns true when last hint finishes', () => {
    expect(isTutorialFinished(hints, lastEnd)).toBe(true);
  });

  it('returns true after last hint finishes', () => {
    expect(isTutorialFinished(hints, lastEnd + 1000)).toBe(true);
  });

  it('returns true for empty hints array', () => {
    expect(isTutorialFinished([], 0)).toBe(true);
  });
});
