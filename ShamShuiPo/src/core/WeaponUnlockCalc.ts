/**
 * WeaponUnlockCalc — Pure weapon unlock progression system.
 * No Phaser imports. All functions are pure and return new state (immutable).
 */

// ── Types ──────────────────────────────────────────────────────────

export type UnlockConditionType =
  | "kills"
  | "runs"
  | "score"
  | "level"
  | "boss_kills"
  | "prestige"
  | "achievement";

export interface UnlockCondition {
  readonly type: UnlockConditionType;
  readonly target: number;
}

export interface WeaponUnlockConfig {
  readonly weaponId: string;
  readonly name: string;
  readonly isStarterWeapon: boolean;
  readonly conditions: readonly UnlockCondition[];
  readonly description: string;
}

export interface UnlockProgressCondition {
  readonly type: UnlockConditionType;
  readonly target: number;
  readonly current: number;
}

export interface UnlockProgress {
  readonly weaponId: string;
  readonly conditions: readonly UnlockProgressCondition[];
  readonly isUnlocked: boolean;
  /** 0..1, ratio of fulfilled conditions weighted by per-condition progress */
  readonly progress: number;
}

export interface WeaponUnlockState {
  readonly unlockedWeapons: Set<string>;
  /** weaponId -> conditionType -> current value */
  readonly progress: Record<string, Record<string, number>>;
}

export interface SerializedWeaponUnlockState {
  readonly unlockedWeapons: string[];
  readonly progress: Record<string, Record<string, number>>;
}

// ── Weapon Configs ─────────────────────────────────────────────────

const WEAPON_CONFIGS: readonly WeaponUnlockConfig[] = [
  {
    weaponId: "pistol",
    name: "Pistol",
    isStarterWeapon: true,
    conditions: [],
    description: "Standard-issue sidearm. Always available.",
  },
  {
    weaponId: "smg",
    name: "SMG",
    isStarterWeapon: false,
    conditions: [{ type: "kills", target: 50 }],
    description: "Rapid-fire submachine gun.",
  },
  {
    weaponId: "shotgun",
    name: "Shotgun",
    isStarterWeapon: false,
    conditions: [{ type: "level", target: 5 }],
    description: "Close-range spread weapon.",
  },
  {
    weaponId: "sniper",
    name: "Sniper",
    isStarterWeapon: false,
    conditions: [{ type: "score", target: 10_000 }],
    description: "High-damage precision rifle.",
  },
  {
    weaponId: "laser",
    name: "Laser",
    isStarterWeapon: false,
    conditions: [{ type: "boss_kills", target: 3 }],
    description: "Continuous beam weapon.",
  },
  {
    weaponId: "grenade",
    name: "Grenade Launcher",
    isStarterWeapon: false,
    conditions: [{ type: "runs", target: 10 }],
    description: "Area-of-effect explosive launcher.",
  },
  {
    weaponId: "flame_thrower",
    name: "Flame Thrower",
    isStarterWeapon: false,
    conditions: [{ type: "prestige", target: 1 }],
    description: "Short-range fire stream.",
  },
  {
    weaponId: "drone",
    name: "Drone",
    isStarterWeapon: false,
    conditions: [{ type: "achievement", target: 1 }],
    description:
      "Autonomous combat drone. Unlocked via combo_king achievement.",
  },
] as const;

const WEAPON_CONFIG_MAP = new Map<string, WeaponUnlockConfig>(
  WEAPON_CONFIGS.map((c) => [c.weaponId, c]),
);

// Achievement string → numeric mapping for the achievement condition.
// "combo_king" maps to target 1 in the achievement condition.
const ACHIEVEMENT_MAP: Record<string, number> = {
  combo_king: 1,
};

// ── Hint texts ─────────────────────────────────────────────────────

