/**
 * CurrencyCalc — Multi-currency wallet management with transaction logging.
 * NO Phaser imports. All functions are pure and immutable.
 */

// ── Types ──────────────────────────────────────────────────────────

export type CurrencyType = "coins" | "gems" | "tokens" | "dust" | "tickets";

export type CurrencyWallet = Readonly<Record<CurrencyType, number>>;

export interface TransactionLog {
  readonly id: number;
  readonly type: CurrencyType;
  readonly amount: number;
  readonly reason: string;
  readonly timestamp: number;
  readonly balanceBefore: number;
  readonly balanceAfter: number;
}

export interface CurrencyState {
  readonly wallet: CurrencyWallet;
  readonly transactions: readonly TransactionLog[];
  readonly nextTxId: number;
}

export interface SpendResult {
  readonly state: CurrencyState;
  readonly success: boolean;
  readonly reason: string;
}

export interface ExchangeResult {
  readonly state: CurrencyState;
  readonly success: boolean;
  readonly reason: string;
  readonly received: number;
}

// ── Constants ──────────────────────────────────────────────────────

const ALL_CURRENCY_TYPES: readonly CurrencyType[] = [
  "coins",
  "gems",
  "tokens",
  "dust",
  "tickets",
] as const;

/**
 * Exchange rates expressed as: [fromType][toType] = how many 'to' you get per 1 'from'.
 * Only direct conversions are supported.
 */
const EXCHANGE_RATES: Readonly<
  Partial<Record<CurrencyType, Partial<Record<CurrencyType, number>>>>
> = {
  coins: { gems: 1 / 100 }, // 100 coins = 1 gem
  gems: { coins: 100, tickets: 1 / 10, dust: 50 }, // reverse of dust→gem
  dust: { gems: 1 / 50 }, // 50 dust = 1 gem
  tickets: { gems: 10 }, // reverse of gem→ticket
} as const;

const EMPTY_WALLET: CurrencyWallet = {
  coins: 0,
  gems: 0,
  tokens: 0,
  dust: 0,
  tickets: 0,
} as const;

// ── Helpers ────────────────────────────────────────────────────────

function createTransaction(
  state: CurrencyState,
  type: CurrencyType,
  amount: number,
  reason: string,
  timestamp: number,
): TransactionLog {
  const balanceBefore = state.wallet[type];
  return {
    id: state.nextTxId,
    type,
    amount,
    reason,
    timestamp,
    balanceBefore,
    balanceAfter: balanceBefore + amount,
  };
}

function applyTransaction(
  state: CurrencyState,
  tx: TransactionLog,
): CurrencyState {
  return {
    wallet: { ...state.wallet, [tx.type]: tx.balanceAfter },
    transactions: [...state.transactions, tx],
    nextTxId: state.nextTxId + 1,
  };
}

// ── Public API ─────────────────────────────────────────────────────

/** Create a fresh currency state with all zero balances. */
export function createCurrencyState(): CurrencyState {
  return {
    wallet: { ...EMPTY_WALLET },
    transactions: [],
    nextTxId: 1,
  };
}

/** Add currency with a transaction log entry. Amount must be positive. */
export function addCurrency(
  state: CurrencyState,
  type: CurrencyType,
  amount: number,
  reason: string,
  timestamp: number = Date.now(),
): CurrencyState {
  if (amount <= 0) return state;
  const tx = createTransaction(state, type, amount, reason, timestamp);
  return applyTransaction(state, tx);
}

/** Deduct currency if sufficient balance. Returns success/failure with reason. */
export function spendCurrency(
  state: CurrencyState,
  type: CurrencyType,
  amount: number,
  reason: string,
  timestamp: number = Date.now(),
): SpendResult {
  if (amount <= 0) {
    return { state, success: false, reason: "Amount must be positive" };
  }
  if (state.wallet[type] < amount) {
    return {
      state,
      success: false,
      reason: `Insufficient ${type}: have ${state.wallet[type]}, need ${amount}`,
    };
  }
  const tx = createTransaction(state, type, -amount, reason, timestamp);
  return {
    state: applyTransaction(state, tx),
    success: true,
    reason: "OK",
  };
}

/** Get current balance for a currency type. */
export function getBalance(state: CurrencyState, type: CurrencyType): number {
  return state.wallet[type];
}

/** Check if balance is sufficient for a single currency cost. */
export function canAfford(
  state: CurrencyState,
  type: CurrencyType,
  amount: number,
): boolean {
  return state.wallet[type] >= amount;
}

/** Check if balance is sufficient for multiple currency costs. */
export function canAffordMultiple(
  state: CurrencyState,
  costs: Partial<CurrencyWallet>,
): boolean {
  for (const key of ALL_CURRENCY_TYPES) {
    const cost = costs[key];
    if (cost !== undefined && cost > 0 && state.wallet[key] < cost) {
      return false;
    }
  }
  return true;
}

