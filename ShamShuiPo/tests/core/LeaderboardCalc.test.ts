import { describe, it, expect } from "vitest";
import {
  createLeaderboard,
  addEntry,
  clearLeaderboard,
  getTopN,
  getRank,
  isHighScore,
  getEntriesByCharacter,
  getPersonalBest,
  getAverageScore,
  getMedianScore,
} from "../../src/core/LeaderboardCalc";

// ─── Helpers ──────────────────────────────────────────────────────────

function makeEntry(
  overrides: Partial<{
    playerName: string;
    score: number;
    wave: number;
    time: number;
    date: string;
    character: string;
  }> = {},
) {
  return {
    playerName: overrides.playerName ?? "Alice",
    score: overrides.score ?? 1000,
    wave: overrides.wave ?? 10,
    time: overrides.time ?? 300,
    date: overrides.date ?? "2026-03-13",
    character: overrides.character ?? "kai",
  };
}

// ── createLeaderboard ────────────────────────────────────────────────

describe("createLeaderboard", () => {
  it("creates empty leaderboard with default maxEntries=100", () => {
    const lb = createLeaderboard();
    expect(lb.entries).toEqual([]);
    expect(lb.maxEntries).toBe(100);
  });

  it("accepts custom maxEntries", () => {
    expect(createLeaderboard(10).maxEntries).toBe(10);
  });

  it("clamps maxEntries to at least 1", () => {
    expect(createLeaderboard(0).maxEntries).toBe(1);
    expect(createLeaderboard(-5).maxEntries).toBe(1);
  });

  it("floors fractional maxEntries", () => {
    expect(createLeaderboard(3.9).maxEntries).toBe(3);
  });
});

// ── addEntry ─────────────────────────────────────────────────────────

describe("addEntry", () => {
  it("adds entry to empty leaderboard", () => {
    const lb = createLeaderboard();
    const result = addEntry(lb, makeEntry({ score: 500 }));
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].score).toBe(500);
  });

  it("returns new state (immutability)", () => {
    const lb = createLeaderboard();
    const result = addEntry(lb, makeEntry());
    expect(result).not.toBe(lb);
    expect(lb.entries).toHaveLength(0);
  });

  it("does not mutate the original entries array", () => {
    const lb = createLeaderboard();
    const e1 = addEntry(lb, makeEntry({ score: 500 }));
    addEntry(e1, makeEntry({ playerName: "Bob", score: 600 }));
    expect(e1.entries).toHaveLength(1);
  });

  it("inserts sorted by score descending", () => {
    let lb = createLeaderboard();
    lb = addEntry(lb, makeEntry({ playerName: "A", score: 100 }));
    lb = addEntry(lb, makeEntry({ playerName: "B", score: 300 }));
    lb = addEntry(lb, makeEntry({ playerName: "C", score: 200 }));
    expect(lb.entries.map((e) => e.score)).toEqual([300, 200, 100]);
  });

  it("handles equal scores", () => {
    let lb = createLeaderboard();
    lb = addEntry(lb, makeEntry({ playerName: "First", score: 500 }));
    lb = addEntry(lb, makeEntry({ playerName: "Second", score: 500 }));
    expect(lb.entries).toHaveLength(2);
  });

  it("trims to maxEntries", () => {
    let lb = createLeaderboard(3);
    for (let i = 1; i <= 5; i++) {
      lb = addEntry(lb, makeEntry({ playerName: `P${i}`, score: i * 100 }));
    }
    expect(lb.entries).toHaveLength(3);
    expect(lb.entries[0].score).toBe(500);
    expect(lb.entries[2].score).toBe(300);
  });

  it("low score is dropped when board full", () => {
    let lb = createLeaderboard(2);
    lb = addEntry(lb, makeEntry({ playerName: "A", score: 300 }));
    lb = addEntry(lb, makeEntry({ playerName: "B", score: 200 }));
    lb = addEntry(lb, makeEntry({ playerName: "C", score: 100 }));
    expect(lb.entries).toHaveLength(2);
    expect(lb.entries.map((e) => e.score)).toEqual([300, 200]);
  });

  it("preserves maxEntries across adds", () => {
    let lb = createLeaderboard(5);
    for (let i = 0; i < 10; i++) {
      lb = addEntry(lb, makeEntry({ playerName: `P${i}`, score: i * 10 }));
    }
    expect(lb.maxEntries).toBe(5);
  });

  it("preserves all entry fields", () => {
    const lb = createLeaderboard();
    const entry = makeEntry({
      playerName: "Bob",
      score: 9999,
      wave: 42,
      time: 600,
      date: "2026-01-01",
      character: "mei",
    });
    const updated = addEntry(lb, entry);
    const stored = updated.entries[0];
    expect(stored.playerName).toBe("Bob");
    expect(stored.score).toBe(9999);
    expect(stored.wave).toBe(42);
    expect(stored.time).toBe(600);
    expect(stored.date).toBe("2026-01-01");
    expect(stored.character).toBe("mei");
  });

  it("handles maxEntries=1", () => {
    let lb = createLeaderboard(1);
    lb = addEntry(lb, makeEntry({ playerName: "A", score: 100 }));
    lb = addEntry(lb, makeEntry({ playerName: "B", score: 200 }));
    expect(lb.entries).toHaveLength(1);
    expect(lb.entries[0].score).toBe(200);
  });

  it("new top score goes to position 0", () => {
    let lb = createLeaderboard();
    lb = addEntry(lb, makeEntry({ score: 100 }));
    lb = addEntry(lb, makeEntry({ score: 200 }));
    lb = addEntry(lb, makeEntry({ score: 9999 }));
    expect(lb.entries[0].score).toBe(9999);
  });
});

