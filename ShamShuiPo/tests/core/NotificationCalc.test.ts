import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createNotificationState,
  addNotification,
  dismissNotification,
  markAsRead,
  getActiveNotifications,
  getByType,
  getUnreadCount,
  getHighPriority,
  getLatestN,
  clearAll,
  clearExpired,
} from "../../src/core/NotificationCalc";

// ---------------------------------------------------------------------------
// createNotificationState
// ---------------------------------------------------------------------------

describe("createNotificationState", () => {
  it("creates state with default maxNotifications of 50", () => {
    const s = createNotificationState();
    expect(s.maxNotifications).toBe(50);
  });

  it("starts with empty notifications array", () => {
    const s = createNotificationState();
    expect(s.notifications).toEqual([]);
    expect(s.notifications).toHaveLength(0);
  });

  it("starts with nextId of 1", () => {
    const s = createNotificationState();
    expect(s.nextId).toBe(1);
  });

  it("accepts custom maxNotifications", () => {
    expect(createNotificationState(10).maxNotifications).toBe(10);
    expect(createNotificationState(1).maxNotifications).toBe(1);
    expect(createNotificationState(999).maxNotifications).toBe(999);
  });

  it("clamps maxNotifications to at least 1 for zero", () => {
    expect(createNotificationState(0).maxNotifications).toBe(1);
  });

  it("clamps maxNotifications to at least 1 for negative values", () => {
    expect(createNotificationState(-5).maxNotifications).toBe(1);
    expect(createNotificationState(-100).maxNotifications).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// addNotification
// ---------------------------------------------------------------------------

describe("addNotification", () => {
  let nowSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    nowSpy = vi.spyOn(Date, "now").mockReturnValue(1000000);
  });

  afterEach(() => {
    nowSpy.mockRestore();
  });

  it("adds a notification with correct message and type", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "Hello world");
    expect(s.notifications).toHaveLength(1);
    expect(s.notifications[0].message).toBe("Hello world");
    expect(s.notifications[0].type).toBe("info");
  });

  it("auto-increments id starting from 1", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "First");
    s = addNotification(s, "info", "Second");
    s = addNotification(s, "info", "Third");
    expect(s.notifications[0].id).toBe(1);
    expect(s.notifications[1].id).toBe(2);
    expect(s.notifications[2].id).toBe(3);
    expect(s.nextId).toBe(4);
  });

  it("uses default duration of 3000", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "msg");
    expect(s.notifications[0].duration).toBe(3000);
  });

  it("uses default priority of 0", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "msg");
    expect(s.notifications[0].priority).toBe(0);
  });

  it("accepts custom duration", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "msg", 5000);
    expect(s.notifications[0].duration).toBe(5000);
  });

  it("accepts custom priority", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "msg", 3000, 10);
    expect(s.notifications[0].priority).toBe(10);
  });

  it("sets read to false", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "msg");
    expect(s.notifications[0].read).toBe(false);
  });

  it("uses Date.now() for timestamp", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "msg");
    expect(s.notifications[0].timestamp).toBe(1000000);
  });

  it("trims oldest when exceeding maxNotifications", () => {
    let s = createNotificationState(3);
    s = addNotification(s, "info", "A");
    s = addNotification(s, "info", "B");
    s = addNotification(s, "info", "C");
    s = addNotification(s, "info", "D");
    expect(s.notifications).toHaveLength(3);
    expect(s.notifications[0].message).toBe("B");
    expect(s.notifications[1].message).toBe("C");
    expect(s.notifications[2].message).toBe("D");
  });

  it("handles maxNotifications of 1 — only keeps newest", () => {
    let s = createNotificationState(1);
    s = addNotification(s, "info", "A");
    s = addNotification(s, "info", "B");
    expect(s.notifications).toHaveLength(1);
    expect(s.notifications[0].message).toBe("B");
  });

  it("supports all six notification types", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "i");
    s = addNotification(s, "warning", "w");
    s = addNotification(s, "success", "s");
    s = addNotification(s, "error", "e");
    s = addNotification(s, "achievement", "a");
    s = addNotification(s, "loot", "l");
    expect(s.notifications).toHaveLength(6);
    expect(s.notifications.map((n) => n.type)).toEqual([
      "info",
      "warning",
      "success",
      "error",
      "achievement",
      "loot",
    ]);
  });

  it("preserves existing notifications when adding", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "First");
    s = addNotification(s, "warning", "Second");
    expect(s.notifications[0].message).toBe("First");
    expect(s.notifications[1].message).toBe("Second");
  });

  it("trims multiple oldest when far over capacity", () => {
    let s = createNotificationState(2);
    s = addNotification(s, "info", "A"); // trimmed
    s = addNotification(s, "info", "B"); // trimmed
    s = addNotification(s, "info", "C");
    s = addNotification(s, "info", "D");
    s = addNotification(s, "info", "E");
    expect(s.notifications).toHaveLength(2);
    expect(s.notifications[0].message).toBe("D");
    expect(s.notifications[1].message).toBe("E");
  });
});

