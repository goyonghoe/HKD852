import { describe, it, expect } from "vitest";
import {
  createTutorialState,
  advanceStep,
  skipSequence,
  skipAll,
  getActiveStep,
  isSequenceComplete,
  getProgress,
  unlockSequence,
  checkTrigger,
  resetSequence,
  getSequence,
  getStep,
  getSequenceProgress,
  getUnlockedSequenceIds,
  getLockedSequenceIds,
  isStepComplete,
} from "../../src/core/TutorialFlowCalc";

// ── createTutorialState ────────────────────────────────────────────

describe("createTutorialState", () => {
  it("creates state with 5 sequences", () => {
    const state = createTutorialState();
    expect(Object.keys(state.sequences)).toHaveLength(5);
  });

  it("has onboarding sequence", () => {
    const state = createTutorialState();
    expect(state.sequences["onboarding"]).toBeDefined();
    expect(state.sequences["onboarding"].name).toBe("Getting Started");
  });

  it("has combat_basics sequence", () => {
    const state = createTutorialState();
    expect(state.sequences["combat_basics"]).toBeDefined();
    expect(state.sequences["combat_basics"].name).toBe("Combat Basics");
  });

  it("has progression sequence", () => {
    const state = createTutorialState();
    expect(state.sequences["progression"]).toBeDefined();
  });

  it("has advanced sequence", () => {
    const state = createTutorialState();
    expect(state.sequences["advanced"]).toBeDefined();
    expect(state.sequences["advanced"].requiredLevel).toBe(5);
  });

  it("has social sequence", () => {
    const state = createTutorialState();
    expect(state.sequences["social"]).toBeDefined();
    expect(state.sequences["social"].requiredLevel).toBe(3);
  });

  it("starts with onboarding_move as current step", () => {
    const state = createTutorialState();
    expect(state.currentStepId).toBe("onboarding_move");
  });

  it("starts with totalCompleted = 0", () => {
    const state = createTutorialState();
    expect(state.totalCompleted).toBe(0);
  });

  it("starts with skipAll = false", () => {
    const state = createTutorialState();
    expect(state.skipAll).toBe(false);
  });

  it("onboarding is unlocked by default", () => {
    const state = createTutorialState();
    expect(state.sequences["onboarding"].isUnlocked).toBe(true);
  });

  it("advanced is locked by default", () => {
    const state = createTutorialState();
    expect(state.sequences["advanced"].isUnlocked).toBe(false);
  });

  it("social is locked by default", () => {
    const state = createTutorialState();
    expect(state.sequences["social"].isUnlocked).toBe(false);
  });

  it("onboarding has 3 steps", () => {
    const state = createTutorialState();
    expect(state.sequences["onboarding"].steps).toHaveLength(3);
  });

  it("combat_basics has 3 steps", () => {
    const state = createTutorialState();
    expect(state.sequences["combat_basics"].steps).toHaveLength(3);
  });

  it("social has 2 steps", () => {
    const state = createTutorialState();
    expect(state.sequences["social"].steps).toHaveLength(2);
  });

  it("all steps start as not completed", () => {
    const state = createTutorialState();
    for (const seq of Object.values(state.sequences)) {
      for (const step of seq.steps) {
        expect(step.isCompleted).toBe(false);
      }
    }
  });

  it("no sequences start as completed", () => {
    const state = createTutorialState();
    for (const seq of Object.values(state.sequences)) {
      expect(seq.isCompleted).toBe(false);
    }
  });
});

// ── advanceStep ────────────────────────────────────────────────────

