import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createPlayerRating,
  getRank,
  getExpectedWinRate,
  calculateMatchResult,
  getStreakBonus,
  applyInactivityDecay,
  estimateMatchQuality,
  getLeaderboardPosition,
  isPromotionMatch,
  getDemotionShield,
  type PlayerRating,
} from "../../src/core/MatchmakingCalc";

const MS_PER_DAY = 86_400_000;

// Helper to create a rating with a fixed lastMatchAt for deterministic tests
function makeRating(overrides?: Partial<PlayerRating>): PlayerRating {
  return createPlayerRating({ lastMatchAt: 1000000000000, ...overrides });
}

// ─── createPlayerRating ──────────────────────────────────────

describe("createPlayerRating", () => {
  it("returns default MMR of 800", () => {
    const r = makeRating();
    expect(r.mmr).toBe(800);
  });

  it("starts with 0 wins", () => {
    expect(makeRating().wins).toBe(0);
  });

  it("starts with 0 losses", () => {
    expect(makeRating().losses).toBe(0);
  });

  it("starts with 0 streak", () => {
    expect(makeRating().streak).toBe(0);
  });

  it("assigns correct rank for default MMR (silver)", () => {
    expect(makeRating().rank).toBe("silver");
  });

  it("accepts mmr override", () => {
    const r = makeRating({ mmr: 2000 });
    expect(r.mmr).toBe(2000);
  });

  it("auto-assigns rank from overridden MMR", () => {
    const r = makeRating({ mmr: 2000 });
    expect(r.rank).toBe("master");
  });

  it("accepts explicit rank override", () => {
    const r = makeRating({ mmr: 100, rank: "gold" });
    expect(r.rank).toBe("gold");
  });

  it("accepts wins/losses overrides", () => {
    const r = makeRating({ wins: 10, losses: 5 });
    expect(r.wins).toBe(10);
    expect(r.losses).toBe(5);
  });

  it("accepts streak override", () => {
    const r = makeRating({ streak: 3 });
    expect(r.streak).toBe(3);
  });

  it("accepts lastMatchAt override", () => {
    const r = makeRating({ lastMatchAt: 12345 });
    expect(r.lastMatchAt).toBe(12345);
  });
});

// ─── getRank ─────────────────────────────────────────────────

describe("getRank", () => {
  it("returns bronze for 0", () => {
    expect(getRank(0)).toBe("bronze");
  });

  it("returns bronze for 599", () => {
    expect(getRank(599)).toBe("bronze");
  });

  it("returns silver for 600", () => {
    expect(getRank(600)).toBe("silver");
  });

  it("returns silver for 899", () => {
    expect(getRank(899)).toBe("silver");
  });

  it("returns gold for 900", () => {
    expect(getRank(900)).toBe("gold");
  });

  it("returns gold for 1199", () => {
    expect(getRank(1199)).toBe("gold");
  });

  it("returns platinum for 1200", () => {
    expect(getRank(1200)).toBe("platinum");
  });

  it("returns diamond for 1600", () => {
    expect(getRank(1600)).toBe("diamond");
  });

  it("returns master for 2000", () => {
    expect(getRank(2000)).toBe("master");
  });

  it("returns legend for 2400", () => {
    expect(getRank(2400)).toBe("legend");
  });

  it("returns legend for very high MMR", () => {
    expect(getRank(9999)).toBe("legend");
  });

  it("returns bronze for negative MMR", () => {
    expect(getRank(-100)).toBe("bronze");
  });
});

// ─── getExpectedWinRate ──────────────────────────────────────

describe("getExpectedWinRate", () => {
  it("returns 0.5 for equal ratings", () => {
    expect(getExpectedWinRate(1000, 1000)).toBeCloseTo(0.5, 5);
  });

  it("returns > 0.5 for higher-rated player", () => {
    expect(getExpectedWinRate(1200, 1000)).toBeGreaterThan(0.5);
  });

  it("returns < 0.5 for lower-rated player", () => {
    expect(getExpectedWinRate(800, 1000)).toBeLessThan(0.5);
  });

  it("returns ~0.76 for +200 advantage", () => {
    expect(getExpectedWinRate(1200, 1000)).toBeCloseTo(0.76, 1);
  });

  it("returns ~0.91 for +400 advantage", () => {
    expect(getExpectedWinRate(1400, 1000)).toBeCloseTo(0.909, 1);
  });

  it("is symmetric: E(A,B) + E(B,A) = 1", () => {
    const eAB = getExpectedWinRate(1200, 900);
    const eBA = getExpectedWinRate(900, 1200);
    expect(eAB + eBA).toBeCloseTo(1, 10);
  });

  it("never returns exactly 0 or 1", () => {
    expect(getExpectedWinRate(0, 5000)).toBeGreaterThan(0);
    expect(getExpectedWinRate(5000, 0)).toBeLessThan(1);
  });
});

