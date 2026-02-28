import { useState, useEffect, useCallback } from "react";

interface IndexData {
  name: string;
  code: string;
  closePrice: number;
  change: number;
  changePercent: number;
  volume: string;
  high: number;
  low: number;
  open: number;
  high52w: number;
  low52w: number;
  tradedAt: string;
}

interface ExchangeRate {
  usdkrw: number;
  change: number;
  changePercent: number;
}

interface MarketSummaryData {
  indices: IndexData[];
  exchangeRate: ExchangeRate | null;
  fetchedAt: string;
  cached: boolean;
}

interface UseMarketSummaryResult {
  data: MarketSummaryData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useMarketSummary(): UseMarketSummaryResult {
  const [data, setData] = useState<MarketSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/market/summary");
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json: MarketSummaryData = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "시장 데이터 로드 실패");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
