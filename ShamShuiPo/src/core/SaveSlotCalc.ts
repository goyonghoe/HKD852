/**
 * SaveSlotCalc — Pure TypeScript save slot management.
 * NO Phaser imports. All functions are pure/immutable.
 */

// ── Types ──────────────────────────────────────────────

export interface SaveSlot {
  readonly slotId: number;
  readonly name: string;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly playtime: number;
  readonly level: number;
  readonly totalRuns: number;
  readonly bestScore: number;
  readonly data: string;
  readonly checksum: string;
  readonly version: number;
}

export interface SaveManagerState {
  readonly slots: ReadonlyArray<SaveSlot | null>;
  readonly maxSlots: number;
  readonly activeSlotId: number;
  readonly autoSaveEnabled: boolean;
}

export interface SaveResult {
  readonly state: SaveManagerState;
  readonly success: boolean;
  readonly reason?: string;
}

export interface LoadResult {
  readonly data: string | null;
  readonly success: boolean;
  readonly reason?: string;
}

export interface ImportResult {
  readonly state: SaveManagerState;
  readonly success: boolean;
  readonly reason?: string;
}

// Current save version
const CURRENT_VERSION = 1;

// ── Helpers ────────────────────────────────────────────

function isValidSlotId(state: SaveManagerState, slotId: number): boolean {
  return Number.isInteger(slotId) && slotId >= 0 && slotId < state.maxSlots;
}

function replaceSlot(
  slots: ReadonlyArray<SaveSlot | null>,
  slotId: number,
  value: SaveSlot | null,
): (SaveSlot | null)[] {
  const next = [...slots];
  next[slotId] = value;
  return next;
}

// ── Public API ─────────────────────────────────────────

/** Create a new save manager with `maxSlots` empty slots (default 3). */
export function createSaveManager(maxSlots: number = 3): SaveManagerState {
  const clamped = Math.max(1, Math.floor(maxSlots));
  return {
    slots: Array.from({ length: clamped }, () => null),
    maxSlots: clamped,
    activeSlotId: 0,
    autoSaveEnabled: true,
  };
}

/** Create a new save in the given slot. Fails if slot is occupied or invalid. */
export function createSave(
  state: SaveManagerState,
  slotId: number,
  name: string,
  data: string,
): SaveResult {
  if (!isValidSlotId(state, slotId)) {
    return { state, success: false, reason: "Invalid slot ID" };
  }
  if (state.slots[slotId] !== null) {
    return { state, success: false, reason: "Slot already occupied" };
  }
  const now = Date.now();
  const slot: SaveSlot = {
    slotId,
    name,
    createdAt: now,
    updatedAt: now,
    playtime: 0,
    level: 1,
    totalRuns: 0,
    bestScore: 0,
    data,
    checksum: calculateChecksum(data),
    version: CURRENT_VERSION,
  };
  return {
    state: { ...state, slots: replaceSlot(state.slots, slotId, slot) },
    success: true,
  };
}

/** Update an existing save. Fails if slot is empty or invalid. */
export function updateSave(
  state: SaveManagerState,
  slotId: number,
  data: string,
  playtime: number,
): SaveResult {
  if (!isValidSlotId(state, slotId)) {
    return { state, success: false, reason: "Invalid slot ID" };
  }
  const existing = state.slots[slotId];
  if (existing === null) {
    return { state, success: false, reason: "Slot is empty" };
  }
  const updated: SaveSlot = {
    ...existing,
    data,
    playtime,
    updatedAt: Date.now(),
    checksum: calculateChecksum(data),
  };
  return {
    state: { ...state, slots: replaceSlot(state.slots, slotId, updated) },
    success: true,
  };
}

/** Delete a save from a slot. Fails if slot is invalid. */
export function deleteSave(
  state: SaveManagerState,
  slotId: number,
): SaveResult {
  if (!isValidSlotId(state, slotId)) {
    return { state, success: false, reason: "Invalid slot ID" };
  }
  if (state.slots[slotId] === null) {
    return { state, success: false, reason: "Slot is already empty" };
  }
  return {
    state: { ...state, slots: replaceSlot(state.slots, slotId, null) },
    success: true,
  };
}

/** Load save data from a slot. */
export function loadSave(state: SaveManagerState, slotId: number): LoadResult {
  if (!isValidSlotId(state, slotId)) {
    return { data: null, success: false, reason: "Invalid slot ID" };
  }
  const slot = state.slots[slotId];
  if (slot === null) {
    return { data: null, success: false, reason: "Slot is empty" };
  }
  if (!validateSave(slot)) {
    return { data: null, success: false, reason: "Checksum mismatch" };
  }
  return { data: slot.data, success: true };
}

