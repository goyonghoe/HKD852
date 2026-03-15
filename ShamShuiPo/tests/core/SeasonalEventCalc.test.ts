import { describe, it, expect } from "vitest";
import {
  createEventState,
  isEventActive,
  addPoints,
  checkMilestones,
  purchaseReward,
  getEventProgress,
  getTimeRemaining,
  getEventModifiers,
  getAvailableRewards,
  getEventSummary,
  generateSeasonalEvent,
  isEventExpired,
  SeasonalEvent,
  EventReward,
  EventMilestone,
  EventState,
} from "../../src/core/SeasonalEventCalc";

// ── Fixtures ───────────────────────────────────────────

function makeEvent(overrides?: Partial<SeasonalEvent>): SeasonalEvent {
  return {
    id: "test_event",
    name: "Test Event",
    type: "holiday",
    startDate: "2026-03-01",
    endDate: "2026-03-31",
    modifiers: [
      { stat: "xp", multiplier: 1.5 },
      { stat: "damage", multiplier: 1.2 },
    ],
    rewards: [
      {
        id: "r1",
        name: "Crate",
        cost: 100,
        currency: "tokens",
        isLimited: false,
      },
      {
        id: "r2",
        name: "Skin",
        cost: 500,
        currency: "tokens",
        isLimited: true,
      },
      {
        id: "r3",
        name: "Emote",
        cost: 250,
        currency: "tokens",
        isLimited: true,
      },
    ],
    milestones: [
      { threshold: 100, reward: "badge", claimed: false },
      { threshold: 500, reward: "rare_skin", claimed: false },
      { threshold: 1000, reward: "weapon", claimed: false },
    ],
    ...overrides,
  };
}

function makeRewards(): EventReward[] {
  return [
    {
      id: "r1",
      name: "Crate",
      cost: 100,
      currency: "tokens",
      isLimited: false,
    },
    { id: "r2", name: "Skin", cost: 500, currency: "tokens", isLimited: true },
    { id: "r3", name: "Emote", cost: 250, currency: "tokens", isLimited: true },
  ];
}

function makeMilestones(): EventMilestone[] {
  return [
    { threshold: 100, reward: "badge", claimed: false },
    { threshold: 500, reward: "rare_skin", claimed: false },
    { threshold: 1000, reward: "weapon", claimed: false },
  ];
}

// ── createEventState ───────────────────────────────────

describe("createEventState", () => {
  it("creates a fresh state with correct eventId", () => {
    const state = createEventState("spring_2026");
    expect(state.eventId).toBe("spring_2026");
    expect(state.points).toBe(0);
    expect(state.purchases).toEqual([]);
    expect(state.claimedMilestones).toEqual([]);
    expect(state.isActive).toBe(true);
  });

  it("creates independent instances", () => {
    const a = createEventState("a");
    const b = createEventState("b");
    expect(a).not.toBe(b);
    expect(a.eventId).not.toBe(b.eventId);
  });
});

// ── isEventActive ──────────────────────────────────────

describe("isEventActive", () => {
  const event = makeEvent();

  it("returns true when date is within range", () => {
    expect(isEventActive(event, "2026-03-15")).toBe(true);
  });

  it("returns true on start date", () => {
    expect(isEventActive(event, "2026-03-01")).toBe(true);
  });

  it("returns true on end date", () => {
    expect(isEventActive(event, "2026-03-31")).toBe(true);
  });

  it("returns false before start", () => {
    expect(isEventActive(event, "2026-02-28")).toBe(false);
  });

  it("returns false after end", () => {
    expect(isEventActive(event, "2026-04-01")).toBe(false);
  });
});

// ── addPoints ──────────────────────────────────────────

describe("addPoints", () => {
  it("adds positive amount", () => {
    const state = createEventState("e1");
    const updated = addPoints(state, 50);
    expect(updated.points).toBe(50);
  });

  it("accumulates across multiple adds", () => {
    let state = createEventState("e1");
    state = addPoints(state, 100);
    state = addPoints(state, 200);
    expect(state.points).toBe(300);
  });

  it("ignores zero amount", () => {
    const state = createEventState("e1");
    const updated = addPoints(state, 0);
    expect(updated.points).toBe(0);
  });

  it("ignores negative amount", () => {
    const state = addPoints(createEventState("e1"), 100);
    const updated = addPoints(state, -50);
    expect(updated.points).toBe(100);
  });

  it("returns new object (immutability)", () => {
    const state = createEventState("e1");
    const updated = addPoints(state, 10);
    expect(updated).not.toBe(state);
  });
});

// ── checkMilestones ────────────────────────────────────