const HINT_MAP: Record<string, string> = {
  pistol: "Starter weapon — always unlocked.",
  smg: "Kill 50 enemies total to unlock.",
  shotgun: "Reach level 5 in any run to unlock.",
  sniper: "Score 10,000 or more to unlock.",
  laser: "Kill 3 bosses total to unlock.",
  grenade: "Complete 10 runs to unlock.",
  flame_thrower: "Reach prestige rank 1 to unlock.",
  drone: 'Unlock the "combo_king" achievement to unlock.',
};

// ── Factory ────────────────────────────────────────────────────────

/** Create initial state with pistol unlocked by default. */
export function createWeaponUnlockState(): WeaponUnlockState {
  const progress: Record<string, Record<string, number>> = {};
  for (const config of WEAPON_CONFIGS) {
    if (!config.isStarterWeapon) {
      const condMap: Record<string, number> = {};
      for (const c of config.conditions) {
        condMap[c.type] = 0;
      }
      progress[config.weaponId] = condMap;
    }
  }
  return {
    unlockedWeapons: new Set(["pistol"]),
    progress,
  };
}

/** Return all weapon unlock configs (frozen copy). */
export function getWeaponConfigs(): readonly WeaponUnlockConfig[] {
  return WEAPON_CONFIGS;
}

// ── Progress Updates ───────────────────────────────────────────────

/**
 * Update progress for a given condition type.
 * `value` is the new absolute value (not delta).
 * Returns a new state (immutable).
 */
export function updateProgress(
  state: WeaponUnlockState,
  conditionType: UnlockConditionType,
  value: number,
): WeaponUnlockState {
  const newProgress: Record<string, Record<string, number>> = {};
  let changed = false;

  for (const [weaponId, condMap] of Object.entries(state.progress)) {
    if (conditionType in condMap) {
      const prev = condMap[conditionType];
      if (prev !== value) {
        newProgress[weaponId] = { ...condMap, [conditionType]: value };
        changed = true;
      } else {
        newProgress[weaponId] = condMap;
      }
    } else {
      newProgress[weaponId] = condMap;
    }
  }

  if (!changed) return state;

  return {
    unlockedWeapons: state.unlockedWeapons,
    progress: newProgress,
  };
}

/**
 * Check all weapons and unlock any whose conditions are fully met.
 * Returns the new state and list of newly unlocked weapon IDs.
 */
export function checkUnlocks(state: WeaponUnlockState): {
  state: WeaponUnlockState;
  newUnlocks: string[];
} {
  const newUnlocks: string[] = [];
  let newUnlockedSet: Set<string> | null = null;

  for (const config of WEAPON_CONFIGS) {
    if (config.isStarterWeapon) continue;
    if (state.unlockedWeapons.has(config.weaponId)) continue;

    const condMap = state.progress[config.weaponId];
    if (!condMap) continue;

    const allMet = config.conditions.every((c) => {
      const current = condMap[c.type] ?? 0;
      return current >= c.target;
    });

    if (allMet) {
      if (!newUnlockedSet) {
        newUnlockedSet = new Set(state.unlockedWeapons);
      }
      newUnlockedSet.add(config.weaponId);
      newUnlocks.push(config.weaponId);
    }
  }

  if (newUnlocks.length === 0) {
    return { state, newUnlocks: [] };
  }

  return {
    state: {
      unlockedWeapons: newUnlockedSet!,
      progress: state.progress,
    },
    newUnlocks,
  };
}

// ── Queries ────────────────────────────────────────────────────────

/** Check if a specific weapon is unlocked. */
export function isWeaponUnlocked(
  state: WeaponUnlockState,
  weaponId: string,
): boolean {
  return state.unlockedWeapons.has(weaponId);
}

/** Get list of unlocked weapon IDs. */
export function getUnlockedWeapons(state: WeaponUnlockState): string[] {
  return Array.from(state.unlockedWeapons);
}

/** Get list of locked weapon IDs. */
export function getLockedWeapons(state: WeaponUnlockState): string[] {
  return WEAPON_CONFIGS.filter(
    (c) => !state.unlockedWeapons.has(c.weaponId),
  ).map((c) => c.weaponId);
}