// ─── calculateMatchResult ────────────────────────────────────

describe("calculateMatchResult", () => {
  it("winner gains MMR", () => {
    const a = makeRating({ mmr: 1000 });
    const b = makeRating({ mmr: 1000 });
    const { winner } = calculateMatchResult(a, b);
    expect(winner.mmr).toBeGreaterThan(1000);
  });

  it("loser loses MMR", () => {
    const a = makeRating({ mmr: 1000 });
    const b = makeRating({ mmr: 1000 });
    const { loser } = calculateMatchResult(a, b);
    expect(loser.mmr).toBeLessThan(1000);
  });

  it("winner increments wins count", () => {
    const a = makeRating({ wins: 5 });
    const { winner } = calculateMatchResult(a, makeRating());
    expect(winner.wins).toBe(6);
  });

  it("loser increments losses count", () => {
    const b = makeRating({ losses: 3 });
    const { loser } = calculateMatchResult(makeRating(), b);
    expect(loser.losses).toBe(4);
  });

  it("winner does not change losses", () => {
    const a = makeRating({ losses: 2 });
    const { winner } = calculateMatchResult(a, makeRating());
    expect(winner.losses).toBe(2);
  });

  it("loser does not change wins", () => {
    const b = makeRating({ wins: 7 });
    const { loser } = calculateMatchResult(makeRating(), b);
    expect(loser.wins).toBe(7);
  });

  it("upset win (lower beats higher) yields larger gain", () => {
    const weak = makeRating({ mmr: 800 });
    const strong = makeRating({ mmr: 1200 });
    const { winner: upsetWin } = calculateMatchResult(weak, strong);
    const even = makeRating({ mmr: 1000 });
    const { winner: normalWin } = calculateMatchResult(
      even,
      makeRating({ mmr: 1000 }),
    );
    expect(upsetWin.mmr - 800).toBeGreaterThan(normalWin.mmr - 1000);
  });

  it("respects custom kFactor", () => {
    const a = makeRating({ mmr: 1000 });
    const b = makeRating({ mmr: 1000 });
    const low = calculateMatchResult(a, b, 10);
    const high = calculateMatchResult(a, b, 50);
    expect(high.winner.mmr - 1000).toBeGreaterThan(low.winner.mmr - 1000);
  });

  it("MMR never goes below 0", () => {
    const a = makeRating({ mmr: 2000 });
    const b = makeRating({ mmr: 5 });
    const { loser } = calculateMatchResult(a, b);
    expect(loser.mmr).toBeGreaterThanOrEqual(0);
  });

  it("updates winner rank when crossing threshold", () => {
    const a = makeRating({ mmr: 895, rank: "silver" });
    const b = makeRating({ mmr: 895 });
    const { winner } = calculateMatchResult(a, b);
    // With k=32, equal MMR win yields ~16 + streak bonus → crosses 900
    expect(winner.mmr).toBeGreaterThanOrEqual(900);
    expect(winner.rank).toBe("gold");
  });

  it("is immutable — does not modify inputs", () => {
    const a = makeRating({ mmr: 1000 });
    const b = makeRating({ mmr: 1000 });
    calculateMatchResult(a, b);
    expect(a.mmr).toBe(1000);
    expect(b.mmr).toBe(1000);
  });

  it("winner streak increments from 0 to 1", () => {
    const a = makeRating({ streak: 0 });
    const { winner } = calculateMatchResult(a, makeRating());
    expect(winner.streak).toBe(1);
  });

  it("winner streak increments from positive", () => {
    const a = makeRating({ streak: 3 });
    const { winner } = calculateMatchResult(a, makeRating());
    expect(winner.streak).toBe(4);
  });

  it("winner streak resets from negative to 1", () => {
    const a = makeRating({ streak: -3 });
    const { winner } = calculateMatchResult(a, makeRating());
    expect(winner.streak).toBe(1);
  });

  it("loser streak decrements from 0 to -1", () => {
    const b = makeRating({ streak: 0 });
    const { loser } = calculateMatchResult(makeRating(), b);
    expect(loser.streak).toBe(-1);
  });

  it("loser streak decrements from negative", () => {
    const b = makeRating({ streak: -2 });
    const { loser } = calculateMatchResult(makeRating(), b);
    expect(loser.streak).toBe(-3);
  });

  it("loser streak resets from positive to -1", () => {
    const b = makeRating({ streak: 4 });
    const { loser } = calculateMatchResult(makeRating(), b);
    expect(loser.streak).toBe(-1);
  });
});