describe("checkMilestones", () => {
  const milestones = makeMilestones();

  it("claims nothing when points are below all thresholds", () => {
    const state = addPoints(createEventState("e1"), 50);
    const result = checkMilestones(state, milestones);
    expect(result.claimed).toEqual([]);
  });

  it("claims first milestone at exact threshold", () => {
    const state = addPoints(createEventState("e1"), 100);
    const result = checkMilestones(state, milestones);
    expect(result.claimed).toEqual([0]);
    expect(result.state.claimedMilestones).toContain(0);
  });

  it("claims multiple milestones at once", () => {
    const state = addPoints(createEventState("e1"), 1000);
    const result = checkMilestones(state, milestones);
    expect(result.claimed).toEqual([0, 1, 2]);
  });

  it("does not re-claim already claimed milestones", () => {
    let state = addPoints(createEventState("e1"), 1000);
    const first = checkMilestones(state, milestones);
    const second = checkMilestones(first.state, milestones);
    expect(second.claimed).toEqual([]);
  });

  it("handles empty milestones array", () => {
    const state = addPoints(createEventState("e1"), 1000);
    const result = checkMilestones(state, []);
    expect(result.claimed).toEqual([]);
  });
});

// ── purchaseReward ─────────────────────────────────────

describe("purchaseReward", () => {
  const rewards = makeRewards();

  it("purchases a reward and deducts points", () => {
    const state = addPoints(createEventState("e1"), 200);
    const result = purchaseReward(state, "r1", rewards);
    expect(result).not.toBeNull();
    expect(result!.points).toBe(100);
    expect(result!.purchases).toContain("r1");
  });

  it("returns null for unknown reward id", () => {
    const state = addPoints(createEventState("e1"), 1000);
    expect(purchaseReward(state, "nonexistent", rewards)).toBeNull();
  });

  it("returns null when insufficient points", () => {
    const state = addPoints(createEventState("e1"), 50);
    expect(purchaseReward(state, "r1", rewards)).toBeNull();
  });

  it("returns null for duplicate purchase", () => {
    const state = addPoints(createEventState("e1"), 1000);
    const first = purchaseReward(state, "r1", rewards)!;
    expect(purchaseReward(first, "r1", rewards)).toBeNull();
  });

  it("allows purchasing at exact cost", () => {
    const state = addPoints(createEventState("e1"), 100);
    const result = purchaseReward(state, "r1", rewards);
    expect(result).not.toBeNull();
    expect(result!.points).toBe(0);
  });
});

// ── getEventProgress ───────────────────────────────────

describe("getEventProgress", () => {
  const milestones = makeMilestones();

  it("shows progress toward first milestone", () => {
    const state = addPoints(createEventState("e1"), 50);
    const progress = getEventProgress(state, milestones);
    expect(progress.currentPoints).toBe(50);
    expect(progress.nextThreshold).toBe(100);
    expect(progress.progress).toBeCloseTo(0.5);
    expect(progress.milestonesCompleted).toBe(0);
    expect(progress.totalMilestones).toBe(3);
  });

  it("shows progress toward second milestone after first claimed", () => {
    let state = addPoints(createEventState("e1"), 200);
    const { state: claimed } = checkMilestones(state, milestones);
    const progress = getEventProgress(claimed, milestones);
    expect(progress.nextThreshold).toBe(500);
    expect(progress.milestonesCompleted).toBe(1);
  });

  it("shows 100% when all milestones claimed", () => {
    let state = addPoints(createEventState("e1"), 5000);
    const { state: claimed } = checkMilestones(state, milestones);
    const progress = getEventProgress(claimed, milestones);
    expect(progress.nextThreshold).toBeNull();
    expect(progress.progress).toBe(1);
  });

  it("caps progress at 1 when points exceed threshold", () => {
    const state = addPoints(createEventState("e1"), 999);
    const progress = getEventProgress(state, milestones);
    // Next threshold is 100, points = 999, so progress = 1 (capped)
    expect(progress.progress).toBe(1);
  });
});

// ── getTimeRemaining ───────────────────────────────────

describe("getTimeRemaining", () => {
  const event = makeEvent();

  it("returns remaining days and hours", () => {
    const result = getTimeRemaining(event, "2026-03-01");
    expect(result.days).toBe(30);
    expect(result.expired).toBe(false);
  });

  it("returns zero when expired", () => {
    const result = getTimeRemaining(event, "2026-04-01");
    expect(result.days).toBe(0);
    expect(result.hours).toBe(0);
    expect(result.totalMs).toBe(0);
    expect(result.expired).toBe(true);
  });

  it("returns expired=true when current equals end date (zero time left)", () => {
    // Both parse to same midnight, diff=0, no time remaining
    const result = getTimeRemaining(event, "2026-03-31");
    expect(result.expired).toBe(true);
    expect(result.days).toBe(0);
    expect(result.hours).toBe(0);
  });

  it("returns positive time when before end date", () => {
    const result = getTimeRemaining(event, "2026-03-29");
    expect(result.days).toBe(2);
    expect(result.expired).toBe(false);
    expect(result.totalMs).toBeGreaterThan(0);
  });
});

