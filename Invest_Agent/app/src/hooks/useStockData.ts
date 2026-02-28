import { useState, useEffect, useCallback } from "react";
import type { StockItem, MarketType, DividendApiResponse } from "@/lib/krx/types";

interface UseStockDataResult {
  data: StockItem[];
  loading: boolean;
  error: string | null;
  meta: DividendApiResponse["meta"] | null;
  refetch: () => void;
}

export function useStockData(market: MarketType): UseStockDataResult {
  const [data, setData] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<DividendApiResponse["meta"] | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ market });
      const res = await fetch(`/api/krx/dividend?${params}`);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const json: DividendApiResponse = await res.json();
      setData(json.data);
      setMeta(json.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터 로드 실패");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [market]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, meta, refetch: fetchData };
}