// ─── getStreakBonus ──────────────────────────────────────────

describe("getStreakBonus", () => {
  it("returns 0 for 0 streak", () => {
    expect(getStreakBonus(0)).toBe(0);
  });

  it("returns 2 for +1 streak", () => {
    expect(getStreakBonus(1)).toBe(2);
  });

  it("returns 6 for +3 streak", () => {
    expect(getStreakBonus(3)).toBe(6);
  });

  it("returns 10 for +5 streak (max)", () => {
    expect(getStreakBonus(5)).toBe(10);
  });

  it("caps positive at +5", () => {
    expect(getStreakBonus(10)).toBe(10);
  });

  it("returns -2 for -1 streak", () => {
    expect(getStreakBonus(-1)).toBe(-2);
  });

  it("returns -6 for -3 streak", () => {
    expect(getStreakBonus(-3)).toBe(-6);
  });

  it("returns -10 for -5 streak (min)", () => {
    expect(getStreakBonus(-5)).toBe(-10);
  });

  it("caps negative at -5", () => {
    expect(getStreakBonus(-10)).toBe(-10);
  });
});

// ─── applyInactivityDecay ────────────────────────────────────

describe("applyInactivityDecay", () => {
  it("no decay within 7 days", () => {
    const r = makeRating({ mmr: 1500, lastMatchAt: 1000 });
    const result = applyInactivityDecay(r, 1000 + 7 * MS_PER_DAY);
    expect(result.mmr).toBe(1500);
  });

  it("no decay at exactly 7 days", () => {
    const r = makeRating({ mmr: 1500, lastMatchAt: 0 });
    const result = applyInactivityDecay(r, 7 * MS_PER_DAY);
    expect(result.mmr).toBe(1500);
  });

  it("returns same object if no decay needed", () => {
    const r = makeRating({ mmr: 1500, lastMatchAt: 0 });
    const result = applyInactivityDecay(r, 5 * MS_PER_DAY);
    expect(result).toBe(r);
  });

  it("decays 10 MMR per day after 7-day grace period", () => {
    const r = makeRating({ mmr: 1500, lastMatchAt: 0 });
    const result = applyInactivityDecay(r, 10 * MS_PER_DAY); // 3 days past grace
    expect(result.mmr).toBe(1470);
  });

  it("decays 50 MMR for 12 days inactive", () => {
    const r = makeRating({ mmr: 1500, lastMatchAt: 0 });
    const result = applyInactivityDecay(r, 12 * MS_PER_DAY); // 5 days decay
    expect(result.mmr).toBe(1450);
  });

  it("caps decay at 200 MMR", () => {
    const r = makeRating({ mmr: 1500, lastMatchAt: 0 });
    const result = applyInactivityDecay(r, 100 * MS_PER_DAY); // way over max
    expect(result.mmr).toBe(1300);
  });

  it("MMR never goes below 0", () => {
    const r = makeRating({ mmr: 50, lastMatchAt: 0 });
    const result = applyInactivityDecay(r, 100 * MS_PER_DAY);
    expect(result.mmr).toBeGreaterThanOrEqual(0);
  });

  it("updates rank after decay", () => {
    const r = makeRating({ mmr: 610, rank: "silver", lastMatchAt: 0 });
    const result = applyInactivityDecay(r, 30 * MS_PER_DAY); // 23 days decay = 230 (capped 200)
    expect(result.mmr).toBe(410);
    expect(result.rank).toBe("bronze");
  });

  it("is immutable", () => {
    const r = makeRating({ mmr: 1500, lastMatchAt: 0 });
    applyInactivityDecay(r, 20 * MS_PER_DAY);
    expect(r.mmr).toBe(1500);
  });
});

// ─── estimateMatchQuality ────────────────────────────────────