describe("advanceStep", () => {
  it("marks step as completed", () => {
    const state = createTutorialState();
    const next = advanceStep(state, "onboarding_move");
    expect(next.sequences["onboarding"].steps[0].isCompleted).toBe(true);
  });

  it("increments totalCompleted", () => {
    const state = createTutorialState();
    const next = advanceStep(state, "onboarding_move");
    expect(next.totalCompleted).toBe(1);
  });

  it("advances currentStepId to next step in sequence", () => {
    const state = createTutorialState();
    const next = advanceStep(state, "onboarding_move");
    expect(next.currentStepId).toBe("onboarding_shoot");
  });

  it("returns same state for unknown step id", () => {
    const state = createTutorialState();
    const next = advanceStep(state, "nonexistent_step");
    expect(next).toBe(state);
  });

  it("returns same state if step already completed", () => {
    const state = createTutorialState();
    const s1 = advanceStep(state, "onboarding_move");
    const s2 = advanceStep(s1, "onboarding_move");
    expect(s2).toBe(s1);
  });

  it("returns same state when skipAll is true", () => {
    const state = skipAll(createTutorialState());
    const next = advanceStep(state, "onboarding_move");
    expect(next).toBe(state);
  });

  it("marks sequence complete when last step is advanced", () => {
    let state = createTutorialState();
    state = advanceStep(state, "onboarding_move");
    state = advanceStep(state, "onboarding_shoot");
    state = advanceStep(state, "onboarding_collect");
    expect(state.sequences["onboarding"].isCompleted).toBe(true);
  });

  it("does not mutate original state", () => {
    const state = createTutorialState();
    advanceStep(state, "onboarding_move");
    expect(state.sequences["onboarding"].steps[0].isCompleted).toBe(false);
    expect(state.totalCompleted).toBe(0);
  });

  it("can advance steps out of order", () => {
    const state = createTutorialState();
    const next = advanceStep(state, "onboarding_collect");
    expect(next.sequences["onboarding"].steps[2].isCompleted).toBe(true);
    expect(next.sequences["onboarding"].steps[0].isCompleted).toBe(false);
  });

  it("advances to next unlocked sequence after completing current", () => {
    let state = createTutorialState();
    state = advanceStep(state, "onboarding_move");
    state = advanceStep(state, "onboarding_shoot");
    state = advanceStep(state, "onboarding_collect");
    expect(state.currentStepId).toBe("combat_dodge");
  });
});

// ── skipSequence ───────────────────────────────────────────────────

describe("skipSequence", () => {
  it("marks all steps in sequence as completed", () => {
    const state = createTutorialState();
    const next = skipSequence(state, "onboarding");
    for (const step of next.sequences["onboarding"].steps) {
      expect(step.isCompleted).toBe(true);
    }
  });

  it("marks sequence as completed", () => {
    const state = createTutorialState();
    const next = skipSequence(state, "onboarding");
    expect(next.sequences["onboarding"].isCompleted).toBe(true);
  });

  it("increments totalCompleted by incomplete step count", () => {
    const state = createTutorialState();
    const next = skipSequence(state, "onboarding");
    expect(next.totalCompleted).toBe(3);
  });

  it("returns same state for unknown sequence", () => {
    const state = createTutorialState();
    const next = skipSequence(state, "nonexistent");
    expect(next).toBe(state);
  });

  it("returns same state if sequence already completed", () => {
    const state = createTutorialState();
    const s1 = skipSequence(state, "onboarding");
    const s2 = skipSequence(s1, "onboarding");
    expect(s2).toBe(s1);
  });

  it("counts only incomplete steps when some are already done", () => {
    let state = createTutorialState();
    state = advanceStep(state, "onboarding_move");
    const next = skipSequence(state, "onboarding");
    expect(next.totalCompleted).toBe(3); // 1 advanced + 2 skipped
  });

  it("advances currentStepId to next unlocked sequence", () => {
    const state = createTutorialState();
    const next = skipSequence(state, "onboarding");
    expect(next.currentStepId).toBe("combat_dodge");
  });
});

// ── skipAll ────────────────────────────────────────────────────────

