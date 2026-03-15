/**
 * DailyRewardCalc — pure TypeScript, NO Phaser imports.
 * Daily login reward system with streak bonuses.
 */

export interface DailyReward {
  day: number; // 1-7 cycle
  type: "coins" | "diamonds" | "revive";
  amount: number;
  isBonus: boolean; // day 7 = bonus day
}

export interface DailyRewardState {
  lastClaimDate: string; // ISO date string "2026-03-13"
  currentStreak: number; // consecutive days (1-7, resets to 1)
  totalDaysClaimed: number;
}

const REWARD_SCHEDULE: readonly DailyReward[] = [
  { day: 1, type: "coins", amount: 50, isBonus: false },
  { day: 2, type: "coins", amount: 75, isBonus: false },
  { day: 3, type: "coins", amount: 100, isBonus: false },
  { day: 4, type: "diamonds", amount: 1, isBonus: false },
  { day: 5, type: "coins", amount: 150, isBonus: false },
  { day: 6, type: "diamonds", amount: 2, isBonus: false },
  { day: 7, type: "coins", amount: 300, isBonus: true },
] as const;

// Day 7 also grants bonus diamonds
const DAY7_BONUS_DIAMONDS = 3;

export function getDefaultRewardState(): DailyRewardState {
  return {
    lastClaimDate: "",
    currentStreak: 0,
    totalDaysClaimed: 0,
  };
}

export function getRewardForDay(day: number): DailyReward {
  const wrapped = ((((day - 1) % 7) + 7) % 7) + 1;
  const reward = REWARD_SCHEDULE[wrapped - 1];
  return { ...reward };
}

export function canClaimToday(
  state: DailyRewardState,
  todayISO: string,
): boolean {
  return state.lastClaimDate !== todayISO;
}

export function isConsecutiveDay(lastDate: string, todayDate: string): boolean {
  if (!lastDate) return false;
  const last = new Date(lastDate + "T00:00:00Z");
  const today = new Date(todayDate + "T00:00:00Z");
  const diffMs = today.getTime() - last.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays === 1;
}

export function getStreakBonus(streak: number): number {
  if (streak >= 7) return 2.0;
  if (streak >= 6) return 1.5;
  if (streak >= 4) return 1.25;
  return 1.0;
}

export function getDaysUntilBonus(currentStreak: number): number {
  if (currentStreak <= 0) return 7;
  const pos = ((currentStreak - 1) % 7) + 1;
  return pos >= 7 ? 0 : 7 - pos;
}

export function claimReward(
  state: DailyRewardState,
  todayISO: string,
): { newState: DailyRewardState; reward: DailyReward } {
  const consecutive = isConsecutiveDay(state.lastClaimDate, todayISO);
  let newStreak: number;

  if (consecutive) {
    // Continue streak, wrap at 7 back to 1
    newStreak = state.currentStreak >= 7 ? 1 : state.currentStreak + 1;
  } else {
    // Reset streak (first claim or gap)
    newStreak = 1;
  }

  const reward = getRewardForDay(newStreak);

  const newState: DailyRewardState = {
    lastClaimDate: todayISO,
    currentStreak: newStreak,
    totalDaysClaimed: state.totalDaysClaimed + 1,
  };

  return { newState, reward };
}

export { DAY7_BONUS_DIAMONDS, REWARD_SCHEDULE };
