/**
 * Achievement system — Pure TypeScript, no Phaser imports.
 * Tracks milestone-based achievements with gold rewards.
 * Extended (TASK-185): integrates milestone checking into post-run reward pipeline.
 */
import type { MetaState, RunEndData } from '../types/game';
import { BALANCE } from '../config/balance';
import {
  checkMilestones,
  sumMilestonePrestige,
  collectCosmeticUnlocks,
  type MilestoneCheckInput,
  type NewlyEarnedMilestone,
} from './MilestoneCalc';

export interface AchievementDef {
  readonly id: string;
  readonly category: 'combat' | 'economy' | 'progression' | 'collection';
  readonly nameKey: string; // i18n key for display name
  readonly descKey: string; // i18n key for description
  readonly target: number;
  readonly goldReward: number;
  /** Extract the current progress value from meta + optional run data */
  readonly getProgress: (meta: MetaState, run?: RunEndData) => number;
}

export const ACHIEVEMENTS: Record<string, AchievementDef> = {
  first_blood: {
    id: 'first_blood',
    category: 'combat',
    nameKey: 'achievement.first_blood',
    descKey: 'achievement.first_blood_desc',
    target: 1,
    goldReward: BALANCE.ACHIEVEMENTS.firstBloodGold,
    getProgress: (meta) => meta.bestKills,
  },
  hunter_100: {
    id: 'hunter_100',
    category: 'combat',
    nameKey: 'achievement.hunter_100',
    descKey: 'achievement.hunter_100_desc',
    target: 100,
    goldReward: BALANCE.ACHIEVEMENTS.hunter100Gold,
    getProgress: (meta) => meta.bestKills,
  },
  hunter_1000: {
    id: 'hunter_1000',
    category: 'combat',
    nameKey: 'achievement.hunter_1000',
    descKey: 'achievement.hunter_1000_desc',
    target: 1000,
    goldReward: BALANCE.ACHIEVEMENTS.hunter1000Gold,
    getProgress: (meta) => meta.bestKills,
  },
  gold_hoarder: {
    id: 'gold_hoarder',
    category: 'economy',
    nameKey: 'achievement.gold_hoarder',
    descKey: 'achievement.gold_hoarder_desc',
    target: 1000,
    goldReward: BALANCE.ACHIEVEMENTS.goldHoarderGold,
    getProgress: (meta) => meta.totalGoldEarned ?? 0,
  },
  veteran_10: {
    id: 'veteran_10',
    category: 'progression',
    nameKey: 'achievement.veteran_10',
    descKey: 'achievement.veteran_10_desc',
    target: 10,
    goldReward: BALANCE.ACHIEVEMENTS.veteran10Gold,
    getProgress: (meta) => meta.runsCompleted,
  },
  boss_slayer: {
    id: 'boss_slayer',
    category: 'combat',
    nameKey: 'achievement.boss_slayer',
    descKey: 'achievement.boss_slayer_desc',
    target: 10,
    goldReward: BALANCE.ACHIEVEMENTS.bossSlayerGold,
    getProgress: (meta) => meta.totalBossKills ?? 0,
  },
  weapon_master: {
    id: 'weapon_master',
    category: 'collection',
    nameKey: 'achievement.weapon_master',
    descKey: 'achievement.weapon_master_desc',
    target: 1,
    goldReward: BALANCE.ACHIEVEMENTS.weaponMasterGold,
    getProgress: (_meta, run) => (run && run.highestWeaponLevel >= 5 ? 1 : 0),
  },
  max_level: {
    id: 'max_level',
    category: 'progression',
    nameKey: 'achievement.max_level',
    descKey: 'achievement.max_level_desc',
    target: 20,
    goldReward: BALANCE.ACHIEVEMENTS.maxLevelGold,
    getProgress: (meta) => meta.bestLevel,
  },
  survivor_5min: {
    id: 'survivor_5min',
    category: 'progression',
    nameKey: 'achievement.survivor_5min',
    descKey: 'achievement.survivor_5min_desc',
    target: 300000, // 5 minutes in ms
    goldReward: BALANCE.ACHIEVEMENTS.survivor5minGold,
    getProgress: (meta) => meta.bestTimeMs,
  },
  full_house: {
    id: 'full_house',
    category: 'collection',
    nameKey: 'achievement.full_house',
    descKey: 'achievement.full_house_desc',
    target: 5,
    goldReward: BALANCE.ACHIEVEMENTS.fullHouseGold,
    getProgress: (_meta, run) => run?.weaponsUsed ?? 0,
  },
  all_characters: {
    id: 'all_characters',
    category: 'collection',
    nameKey: 'achievement.all_characters',
    descKey: 'achievement.all_characters_desc',
    target: 5, // total character count
    goldReward: BALANCE.ACHIEVEMENTS.allCharactersGold,
    getProgress: (meta) => {
      // Check unlock conditions for all 5 characters
      let count = 0;
      // hai: always unlocked
      count++;
      // nova: always unlocked
      count++;
      // sol: runsCompleted >= 3
      if (meta.runsCompleted >= 3) count++;
      // mei: totalGoldEarned >= 500
      if ((meta.totalGoldEarned ?? 0) >= 500) count++;
      // kai: bestKills >= 200
      if (meta.bestKills >= 200) count++;
      return count;
    },
  },
  meta_max: {
    id: 'meta_max',
    category: 'progression',
    nameKey: 'achievement.meta_max',
    descKey: 'achievement.meta_max_desc',
    target: 1,
    goldReward: BALANCE.ACHIEVEMENTS.metaMaxGold,
    getProgress: (meta) => {
      // Check if any meta upgrade is at max level
      // meta_damage/hp/crit/armor: maxLevel 5; meta_xp/magnet/luck: maxLevel 3
      const maxLevels: Record<string, number> = {
        meta_damage: 5,
        meta_hp: 5,
        meta_xp: 3,
        meta_crit: 5,
        meta_magnet: 3,
        meta_armor: 5,
        meta_luck: 3,
      };
      for (const [id, max] of Object.entries(maxLevels)) {
        if ((meta.upgrades[id] ?? 0) >= max) return 1;
      }
      return 0;
    },
  },
  speedrun: {
    id: 'speedrun',
    category: 'progression',
    nameKey: 'achievement.speedrun',
    descKey: 'achievement.speedrun_desc',
    target: 1,
    goldReward: BALANCE.ACHIEVEMENTS.speedrunGold,
    getProgress: (_meta, run) => {
      if (!run) return 0;
      // Clear within 3 minutes and survived
      return run.survived && run.timeMs <= 180000 ? 1 : 0;
    },
  },
  pacifist_gold: {
    id: 'pacifist_gold',
    category: 'economy',
    nameKey: 'achievement.pacifist_gold',
    descKey: 'achievement.pacifist_gold_desc',
    target: 5000,
    goldReward: BALANCE.ACHIEVEMENTS.pacifistGoldGold,
    getProgress: (meta) => meta.totalGoldEarned ?? 0,
  },
  legend: {
    id: 'legend',
    category: 'progression',
    nameKey: 'achievement.legend',
    descKey: 'achievement.legend_desc',
    target: 30,
    goldReward: BALANCE.ACHIEVEMENTS.legendGold,
    getProgress: (meta) => meta.runsCompleted,
  },
};