describe("estimateMatchQuality", () => {
  it("returns 1.0 for identical MMR", () => {
    const a = makeRating({ mmr: 1000 });
    const b = makeRating({ mmr: 1000 });
    expect(estimateMatchQuality(a, b)).toBe(1);
  });

  it("returns high quality for small gap", () => {
    const a = makeRating({ mmr: 1000 });
    const b = makeRating({ mmr: 1050 });
    expect(estimateMatchQuality(a, b)).toBeGreaterThan(0.9);
  });

  it("returns low quality for large gap", () => {
    const a = makeRating({ mmr: 500 });
    const b = makeRating({ mmr: 1500 });
    expect(estimateMatchQuality(a, b)).toBeLessThan(0.01);
  });

  it("is symmetric", () => {
    const a = makeRating({ mmr: 800 });
    const b = makeRating({ mmr: 1200 });
    expect(estimateMatchQuality(a, b)).toBe(estimateMatchQuality(b, a));
  });

  it("quality decreases as gap increases", () => {
    const base = makeRating({ mmr: 1000 });
    const near = makeRating({ mmr: 1100 });
    const far = makeRating({ mmr: 1400 });
    expect(estimateMatchQuality(base, near)).toBeGreaterThan(
      estimateMatchQuality(base, far),
    );
  });

  it("returns value between 0 and 1", () => {
    const a = makeRating({ mmr: 0 });
    const b = makeRating({ mmr: 3000 });
    const q = estimateMatchQuality(a, b);
    expect(q).toBeGreaterThanOrEqual(0);
    expect(q).toBeLessThanOrEqual(1);
  });
});

// ─── getLeaderboardPosition ──────────────────────────────────

describe("getLeaderboardPosition", () => {
  const board: PlayerRating[] = [
    makeRating({ mmr: 2500 }),
    makeRating({ mmr: 2000 }),
    makeRating({ mmr: 1500 }),
    makeRating({ mmr: 1000 }),
    makeRating({ mmr: 500 }),
  ];

  it("returns 1 for highest MMR", () => {
    expect(getLeaderboardPosition(board, 2500)).toBe(1);
  });

  it("returns 1 for above all", () => {
    expect(getLeaderboardPosition(board, 3000)).toBe(1);
  });

  it("returns last for lowest", () => {
    expect(getLeaderboardPosition(board, 500)).toBe(5);
  });

  it("returns position after higher-rated players", () => {
    expect(getLeaderboardPosition(board, 1500)).toBe(3);
  });

  it("returns correct position for value between entries", () => {
    expect(getLeaderboardPosition(board, 1750)).toBe(3);
  });

  it("returns last+1 for below all", () => {
    expect(getLeaderboardPosition(board, 100)).toBe(6);
  });

  it("returns 1 for empty list", () => {
    expect(getLeaderboardPosition([], 1000)).toBe(1);
  });
});

// ─── isPromotionMatch ────────────────────────────────────────

describe("isPromotionMatch", () => {
  it("true when bronze near silver threshold (600)", () => {
    const r = makeRating({ mmr: 580, rank: "bronze" });
    expect(isPromotionMatch(r)).toBe(true);
  });

  it("true when silver near gold threshold (900)", () => {
    const r = makeRating({ mmr: 875, rank: "silver" });
    expect(isPromotionMatch(r)).toBe(true);
  });

  it("false when far from next threshold", () => {
    const r = makeRating({ mmr: 700, rank: "silver" });
    expect(isPromotionMatch(r)).toBe(false);
  });

  it("false when already at or above next threshold", () => {
    const r = makeRating({ mmr: 900, rank: "silver" });
    expect(isPromotionMatch(r)).toBe(false);
  });

  it("false for legend (no higher rank)", () => {
    const r = makeRating({ mmr: 3000, rank: "legend" });
    expect(isPromotionMatch(r)).toBe(false);
  });

  it("true at exactly threshold - kFactor", () => {
    // gold → platinum threshold is 1200, kFactor = 32
    const r = makeRating({ mmr: 1168, rank: "gold" });
    expect(isPromotionMatch(r)).toBe(true);
  });

  it("false at threshold - kFactor - 1", () => {
    const r = makeRating({ mmr: 1167, rank: "gold" });
    expect(isPromotionMatch(r)).toBe(false);
  });
});

// ─── getDemotionShield ───────────────────────────────────────

