/**
 * TutorialFlowCalc — Pure TypeScript tutorial flow system
 * No Phaser imports. All functions are pure and return new state (immutable).
 */

// ── Types ──────────────────────────────────────────────────────────

export interface TutorialStep {
  readonly id: string;
  readonly sequenceId: string;
  readonly title: string;
  readonly description: string;
  readonly triggerCondition: string;
  readonly isCompleted: boolean;
  readonly order: number;
}

export interface TutorialSequence {
  readonly id: string;
  readonly name: string;
  readonly steps: readonly TutorialStep[];
  readonly isUnlocked: boolean;
  readonly isCompleted: boolean;
  readonly requiredLevel?: number;
}

export interface TutorialState {
  readonly sequences: Readonly<Record<string, TutorialSequence>>;
  readonly currentStepId: string | null;
  readonly totalCompleted: number;
  readonly skipAll: boolean;
}

export interface TutorialProgress {
  readonly completed: number;
  readonly total: number;
  readonly percent: number;
}

// ── Constants ──────────────────────────────────────────────────────

const ONBOARDING_STEPS: readonly TutorialStep[] = [
  {
    id: "onboarding_move",
    sequenceId: "onboarding",
    title: "Move",
    description: "Use the joystick to move your character",
    triggerCondition: "move_count >= 1",
    isCompleted: false,
    order: 0,
  },
  {
    id: "onboarding_shoot",
    sequenceId: "onboarding",
    title: "Shoot",
    description: "Your character shoots automatically when enemies are near",
    triggerCondition: "kill_count >= 1",
    isCompleted: false,
    order: 1,
  },
  {
    id: "onboarding_collect",
    sequenceId: "onboarding",
    title: "Collect",
    description: "Walk over XP gems to collect them",
    triggerCondition: "xp_collected >= 1",
    isCompleted: false,
    order: 2,
  },
];

const COMBAT_BASICS_STEPS: readonly TutorialStep[] = [
  {
    id: "combat_dodge",
    sequenceId: "combat_basics",
    title: "Dodge",
    description: "Avoid enemy projectiles by moving away",
    triggerCondition: "dodge_count >= 1",
    isCompleted: false,
    order: 0,
  },
  {
    id: "combat_crit",
    sequenceId: "combat_basics",
    title: "Critical Hit",
    description: "Deal a critical hit to an enemy",
    triggerCondition: "crit_count >= 1",
    isCompleted: false,
    order: 1,
  },
  {
    id: "combat_combo",
    sequenceId: "combat_basics",
    title: "Combo",
    description: "Chain kills quickly to build a combo",
    triggerCondition: "combo_count >= 3",
    isCompleted: false,
    order: 2,
  },
];

const PROGRESSION_STEPS: readonly TutorialStep[] = [
  {
    id: "prog_levelup",
    sequenceId: "progression",
    title: "Level Up",
    description: "Collect enough XP to level up",
    triggerCondition: "level >= 2",
    isCompleted: false,
    order: 0,
  },
  {
    id: "prog_shop",
    sequenceId: "progression",
    title: "Visit Shop",
    description: "Open the shop between stages",
    triggerCondition: "shop_visits >= 1",
    isCompleted: false,
    order: 1,
  },
  {
    id: "prog_upgrade",
    sequenceId: "progression",
    title: "Upgrade",
    description: "Purchase an upgrade from the shop",
    triggerCondition: "upgrades_bought >= 1",
    isCompleted: false,
    order: 2,
  },
];

const ADVANCED_STEPS: readonly TutorialStep[] = [
  {
    id: "adv_boss",
    sequenceId: "advanced",
    title: "Boss Fight",
    description: "Defeat a stage boss",
    triggerCondition: "boss_kills >= 1",
    isCompleted: false,
    order: 0,
  },
  {
    id: "adv_elite",
    sequenceId: "advanced",
    title: "Elite Enemy",
    description: "Defeat an elite enemy",
    triggerCondition: "elite_kills >= 1",
    isCompleted: false,
    order: 1,
  },
  {
    id: "adv_arena",
    sequenceId: "advanced",
    title: "Arena Mode",
    description: "Survive an arena challenge",
    triggerCondition: "arena_clears >= 1",
    isCompleted: false,
    order: 2,
  },
];

const SOCIAL_STEPS: readonly TutorialStep[] = [
  {
    id: "social_leaderboard",
    sequenceId: "social",
    title: "Leaderboard",
    description: "Check the leaderboard rankings",
    triggerCondition: "leaderboard_views >= 1",
    isCompleted: false,
    order: 0,
  },
  {
    id: "social_achievement",
    sequenceId: "social",
    title: "Achievement",
    description: "Unlock your first achievement",
    triggerCondition: "achievements >= 1",
    isCompleted: false,
    order: 1,
  },
];