// ---------------------------------------------------------------------------
// dismissNotification
// ---------------------------------------------------------------------------

describe("dismissNotification", () => {
  beforeEach(() => {
    vi.spyOn(Date, "now").mockReturnValue(1000000);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("removes notification by id", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "A");
    s = addNotification(s, "info", "B");
    s = dismissNotification(s, 1);
    expect(s.notifications).toHaveLength(1);
    expect(s.notifications[0].message).toBe("B");
  });

  it("returns same reference if id not found", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "A");
    const s2 = dismissNotification(s, 999);
    expect(s2).toBe(s);
  });

  it("can remove the only notification", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "A");
    s = dismissNotification(s, 1);
    expect(s.notifications).toHaveLength(0);
  });

  it("does not affect other notifications", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "A");
    s = addNotification(s, "warning", "B");
    s = addNotification(s, "error", "C");
    s = dismissNotification(s, 2);
    expect(s.notifications).toHaveLength(2);
    expect(s.notifications[0].message).toBe("A");
    expect(s.notifications[1].message).toBe("C");
  });

  it("returns same reference when dismissing from empty state", () => {
    const s = createNotificationState();
    const s2 = dismissNotification(s, 1);
    expect(s2).toBe(s);
  });

  it("preserves nextId after dismiss", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "A");
    s = addNotification(s, "info", "B");
    const nextIdBefore = s.nextId;
    s = dismissNotification(s, 1);
    expect(s.nextId).toBe(nextIdBefore);
  });
});

// ---------------------------------------------------------------------------
// markAsRead
// ---------------------------------------------------------------------------

describe("markAsRead", () => {
  beforeEach(() => {
    vi.spyOn(Date, "now").mockReturnValue(1000000);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("marks a notification as read", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "msg");
    expect(s.notifications[0].read).toBe(false);
    s = markAsRead(s, 1);
    expect(s.notifications[0].read).toBe(true);
  });

  it("returns same reference if id not found", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "msg");
    const s2 = markAsRead(s, 999);
    expect(s2).toBe(s);
  });

  it("returns same reference if already read", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "msg");
    s = markAsRead(s, 1);
    const s2 = markAsRead(s, 1);
    expect(s2).toBe(s);
  });

  it("does not affect other notifications", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "A");
    s = addNotification(s, "info", "B");
    s = addNotification(s, "info", "C");
    s = markAsRead(s, 2);
    expect(s.notifications[0].read).toBe(false);
    expect(s.notifications[1].read).toBe(true);
    expect(s.notifications[2].read).toBe(false);
  });

  it("returns same reference on empty state", () => {
    const s = createNotificationState();
    const s2 = markAsRead(s, 1);
    expect(s2).toBe(s);
  });
});

// ---------------------------------------------------------------------------
// getActiveNotifications
// ---------------------------------------------------------------------------

describe("getActiveNotifications", () => {
  beforeEach(() => {
    vi.spyOn(Date, "now").mockReturnValue(1000000);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns notifications that have not expired", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "msg", 3000);
    const active = getActiveNotifications(s, 1001000);
    expect(active).toHaveLength(1);
  });

  it("excludes expired notifications", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "msg", 1000);
    const active = getActiveNotifications(s, 1002000);
    expect(active).toHaveLength(0);
  });

  it("excludes notifications at exact expiry boundary (timestamp + duration)", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "msg", 1000);
    // timestamp=1000000, duration=1000 → expires at 1001000
    const active = getActiveNotifications(s, 1001000);
    expect(active).toHaveLength(0);
  });

  it("includes notification one ms before expiry", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "msg", 1000);
    const active = getActiveNotifications(s, 1000999);
    expect(active).toHaveLength(1);
  });

  it("returns empty array for empty state", () => {
    const s = createNotificationState();
    expect(getActiveNotifications(s, Date.now())).toEqual([]);
  });

  it("correctly mixes active and expired", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "short", 100);
    s = addNotification(s, "info", "long", 10000);
    const active = getActiveNotifications(s, 1000500);
    expect(active).toHaveLength(1);
    expect(active[0].message).toBe("long");
  });

  it("returns all when none expired", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "A", 5000);
    s = addNotification(s, "info", "B", 5000);
    const active = getActiveNotifications(s, 1000001);
    expect(active).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// getByType
