export interface RunState {
  characterId: string; // selected character ID
  seed: number; // deterministic PRNG seed for replay/debugging
  runTime: number; // ms elapsed (total across all stages)
  stageTime: number; // ms elapsed in current stage (resets per stage)
  stage: number; // 1-based current stage index
  playerLevel: number;
  playerXp: number;
  baseHp: number; // current base wall HP
  baseMaxHp: number; // max base wall HP
  kills: number;
  gold: number; // earned this run
  weapons: string[]; // weapon IDs equipped
  passives: string[]; // passive upgrade IDs
  totalDamageDealt: number; // cumulative damage dealt to enemies
  weaponDamageMap: Record<string, number>; // weaponId → total damage dealt
  critHitsLanded: number; // number of critical hits landed
  totalHitsLanded: number; // total projectile hits landed (denominator for crit rate)
  highestSingleHit: number; // highest single-hit damage value
}

export interface MetaState {
  totalGold: number;
  totalGoldEarned: number; // cumulative gold earned (never decreases)
  highScore: number;
  bestKills: number;
  bestLevel: number;
  bestTimeMs: number;
  upgrades: Record<string, number>; // upgradeId → level
  runsCompleted: number;
  discovered: {
    weapons: string[];
    enemies: string[];
  };
  lastLoginDate?: string; // ISO date string "YYYY-MM-DD"
  dailyStreak?: number; // 0-7
  unlockedAchievements?: string[];
  totalBossKills?: number;
  masteryRecord?: MasteryRecord; // weaponId → WeaponMasteryStats (TASK-184)
  // TASK-185: milestone tracking
  totalKills?: number; // cumulative kills across all runs
  highestStageReached?: number; // highest stage ever reached in a single run
  claimedMilestoneIds?: string[]; // IDs of milestones already claimed
}

export interface RunEndData {
  kills: number;
  gold: number;
  level: number;
  timeMs: number;
  weaponsUsed: number;
  highestWeaponLevel: number;
  bossKills: number;
  survived: boolean;
  totalDamageDealt?: number;
  weaponDamageMap?: Record<string, number>;
  critHitsLanded?: number;
  totalHitsLanded?: number;
  highestSingleHit?: number;
}

export type GamePhase = 'playing' | 'levelup' | 'paused' | 'gameover' | 'shop' | 'stage_clear';

// ── Mastery System (TASK-184) ────────────────────────────────────────────────

/** Per-weapon usage statistics accumulated across all runs. */
export interface WeaponMasteryStats {
  weaponId: string;
  kills: number;
  runsUsed: number;
  totalDamage: number;
  masteryXp: number;
  masteryLevel: number; // 0 = not started, 1-10 = mastery level
}

/** Permanent mastery bonuses for a weapon at a given mastery level. */
export interface MasteryBonus {
  damageBonus: number; // additive multiplier (e.g. 0.02 = +2%)
  fireRateBonus: number; // cooldown reduction factor (e.g. 0.01 = -1% cooldown)
}

/** Full mastery state persisted in MetaState. */
export type MasteryRecord = Record<string, WeaponMasteryStats>; // weaponId → stats

// ── Milestone System (TASK-185) ──────────────────────────────────────────────

export type MilestoneCategory = 'runs' | 'kills' | 'stages';

export interface MilestoneDef {
  readonly id: string;
  readonly category: MilestoneCategory;
  readonly target: number;
  readonly prestigePoints: number;
  /** Optional cosmetic unlock flag ID granted at this milestone */
  readonly cosmeticUnlock?: string;
}

export interface MilestoneProgress {
  readonly milestoneId: string;
  readonly claimed: boolean;
}

// ── Daily Challenge System (TASK-187) ────────────────────────────────────────

export type ChallengeType =
  | 'kill_with_weapon'
  | 'survive_minutes'
  | 'defeat_boss_stage'
  | 'collect_xp_orbs'
  | 'no_shop_run'
  | 'reach_level'
  | 'deal_total_damage'
  | 'complete_with_character';

export type ChallengeDifficulty = 'easy' | 'medium' | 'hard';

export interface ChallengeDef {
  readonly id: string;
  readonly type: ChallengeType;
  readonly descKey: string;
  readonly params: Record<string, string | number>;
  readonly difficulty: ChallengeDifficulty;
  readonly prestigeReward: number;
}

export interface ChallengeProgress {
  readonly challengeId: string;
  current: number;
  readonly target: number;
  completed: boolean;
  claimed: boolean;
}

export interface DailyChallengeSave {
  dateStr: string; // UTC "YYYY-MM-DD"
  challenges: ChallengeDef[];
  progress: Record<string, ChallengeProgress>;
}

// === ECONOMY TYPES (TASK-186, 188, 189, 190) ===

/** Two-currency economy: runGold (per-run) + prestige (permanent). */
export interface CurrencyState {
  /** Gold earned during the current run. Resets to 0 on new run. Spent at in-run shop. */
  runGold: number;
  /** Permanent meta currency. Earned on run completion. Spent on meta upgrades. */
  prestige: number;
}

/** Inputs used to calculate prestige earned at run end. */
export interface PrestigeCalcInput {
  /** Which stage the player reached (1-based). */
  stageReached: number;
  /** Total kills this run. */
  kills: number;
}

/** Result of prestige calculation. */
export interface PrestigeCalcResult {
  /** Total prestige earned (floored integer). */
  prestige: number;
  stageMultiplier: number;
  performanceBonus: number;
}

/** Extended shop item action types supporting all 9 item categories. */
export type ShopItemAction =
  | 'heal'
  | 'damage'
  | 'armor'
  | 'shield'
  | 'speedBoost'
  | 'damageBoost'
  | 'fullHeal'
  | 'xpBoost'
  | 'magnetPulse';

/** Shop item definition with support for expanded item pool. */
export interface ExpandedShopItem {
  id: string;
  name: string;
  desc: string;
  /** Base cost before slot multiplier. */
  baseCost: number;
  action: ShopItemAction;
  /** Duration in ms for timed buffs. Undefined for instant effects. */
  durationMs?: number;
  /** Effect magnitude (e.g. multiplier value, hit count). */
  effectValue?: number;
}

/** A generated shop slot — item + final cost after slot tier multiplier. */
export interface ShopSlot {
  item: ExpandedShopItem;
  /** Final cost after slot tier pricing applied. */
  cost: number;
  /** Slot index 0-7. */
  slotIndex: number;
}

/** Active temporary buff applied to player. */
export interface ActiveBuff {
  action: ShopItemAction;
  /** ms timestamp when the buff expires. */
  expiresAt: number;
  effectValue: number;
}