describe("skipAll", () => {
  it("sets skipAll flag to true", () => {
    const state = createTutorialState();
    const next = skipAll(state);
    expect(next.skipAll).toBe(true);
  });

  it("marks all steps in all sequences as completed", () => {
    const state = createTutorialState();
    const next = skipAll(state);
    for (const seq of Object.values(next.sequences)) {
      for (const step of seq.steps) {
        expect(step.isCompleted).toBe(true);
      }
    }
  });

  it("marks all sequences as completed", () => {
    const state = createTutorialState();
    const next = skipAll(state);
    for (const seq of Object.values(next.sequences)) {
      expect(seq.isCompleted).toBe(true);
    }
  });

  it("sets currentStepId to null", () => {
    const state = createTutorialState();
    const next = skipAll(state);
    expect(next.currentStepId).toBeNull();
  });

  it("totalCompleted equals total step count", () => {
    const state = createTutorialState();
    const next = skipAll(state);
    // 3+3+3+3+2 = 14 total steps
    expect(next.totalCompleted).toBe(14);
  });

  it("accounts for previously completed steps", () => {
    let state = createTutorialState();
    state = advanceStep(state, "onboarding_move");
    state = advanceStep(state, "onboarding_shoot");
    const next = skipAll(state);
    expect(next.totalCompleted).toBe(14); // 2 + 12
  });
});

// ── getActiveStep ──────────────────────────────────────────────────

describe("getActiveStep", () => {
  it("returns first onboarding step initially", () => {
    const state = createTutorialState();
    const step = getActiveStep(state);
    expect(step).not.toBeNull();
    expect(step!.id).toBe("onboarding_move");
  });

  it("returns next step after advancing", () => {
    const state = advanceStep(createTutorialState(), "onboarding_move");
    const step = getActiveStep(state);
    expect(step!.id).toBe("onboarding_shoot");
  });

  it("returns null when skipAll is true", () => {
    const state = skipAll(createTutorialState());
    expect(getActiveStep(state)).toBeNull();
  });

  it("returns null when all steps are completed", () => {
    let state = createTutorialState();
    // Skip all unlocked sequences
    state = skipSequence(state, "onboarding");
    state = skipSequence(state, "combat_basics");
    state = skipSequence(state, "progression");
    // advanced and social are locked, so no active step
    expect(getActiveStep(state)).toBeNull();
  });

  it("returns step from newly unlocked sequence", () => {
    let state = createTutorialState();
    state = skipSequence(state, "onboarding");
    state = skipSequence(state, "combat_basics");
    state = skipSequence(state, "progression");
    state = unlockSequence(state, "advanced");
    const step = getActiveStep(state);
    expect(step!.id).toBe("adv_boss");
  });
});

// ── isSequenceComplete ─────────────────────────────────────────────

describe("isSequenceComplete", () => {
  it("returns false for fresh state", () => {
    const state = createTutorialState();
    expect(isSequenceComplete(state, "onboarding")).toBe(false);
  });

  it("returns true after completing all steps", () => {
    let state = createTutorialState();
    state = advanceStep(state, "onboarding_move");
    state = advanceStep(state, "onboarding_shoot");
    state = advanceStep(state, "onboarding_collect");
    expect(isSequenceComplete(state, "onboarding")).toBe(true);
  });

  it("returns false for unknown sequence", () => {
    const state = createTutorialState();
    expect(isSequenceComplete(state, "nonexistent")).toBe(false);
  });

  it("returns true after skipSequence", () => {
    const state = skipSequence(createTutorialState(), "combat_basics");
    expect(isSequenceComplete(state, "combat_basics")).toBe(true);
  });
});

// ── getProgress ────────────────────────────────────────────────────

describe("getProgress", () => {
  it("returns 0% for fresh state", () => {
    const state = createTutorialState();
    const prog = getProgress(state);
    expect(prog.completed).toBe(0);
    expect(prog.total).toBe(14);
    expect(prog.percent).toBe(0);
  });

  it("returns correct progress after advancing", () => {
    const state = advanceStep(createTutorialState(), "onboarding_move");
    const prog = getProgress(state);
    expect(prog.completed).toBe(1);
    expect(prog.total).toBe(14);
    expect(prog.percent).toBe(Math.round((1 / 14) * 100));
  });

  it("returns 100% after skipAll", () => {
    const state = skipAll(createTutorialState());
    const prog = getProgress(state);
    expect(prog.completed).toBe(14);
    expect(prog.total).toBe(14);
    expect(prog.percent).toBe(100);
  });

  it("returns correct percent after skipping one sequence", () => {
    const state = skipSequence(createTutorialState(), "onboarding");
    const prog = getProgress(state);
    expect(prog.completed).toBe(3);
    expect(prog.percent).toBe(Math.round((3 / 14) * 100));
  });
});