// ---------------------------------------------------------------------------

describe("getByType", () => {
  beforeEach(() => {
    vi.spyOn(Date, "now").mockReturnValue(1000000);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("filters notifications by type", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "i1");
    s = addNotification(s, "warning", "w1");
    s = addNotification(s, "info", "i2");
    const infos = getByType(s, "info");
    expect(infos).toHaveLength(2);
    expect(infos[0].message).toBe("i1");
    expect(infos[1].message).toBe("i2");
  });

  it("returns empty if no match", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "msg");
    expect(getByType(s, "error")).toHaveLength(0);
  });

  it("returns empty for empty state", () => {
    const s = createNotificationState();
    expect(getByType(s, "loot")).toEqual([]);
  });

  it("works with achievement type", () => {
    let s = createNotificationState();
    s = addNotification(s, "achievement", "a1");
    s = addNotification(s, "loot", "l1");
    s = addNotification(s, "achievement", "a2");
    expect(getByType(s, "achievement")).toHaveLength(2);
  });

  it("works with success type", () => {
    let s = createNotificationState();
    s = addNotification(s, "success", "s1");
    s = addNotification(s, "error", "e1");
    s = addNotification(s, "success", "s2");
    const successes = getByType(s, "success");
    expect(successes).toHaveLength(2);
    expect(successes.every((n) => n.type === "success")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getUnreadCount
// ---------------------------------------------------------------------------

describe("getUnreadCount", () => {
  beforeEach(() => {
    vi.spyOn(Date, "now").mockReturnValue(1000000);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns count of unread notifications", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "A");
    s = addNotification(s, "info", "B");
    expect(getUnreadCount(s)).toBe(2);
  });

  it("decreases when marking as read", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "A");
    s = addNotification(s, "info", "B");
    s = markAsRead(s, 1);
    expect(getUnreadCount(s)).toBe(1);
  });

  it("returns 0 for empty state", () => {
    const s = createNotificationState();
    expect(getUnreadCount(s)).toBe(0);
  });

  it("returns 0 when all are read", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "A");
    s = addNotification(s, "info", "B");
    s = markAsRead(s, 1);
    s = markAsRead(s, 2);
    expect(getUnreadCount(s)).toBe(0);
  });

  it("decreases when dismissing unread notification", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "A");
    s = addNotification(s, "info", "B");
    s = dismissNotification(s, 1);
    expect(getUnreadCount(s)).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// getHighPriority
// ---------------------------------------------------------------------------

describe("getHighPriority", () => {
  beforeEach(() => {
    vi.spyOn(Date, "now").mockReturnValue(1000000);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns notifications with priority >= minPriority", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "low", 3000, 1);
    s = addNotification(s, "info", "mid", 3000, 5);
    s = addNotification(s, "info", "high", 3000, 10);
    const high = getHighPriority(s, 5);
    expect(high).toHaveLength(2);
    expect(high[0].message).toBe("mid");
    expect(high[1].message).toBe("high");
  });

  it("returns all when minPriority is 0 and all have priority >= 0", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "A", 3000, 0);
    s = addNotification(s, "info", "B", 3000, 5);
    expect(getHighPriority(s, 0)).toHaveLength(2);
  });

  it("returns empty when none match", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "A", 3000, 1);
    expect(getHighPriority(s, 100)).toHaveLength(0);
  });

  it("returns empty for empty state", () => {
    const s = createNotificationState();
    expect(getHighPriority(s, 0)).toEqual([]);
  });

  it("handles negative priority values", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "neg", 3000, -5);
    s = addNotification(s, "info", "pos", 3000, 5);
    expect(getHighPriority(s, 0)).toHaveLength(1);
    expect(getHighPriority(s, -10)).toHaveLength(2);
  });

  it("includes exact match on minPriority boundary", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "exact", 3000, 7);
    expect(getHighPriority(s, 7)).toHaveLength(1);
  });

  it("handles very large priority values", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "A", 3000, Number.MAX_SAFE_INTEGER);
    const high = getHighPriority(s, Number.MAX_SAFE_INTEGER);
    expect(high).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// getLatestN
