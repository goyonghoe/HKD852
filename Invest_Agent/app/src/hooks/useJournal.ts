import { useState, useEffect, useCallback } from "react";
import type { JournalEntry } from "@/lib/journal/store";
import {
  getEntries,
  addEntry,
  removeEntry,
  updateEntry,
} from "@/lib/journal/store";

type FilterType = "all" | "buy" | "sell";

interface UseJournalResult {
  entries: JournalEntry[];
  filtered: JournalEntry[];
  filter: FilterType;
  setFilter: (f: FilterType) => void;
  add: (entry: Omit<JournalEntry, "id" | "createdAt">) => void;
  remove: (id: string) => void;
  update: (id: string, updates: Partial<Omit<JournalEntry, "id" | "createdAt">>) => void;
  totalBuyAmount: number;
  totalSellAmount: number;
  entryCount: number;
}

export function useJournal(): UseJournalResult {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    setEntries(getEntries());
  }, []);

  const add = useCallback(
    (entry: Omit<JournalEntry, "id" | "createdAt">) => {
      addEntry(entry);
      setEntries(getEntries());
    },
    []
  );

  const remove = useCallback((id: string) => {
    removeEntry(id);
    setEntries(getEntries());
  }, []);

  const update = useCallback(
    (id: string, updates: Partial<Omit<JournalEntry, "id" | "createdAt">>) => {
      updateEntry(id, updates);
      setEntries(getEntries());
    },
    []
  );

  const filtered =
    filter === "all" ? entries : entries.filter((e) => e.type === filter);

  const totalBuyAmount = entries
    .filter((e) => e.type === "buy")
    .reduce((sum, e) => sum + e.price * e.quantity, 0);

  const totalSellAmount = entries
    .filter((e) => e.type === "sell")
    .reduce((sum, e) => sum + e.price * e.quantity, 0);

  return {
    entries,
    filtered,
    filter,
    setFilter,
    add,
    remove,
    update,
    totalBuyAmount,
    totalSellAmount,
    entryCount: entries.length,
  };
}
