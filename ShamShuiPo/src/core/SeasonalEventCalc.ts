/**
 * SeasonalEventCalc — pure TypeScript, NO Phaser imports.
 * Limited-time seasonal event system: milestones, rewards, modifiers, progress tracking.
 */

// ── Types ──────────────────────────────────────────────

export type EventType =
  | "holiday"
  | "anniversary"
  | "collab"
  | "challenge"
  | "festival";

export interface EventModifier {
  stat: string;
  multiplier: number;
}

export interface EventReward {
  id: string;
  name: string;
  cost: number;
  currency: string;
  isLimited: boolean;
}

export interface EventMilestone {
  threshold: number;
  reward: string;
  claimed: boolean;
}

export interface SeasonalEvent {
  id: string;
  name: string;
  type: EventType;
  startDate: string;
  endDate: string;
  modifiers: EventModifier[];
  rewards: EventReward[];
  milestones: EventMilestone[];
}

export interface EventState {
  eventId: string;
  points: number;
  purchases: string[];
  claimedMilestones: number[];
  isActive: boolean;
}

export interface MilestoneResult {
  state: EventState;
  claimed: number[];
}

export interface TimeRemaining {
  days: number;
  hours: number;
  totalMs: number;
  expired: boolean;
}

export interface EventProgress {
  currentPoints: number;
  nextThreshold: number | null;
  progress: number;
  milestonesCompleted: number;
  totalMilestones: number;
}

export interface EventSummary {
  eventId: string;
  eventName: string;
  eventType: EventType;
  points: number;
  purchaseCount: number;
  milestonesClaimedCount: number;
  totalMilestones: number;
  isActive: boolean;
}

// ── Helpers ────────────────────────────────────────────

function parseDate(dateStr: string): Date {
  return new Date(dateStr);
}

// ── Functions ──────────────────────────────────────────

/** Create a fresh event state. */
export function createEventState(eventId: string): EventState {
  return {
    eventId,
    points: 0,
    purchases: [],
    claimedMilestones: [],
    isActive: true,
  };
}

/** Check if event is active (current date between start and end, inclusive). */
export function isEventActive(
  event: SeasonalEvent,
  currentDate: string,
): boolean {
  const now = parseDate(currentDate).getTime();
  const start = parseDate(event.startDate).getTime();
  const end = parseDate(event.endDate).getTime();
  return now >= start && now <= end;
}

/** Add event points. Amount must be positive. */
export function addPoints(state: EventState, amount: number): EventState {
  if (amount <= 0) return state;
  return { ...state, points: state.points + amount };
}

/** Check and claim eligible milestones. Returns updated state and newly claimed indices. */
export function checkMilestones(
  state: EventState,
  milestones: EventMilestone[],
): MilestoneResult {
  const claimed: number[] = [];
  const alreadyClaimed = new Set(state.claimedMilestones);

  for (let i = 0; i < milestones.length; i++) {
    if (!alreadyClaimed.has(i) && state.points >= milestones[i].threshold) {
      claimed.push(i);
    }
  }

  if (claimed.length === 0) {
    return { state, claimed: [] };
  }

  return {
    state: {
      ...state,
      claimedMilestones: [...state.claimedMilestones, ...claimed],
    },
    claimed,
  };
}

/** Purchase a reward using event points. Returns null if not affordable or already purchased. */
export function purchaseReward(
  state: EventState,
  rewardId: string,
  rewards: EventReward[],
): EventState | null {
  const reward = rewards.find((r) => r.id === rewardId);
  if (!reward) return null;

  if (state.purchases.includes(rewardId)) return null;

  if (state.points < reward.cost) return null;

  return {
    ...state,
    points: state.points - reward.cost,
    purchases: [...state.purchases, rewardId],
  };
}

/** Get progress toward the next unclaimed milestone. */
export function getEventProgress(
  state: EventState,
  milestones: EventMilestone[],
): EventProgress {
  const claimedSet = new Set(state.claimedMilestones);
  const sortedMilestones = milestones
    .map((m, i) => ({ ...m, index: i }))
    .sort((a, b) => a.threshold - b.threshold);

  let nextThreshold: number | null = null;
  for (const m of sortedMilestones) {
    if (!claimedSet.has(m.index)) {
      nextThreshold = m.threshold;
      break;
    }
  }

  const progress =
    nextThreshold !== null ? Math.min(1, state.points / nextThreshold) : 1;

  return {
    currentPoints: state.points,
    nextThreshold,
    progress,
    milestonesCompleted: state.claimedMilestones.length,
    totalMilestones: milestones.length,
  };
}