describe("getDemotionShield", () => {
  let dateNowSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    dateNowSpy = vi.spyOn(Date, "now");
  });

  afterEach(() => {
    dateNowSpy.mockRestore();
  });

  it("false for bronze (cannot demote below)", () => {
    dateNowSpy.mockReturnValue(1000);
    const r = makeRating({ mmr: 10, rank: "bronze", lastMatchAt: 999 });
    expect(getDemotionShield(r)).toBe(false);
  });

  it("true for silver near floor with recent match", () => {
    const now = 1_000_000;
    dateNowSpy.mockReturnValue(now);
    const r = makeRating({
      mmr: 610,
      rank: "silver",
      lastMatchAt: now - MS_PER_DAY,
    });
    expect(getDemotionShield(r)).toBe(true);
  });

  it("false for silver near floor with old match", () => {
    const now = 1_000_000_000;
    dateNowSpy.mockReturnValue(now);
    const r = makeRating({
      mmr: 610,
      rank: "silver",
      lastMatchAt: now - 10 * MS_PER_DAY,
    });
    expect(getDemotionShield(r)).toBe(false);
  });

  it("false when safely above rank floor", () => {
    dateNowSpy.mockReturnValue(1000);
    const r = makeRating({ mmr: 700, rank: "silver", lastMatchAt: 999 });
    expect(getDemotionShield(r)).toBe(false);
  });

  it("true for gold near floor with recent match", () => {
    const now = 2_000_000;
    dateNowSpy.mockReturnValue(now);
    const r = makeRating({
      mmr: 905,
      rank: "gold",
      lastMatchAt: now - MS_PER_DAY * 2,
    });
    expect(getDemotionShield(r)).toBe(true);
  });

  it("false when exactly at grace period boundary", () => {
    const gracePeriod = 3 * MS_PER_DAY;
    const now = 10_000_000;
    dateNowSpy.mockReturnValue(now);
    // lastMatchAt exactly at boundary → elapsed === gracePeriod → NOT < gracePeriod → false
    const r = makeRating({
      mmr: 610,
      rank: "silver",
      lastMatchAt: now - gracePeriod,
    });
    expect(getDemotionShield(r)).toBe(false);
  });

  it("true when just inside grace period", () => {
    const gracePeriod = 3 * MS_PER_DAY;
    const now = 10_000_000;
    dateNowSpy.mockReturnValue(now);
    const r = makeRating({
      mmr: 610,
      rank: "silver",
      lastMatchAt: now - gracePeriod + 1,
    });
    expect(getDemotionShield(r)).toBe(true);
  });
});

// ─── Integration: full match lifecycle ───────────────────────

describe("integration", () => {
  it("10 consecutive wins build a win streak capped at 5", () => {
    let player = makeRating({ mmr: 1000 });
    const opponent = makeRating({ mmr: 1000 });

    for (let i = 0; i < 10; i++) {
      const result = calculateMatchResult(player, opponent);
      player = result.winner;
    }

    expect(player.streak).toBe(5);
    expect(player.wins).toBe(10);
  });

  it("alternating win/loss keeps streak at ±1", () => {
    let player = makeRating({ mmr: 1000 });
    const opponent = makeRating({ mmr: 1000 });

    // win
    let result = calculateMatchResult(player, opponent);
    player = result.winner;
    expect(player.streak).toBe(1);

    // loss
    result = calculateMatchResult(opponent, player);
    player = result.loser;
    expect(player.streak).toBe(-1);

    // win
    result = calculateMatchResult(player, opponent);
    player = result.winner;
    expect(player.streak).toBe(1);
  });

  it("decay + match resets lastMatchAt", () => {
    const old = makeRating({ mmr: 1500, lastMatchAt: 0 });
    const decayed = applyInactivityDecay(old, 20 * MS_PER_DAY);
    expect(decayed.mmr).toBeLessThan(1500);

    // Play a match — lastMatchAt updates
    const opponent = makeRating({ mmr: 1400 });
    const { winner } = calculateMatchResult(decayed, opponent);
    expect(winner.lastMatchAt).toBeGreaterThan(0);
  });

  it("rank progression from bronze to silver", () => {
    let player = makeRating({ mmr: 500, rank: "bronze" });
    const opponent = makeRating({ mmr: 500 });

    // Keep winning until silver
    let attempts = 0;
    while (player.rank === "bronze" && attempts < 50) {
      const result = calculateMatchResult(player, opponent);
      player = result.winner;
      attempts++;
    }

    expect(player.rank).toBe("silver");
    expect(player.mmr).toBeGreaterThanOrEqual(600);
  });
});
