/**
 * Challenge Mode — Weekly seeded run with fixed parameters.
 * Pure TypeScript, no Phaser imports.
 */
import { BALANCE } from '../config/balance';

export interface ChallengeConfig {
  seed: number;
  characterId: string;
  startWeapon: string;
  modifier: string;
  weekLabel: string; // e.g. "2026-W10"
}

export interface ChallengeScore {
  kills: number;
  gold: number;
  timeMs: number;
  level: number;
  survived: boolean;
  timestamp: number; // Date.now() at submission
}

const CHALLENGE_LEADERBOARD_KEY = 'neonsurvivor_challenge_lb';

const CHARACTER_IDS = ['hai', 'nova', 'sol', 'mei', 'kai'];

const T1_WEAPON_IDS = [
  'energy_shot',
  'napalm',
  'laser_beam',
  'shuriken',
  'shotgun',
  'lightning',
  'missile',
  'bomb',
  'railgun',
  'rapid_fire',
];

/**
 * Get the ISO week number for a given date.
 */
export function getISOWeek(date: Date): { year: number; week: number } {
  // Copy date to avoid mutation
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // Set to nearest Thursday: current date + 4 - current day number (Mon=1, Sun=7)
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: d.getUTCFullYear(), week };
}

/**
 * Get the challenge configuration for the current week.
 * Deterministic: same week always returns the same config.
 */
export function getWeeklyChallenge(now?: Date): ChallengeConfig {
  const date = now ?? new Date();
  const { year, week } = getISOWeek(date);
  const seed = year * 100 + week;

  const characterId = CHARACTER_IDS[seed % CHARACTER_IDS.length];
  const startWeapon = T1_WEAPON_IDS[seed % T1_WEAPON_IDS.length];
  const modifiers = BALANCE.CHALLENGE.modifiers;
  const modifier = modifiers[seed % modifiers.length];
  const weekLabel = `${year}-W${String(week).padStart(2, '0')}`;

  return { seed, characterId, startWeapon, modifier, weekLabel };
}

/**
 * Describes the runtime effect of a challenge modifier.
 * Pure data — no Phaser dependency.
 */
export interface ModifierEffect {
  modifier: string;
  spawnFilter: 'eliteOnly' | 'bossRush' | 'none';
  hpMultiplier: number; // applied to base HP (1 = normal)
  speedMultiplier: number; // applied to stage speed multiplier
  shopDisabled: boolean; // if true, mid-run shop is skipped
}

/**
 * Get the runtime config for a given challenge modifier.
 * Deterministic, pure function — no side effects.
 */
export function getChallengeModifierConfig(modifier: string): ModifierEffect {
  switch (modifier) {
    case 'doubleSpeed':
      return { modifier, spawnFilter: 'none', hpMultiplier: 1, speedMultiplier: 2, shopDisabled: false };
    case 'halfHp':
      return { modifier, spawnFilter: 'none', hpMultiplier: 0.5, speedMultiplier: 1, shopDisabled: false };
    case 'eliteOnly':
      return { modifier, spawnFilter: 'eliteOnly', hpMultiplier: 1, speedMultiplier: 1, shopDisabled: false };
    case 'bossRush':
      return { modifier, spawnFilter: 'bossRush', hpMultiplier: 1, speedMultiplier: 1, shopDisabled: false };
    case 'noShop':
      return { modifier, spawnFilter: 'none', hpMultiplier: 1, speedMultiplier: 1, shopDisabled: true };
    default:
      return { modifier, spawnFilter: 'none', hpMultiplier: 1, speedMultiplier: 1, shopDisabled: false };
  }
}

function isChallengeScoreArray(v: unknown): v is ChallengeScore[] {
  if (!Array.isArray(v)) return false;
  if (v.length === 0) return true;
  const first = v[0] as Record<string, unknown>;
  return typeof first.kills === 'number' && typeof first.timestamp === 'number';
}

/**
 * Get the local challenge leaderboard (top N scores sorted by kills descending).
 */
export function getChallengeLeaderboard(storage?: Storage): ChallengeScore[] {
  const store = storage ?? (typeof localStorage !== 'undefined' ? localStorage : undefined);
  if (!store) return [];

  try {
    const raw = store.getItem(CHALLENGE_LEADERBOARD_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!isChallengeScoreArray(parsed)) return [];
    return parsed.sort((a, b) => b.kills - a.kills).slice(0, BALANCE.CHALLENGE.leaderboardMaxEntries);
  } catch {
    return [];
  }
}

/**
 * Submit a score to the local challenge leaderboard.
 * Keeps only top N entries sorted by kills descending.
 */
export function submitChallengeScore(score: Omit<ChallengeScore, 'timestamp'>, storage?: Storage): ChallengeScore[] {
  const store = storage ?? (typeof localStorage !== 'undefined' ? localStorage : undefined);
  if (!store) return [];

  const entry: ChallengeScore = { ...score, timestamp: Date.now() };
  const existing = getChallengeLeaderboard(store);
  existing.push(entry);
  existing.sort((a, b) => b.kills - a.kills);
  const trimmed = existing.slice(0, BALANCE.CHALLENGE.leaderboardMaxEntries);

  try {
    store.setItem(CHALLENGE_LEADERBOARD_KEY, JSON.stringify(trimmed));
  } catch {
    // silent fail — quota exceeded etc.
  }

  return trimmed;
}