// ---------------------------------------------------------------------------

describe("getLatestN", () => {
  beforeEach(() => {
    vi.spyOn(Date, "now").mockReturnValue(1000000);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the N most recent notifications", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "A");
    s = addNotification(s, "info", "B");
    s = addNotification(s, "info", "C");
    const latest = getLatestN(s, 2);
    expect(latest).toHaveLength(2);
    expect(latest[0].message).toBe("B");
    expect(latest[1].message).toBe("C");
  });

  it("returns all if n exceeds count", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "A");
    const latest = getLatestN(s, 100);
    expect(latest).toHaveLength(1);
    expect(latest[0].message).toBe("A");
  });

  it("returns empty for n=0", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "A");
    expect(getLatestN(s, 0)).toEqual([]);
  });

  it("returns empty for negative n", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "A");
    expect(getLatestN(s, -1)).toEqual([]);
    expect(getLatestN(s, -100)).toEqual([]);
  });

  it("returns empty for empty state", () => {
    const s = createNotificationState();
    expect(getLatestN(s, 5)).toEqual([]);
  });

  it("returns exact count when n equals length", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "A");
    s = addNotification(s, "info", "B");
    const latest = getLatestN(s, 2);
    expect(latest).toHaveLength(2);
    expect(latest[0].message).toBe("A");
    expect(latest[1].message).toBe("B");
  });

  it("returns single item for n=1", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "A");
    s = addNotification(s, "info", "B");
    s = addNotification(s, "info", "C");
    const latest = getLatestN(s, 1);
    expect(latest).toHaveLength(1);
    expect(latest[0].message).toBe("C");
  });
});

// ---------------------------------------------------------------------------
// clearAll
// ---------------------------------------------------------------------------

describe("clearAll", () => {
  beforeEach(() => {
    vi.spyOn(Date, "now").mockReturnValue(1000000);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("removes all notifications", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "A");
    s = addNotification(s, "info", "B");
    s = clearAll(s);
    expect(s.notifications).toHaveLength(0);
  });

  it("preserves nextId", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "A");
    s = addNotification(s, "info", "B");
    s = clearAll(s);
    expect(s.nextId).toBe(3);
  });

  it("preserves maxNotifications", () => {
    let s = createNotificationState(10);
    s = addNotification(s, "info", "A");
    s = clearAll(s);
    expect(s.maxNotifications).toBe(10);
  });

  it("returns same reference if already empty", () => {
    const s = createNotificationState();
    const s2 = clearAll(s);
    expect(s2).toBe(s);
  });
});

// ---------------------------------------------------------------------------
// clearExpired
// ---------------------------------------------------------------------------

describe("clearExpired", () => {
  beforeEach(() => {
    vi.spyOn(Date, "now").mockReturnValue(1000000);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("removes expired notifications", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "short", 100);
    s = clearExpired(s, 1000200);
    expect(s.notifications).toHaveLength(0);
  });

  it("keeps active notifications", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "short", 100);
    s = addNotification(s, "info", "long", 10000);
    s = clearExpired(s, 1000500);
    expect(s.notifications).toHaveLength(1);
    expect(s.notifications[0].message).toBe("long");
  });

  it("returns same reference if nothing expired", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "msg", 10000);
    const s2 = clearExpired(s, 1000100);
    expect(s2).toBe(s);
  });

  it("returns same reference for empty state", () => {
    const s = createNotificationState();
    const s2 = clearExpired(s, 1000000);
    expect(s2).toBe(s);
  });

  it("removes notification at exact expiry boundary", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "msg", 1000);
    // timestamp=1000000, duration=1000 → expires at 1001000
    s = clearExpired(s, 1001000);
    expect(s.notifications).toHaveLength(0);
  });

  it("keeps notification one ms before expiry", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "msg", 1000);
    const s2 = clearExpired(s, 1000999);
    expect(s2).toBe(s); // nothing expired, same ref
    expect(s2.notifications).toHaveLength(1);
  });

  it("clears all with far-future time", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "A", 1000);
    s = addNotification(s, "info", "B", 5000);
    s = addNotification(s, "info", "C", 10000);
    s = clearExpired(s, 9999999);
    expect(s.notifications).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Immutability