// ── Factory ────────────────────────────────────────────────────────

export function createTutorialState(): TutorialState {
  const sequences: Record<string, TutorialSequence> = {
    onboarding: {
      id: "onboarding",
      name: "Getting Started",
      steps: ONBOARDING_STEPS,
      isUnlocked: true,
      isCompleted: false,
    },
    combat_basics: {
      id: "combat_basics",
      name: "Combat Basics",
      steps: COMBAT_BASICS_STEPS,
      isUnlocked: true,
      isCompleted: false,
    },
    progression: {
      id: "progression",
      name: "Progression",
      steps: PROGRESSION_STEPS,
      isUnlocked: true,
      isCompleted: false,
    },
    advanced: {
      id: "advanced",
      name: "Advanced Tactics",
      steps: ADVANCED_STEPS,
      isUnlocked: false,
      isCompleted: false,
      requiredLevel: 5,
    },
    social: {
      id: "social",
      name: "Social Features",
      steps: SOCIAL_STEPS,
      isUnlocked: false,
      isCompleted: false,
      requiredLevel: 3,
    },
  };

  return {
    sequences,
    currentStepId: ONBOARDING_STEPS[0].id,
    totalCompleted: 0,
    skipAll: false,
  };
}

// ── Helpers (internal) ─────────────────────────────────────────────

function findStepInSequences(
  sequences: Readonly<Record<string, TutorialSequence>>,
  stepId: string,
): { sequence: TutorialSequence; step: TutorialStep; stepIndex: number } | null {
  for (const seq of Object.values(sequences)) {
    const stepIndex = seq.steps.findIndex((s) => s.id === stepId);
    if (stepIndex !== -1) {
      return { sequence: seq, step: seq.steps[stepIndex], stepIndex };
    }
  }
  return null;
}

function findNextUncompletedStepId(
  sequences: Readonly<Record<string, TutorialSequence>>,
): string | null {
  const orderedSeqs = ["onboarding", "combat_basics", "progression", "advanced", "social"];
  for (const seqId of orderedSeqs) {
    const seq = sequences[seqId];
    if (!seq || !seq.isUnlocked || seq.isCompleted) continue;
    const next = seq.steps.find((s) => !s.isCompleted);
    if (next) return next.id;
  }
  return null;
}

// ── Core Functions ─────────────────────────────────────────────────

export function advanceStep(state: TutorialState, stepId: string): TutorialState {
  if (state.skipAll) return state;

  const found = findStepInSequences(state.sequences, stepId);
  if (!found) return state;
  if (found.step.isCompleted) return state;

  const { sequence, stepIndex } = found;

  const newSteps = sequence.steps.map((s, i) =>
    i === stepIndex ? { ...s, isCompleted: true } : s,
  );

  const allComplete = newSteps.every((s) => s.isCompleted);

  const newSequence: TutorialSequence = {
    ...sequence,
    steps: newSteps,
    isCompleted: allComplete,
  };

  const newSequences = { ...state.sequences, [sequence.id]: newSequence };

  const newTotalCompleted = state.totalCompleted + 1;
  const nextStepId = findNextUncompletedStepId(newSequences);

  return {
    ...state,
    sequences: newSequences,
    totalCompleted: newTotalCompleted,
    currentStepId: nextStepId,
  };
}

export function skipSequence(state: TutorialState, sequenceId: string): TutorialState {
  const seq = state.sequences[sequenceId];
  if (!seq) return state;
  if (seq.isCompleted) return state;

  const incompleteCount = seq.steps.filter((s) => !s.isCompleted).length;

  const newSteps = seq.steps.map((s) => ({ ...s, isCompleted: true }));
  const newSequence: TutorialSequence = {
    ...seq,
    steps: newSteps,
    isCompleted: true,
  };

  const newSequences = { ...state.sequences, [sequenceId]: newSequence };
  const newTotalCompleted = state.totalCompleted + incompleteCount;
  const nextStepId = findNextUncompletedStepId(newSequences);

  return {
    ...state,
    sequences: newSequences,
    totalCompleted: newTotalCompleted,
    currentStepId: nextStepId,
  };
}

