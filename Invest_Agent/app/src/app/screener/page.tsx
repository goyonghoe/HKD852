"use client";

import { useState, useMemo, useCallback } from "react";
import type { MarketType, SortField, SortDirection } from "@/lib/krx/types";
import { useStockData } from "@/hooks/useStockData";
import { useDebounce } from "@/hooks/useDebounce";
import Header from "@/components/layout/Header";
import StockTable from "@/components/dashboard/StockTable";
import FilterPanel, {
  DEFAULT_FILTERS,
  type ScreenerFilters,
} from "@/components/screener/FilterPanel";

export default function ScreenerPage() {
  const [filters, setFilters] = useState<ScreenerFilters>(DEFAULT_FILTERS);
  const [sortField, setSortField] = useState<SortField>("dividendYield");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const debouncedSearch = useDebounce(filters.searchQuery);
  const { data, loading, meta } = useStockData(filters.market as MarketType);

  const filtered = useMemo(() => {
    return data.filter((s) => {
      if (s.pbr > 0 && s.pbr > filters.pbrMax) return false;
      if (s.per > 0 && s.per > filters.perMax) return false;
      if (s.dividendYield < filters.dividendYieldMin) return false;
      return true;
    });
  }, [data, filters.pbrMax, filters.perMax, filters.dividendYieldMin]);

  const handleSort = useCallback(
    (field: SortField) => {
      if (field === sortField) {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDirection(field === "name" || field === "code" ? "asc" : "desc");
      }
    },
    [sortField]
  );

  return (
    <div className="min-h-screen">
      <Header
        fetchedAt={meta?.fetchedAt || null}
        cached={meta?.cached || false}
      />

      <main className="max-w-[1440px] mx-auto px-6 py-5 space-y-5">
        <FilterPanel
          filters={filters}
          onChange={setFilters}
          resultCount={filtered.length}
          totalCount={data.length}
        />

        <StockTable
          data={filtered}
          loading={loading}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          searchQuery={debouncedSearch}
        />
      </main>
    </div>
  );
}