// ── clearLeaderboard ─────────────────────────────────────────────────

describe("clearLeaderboard", () => {
  it("removes all entries", () => {
    let lb = createLeaderboard();
    lb = addEntry(lb, makeEntry({ score: 100 }));
    lb = addEntry(lb, makeEntry({ score: 200 }));
    const cleared = clearLeaderboard(lb);
    expect(cleared.entries).toEqual([]);
  });

  it("preserves maxEntries", () => {
    let lb = createLeaderboard(25);
    lb = addEntry(lb, makeEntry());
    const cleared = clearLeaderboard(lb);
    expect(cleared.maxEntries).toBe(25);
  });

  it("returns new state (immutability)", () => {
    let lb = createLeaderboard();
    lb = addEntry(lb, makeEntry());
    const cleared = clearLeaderboard(lb);
    expect(cleared).not.toBe(lb);
    expect(lb.entries).toHaveLength(1);
  });

  it("clearing empty board returns empty board", () => {
    const lb = createLeaderboard();
    const cleared = clearLeaderboard(lb);
    expect(cleared.entries).toEqual([]);
  });

  it("cleared board can accept new entries", () => {
    let lb = createLeaderboard();
    lb = addEntry(lb, makeEntry({ score: 100 }));
    lb = clearLeaderboard(lb);
    lb = addEntry(lb, makeEntry({ score: 999 }));
    expect(lb.entries).toHaveLength(1);
    expect(lb.entries[0].score).toBe(999);
  });
});

// ── getTopN ──────────────────────────────────────────────────────────

describe("getTopN", () => {
  it("returns top N entries in order", () => {
    let lb = createLeaderboard();
    for (let i = 1; i <= 5; i++) {
      lb = addEntry(lb, makeEntry({ playerName: `P${i}`, score: i * 100 }));
    }
    const top3 = getTopN(lb, 3);
    expect(top3).toHaveLength(3);
    expect(top3[0].score).toBe(500);
    expect(top3[2].score).toBe(300);
  });

  it("returns all when N > entries.length", () => {
    let lb = createLeaderboard();
    lb = addEntry(lb, makeEntry({ score: 100 }));
    lb = addEntry(lb, makeEntry({ score: 200 }));
    expect(getTopN(lb, 10)).toHaveLength(2);
  });

  it("returns empty for N=0", () => {
    let lb = createLeaderboard();
    lb = addEntry(lb, makeEntry());
    expect(getTopN(lb, 0)).toEqual([]);
  });

  it("returns empty for negative N", () => {
    let lb = createLeaderboard();
    lb = addEntry(lb, makeEntry());
    expect(getTopN(lb, -1)).toEqual([]);
  });

  it("returns empty from empty board", () => {
    expect(getTopN(createLeaderboard(), 5)).toEqual([]);
  });

  it("top 1 is the highest score", () => {
    let lb = createLeaderboard();
    lb = addEntry(lb, makeEntry({ score: 100 }));
    lb = addEntry(lb, makeEntry({ score: 500 }));
    lb = addEntry(lb, makeEntry({ score: 300 }));
    expect(getTopN(lb, 1)[0].score).toBe(500);
  });
});

