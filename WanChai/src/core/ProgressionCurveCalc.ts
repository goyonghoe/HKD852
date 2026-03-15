/**
 * Long-term progression curve calculations.
 * Analyzes prestige earn rates, total unlock costs, and completion timelines.
 * NO Phaser imports (M-001). All balance numbers from config (M-002).
 *
 * Design Goal: 50% meta completion at ~100 runs for a mid-skill player.
 *
 * TASK-190
 */

import { BALANCE } from '../config/balance';
import { META_UPGRADES } from './MetaProgression';
import { calcPrestigeEarned } from './EconomyCalc';

// ── Total Unlock Cost ────────────────────────────────────────────────────────

/**
 * Calculate the total prestige cost to max out all meta upgrades.
 * Note: MetaProgression uses totalGold (legacy field). These are prestige costs
 * going forward — the costPerLevel arrays are reused for prestige costs.
 */
export function calcTotalMetaPrestigeCost(): number {
  let total = 0;
  for (const def of Object.values(META_UPGRADES)) {
    total += def.costPerLevel.reduce((sum, cost) => sum + cost, 0);
  }
  return total;
}

/**
 * Calculate prestige cost for a specific upgrade to reach a given level.
 * Returns sum of costPerLevel[0..targetLevel-1].
 */
export function calcUpgradeCostToLevel(upgradeId: string, targetLevel: number): number {
  const def = META_UPGRADES[upgradeId];
  if (!def) return 0;
  const clamped = Math.min(targetLevel, def.maxLevel);
  return def.costPerLevel.slice(0, clamped).reduce((sum, c) => sum + c, 0);
}

// ── Average Prestige Per Run ─────────────────────────────────────────────────

/** Player skill profile used for simulation. */
export interface PlayerSkillProfile {
  /** Average stage reached per run (1-16). */
  avgStageReached: number;
  /** Average kills per run. */
  avgKills: number;
}

/** Built-in skill profiles for analysis. */
export const SKILL_PROFILES: Record<string, PlayerSkillProfile> = {
  beginner: { avgStageReached: 2, avgKills: 80 },
  casual: { avgStageReached: 4, avgKills: 150 },
  mid: { avgStageReached: 7, avgKills: 280 },
  skilled: { avgStageReached: 10, avgKills: 380 },
  expert: { avgStageReached: 14, avgKills: 480 },
};

/**
 * Calculate average prestige earned per run for a skill profile.
 */
export function calcAvgPrestigePerRun(profile: PlayerSkillProfile): number {
  const result = calcPrestigeEarned({
    stageReached: profile.avgStageReached,
    kills: profile.avgKills,
  });
  return result.prestige;
}

// ── Completion Timeline ──────────────────────────────────────────────────────

/**
 * Estimate how many runs to reach a given percentage of total meta completion.
 *
 * @param profile      Player skill profile.
 * @param targetPercent 0-1 (e.g. 0.5 = 50%).
 * @returns Estimated run count to reach target completion.
 */
export function estimateRunsForCompletion(profile: PlayerSkillProfile, targetPercent: number): number {
  const totalCost = calcTotalMetaPrestigeCost();
  const targetPrestige = totalCost * Math.min(1, Math.max(0, targetPercent));
  const avgPerRun = calcAvgPrestigePerRun(profile);
  if (avgPerRun <= 0) return Infinity;
  return Math.ceil(targetPrestige / avgPerRun);
}

/**
 * Simulate cumulative prestige earned over N runs for a skill profile.
 * Returns array of cumulative prestige per run.
 */
export function simulateCumulativePrestige(profile: PlayerSkillProfile, runs: number): number[] {
  const avgPerRun = calcAvgPrestigePerRun(profile);
  const result: number[] = [];
  let cumulative = 0;
  for (let i = 0; i < runs; i++) {
    cumulative += avgPerRun;
    result.push(cumulative);
  }
  return result;
}

/**
 * Calculate what % of total meta cost is achievable by run N for a skill profile.
 */
export function calcCompletionAtRun(profile: PlayerSkillProfile, runN: number): number {
  const totalCost = calcTotalMetaPrestigeCost();
  if (totalCost <= 0) return 1;
  const avgPerRun = calcAvgPrestigePerRun(profile);
  const earned = avgPerRun * runN;
  return Math.min(1, earned / totalCost);
}

// ── Prestige Curve Validation ─────────────────────────────────────────────────

/**
 * Summary report for the progression curve at a specific skill profile.
 */
export interface ProgressionSummary {
  profile: PlayerSkillProfile;
  avgPrestigePerRun: number;
  totalMetaCost: number;
  runsFor50Percent: number;
  runsFor100Percent: number;
  completionAt50Runs: number; // fraction 0-1
  completionAt100Runs: number; // fraction 0-1
  completionAt200Runs: number; // fraction 0-1
}

/**
 * Generate a progression summary for a given skill profile.
 */
export function buildProgressionSummary(profile: PlayerSkillProfile): ProgressionSummary {
  return {
    profile,
    avgPrestigePerRun: calcAvgPrestigePerRun(profile),
    totalMetaCost: calcTotalMetaPrestigeCost(),
    runsFor50Percent: estimateRunsForCompletion(profile, 0.5),
    runsFor100Percent: estimateRunsForCompletion(profile, 1.0),
    completionAt50Runs: calcCompletionAtRun(profile, 50),
    completionAt100Runs: calcCompletionAtRun(profile, 100),
    completionAt200Runs: calcCompletionAtRun(profile, 200),
  };
}

// ── Shop Slot Pricing ────────────────────────────────────────────────────────

/**
 * Get the price multiplier for a given shop slot index (0-based).
 * Slots 0-2: 1.0x, Slots 3-5: 1.5x, Slots 6-7: 2.0x
 */
export function getSlotPriceMultiplier(slotIndex: number): number {
  const tiers = BALANCE.ECONOMY.shopSlotTiers;
  for (const tier of tiers) {
    if ((tier.slots as readonly number[]).includes(slotIndex)) {
      return tier.multiplier;
    }
  }
  // Default: last tier multiplier for out-of-range slots
  return tiers[tiers.length - 1].multiplier;
}

/**
 * Calculate the final cost for an item placed at a given slot.
 */
export function calcSlotPrice(baseCost: number, slotIndex: number): number {
  return Math.ceil(baseCost * getSlotPriceMultiplier(slotIndex));
}