/** Get slot metadata (everything except `data`) or null. */
export function getSlotInfo(
  state: SaveManagerState,
  slotId: number,
): Omit<SaveSlot, "data"> | null {
  if (!isValidSlotId(state, slotId)) return null;
  const slot = state.slots[slotId];
  if (slot === null) return null;
  const { data: _data, ...info } = slot;
  return info;
}

/** Set the active slot. Fails if slotId is out of range. */
export function setActiveSlot(
  state: SaveManagerState,
  slotId: number,
): SaveResult {
  if (!isValidSlotId(state, slotId)) {
    return { state, success: false, reason: "Invalid slot ID" };
  }
  return {
    state: { ...state, activeSlotId: slotId },
    success: true,
  };
}

/** Check whether a slot is occupied. Returns false for invalid IDs. */
export function isSlotOccupied(
  state: SaveManagerState,
  slotId: number,
): boolean {
  if (!isValidSlotId(state, slotId)) return false;
  return state.slots[slotId] !== null;
}

/** Return all non-null slots. */
export function getOccupiedSlots(state: SaveManagerState): SaveSlot[] {
  return state.slots.filter((s): s is SaveSlot => s !== null);
}

/** Return the IDs of all empty slots. */
export function getEmptySlots(state: SaveManagerState): number[] {
  return state.slots.map((s, i) => (s === null ? i : -1)).filter((i) => i >= 0);
}

/** Serialize a SaveSlot to a base64-encoded JSON string. */
export function exportSave(slot: SaveSlot): string {
  const json = JSON.stringify(slot);
  return btoa(json);
}

/** Import a save from a base64-encoded string into the given slot. */
export function importSave(
  state: SaveManagerState,
  slotId: number,
  exportedData: string,
): ImportResult {
  if (!isValidSlotId(state, slotId)) {
    return { state, success: false, reason: "Invalid slot ID" };
  }
  if (state.slots[slotId] !== null) {
    return { state, success: false, reason: "Slot already occupied" };
  }

  let parsed: SaveSlot;
  try {
    const json = atob(exportedData);
    parsed = JSON.parse(json) as SaveSlot;
  } catch {
    return { state, success: false, reason: "Invalid export data" };
  }

  if (!validateSave(parsed)) {
    return { state, success: false, reason: "Checksum validation failed" };
  }

  const imported: SaveSlot = { ...parsed, slotId };
  return {
    state: { ...state, slots: replaceSlot(state.slots, slotId, imported) },
    success: true,
  };
}

/** Simple DJB2-style hash of a string, returned as hex. */
export function calculateChecksum(data: string): string {
  let hash = 5381;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) + hash + data.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

/** Validate that a slot's checksum matches its data. */
export function validateSave(slot: SaveSlot): boolean {
  if (
    !slot ||
    typeof slot.data !== "string" ||
    typeof slot.checksum !== "string"
  ) {
    return false;
  }
  return calculateChecksum(slot.data) === slot.checksum;
}

/** Return the slot with the most recent `updatedAt`, or null if all empty. */
export function getNewestSave(state: SaveManagerState): SaveSlot | null {
  let newest: SaveSlot | null = null;
  for (const slot of state.slots) {
    if (
      slot !== null &&
      (newest === null || slot.updatedAt > newest.updatedAt)
    ) {
      newest = slot;
    }
  }
  return newest;
}

/** Determine the auto-save target slot: the active slot if occupied, otherwise the oldest occupied slot, otherwise the first empty slot. */
export function autoSaveSlot(state: SaveManagerState): number {
  // Prefer active slot if it has data
  if (state.slots[state.activeSlotId] !== null) {
    return state.activeSlotId;
  }
  // Find oldest occupied slot
  let oldest: SaveSlot | null = null;
  for (const slot of state.slots) {
    if (
      slot !== null &&
      (oldest === null || slot.updatedAt < oldest.updatedAt)
    ) {
      oldest = slot;
    }
  }
  if (oldest !== null) return oldest.slotId;
  // All empty — use first slot
  return 0;
}

/** Migration stub: returns a copy with the target version number. Real migration logic would transform data here. */
export function migrateSave(slot: SaveSlot, targetVersion: number): SaveSlot {
  if (slot.version >= targetVersion) return slot;
  return {
    ...slot,
    version: targetVersion,
    updatedAt: Date.now(),
  };
}
