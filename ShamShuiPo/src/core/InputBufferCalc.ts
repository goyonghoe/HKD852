/**
 * InputBufferCalc — Pure TypeScript input buffer system.
 *
 * FIFO buffer that stores player inputs for a configurable window of time.
 * Oldest unconsumed input is consumed first. Expired inputs are auto-pruned.
 * All state is immutable — every mutation returns a new state object.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Every action that can be buffered. */
export type InputAction =
  | "move_up"
  | "move_down"
  | "move_left"
  | "move_right"
  | "dodge"
  | "ability_1"
  | "ability_2"
  | "ability_3"
  | "pause";

/** A single buffered input entry. */
export interface BufferedInput {
  readonly action: InputAction;
  readonly timestamp: number;
  readonly consumed: boolean;
}

/** The complete input-buffer state — treated as immutable. */
export interface InputBufferState {
  readonly buffer: readonly BufferedInput[];
  readonly maxBufferSize: number;
  readonly bufferWindowMs: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Mark a single `BufferedInput` as consumed, returning a new object.
 */
function markConsumed(input: BufferedInput): BufferedInput {
  return { ...input, consumed: true };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create a fresh `InputBufferState`.
 *
 * @param maxSize       Maximum number of inputs held in the buffer (min 1).
 * @param windowMs      How long (ms) an input stays valid before expiry (min 0).
 */
export function createInputBuffer(
  maxSize: number,
  windowMs: number,
): InputBufferState {
  return {
    buffer: [],
    maxBufferSize: Math.max(1, Math.floor(maxSize)),
    bufferWindowMs: Math.max(0, windowMs),
  };
}

/**
 * Add a new input to the buffer.
 *
 * If the buffer is already at `maxBufferSize`, the oldest entry (consumed or
 * not) is evicted to make room.
 *
 * @returns A new `InputBufferState` with the input appended.
 */
export function bufferInput(
  state: InputBufferState,
  action: InputAction,
  timestamp: number,
): InputBufferState {
  const entry: BufferedInput = { action, timestamp, consumed: false };

  let next = [...state.buffer];

  // Evict oldest entries if at capacity.
  while (next.length >= state.maxBufferSize) {
    next.shift();
  }

  next.push(entry);

  return { ...state, buffer: next };
}

/**
 * Consume the oldest unconsumed input that matches `action`.
 *
 * @returns An object with the updated state and the consumed input (or `null`
 *          if no matching unconsumed input was found).
 */
export function consumeInput(
  state: InputBufferState,
  action: InputAction,
): { state: InputBufferState; input: BufferedInput | null } {
  const idx = state.buffer.findIndex((i) => i.action === action && !i.consumed);

  if (idx === -1) {
    return { state, input: null };
  }

  const found = state.buffer[idx];
  const consumed = markConsumed(found);
  const newBuffer = [
    ...state.buffer.slice(0, idx),
    consumed,
    ...state.buffer.slice(idx + 1),
  ];

  return {
    state: { ...state, buffer: newBuffer },
    input: consumed,
  };
}

/**
 * Peek at the oldest unconsumed input without consuming it.
 *
 * @returns The oldest unconsumed `BufferedInput`, or `null` if none exist.
 */
export function peekNextInput(state: InputBufferState): BufferedInput | null {
  return state.buffer.find((i) => !i.consumed) ?? null;
}

/**
 * Clear every entry from the buffer.
 *
 * @returns A new state with an empty buffer.
 */
export function clearBuffer(state: InputBufferState): InputBufferState {
  return { ...state, buffer: [] };
}

/**
 * Return an array of all unconsumed actions currently in the buffer
 * (preserving insertion order).
 */
export function getBufferedActions(
  state: InputBufferState,
): readonly InputAction[] {
  return state.buffer.filter((i) => !i.consumed).map((i) => i.action);
}

/**
 * Check whether a specific action has at least one unconsumed entry in the
 * buffer.
 */
export function isInputBuffered(
  state: InputBufferState,
  action: InputAction,
): boolean {
  return state.buffer.some((i) => i.action === action && !i.consumed);
}

/**
 * Remove all entries whose timestamp is older than
 * `currentTime - bufferWindowMs`, as well as all entries that have already
 * been consumed.
 *
 * @returns A new state with expired / consumed entries removed.
 */
export function pruneExpired(
  state: InputBufferState,
  currentTime: number,
): InputBufferState {
  const cutoff = currentTime - state.bufferWindowMs;

  const kept = state.buffer.filter((i) => !i.consumed && i.timestamp >= cutoff);

  return { ...state, buffer: kept };
}

/**
 * Return the number of entries currently in the buffer (consumed + unconsumed).
 */
export function getBufferSize(state: InputBufferState): number {
  return state.buffer.length;
}
