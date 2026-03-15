import { describe, it, expect } from "vitest";
import {
  createCurrencyState,
  addCurrency,
  spendCurrency,
  getBalance,
  canAfford,
  canAffordMultiple,
  spendMultiple,
  exchange,
  getExchangeRate,
  getTransactionHistory,
  getTotalEarned,
  getTotalSpent,
  formatCurrency,
  serialize,
  deserialize,
  type CurrencyState,
  type CurrencyType,
} from "../../src/core/CurrencyCalc";

// ── createCurrencyState ────────────────────────────────────────────

describe("createCurrencyState", () => {
  it("initializes all balances to zero", () => {
    const state = createCurrencyState();
    expect(state.wallet.coins).toBe(0);
    expect(state.wallet.gems).toBe(0);
    expect(state.wallet.tokens).toBe(0);
    expect(state.wallet.dust).toBe(0);
    expect(state.wallet.tickets).toBe(0);
  });

  it("starts with empty transaction log", () => {
    const state = createCurrencyState();
    expect(state.transactions).toHaveLength(0);
  });

  it("starts nextTxId at 1", () => {
    const state = createCurrencyState();
    expect(state.nextTxId).toBe(1);
  });
});

// ── addCurrency ────────────────────────────────────────────────────

describe("addCurrency", () => {
  it("adds coins and records transaction", () => {
    const state = addCurrency(
      createCurrencyState(),
      "coins",
      100,
      "kill reward",
      1000,
    );
    expect(state.wallet.coins).toBe(100);
    expect(state.transactions).toHaveLength(1);
    expect(state.transactions[0].amount).toBe(100);
    expect(state.transactions[0].reason).toBe("kill reward");
  });

  it("increments nextTxId", () => {
    const s1 = addCurrency(createCurrencyState(), "coins", 50, "a", 1000);
    const s2 = addCurrency(s1, "gems", 10, "b", 1001);
    expect(s2.nextTxId).toBe(3);
    expect(s2.transactions[0].id).toBe(1);
    expect(s2.transactions[1].id).toBe(2);
  });

  it("ignores zero amount", () => {
    const state = addCurrency(createCurrencyState(), "coins", 0, "nothing");
    expect(state.wallet.coins).toBe(0);
    expect(state.transactions).toHaveLength(0);
  });

  it("ignores negative amount", () => {
    const state = addCurrency(createCurrencyState(), "coins", -50, "cheat");
    expect(state.wallet.coins).toBe(0);
    expect(state.transactions).toHaveLength(0);
  });

  it("records balanceBefore and balanceAfter correctly", () => {
    const s1 = addCurrency(createCurrencyState(), "gems", 20, "iap", 1000);
    const s2 = addCurrency(s1, "gems", 30, "drop", 1001);
    const tx = s2.transactions[1];
    expect(tx.balanceBefore).toBe(20);
    expect(tx.balanceAfter).toBe(50);
  });

  it("does not mutate original state", () => {
    const original = createCurrencyState();
    addCurrency(original, "coins", 100, "test");
    expect(original.wallet.coins).toBe(0);
    expect(original.transactions).toHaveLength(0);
  });
});

// ── spendCurrency ──────────────────────────────────────────────────

describe("spendCurrency", () => {
  it("deducts when sufficient balance", () => {
    const state = addCurrency(
      createCurrencyState(),
      "coins",
      200,
      "earn",
      1000,
    );
    const result = spendCurrency(state, "coins", 80, "buy item", 1001);
    expect(result.success).toBe(true);
    expect(result.state.wallet.coins).toBe(120);
    expect(result.reason).toBe("OK");
  });

  it("fails when insufficient balance", () => {
    const state = addCurrency(createCurrencyState(), "coins", 50, "earn");
    const result = spendCurrency(state, "coins", 100, "too expensive");
    expect(result.success).toBe(false);
    expect(result.reason).toContain("Insufficient");
    expect(result.state.wallet.coins).toBe(50); // unchanged
  });

  it("fails for zero amount", () => {
    const state = addCurrency(createCurrencyState(), "coins", 100, "earn");
    const result = spendCurrency(state, "coins", 0, "free?");
    expect(result.success).toBe(false);
  });

  it("fails for negative amount", () => {
    const state = addCurrency(createCurrencyState(), "coins", 100, "earn");
    const result = spendCurrency(state, "coins", -10, "negative");
    expect(result.success).toBe(false);
  });

  it("records negative amount in transaction log", () => {
    const state = addCurrency(createCurrencyState(), "gems", 50, "iap", 1000);
    const result = spendCurrency(state, "gems", 30, "gacha pull", 1001);
    const tx = result.state.transactions[1];
    expect(tx.amount).toBe(-30);
    expect(tx.balanceBefore).toBe(50);
    expect(tx.balanceAfter).toBe(20);
  });

  it("allows spending exact balance (to zero)", () => {
    const state = addCurrency(createCurrencyState(), "tickets", 5, "earn");
    const result = spendCurrency(state, "tickets", 5, "spend all");
    expect(result.success).toBe(true);
    expect(result.state.wallet.tickets).toBe(0);
  });
});

