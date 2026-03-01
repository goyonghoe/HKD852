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
      sfxVolume: 1,
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
}