// ---------------------------------------------------------------------------

describe("immutability", () => {
  beforeEach(() => {
    vi.spyOn(Date, "now").mockReturnValue(1000000);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("addNotification does not mutate original state", () => {
    const s = createNotificationState();
    const s2 = addNotification(s, "info", "msg");
    expect(s.notifications).toHaveLength(0);
    expect(s2.notifications).toHaveLength(1);
    expect(s.nextId).toBe(1);
    expect(s2.nextId).toBe(2);
  });

  it("dismissNotification does not mutate original state", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "A");
    const before = s;
    const s2 = dismissNotification(s, 1);
    expect(before.notifications).toHaveLength(1);
    expect(s2.notifications).toHaveLength(0);
  });

  it("markAsRead does not mutate original state", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "A");
    const before = s;
    const s2 = markAsRead(s, 1);
    expect(before.notifications[0].read).toBe(false);
    expect(s2.notifications[0].read).toBe(true);
  });

  it("clearAll does not mutate original state", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "A");
    const before = s;
    const s2 = clearAll(s);
    expect(before.notifications).toHaveLength(1);
    expect(s2.notifications).toHaveLength(0);
  });

  it("clearExpired does not mutate original state", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "msg", 100);
    const before = s;
    const s2 = clearExpired(s, 1000200);
    expect(before.notifications).toHaveLength(1);
    expect(s2.notifications).toHaveLength(0);
  });

  it("markAsRead creates new notification object", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "A");
    const original = s.notifications[0];
    const s2 = markAsRead(s, 1);
    expect(s2.notifications[0]).not.toBe(original);
    expect(s2.notifications[0].read).toBe(true);
    expect(original.read).toBe(false);
  });

  it("addNotification creates new notifications array", () => {
    const s = createNotificationState();
    const s2 = addNotification(s, "info", "msg");
    expect(s.notifications).not.toBe(s2.notifications);
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe("edge cases", () => {
  beforeEach(() => {
    vi.spyOn(Date, "now").mockReturnValue(1000000);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("handles rapid add and dismiss cycle", () => {
    let s = createNotificationState();
    for (let i = 0; i < 10; i++) {
      s = addNotification(s, "info", `msg${i}`);
    }
    expect(s.notifications).toHaveLength(10);
    for (let i = 1; i <= 10; i++) {
      s = dismissNotification(s, i);
    }
    expect(s.notifications).toHaveLength(0);
  });

  it("nextId continues incrementing after clearAll", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "A");
    s = addNotification(s, "info", "B");
    s = clearAll(s);
    s = addNotification(s, "info", "C");
    expect(s.notifications[0].id).toBe(3);
    expect(s.nextId).toBe(4);
  });

  it("handles zero duration notification (immediately expired)", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "instant", 0);
    // timestamp=1000000, duration=0 → expires at 1000000
    const active = getActiveNotifications(s, 1000000);
    expect(active).toHaveLength(0);
  });

  it("zero duration notification is expired even at its own timestamp", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "instant", 0);
    s = clearExpired(s, 1000000);
    expect(s.notifications).toHaveLength(0);
  });

  it("getByType after dismissing returns correct results", () => {
    let s = createNotificationState();
    s = addNotification(s, "loot", "L1");
    s = addNotification(s, "loot", "L2");
    s = dismissNotification(s, 1);
    const loots = getByType(s, "loot");
    expect(loots).toHaveLength(1);
    expect(loots[0].message).toBe("L2");
  });

  it("markAsRead then getUnreadCount is consistent through sequence", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "A");
    s = addNotification(s, "info", "B");
    s = addNotification(s, "info", "C");
    expect(getUnreadCount(s)).toBe(3);
    s = markAsRead(s, 1);
    expect(getUnreadCount(s)).toBe(2);
    s = markAsRead(s, 2);
    expect(getUnreadCount(s)).toBe(1);
    s = markAsRead(s, 3);
    expect(getUnreadCount(s)).toBe(0);
  });

  it("trimming preserves most recent and drops oldest", () => {
    let s = createNotificationState(2);
    s = addNotification(s, "info", "oldest");
    s = addNotification(s, "info", "middle");
    s = addNotification(s, "info", "newest");
    expect(s.notifications).toHaveLength(2);
    expect(s.notifications[0].message).toBe("middle");
    expect(s.notifications[1].message).toBe("newest");
  });

  it("dismissing already dismissed id is a no-op", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "A");
    s = dismissNotification(s, 1);
    const s2 = dismissNotification(s, 1);
    expect(s2).toBe(s);
  });

  it("empty message string is allowed", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "");
    expect(s.notifications[0].message).toBe("");
  });

  it("handles very long message strings", () => {
    let s = createNotificationState();
    const longMsg = "x".repeat(10000);
    s = addNotification(s, "info", longMsg);
    expect(s.notifications[0].message).toBe(longMsg);
  });
});