// ── getBalance ─────────────────────────────────────────────────────

describe("getBalance", () => {
  it("returns zero for fresh state", () => {
    expect(getBalance(createCurrencyState(), "coins")).toBe(0);
  });

  it("returns current balance after operations", () => {
    let state = addCurrency(createCurrencyState(), "dust", 200, "dupes");
    state = addCurrency(state, "dust", 100, "more dupes");
    expect(getBalance(state, "dust")).toBe(300);
  });
});

// ── canAfford ──────────────────────────────────────────────────────

describe("canAfford", () => {
  it("returns true when balance is sufficient", () => {
    const state = addCurrency(createCurrencyState(), "coins", 100, "earn");
    expect(canAfford(state, "coins", 50)).toBe(true);
  });

  it("returns true when balance equals cost", () => {
    const state = addCurrency(createCurrencyState(), "coins", 100, "earn");
    expect(canAfford(state, "coins", 100)).toBe(true);
  });

  it("returns false when balance is insufficient", () => {
    const state = addCurrency(createCurrencyState(), "coins", 100, "earn");
    expect(canAfford(state, "coins", 101)).toBe(false);
  });

  it("returns true for zero cost", () => {
    expect(canAfford(createCurrencyState(), "coins", 0)).toBe(true);
  });
});

// ── canAffordMultiple ──────────────────────────────────────────────

describe("canAffordMultiple", () => {
  it("returns true when all currencies sufficient", () => {
    let state = addCurrency(createCurrencyState(), "coins", 100, "a");
    state = addCurrency(state, "gems", 10, "b");
    expect(canAffordMultiple(state, { coins: 50, gems: 5 })).toBe(true);
  });

  it("returns false when one currency insufficient", () => {
    let state = addCurrency(createCurrencyState(), "coins", 100, "a");
    state = addCurrency(state, "gems", 3, "b");
    expect(canAffordMultiple(state, { coins: 50, gems: 5 })).toBe(false);
  });

  it("returns true for empty costs", () => {
    expect(canAffordMultiple(createCurrencyState(), {})).toBe(true);
  });
});

// ── spendMultiple ──────────────────────────────────────────────────

describe("spendMultiple", () => {
  it("deducts multiple currencies atomically", () => {
    let state = addCurrency(createCurrencyState(), "coins", 200, "a", 1000);
    state = addCurrency(state, "gems", 50, "b", 1001);
    const result = spendMultiple(
      state,
      { coins: 100, gems: 10 },
      "craft item",
      1002,
    );
    expect(result.success).toBe(true);
    expect(result.state.wallet.coins).toBe(100);
    expect(result.state.wallet.gems).toBe(40);
  });

  it("fails atomically — no partial deductions", () => {
    let state = addCurrency(createCurrencyState(), "coins", 200, "a");
    state = addCurrency(state, "gems", 2, "b");
    const result = spendMultiple(
      state,
      { coins: 100, gems: 10 },
      "too expensive",
    );
    expect(result.success).toBe(false);
    expect(result.state.wallet.coins).toBe(200); // untouched
    expect(result.state.wallet.gems).toBe(2); // untouched
  });

  it("records separate transactions for each currency", () => {
    let state = addCurrency(createCurrencyState(), "coins", 100, "a", 1000);
    state = addCurrency(state, "gems", 100, "b", 1001);
    state = addCurrency(state, "dust", 100, "c", 1002);
    const result = spendMultiple(
      state,
      { coins: 10, gems: 5, dust: 20 },
      "multi",
      1003,
    );
    // 3 add txs + 3 spend txs = 6 total
    expect(result.state.transactions).toHaveLength(6);
  });

  it("includes failure reason with shortage details", () => {
    const result = spendMultiple(createCurrencyState(), { coins: 10 }, "buy");
    expect(result.success).toBe(false);
    expect(result.reason).toContain("coins");
  });
});

// ── getExchangeRate ────────────────────────────────────────────────

