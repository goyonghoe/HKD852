// ════════════════════════════════════════════════════════════════
// InventoryCalc — pure TypeScript, NO Phaser imports
// Immutable inventory state management for weapons & passives
// ════════════════════════════════════════════════════════════════

const MAX_LEVEL = 5;
const DEFAULT_MAX_WEAPONS = 6;
const DEFAULT_MAX_PASSIVES = 6;

// ── Types ────────────────────────────────────────────────────────

export interface WeaponSlotEntry {
  readonly weaponId: string;
  readonly level: number;
  readonly isEvolved: boolean;
}

export interface PassiveSlotEntry {
  readonly passiveId: string;
  readonly level: number;
}

export interface InventoryState {
  readonly weaponSlots: ReadonlyArray<WeaponSlotEntry | null>;
  readonly passiveSlots: ReadonlyArray<PassiveSlotEntry | null>;
  readonly maxWeapons: number;
  readonly maxPassives: number;
}

export interface InventoryResult {
  readonly state: InventoryState;
  readonly success: boolean;
  readonly reason: string;
}

// ── Factory ──────────────────────────────────────────────────────

export function createInventory(
  maxWeapons: number = DEFAULT_MAX_WEAPONS,
  maxPassives: number = DEFAULT_MAX_PASSIVES,
): InventoryState {
  return {
    weaponSlots: Array.from({ length: maxWeapons }, () => null),
    passiveSlots: Array.from({ length: maxPassives }, () => null),
    maxWeapons,
    maxPassives,
  };
}

// ── Queries ──────────────────────────────────────────────────────

export function hasWeapon(state: InventoryState, weaponId: string): boolean {
  return state.weaponSlots.some((s) => s !== null && s.weaponId === weaponId);
}

export function hasPassive(state: InventoryState, passiveId: string): boolean {
  return state.passiveSlots.some(
    (s) => s !== null && s.passiveId === passiveId,
  );
}

export function getWeapon(
  state: InventoryState,
  weaponId: string,
): WeaponSlotEntry | null {
  return (
    state.weaponSlots.find((s) => s !== null && s.weaponId === weaponId) ?? null
  );
}

export function getWeaponCount(state: InventoryState): number {
  return state.weaponSlots.filter((s) => s !== null).length;
}

export function getPassiveCount(state: InventoryState): number {
  return state.passiveSlots.filter((s) => s !== null).length;
}

export function canAddWeapon(state: InventoryState): boolean {
  return state.weaponSlots.some((s) => s === null);
}

export function canAddPassive(state: InventoryState): boolean {
  return state.passiveSlots.some((s) => s === null);
}

// ── Mutations (immutable — return new state) ─────────────────────

export function addWeapon(
  state: InventoryState,
  weaponId: string,
): InventoryResult {
  if (hasWeapon(state, weaponId)) {
    return { state, success: false, reason: "duplicate_weapon" };
  }

  const firstEmpty = state.weaponSlots.indexOf(null);
  if (firstEmpty === -1) {
    return { state, success: false, reason: "slots_full" };
  }

  const newSlots = [...state.weaponSlots];
  newSlots[firstEmpty] = { weaponId, level: 1, isEvolved: false };

  return {
    state: { ...state, weaponSlots: newSlots },
    success: true,
    reason: "ok",
  };
}

export function addPassive(
  state: InventoryState,
  passiveId: string,
): InventoryResult {
  if (hasPassive(state, passiveId)) {
    return { state, success: false, reason: "duplicate_passive" };
  }

  const firstEmpty = state.passiveSlots.indexOf(null);
  if (firstEmpty === -1) {
    return { state, success: false, reason: "slots_full" };
  }

  const newSlots = [...state.passiveSlots];
  newSlots[firstEmpty] = { passiveId, level: 1 };

  return {
    state: { ...state, passiveSlots: newSlots },
    success: true,
    reason: "ok",
  };
}

export function upgradeWeapon(
  state: InventoryState,
  weaponId: string,
): InventoryResult {
  const idx = state.weaponSlots.findIndex(
    (s) => s !== null && s.weaponId === weaponId,
  );
  if (idx === -1) {
    return { state, success: false, reason: "weapon_not_found" };
  }

  const slot = state.weaponSlots[idx]!;
  if (slot.level >= MAX_LEVEL) {
    return { state, success: false, reason: "max_level" };
  }

  const newSlots = [...state.weaponSlots];
  newSlots[idx] = { ...slot, level: slot.level + 1 };

  return {
    state: { ...state, weaponSlots: newSlots },
    success: true,
    reason: "ok",
  };
}

export function upgradePassive(
  state: InventoryState,
  passiveId: string,
): InventoryResult {
  const idx = state.passiveSlots.findIndex(
    (s) => s !== null && s.passiveId === passiveId,
  );
  if (idx === -1) {
    return { state, success: false, reason: "passive_not_found" };
  }

  const slot = state.passiveSlots[idx]!;
  if (slot.level >= MAX_LEVEL) {
    return { state, success: false, reason: "max_level" };
  }

  const newSlots = [...state.passiveSlots];
  newSlots[idx] = { ...slot, level: slot.level + 1 };

  return {
    state: { ...state, passiveSlots: newSlots },
    success: true,
    reason: "ok",
  };
}

export function evolveWeapon(
  state: InventoryState,
  weaponId: string,
): InventoryResult {
  const idx = state.weaponSlots.findIndex(
    (s) => s !== null && s.weaponId === weaponId,
  );
  if (idx === -1) {
    return { state, success: false, reason: "weapon_not_found" };
  }

  const slot = state.weaponSlots[idx]!;
  if (slot.isEvolved) {
    return { state, success: false, reason: "already_evolved" };
  }

  const newSlots = [...state.weaponSlots];
  newSlots[idx] = { ...slot, isEvolved: true };

  return {
    state: { ...state, weaponSlots: newSlots },
    success: true,
    reason: "ok",
  };
}

export function removeWeapon(
  state: InventoryState,
  weaponId: string,
): InventoryResult {
  const idx = state.weaponSlots.findIndex(
    (s) => s !== null && s.weaponId === weaponId,
  );
  if (idx === -1) {
    return { state, success: false, reason: "weapon_not_found" };
  }

  const newSlots = [...state.weaponSlots];
  newSlots[idx] = null;

  return {
    state: { ...state, weaponSlots: newSlots },
    success: true,
    reason: "ok",
  };
}

export function removePassive(
  state: InventoryState,
  passiveId: string,
): InventoryResult {
  const idx = state.passiveSlots.findIndex(
    (s) => s !== null && s.passiveId === passiveId,
  );
  if (idx === -1) {
    return { state, success: false, reason: "passive_not_found" };
  }

  const newSlots = [...state.passiveSlots];
  newSlots[idx] = null;

  return {
    state: { ...state, passiveSlots: newSlots },
    success: true,
    reason: "ok",
  };
}
