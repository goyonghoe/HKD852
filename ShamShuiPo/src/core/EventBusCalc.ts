// ── EventBusCalc ─────────────────────────────────────────────
// Type-safe event bus for decoupled module communication.
// Pure TypeScript — NO Phaser imports.
// Event objects are treated as immutable once created.
// ─────────────────────────────────────────────────────────────

// ── Types ────────────────────────────────────────────────────

export type GameEventType =
  | "enemy_killed"
  | "player_damaged"
  | "player_healed"
  | "level_up"
  | "wave_start"
  | "wave_end"
  | "boss_spawn"
  | "boss_killed"
  | "item_pickup"
  | "weapon_upgrade"
  | "combo_milestone"
  | "achievement_unlock"
  | "game_over";

export interface GameEvent {
  readonly type: GameEventType;
  readonly timestamp: number;
  readonly data: Readonly<Record<string, unknown>>;
}

export type EventHandler = (event: GameEvent) => void;

export interface EventBusState {
  readonly handlers: Map<GameEventType, EventHandler[]>;
  readonly history: GameEvent[];
  readonly historyLimit: number;
  readonly isPaused: boolean;
  /** Internal queue for events emitted while paused */
  readonly _queue: Array<{
    type: GameEventType;
    data: Record<string, unknown>;
  }>;
}

// ── Factory ──────────────────────────────────────────────────

export function createEventBus(historyLimit: number = 100): EventBusState {
  return {
    handlers: new Map(),
    history: [],
    historyLimit,
    isPaused: false,
    _queue: [],
  };
}

// ── Subscribe / Unsubscribe ──────────────────────────────────

/**
 * Add a handler for the given event type.
 * Returns an unsubscribe function for convenience.
 */
export function subscribe(
  bus: EventBusState,
  eventType: GameEventType,
  handler: EventHandler,
): () => void {
  const list = bus.handlers.get(eventType);
  if (list) {
    list.push(handler);
  } else {
    bus.handlers.set(eventType, [handler]);
  }
  return () => unsubscribe(bus, eventType, handler);
}

/** Remove a specific handler for the given event type. */
export function unsubscribe(
  bus: EventBusState,
  eventType: GameEventType,
  handler: EventHandler,
): void {
  const list = bus.handlers.get(eventType);
  if (!list) return;
  const idx = list.indexOf(handler);
  if (idx !== -1) list.splice(idx, 1);
}

// ── Emit ─────────────────────────────────────────────────────

/** Trigger all handlers for the given event type. */
export function emit(
  bus: EventBusState,
  eventType: GameEventType,
  data: Record<string, unknown> = {},
): GameEvent {
  if (bus.isPaused) {
    bus._queue.push({ type: eventType, data });
    // Return a frozen event even when paused (for caller reference)
    return Object.freeze({
      type: eventType,
      timestamp: Date.now(),
      data: Object.freeze({ ...data }),
    });
  }
  return _dispatchAndRecord(bus, eventType, data);
}

/** Emit multiple events efficiently. */
export function emitBatch(
  bus: EventBusState,
  events: Array<{ type: GameEventType; data?: Record<string, unknown> }>,
): GameEvent[] {
  return events.map((e) => emit(bus, e.type, e.data ?? {}));
}

// ── History ──────────────────────────────────────────────────

/** Get event history, optionally filtered by type. */
export function getHistory(
  bus: EventBusState,
  eventType?: GameEventType,
): readonly GameEvent[] {
  if (eventType === undefined) return bus.history;
  return bus.history.filter((e) => e.type === eventType);
}

/** Get the most recent event of the given type, or undefined. */
export function getLastEvent(
  bus: EventBusState,
  eventType: GameEventType,
): GameEvent | undefined {
  for (let i = bus.history.length - 1; i >= 0; i--) {
    if (bus.history[i].type === eventType) return bus.history[i];
  }
  return undefined;
}

/** Clear all event history. */
export function clearHistory(bus: EventBusState): void {
  bus.history.length = 0;
}

// ── Pause / Resume ───────────────────────────────────────────

/** Stop processing events — queue them instead. */
export function pause(bus: EventBusState): void {
  (bus as { isPaused: boolean }).isPaused = true;
}

/** Resume processing and flush all queued events. */
export function resume(bus: EventBusState): void {
  (bus as { isPaused: boolean }).isPaused = false;
  // Drain the queue
  while (bus._queue.length > 0) {
    const queued = bus._queue.shift()!;
    _dispatchAndRecord(bus, queued.type, queued.data);
  }
}

// ── Query helpers ────────────────────────────────────────────

/** Count the number of handlers registered for a given event type. */
export function getSubscriberCount(
  bus: EventBusState,
  eventType: GameEventType,
): number {
  return bus.handlers.get(eventType)?.length ?? 0;
}

/** Check whether any handlers are registered for a given event type. */
export function hasSubscribers(
  bus: EventBusState,
  eventType: GameEventType,
): boolean {
  return getSubscriberCount(bus, eventType) > 0;
}

// ── Once ─────────────────────────────────────────────────────

/** Subscribe for a single event then auto-unsubscribe. */
export function once(
  bus: EventBusState,
  eventType: GameEventType,
  handler: EventHandler,
): () => void {
  const wrapper: EventHandler = (event) => {
    unsubscribe(bus, eventType, wrapper);
    handler(event);
  };
  return subscribe(bus, eventType, wrapper);
}

// ── Cleanup ──────────────────────────────────────────────────

/**
 * Remove all handlers for a specific event type,
 * or all handlers entirely when no type is given.
 */
export function removeAllHandlers(
  bus: EventBusState,
  eventType?: GameEventType,
): void {
  if (eventType !== undefined) {
    bus.handlers.delete(eventType);
  } else {
    bus.handlers.clear();
  }
}

// ── Internal ─────────────────────────────────────────────────

function _dispatchAndRecord(
  bus: EventBusState,
  eventType: GameEventType,
  data: Record<string, unknown>,
): GameEvent {
  const event: GameEvent = Object.freeze({
    type: eventType,
    timestamp: Date.now(),
    data: Object.freeze({ ...data }),
  });

  // Record in history (trim to limit)
  bus.history.push(event);
  while (bus.history.length > bus.historyLimit) {
    bus.history.shift();
  }

  // Dispatch to handlers (copy list to avoid mutation during iteration)
  const list = bus.handlers.get(eventType);
  if (list) {
    const snapshot = [...list];
    for (const handler of snapshot) {
      handler(event);
    }
  }

  return event;
}
