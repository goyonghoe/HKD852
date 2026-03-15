/**
 * Lightweight localStorage-based analytics for WanChai.
 * ZERO external dependencies — no network calls.
 */

const STORAGE_KEY = 'wanchai_analytics';
const MAX_AGE_DAYS = 7;

export interface GameEvent {
  event: string;
  data: Record<string, string | number | boolean>;
  timestamp: number;
  sessionId: string;
}

let currentSessionId = '';

function getSessionId(): string {
  if (!currentSessionId) {
    currentSessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
  return currentSessionId;
}

/** Reset session ID (call at the start of each new game run). */
export function resetSession(): void {
  currentSessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isGameEventArray(v: unknown): v is GameEvent[] {
  if (!Array.isArray(v)) return false;
  // Validate first element as a spot check (empty array is valid)
  if (v.length === 0) return true;
  const first = v[0] as Record<string, unknown>;
  return typeof first.event === 'string' && typeof first.timestamp === 'number';
}

function loadEvents(): GameEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!isGameEventArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveEvents(events: GameEvent[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch {
    // localStorage full or unavailable — silent fail
  }
}

/** Track a game event. Lightweight push to localStorage array. */
export function trackEvent(event: string, data: Record<string, string | number | boolean> = {}): void {
  const events = loadEvents();
  events.push({
    event,
    data,
    timestamp: Date.now(),
    sessionId: getSessionId(),
  });
  saveEvents(events);
}

/** Get all events for the current session. */
export function getSessionEvents(): GameEvent[] {
  const sid = getSessionId();
  return loadEvents().filter((e) => e.sessionId === sid);
}

/** Get event name -> count map for all stored events. */
export function getEventSummary(): Record<string, number> {
  const events = loadEvents();
  const summary: Record<string, number> = {};
  for (const e of events) {
    summary[e.event] = (summary[e.event] ?? 0) + 1;
  }
  return summary;
}

/** Remove events older than maxAgeDays (default 7). Called on init. */
export function clearOldEvents(maxAgeDays = MAX_AGE_DAYS): void {
  const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
  const events = loadEvents().filter((e) => e.timestamp >= cutoff);
  saveEvents(events);
}

// Auto-cleanup on module load
clearOldEvents();
