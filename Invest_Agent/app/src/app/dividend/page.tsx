"use client";

import { useState, useCallback } from "react";
import type { MarketType, SortField, SortDirection } from "@/lib/krx/types";
import { useStockData } from "@/hooks/useStockData";
import { useDebounce } from "@/hooks/useDebounce";
import Header from "@/components/layout/Header";
import SummaryCards from "@/components/dashboard/SummaryCards";
import StockTable from "@/components/dashboard/StockTable";
import MarketFilter from "@/components/dashboard/MarketFilter";
import SearchBar from "@/components/dashboard/SearchBar";
import TopDividendChart from "@/components/dashboard/TopDividendChart";

export default function DashboardPage() {
  const [market, setMarket] = useState<MarketType>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("dividendYield");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const debouncedSearch = useDebounce(searchQuery);
  const { data, loading, loadingFull, error, meta, refetch } =
    useStockData(market);

  const handleSort = useCallback(
    (field: SortField) => {
      if (field === sortField) {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDirection(field === "name" || field === "code" ? "asc" : "desc");
      }
    },
    [sortField],
  );

  return (
    <div className="min-h-screen">
      <Header
        fetchedAt={meta?.fetchedAt || null}
        cached={meta?.cached || false}
      />

      <main className="max-w-[1440px] mx-auto px-6 py-5 space-y-5">
        {/* Summary Cards */}
        <SummaryCards data={data} loading={loading} />

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <MarketFilter value={market} onChange={setMarket} />
          <div className="w-64">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
          <button
            onClick={refetch}
            disabled={loading}
            className="px-3 py-1.5 bg-surface border border-surface-border rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface-light transition-colors disabled:opacity-50"
          >
            {loading ? "로딩 중..." : "새로고침"}
          </button>

          {/* Full data loading indicator */}
          {loadingFull && (
            <span className="text-xs text-text-dim flex items-center gap-1.5">
              <span className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              전체 종목 로딩 중...
            </span>
          )}

          {/* Partial data indicator */}
          {meta?.partial && !loadingFull && (
            <span className="text-xs text-gold">Top 30 표시 중</span>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-loss-dim border border-loss/30 rounded-xl p-4 text-sm text-loss">
            {error}
            <button
              onClick={refetch}
              className="ml-3 underline hover:no-underline"
            >
              재시도
            </button>
          </div>
        )}

        {/* Main Content: Table + Chart */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5">
          <StockTable
            data={data}
            loading={loading}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            searchQuery={debouncedSearch}
          />
          <div className="hidden xl:block">
            <div className="sticky top-16">
              <TopDividendChart data={data} loading={loading} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
