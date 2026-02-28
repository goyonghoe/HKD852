import { useState, useEffect, useCallback } from "react";
import type { PortfolioHolding } from "@/lib/portfolio/store";
import {
  getHoldings,
  addHolding,
  removeHolding,
  updateHighestPrice,
} from "@/lib/portfolio/store";

interface CurrentPrice {
  code: string;
  price: number;
  change: number;
  changePercent: number;
}

interface UsePortfolioResult {
  holdings: PortfolioHolding[];
  prices: Map<string, CurrentPrice>;
  loading: boolean;
  add: (holding: Omit<PortfolioHolding, "id">) => void;
  remove: (id: string) => void;
  refreshPrices: () => Promise<void>;
}

export function usePortfolio(): UsePortfolioResult {
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [prices, setPrices] = useState<Map<string, CurrentPrice>>(new Map());
  const [loading, setLoading] = useState(false);

  // Load holdings from localStorage
  useEffect(() => {
    setHoldings(getHoldings());
  }, []);

  const add = useCallback(
    (holding: Omit<PortfolioHolding, "id">) => {
      addHolding(holding);
      setHoldings(getHoldings());
    },
    []
  );

  const remove = useCallback((id: string) => {
    removeHolding(id);
    setHoldings(getHoldings());
  }, []);

  const refreshPrices = useCallback(async () => {
    if (holdings.length === 0) return;
    setLoading(true);

    try {
      const codes = Array.from(new Set(holdings.map((h) => h.code)));
      const results = new Map<string, CurrentPrice>();

      // Fetch prices in parallel (max 10 concurrent)
      const batchSize = 10;
      for (let i = 0; i < codes.length; i += batchSize) {
        const batch = codes.slice(i, i + batchSize);
        const promises = batch.map(async (code) => {
          try {
            const res = await fetch(`/api/stock/${code}`);
            if (!res.ok) return null;
            const json = await res.json();
            return {
              code,
              price: json.closePrice ?? 0,
              change: json.change ?? 0,
              changePercent: json.changePercent ?? 0,
            };
          } catch {
            return null;
          }
        });

        const settled = await Promise.allSettled(promises);
        for (const result of settled) {
          if (result.status === "fulfilled" && result.value) {
            results.set(result.value.code, result.value);
            // Update highest price tracking
            for (const h of holdings) {
              if (
                h.code === result.value.code &&
                result.value.price > h.highestPrice
              ) {
                updateHighestPrice(h.id, result.value.price);
              }
            }
          }
        }
      }

      setPrices(results);
      // Refresh holdings to pick up any highestPrice updates
      setHoldings(getHoldings());
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [holdings]);

  // Auto-fetch prices when holdings change
  useEffect(() => {
    if (holdings.length > 0) {
      refreshPrices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holdings.length]);

  return { holdings, prices, loading, add, remove, refreshPrices };
}