// ── unlockSequence ─────────────────────────────────────────────────

describe("unlockSequence", () => {
  it("unlocks a locked sequence", () => {
    const state = createTutorialState();
    const next = unlockSequence(state, "advanced");
    expect(next.sequences["advanced"].isUnlocked).toBe(true);
  });

  it("returns same state for already unlocked sequence", () => {
    const state = createTutorialState();
    const next = unlockSequence(state, "onboarding");
    expect(next).toBe(state);
  });

  it("returns same state for unknown sequence", () => {
    const state = createTutorialState();
    const next = unlockSequence(state, "nonexistent");
    expect(next).toBe(state);
  });

  it("does not change currentStepId if one already exists", () => {
    const state = createTutorialState();
    const next = unlockSequence(state, "advanced");
    expect(next.currentStepId).toBe("onboarding_move");
  });

  it("sets currentStepId when none exists", () => {
    let state = createTutorialState();
    state = skipSequence(state, "onboarding");
    state = skipSequence(state, "combat_basics");
    state = skipSequence(state, "progression");
    // currentStepId should be null since advanced/social are locked
    expect(state.currentStepId).toBeNull();
    const next = unlockSequence(state, "social");
    expect(next.currentStepId).toBe("social_leaderboard");
  });
});

// ── checkTrigger ───────────────────────────────────────────────────

describe("checkTrigger", () => {
  const state = createTutorialState();

  it("evaluates >= correctly (true)", () => {
    expect(checkTrigger(state, "level >= 5", { level: 5 })).toBe(true);
  });

  it("evaluates >= correctly (false)", () => {
    expect(checkTrigger(state, "level >= 5", { level: 4 })).toBe(false);
  });

  it("evaluates > correctly", () => {
    expect(checkTrigger(state, "kill_count > 0", { kill_count: 1 })).toBe(true);
    expect(checkTrigger(state, "kill_count > 0", { kill_count: 0 })).toBe(false);
  });

  it("evaluates <= correctly", () => {
    expect(checkTrigger(state, "hp <= 10", { hp: 10 })).toBe(true);
    expect(checkTrigger(state, "hp <= 10", { hp: 11 })).toBe(false);
  });

  it("evaluates < correctly", () => {
    expect(checkTrigger(state, "hp < 10", { hp: 9 })).toBe(true);
    expect(checkTrigger(state, "hp < 10", { hp: 10 })).toBe(false);
  });

  it("evaluates == correctly", () => {
    expect(checkTrigger(state, "level == 3", { level: 3 })).toBe(true);
    expect(checkTrigger(state, "level == 3", { level: 4 })).toBe(false);
  });

  it("evaluates != correctly", () => {
    expect(checkTrigger(state, "level != 0", { level: 1 })).toBe(true);
    expect(checkTrigger(state, "level != 0", { level: 0 })).toBe(false);
  });

  it("defaults missing context key to 0", () => {
    expect(checkTrigger(state, "score >= 1", {})).toBe(false);
    expect(checkTrigger(state, "score >= 0", {})).toBe(true);
  });

  it("returns false for invalid condition format", () => {
    expect(checkTrigger(state, "invalid condition", {})).toBe(false);
  });

  it("returns false for empty condition", () => {
    expect(checkTrigger(state, "", {})).toBe(false);
  });

  it("handles decimal thresholds", () => {
    expect(checkTrigger(state, "score >= 2.5", { score: 3 })).toBe(true);
    expect(checkTrigger(state, "score >= 2.5", { score: 2 })).toBe(false);
  });
});

// ── resetSequence ──────────────────────────────────────────────────