/** Deduct multiple currencies atomically. All-or-nothing. */
export function spendMultiple(
  state: CurrencyState,
  costs: Partial<CurrencyWallet>,
  reason: string,
  timestamp: number = Date.now(),
): SpendResult {
  // Pre-check all balances
  if (!canAffordMultiple(state, costs)) {
    const shortages: string[] = [];
    for (const key of ALL_CURRENCY_TYPES) {
      const cost = costs[key];
      if (cost !== undefined && cost > 0 && state.wallet[key] < cost) {
        shortages.push(`${key}: have ${state.wallet[key]}, need ${cost}`);
      }
    }
    return {
      state,
      success: false,
      reason: `Insufficient funds: ${shortages.join("; ")}`,
    };
  }

  // Apply all deductions
  let current = state;
  for (const key of ALL_CURRENCY_TYPES) {
    const cost = costs[key];
    if (cost !== undefined && cost > 0) {
      const tx = createTransaction(current, key, -cost, reason, timestamp);
      current = applyTransaction(current, tx);
    }
  }

  return { state: current, success: true, reason: "OK" };
}

/** Get the exchange rate from one currency to another. Returns 0 if no direct conversion. */
export function getExchangeRate(from: CurrencyType, to: CurrencyType): number {
  if (from === to) return 1;
  return EXCHANGE_RATES[from]?.[to] ?? 0;
}

/** Convert currencies at the defined exchange rate. */
export function exchange(
  state: CurrencyState,
  fromType: CurrencyType,
  toType: CurrencyType,
  fromAmount: number,
  timestamp: number = Date.now(),
): ExchangeResult {
  if (fromAmount <= 0) {
    return {
      state,
      success: false,
      reason: "Amount must be positive",
      received: 0,
    };
  }

  const rate = getExchangeRate(fromType, toType);
  if (rate === 0) {
    return {
      state,
      success: false,
      reason: `No exchange rate from ${fromType} to ${toType}`,
      received: 0,
    };
  }

  const received = Math.floor(fromAmount * rate);
  if (received <= 0) {
    return {
      state,
      success: false,
      reason: `Amount too small: ${fromAmount} ${fromType} converts to 0 ${toType}`,
      received: 0,
    };
  }

  // Spend source currency
  const spendResult = spendCurrency(
    state,
    fromType,
    fromAmount,
    `Exchange ${fromAmount} ${fromType} → ${received} ${toType}`,
    timestamp,
  );
  if (!spendResult.success) {
    return { state, success: false, reason: spendResult.reason, received: 0 };
  }

  // Add target currency
  const newState = addCurrency(
    spendResult.state,
    toType,
    received,
    `Exchange ${fromAmount} ${fromType} → ${received} ${toType}`,
    timestamp,
  );

  return { state: newState, success: true, reason: "OK", received };
}

/** Get transaction history, optionally filtered by type and limited. */
export function getTransactionHistory(
  state: CurrencyState,
  type?: CurrencyType,
  limit?: number,
): readonly TransactionLog[] {
  let filtered = type
    ? state.transactions.filter((tx) => tx.type === type)
    : [...state.transactions];

  if (limit !== undefined && limit > 0) {
    filtered = filtered.slice(-limit);
  }

  return filtered;
}

/** Sum of all positive (credit) transactions for a currency type. */
export function getTotalEarned(
  state: CurrencyState,
  type: CurrencyType,
): number {
  return state.transactions
    .filter((tx) => tx.type === type && tx.amount > 0)
    .reduce((sum, tx) => sum + tx.amount, 0);
}

/** Sum of all negative (debit) transactions for a currency type (returned as positive). */
export function getTotalSpent(
  state: CurrencyState,
  type: CurrencyType,
): number {
  return state.transactions
    .filter((tx) => tx.type === type && tx.amount < 0)
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
}

/** Format a currency amount for display. */
export function formatCurrency(amount: number, type: CurrencyType): string {
  const label = type;
  if (amount >= 1_000_000) {
    const val = amount / 1_000_000;
    return `${Number.isInteger(val) ? val.toString() : val.toFixed(1)}M ${label}`;
  }
  if (amount >= 1_000) {
    const val = amount / 1_000;
    return `${Number.isInteger(val) ? val.toString() : val.toFixed(1)}K ${label}`;
  }
  return `${amount} ${label}`;
}

/** Serialize state to a JSON string. */
export function serialize(state: CurrencyState): string {
  return JSON.stringify(state);
}

/** Deserialize a JSON string back into CurrencyState. */
export function deserialize(json: string): CurrencyState {
  const parsed = JSON.parse(json) as CurrencyState;
  // Ensure wallet has all keys
  const wallet: CurrencyWallet = {
    coins: parsed.wallet.coins ?? 0,
    gems: parsed.wallet.gems ?? 0,
    tokens: parsed.wallet.tokens ?? 0,
    dust: parsed.wallet.dust ?? 0,
    tickets: parsed.wallet.tickets ?? 0,
  };
  return {
    wallet,
    transactions: parsed.transactions ?? [],
    nextTxId: parsed.nextTxId ?? 1,
  };
}
