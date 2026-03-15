/**
 * Pure utility functions for enemy death logic.
 * No Phaser imports — all game engine calls remain in RunScene.
 * All balance numbers from src/config/balance.ts (M-002).
 */

import { BALANCE } from '../config/balance';

// ── Types ──────────────────────────────────────────────────────────

export type EnemyTier = 't1' | 't2' | 'elite' | 'boss';

export interface DeathRewardInput {
  defId: string;
  isElite: boolean;
  xpValue: number;
  metaXpBonus: number;
}

export interface DeathReward {
  gold: number;
  xp: number;
}

export interface SplitterSpawnInput {
  behavior: string;
  isSplitChild: boolean;
  parentMaxHp: number;
  parentX: number;
  parentY: number;
}

export interface SplitterChild {
  offsetX: number;
  hp: number;
  scale: number;
}

export interface LightspeedResult {
  active: boolean;
  durationMs: number;
  /** Attack speed multiplier while buff is active */
  newAtkSpeedMult: number;
}

// ── Functions ──────────────────────────────────────────────────────

/**
 * Determine enemy tier based on defId and elite flag.
 * Tier 2 enemies: tank, splitter, guardian (larger non-elite specials).
 */
export function getEnemyTier(defId: string, isElite: boolean): EnemyTier {
  const isBoss = defId.startsWith('boss');
  if (isBoss) return 'boss';
  if (isElite) return 'elite';
  if (defId === 'tank' || defId === 'splitter' || defId === 'guardian') return 't2';
  return 't1';
}

/**
 * Calculate gold + XP reward for killing an enemy.
 */
export function calculateDeathReward(input: DeathRewardInput): DeathReward {
  const { defId, isElite, xpValue, metaXpBonus } = input;
  const isBoss = defId.startsWith('boss');

  let gold = isElite ? BALANCE.ECONOMY.goldPerElite : BALANCE.ECONOMY.goldPerKill;
  if (isBoss) {
    gold += BALANCE.ECONOMY.goldPerBoss;
  }

  const xp = Math.ceil(xpValue * (1 + metaXpBonus));

  return { gold, xp };
}

/**
 * Get ultimate gauge charge amount for a given tier.
 */
export function getUltimateGaugeAmount(tier: EnemyTier): number {
  return (
    BALANCE.ULTIMATE.gaugePerKill[tier as keyof typeof BALANCE.ULTIMATE.gaugePerKill] ??
    BALANCE.ULTIMATE.gaugePerKill.t1
  );
}

/**
 * Determine screen shake intensity/duration for a killed enemy.
 */
export function getScreenShake(tier: EnemyTier): { intensity: number; durationMs: number } {
  const shake = BALANCE.JUICE.deathShake;
  if (tier === 'boss') return { ...shake.boss };
  if (tier === 'elite') return { ...shake.elite };
  return { ...shake.normal };
}

/**
 * Determine whether a dead enemy should spawn splitter children,
 * and return child spawn params if so.
 */
export function getSplitterChildren(input: SplitterSpawnInput): SplitterChild[] | null {
  if (input.behavior !== 'split_on_death' || input.isSplitChild) return null;

  const childHp = Math.ceil(input.parentMaxHp * BALANCE.SPLITTER.childHpFraction);
  return [
    { offsetX: -BALANCE.SPLITTER.childOffsetX, hp: childHp, scale: BALANCE.SPLITTER.childScale },
    { offsetX: BALANCE.SPLITTER.childOffsetX, hp: childHp, scale: BALANCE.SPLITTER.childScale },
  ];
}

/**
 * Calculate lightspeed passive effect on kill.
 * Returns null if passive not active (level 0).
 * Grants attack speed boost (was move speed, removed with side-view transition).
 */
export function calculateLightspeedBuff(lightspeedLevel: number): LightspeedResult | null {
  if (lightspeedLevel <= 0) return null;

  return {
    active: true,
    durationMs: BALANCE.PASSIVE.lightspeedDurationMs,
    newAtkSpeedMult: 1 + BALANCE.PASSIVE.lightspeedAtkSpdBonus * lightspeedLevel,
  };
}

/**
 * Check if a boss stage clear should be triggered.
 */
export function shouldTriggerStageClear(isBossStage: boolean, defId: string): boolean {
  return isBossStage && defId.startsWith('boss');
}

/**
 * Check if the run is complete (all stages finished).
 */
export function isRunComplete(currentStage: number): boolean {
  return currentStage >= BALANCE.STAGE.maxStages;
}