describe("resetSequence", () => {
  it("resets all steps to not completed", () => {
    let state = createTutorialState();
    state = skipSequence(state, "onboarding");
    const next = resetSequence(state, "onboarding");
    for (const step of next.sequences["onboarding"].steps) {
      expect(step.isCompleted).toBe(false);
    }
  });

  it("sets sequence isCompleted to false", () => {
    let state = createTutorialState();
    state = skipSequence(state, "onboarding");
    const next = resetSequence(state, "onboarding");
    expect(next.sequences["onboarding"].isCompleted).toBe(false);
  });

  it("decrements totalCompleted by completed count", () => {
    let state = createTutorialState();
    state = skipSequence(state, "onboarding");
    expect(state.totalCompleted).toBe(3);
    const next = resetSequence(state, "onboarding");
    expect(next.totalCompleted).toBe(0);
  });

  it("totalCompleted never goes below 0", () => {
    const state = createTutorialState();
    const next = resetSequence(state, "onboarding");
    expect(next.totalCompleted).toBe(0);
  });

  it("returns same state for unknown sequence", () => {
    const state = createTutorialState();
    const next = resetSequence(state, "nonexistent");
    expect(next).toBe(state);
  });

  it("updates currentStepId to first step of reset sequence", () => {
    let state = createTutorialState();
    state = skipSequence(state, "onboarding");
    const next = resetSequence(state, "onboarding");
    expect(next.currentStepId).toBe("onboarding_move");
  });

  it("does not change currentStepId when skipAll is true", () => {
    let state = createTutorialState();
    state = skipAll(state);
    const next = resetSequence(state, "onboarding");
    expect(next.currentStepId).toBeNull();
  });
});

// ── getSequence ────────────────────────────────────────────────────

describe("getSequence", () => {
  it("returns sequence by id", () => {
    const state = createTutorialState();
    const seq = getSequence(state, "onboarding");
    expect(seq).not.toBeNull();
    expect(seq!.id).toBe("onboarding");
  });

  it("returns null for unknown id", () => {
    const state = createTutorialState();
    expect(getSequence(state, "nonexistent")).toBeNull();
  });
});

// ── getStep ────────────────────────────────────────────────────────

describe("getStep", () => {
  it("returns step by id", () => {
    const state = createTutorialState();
    const step = getStep(state, "onboarding_move");
    expect(step).not.toBeNull();
    expect(step!.title).toBe("Move");
  });

  it("returns null for unknown step id", () => {
    const state = createTutorialState();
    expect(getStep(state, "nonexistent")).toBeNull();
  });

  it("returns step from any sequence", () => {
    const state = createTutorialState();
    const step = getStep(state, "adv_boss");
    expect(step).not.toBeNull();
    expect(step!.sequenceId).toBe("advanced");
  });
});

// ── getSequenceProgress ────────────────────────────────────────────

describe("getSequenceProgress", () => {
  it("returns 0% for fresh sequence", () => {
    const state = createTutorialState();
    const prog = getSequenceProgress(state, "onboarding");
    expect(prog.completed).toBe(0);
    expect(prog.total).toBe(3);
    expect(prog.percent).toBe(0);
  });

  it("returns correct progress after partial completion", () => {
    const state = advanceStep(createTutorialState(), "onboarding_move");
    const prog = getSequenceProgress(state, "onboarding");
    expect(prog.completed).toBe(1);
    expect(prog.total).toBe(3);
    expect(prog.percent).toBe(33);
  });

  it("returns 100% for completed sequence", () => {
    const state = skipSequence(createTutorialState(), "onboarding");
    const prog = getSequenceProgress(state, "onboarding");
    expect(prog.completed).toBe(3);
    expect(prog.percent).toBe(100);
  });

  it("returns zeros for unknown sequence", () => {
    const state = createTutorialState();
    const prog = getSequenceProgress(state, "nonexistent");
    expect(prog.completed).toBe(0);
    expect(prog.total).toBe(0);
    expect(prog.percent).toBe(0);
  });
});

// ── getUnlockedSequenceIds ─────────────────────────────────────────

describe("getUnlockedSequenceIds", () => {
  it("returns 3 unlocked sequences by default", () => {
    const state = createTutorialState();
    const ids = getUnlockedSequenceIds(state);
    expect(ids).toHaveLength(3);
    expect(ids).toContain("onboarding");
    expect(ids).toContain("combat_basics");
    expect(ids).toContain("progression");
  });

  it("includes newly unlocked sequence", () => {
    const state = unlockSequence(createTutorialState(), "advanced");
    const ids = getUnlockedSequenceIds(state);
    expect(ids).toHaveLength(4);
    expect(ids).toContain("advanced");
  });
});