// ── getEventModifiers ──────────────────────────────────

describe("getEventModifiers", () => {
  it("returns all modifiers", () => {
    const event = makeEvent();
    const mods = getEventModifiers(event);
    expect(mods).toHaveLength(2);
    expect(mods[0].stat).toBe("xp");
    expect(mods[1].multiplier).toBe(1.2);
  });

  it("returns a copy (does not mutate original)", () => {
    const event = makeEvent();
    const mods = getEventModifiers(event);
    mods.push({ stat: "hp", multiplier: 2 });
    expect(event.modifiers).toHaveLength(2);
  });

  it("handles event with no modifiers", () => {
    const event = makeEvent({ modifiers: [] });
    expect(getEventModifiers(event)).toEqual([]);
  });
});

// ── getAvailableRewards ────────────────────────────────

describe("getAvailableRewards", () => {
  const rewards = makeRewards();

  it("returns all rewards when none purchased", () => {
    const state = createEventState("e1");
    expect(getAvailableRewards(state, rewards)).toHaveLength(3);
  });

  it("excludes purchased rewards", () => {
    const state: EventState = {
      ...createEventState("e1"),
      purchases: ["r1", "r3"],
    };
    const available = getAvailableRewards(state, rewards);
    expect(available).toHaveLength(1);
    expect(available[0].id).toBe("r2");
  });

  it("returns empty when all purchased", () => {
    const state: EventState = {
      ...createEventState("e1"),
      purchases: ["r1", "r2", "r3"],
    };
    expect(getAvailableRewards(state, rewards)).toHaveLength(0);
  });
});

// ── getEventSummary ────────────────────────────────────

describe("getEventSummary", () => {
  it("returns correct summary", () => {
    const event = makeEvent();
    let state = addPoints(createEventState("test_event"), 300);
    state = { ...state, purchases: ["r1"] };
    const { state: claimed } = checkMilestones(state, event.milestones);

    const summary = getEventSummary(claimed, event);
    expect(summary.eventId).toBe("test_event");
    expect(summary.eventName).toBe("Test Event");
    expect(summary.eventType).toBe("holiday");
    expect(summary.points).toBe(300);
    expect(summary.purchaseCount).toBe(1);
    expect(summary.milestonesClaimedCount).toBe(1);
    expect(summary.totalMilestones).toBe(3);
    expect(summary.isActive).toBe(true);
  });
});

// ── generateSeasonalEvent ──────────────────────────────

describe("generateSeasonalEvent", () => {
  it("generates spring event", () => {
    const event = generateSeasonalEvent("spring", 2026);
    expect(event.id).toBe("spring_2026");
    expect(event.name).toContain("Spring");
    expect(event.type).toBe("festival");
    expect(event.startDate).toBe("2026-03-01");
    expect(event.endDate).toBe("2026-05-28");
    expect(event.modifiers[0].stat).toBe("xp");
  });

  it("generates summer event", () => {
    const event = generateSeasonalEvent("summer", 2026);
    expect(event.id).toBe("summer_2026");
    expect(event.type).toBe("holiday");
    expect(event.startDate).toBe("2026-06-01");
    expect(event.modifiers[0].stat).toBe("damage");
  });

  it("generates fall event", () => {
    const event = generateSeasonalEvent("fall", 2026);
    expect(event.type).toBe("challenge");
    expect(event.modifiers[0].stat).toBe("defense");
  });

  it("generates winter event spanning two years", () => {
    const event = generateSeasonalEvent("winter", 2026);
    expect(event.startDate).toBe("2026-12-01");
    expect(event.endDate).toBe("2027-02-28");
    expect(event.modifiers[0].stat).toBe("speed");
  });

  it("includes 5 milestones with increasing thresholds", () => {
    const event = generateSeasonalEvent("spring", 2026);
    expect(event.milestones).toHaveLength(5);
    for (let i = 1; i < event.milestones.length; i++) {
      expect(event.milestones[i].threshold).toBeGreaterThan(
        event.milestones[i - 1].threshold,
      );
    }
  });

  it("includes 3 rewards", () => {
    const event = generateSeasonalEvent("summer", 2026);
    expect(event.rewards).toHaveLength(3);
    expect(event.rewards.some((r) => r.isLimited)).toBe(true);
  });
});

// ── isEventExpired ─────────────────────────────────────

describe("isEventExpired", () => {
  const event = makeEvent();

  it("returns false during active period", () => {
    expect(isEventExpired(event, "2026-03-15")).toBe(false);
  });

  it("returns false on end date", () => {
    expect(isEventExpired(event, "2026-03-31")).toBe(false);
  });

  it("returns true after end date", () => {
    expect(isEventExpired(event, "2026-04-01")).toBe(true);
  });

  it("returns false before start date", () => {
    expect(isEventExpired(event, "2026-02-01")).toBe(false);
  });
});