// ── getRank ──────────────────────────────────────────────────────────

describe("getRank", () => {
  it("returns 1 for score above all entries", () => {
    let lb = createLeaderboard();
    lb = addEntry(lb, makeEntry({ score: 300 }));
    lb = addEntry(lb, makeEntry({ score: 200 }));
    expect(getRank(lb, 500)).toBe(1);
  });

  it("returns correct rank for mid-range score", () => {
    let lb = createLeaderboard();
    lb = addEntry(lb, makeEntry({ score: 300 }));
    lb = addEntry(lb, makeEntry({ score: 200 }));
    lb = addEntry(lb, makeEntry({ score: 100 }));
    expect(getRank(lb, 250)).toBe(2);
  });

  it("returns last rank+1 for score below all entries", () => {
    let lb = createLeaderboard();
    lb = addEntry(lb, makeEntry({ score: 300 }));
    lb = addEntry(lb, makeEntry({ score: 200 }));
    expect(getRank(lb, 50)).toBe(3);
  });

  it("returns 1 for empty board", () => {
    expect(getRank(createLeaderboard(), 100)).toBe(1);
  });

  it("returns correct rank for equal score", () => {
    let lb = createLeaderboard();
    lb = addEntry(lb, makeEntry({ score: 300 }));
    lb = addEntry(lb, makeEntry({ score: 200 }));
    // 200 is not > 200, so it goes after
    expect(getRank(lb, 200)).toBe(3);
  });
});

// ── isHighScore ──────────────────────────────────────────────────────

describe("isHighScore", () => {
  it("returns true on empty leaderboard", () => {
    expect(isHighScore(createLeaderboard(), 1)).toBe(true);
  });

  it("returns true when board not full", () => {
    let lb = createLeaderboard(100);
    lb = addEntry(lb, makeEntry({ score: 500 }));
    expect(isHighScore(lb, 1)).toBe(true);
  });

  it("returns true when score beats last on full board", () => {
    let lb = createLeaderboard(3);
    lb = addEntry(lb, makeEntry({ score: 300 }));
    lb = addEntry(lb, makeEntry({ score: 200 }));
    lb = addEntry(lb, makeEntry({ score: 100 }));
    expect(isHighScore(lb, 150)).toBe(true);
  });

  it("returns false when score below last on full board", () => {
    let lb = createLeaderboard(3);
    lb = addEntry(lb, makeEntry({ score: 300 }));
    lb = addEntry(lb, makeEntry({ score: 200 }));
    lb = addEntry(lb, makeEntry({ score: 100 }));
    expect(isHighScore(lb, 50)).toBe(false);
  });

  it("returns true for zero score on empty board", () => {
    expect(isHighScore(createLeaderboard(), 0)).toBe(true);
  });
});

// ── getEntriesByCharacter ────────────────────────────────────────────

describe("getEntriesByCharacter", () => {
  it("returns entries matching character", () => {
    let lb = createLeaderboard();
    lb = addEntry(
      lb,
      makeEntry({ playerName: "A", character: "kai", score: 300 }),
    );
    lb = addEntry(
      lb,
      makeEntry({ playerName: "B", character: "mei", score: 200 }),
    );
    lb = addEntry(
      lb,
      makeEntry({ playerName: "C", character: "kai", score: 100 }),
    );
    const results = getEntriesByCharacter(lb, "kai");
    expect(results).toHaveLength(2);
    for (const e of results) {
      expect(e.character).toBe("kai");
    }
  });

  it("returns empty if no entries match", () => {
    let lb = createLeaderboard();
    lb = addEntry(lb, makeEntry({ character: "kai" }));
    expect(getEntriesByCharacter(lb, "unknown")).toEqual([]);
  });

  it("returns empty from empty board", () => {
    expect(getEntriesByCharacter(createLeaderboard(), "kai")).toEqual([]);
  });

  it("preserves score order in results", () => {
    let lb = createLeaderboard();
    lb = addEntry(
      lb,
      makeEntry({ playerName: "A", character: "mei", score: 100 }),
    );
    lb = addEntry(
      lb,
      makeEntry({ playerName: "B", character: "mei", score: 300 }),
    );
    lb = addEntry(
      lb,
      makeEntry({ playerName: "C", character: "mei", score: 200 }),
    );
    const results = getEntriesByCharacter(lb, "mei");
    expect(results.map((e) => e.score)).toEqual([300, 200, 100]);
  });
});

