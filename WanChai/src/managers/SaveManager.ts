import type { MetaState, RunState, MasteryRecord } from '../types/game';
import { BALANCE } from '../config/balance';
import { CHARACTERS } from '../config/characters';
import { clampVolume, addDiscovery, mergeSettings } from '../utils/SettingsCalc';

const SAVE_KEY = 'neonsurvivor_save';
const RUN_SAVE_KEY = 'neonsurvivor_run';
const SAVE_VERSION = 1;

interface SaveData {
  version: number;
  lastSaved: string;
  meta: MetaState;
  settings: {
    bgmVolume: number;
    bgmMuted: boolean;
    sfxVolume: number;
    sfxMuted: boolean;
    vibration: boolean;
  };
  tutorialCompleted: boolean;
}

function getDefaultMeta(): MetaState {
  return {
    totalGold: 0,
    totalGoldEarned: 0,
    highScore: 0,
    bestKills: 0,
    bestLevel: 0,
    bestTimeMs: 0,
    upgrades: {},
    runsCompleted: 0,
    discovered: { weapons: ['energy_shot'], enemies: [] },
  };
}

function getDefaultSave(): SaveData {
  return {
    version: SAVE_VERSION,
    lastSaved: new Date().toISOString(),
    meta: getDefaultMeta(),
    settings: {
      bgmVolume: 0.12,
      bgmMuted: false,
      sfxVolume: 0.8,
      sfxMuted: false,
      vibration: true,
    },
    tutorialCompleted: false,
  };
}

/** Runtime type guard for SaveData parsed from JSON. */
function isValidSaveData(v: unknown): v is SaveData {
  if (typeof v !== 'object' || v === null) return false;
  const obj = v as Record<string, unknown>;
  return (
    typeof obj.version === 'number' &&
    typeof obj.lastSaved === 'string' &&
    typeof obj.meta === 'object' &&
    obj.meta !== null &&
    typeof obj.settings === 'object' &&
    obj.settings !== null
  );
}

/** Runtime type guard for RunState parsed from JSON. */
function isValidRunState(v: unknown): v is RunState {
  if (typeof v !== 'object' || v === null) return false;
  const obj = v as Record<string, unknown>;
  return (
    typeof obj.characterId === 'string' &&
    typeof obj.seed === 'number' &&
    typeof obj.stage === 'number' &&
    typeof obj.playerLevel === 'number' &&
    typeof obj.kills === 'number' &&
    Array.isArray(obj.weapons)
  );
}

