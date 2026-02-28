"use client";

export interface ScreenerFilters {
  market: "ALL" | "KOSPI" | "KOSDAQ";
  pbrMax: number;
  perMax: number;
  dividendYieldMin: number;
  searchQuery: string;
}

interface FilterPanelProps {
  filters: ScreenerFilters;
  onChange: (filters: ScreenerFilters) => void;
  resultCount: number;
  totalCount: number;
}

export const DEFAULT_FILTERS: ScreenerFilters = {
  market: "ALL",
  pbrMax: 1,
  perMax: 15,
  dividendYieldMin: 3,
  searchQuery: "",
};

const MARKETS: Array<"ALL" | "KOSPI" | "KOSDAQ"> = ["ALL", "KOSPI", "KOSDAQ"];
const MARKET_LABELS: Record<string, string> = {
  ALL: "전체",
  KOSPI: "KOSPI",
  KOSDAQ: "KOSDAQ",
};

export default function FilterPanel({
  filters,
  onChange,
  resultCount,
  totalCount,
}: FilterPanelProps) {
  const update = (partial: Partial<ScreenerFilters>) =>
    onChange({ ...filters, ...partial });

  return (
    <div className="bg-surface border border-surface-border rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-text-primary">
          밸류에이션 스크리너
        </h2>
        <span className="text-sm text-text-secondary">
          {resultCount.toLocaleString()}개 / {totalCount.toLocaleString()}개
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Market Filter */}
        <div>
          <label className="block text-xs text-text-dim mb-1.5">시장</label>
          <div className="flex rounded-lg overflow-hidden border border-surface-border">
            {MARKETS.map((m) => (
              <button
                key={m}
                onClick={() => update({ market: m })}
                className={`flex-1 px-2 py-1.5 text-xs font-medium transition-colors ${
                  filters.market === m
                    ? "bg-accent text-white"
                    : "bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-light"
                }`}
              >
                {MARKET_LABELS[m]}
              </button>
            ))}
          </div>
        </div>

        {/* PBR Max */}
        <div>
          <label className="block text-xs text-text-dim mb-1.5">
            PBR 상한 (저평가)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0.1}
              max={5}
              step={0.1}
              value={filters.pbrMax}
              onChange={(e) => update({ pbrMax: parseFloat(e.target.value) })}
              className="flex-1 accent-accent"
            />
            <span className="text-sm text-text-primary tabular-nums w-10 text-right">
              {filters.pbrMax.toFixed(1)}
            </span>
          </div>
        </div>

        {/* PER Max */}
        <div>
          <label className="block text-xs text-text-dim mb-1.5">
            PER 상한
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={1}
              max={50}
              step={1}
              value={filters.perMax}
              onChange={(e) => update({ perMax: parseInt(e.target.value) })}
              className="flex-1 accent-accent"
            />
            <span className="text-sm text-text-primary tabular-nums w-10 text-right">
              {filters.perMax}
            </span>
          </div>
        </div>

        {/* Dividend Yield Min */}
        <div>
          <label className="block text-xs text-text-dim mb-1.5">
            배당수익률 하한
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={10}
              step={0.5}
              value={filters.dividendYieldMin}
              onChange={(e) =>
                update({ dividendYieldMin: parseFloat(e.target.value) })
              }
              className="flex-1 accent-profit"
            />
            <span className="text-sm text-profit tabular-nums w-12 text-right">
              {filters.dividendYieldMin.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Search */}
        <div>
          <label className="block text-xs text-text-dim mb-1.5">종목 검색</label>
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => update({ searchQuery: e.target.value })}
            placeholder="종목명 또는 코드"
            className="w-full px-3 py-1.5 bg-surface-light border border-surface-border rounded-lg text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent transition-colors"
          />
        </div>
      </div>

      {/* Quick Presets */}
      <div className="flex flex-wrap gap-2 pt-1">
        <span className="text-xs text-text-dim mr-1">프리셋:</span>
        <button
          onClick={() =>
            onChange({ ...DEFAULT_FILTERS, pbrMax: 1, dividendYieldMin: 3 })
          }
          className="text-xs px-2.5 py-1 rounded-full bg-surface-light text-text-secondary hover:text-text-primary transition-colors"
        >
          고배당 저PBR
        </button>
        <button
          onClick={() =>
            onChange({
              ...DEFAULT_FILTERS,
              pbrMax: 0.5,
              perMax: 10,
              dividendYieldMin: 0,
            })
          }
          className="text-xs px-2.5 py-1 rounded-full bg-surface-light text-text-secondary hover:text-text-primary transition-colors"
        >
          극저평가
        </button>
        <button
          onClick={() =>
            onChange({ ...DEFAULT_FILTERS, dividendYieldMin: 5, pbrMax: 5 })
          }
          className="text-xs px-2.5 py-1 rounded-full bg-surface-light text-text-secondary hover:text-text-primary transition-colors"
        >
          배당 5%+
        </button>
        <button
          onClick={() => onChange(DEFAULT_FILTERS)}
          className="text-xs px-2.5 py-1 rounded-full bg-surface-light text-text-dim hover:text-text-secondary transition-colors"
        >
          초기화
        </button>
      </div>
    </div>
  );
}