// ── getLockedSequenceIds ───────────────────────────────────────────

describe("getLockedSequenceIds", () => {
  it("returns 2 locked sequences by default", () => {
    const state = createTutorialState();
    const ids = getLockedSequenceIds(state);
    expect(ids).toHaveLength(2);
    expect(ids).toContain("advanced");
    expect(ids).toContain("social");
  });

  it("shrinks after unlocking", () => {
    const state = unlockSequence(createTutorialState(), "social");
    const ids = getLockedSequenceIds(state);
    expect(ids).toHaveLength(1);
    expect(ids).toContain("advanced");
  });
});

// ── isStepComplete ─────────────────────────────────────────────────

describe("isStepComplete", () => {
  it("returns false for fresh step", () => {
    const state = createTutorialState();
    expect(isStepComplete(state, "onboarding_move")).toBe(false);
  });

  it("returns true after advancing step", () => {
    const state = advanceStep(createTutorialState(), "onboarding_move");
    expect(isStepComplete(state, "onboarding_move")).toBe(true);
  });

  it("returns false for unknown step", () => {
    const state = createTutorialState();
    expect(isStepComplete(state, "nonexistent")).toBe(false);
  });
});

// ── Integration / Edge Cases ───────────────────────────────────────

describe("integration", () => {
  it("full onboarding flow advances through all steps", () => {
    let state = createTutorialState();
    expect(getActiveStep(state)!.id).toBe("onboarding_move");

    state = advanceStep(state, "onboarding_move");
    expect(getActiveStep(state)!.id).toBe("onboarding_shoot");

    state = advanceStep(state, "onboarding_shoot");
    expect(getActiveStep(state)!.id).toBe("onboarding_collect");

    state = advanceStep(state, "onboarding_collect");
    expect(isSequenceComplete(state, "onboarding")).toBe(true);
    expect(getActiveStep(state)!.id).toBe("combat_dodge");
    expect(state.totalCompleted).toBe(3);
  });

  it("skip + reset restores sequence to initial state", () => {
    let state = createTutorialState();
    state = skipSequence(state, "onboarding");
    state = resetSequence(state, "onboarding");
    expect(isSequenceComplete(state, "onboarding")).toBe(false);
    expect(state.totalCompleted).toBe(0);
    expect(getActiveStep(state)!.id).toBe("onboarding_move");
  });

  it("unlocking and completing gated sequences", () => {
    let state = createTutorialState();
    // Complete all unlocked sequences
    state = skipSequence(state, "onboarding");
    state = skipSequence(state, "combat_basics");
    state = skipSequence(state, "progression");
    expect(state.totalCompleted).toBe(9);
    expect(getActiveStep(state)).toBeNull();

    // Unlock and advance through advanced
    state = unlockSequence(state, "advanced");
    expect(getActiveStep(state)!.id).toBe("adv_boss");
    state = advanceStep(state, "adv_boss");
    expect(getActiveStep(state)!.id).toBe("adv_elite");
  });

  it("checkTrigger with real step trigger conditions", () => {
    const state = createTutorialState();
    const step = getStep(state, "prog_levelup")!;
    expect(checkTrigger(state, step.triggerCondition, { level: 1 })).toBe(false);
    expect(checkTrigger(state, step.triggerCondition, { level: 2 })).toBe(true);
    expect(checkTrigger(state, step.triggerCondition, { level: 10 })).toBe(true);
  });

  it("step order values are sequential within sequences", () => {
    const state = createTutorialState();
    for (const seq of Object.values(state.sequences)) {
      seq.steps.forEach((step, i) => {
        expect(step.order).toBe(i);
      });
    }
  });

  it("step sequenceId matches parent sequence id", () => {
    const state = createTutorialState();
    for (const seq of Object.values(state.sequences)) {
      for (const step of seq.steps) {
        expect(step.sequenceId).toBe(seq.id);
      }
    }
  });
});
