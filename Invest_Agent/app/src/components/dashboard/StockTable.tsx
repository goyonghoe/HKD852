"use client";

import { useMemo } from "react";
import type { StockItem, SortField, SortDirection } from "@/lib/krx/types";
import { COLUMN_LABELS } from "@/lib/krx/constants";
import { formatNumber, formatPercent } from "@/lib/utils/format";
import Badge from "@/components/ui/Badge";

interface StockTableProps {
  data: StockItem[];
  loading: boolean;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  searchQuery: string;
}

const COLUMNS: { key: SortField; align: "left" | "right" }[] = [
  { key: "code", align: "left" },
  { key: "name", align: "left" },
  { key: "closePrice", align: "right" },
  { key: "eps", align: "right" },
  { key: "per", align: "right" },
  { key: "bps", align: "right" },
  { key: "pbr", align: "right" },
  { key: "dps", align: "right" },
  { key: "dividendYield", align: "right" },
];

function yieldColor(y: number): string {
  if (y >= 5) return "text-profit font-semibold";
  if (y >= 3) return "text-gold";
  if (y > 0) return "text-text-primary";
  return "text-text-dim";
}

function formatCell(field: SortField, value: number | string): string {
  if (typeof value === "string") return value;
  switch (field) {
    case "dividendYield":
      return formatPercent(value);
    case "per":
    case "pbr":
      return value === 0 ? "-" : value.toFixed(2);
    case "closePrice":
    case "eps":
    case "bps":
    case "dps":
      return value === 0 ? "-" : formatNumber(value);
    default:
      return String(value);
  }
}

export default function StockTable({
  data,
  loading,
  sortField,
  sortDirection,
  onSort,
  searchQuery,
}: StockTableProps) {
  const filtered = useMemo(() => {
    if (!searchQuery) return data;
    const q = searchQuery.toLowerCase();
    return data.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q)
    );
  }, [data, searchQuery]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const cmp =
        typeof aVal === "string"
          ? (aVal as string).localeCompare(bVal as string, "ko")
          : (aVal as number) - (bVal as number);
      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortField, sortDirection]);

  if (loading) {
    return (
      <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
        <div className="p-8 text-center">
          <div className="inline-block w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary mt-3 text-sm">
            KRX 데이터 로딩 중...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-surface-light">
              <tr>
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => onSort(col.key)}
                    className={`px-3 py-2.5 font-medium text-text-secondary cursor-pointer hover:text-text-primary transition-colors select-none whitespace-nowrap ${
                      col.align === "right" ? "text-right" : "text-left"
                    }`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {COLUMN_LABELS[col.key]}
                      {sortField === col.key && (
                        <span className="text-accent text-xs">
                          {sortDirection === "asc" ? "\u25B2" : "\u25BC"}
                        </span>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {sorted.map((stock) => (
                <tr
                  key={stock.code}
                  className="hover:bg-surface-light/50 transition-colors"
                >
                  <td className="px-3 py-2 text-text-dim font-mono text-xs">
                    {stock.code}
                  </td>
                  <td className="px-3 py-2 text-text-primary font-medium whitespace-nowrap">
                    {stock.name}
                    {stock.market === "KOSDAQ" && (
                      <span className="ml-1.5 text-[10px] text-text-dim bg-surface-light px-1 py-0.5 rounded">
                        Q
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-text-primary">
                    {formatCell("closePrice", stock.closePrice)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-text-secondary">
                    {formatCell("eps", stock.eps)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-text-secondary">
                    {formatCell("per", stock.per)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-text-secondary">
                    {formatCell("bps", stock.bps)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-text-secondary">
                    {formatCell("pbr", stock.pbr)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-text-primary">
                    {formatCell("dps", stock.dps)}
                  </td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    <span
                      className={`tabular-nums ${yieldColor(stock.dividendYield)}`}
                    >
                      {formatCell("dividendYield", stock.dividendYield)}
                    </span>
                    {stock.dividendYield >= 3 && (
                      <span className="ml-1.5">
                        <Badge yield_={stock.dividendYield} />
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="px-3 py-2 border-t border-surface-border text-xs text-text-dim">
        {searchQuery
          ? `검색 결과: ${sorted.length}개 / 전체 ${data.length}개`
          : `전체 ${sorted.length}개 종목`}
      </div>
    </div>
  );
}
