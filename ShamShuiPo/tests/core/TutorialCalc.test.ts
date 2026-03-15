import { describe, it, expect } from "vitest";
import {
  createTutorialState,
  getDefaultSteps,
  checkTrigger,
  getNextHint,
  markShown,
  markCompleted,
  shouldShowHints,
  getProgress,
  type TutorialStep,
  type TutorialState,
  type TriggerContext,
} from "../../src/core/TutorialCalc";

function makeContext(overrides: Partial<TriggerContext> = {}): TriggerContext {
  return {
    elapsed: 0,
    level: 1,
    kills: 0,
    tookDamage: false,
    isUpgrading: false,
    bossActive: false,
    hpRatio: 1,
    ...overrides,
  };
}

describe("TutorialCalc", () => {
  // ── createTutorialState ──────────────────────────────────────────────

  describe("createTutorialState", () => {
    it("creates fresh state for first run", () => {
      const s = createTutorialState(true);
      expect(s.isFirstRun).toBe(true);
      expect(s.completedIds).toEqual([]);
      expect(s.showCounts).toEqual({});
      expect(s.currentHint).toBeNull();
    });

    it("creates state for returning player", () => {
      const s = createTutorialState(false);
      expect(s.isFirstRun).toBe(false);
    });
  });

  // ── getDefaultSteps ──────────────────────────────────────────────────

  describe("getDefaultSteps", () => {
    it("returns 7 tutorial steps", () => {
      expect(getDefaultSteps()).toHaveLength(7);
    });

    it("steps have unique ids", () => {
      const ids = getDefaultSteps().map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("steps are sorted by priority ascending", () => {
      const steps = getDefaultSteps();
      for (let i = 1; i < steps.length; i++) {
        expect(steps[i].priority).toBeGreaterThan(steps[i - 1].priority);
      }
    });
  });

  // ── checkTrigger ─────────────────────────────────────────────────────

  describe("checkTrigger", () => {
    const steps = getDefaultSteps();
    const find = (id: string) => steps.find((s) => s.id === id)!;

    it("time trigger — met when elapsed >= seconds", () => {
      expect(checkTrigger(find("move"), makeContext({ elapsed: 3 }))).toBe(
        true,
      );
      expect(checkTrigger(find("move"), makeContext({ elapsed: 2 }))).toBe(
        false,
      );
    });

    it("time trigger — auto_attack at 8s", () => {
      expect(
        checkTrigger(find("auto_attack"), makeContext({ elapsed: 10 })),
      ).toBe(true);
      expect(
        checkTrigger(find("auto_attack"), makeContext({ elapsed: 7 })),
      ).toBe(false);
    });

    it("kills trigger — met when kills >= count", () => {
      expect(checkTrigger(find("collect_xp"), makeContext({ kills: 5 }))).toBe(
        true,
      );
      expect(checkTrigger(find("collect_xp"), makeContext({ kills: 4 }))).toBe(
        false,
      );
    });

    it("first_damage trigger", () => {
      expect(
        checkTrigger(find("dodge"), makeContext({ tookDamage: true })),
      ).toBe(true);
      expect(
        checkTrigger(find("dodge"), makeContext({ tookDamage: false })),
      ).toBe(false);
    });

    it("first_upgrade trigger", () => {
      expect(
        checkTrigger(find("first_upgrade"), makeContext({ isUpgrading: true })),
      ).toBe(true);
      expect(
        checkTrigger(
          find("first_upgrade"),
          makeContext({ isUpgrading: false }),
        ),
      ).toBe(false);
    });

    it("boss_spawn trigger", () => {
      expect(
        checkTrigger(find("boss_warning"), makeContext({ bossActive: true })),
      ).toBe(true);
      expect(
        checkTrigger(find("boss_warning"), makeContext({ bossActive: false })),
      ).toBe(false);
    });

    it("low_hp trigger — met when hpRatio <= threshold", () => {
      expect(checkTrigger(find("low_hp"), makeContext({ hpRatio: 0.3 }))).toBe(
        true,
      );
      expect(checkTrigger(find("low_hp"), makeContext({ hpRatio: 0.2 }))).toBe(
        true,
      );
      expect(checkTrigger(find("low_hp"), makeContext({ hpRatio: 0.31 }))).toBe(
        false,
      );
    });

    it("level trigger works", () => {
      const step: TutorialStep = {
        id: "test_level",
        trigger: { type: "level", level: 3 },
        message: "test",
        priority: 1,
        maxShows: 1,
      };
      expect(checkTrigger(step, makeContext({ level: 3 }))).toBe(true);
      expect(checkTrigger(step, makeContext({ level: 2 }))).toBe(false);
    });
  });

  // ── getNextHint ──────────────────────────────────────────────────────

  describe("getNextHint", () => {
    it("returns null when no triggers are met", () => {
      const state = createTutorialState(true);
      expect(getNextHint(state, makeContext())).toBeNull();
    });

    it("returns highest-priority step when multiple triggers met", () => {
      const state = createTutorialState(true);
      const ctx = makeContext({ elapsed: 10, kills: 10 });
      const hint = getNextHint(state, ctx);
      expect(hint?.id).toBe("move"); // priority 1
    });

    it("skips completed steps", () => {
      let state = createTutorialState(true);
      state = markCompleted(state, "move");
      const ctx = makeContext({ elapsed: 10 });
      const hint = getNextHint(state, ctx);
      expect(hint?.id).toBe("auto_attack");
    });

    it("skips steps that reached maxShows", () => {
      let state = createTutorialState(true);
      // "move" has maxShows 3
      state = markShown(state, "move");
      state = markShown(state, "move");
      state = markShown(state, "move");
      const ctx = makeContext({ elapsed: 10 });
      const hint = getNextHint(state, ctx);
      expect(hint?.id).toBe("auto_attack");
    });

    it("returns null when all triggered steps are completed", () => {
      let state = createTutorialState(true);
      state = markCompleted(state, "move");
      state = markCompleted(state, "auto_attack");
      const ctx = makeContext({ elapsed: 10 }); // only time triggers
      expect(getNextHint(state, ctx)).toBeNull();
    });

    it("accepts custom steps array", () => {
      const custom: TutorialStep[] = [
        {
          id: "custom",
          trigger: { type: "time", seconds: 0 },
          message: "hi",
          priority: 1,
          maxShows: 1,
        },
      ];
      const state = createTutorialState(true);
      const hint = getNextHint(state, makeContext(), custom);
      expect(hint?.id).toBe("custom");
    });
  });

  // ── markShown ────────────────────────────────────────────────────────

  describe("markShown", () => {
    it("increments show count", () => {
      let state = createTutorialState(true);
      state = markShown(state, "move");
      expect(state.showCounts["move"]).toBe(1);
      state = markShown(state, "move");
      expect(state.showCounts["move"]).toBe(2);
    });

    it("sets currentHint to the shown step", () => {
      let state = createTutorialState(true);
      state = markShown(state, "dodge");
      expect(state.currentHint).toBe("dodge");
    });

    it("does not mutate original state", () => {
      const original = createTutorialState(true);
      const updated = markShown(original, "move");
      expect(original.showCounts).toEqual({});
      expect(updated.showCounts["move"]).toBe(1);
    });
  });

  // ── markCompleted ────────────────────────────────────────────────────

  describe("markCompleted", () => {
    it("adds step to completedIds", () => {
      let state = createTutorialState(true);
      state = markCompleted(state, "move");
      expect(state.completedIds).toContain("move");
    });

    it("clears currentHint if it matches completed step", () => {
      let state = createTutorialState(true);
      state = markShown(state, "move");
      expect(state.currentHint).toBe("move");
      state = markCompleted(state, "move");
      expect(state.currentHint).toBeNull();
    });

    it("keeps currentHint if completing a different step", () => {
      let state = createTutorialState(true);
      state = markShown(state, "move");
      state = markCompleted(state, "dodge");
      expect(state.currentHint).toBe("move");
    });

    it("is idempotent — completing twice does not duplicate", () => {
      let state = createTutorialState(true);
      state = markCompleted(state, "move");
      state = markCompleted(state, "move");
      expect(state.completedIds.filter((id) => id === "move")).toHaveLength(1);
    });

    it("does not mutate original state", () => {
      const original = createTutorialState(true);
      const updated = markCompleted(original, "move");
      expect(original.completedIds).toEqual([]);
      expect(updated.completedIds).toContain("move");
    });
  });

  // ── shouldShowHints ──────────────────────────────────────────────────

  describe("shouldShowHints", () => {
    it("returns true for first run with uncompleted steps", () => {
      expect(shouldShowHints(createTutorialState(true))).toBe(true);
    });

    it("returns false for non-first-run", () => {
      expect(shouldShowHints(createTutorialState(false))).toBe(false);
    });

    it("returns false when all steps completed", () => {
      let state = createTutorialState(true);
      for (const step of getDefaultSteps()) {
        state = markCompleted(state, step.id);
      }
      expect(shouldShowHints(state)).toBe(false);
    });
  });

  // ── getProgress ──────────────────────────────────────────────────────

  describe("getProgress", () => {
    it("starts at 0/7", () => {
      const p = getProgress(createTutorialState(true));
      expect(p).toEqual({ completed: 0, total: 7 });
    });

    it("tracks partial completion", () => {
      let state = createTutorialState(true);
      state = markCompleted(state, "move");
      state = markCompleted(state, "dodge");
      expect(getProgress(state)).toEqual({ completed: 2, total: 7 });
    });

    it("reaches full completion", () => {
      let state = createTutorialState(true);
      for (const step of getDefaultSteps()) {
        state = markCompleted(state, step.id);
      }
      expect(getProgress(state)).toEqual({ completed: 7, total: 7 });
    });

    it("ignores unknown completed ids", () => {
      let state = createTutorialState(true);
      state = markCompleted(state, "nonexistent");
      expect(getProgress(state)).toEqual({ completed: 0, total: 7 });
    });
  });
});
