import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * analytics.ts calls clearOldEvents() on module load, which accesses localStorage.
 * We must set up the mock BEFORE importing the module.
 */

function createMockStorage(): Storage {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
}

let mockStorage: Storage;

// Set up localStorage mock before any analytics import
beforeEach(() => {
  mockStorage = createMockStorage();
  vi.stubGlobal('localStorage', mockStorage);
  vi.useFakeTimers();
});

// We use dynamic import with vi.resetModules to get a fresh module each test
async function loadAnalytics() {
  vi.resetModules();
  return await import('../../src/lib/analytics');
}

describe('analytics — trackEvent', () => {
  it('stores an event with correct structure', async () => {
    const { trackEvent } = await loadAnalytics();

    trackEvent('game_start', { character: 'hai' });

    const stored = JSON.parse(mockStorage.getItem('wanchai_analytics')!);
    expect(stored).toHaveLength(1);
    expect(stored[0].event).toBe('game_start');
    expect(stored[0].data.character).toBe('hai');
    expect(stored[0].timestamp).toBeGreaterThan(0);
    expect(stored[0].sessionId).toBeTruthy();
  });

  it('stores multiple events', async () => {
    const { trackEvent } = await loadAnalytics();

    trackEvent('game_start');
    trackEvent('enemy_kill', { type: 'basic' });
    trackEvent('level_up', { level: 2 });

    const stored = JSON.parse(mockStorage.getItem('wanchai_analytics')!);
    expect(stored).toHaveLength(3);
  });

  it('defaults data to empty object when not provided', async () => {
    const { trackEvent } = await loadAnalytics();

    trackEvent('game_start');

    const stored = JSON.parse(mockStorage.getItem('wanchai_analytics')!);
    expect(stored[0].data).toEqual({});
  });

  it('uses consistent sessionId within same session', async () => {
    const { trackEvent } = await loadAnalytics();

    trackEvent('event_a');
    trackEvent('event_b');

    const stored = JSON.parse(mockStorage.getItem('wanchai_analytics')!);
    expect(stored[0].sessionId).toBe(stored[1].sessionId);
  });

  it('stores event timestamp close to Date.now()', async () => {
    vi.setSystemTime(new Date('2026-03-03T12:00:00Z'));
    const { trackEvent } = await loadAnalytics();

    trackEvent('test');

    const stored = JSON.parse(mockStorage.getItem('wanchai_analytics')!);
    expect(stored[0].timestamp).toBe(new Date('2026-03-03T12:00:00Z').getTime());
  });

  it('supports boolean data values', async () => {
    const { trackEvent } = await loadAnalytics();

    trackEvent('boss_fight', { victory: true });

    const stored = JSON.parse(mockStorage.getItem('wanchai_analytics')!);
    expect(stored[0].data.victory).toBe(true);
  });

  it('supports numeric data values', async () => {
    const { trackEvent } = await loadAnalytics();

    trackEvent('damage', { amount: 150 });

    const stored = JSON.parse(mockStorage.getItem('wanchai_analytics')!);
    expect(stored[0].data.amount).toBe(150);
  });
});

describe('analytics — getSessionEvents', () => {
  it('returns only events from the current session', async () => {
    // Seed some old-session events
    const oldEvents = [{ event: 'old_event', data: {}, timestamp: Date.now(), sessionId: 'old-session-123' }];
    mockStorage.setItem('wanchai_analytics', JSON.stringify(oldEvents));

    const { trackEvent, getSessionEvents } = await loadAnalytics();

    trackEvent('new_event');

    const sessionEvents = getSessionEvents();
    expect(sessionEvents).toHaveLength(1);
    expect(sessionEvents[0].event).toBe('new_event');
  });

  it('returns empty array when no events for current session', async () => {
    const { getSessionEvents } = await loadAnalytics();

    const sessionEvents = getSessionEvents();
    expect(sessionEvents).toEqual([]);
  });

  it('returns multiple events from same session', async () => {
    const { trackEvent, getSessionEvents } = await loadAnalytics();

    trackEvent('a');
    trackEvent('b');
    trackEvent('c');

    const sessionEvents = getSessionEvents();
    expect(sessionEvents).toHaveLength(3);
  });
});