// ── getPersonalBest ──────────────────────────────────────────────────

describe("getPersonalBest", () => {
  it("returns highest score entry for a player", () => {
    let lb = createLeaderboard();
    lb = addEntry(lb, makeEntry({ playerName: "Alice", score: 500 }));
    lb = addEntry(lb, makeEntry({ playerName: "Bob", score: 300 }));
    const best = getPersonalBest(lb, "Alice");
    expect(best).not.toBeNull();
    expect(best!.score).toBe(500);
  });

  it("returns null for nonexistent player", () => {
    const lb = createLeaderboard();
    expect(getPersonalBest(lb, "Ghost")).toBeNull();
  });

  it("returns null from empty board", () => {
    expect(getPersonalBest(createLeaderboard(), "Alice")).toBeNull();
  });

  it("returns first matching (highest due to sort) when multiple entries", () => {
    let lb = createLeaderboard();
    lb = addEntry(lb, makeEntry({ playerName: "Alice", score: 500 }));
    lb = addEntry(lb, makeEntry({ playerName: "Alice", score: 300 }));
    const best = getPersonalBest(lb, "Alice");
    expect(best!.score).toBe(500);
  });
});

// ── getAverageScore ──────────────────────────────────────────────────

describe("getAverageScore", () => {
  it("returns 0 for empty board", () => {
    expect(getAverageScore(createLeaderboard())).toBe(0);
  });

  it("returns the score for single entry", () => {
    let lb = createLeaderboard();
    lb = addEntry(lb, makeEntry({ score: 400 }));
    expect(getAverageScore(lb)).toBe(400);
  });

  it("returns correct average for multiple entries", () => {
    let lb = createLeaderboard();
    lb = addEntry(lb, makeEntry({ score: 100 }));
    lb = addEntry(lb, makeEntry({ score: 200 }));
    lb = addEntry(lb, makeEntry({ score: 300 }));
    expect(getAverageScore(lb)).toBe(200);
  });

  it("handles non-integer averages", () => {
    let lb = createLeaderboard();
    lb = addEntry(lb, makeEntry({ score: 100 }));
    lb = addEntry(lb, makeEntry({ score: 200 }));
    expect(getAverageScore(lb)).toBe(150);
  });
});

// ── getMedianScore ───────────────────────────────────────────────────

describe("getMedianScore", () => {
  it("returns 0 for empty board", () => {
    expect(getMedianScore(createLeaderboard())).toBe(0);
  });

  it("returns the score for single entry", () => {
    let lb = createLeaderboard();
    lb = addEntry(lb, makeEntry({ score: 500 }));
    expect(getMedianScore(lb)).toBe(500);
  });

  it("returns middle value for odd count", () => {
    let lb = createLeaderboard();
    lb = addEntry(lb, makeEntry({ score: 100 }));
    lb = addEntry(lb, makeEntry({ score: 200 }));
    lb = addEntry(lb, makeEntry({ score: 300 }));
    // sorted desc: 300, 200, 100 → median = 200
    expect(getMedianScore(lb)).toBe(200);
  });

  it("returns average of two middle values for even count", () => {
    let lb = createLeaderboard();
    lb = addEntry(lb, makeEntry({ score: 100 }));
    lb = addEntry(lb, makeEntry({ score: 200 }));
    lb = addEntry(lb, makeEntry({ score: 300 }));
    lb = addEntry(lb, makeEntry({ score: 400 }));
    // sorted desc: 400, 300, 200, 100 → median = (300+200)/2 = 250
    expect(getMedianScore(lb)).toBe(250);
  });

  it("handles two entries", () => {
    let lb = createLeaderboard();
    lb = addEntry(lb, makeEntry({ score: 100 }));
    lb = addEntry(lb, makeEntry({ score: 300 }));
    expect(getMedianScore(lb)).toBe(200);
  });
});

// ── Immutability ─────────────────────────────────────────────────────

