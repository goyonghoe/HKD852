import type { MetaState, RunState } from '../types/game';

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
  };
}

function getDefaultMeta(): MetaState {
  return {
    totalGold: 0,
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
      bgmMuted: true,
      sfxVolume: 0.8,
      sfxMuted: false,
    },
  };
}

export class SaveManager {
  static load(): SaveData {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return getDefaultSave();
      return JSON.parse(raw) as SaveData;
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
      muted: data.settings.bgmMuted ?? true,
    };
  }

  static setBgmVolume(volume: number): void {
    const data = SaveManager.load();
    data.settings.bgmVolume = Math.max(0, Math.min(1, volume));
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
    data.settings.sfxVolume = Math.max(0, Math.min(1, volume));
    SaveManager.save(data);
  }

  static setSfxMuted(muted: boolean): void {
    const data = SaveManager.load();
    data.settings.sfxMuted = muted;
    SaveManager.save(data);
  }

  // ── Discovery tracking ──────────────────────────────────────────────

  static discoverWeapon(weaponId: string): void {
    const data = SaveManager.load();
    const disc = data.meta.discovered ?? { weapons: ['energy_shot'], enemies: [] };
    if (!disc.weapons.includes(weaponId)) {
      disc.weapons.push(weaponId);
      data.meta.discovered = disc;
      SaveManager.save(data);
    }
  }

  static discoverEnemy(enemyId: string): void {
    const data = SaveManager.load();
    const disc = data.meta.discovered ?? { weapons: ['energy_shot'], enemies: [] };
    if (!disc.enemies.includes(enemyId)) {
      disc.enemies.push(enemyId);
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
    } catch { /* silent fail */ }
  }

  static loadRun(): RunState | null {
    try {
      const raw = localStorage.getItem(RUN_SAVE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as RunState;
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

  /** Reset ALL saved data — meta progression, records, discovery, settings, run save. */
  static resetAll(): void {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(RUN_SAVE_KEY);
  }

  /** Returns true if player has any meta progression (upgrades, gold, records, etc.) */
  static hasProgression(): boolean {
    const meta = SaveManager.loadMeta();
    return (
      meta.totalGold > 0 ||
      meta.runsCompleted > 0 ||
      meta.bestKills > 0 ||
      Object.keys(meta.upgrades).length > 0
    );
  }
}