export class SaveManager {
  static load(): SaveData {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return getDefaultSave();
      const parsed: unknown = JSON.parse(raw);
      if (!isValidSaveData(parsed)) return getDefaultSave();
      // Validate & clamp loaded settings against defaults
      const defaults = getDefaultSave();
      parsed.settings = mergeSettings(parsed.settings, defaults.settings);
      return parsed;
    } catch {
      return getDefaultSave();
    }
  }

  static save(data: SaveData): void {
    data.version = SAVE_VERSION;
    data.lastSaved = new Date().toISOString();
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  }

  static loadMeta(): MetaState {
    return SaveManager.load().meta;
  }

  static saveMeta(meta: MetaState): void {
    const data = SaveManager.load();
    data.meta = meta;
    SaveManager.save(data);
  }

  static getBgmSettings(): { volume: number; muted: boolean } {
    const data = SaveManager.load();
    return {
      volume: data.settings.bgmVolume ?? 0.12,
      muted: data.settings.bgmMuted ?? false,
    };
  }

  static setBgmVolume(volume: number): void {
    const data = SaveManager.load();
    data.settings.bgmVolume = clampVolume(volume);
    SaveManager.save(data);
  }

  static setBgmMuted(muted: boolean): void {
    const data = SaveManager.load();
    data.settings.bgmMuted = muted;
    SaveManager.save(data);
  }

  // ── SFX settings ───────────────────────────────────────────────────

  static getSfxSettings(): { volume: number; muted: boolean } {
    const data = SaveManager.load();
    return {
      volume: data.settings.sfxVolume ?? 0.8,
      muted: data.settings.sfxMuted ?? false,
    };
  }

  static setSfxVolume(volume: number): void {
    const data = SaveManager.load();
    data.settings.sfxVolume = clampVolume(volume);
    SaveManager.save(data);
  }

  static setSfxMuted(muted: boolean): void {
    const data = SaveManager.load();
    data.settings.sfxMuted = muted;
    SaveManager.save(data);
  }

  // ── Vibration settings ────────────────────────────────────────────────

  static getVibration(): boolean {
    const data = SaveManager.load();
    return data.settings.vibration ?? true;
  }

  static setVibration(enabled: boolean): void {
    const data = SaveManager.load();
    data.settings.vibration = enabled;
    SaveManager.save(data);
  }

  // ── Discovery tracking ──────────────────────────────────────────────

  static discoverWeapon(weaponId: string): void {
    const data = SaveManager.load();
    const disc = data.meta.discovered ?? { weapons: ['energy_shot'], enemies: [] };
    const updated = addDiscovery(disc.weapons, weaponId);
    if (updated.length !== disc.weapons.length) {
      disc.weapons = updated;
      data.meta.discovered = disc;
      SaveManager.save(data);
    }
  }

  static discoverEnemy(enemyId: string): void {
    const data = SaveManager.load();
    const disc = data.meta.discovered ?? { weapons: ['energy_shot'], enemies: [] };
    const updated = addDiscovery(disc.enemies, enemyId);
    if (updated.length !== disc.enemies.length) {
      disc.enemies = updated;
      data.meta.discovered = disc;
      SaveManager.save(data);
    }
  }

  static getDiscovered(): { weapons: string[]; enemies: string[] } {
    const data = SaveManager.load();
    return data.meta.discovered ?? { weapons: ['energy_shot'], enemies: [] };
  }

  // ── Mid-run persistence ──────────────────────────────────────────────────

  static saveRun(state: RunState): void {
    try {
      localStorage.setItem(RUN_SAVE_KEY, JSON.stringify(state));
    } catch {
      /* silent fail */
    }
  }

  static loadRun(): RunState | null {
    try {
      const raw = localStorage.getItem(RUN_SAVE_KEY);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      if (!isValidRunState(parsed)) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  static clearRun(): void {
    localStorage.removeItem(RUN_SAVE_KEY);
  }

  static hasActiveRun(): boolean {
    return localStorage.getItem(RUN_SAVE_KEY) !== null;
  }

  /** Check if a character is unlocked based on meta progression. */
  static isCharacterUnlocked(charId: string): boolean {
    const charDef = CHARACTERS[charId];
    if (!charDef) return false;
    if (!charDef.unlockCondition) return true; // no condition = always unlocked
    const meta = SaveManager.loadMeta();
    const { type, value } = charDef.unlockCondition;
    switch (type) {
      case 'runsCompleted':
        return meta.runsCompleted >= value;
      case 'totalGold':
        return (meta.totalGoldEarned ?? 0) >= value;
      case 'bestKills':
        return meta.bestKills >= value;
      default:
        return false;
    }
  }

  // ── Daily login rewards ───────────────────────────────────────────────

  /** Get today's date as "YYYY-MM-DD" in local time. */
  private static getLocalDateStr(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  /**
   * Check if a daily reward is available.
   * Returns reward info if unclaimed today, null if already claimed.
   */
  static checkDailyReward(): { gold: number; streak: number; isNew: boolean } | null {
    const meta = SaveManager.loadMeta();
    const today = SaveManager.getLocalDateStr();

    if (meta.lastLoginDate === today) return null; // already claimed today

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    let streak: number;
    if (meta.lastLoginDate === yStr && (meta.dailyStreak ?? 0) > 0) {
      // Consecutive day — advance streak (wraps after maxStreak)
      streak = ((meta.dailyStreak ?? 0) % BALANCE.DAILY_REWARDS.maxStreak) + 1;
    } else {
      // First login or missed a day — reset to day 1
      streak = 1;
    }

    const gold = BALANCE.DAILY_REWARDS.streakGold[streak - 1] ?? BALANCE.DAILY_REWARDS.streakGold[0];
    return { gold, streak, isNew: (meta.dailyStreak ?? 0) === 0 };
  }

  /**
   * Claim the daily reward. Saves updated streak and adds gold.
   * Returns the reward details.
   */
  static claimDailyReward(): { gold: number; streak: number } {
    const reward = SaveManager.checkDailyReward();
    if (!reward) return { gold: 0, streak: 0 };

    const meta = SaveManager.loadMeta();
    meta.lastLoginDate = SaveManager.getLocalDateStr();
    meta.dailyStreak = reward.streak;
    meta.totalGold += reward.gold;
    meta.totalGoldEarned = (meta.totalGoldEarned ?? 0) + reward.gold;
    SaveManager.saveMeta(meta);
    return { gold: reward.gold, streak: reward.streak };
  }

  /** Reset ALL saved data — meta progression, records, discovery, settings, run save. */
  static resetAll(): void {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(RUN_SAVE_KEY);
  }

  // ── Tutorial tracking ──────────────────────────────────────────────────

  static isTutorialCompleted(): boolean {
    const data = SaveManager.load();
    return data.tutorialCompleted ?? false;
  }

  static setTutorialCompleted(): void {
    const data = SaveManager.load();
    data.tutorialCompleted = true;
    SaveManager.save(data);
  }

  /** Returns true if player has any meta progression (upgrades, gold, records, etc.) */
  static hasProgression(): boolean {
    const meta = SaveManager.loadMeta();
    return meta.totalGold > 0 || meta.runsCompleted > 0 || meta.bestKills > 0 || Object.keys(meta.upgrades).length > 0;
  }

  // ── Mastery persistence (TASK-184) ──────────────────────────────────────

  /** Load the mastery record from persistent storage. Returns empty record if absent. */
  static loadMasteryRecord(): MasteryRecord {
    const meta = SaveManager.loadMeta();
    return meta.masteryRecord ?? {};
  }

  /** Save updated mastery record into MetaState. */
  static saveMasteryRecord(record: MasteryRecord): void {
    const meta = SaveManager.loadMeta();
    meta.masteryRecord = record;
    SaveManager.saveMeta(meta);
  }
}