describe('analytics — getEventSummary', () => {
  it('counts events correctly', async () => {
    const { trackEvent, getEventSummary } = await loadAnalytics();

    trackEvent('kill');
    trackEvent('kill');
    trackEvent('kill');
    trackEvent('level_up');

    const summary = getEventSummary();
    expect(summary['kill']).toBe(3);
    expect(summary['level_up']).toBe(1);
  });

  it('returns empty object when no events', async () => {
    const { getEventSummary } = await loadAnalytics();

    const summary = getEventSummary();
    expect(summary).toEqual({});
  });

  it('counts events across sessions', async () => {
    const oldEvents = [
      { event: 'kill', data: {}, timestamp: Date.now(), sessionId: 'old-session' },
      { event: 'kill', data: {}, timestamp: Date.now(), sessionId: 'old-session' },
    ];
    mockStorage.setItem('wanchai_analytics', JSON.stringify(oldEvents));

    const { trackEvent, getEventSummary } = await loadAnalytics();

    trackEvent('kill');

    const summary = getEventSummary();
    expect(summary['kill']).toBe(3);
  });
});

describe('analytics — clearOldEvents', () => {
  it('removes events older than maxAgeDays', async () => {
    const now = new Date('2026-03-03T12:00:00Z').getTime();
    vi.setSystemTime(now);

    const oldEvent = {
      event: 'ancient',
      data: {},
      timestamp: now - 8 * 24 * 60 * 60 * 1000, // 8 days ago
      sessionId: 'old',
    };
    const recentEvent = {
      event: 'recent',
      data: {},
      timestamp: now - 1 * 24 * 60 * 60 * 1000, // 1 day ago
      sessionId: 'recent',
    };
    mockStorage.setItem('wanchai_analytics', JSON.stringify([oldEvent, recentEvent]));

    const { clearOldEvents } = await loadAnalytics();

    // Module load already ran clearOldEvents(7), but let's explicitly test with 7 days
    clearOldEvents(7);

    const stored = JSON.parse(mockStorage.getItem('wanchai_analytics')!);
    expect(stored).toHaveLength(1);
    expect(stored[0].event).toBe('recent');
  });

  it('keeps events within the maxAge window', async () => {
    const now = new Date('2026-03-03T12:00:00Z').getTime();
    vi.setSystemTime(now);

    const events = [
      { event: 'e1', data: {}, timestamp: now - 1 * 24 * 60 * 60 * 1000, sessionId: 's1' },
      { event: 'e2', data: {}, timestamp: now - 3 * 24 * 60 * 60 * 1000, sessionId: 's2' },
      { event: 'e3', data: {}, timestamp: now - 6 * 24 * 60 * 60 * 1000, sessionId: 's3' },
    ];
    mockStorage.setItem('wanchai_analytics', JSON.stringify(events));

    const { clearOldEvents } = await loadAnalytics();
    clearOldEvents(7);

    const stored = JSON.parse(mockStorage.getItem('wanchai_analytics')!);
    expect(stored).toHaveLength(3);
  });

  it('removes all events if all are older than maxAge', async () => {
    const now = new Date('2026-03-03T12:00:00Z').getTime();
    vi.setSystemTime(now);

    const events = [
      { event: 'old1', data: {}, timestamp: now - 10 * 24 * 60 * 60 * 1000, sessionId: 's1' },
      { event: 'old2', data: {}, timestamp: now - 20 * 24 * 60 * 60 * 1000, sessionId: 's2' },
    ];
    mockStorage.setItem('wanchai_analytics', JSON.stringify(events));

    const { clearOldEvents } = await loadAnalytics();
    clearOldEvents(7);

    const stored = JSON.parse(mockStorage.getItem('wanchai_analytics')!);
    expect(stored).toHaveLength(0);
  });

  it('accepts custom maxAgeDays', async () => {
    const now = new Date('2026-03-03T12:00:00Z').getTime();
    vi.setSystemTime(now);

    const events = [
      { event: 'e1', data: {}, timestamp: now - 2 * 24 * 60 * 60 * 1000, sessionId: 's1' },
      { event: 'e2', data: {}, timestamp: now - 4 * 24 * 60 * 60 * 1000, sessionId: 's2' },
    ];
    mockStorage.setItem('wanchai_analytics', JSON.stringify(events));

    const { clearOldEvents } = await loadAnalytics();
    clearOldEvents(3); // only keep events < 3 days old

    const stored = JSON.parse(mockStorage.getItem('wanchai_analytics')!);
    expect(stored).toHaveLength(1);
    expect(stored[0].event).toBe('e1');
  });

  it('is called automatically on module load', async () => {
    const now = new Date('2026-03-03T12:00:00Z').getTime();
    vi.setSystemTime(now);

    const events = [
      { event: 'ancient', data: {}, timestamp: now - 30 * 24 * 60 * 60 * 1000, sessionId: 's1' },
      { event: 'recent', data: {}, timestamp: now - 1 * 24 * 60 * 60 * 1000, sessionId: 's2' },
    ];
    mockStorage.setItem('wanchai_analytics', JSON.stringify(events));

    // Module import triggers clearOldEvents()
    await loadAnalytics();

    const stored = JSON.parse(mockStorage.getItem('wanchai_analytics')!);
    expect(stored).toHaveLength(1);
    expect(stored[0].event).toBe('recent');
  });
});