describe("immutability", () => {
  it("addEntry returns a new state object", () => {
    const lb = createLeaderboard();
    const updated = addEntry(lb, makeEntry());
    expect(lb).not.toBe(updated);
  });

  it("clearLeaderboard returns a new state object", () => {
    let lb = createLeaderboard();
    lb = addEntry(lb, makeEntry());
    const cleared = clearLeaderboard(lb);
    expect(lb).not.toBe(cleared);
  });

  it("original entries unchanged after addEntry", () => {
    let lb = createLeaderboard();
    lb = addEntry(lb, makeEntry({ score: 100 }));
    const originalLen = lb.entries.length;
    addEntry(lb, makeEntry({ score: 200 }));
    expect(lb.entries.length).toBe(originalLen);
  });
});

// ── Edge Cases ───────────────────────────────────────────────────────

describe("edge cases", () => {
  it("handles score of 0", () => {
    let lb = createLeaderboard();
    lb = addEntry(lb, makeEntry({ score: 0 }));
    expect(lb.entries).toHaveLength(1);
    expect(lb.entries[0].score).toBe(0);
  });

  it("handles very large scores", () => {
    let lb = createLeaderboard();
    lb = addEntry(lb, makeEntry({ score: Number.MAX_SAFE_INTEGER }));
    expect(lb.entries[0].score).toBe(Number.MAX_SAFE_INTEGER);
  });

  it("handles negative scores", () => {
    let lb = createLeaderboard();
    lb = addEntry(lb, makeEntry({ score: -10 }));
    lb = addEntry(lb, makeEntry({ score: -5 }));
    lb = addEntry(lb, makeEntry({ score: 10 }));
    expect(lb.entries.map((e) => e.score)).toEqual([10, -5, -10]);
  });

  it("large board remains sorted", () => {
    let lb = createLeaderboard(50);
    for (let i = 0; i < 200; i++) {
      lb = addEntry(
        lb,
        makeEntry({
          playerName: `P${i}`,
          score: Math.floor(Math.random() * 10000),
        }),
      );
    }
    expect(lb.entries).toHaveLength(50);
    for (let i = 1; i < lb.entries.length; i++) {
      expect(lb.entries[i - 1].score).toBeGreaterThanOrEqual(
        lb.entries[i].score,
      );
    }
  });
});

// ── Integration ──────────────────────────────────────────────────────

describe("integration", () => {
  it("add → clear → add cycle works", () => {
    let lb = createLeaderboard(5);
    lb = addEntry(lb, makeEntry({ score: 100 }));
    lb = clearLeaderboard(lb);
    lb = addEntry(lb, makeEntry({ score: 200 }));
    expect(lb.entries).toHaveLength(1);
    expect(lb.entries[0].score).toBe(200);
  });

  it("getRank and isHighScore are consistent", () => {
    let lb = createLeaderboard(3);
    lb = addEntry(lb, makeEntry({ score: 300 }));
    lb = addEntry(lb, makeEntry({ score: 200 }));
    lb = addEntry(lb, makeEntry({ score: 100 }));
    expect(getRank(lb, 250)).toBe(2);
    expect(isHighScore(lb, 250)).toBe(true);
  });

  it("getTopN(state, entries.length) returns all entries", () => {
    let lb = createLeaderboard();
    for (let i = 1; i <= 7; i++) {
      lb = addEntry(lb, makeEntry({ playerName: `P${i}`, score: i * 100 }));
    }
    const all = getTopN(lb, lb.entries.length);
    expect(all).toHaveLength(7);
  });

  it("full workflow: add, query, stats", () => {
    let lb = createLeaderboard(10);
    lb = addEntry(
      lb,
      makeEntry({ playerName: "Alice", character: "kai", score: 100 }),
    );
    lb = addEntry(
      lb,
      makeEntry({ playerName: "Bob", character: "mei", score: 200 }),
    );
    lb = addEntry(
      lb,
      makeEntry({ playerName: "Carol", character: "kai", score: 300 }),
    );
    lb = addEntry(
      lb,
      makeEntry({ playerName: "Dave", character: "kai", score: 150 }),
    );

    expect(lb.entries).toHaveLength(4);
    expect(getRank(lb, 250)).toBe(2);
    expect(getPersonalBest(lb, "Carol")!.score).toBe(300);
    expect(getEntriesByCharacter(lb, "kai")).toHaveLength(3);
    expect(isHighScore(lb, 250)).toBe(true);
    expect(getAverageScore(lb)).toBe(187.5);
    expect(getMedianScore(lb)).toBe(175);
  });
});
