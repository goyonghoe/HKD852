"use client";

import type { StockItem } from "@/lib/krx/types";
import { formatPercent } from "@/lib/utils/format";

interface SummaryCardsProps {
  data: StockItem[];
  loading: boolean;
}

export default function SummaryCards({ data, loading }: SummaryCardsProps) {
  const totalCount = data.length;
  const withDividend = data.filter((s) => s.dividendYield > 0);
  const avgYield =
    withDividend.length > 0
      ? withDividend.reduce((sum, s) => sum + s.dividendYield, 0) /
        withDividend.length
      : 0;
  const highYieldCount = data.filter((s) => s.dividendYield >= 3).length;
  const topStock = data.reduce(
    (top, s) => (s.dividendYield > (top?.dividendYield || 0) ? s : top),
    null as StockItem | null
  );

  const cards = [
    {
      label: "총 종목",
      value: loading ? "..." : totalCount.toLocaleString(),
      sub: "개",
    },
    {
      label: "평균 배당수익률",
      value: loading ? "..." : formatPercent(avgYield),
      sub: `배당 종목 ${withDividend.length}개 기준`,
    },
    {
      label: "최고 수익률",
      value: loading
        ? "..."
        : topStock
          ? formatPercent(topStock.dividendYield)
          : "-",
      sub: topStock ? topStock.name : "",
    },
    {
      label: "3%+ 종목",
      value: loading ? "..." : highYieldCount.toLocaleString(),
      sub: "개",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-surface border border-surface-border rounded-xl p-4"
        >
          <p className="text-xs text-text-dim mb-1">{card.label}</p>
          <p
            className={`text-2xl font-bold tabular-nums ${loading ? "skeleton rounded w-20 h-8" : "text-text-primary"}`}
          >
            {card.value}
          </p>
          <p className="text-xs text-text-dim mt-1">{card.sub}</p>
        </div>
      ))}
    </div>
  );
}