describe('analytics — resetSession', () => {
  it('generates a new session ID', async () => {
    const { trackEvent, getSessionEvents, resetSession } = await loadAnalytics();

    trackEvent('before_reset');
    const eventsBefore = getSessionEvents();
    expect(eventsBefore).toHaveLength(1);

    resetSession();

    const eventsAfter = getSessionEvents();
    expect(eventsAfter).toHaveLength(0); // new session has no events
  });

  it('new events after reset use new session ID', async () => {
    const { trackEvent, getSessionEvents, resetSession } = await loadAnalytics();

    trackEvent('old_event');
    resetSession();
    trackEvent('new_event');

    const sessionEvents = getSessionEvents();
    expect(sessionEvents).toHaveLength(1);
    expect(sessionEvents[0].event).toBe('new_event');
  });

  it('generates different session IDs each time', async () => {
    const { trackEvent, resetSession } = await loadAnalytics();

    trackEvent('a');
    const stored1 = JSON.parse(mockStorage.getItem('wanchai_analytics')!);
    const sid1 = stored1[stored1.length - 1].sessionId;

    vi.advanceTimersByTime(10); // ensure Date.now() differs
    resetSession();
    trackEvent('b');
    const stored2 = JSON.parse(mockStorage.getItem('wanchai_analytics')!);
    const sid2 = stored2[stored2.length - 1].sessionId;

    expect(sid1).not.toBe(sid2);
  });
});

describe('analytics — localStorage failure handling', () => {
  it('trackEvent handles localStorage.getItem throwing', async () => {
    const { trackEvent } = await loadAnalytics();

    // Make getItem throw
    (mockStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error('localStorage unavailable');
    });

    // Should not throw
    expect(() => trackEvent('test')).not.toThrow();
  });

  it('trackEvent handles localStorage.setItem throwing', async () => {
    const { trackEvent } = await loadAnalytics();

    // Make setItem throw (quota exceeded)
    (mockStorage.setItem as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    // Should not throw
    expect(() => trackEvent('test')).not.toThrow();
  });

  it('getSessionEvents returns empty array on corrupted data', async () => {
    const { getSessionEvents } = await loadAnalytics();

    mockStorage.setItem('wanchai_analytics', 'not-valid-json{{{');

    const events = getSessionEvents();
    expect(events).toEqual([]);
  });

  it('getEventSummary returns empty object on corrupted data', async () => {
    const { getEventSummary } = await loadAnalytics();

    mockStorage.setItem('wanchai_analytics', '~~~invalid~~~');

    const summary = getEventSummary();
    expect(summary).toEqual({});
  });

  it('clearOldEvents handles corrupted data gracefully', async () => {
    mockStorage.setItem('wanchai_analytics', 'CORRUPTED');

    const { clearOldEvents } = await loadAnalytics();

    expect(() => clearOldEvents()).not.toThrow();

    // After clearing corrupted data, storage should have empty array
    const stored = JSON.parse(mockStorage.getItem('wanchai_analytics')!);
    expect(stored).toEqual([]);
  });
});