/**
 * Check for newly unlocked achievements after a run ends.
 * Returns an array of achievement IDs that were just unlocked.
 */
export function checkAchievements(meta: MetaState, runData: RunEndData): string[] {
  const unlocked = meta.unlockedAchievements ?? [];
  const newlyUnlocked: string[] = [];

  for (const [id, def] of Object.entries(ACHIEVEMENTS)) {
    if (unlocked.includes(id)) continue; // already unlocked
    const progress = def.getProgress(meta, runData);
    if (progress >= def.target) {
      newlyUnlocked.push(id);
    }
  }

  return newlyUnlocked;
}

/**
 * Get the current progress toward an achievement.
 */
export function getAchievementProgress(
  meta: MetaState,
  id: string,
  runData?: RunEndData,
): { current: number; target: number } {
  const def = ACHIEVEMENTS[id];
  if (!def) return { current: 0, target: 0 };
  return {
    current: Math.min(def.getProgress(meta, runData), def.target),
    target: def.target,
  };
}

// ── Milestone Reward Integration (TASK-185) ───────────────────────────────────

export interface PostRunRewardResult {
  /** Achievement IDs newly unlocked this run. */
  newAchievements: string[];
  /** Newly earned milestone rewards (not yet claimed). */
  newMilestones: NewlyEarnedMilestone[];
  /** Total prestige points earned from newly reached milestones. */
  milestonePrestige: number;
  /** Cosmetic unlock flags from newly reached milestones. */
  cosmeticUnlocks: string[];
}

/**
 * Process all post-run rewards: achievements + milestones.
 *
 * Combines achievement checking and milestone checking into a single call
 * to simplify integration at run-end.
 *
 * @param meta         Current MetaState (should reflect post-run updates like runsCompleted++)
 * @param runData      Data from the just-completed run
 * @param totalKills   Cumulative total kills across all runs (post-run)
 * @param highestStage Highest stage ever reached in any single run (post-run)
 */
export function processPostRunRewards(
  meta: MetaState,
  runData: RunEndData,
  totalKills: number,
  highestStage: number,
): PostRunRewardResult {
  const newAchievements = checkAchievements(meta, runData);

  const milestoneInput: MilestoneCheckInput = {
    runsCompleted: meta.runsCompleted,
    totalKills,
    highestStageReached: highestStage,
    claimedMilestoneIds: new Set(meta.claimedMilestoneIds ?? []),
  };

  const newMilestones = checkMilestones(milestoneInput);
  const milestonePrestige = sumMilestonePrestige(newMilestones);
  const cosmeticUnlocks = collectCosmeticUnlocks(newMilestones);

  return {
    newAchievements,
    newMilestones,
    milestonePrestige,
    cosmeticUnlocks,
  };
}