export function skipAll(state: TutorialState): TutorialState {
  let totalAdded = 0;
  const newSequences: Record<string, TutorialSequence> = {};

  for (const [id, seq] of Object.entries(state.sequences)) {
    const incompleteCount = seq.steps.filter((s) => !s.isCompleted).length;
    totalAdded += incompleteCount;
    newSequences[id] = {
      ...seq,
      steps: seq.steps.map((s) => ({ ...s, isCompleted: true })),
      isCompleted: true,
    };
  }

  return {
    sequences: newSequences,
    currentStepId: null,
    totalCompleted: state.totalCompleted + totalAdded,
    skipAll: true,
  };
}

export function getActiveStep(state: TutorialState): TutorialStep | null {
  if (state.skipAll) return null;
  if (!state.currentStepId) return null;

  const found = findStepInSequences(state.sequences, state.currentStepId);
  if (!found) return null;
  if (found.step.isCompleted) return null;

  return found.step;
}

export function isSequenceComplete(state: TutorialState, sequenceId: string): boolean {
  const seq = state.sequences[sequenceId];
  if (!seq) return false;
  return seq.isCompleted;
}

export function getProgress(state: TutorialState): TutorialProgress {
  let total = 0;
  let completed = 0;

  for (const seq of Object.values(state.sequences)) {
    for (const step of seq.steps) {
      total++;
      if (step.isCompleted) completed++;
    }
  }

  return {
    completed,
    total,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}

export function unlockSequence(state: TutorialState, sequenceId: string): TutorialState {
  const seq = state.sequences[sequenceId];
  if (!seq) return state;
  if (seq.isUnlocked) return state;

  const newSequence: TutorialSequence = { ...seq, isUnlocked: true };
  const newSequences = { ...state.sequences, [sequenceId]: newSequence };

  const nextStepId =
    state.currentStepId ?? findNextUncompletedStepId(newSequences);

  return {
    ...state,
    sequences: newSequences,
    currentStepId: nextStepId,
  };
}

export function checkTrigger(
  _state: TutorialState,
  condition: string,
  context: Record<string, number>,
): boolean {
  const match = condition.match(/^(\w+)\s*(>=|<=|>|<|==|!=)\s*(\d+(?:\.\d+)?)$/);
  if (!match) return false;

  const [, key, op, valStr] = match;
  const contextVal = context[key] ?? 0;
  const threshold = parseFloat(valStr);

  switch (op) {
    case ">=":
      return contextVal >= threshold;
    case "<=":
      return contextVal <= threshold;
    case ">":
      return contextVal > threshold;
    case "<":
      return contextVal < threshold;
    case "==":
      return contextVal === threshold;
    case "!=":
      return contextVal !== threshold;
    default:
      return false;
  }
}

export function resetSequence(state: TutorialState, sequenceId: string): TutorialState {
  const seq = state.sequences[sequenceId];
  if (!seq) return state;

  const completedCount = seq.steps.filter((s) => s.isCompleted).length;

  const newSteps = seq.steps.map((s) => ({ ...s, isCompleted: false }));
  const newSequence: TutorialSequence = {
    ...seq,
    steps: newSteps,
    isCompleted: false,
  };

  const newSequences = { ...state.sequences, [sequenceId]: newSequence };
  const newTotalCompleted = Math.max(0, state.totalCompleted - completedCount);
  const nextStepId = findNextUncompletedStepId(newSequences);

  return {
    ...state,
    sequences: newSequences,
    totalCompleted: newTotalCompleted,
    currentStepId: state.skipAll ? state.currentStepId : nextStepId,
  };
}

// ── Query Helpers ──────────────────────────────────────────────────

export function getSequence(
  state: TutorialState,
  sequenceId: string,
): TutorialSequence | null {
  return state.sequences[sequenceId] ?? null;
}

export function getStep(state: TutorialState, stepId: string): TutorialStep | null {
  const found = findStepInSequences(state.sequences, stepId);
  return found ? found.step : null;
}

export function getSequenceProgress(
  state: TutorialState,
  sequenceId: string,
): TutorialProgress {
  const seq = state.sequences[sequenceId];
  if (!seq) return { completed: 0, total: 0, percent: 0 };

  const total = seq.steps.length;
  const completed = seq.steps.filter((s) => s.isCompleted).length;

  return {
    completed,
    total,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}

export function getUnlockedSequenceIds(state: TutorialState): string[] {
  return Object.values(state.sequences)
    .filter((s) => s.isUnlocked)
    .map((s) => s.id);
}

export function getLockedSequenceIds(state: TutorialState): string[] {
  return Object.values(state.sequences)
    .filter((s) => !s.isUnlocked)
    .map((s) => s.id);
}

export function isStepComplete(state: TutorialState, stepId: string): boolean {
  const found = findStepInSequences(state.sequences, stepId);
  return found ? found.step.isCompleted : false;
}
