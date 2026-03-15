import { describe, it, expect } from "vitest";
import {
  createInputBuffer,
  bufferInput,
  consumeInput,
  peekNextInput,
  clearBuffer,
  getBufferedActions,
  isInputBuffered,
  pruneExpired,
  getBufferSize,
} from "../../src/core/InputBufferCalc";
import type { InputAction } from "../../src/core/InputBufferCalc";

// ---------------------------------------------------------------------------
// createInputBuffer
// ---------------------------------------------------------------------------
describe("createInputBuffer", () => {
  it("creates an empty buffer with given size and window", () => {
    const s = createInputBuffer(10, 200);
    expect(s.buffer).toEqual([]);
    expect(s.maxBufferSize).toBe(10);
    expect(s.bufferWindowMs).toBe(200);
  });

  it("clamps maxBufferSize to at least 1", () => {
    expect(createInputBuffer(0, 100).maxBufferSize).toBe(1);
    expect(createInputBuffer(-5, 100).maxBufferSize).toBe(1);
  });

  it("clamps bufferWindowMs to at least 0", () => {
    expect(createInputBuffer(5, -10).bufferWindowMs).toBe(0);
  });

  it("floors fractional maxBufferSize", () => {
    expect(createInputBuffer(3.9, 100).maxBufferSize).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// bufferInput
// ---------------------------------------------------------------------------
describe("bufferInput", () => {
  it("adds an input to an empty buffer", () => {
    let s = createInputBuffer(5, 200);
    s = bufferInput(s, "dodge", 1000);
    expect(s.buffer.length).toBe(1);
    expect(s.buffer[0].action).toBe("dodge");
    expect(s.buffer[0].timestamp).toBe(1000);
    expect(s.buffer[0].consumed).toBe(false);
  });

  it("appends multiple inputs in FIFO order", () => {
    let s = createInputBuffer(5, 200);
    s = bufferInput(s, "move_up", 100);
    s = bufferInput(s, "move_down", 200);
    s = bufferInput(s, "dodge", 300);
    expect(s.buffer.map((i) => i.action)).toEqual([
      "move_up",
      "move_down",
      "dodge",
    ]);
  });

  it("evicts the oldest entry when at capacity", () => {
    let s = createInputBuffer(2, 500);
    s = bufferInput(s, "move_up", 100);
    s = bufferInput(s, "move_down", 200);
    // Buffer full (2). Adding a third evicts the first.
    s = bufferInput(s, "dodge", 300);
    expect(s.buffer.length).toBe(2);
    expect(s.buffer[0].action).toBe("move_down");
    expect(s.buffer[1].action).toBe("dodge");
  });

  it("returns a new state object (immutability)", () => {
    const s1 = createInputBuffer(5, 200);
    const s2 = bufferInput(s1, "pause", 100);
    expect(s1).not.toBe(s2);
    expect(s1.buffer.length).toBe(0);
    expect(s2.buffer.length).toBe(1);
  });

  it("accepts all valid InputAction values", () => {
    const actions: InputAction[] = [
      "move_up",
      "move_down",
      "move_left",
      "move_right",
      "dodge",
      "ability_1",
      "ability_2",
      "ability_3",
      "pause",
    ];
    let s = createInputBuffer(20, 1000);
    for (const a of actions) {
      s = bufferInput(s, a, 100);
    }
    expect(s.buffer.length).toBe(actions.length);
  });
});

// ---------------------------------------------------------------------------
// consumeInput
// ---------------------------------------------------------------------------
describe("consumeInput", () => {
  it("consumes the oldest unconsumed matching input", () => {
    let s = createInputBuffer(5, 500);
    s = bufferInput(s, "dodge", 100);
    s = bufferInput(s, "dodge", 200);
    const result = consumeInput(s, "dodge");
    expect(result.input).not.toBeNull();
    expect(result.input!.timestamp).toBe(100);
    expect(result.input!.consumed).toBe(true);
  });

  it("returns null when no matching unconsumed input exists", () => {
    let s = createInputBuffer(5, 500);
    s = bufferInput(s, "move_up", 100);
    const result = consumeInput(s, "dodge");
    expect(result.input).toBeNull();
    expect(result.state).toBe(s); // state unchanged
  });

  it("skips already-consumed entries", () => {
    let s = createInputBuffer(5, 500);
    s = bufferInput(s, "dodge", 100);
    s = bufferInput(s, "dodge", 200);
    const r1 = consumeInput(s, "dodge");
    const r2 = consumeInput(r1.state, "dodge");
    expect(r2.input!.timestamp).toBe(200);
  });

  it("returns null when all matching inputs are consumed", () => {
    let s = createInputBuffer(5, 500);
    s = bufferInput(s, "dodge", 100);
    const r1 = consumeInput(s, "dodge");
    const r2 = consumeInput(r1.state, "dodge");
    expect(r2.input).toBeNull();
  });

  it("does not mutate the original state", () => {
    let s = createInputBuffer(5, 500);
    s = bufferInput(s, "dodge", 100);
    const original = s;
    consumeInput(s, "dodge");
    expect(original.buffer[0].consumed).toBe(false);
  });

  it("consumes only the targeted action, leaving others untouched", () => {
    let s = createInputBuffer(5, 500);
    s = bufferInput(s, "move_up", 100);
    s = bufferInput(s, "dodge", 200);
    s = bufferInput(s, "move_down", 300);
    const result = consumeInput(s, "dodge");
    // move_up and move_down remain unconsumed
    const unconsumed = result.state.buffer.filter((i) => !i.consumed);
    expect(unconsumed.length).toBe(2);
    expect(unconsumed.map((i) => i.action)).toEqual(["move_up", "move_down"]);
  });
});

// ---------------------------------------------------------------------------
// peekNextInput
// ---------------------------------------------------------------------------
describe("peekNextInput", () => {
  it("returns the oldest unconsumed input", () => {
    let s = createInputBuffer(5, 500);
    s = bufferInput(s, "move_up", 100);
    s = bufferInput(s, "dodge", 200);
    const peeked = peekNextInput(s);
    expect(peeked).not.toBeNull();
    expect(peeked!.action).toBe("move_up");
  });

  it("returns null on an empty buffer", () => {
    const s = createInputBuffer(5, 500);
    expect(peekNextInput(s)).toBeNull();
  });

  it("skips consumed entries", () => {
    let s = createInputBuffer(5, 500);
    s = bufferInput(s, "move_up", 100);
    s = bufferInput(s, "dodge", 200);
    const r = consumeInput(s, "move_up");
    const peeked = peekNextInput(r.state);
    expect(peeked!.action).toBe("dodge");
  });

  it("returns null when all entries are consumed", () => {
    let s = createInputBuffer(5, 500);
    s = bufferInput(s, "dodge", 100);
    const r = consumeInput(s, "dodge");
    expect(peekNextInput(r.state)).toBeNull();
  });

  it("does not consume the peeked input", () => {
    let s = createInputBuffer(5, 500);
    s = bufferInput(s, "dodge", 100);
    peekNextInput(s);
    expect(s.buffer[0].consumed).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// clearBuffer
// ---------------------------------------------------------------------------
describe("clearBuffer", () => {
  it("removes all entries", () => {
    let s = createInputBuffer(5, 500);
    s = bufferInput(s, "dodge", 100);
    s = bufferInput(s, "move_up", 200);
    s = clearBuffer(s);
    expect(s.buffer.length).toBe(0);
  });

  it("preserves maxBufferSize and bufferWindowMs", () => {
    let s = createInputBuffer(8, 300);
    s = bufferInput(s, "dodge", 100);
    s = clearBuffer(s);
    expect(s.maxBufferSize).toBe(8);
    expect(s.bufferWindowMs).toBe(300);
  });

  it("is a no-op on an already empty buffer", () => {
    const s = createInputBuffer(5, 500);
    const cleared = clearBuffer(s);
    expect(cleared.buffer.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getBufferedActions
// ---------------------------------------------------------------------------
describe("getBufferedActions", () => {
  it("returns unconsumed actions in insertion order", () => {
    let s = createInputBuffer(10, 500);
    s = bufferInput(s, "move_up", 100);
    s = bufferInput(s, "dodge", 200);
    s = bufferInput(s, "ability_1", 300);
    expect(getBufferedActions(s)).toEqual(["move_up", "dodge", "ability_1"]);
  });

  it("excludes consumed inputs", () => {
    let s = createInputBuffer(10, 500);
    s = bufferInput(s, "move_up", 100);
    s = bufferInput(s, "dodge", 200);
    const r = consumeInput(s, "move_up");
    expect(getBufferedActions(r.state)).toEqual(["dodge"]);
  });

  it("returns empty array for empty buffer", () => {
    const s = createInputBuffer(5, 500);
    expect(getBufferedActions(s)).toEqual([]);
  });

  it("returns empty array when all consumed", () => {
    let s = createInputBuffer(5, 500);
    s = bufferInput(s, "dodge", 100);
    const r = consumeInput(s, "dodge");
    expect(getBufferedActions(r.state)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// isInputBuffered
// ---------------------------------------------------------------------------
describe("isInputBuffered", () => {
  it("returns true when action has an unconsumed entry", () => {
    let s = createInputBuffer(5, 500);
    s = bufferInput(s, "dodge", 100);
    expect(isInputBuffered(s, "dodge")).toBe(true);
  });

  it("returns false when action is not present", () => {
    let s = createInputBuffer(5, 500);
    s = bufferInput(s, "move_up", 100);
    expect(isInputBuffered(s, "dodge")).toBe(false);
  });

  it("returns false when action entry is consumed", () => {
    let s = createInputBuffer(5, 500);
    s = bufferInput(s, "dodge", 100);
    const r = consumeInput(s, "dodge");
    expect(isInputBuffered(r.state, "dodge")).toBe(false);
  });

  it("returns true if at least one unconsumed entry exists among consumed ones", () => {
    let s = createInputBuffer(5, 500);
    s = bufferInput(s, "dodge", 100);
    s = bufferInput(s, "dodge", 200);
    const r = consumeInput(s, "dodge"); // consume first
    expect(isInputBuffered(r.state, "dodge")).toBe(true);
  });

  it("returns false on empty buffer", () => {
    const s = createInputBuffer(5, 500);
    expect(isInputBuffered(s, "pause")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// pruneExpired
// ---------------------------------------------------------------------------
describe("pruneExpired", () => {
  it("removes entries older than bufferWindowMs", () => {
    let s = createInputBuffer(10, 200);
    s = bufferInput(s, "move_up", 100);
    s = bufferInput(s, "dodge", 250);
    // currentTime=350 → cutoff=150, so move_up (100) is expired
    s = pruneExpired(s, 350);
    expect(s.buffer.length).toBe(1);
    expect(s.buffer[0].action).toBe("dodge");
  });

  it("removes consumed entries even if not expired", () => {
    let s = createInputBuffer(10, 1000);
    s = bufferInput(s, "dodge", 500);
    const r = consumeInput(s, "dodge");
    const pruned = pruneExpired(r.state, 600);
    expect(pruned.buffer.length).toBe(0);
  });

  it("keeps entries exactly at the cutoff boundary", () => {
    let s = createInputBuffer(10, 200);
    s = bufferInput(s, "dodge", 100);
    // currentTime=300 → cutoff=100, timestamp 100 >= 100 → kept
    s = pruneExpired(s, 300);
    expect(s.buffer.length).toBe(1);
  });

  it("is a no-op on empty buffer", () => {
    const s = createInputBuffer(5, 200);
    const pruned = pruneExpired(s, 9999);
    expect(pruned.buffer.length).toBe(0);
  });

  it("removes all entries when all expired", () => {
    let s = createInputBuffer(10, 100);
    s = bufferInput(s, "move_up", 10);
    s = bufferInput(s, "move_down", 20);
    s = bufferInput(s, "dodge", 30);
    s = pruneExpired(s, 500);
    expect(s.buffer.length).toBe(0);
  });

  it("preserves maxBufferSize and bufferWindowMs", () => {
    let s = createInputBuffer(8, 300);
    s = bufferInput(s, "dodge", 100);
    s = pruneExpired(s, 9999);
    expect(s.maxBufferSize).toBe(8);
    expect(s.bufferWindowMs).toBe(300);
  });

  it("does not mutate the original state", () => {
    let s = createInputBuffer(10, 100);
    s = bufferInput(s, "dodge", 10);
    const original = s;
    pruneExpired(s, 9999);
    expect(original.buffer.length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// getBufferSize
// ---------------------------------------------------------------------------
describe("getBufferSize", () => {
  it("returns 0 for empty buffer", () => {
    const s = createInputBuffer(5, 200);
    expect(getBufferSize(s)).toBe(0);
  });

  it("counts all entries including consumed ones", () => {
    let s = createInputBuffer(10, 500);
    s = bufferInput(s, "dodge", 100);
    s = bufferInput(s, "move_up", 200);
    const r = consumeInput(s, "dodge");
    // 2 entries total (1 consumed + 1 unconsumed)
    expect(getBufferSize(r.state)).toBe(2);
  });

  it("reflects eviction", () => {
    let s = createInputBuffer(2, 500);
    s = bufferInput(s, "dodge", 100);
    s = bufferInput(s, "move_up", 200);
    s = bufferInput(s, "move_down", 300);
    expect(getBufferSize(s)).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Integration / edge cases
// ---------------------------------------------------------------------------
describe("integration scenarios", () => {
  it("full lifecycle: buffer → consume → prune → peek", () => {
    let s = createInputBuffer(5, 200);
    s = bufferInput(s, "move_up", 100);
    s = bufferInput(s, "dodge", 150);
    s = bufferInput(s, "ability_1", 250);

    // Consume dodge
    const r = consumeInput(s, "dodge");
    expect(r.input!.action).toBe("dodge");

    // Prune at t=310 (window 200 → cutoff 110). move_up(100) expired, dodge consumed
    const pruned = pruneExpired(r.state, 310);
    expect(getBufferSize(pruned)).toBe(1);
    expect(peekNextInput(pruned)!.action).toBe("ability_1");
  });

  it("consuming same action multiple times respects FIFO order", () => {
    let s = createInputBuffer(10, 1000);
    s = bufferInput(s, "ability_1", 100);
    s = bufferInput(s, "ability_1", 200);
    s = bufferInput(s, "ability_1", 300);

    const r1 = consumeInput(s, "ability_1");
    expect(r1.input!.timestamp).toBe(100);

    const r2 = consumeInput(r1.state, "ability_1");
    expect(r2.input!.timestamp).toBe(200);

    const r3 = consumeInput(r2.state, "ability_1");
    expect(r3.input!.timestamp).toBe(300);

    const r4 = consumeInput(r3.state, "ability_1");
    expect(r4.input).toBeNull();
  });

  it("eviction + consume interplay", () => {
    let s = createInputBuffer(2, 1000);
    s = bufferInput(s, "move_up", 100);
    s = bufferInput(s, "move_down", 200);
    // move_up evicted
    s = bufferInput(s, "dodge", 300);

    const r = consumeInput(s, "move_up");
    expect(r.input).toBeNull(); // was evicted

    const r2 = consumeInput(s, "move_down");
    expect(r2.input!.action).toBe("move_down");
  });

  it("bufferWindowMs of 0 expires everything except current timestamp", () => {
    let s = createInputBuffer(10, 0);
    s = bufferInput(s, "dodge", 100);
    s = bufferInput(s, "move_up", 200);
    // cutoff = 200 - 0 = 200; timestamp 100 < 200 expired, 200 >= 200 kept
    s = pruneExpired(s, 200);
    expect(s.buffer.length).toBe(1);
    expect(s.buffer[0].action).toBe("move_up");
  });
});
