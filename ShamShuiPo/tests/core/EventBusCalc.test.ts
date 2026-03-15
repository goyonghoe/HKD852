import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createEventBus,
  subscribe,
  unsubscribe,
  emit,
  emitBatch,
  getHistory,
  getLastEvent,
  clearHistory,
  pause,
  resume,
  getSubscriberCount,
  hasSubscribers,
  once,
  removeAllHandlers,
  type EventBusState,
  type GameEvent,
} from "../../src/core/EventBusCalc";

describe("EventBusCalc", () => {
  let bus: EventBusState;

  beforeEach(() => {
    bus = createEventBus();
  });

  // ── createEventBus ──────────────────────────────────────────

  describe("createEventBus", () => {
    it("creates a bus with default historyLimit of 100", () => {
      expect(bus.historyLimit).toBe(100);
    });

    it("creates a bus with custom historyLimit", () => {
      const custom = createEventBus(50);
      expect(custom.historyLimit).toBe(50);
    });

    it("starts with empty handlers", () => {
      expect(bus.handlers.size).toBe(0);
    });

    it("starts with empty history", () => {
      expect(bus.history).toHaveLength(0);
    });

    it("starts unpaused", () => {
      expect(bus.isPaused).toBe(false);
    });

    it("starts with empty queue", () => {
      expect(bus._queue).toHaveLength(0);
    });
  });

  // ── subscribe ───────────────────────────────────────────────

  describe("subscribe", () => {
    it("adds a handler for the given event type", () => {
      const handler = vi.fn();
      subscribe(bus, "enemy_killed", handler);
      expect(getSubscriberCount(bus, "enemy_killed")).toBe(1);
    });

    it("allows multiple handlers for the same event type", () => {
      subscribe(bus, "enemy_killed", vi.fn());
      subscribe(bus, "enemy_killed", vi.fn());
      subscribe(bus, "enemy_killed", vi.fn());
      expect(getSubscriberCount(bus, "enemy_killed")).toBe(3);
    });

    it("returns an unsubscribe function", () => {
      const handler = vi.fn();
      const unsub = subscribe(bus, "level_up", handler);
      expect(typeof unsub).toBe("function");
      unsub();
      expect(getSubscriberCount(bus, "level_up")).toBe(0);
    });

    it("returned unsub only removes the specific handler", () => {
      const h1 = vi.fn();
      const h2 = vi.fn();
      const unsub1 = subscribe(bus, "wave_start", h1);
      subscribe(bus, "wave_start", h2);
      unsub1();
      expect(getSubscriberCount(bus, "wave_start")).toBe(1);
      emit(bus, "wave_start");
      expect(h1).not.toHaveBeenCalled();
      expect(h2).toHaveBeenCalledOnce();
    });
  });

  // ── unsubscribe ─────────────────────────────────────────────

  describe("unsubscribe", () => {
    it("removes a specific handler", () => {
      const handler = vi.fn();
      subscribe(bus, "boss_spawn", handler);
      unsubscribe(bus, "boss_spawn", handler);
      expect(getSubscriberCount(bus, "boss_spawn")).toBe(0);
    });

    it("does nothing when handler is not found", () => {
      const h1 = vi.fn();
      const h2 = vi.fn();
      subscribe(bus, "boss_spawn", h1);
      unsubscribe(bus, "boss_spawn", h2); // h2 was never subscribed
      expect(getSubscriberCount(bus, "boss_spawn")).toBe(1);
    });

    it("does nothing when event type has no handlers", () => {
      expect(() => unsubscribe(bus, "game_over", vi.fn())).not.toThrow();
    });
  });

  // ── emit ────────────────────────────────────────────────────

  describe("emit", () => {
    it("calls all handlers for the event type", () => {
      const h1 = vi.fn();
      const h2 = vi.fn();
      subscribe(bus, "enemy_killed", h1);
      subscribe(bus, "enemy_killed", h2);
      emit(bus, "enemy_killed", { enemyId: "drone_01" });
      expect(h1).toHaveBeenCalledOnce();
      expect(h2).toHaveBeenCalledOnce();
    });

    it("passes the correct GameEvent to handlers", () => {
      const handler = vi.fn();
      subscribe(bus, "player_damaged", handler);
      emit(bus, "player_damaged", { amount: 25 });
      const event: GameEvent = handler.mock.calls[0][0];
      expect(event.type).toBe("player_damaged");
      expect(event.data).toEqual({ amount: 25 });
      expect(typeof event.timestamp).toBe("number");
    });

    it("does not call handlers of other event types", () => {
      const handler = vi.fn();
      subscribe(bus, "level_up", handler);
      emit(bus, "enemy_killed");
      expect(handler).not.toHaveBeenCalled();
    });

    it("returns a frozen GameEvent", () => {
      const event = emit(bus, "item_pickup", { itemId: "xp_orb" });
      expect(Object.isFrozen(event)).toBe(true);
      expect(Object.isFrozen(event.data)).toBe(true);
    });

    it("records event in history", () => {
      emit(bus, "wave_start", { waveNum: 1 });
      expect(bus.history).toHaveLength(1);
      expect(bus.history[0].type).toBe("wave_start");
    });

    it("defaults data to empty object", () => {
      const handler = vi.fn();
      subscribe(bus, "game_over", handler);
      emit(bus, "game_over");
      expect(handler.mock.calls[0][0].data).toEqual({});
    });

    it("enforces history limit", () => {
      const small = createEventBus(3);
      emit(small, "enemy_killed", { id: 1 });
      emit(small, "enemy_killed", { id: 2 });
      emit(small, "enemy_killed", { id: 3 });
      emit(small, "enemy_killed", { id: 4 });
      expect(small.history).toHaveLength(3);
      expect(small.history[0].data).toEqual({ id: 2 });
    });

    it("works when no handlers are registered", () => {
      expect(() => emit(bus, "boss_killed")).not.toThrow();
      expect(bus.history).toHaveLength(1);
    });
  });

  // ── emitBatch ───────────────────────────────────────────────

  describe("emitBatch", () => {
    it("emits multiple events and returns all", () => {
      const handler = vi.fn();
      subscribe(bus, "enemy_killed", handler);
      const results = emitBatch(bus, [
        { type: "enemy_killed", data: { id: 1 } },
        { type: "enemy_killed", data: { id: 2 } },
        { type: "wave_end" },
      ]);
      expect(results).toHaveLength(3);
      expect(handler).toHaveBeenCalledTimes(2);
    });

    it("records all events in history", () => {
      emitBatch(bus, [
        { type: "wave_start" },
        { type: "boss_spawn" },
        { type: "boss_killed" },
      ]);
      expect(bus.history).toHaveLength(3);
    });

    it("defaults data to empty object for entries without data", () => {
      const results = emitBatch(bus, [{ type: "game_over" }]);
      expect(results[0].data).toEqual({});
    });
  });

  // ── getHistory ──────────────────────────────────────────────

  describe("getHistory", () => {
    it("returns all history when no type filter is given", () => {
      emit(bus, "enemy_killed");
      emit(bus, "level_up");
      emit(bus, "wave_end");
      expect(getHistory(bus)).toHaveLength(3);
    });

    it("filters history by event type", () => {
      emit(bus, "enemy_killed");
      emit(bus, "level_up");
      emit(bus, "enemy_killed");
      const filtered = getHistory(bus, "enemy_killed");
      expect(filtered).toHaveLength(2);
      expect(filtered.every((e) => e.type === "enemy_killed")).toBe(true);
    });

    it("returns empty array when no events match", () => {
      emit(bus, "enemy_killed");
      expect(getHistory(bus, "game_over")).toHaveLength(0);
    });
  });

  // ── getLastEvent ────────────────────────────────────────────

  describe("getLastEvent", () => {
    it("returns the most recent event of the given type", () => {
      emit(bus, "enemy_killed", { id: 1 });
      emit(bus, "level_up");
      emit(bus, "enemy_killed", { id: 2 });
      const last = getLastEvent(bus, "enemy_killed");
      expect(last).toBeDefined();
      expect(last!.data).toEqual({ id: 2 });
    });

    it("returns undefined when no event of that type exists", () => {
      emit(bus, "enemy_killed");
      expect(getLastEvent(bus, "boss_killed")).toBeUndefined();
    });

    it("returns undefined on empty history", () => {
      expect(getLastEvent(bus, "game_over")).toBeUndefined();
    });
  });

  // ── clearHistory ────────────────────────────────────────────

  describe("clearHistory", () => {
    it("removes all history entries", () => {
      emit(bus, "enemy_killed");
      emit(bus, "level_up");
      clearHistory(bus);
      expect(bus.history).toHaveLength(0);
    });

    it("does not affect handlers", () => {
      const handler = vi.fn();
      subscribe(bus, "enemy_killed", handler);
      emit(bus, "enemy_killed");
      clearHistory(bus);
      emit(bus, "enemy_killed");
      expect(handler).toHaveBeenCalledTimes(2);
    });
  });

  // ── pause / resume ─────────────────────────────────────────

  describe("pause", () => {
    it("sets isPaused to true", () => {
      pause(bus);
      expect(bus.isPaused).toBe(true);
    });

    it("prevents handlers from being called", () => {
      const handler = vi.fn();
      subscribe(bus, "enemy_killed", handler);
      pause(bus);
      emit(bus, "enemy_killed");
      expect(handler).not.toHaveBeenCalled();
    });

    it("queues events while paused", () => {
      pause(bus);
      emit(bus, "enemy_killed");
      emit(bus, "level_up");
      expect(bus._queue).toHaveLength(2);
    });

    it("does not record paused events in history", () => {
      pause(bus);
      emit(bus, "enemy_killed");
      expect(bus.history).toHaveLength(0);
    });
  });

  describe("resume", () => {
    it("sets isPaused to false", () => {
      pause(bus);
      resume(bus);
      expect(bus.isPaused).toBe(false);
    });

    it("flushes queued events to handlers", () => {
      const handler = vi.fn();
      subscribe(bus, "enemy_killed", handler);
      pause(bus);
      emit(bus, "enemy_killed", { id: 1 });
      emit(bus, "enemy_killed", { id: 2 });
      expect(handler).not.toHaveBeenCalled();
      resume(bus);
      expect(handler).toHaveBeenCalledTimes(2);
    });

    it("records flushed events in history", () => {
      pause(bus);
      emit(bus, "wave_start");
      emit(bus, "wave_end");
      resume(bus);
      expect(bus.history).toHaveLength(2);
    });

    it("clears the queue after resume", () => {
      pause(bus);
      emit(bus, "enemy_killed");
      resume(bus);
      expect(bus._queue).toHaveLength(0);
    });

    it("maintains event order when flushing", () => {
      pause(bus);
      emit(bus, "wave_start", { n: 1 });
      emit(bus, "boss_spawn", { boss: "aero" });
      emit(bus, "wave_end", { n: 1 });
      resume(bus);
      expect(bus.history.map((e) => e.type)).toEqual([
        "wave_start",
        "boss_spawn",
        "wave_end",
      ]);
    });
  });

  // ── getSubscriberCount ──────────────────────────────────────

  describe("getSubscriberCount", () => {
    it("returns 0 for unregistered event type", () => {
      expect(getSubscriberCount(bus, "game_over")).toBe(0);
    });

    it("returns correct count after subscribing", () => {
      subscribe(bus, "item_pickup", vi.fn());
      subscribe(bus, "item_pickup", vi.fn());
      expect(getSubscriberCount(bus, "item_pickup")).toBe(2);
    });

    it("decreases after unsubscribe", () => {
      const h = vi.fn();
      subscribe(bus, "item_pickup", h);
      subscribe(bus, "item_pickup", vi.fn());
      unsubscribe(bus, "item_pickup", h);
      expect(getSubscriberCount(bus, "item_pickup")).toBe(1);
    });
  });

  // ── hasSubscribers ──────────────────────────────────────────

  describe("hasSubscribers", () => {
    it("returns false when no subscribers", () => {
      expect(hasSubscribers(bus, "combo_milestone")).toBe(false);
    });

    it("returns true when subscribers exist", () => {
      subscribe(bus, "combo_milestone", vi.fn());
      expect(hasSubscribers(bus, "combo_milestone")).toBe(true);
    });
  });

  // ── once ────────────────────────────────────────────────────

  describe("once", () => {
    it("fires handler only once then auto-unsubscribes", () => {
      const handler = vi.fn();
      once(bus, "achievement_unlock", handler);
      emit(bus, "achievement_unlock", { id: "first_blood" });
      emit(bus, "achievement_unlock", { id: "second_kill" });
      expect(handler).toHaveBeenCalledOnce();
    });

    it("receives the correct event", () => {
      const handler = vi.fn();
      once(bus, "boss_killed", handler);
      emit(bus, "boss_killed", { bossId: "hydra" });
      expect(handler.mock.calls[0][0].data).toEqual({ bossId: "hydra" });
    });

    it("returns an unsubscribe function", () => {
      const handler = vi.fn();
      const unsub = once(bus, "level_up", handler);
      unsub();
      emit(bus, "level_up");
      expect(handler).not.toHaveBeenCalled();
    });

    it("does not affect other handlers", () => {
      const onceHandler = vi.fn();
      const permanentHandler = vi.fn();
      once(bus, "enemy_killed", onceHandler);
      subscribe(bus, "enemy_killed", permanentHandler);
      emit(bus, "enemy_killed");
      emit(bus, "enemy_killed");
      expect(onceHandler).toHaveBeenCalledOnce();
      expect(permanentHandler).toHaveBeenCalledTimes(2);
    });
  });

  // ── removeAllHandlers ───────────────────────────────────────

  describe("removeAllHandlers", () => {
    it("removes all handlers for a specific event type", () => {
      subscribe(bus, "enemy_killed", vi.fn());
      subscribe(bus, "enemy_killed", vi.fn());
      subscribe(bus, "level_up", vi.fn());
      removeAllHandlers(bus, "enemy_killed");
      expect(hasSubscribers(bus, "enemy_killed")).toBe(false);
      expect(hasSubscribers(bus, "level_up")).toBe(true);
    });

    it("removes all handlers entirely when no type given", () => {
      subscribe(bus, "enemy_killed", vi.fn());
      subscribe(bus, "level_up", vi.fn());
      subscribe(bus, "game_over", vi.fn());
      removeAllHandlers(bus);
      expect(bus.handlers.size).toBe(0);
    });

    it("is safe to call on empty bus", () => {
      expect(() => removeAllHandlers(bus)).not.toThrow();
      expect(() => removeAllHandlers(bus, "boss_spawn")).not.toThrow();
    });
  });

  // ── Edge cases / Integration ────────────────────────────────

  describe("edge cases", () => {
    it("handler that subscribes another handler during emit", () => {
      const late = vi.fn();
      subscribe(bus, "enemy_killed", () => {
        subscribe(bus, "enemy_killed", late);
      });
      emit(bus, "enemy_killed");
      // late was added during emit but should NOT be called in the same dispatch
      // because we snapshot the handler list
      expect(late).not.toHaveBeenCalled();
      // subsequent emit should call it
      emit(bus, "enemy_killed");
      expect(late).toHaveBeenCalledOnce();
    });

    it("handler that unsubscribes itself during emit", () => {
      let count = 0;
      const selfRemove = (event: GameEvent) => {
        count++;
        unsubscribe(bus, "enemy_killed", selfRemove);
      };
      subscribe(bus, "enemy_killed", selfRemove);
      subscribe(bus, "enemy_killed", vi.fn()); // another handler
      emit(bus, "enemy_killed");
      expect(count).toBe(1);
      emit(bus, "enemy_killed");
      expect(count).toBe(1); // should not fire again
    });

    it("history limit of 1 keeps only the latest event", () => {
      const tiny = createEventBus(1);
      emit(tiny, "enemy_killed", { id: "a" });
      emit(tiny, "level_up", { level: 5 });
      expect(tiny.history).toHaveLength(1);
      expect(tiny.history[0].type).toBe("level_up");
    });

    it("emit returns event even with no handlers registered", () => {
      const event = emit(bus, "weapon_upgrade", { weapon: "laser" });
      expect(event.type).toBe("weapon_upgrade");
      expect(event.data).toEqual({ weapon: "laser" });
    });

    it("multiple buses are independent", () => {
      const bus2 = createEventBus();
      const h1 = vi.fn();
      const h2 = vi.fn();
      subscribe(bus, "enemy_killed", h1);
      subscribe(bus2, "enemy_killed", h2);
      emit(bus, "enemy_killed");
      expect(h1).toHaveBeenCalledOnce();
      expect(h2).not.toHaveBeenCalled();
    });

    it("pause then emit then resume preserves data", () => {
      const handler = vi.fn();
      subscribe(bus, "player_healed", handler);
      pause(bus);
      emit(bus, "player_healed", { amount: 50 });
      resume(bus);
      expect(handler.mock.calls[0][0].data).toEqual({ amount: 50 });
    });
  });
});
