// DailyLoginCalc.ts — pure TypeScript, NO Phaser imports
// Daily login calendar reward system for Neon Survivors.
// All functions are pure and return new objects (immutable).

// ════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════

export interface DailyLoginState {
  readonly currentDay: number;
  readonly streak: number;
  readonly maxStreak: number;
  readonly lastLoginDate: string;
  readonly totalLogins: number;
  readonly claimedToday: boolean;
  readonly monthlyProgress: readonly number[];
  readonly currentMonth: number;
}

export interface LoginReward {
  readonly day: number;
  readonly type:
    | "coins"
    | "gems"
    | "xp_boost"
    | "weapon_crate"
    | "premium_crate";
  readonly amount: number;
  readonly isBonus: boolean;
}

export interface CheckInResult {
  readonly state: DailyLoginState;
  readonly reward: LoginReward;
  readonly streakBonus: number;
}

// ════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════

const CYCLE_LENGTH = 28;

const MILESTONE_DAYS = [7, 14, 21, 28] as const;

// ════════════════════════════════════════════════════════════════
// FUNCTIONS
// ════════════════════════════════════════════════════════════════

/** Create a fresh daily login state. */
export function createDailyLoginState(): DailyLoginState {
  return {
    currentDay: 0,
    streak: 0,
    maxStreak: 0,
    lastLoginDate: "",
    totalLogins: 0,
    claimedToday: false,
    monthlyProgress: [],
    currentMonth: 1,
  };
}

/** Get the base reward for a given calendar day (1-28). */
export function getRewardForDay(day: number): LoginReward {
  const d = ((day - 1) % CYCLE_LENGTH) + 1;

  if (d === 28) {
    return { day: d, type: "premium_crate", amount: 1, isBonus: false };
  }
  if (d === 21) {
    return { day: d, type: "gems", amount: 100, isBonus: false };
  }
  if (d === 14) {
    return { day: d, type: "weapon_crate", amount: 1, isBonus: false };
  }
  if (d === 7) {
    return { day: d, type: "gems", amount: 50, isBonus: false };
  }

  // Regular coin days — amount scales by week
  if (d >= 22 && d <= 27) {
    return { day: d, type: "coins", amount: 250, isBonus: false };
  }
  if (d >= 15 && d <= 20) {
    return { day: d, type: "coins", amount: 200, isBonus: false };
  }
  if (d >= 8 && d <= 13) {
    return { day: d, type: "coins", amount: 150, isBonus: false };
  }
  // d >= 1 && d <= 6
  return { day: d, type: "coins", amount: 100, isBonus: false };
}

/** Get the streak multiplier for coin rewards. */
export function getStreakMultiplier(streak: number): number {
  if (streak >= 28) return 1.0;
  if (streak >= 14) return 0.75;
  if (streak >= 7) return 0.5;
  if (streak >= 3) return 0.25;
  return 0;
}

/** Apply streak bonus to a reward. Only coin rewards are boosted. */
export function applyStreakBonus(
  reward: LoginReward,
  multiplier: number,
): LoginReward {
  if (reward.type !== "coins" || multiplier <= 0) {
    return reward;
  }
  const bonus = Math.floor(reward.amount * multiplier);
  return {
    ...reward,
    amount: reward.amount + bonus,
    isBonus: bonus > 0,
  };
}

/** Check if the streak is broken (more than 1 calendar day gap). */
export function isStreakBroken(lastDate: string, currentDate: string): boolean {
  if (!lastDate) return false; // no previous login, streak not "broken"
  const last = new Date(lastDate);
  const current = new Date(currentDate);
  const diffMs = current.getTime() - last.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays > 1;
}

/** Check if the player can check in (not already claimed today). */
export function canCheckIn(
  state: DailyLoginState,
  currentDate: string,
): boolean {
  if (state.claimedToday && state.lastLoginDate === currentDate) {
    return false;
  }
  return true;
}

/** Perform a daily check-in. Returns new state, reward, and streak bonus. */
export function checkIn(
  state: DailyLoginState,
  currentDate: string,
): CheckInResult {
  if (!canCheckIn(state, currentDate)) {
    throw new Error("Already checked in today");
  }

  const streakBroken = isStreakBroken(state.lastLoginDate, currentDate);
  const newStreak = streakBroken ? 1 : state.streak + 1;
  const nextDay = (state.currentDay % CYCLE_LENGTH) + 1;
  const baseReward = getRewardForDay(nextDay);
  const multiplier = getStreakMultiplier(newStreak);
  const finalReward = applyStreakBonus(baseReward, multiplier);
  const newMaxStreak = Math.max(state.maxStreak, newStreak);
  const newProgress = [...state.monthlyProgress, nextDay];

  const newState: DailyLoginState = {
    currentDay: nextDay,
    streak: newStreak,
    maxStreak: newMaxStreak,
    lastLoginDate: currentDate,
    totalLogins: state.totalLogins + 1,
    claimedToday: true,
    monthlyProgress: newProgress,
    currentMonth: state.currentMonth,
  };

  return {
    state: newState,
    reward: finalReward,
    streakBonus: multiplier,
  };
}

/** Get the next milestone day after currentDay (7, 14, 21, 28). */
export function getNextMilestone(currentDay: number): number {
  const d = ((currentDay - 1) % CYCLE_LENGTH) + 1;
  for (const m of MILESTONE_DAYS) {
    if (m > d) return m;
  }
  // Past day 28 or at 28 — next cycle's first milestone
  return 7;
}

/** Get the number of days until the next milestone. */
export function getDaysUntilMilestone(currentDay: number): number {
  const d = ((currentDay - 1) % CYCLE_LENGTH) + 1;
  const next = getNextMilestone(currentDay);
  if (next > d) return next - d;
  // Wrapped to next cycle
  return CYCLE_LENGTH - d + next;
}

/** Get monthly progress as a fraction (days claimed / 28). */
export function getMonthlyProgress(state: DailyLoginState): number {
  return state.monthlyProgress.length / CYCLE_LENGTH;
}

/** Reset state for a new month (new 28-day cycle). */
export function resetMonth(state: DailyLoginState): DailyLoginState {
  return {
    ...state,
    currentDay: 0,
    monthlyProgress: [],
    currentMonth: state.currentMonth + 1,
    claimedToday: false,
  };
}

/** Calculate total rewards earned from monthly progress. */
export function getTotalRewardsEarned(state: DailyLoginState): {
  coins: number;
  gems: number;
  weaponCrates: number;
  premiumCrates: number;
} {
  let coins = 0;
  let gems = 0;
  let weaponCrates = 0;
  let premiumCrates = 0;

  for (const day of state.monthlyProgress) {
    const reward = getRewardForDay(day);
    switch (reward.type) {
      case "coins":
        coins += reward.amount;
        break;
      case "gems":
        gems += reward.amount;
        break;
      case "weapon_crate":
        weaponCrates += reward.amount;
        break;
      case "premium_crate":
        premiumCrates += reward.amount;
        break;
    }
  }

  return { coins, gems, weaponCrates, premiumCrates };
}

/** Preview the next 7 days of rewards from currentDay. */
export function getCalendarPreview(currentDay: number): LoginReward[] {
  const rewards: LoginReward[] = [];
  for (let i = 1; i <= 7; i++) {
    const day = ((currentDay + i - 1) % CYCLE_LENGTH) + 1;
    rewards.push(getRewardForDay(day));
  }
  return rewards;
}