describe("getExchangeRate", () => {
  it("coins → gems = 0.01 (100 coins = 1 gem)", () => {
    expect(getExchangeRate("coins", "gems")).toBeCloseTo(0.01);
  });

  it("gems → coins = 100", () => {
    expect(getExchangeRate("gems", "coins")).toBe(100);
  });

  it("gems → tickets = 0.1 (10 gems = 1 ticket)", () => {
    expect(getExchangeRate("gems", "tickets")).toBeCloseTo(0.1);
  });

  it("dust → gems = 0.02 (50 dust = 1 gem)", () => {
    expect(getExchangeRate("dust", "gems")).toBeCloseTo(0.02);
  });

  it("same type = 1", () => {
    expect(getExchangeRate("coins", "coins")).toBe(1);
  });

  it("unsupported conversion = 0", () => {
    expect(getExchangeRate("coins", "tickets")).toBe(0);
    expect(getExchangeRate("tokens", "gems")).toBe(0);
  });
});

// ── exchange ───────────────────────────────────────────────────────

describe("exchange", () => {
  it("converts 100 coins to 1 gem", () => {
    const state = addCurrency(
      createCurrencyState(),
      "coins",
      500,
      "farm",
      1000,
    );
    const result = exchange(state, "coins", "gems", 100, 1001);
    expect(result.success).toBe(true);
    expect(result.received).toBe(1);
    expect(result.state.wallet.coins).toBe(400);
    expect(result.state.wallet.gems).toBe(1);
  });

  it("converts 200 coins to 2 gems", () => {
    const state = addCurrency(
      createCurrencyState(),
      "coins",
      500,
      "farm",
      1000,
    );
    const result = exchange(state, "coins", "gems", 200, 1001);
    expect(result.success).toBe(true);
    expect(result.received).toBe(2);
  });

  it("floors fractional results (99 coins → 0 gems = fail)", () => {
    const state = addCurrency(createCurrencyState(), "coins", 99, "farm");
    const result = exchange(state, "coins", "gems", 99);
    expect(result.success).toBe(false);
    expect(result.reason).toContain("too small");
  });

  it("fails for unsupported conversion", () => {
    const state = addCurrency(createCurrencyState(), "coins", 1000, "farm");
    const result = exchange(state, "coins", "tickets", 100);
    expect(result.success).toBe(false);
    expect(result.reason).toContain("No exchange rate");
  });

  it("fails for insufficient balance", () => {
    const state = addCurrency(createCurrencyState(), "coins", 50, "farm");
    const result = exchange(state, "coins", "gems", 100);
    expect(result.success).toBe(false);
    expect(result.reason).toContain("Insufficient");
  });

  it("fails for zero amount", () => {
    const state = addCurrency(createCurrencyState(), "coins", 100, "farm");
    const result = exchange(state, "coins", "gems", 0);
    expect(result.success).toBe(false);
  });

  it("fails for negative amount", () => {
    const state = addCurrency(createCurrencyState(), "coins", 100, "farm");
    const result = exchange(state, "coins", "gems", -10);
    expect(result.success).toBe(false);
  });

  it("converts 50 dust to 1 gem", () => {
    const state = addCurrency(createCurrencyState(), "dust", 150, "dupes");
    const result = exchange(state, "dust", "gems", 50);
    expect(result.success).toBe(true);
    expect(result.received).toBe(1);
    expect(result.state.wallet.dust).toBe(100);
    expect(result.state.wallet.gems).toBe(1);
  });

  it("converts 10 gems to 1 ticket", () => {
    const state = addCurrency(createCurrencyState(), "gems", 30, "iap");
    const result = exchange(state, "gems", "tickets", 10);
    expect(result.success).toBe(true);
    expect(result.received).toBe(1);
    expect(result.state.wallet.gems).toBe(20);
    expect(result.state.wallet.tickets).toBe(1);
  });

  it("creates two transaction entries (spend + receive)", () => {
    const state = addCurrency(
      createCurrencyState(),
      "coins",
      200,
      "farm",
      1000,
    );
    const result = exchange(state, "coins", "gems", 100, 1001);
    // 1 add + 1 spend + 1 add = 3 transactions total
    expect(result.state.transactions).toHaveLength(3);
  });
});

// ── getTransactionHistory ──────────────────────────────────────────

describe("getTransactionHistory", () => {
  it("returns all transactions when no filter", () => {
    let state = addCurrency(createCurrencyState(), "coins", 100, "a");
    state = addCurrency(state, "gems", 10, "b");
    expect(getTransactionHistory(state)).toHaveLength(2);
  });

  it("filters by currency type", () => {
    let state = addCurrency(createCurrencyState(), "coins", 100, "a");
    state = addCurrency(state, "gems", 10, "b");
    state = addCurrency(state, "coins", 50, "c");
    expect(getTransactionHistory(state, "coins")).toHaveLength(2);
    expect(getTransactionHistory(state, "gems")).toHaveLength(1);
  });

  it("limits result count (most recent)", () => {
    let state = createCurrencyState();
    for (let i = 0; i < 10; i++) {
      state = addCurrency(state, "coins", 10, `tx-${i}`);
    }
    const last3 = getTransactionHistory(state, undefined, 3);
    expect(last3).toHaveLength(3);
    expect(last3[0].reason).toBe("tx-7");
    expect(last3[2].reason).toBe("tx-9");
  });

  it("returns empty for type with no transactions", () => {
    const state = addCurrency(createCurrencyState(), "coins", 100, "a");
    expect(getTransactionHistory(state, "gems")).toHaveLength(0);
  });
});

