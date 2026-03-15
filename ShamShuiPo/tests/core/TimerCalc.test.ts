import { describe, it, expect } from "vitest";
import {
  createTimerManager,
  addCountdown,
  addStopwatch,
  addInterval,
  addDelayed,
  tick,
  pauseTimer,
  resumeTimer,
  resetTimer,
  removeTimer,
  getTimeRemaining,
  getTimeElapsed,
  getProgress,
  isExpired,
  getActiveTimerCount,
  formatTime,
  pauseAll,
  resumeAll,
} from "../../src/core/TimerCalc";

describe("TimerCalc", () => {
  // ── createTimerManager ──
  describe("createTimerManager", () => {
    it("returns empty timers", () => {
      const s = createTimerManager();
      expect(s.timers).toEqual({});
    });

    it("starts nextId at 1", () => {
      expect(createTimerManager().nextId).toBe(1);
    });
  });

  // ── addCountdown ──
  describe("addCountdown", () => {
    it("adds a countdown timer", () => {
      const { state, id } = addCountdown(createTimerManager(), 5000);
      expect(state.timers[id].type).toBe("countdown");
      expect(state.timers[id].duration).toBe(5000);
    });

    it("starts with elapsed 0", () => {
      const { state, id } = addCountdown(createTimerManager(), 3000);
      expect(state.timers[id].elapsed).toBe(0);
    });

    it("stores callback", () => {
      const { state, id } = addCountdown(createTimerManager(), 1000, "onBomb");
      expect(state.timers[id].callback).toBe("onBomb");
    });

    it("increments nextId", () => {
      const { state } = addCountdown(createTimerManager(), 1000);
      expect(state.nextId).toBe(2);
    });

    it("is not paused or complete initially", () => {
      const { state, id } = addCountdown(createTimerManager(), 1000);
      expect(state.timers[id].isPaused).toBe(false);
      expect(state.timers[id].isComplete).toBe(false);
    });
  });

  // ── addStopwatch ──
  describe("addStopwatch", () => {
    it("creates a stopwatch with infinite duration", () => {
      const { state, id } = addStopwatch(createTimerManager());
      expect(state.timers[id].type).toBe("stopwatch");
      expect(state.timers[id].duration).toBe(Infinity);
    });

    it("starts at elapsed 0", () => {
      const { state, id } = addStopwatch(createTimerManager());
      expect(state.timers[id].elapsed).toBe(0);
    });
  });

  // ── addInterval ──
  describe("addInterval", () => {
    it("creates an interval timer", () => {
      const { state, id } = addInterval(createTimerManager(), 500, 3);
      expect(state.timers[id].type).toBe("interval");
      expect(state.timers[id].duration).toBe(500);
      expect(state.timers[id].maxLoops).toBe(3);
    });

    it("starts with 0 loops", () => {
      const { state, id } = addInterval(createTimerManager(), 500, 5);
      expect(state.timers[id].loops).toBe(0);
    });

    it("stores callback", () => {
      const { state, id } = addInterval(createTimerManager(), 500, 3, "tick");
      expect(state.timers[id].callback).toBe("tick");
    });
  });

  // ── addDelayed ──
  describe("addDelayed", () => {
    it("creates a delayed timer", () => {
      const { state, id } = addDelayed(createTimerManager(), 2000);
      expect(state.timers[id].type).toBe("delayed");
      expect(state.timers[id].duration).toBe(2000);
      expect(state.timers[id].maxLoops).toBe(1);
    });

    it("stores callback", () => {
      const { state, id } = addDelayed(createTimerManager(), 1000, "spawn");
      expect(state.timers[id].callback).toBe("spawn");
    });
  });

  // ── tick ──
  describe("tick", () => {
    it("advances countdown elapsed", () => {
      const { state, id } = addCountdown(createTimerManager(), 3000);
      const result = tick(state, 1000);
      expect(result.state.timers[id].elapsed).toBe(1000);
    });

    it("completes countdown when elapsed >= duration", () => {
      const { state, id } = addCountdown(createTimerManager(), 1000);
      const result = tick(state, 1500);
      expect(result.state.timers[id].isComplete).toBe(true);
      expect(result.completedTimers).toContain(id);
    });

    it("caps countdown elapsed at duration", () => {
      const { state, id } = addCountdown(createTimerManager(), 1000);
      const result = tick(state, 2000);
      expect(result.state.timers[id].elapsed).toBe(1000);
    });

    it("triggers callback on countdown completion", () => {
      const { state } = addCountdown(createTimerManager(), 500, "explode");
      const result = tick(state, 600);
      expect(result.triggeredCallbacks).toContain("explode");
    });

    it("does not trigger callback if none set", () => {
      const { state } = addCountdown(createTimerManager(), 500);
      const result = tick(state, 600);
      expect(result.triggeredCallbacks).toHaveLength(0);
    });

    it("advances stopwatch indefinitely", () => {
      const { state, id } = addStopwatch(createTimerManager());
      const r1 = tick(state, 1000);
      const r2 = tick(r1.state, 2000);
      expect(r2.state.timers[id].elapsed).toBe(3000);
      expect(r2.state.timers[id].isComplete).toBe(false);
    });

    it("interval triggers callback each cycle", () => {
      const { state } = addInterval(createTimerManager(), 100, 3, "pulse");
      const r1 = tick(state, 100);
      expect(r1.triggeredCallbacks).toContain("pulse");
    });

    it("interval increments loops", () => {
      const { state, id } = addInterval(createTimerManager(), 100, 5);
      const r1 = tick(state, 150);
      expect(r1.state.timers[id].loops).toBe(1);
    });

    it("interval resets elapsed after each cycle", () => {
      const { state, id } = addInterval(createTimerManager(), 100, 5);
      const r1 = tick(state, 150);
      expect(r1.state.timers[id].elapsed).toBe(50);
    });

    it("interval completes at maxLoops", () => {
      const { state, id } = addInterval(createTimerManager(), 100, 2);
      const r1 = tick(state, 100);
      const r2 = tick(r1.state, 100);
      expect(r2.state.timers[id].isComplete).toBe(true);
      expect(r2.completedTimers).toContain(id);
    });

    it("delayed completes after delay", () => {
      const { state, id } = addDelayed(createTimerManager(), 1000, "spawn");
      const result = tick(state, 1200);
      expect(result.state.timers[id].isComplete).toBe(true);
      expect(result.triggeredCallbacks).toContain("spawn");
    });

    it("does not advance paused timers", () => {
      const { state, id } = addCountdown(createTimerManager(), 5000);
      const paused = pauseTimer(state, id);
      const result = tick(paused, 2000);
      expect(result.state.timers[id].elapsed).toBe(0);
    });

    it("does not advance completed timers", () => {
      const { state, id } = addCountdown(createTimerManager(), 500);
      const r1 = tick(state, 600);
      const r2 = tick(r1.state, 1000);
      expect(r2.state.timers[id].elapsed).toBe(500);
      expect(r2.completedTimers).toHaveLength(0);
    });

    it("handles multiple timers at once", () => {
      let s = createTimerManager();
      const c1 = addCountdown(s, 100);
      s = c1.state;
      const c2 = addCountdown(s, 200);
      s = c2.state;
      const result = tick(s, 150);
      expect(result.completedTimers).toContain(c1.id);
      expect(result.completedTimers).not.toContain(c2.id);
    });

    it("returns empty arrays when nothing completes", () => {
      const { state } = addCountdown(createTimerManager(), 5000);
      const result = tick(state, 100);
      expect(result.completedTimers).toEqual([]);
      expect(result.triggeredCallbacks).toEqual([]);
    });
  });

  // ── pauseTimer / resumeTimer ──
  describe("pauseTimer", () => {
    it("sets isPaused to true", () => {
      const { state, id } = addCountdown(createTimerManager(), 1000);
      const paused = pauseTimer(state, id);
      expect(paused.timers[id].isPaused).toBe(true);
    });

    it("returns same state if already paused", () => {
      const { state, id } = addCountdown(createTimerManager(), 1000);
      const paused = pauseTimer(state, id);
      const again = pauseTimer(paused, id);
      expect(again).toBe(paused);
    });

    it("returns same state for unknown id", () => {
      const s = createTimerManager();
      expect(pauseTimer(s, "nope")).toBe(s);
    });
  });

  describe("resumeTimer", () => {
    it("sets isPaused to false", () => {
      const { state, id } = addCountdown(createTimerManager(), 1000);
      const paused = pauseTimer(state, id);
      const resumed = resumeTimer(paused, id);
      expect(resumed.timers[id].isPaused).toBe(false);
    });

    it("returns same state if not paused", () => {
      const { state, id } = addCountdown(createTimerManager(), 1000);
      const again = resumeTimer(state, id);
      expect(again).toBe(state);
    });

    it("returns same state for unknown id", () => {
      const s = createTimerManager();
      expect(resumeTimer(s, "nope")).toBe(s);
    });
  });

  // ── pauseAll / resumeAll ──
  describe("pauseAll", () => {
    it("pauses all timers", () => {
      let s = createTimerManager();
      s = addCountdown(s, 1000).state;
      s = addStopwatch(s).state;
      const paused = pauseAll(s);
      for (const t of Object.values(paused.timers)) {
        expect(t.isPaused).toBe(true);
      }
    });

    it("handles empty state", () => {
      const s = createTimerManager();
      const paused = pauseAll(s);
      expect(Object.keys(paused.timers)).toHaveLength(0);
    });
  });

  describe("resumeAll", () => {
    it("resumes all timers", () => {
      let s = createTimerManager();
      s = addCountdown(s, 1000).state;
      s = addStopwatch(s).state;
      const paused = pauseAll(s);
      const resumed = resumeAll(paused);
      for (const t of Object.values(resumed.timers)) {
        expect(t.isPaused).toBe(false);
      }
    });
  });

  // ── resetTimer ──
  describe("resetTimer", () => {
    it("resets elapsed to 0", () => {
      const { state, id } = addCountdown(createTimerManager(), 1000);
      const ticked = tick(state, 500).state;
      const reset = resetTimer(ticked, id);
      expect(reset.timers[id].elapsed).toBe(0);
    });

    it("clears isComplete", () => {
      const { state, id } = addCountdown(createTimerManager(), 500);
      const ticked = tick(state, 600).state;
      expect(ticked.timers[id].isComplete).toBe(true);
      const reset = resetTimer(ticked, id);
      expect(reset.timers[id].isComplete).toBe(false);
    });

    it("resets loops to 0", () => {
      const { state, id } = addInterval(createTimerManager(), 100, 5);
      const ticked = tick(state, 250).state;
      const reset = resetTimer(ticked, id);
      expect(reset.timers[id].loops).toBe(0);
    });

    it("returns same state for unknown id", () => {
      const s = createTimerManager();
      expect(resetTimer(s, "nope")).toBe(s);
    });
  });

  // ── removeTimer ──
  describe("removeTimer", () => {
    it("removes the timer", () => {
      const { state, id } = addCountdown(createTimerManager(), 1000);
      const removed = removeTimer(state, id);
      expect(removed.timers[id]).toBeUndefined();
    });

    it("preserves other timers", () => {
      let s = createTimerManager();
      const { state: s1, id: id1 } = addCountdown(s, 1000);
      const { state: s2, id: id2 } = addCountdown(s1, 2000);
      const removed = removeTimer(s2, id1);
      expect(removed.timers[id1]).toBeUndefined();
      expect(removed.timers[id2]).toBeDefined();
    });

    it("handles removing unknown id gracefully", () => {
      const s = createTimerManager();
      const removed = removeTimer(s, "ghost");
      expect(Object.keys(removed.timers)).toHaveLength(0);
    });
  });

  // ── getTimeRemaining ──
  describe("getTimeRemaining", () => {
    it("returns remaining for countdown", () => {
      const { state, id } = addCountdown(createTimerManager(), 5000);
      const ticked = tick(state, 2000).state;
      expect(getTimeRemaining(ticked.timers[id])).toBe(3000);
    });

    it("returns 0 when countdown complete", () => {
      const { state, id } = addCountdown(createTimerManager(), 1000);
      const ticked = tick(state, 1500).state;
      expect(getTimeRemaining(ticked.timers[id])).toBe(0);
    });

    it("returns remaining for delayed", () => {
      const { state, id } = addDelayed(createTimerManager(), 3000);
      const ticked = tick(state, 1000).state;
      expect(getTimeRemaining(ticked.timers[id])).toBe(2000);
    });

    it("returns 0 for stopwatch", () => {
      const { state, id } = addStopwatch(createTimerManager());
      expect(getTimeRemaining(state.timers[id])).toBe(0);
    });

    it("returns 0 for interval", () => {
      const { state, id } = addInterval(createTimerManager(), 100, 5);
      expect(getTimeRemaining(state.timers[id])).toBe(0);
    });
  });

  // ── getTimeElapsed ──
  describe("getTimeElapsed", () => {
    it("returns elapsed time", () => {
      const { state, id } = addCountdown(createTimerManager(), 5000);
      const ticked = tick(state, 1234).state;
      expect(getTimeElapsed(ticked.timers[id])).toBe(1234);
    });

    it("returns 0 for fresh timer", () => {
      const { state, id } = addCountdown(createTimerManager(), 1000);
      expect(getTimeElapsed(state.timers[id])).toBe(0);
    });
  });

  // ── getProgress ──
  describe("getProgress", () => {
    it("returns 0 at start", () => {
      const { state, id } = addCountdown(createTimerManager(), 1000);
      expect(getProgress(state.timers[id])).toBe(0);
    });

    it("returns 0.5 at midpoint", () => {
      const { state, id } = addCountdown(createTimerManager(), 2000);
      const ticked = tick(state, 1000).state;
      expect(getProgress(ticked.timers[id])).toBe(0.5);
    });

    it("returns 1 when complete", () => {
      const { state, id } = addCountdown(createTimerManager(), 1000);
      const ticked = tick(state, 1500).state;
      expect(getProgress(ticked.timers[id])).toBe(1);
    });

    it("returns 0 for stopwatch (infinite duration)", () => {
      const { state, id } = addStopwatch(createTimerManager());
      const ticked = tick(state, 5000).state;
      expect(getProgress(ticked.timers[id])).toBe(0);
    });

    it("caps at 1", () => {
      const { state, id } = addCountdown(createTimerManager(), 100);
      const ticked = tick(state, 999).state;
      expect(getProgress(ticked.timers[id])).toBeLessThanOrEqual(1);
    });
  });

  // ── isExpired ──
  describe("isExpired", () => {
    it("returns false for active timer", () => {
      const { state, id } = addCountdown(createTimerManager(), 1000);
      expect(isExpired(state.timers[id])).toBe(false);
    });

    it("returns true for completed timer", () => {
      const { state, id } = addCountdown(createTimerManager(), 500);
      const ticked = tick(state, 600).state;
      expect(isExpired(ticked.timers[id])).toBe(true);
    });
  });

  // ── getActiveTimerCount ──
  describe("getActiveTimerCount", () => {
    it("returns 0 for empty state", () => {
      expect(getActiveTimerCount(createTimerManager())).toBe(0);
    });

    it("counts active timers", () => {
      let s = createTimerManager();
      s = addCountdown(s, 1000).state;
      s = addStopwatch(s).state;
      expect(getActiveTimerCount(s)).toBe(2);
    });

    it("excludes paused timers", () => {
      let s = createTimerManager();
      const { state: s1, id } = addCountdown(s, 1000);
      s = addStopwatch(s1).state;
      s = pauseTimer(s, id);
      expect(getActiveTimerCount(s)).toBe(1);
    });

    it("excludes completed timers", () => {
      let s = createTimerManager();
      s = addCountdown(s, 100).state;
      s = addStopwatch(s).state;
      s = tick(s, 200).state;
      expect(getActiveTimerCount(s)).toBe(1);
    });
  });

  // ── formatTime ──
  describe("formatTime", () => {
    it("formats 0ms as 0:00", () => {
      expect(formatTime(0)).toBe("0:00");
    });

    it("formats 1000ms as 0:01", () => {
      expect(formatTime(1000)).toBe("0:01");
    });

    it("formats 60000ms as 1:00", () => {
      expect(formatTime(60000)).toBe("1:00");
    });

    it("formats 90000ms as 1:30", () => {
      expect(formatTime(90000)).toBe("1:30");
    });

    it("formats 5500ms as 0:05.5", () => {
      expect(formatTime(5500)).toBe("0:05.5");
    });

    it("formats 125300ms as 2:05.3", () => {
      expect(formatTime(125300)).toBe("2:05.3");
    });

    it("handles negative as 0:00", () => {
      expect(formatTime(-500)).toBe("0:00");
    });

    it("formats 600000ms as 10:00", () => {
      expect(formatTime(600000)).toBe("10:00");
    });
  });

  // ── immutability ──
  describe("immutability", () => {
    it("tick does not mutate original state", () => {
      const { state, id } = addCountdown(createTimerManager(), 1000);
      const original = state.timers[id].elapsed;
      tick(state, 500);
      expect(state.timers[id].elapsed).toBe(original);
    });

    it("pauseTimer does not mutate original", () => {
      const { state, id } = addCountdown(createTimerManager(), 1000);
      pauseTimer(state, id);
      expect(state.timers[id].isPaused).toBe(false);
    });

    it("removeTimer does not mutate original", () => {
      const { state, id } = addCountdown(createTimerManager(), 1000);
      removeTimer(state, id);
      expect(state.timers[id]).toBeDefined();
    });

    it("resetTimer does not mutate original", () => {
      const { state, id } = addCountdown(createTimerManager(), 1000);
      const ticked = tick(state, 500).state;
      resetTimer(ticked, id);
      expect(ticked.timers[id].elapsed).toBe(500);
    });
  });

  // ── edge cases ──
  describe("edge cases", () => {
    it("tick with dt=0 does not change anything", () => {
      const { state, id } = addCountdown(createTimerManager(), 1000);
      const result = tick(state, 0);
      expect(result.state.timers[id].elapsed).toBe(0);
      expect(result.completedTimers).toEqual([]);
    });

    it("multiple adds produce unique ids", () => {
      let s = createTimerManager();
      const r1 = addCountdown(s, 100);
      const r2 = addCountdown(r1.state, 200);
      const r3 = addStopwatch(r2.state);
      expect(new Set([r1.id, r2.id, r3.id]).size).toBe(3);
    });

    it("countdown exactly at duration completes", () => {
      const { state, id } = addCountdown(createTimerManager(), 1000);
      const result = tick(state, 1000);
      expect(result.state.timers[id].isComplete).toBe(true);
      expect(result.completedTimers).toContain(id);
    });
  });
});
