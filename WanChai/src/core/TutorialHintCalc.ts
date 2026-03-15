/**
 * Pure data for tutorial hint scheduling and state management.
 * No Phaser dependency — testable standalone.
 *
 * 4-step progressive tutorial:
 *   Step 1: Movement (timer-triggered)
 *   Step 2: Weapons (first enemy kill)
 *   Step 3: Level Up (first levelup phase)
 *   Step 4: Supply Point (first shop phase)
 */

export interface TutorialHint {
  id: string;
  key: string;
  key2?: string;
  trigger: TutorialTrigger;
  x: number;
  y: number;
  dismissCondition: DismissCondition;
  timeoutMs: number;
  showArrows: boolean;
  arrowDirection?: 'left-right' | 'down';
  accentColor?: boolean;
  depth: number;
}

export type TutorialTrigger =
  | { type: 'timer'; delayMs: number }
  | { type: 'event'; event: string; threshold?: number }
  | { type: 'phase'; phase: string };

export type DismissCondition =
  | { type: 'timer'; durationMs: number }
  | { type: 'event'; event: string }
  | { type: 'input'; action: string }
  | { type: 'phase_exit'; phase: string };

export function getTutorialSteps(): TutorialHint[] {
  return [
    {
      id: 'step1_movement',
      key: 'tutorial.step1_line1',
      key2: 'tutorial.step1_line2',
      trigger: { type: 'timer', delayMs: 500 },
      x: 640,
      y: 540,
      dismissCondition: { type: 'input', action: 'drag_horizontal' },
      timeoutMs: 5000,
      showArrows: true,
      arrowDirection: 'left-right',
      depth: 1500,
    },
    {
      id: 'step2_weapons',
      key: 'tutorial.step2_line1',
      key2: 'tutorial.step2_line2',
      trigger: { type: 'event', event: 'enemy_killed', threshold: 1 },
      x: 640,
      y: 200,
      dismissCondition: { type: 'event', event: 'enemy_killed_count_4' },
      timeoutMs: 5000,
      showArrows: false,
      depth: 1500,
    },
    {
      id: 'step3_levelup',
      key: 'tutorial.step3',
      trigger: { type: 'phase', phase: 'levelup' },
      x: 640,
      y: 180,
      dismissCondition: { type: 'phase_exit', phase: 'levelup' },
      timeoutMs: 8000,
      showArrows: true,
      arrowDirection: 'down',
      accentColor: true,
      depth: 2100,
    },
    {
      id: 'step4_supply',
      key: 'tutorial.step4_line1',
      key2: 'tutorial.step4_line2',
      trigger: { type: 'phase', phase: 'shop' },
      x: 640,
      y: 160,
      dismissCondition: { type: 'phase_exit', phase: 'shop' },
      timeoutMs: 6000,
      showArrows: true,
      arrowDirection: 'down',
      depth: 2100,
    },
  ];
}

/**
 * Tutorial state machine — pure logic, no side effects.
 * Tracks which step is active and processes events to advance.
 */
export interface TutorialState {
  currentStep: number; // 0-3 (index into steps), 4 = all done
  activeHintShowing: boolean;
  killCount: number;
  completed: boolean;
}

export function createTutorialState(): TutorialState {
  return { currentStep: 0, activeHintShowing: false, killCount: 0, completed: false };
}

export type TutorialEvent =
  | { type: 'timer_elapsed'; elapsedMs: number }
  | { type: 'enemy_killed' }
  | { type: 'phase_change'; phase: string }
  | { type: 'drag_horizontal' }
  | { type: 'hint_timeout' }
  | { type: 'hint_dismissed' };

export interface TutorialAction {
  type: 'show_hint' | 'dismiss_hint' | 'complete';
  stepIndex?: number;
}

/**
 * Process a tutorial event and return actions to execute.
 * Pure function — no side effects.
 */
export function processTutorialEvent(
  state: TutorialState,
  steps: TutorialHint[],
  event: TutorialEvent,
): TutorialAction[] {
  if (state.completed || state.currentStep >= steps.length) return [];

  const actions: TutorialAction[] = [];
  const step = steps[state.currentStep];

  // --- Dismiss active hint ---
  if (state.activeHintShowing) {
    let shouldDismiss = false;

    if (event.type === 'hint_timeout') {
      shouldDismiss = true;
    } else if (event.type === 'hint_dismissed') {
      shouldDismiss = true;
    } else {
      switch (step.dismissCondition.type) {
        case 'input':
          if (step.dismissCondition.action === 'drag_horizontal' && event.type === 'drag_horizontal') {
            shouldDismiss = true;
          }
          break;
        case 'event':
          if (step.dismissCondition.event === 'enemy_killed_count_4' && event.type === 'enemy_killed') {
            state.killCount++;
            if (state.killCount >= 4) shouldDismiss = true;
          }
          break;
        case 'phase_exit':
          if (event.type === 'phase_change' && event.phase !== step.dismissCondition.phase) {
            shouldDismiss = true;
          }
          break;
      }
    }

    if (shouldDismiss) {
      actions.push({ type: 'dismiss_hint', stepIndex: state.currentStep });
      state.activeHintShowing = false;
      state.currentStep++;

      if (state.currentStep >= steps.length) {
        state.completed = true;
        actions.push({ type: 'complete' });
      }
    }
    return actions;
  }

  // --- Trigger next hint ---
  const trigger = step.trigger;
  let shouldTrigger = false;

  switch (trigger.type) {
    case 'timer':
      if (event.type === 'timer_elapsed' && event.elapsedMs >= trigger.delayMs) {
        shouldTrigger = true;
      }
      break;
    case 'event':
      if (trigger.event === 'enemy_killed' && event.type === 'enemy_killed') {
        state.killCount++;
        if (state.killCount >= (trigger.threshold ?? 1)) {
          shouldTrigger = true;
        }
      }
      break;
    case 'phase':
      if (event.type === 'phase_change' && event.phase === trigger.phase) {
        shouldTrigger = true;
      }
      break;
  }

  if (shouldTrigger) {
    state.activeHintShowing = true;
    actions.push({ type: 'show_hint', stepIndex: state.currentStep });
  }

  return actions;
}

// --- Legacy compatibility ---

/** @deprecated Use getTutorialSteps() instead */
export function getTutorialHints(
  playerBaseY: number,
): { key: string; delayMs: number; durationMs: number; y: number; showArrows: boolean }[] {
  return [
    { key: 'tutorial.move', delayMs: 500, durationMs: 4000, y: playerBaseY - 100, showArrows: true },
    { key: 'tutorial.auto_fire', delayMs: 5000, durationMs: 3000, y: 500, showArrows: false },
  ];
}

/** @deprecated Use processTutorialEvent() state machine instead */
export function isTutorialFinished(hints: { delayMs: number; durationMs: number }[], elapsedMs: number): boolean {
  if (hints.length === 0) return true;
  const last = hints[hints.length - 1];
  return elapsedMs >= last.delayMs + last.durationMs;
}