// ── getTotalEarned / getTotalSpent ─────────────────────────────────

describe("getTotalEarned", () => {
  it("sums all positive transactions for a type", () => {
    let state = addCurrency(createCurrencyState(), "coins", 100, "a");
    state = addCurrency(state, "coins", 200, "b");
    state = addCurrency(state, "gems", 50, "c");
    expect(getTotalEarned(state, "coins")).toBe(300);
    expect(getTotalEarned(state, "gems")).toBe(50);
  });

  it("returns zero when no earnings", () => {
    expect(getTotalEarned(createCurrencyState(), "coins")).toBe(0);
  });
});

describe("getTotalSpent", () => {
  it("sums all negative transactions as positive", () => {
    let state = addCurrency(createCurrencyState(), "coins", 500, "earn");
    const r1 = spendCurrency(state, "coins", 100, "buy a");
    const r2 = spendCurrency(r1.state, "coins", 50, "buy b");
    expect(getTotalSpent(r2.state, "coins")).toBe(150);
  });

  it("returns zero when nothing spent", () => {
    const state = addCurrency(createCurrencyState(), "coins", 100, "earn");
    expect(getTotalSpent(state, "coins")).toBe(0);
  });
});

// ── formatCurrency ─────────────────────────────────────────────────

describe("formatCurrency", () => {
  it("formats small amounts normally", () => {
    expect(formatCurrency(500, "gems")).toBe("500 gems");
    expect(formatCurrency(0, "coins")).toBe("0 coins");
  });

  it("formats thousands with K suffix", () => {
    expect(formatCurrency(1200, "coins")).toBe("1.2K coins");
    expect(formatCurrency(5000, "dust")).toBe("5K dust");
  });

  it("formats millions with M suffix", () => {
    expect(formatCurrency(1500000, "coins")).toBe("1.5M coins");
    expect(formatCurrency(2000000, "coins")).toBe("2M coins");
  });

  it("handles exact K boundary", () => {
    expect(formatCurrency(1000, "coins")).toBe("1K coins");
  });
});

// ── serialize / deserialize ────────────────────────────────────────

describe("serialize / deserialize", () => {
  it("round-trips a state with transactions", () => {
    let state = addCurrency(createCurrencyState(), "coins", 250, "farm", 1000);
    state = addCurrency(state, "gems", 15, "iap", 1001);
    const result = spendCurrency(state, "coins", 50, "buy", 1002);
    state = result.state;

    const json = serialize(state);
    const restored = deserialize(json);

    expect(restored.wallet.coins).toBe(200);
    expect(restored.wallet.gems).toBe(15);
    expect(restored.transactions).toHaveLength(3);
    expect(restored.nextTxId).toBe(4);
  });

  it("handles empty state", () => {
    const state = createCurrencyState();
    const restored = deserialize(serialize(state));
    expect(restored.wallet.coins).toBe(0);
    expect(restored.transactions).toHaveLength(0);
    expect(restored.nextTxId).toBe(1);
  });

  it("handles missing wallet keys gracefully", () => {
    const partial = JSON.stringify({
      wallet: { coins: 10 },
      transactions: [],
      nextTxId: 1,
    });
    const restored = deserialize(partial);
    expect(restored.wallet.coins).toBe(10);
    expect(restored.wallet.gems).toBe(0);
    expect(restored.wallet.dust).toBe(0);
  });
});

// ── Immutability ───────────────────────────────────────────────────

describe("immutability", () => {
  it("addCurrency returns new state", () => {
    const s1 = createCurrencyState();
    const s2 = addCurrency(s1, "coins", 100, "test");
    expect(s1).not.toBe(s2);
    expect(s1.wallet).not.toBe(s2.wallet);
  });

  it("spendCurrency returns new state", () => {
    const s1 = addCurrency(createCurrencyState(), "coins", 100, "earn");
    const { state: s2 } = spendCurrency(s1, "coins", 50, "buy");
    expect(s1).not.toBe(s2);
    expect(s1.wallet.coins).toBe(100);
  });

  it("exchange returns new state", () => {
    const s1 = addCurrency(createCurrencyState(), "coins", 200, "earn");
    const { state: s2 } = exchange(s1, "coins", "gems", 100);
    expect(s1).not.toBe(s2);
    expect(s1.wallet.coins).toBe(200);
    expect(s1.wallet.gems).toBe(0);
  });
});