/** Get time remaining until event ends. */
export function getTimeRemaining(
  event: SeasonalEvent,
  currentDate: string,
): TimeRemaining {
  const now = parseDate(currentDate).getTime();
  const end = parseDate(event.endDate).getTime();
  const diff = end - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, totalMs: 0, expired: true };
  }

  const totalHours = diff / (1000 * 60 * 60);
  const days = Math.floor(totalHours / 24);
  const hours = Math.floor(totalHours % 24);

  return { days, hours, totalMs: diff, expired: false };
}

/** Get active modifiers for an event. */
export function getEventModifiers(event: SeasonalEvent): EventModifier[] {
  return [...event.modifiers];
}

/** Get rewards not yet purchased. */
export function getAvailableRewards(
  state: EventState,
  rewards: EventReward[],
): EventReward[] {
  const purchasedSet = new Set(state.purchases);
  return rewards.filter((r) => !purchasedSet.has(r.id));
}

/** Get a summary of event state. */
export function getEventSummary(
  state: EventState,
  event: SeasonalEvent,
): EventSummary {
  return {
    eventId: state.eventId,
    eventName: event.name,
    eventType: event.type,
    points: state.points,
    purchaseCount: state.purchases.length,
    milestonesClaimedCount: state.claimedMilestones.length,
    totalMilestones: event.milestones.length,
    isActive: state.isActive,
  };
}

/** Generate a seasonal event configuration for a given season and year. */
export function generateSeasonalEvent(
  season: "spring" | "summer" | "fall" | "winter",
  year: number,
): SeasonalEvent {
  const seasonConfig: Record<
    string,
    {
      name: string;
      type: EventType;
      startMonth: number;
      endMonth: number;
      modStat: string;
      modMultiplier: number;
    }
  > = {
    spring: {
      name: `Spring Bloom ${year}`,
      type: "festival",
      startMonth: 3,
      endMonth: 5,
      modStat: "xp",
      modMultiplier: 1.5,
    },
    summer: {
      name: `Neon Summer ${year}`,
      type: "holiday",
      startMonth: 6,
      endMonth: 8,
      modStat: "damage",
      modMultiplier: 1.25,
    },
    fall: {
      name: `Cyber Harvest ${year}`,
      type: "challenge",
      startMonth: 9,
      endMonth: 11,
      modStat: "defense",
      modMultiplier: 1.3,
    },
    winter: {
      name: `Frost Circuit ${year}`,
      type: "holiday",
      startMonth: 12,
      endMonth: 2,
      modStat: "speed",
      modMultiplier: 1.2,
    },
  };

  const cfg = seasonConfig[season];

  const startYear = season === "winter" ? year : year;
  const endYear = season === "winter" ? year + 1 : year;
  const startDate = `${startYear}-${String(cfg.startMonth).padStart(2, "0")}-01`;
  const endDate = `${endYear}-${String(cfg.endMonth).padStart(2, "0")}-28`;

  const milestoneThresholds = [100, 500, 1000, 2500, 5000];
  const milestoneRewards = [
    "event_badge",
    "rare_skin",
    "event_weapon",
    "legendary_skin",
    "event_title",
  ];

  return {
    id: `${season}_${year}`,
    name: cfg.name,
    type: cfg.type,
    startDate,
    endDate,
    modifiers: [{ stat: cfg.modStat, multiplier: cfg.modMultiplier }],
    rewards: [
      {
        id: `${season}_reward_1`,
        name: "Event Crate",
        cost: 200,
        currency: "event_tokens",
        isLimited: false,
      },
      {
        id: `${season}_reward_2`,
        name: "Limited Skin",
        cost: 1000,
        currency: "event_tokens",
        isLimited: true,
      },
      {
        id: `${season}_reward_3`,
        name: "Exclusive Emote",
        cost: 500,
        currency: "event_tokens",
        isLimited: true,
      },
    ],
    milestones: milestoneThresholds.map((threshold, i) => ({
      threshold,
      reward: milestoneRewards[i],
      claimed: false,
    })),
  };
}

/** Check if event has expired (past end date). */
export function isEventExpired(
  event: SeasonalEvent,
  currentDate: string,
): boolean {
  const now = parseDate(currentDate).getTime();
  const end = parseDate(event.endDate).getTime();
  return now > end;
}
