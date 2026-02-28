/**
 * 투자 일지 localStorage CRUD
 * 전략 §5.2 — 매수/매도 기록 + 인과관계 훈련
 */

export interface JournalEntry {
  id: string;
  type: "buy" | "sell";
  code: string;
  name: string;
  price: number;
  quantity: number;
  date: string;
  reason: "growth" | "undervalued";
  stopLossPrice: number;
  memo: string;
  causeAnalysis: string;
  createdAt: string;
}

const STORAGE_KEY = "invest_journal";

function generateId(): string {
  return `j_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export function getEntries(): JournalEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as JournalEntry[];
  } catch {
    return [];
  }
}

export function addEntry(
  entry: Omit<JournalEntry, "id" | "createdAt">
): JournalEntry {
  const entries = getEntries();
  const newEntry: JournalEntry = {
    ...entry,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  entries.unshift(newEntry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  return newEntry;
}

export function removeEntry(id: string): void {
  const entries = getEntries().filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function updateEntry(
  id: string,
  updates: Partial<Omit<JournalEntry, "id" | "createdAt">>
): void {
  const entries = getEntries().map((e) =>
    e.id === id ? { ...e, ...updates } : e
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}