// ---------------------------------------------------------------------------
// Integration scenarios
// ---------------------------------------------------------------------------

describe("integration scenarios", () => {
  beforeEach(() => {
    vi.spyOn(Date, "now").mockReturnValue(1000000);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("full lifecycle: add → read → expire → clear", () => {
    let s = createNotificationState();
    s = addNotification(s, "achievement", "First Kill!", 2000, 5);
    expect(s.notifications).toHaveLength(1);
    expect(getUnreadCount(s)).toBe(1);

    s = markAsRead(s, 1);
    expect(getUnreadCount(s)).toBe(0);

    // Still active at t+1000
    expect(getActiveNotifications(s, 1001000)).toHaveLength(1);
    // Expired at t+3000
    expect(getActiveNotifications(s, 1003000)).toHaveLength(0);

    s = clearExpired(s, 1003000);
    expect(s.notifications).toHaveLength(0);
  });

  it("mixed types workflow with queries", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "Game started");
    s = addNotification(s, "loot", "Rare sword!", 5000, 3);
    s = addNotification(s, "achievement", "Monster Slayer", 4000, 8);
    s = addNotification(s, "warning", "Low health!", 2000, 10);
    s = addNotification(s, "error", "Connection lost", 6000, 10);

    expect(getByType(s, "loot")).toHaveLength(1);
    expect(getHighPriority(s, 8)).toHaveLength(3);
    expect(getLatestN(s, 2).map((n) => n.message)).toEqual([
      "Low health!",
      "Connection lost",
    ]);
  });

  it("capacity management under load", () => {
    let s = createNotificationState(5);
    for (let i = 0; i < 20; i++) {
      s = addNotification(s, "info", `msg-${i}`);
    }
    expect(s.notifications).toHaveLength(5);
    expect(s.notifications[0].message).toBe("msg-15");
    expect(s.notifications[4].message).toBe("msg-19");
    expect(s.nextId).toBe(21);
  });

  it("clearExpired then add new maintains correct count", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "expire-soon", 100);
    s = addNotification(s, "info", "stay-long", 99999);
    s = clearExpired(s, 1000200);
    expect(s.notifications).toHaveLength(1);
    s = addNotification(s, "warning", "new-one", 5000);
    expect(s.notifications).toHaveLength(2);
    expect(s.nextId).toBe(4);
  });

  it("dismiss + clearAll + add restores clean state with continued ids", () => {
    let s = createNotificationState();
    s = addNotification(s, "info", "A");
    s = addNotification(s, "info", "B");
    s = dismissNotification(s, 1);
    s = clearAll(s);
    expect(s.notifications).toHaveLength(0);
    s = addNotification(s, "info", "C");
    expect(s.notifications).toHaveLength(1);
    expect(s.notifications[0].id).toBe(3);
  });

  it("getHighPriority combined with getByType narrows results", () => {
    let s = createNotificationState();
    s = addNotification(s, "error", "Critical!", 3000, 10);
    s = addNotification(s, "error", "Minor error", 3000, 1);
    s = addNotification(s, "info", "Just info", 3000, 10);

    const highPrio = getHighPriority(s, 5);
    const errors = getByType(s, "error");

    expect(highPrio).toHaveLength(2);
    expect(errors).toHaveLength(2);

    // Combine: high-priority errors
    const highPrioErrors = highPrio.filter((n) => n.type === "error");
    expect(highPrioErrors).toHaveLength(1);
    expect(highPrioErrors[0].message).toBe("Critical!");
  });

  it("getLatestN after trimming returns correct slice", () => {
    let s = createNotificationState(3);
    for (let i = 0; i < 10; i++) {
      s = addNotification(s, "info", `n-${i}`);
    }
    // Only 3 remain: n-7, n-8, n-9
    const latest = getLatestN(s, 2);
    expect(latest).toHaveLength(2);
    expect(latest[0].message).toBe("n-8");
    expect(latest[1].message).toBe("n-9");
  });
});