/** Get detailed progress for a specific weapon. */
export function getWeaponProgress(
  state: WeaponUnlockState,
  weaponId: string,
): UnlockProgress {
  const config = WEAPON_CONFIG_MAP.get(weaponId);
  if (!config) {
    return {
      weaponId,
      conditions: [],
      isUnlocked: false,
      progress: 0,
    };
  }

  const isUnlocked = state.unlockedWeapons.has(weaponId);

  if (config.isStarterWeapon) {
    return {
      weaponId,
      conditions: [],
      isUnlocked: true,
      progress: 1,
    };
  }

  const condMap = state.progress[weaponId] ?? {};
  const conditions: UnlockProgressCondition[] = config.conditions.map((c) => ({
    type: c.type,
    target: c.target,
    current: Math.min(condMap[c.type] ?? 0, c.target),
  }));

  let progress: number;
  if (isUnlocked || config.conditions.length === 0) {
    progress = 1;
  } else {
    const total = config.conditions.reduce((sum, c) => {
      const current = Math.min(condMap[c.type] ?? 0, c.target);
      return sum + current / c.target;
    }, 0);
    progress = total / config.conditions.length;
  }

  return { weaponId, conditions, isUnlocked, progress };
}

/** Get progress for all weapons. */
export function getAllProgress(state: WeaponUnlockState): UnlockProgress[] {
  return WEAPON_CONFIGS.map((c) => getWeaponProgress(state, c.weaponId));
}

/** Get the locked weapon closest to being unlocked (highest progress < 1). */
export function getNextUnlock(state: WeaponUnlockState): UnlockProgress | null {
  let best: UnlockProgress | null = null;
  let bestProgress = -1;

  for (const config of WEAPON_CONFIGS) {
    if (config.isStarterWeapon) continue;
    if (state.unlockedWeapons.has(config.weaponId)) continue;

    const wp = getWeaponProgress(state, config.weaponId);
    if (wp.progress > bestProgress) {
      bestProgress = wp.progress;
      best = wp;
    }
  }

  return best;
}

/** Get the fraction of total weapons unlocked (0..1). */
export function getUnlockPercent(state: WeaponUnlockState): number {
  return state.unlockedWeapons.size / WEAPON_CONFIGS.length;
}

/** Get a human-readable hint for how to unlock a weapon. */
export function getHintForWeapon(weaponId: string): string {
  return HINT_MAP[weaponId] ?? `Unknown weapon: ${weaponId}`;
}

// ── Debug / Cheat ──────────────────────────────────────────────────

/** Force-unlock a weapon, bypassing conditions. Returns new state. */
export function forceUnlock(
  state: WeaponUnlockState,
  weaponId: string,
): WeaponUnlockState {
  if (state.unlockedWeapons.has(weaponId)) return state;

  const config = WEAPON_CONFIG_MAP.get(weaponId);
  if (!config) return state;

  const newSet = new Set(state.unlockedWeapons);
  newSet.add(weaponId);

  return {
    unlockedWeapons: newSet,
    progress: state.progress,
  };
}

// ── Persistence ────────────────────────────────────────────────────

/** Serialize state to a plain JSON-safe object. */
export function serialize(
  state: WeaponUnlockState,
): SerializedWeaponUnlockState {
  return {
    unlockedWeapons: Array.from(state.unlockedWeapons),
    progress: state.progress,
  };
}

/** Deserialize from a plain JSON object back to WeaponUnlockState. */
export function deserialize(
  json: SerializedWeaponUnlockState,
): WeaponUnlockState {
  return {
    unlockedWeapons: new Set(json.unlockedWeapons),
    progress: json.progress,
  };
}

/** Resolve an achievement name to its numeric value for the achievement condition. */
export function getAchievementValue(achievementName: string): number {
  return ACHIEVEMENT_MAP[achievementName] ?? 0;
}
