"use client";

import { useMemo } from "react";
import Header from "@/components/layout/Header";
import MarketSummary from "@/components/briefing/MarketSummary";
import RateTracker from "@/components/briefing/RateTracker";
import DividendCalendar from "@/components/briefing/DividendCalendar";
import { useMarketSummary } from "@/hooks/useMarketSummary";
import { useStockData } from "@/hooks/useStockData";

export default function BriefingPage() {
  const { data: marketData, loading: marketLoading, refetch } = useMarketSummary();
  const { data: stockData, loading: stockLoading } = useStockData("ALL");

  const topDividend = useMemo(() => {
    return [...stockData]
      .filter((s) => s.dividendYield > 0)
      .sort((a, b) => b.dividendYield - a.dividendYield);
  }, [stockData]);

  const pbrStats = useMemo(() => {
    const withPbr = stockData.filter((s) => s.pbr > 0);
    const underOne = withPbr.filter((s) => s.pbr < 1);
    return {
      count: underOne.length,
      percent: withPbr.length > 0 ? (underOne.length / withPbr.length) * 100 : 0,
      total: withPbr.length,
    };
  }, [stockData]);

  const loading = marketLoading || stockLoading;

  return (
    <div className="min-h-screen">
      <Header
        fetchedAt={marketData?.fetchedAt || null}
        cached={marketData?.cached || false}
      />

      <main className="max-w-[1440px] mx-auto px-6 py-5 space-y-5">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-text-primary">시장 브리핑</h2>
            <p className="text-xs text-text-dim mt-0.5">
              투자 전략 기반 일일 시장 현황 (FOMO 방지 — 숫자만 봅니다)
            </p>
          </div>
          <button
            onClick={refetch}
            disabled={loading}
            className="px-3 py-1.5 bg-surface border border-surface-border rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface-light transition-colors disabled:opacity-50"
          >
            {loading ? "갱신 중..." : "새로고침"}
          </button>
        </div>

        {/* Market Indices */}
        <MarketSummary
          indices={marketData?.indices || []}
          exchangeRate={marketData?.exchangeRate || null}
          loading={marketLoading}
        />

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-5">
          {/* Left: Dividend & PBR */}
          <DividendCalendar
            topDividendStocks={topDividend}
            loading={stockLoading}
            pbrUnderOneCount={pbrStats.count}
            pbrUnderOnePercent={pbrStats.percent}
            totalStocks={pbrStats.total}
          />

          {/* Right: Rate Tracker */}
          <div className="space-y-4">
            <RateTracker loading={marketLoading} />

            {/* CLI Skill Reminder */}
            <div className="bg-surface border border-surface-border rounded-xl p-5">
              <h3 className="text-sm font-medium text-text-secondary mb-3">
                CLI 스킬
              </h3>
              <div className="space-y-2 text-xs text-text-dim">
                <div className="flex items-center gap-2">
                  <code className="bg-surface-light px-2 py-1 rounded text-accent">
                    /market-brief
                  </code>
                  <span>실시간 금리 포함 종합 브리핑</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="bg-surface-light px-2 py-1 rounded text-accent">
                    /invest-screen
                  </code>
                  <span>밸류에이션 스크리닝</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="bg-surface-light px-2 py-1 rounded text-accent">
                    /invest-review 005930
                  </code>
                  <span>종목 심층 분석</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
