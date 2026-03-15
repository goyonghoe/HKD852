/**
 * MilestoneCalc — Pure TypeScript milestone checking logic.
 * No Phaser imports (M-001). All numbers from balance.ts (M-002).
 *
 * Milestones are multi-run cumulative achievements that grant prestige points
 * and optional cosmetic unlock flags.
 */
import { BALANCE } from '../config/balance';
import type { MilestoneDef, MilestoneCategory } from '../types/game';

// ── Milestone Definitions ─────────────────────────────────────────────────────

/** Build the full flat list of all milestone definitions from balance config. */
function buildMilestones(): MilestoneDef[] {
  const defs: MilestoneDef[] = [];

  for (const entry of BALANCE.MILESTONE.runs) {
    defs.push({
      id: entry.id,
      category: 'runs' as MilestoneCategory,
      target: entry.target,
      prestigePoints: entry.prestigePoints,
      cosmeticUnlock: entry.cosmeticUnlock,
    });
  }

  for (const entry of BALANCE.MILESTONE.kills) {
    defs.push({
      id: entry.id,
      category: 'kills' as MilestoneCategory,
      target: entry.target,
      prestigePoints: entry.prestigePoints,
      cosmeticUnlock: (entry as { cosmeticUnlock?: string }).cosmeticUnlock,
    });
  }

  for (const entry of BALANCE.MILESTONE.stages) {
    defs.push({
      id: entry.id,
      category: 'stages' as MilestoneCategory,
      target: entry.target,
      prestigePoints: entry.prestigePoints,
      cosmeticUnlock: (entry as { cosmeticUnlock?: string }).cosmeticUnlock,
    });
  }

  return defs;
}

export const MILESTONES: readonly MilestoneDef[] = buildMilestones();

/** Lookup map: milestoneId → MilestoneDef */
export const MILESTONE_MAP: Readonly<Record<string, MilestoneDef>> = Object.fromEntries(
  MILESTONES.map((m) => [m.id, m]),
);

// ── Milestone Check Input ─────────────────────────────────────────────────────

export interface MilestoneCheckInput {
  /** Total runs completed (cumulative). */
  runsCompleted: number;
  /** Total kills across all runs (cumulative). */
  totalKills: number;
  /** Highest stage reached in any single run (1-based). */
  highestStageReached: number;
  /** Set of already-claimed milestone IDs. */
  claimedMilestoneIds: ReadonlySet<string>;
}

// ── Milestone Check Result ────────────────────────────────────────────────────

export interface NewlyEarnedMilestone {
  milestone: MilestoneDef;
  prestigePoints: number;
  cosmeticUnlock?: string;
}

// ── Core Functions ────────────────────────────────────────────────────────────

/**
 * Get the relevant progress value for a milestone category from the input.
 */
export function getMilestoneProgress(input: MilestoneCheckInput, category: MilestoneCategory): number {
  switch (category) {
    case 'runs':
      return input.runsCompleted;
    case 'kills':
      return input.totalKills;
    case 'stages':
      return input.highestStageReached;
  }
}

/**
 * Check which milestones are newly earned (met target + not yet claimed).
 * Returns an array of newly earned milestones in ascending target order.
 */
export function checkMilestones(input: MilestoneCheckInput): NewlyEarnedMilestone[] {
  const earned: NewlyEarnedMilestone[] = [];

  for (const milestone of MILESTONES) {
    if (input.claimedMilestoneIds.has(milestone.id)) continue;

    const progress = getMilestoneProgress(input, milestone.category);
    if (progress >= milestone.target) {
      earned.push({
        milestone,
        prestigePoints: milestone.prestigePoints,
        cosmeticUnlock: milestone.cosmeticUnlock,
      });
    }
  }

  return earned;
}

/**
 * Get current progress and target for a specific milestone.
 * Returns { current, target, percent } — useful for UI progress bars.
 */
export function getMilestoneProgressInfo(
  input: MilestoneCheckInput,
  milestoneId: string,
): { current: number; target: number; percent: number; claimed: boolean } {
  const def = MILESTONE_MAP[milestoneId];
  if (!def) return { current: 0, target: 0, percent: 0, claimed: false };

  const current = getMilestoneProgress(input, def.category);
  const clamped = Math.min(current, def.target);
  return {
    current: clamped,
    target: def.target,
    percent: def.target > 0 ? clamped / def.target : 0,
    claimed: input.claimedMilestoneIds.has(milestoneId),
  };
}

/**
 * Calculate total prestige points earned from a set of newly earned milestones.
 */
export function sumMilestonePrestige(earned: NewlyEarnedMilestone[]): number {
  return earned.reduce((sum, e) => sum + e.prestigePoints, 0);
}

/**
 * Get all cosmetic unlock flags from a set of newly earned milestones.
 * Returns an array of cosmeticUnlock strings (undefined entries filtered out).
 */
export function collectCosmeticUnlocks(earned: NewlyEarnedMilestone[]): string[] {
  return earned.filter((e) => e.cosmeticUnlock !== undefined).map((e) => e.cosmeticUnlock!);
}

/**
 * Get all milestones for a given category, sorted by target ascending.
 */
export function getMilestonesByCategory(category: MilestoneCategory): MilestoneDef[] {
  return MILESTONES.filter((m) => m.category === category).sort((a, b) => a.target - b.target);
}

/**
 * Get the next unclaimed milestone for a category (the nearest upcoming one).
 * Returns undefined if all milestones in the category are claimed.
 */
export function getNextMilestone(input: MilestoneCheckInput, category: MilestoneCategory): MilestoneDef | undefined {
  const sorted = getMilestonesByCategory(category);
  const progress = getMilestoneProgress(input, category);
  return sorted.find((m) => !input.claimedMilestoneIds.has(m.id) && m.target > progress);
}
