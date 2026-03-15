/**
 * TutorialCalc — pure TypeScript, NO Phaser imports.
 * Manages tutorial progression and hint display logic.
 */

export interface TutorialStep {
  id: string;
  trigger: TutorialTrigger;
  message: string;
  priority: number; // lower = higher priority
  maxShows: number; // max times to show this hint
}

export type TutorialTrigger =
  | { type: "time"; seconds: number } // show after N seconds
  | { type: "level"; level: number } // show at level N
  | { type: "kills"; count: number } // show after N kills
  | { type: "first_damage" } // first time player takes damage
  | { type: "first_upgrade" } // first level-up upgrade screen
  | { type: "boss_spawn" } // first boss appears
  | { type: "low_hp"; threshold: number }; // HP drops below threshold

export interface TutorialState {
  completedIds: string[];
  showCounts: Record<string, number>;
  currentHint: string | null;
  isFirstRun: boolean;
}

export interface TriggerContext {
  elapsed: number;
  level: number;
  kills: number;
  tookDamage: boolean;
  isUpgrading: boolean;
  bossActive: boolean;
  hpRatio: number;
}

// ---------------------------------------------------------------------------
// Default tutorial steps
// ---------------------------------------------------------------------------

export function getDefaultSteps(): TutorialStep[] {
  return [
    {
      id: "move",
      trigger: { type: "time", seconds: 3 },
      message: "Drag to move your hero!",
      priority: 1,
      maxShows: 3,
    },
    {
      id: "auto_attack",
      trigger: { type: "time", seconds: 8 },
      message: "Weapons fire automatically!",
      priority: 2,
      maxShows: 2,
    },
    {
      id: "collect_xp",
      trigger: { type: "kills", count: 5 },
      message: "Collect XP gems to level up!",
      priority: 3,
      maxShows: 2,
    },
    {
      id: "first_upgrade",
      trigger: { type: "first_upgrade" },
      message: "Choose an upgrade to power up!",
      priority: 4,
      maxShows: 1,
    },
    {
      id: "dodge",
      trigger: { type: "first_damage" },
      message: "Move to dodge enemy attacks!",
      priority: 5,
      maxShows: 2,
    },
    {
      id: "boss_warning",
      trigger: { type: "boss_spawn" },
      message: "BOSS incoming! Stay mobile!",
      priority: 6,
      maxShows: 1,
    },
    {
      id: "low_hp",
      trigger: { type: "low_hp", threshold: 0.3 },
      message: "Find health pickups to survive!",
      priority: 7,
      maxShows: 3,
    },
  ];
}

// ---------------------------------------------------------------------------
// State management
// ---------------------------------------------------------------------------

export function createTutorialState(isFirstRun: boolean): TutorialState {
  return {
    completedIds: [],
    showCounts: {},
    currentHint: null,
    isFirstRun,
  };
}

export function checkTrigger(
  step: TutorialStep,
  context: TriggerContext,
): boolean {
  const t = step.trigger;
  switch (t.type) {
    case "time":
      return context.elapsed >= t.seconds;
    case "level":
      return context.level >= t.level;
    case "kills":
      return context.kills >= t.count;
    case "first_damage":
      return context.tookDamage;
    case "first_upgrade":
      return context.isUpgrading;
    case "boss_spawn":
      return context.bossActive;
    case "low_hp":
      return context.hpRatio <= t.threshold;
  }
}

export function getNextHint(
  state: TutorialState,
  context: TriggerContext,
  steps: TutorialStep[] = getDefaultSteps(),
): TutorialStep | null {
  const candidates = steps
    .filter((s) => {
      if (state.completedIds.includes(s.id)) return false;
      const shown = state.showCounts[s.id] ?? 0;
      if (shown >= s.maxShows) return false;
      return checkTrigger(s, context);
    })
    .sort((a, b) => a.priority - b.priority);

  return candidates[0] ?? null;
}

export function markShown(state: TutorialState, stepId: string): TutorialState {
  const count = (state.showCounts[stepId] ?? 0) + 1;
  return {
    ...state,
    showCounts: { ...state.showCounts, [stepId]: count },
    currentHint: stepId,
  };
}

export function markCompleted(
  state: TutorialState,
  stepId: string,
): TutorialState {
  if (state.completedIds.includes(stepId)) return state;
  return {
    ...state,
    completedIds: [...state.completedIds, stepId],
    currentHint: state.currentHint === stepId ? null : state.currentHint,
  };
}

export function shouldShowHints(state: TutorialState): boolean {
  if (!state.isFirstRun) return false;
  const steps = getDefaultSteps();
  return steps.some((s) => !state.completedIds.includes(s.id));
}

export function getProgress(state: TutorialState): {
  completed: number;
  total: number;
} {
  const steps = getDefaultSteps();
  return {
    completed: state.completedIds.filter((id) => steps.some((s) => s.id === id))
      .length,
    total: steps.length,
  };
}
