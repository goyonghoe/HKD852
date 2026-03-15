/**
 * AnalyticsCalc — Pure TS analytics event builder.
 * NO Phaser imports. Provides event creation, GA4 formatting, and session metrics.
 */

// ---------- Types ----------

export interface GameEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
  timestamp: number;
}

// ---------- Event Creation ----------

/**
 * Create a structured game event with a timestamp.
 */
export function createGameEvent(category: string, action: string, label?: string, value?: number): GameEvent {
  return {
    category,
    action,
    label,
    value,
    timestamp: Date.now(),
  };
}

// ---------- GA4 Formatting ----------

/**
 * Format a GameEvent into a GA4-compatible event payload.
 * Maps to gtag('event', action, { ... }) parameter structure.
 */
export function formatEventForGA4(event: GameEvent): Record<string, unknown> {
  const params: Record<string, unknown> = {
    event_name: event.action,
    event_category: event.category,
    timestamp: event.timestamp,
  };
  if (event.label !== undefined) {
    params.event_label = event.label;
  }
  if (event.value !== undefined) {
    params.value = event.value;
  }
  return params;
}

// ---------- Session Metrics ----------

export interface SessionMetrics {
  totalEvents: number;
  uniqueCategories: string[];
  duration: number;
}

/**
 * Compute aggregate session metrics from an array of events.
 * Duration is the time span between earliest and latest event timestamps.
 */
export function getSessionMetrics(events: GameEvent[]): SessionMetrics {
  if (events.length === 0) {
    return { totalEvents: 0, uniqueCategories: [], duration: 0 };
  }

  const categories = new Set<string>();
  let minTs = Infinity;
  let maxTs = -Infinity;

  for (const e of events) {
    categories.add(e.category);
    if (e.timestamp < minTs) minTs = e.timestamp;
    if (e.timestamp > maxTs) maxTs = e.timestamp;
  }

  return {
    totalEvents: events.length,
    uniqueCategories: [...categories].sort(),
    duration: maxTs - minTs,
  };
}
