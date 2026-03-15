// LeaderboardCalc.ts — pure TypeScript leaderboard system, NO Phaser imports

// ─── Types ───────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  readonly playerName: string;
  readonly score: number;
  readonly wave: number;
  readonly time: number;
  readonly date: string;
  readonly character: string;
}

export interface LeaderboardState {
  readonly entries: readonly LeaderboardEntry[];
  readonly maxEntries: number;
}

// ─── Factory ─────────────────────────────────────────────────────────

export function createLeaderboard(maxEntries: number = 100): LeaderboardState {
  return {
    entries: [],
    maxEntries: Math.max(1, Math.floor(maxEntries)),
  };
}

// ─── Queries ─────────────────────────────────────────────────────────

/** Get top N entries (already sorted desc by score). */
export function getTopN(
  state: LeaderboardState,
  n: number,
): readonly LeaderboardEntry[] {
  if (n <= 0) return [];
  return state.entries.slice(0, n);
}

/** What 1-based rank would this score receive? */
export function getRank(state: LeaderboardState, score: number): number {
  let rank = 1;
  for (const entry of state.entries) {
    if (score > entry.score) return rank;
    rank++;
  }
  return rank;
}

/** Would this score make the leaderboard? */
export function isHighScore(state: LeaderboardState, score: number): boolean {
  if (state.entries.length < state.maxEntries) return true;
  const last = state.entries[state.entries.length - 1];
  return last !== undefined && score > last.score;
}

/** Filter entries by character name. */
export function getEntriesByCharacter(
  state: LeaderboardState,
  character: string,
): readonly LeaderboardEntry[] {
  return state.entries.filter((e) => e.character === character);
}

/** Highest-scoring entry for a player, or null. */
export function getPersonalBest(
  state: LeaderboardState,
  playerName: string,
): LeaderboardEntry | null {
  for (const entry of state.entries) {
    if (entry.playerName === playerName) return entry;
  }
  return null;
}

/** Average score across all entries (0 if empty). */
export function getAverageScore(state: LeaderboardState): number {
  if (state.entries.length === 0) return 0;
  const sum = state.entries.reduce((acc, e) => acc + e.score, 0);
  return sum / state.entries.length;
}

/** Median score across all entries (0 if empty). */
export function getMedianScore(state: LeaderboardState): number {
  const len = state.entries.length;
  if (len === 0) return 0;
  // entries are already sorted desc by score
  const mid = Math.floor(len / 2);
  if (len % 2 === 1) return state.entries[mid].score;
  return (state.entries[mid - 1].score + state.entries[mid].score) / 2;
}

// ─── Mutations (immutable — return new state) ────────────────────────

/** Insert entry sorted by score desc, trim to maxEntries. Immutable. */
export function addEntry(
  state: LeaderboardState,
  entry: LeaderboardEntry,
): LeaderboardState {
  const insertIdx = getRank(state, entry.score) - 1;
  const newEntries = [
    ...state.entries.slice(0, insertIdx),
    entry,
    ...state.entries.slice(insertIdx),
  ].slice(0, state.maxEntries);

  return { ...state, entries: newEntries };
}

/** Remove all entries, keeping maxEntries setting. Immutable. */
export function clearLeaderboard(state: LeaderboardState): LeaderboardState {
  return { ...state, entries: [] };
}
