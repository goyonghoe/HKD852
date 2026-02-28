"use client";

import type { PortfolioHolding } from "@/lib/portfolio/store";
import { formatNumber, formatPercent } from "@/lib/utils/format";

interface CurrentPrice {
  code: string;
  price: number;
  change: number;
  changePercent: number;
}

interface ProfitSummaryProps {
  holdings: PortfolioHolding[];
  prices: Map<string, CurrentPrice>;
  loading: boolean;
}

export default function ProfitSummary({
  holdings,
  prices,
  loading,
}: ProfitSummaryProps) {
  const totalInvested = holdings.reduce(
    (sum, h) => sum + h.buyPrice * h.quantity,
    0
  );

  const totalCurrent = holdings.reduce((sum, h) => {
    const p = prices.get(h.code);
    const currentPrice = p ? p.price : h.buyPrice;
    return sum + currentPrice * h.quantity;
  }, 0);

  const totalProfit = totalCurrent - totalInvested;
  const totalProfitPercent =
    totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

  const etfCount = holdings.filter((h) => h.type === "etf").length;
  const stockCount = holdings.filter((h) => h.type === "stock").length;

  const stopLossAlerts = holdings.filter((h) => {
    if (h.type === "etf") return false;
    const p = prices.get(h.code);
    if (!p) return false;
    const loss = ((h.buyPrice - p.price) / h.buyPrice) * 100;
    return loss >= 10;
  });

  const profitColor =
    totalProfit > 0
      ? "text-profit"
      : totalProfit < 0
        ? "text-loss"
        : "text-text-primary";

  const cards = [
    {
      label: "총 투자금",
      value: loading ? "..." : `${formatNumber(totalInvested)}원`,
      sub: `${holdings.length}종목 (ETF ${etfCount} / 주식 ${stockCount})`,
    },
    {
      label: "현재 평가액",
      value: loading ? "..." : `${formatNumber(totalCurrent)}원`,
      sub: prices.size > 0 ? "실시간 시세 반영" : "매수가 기준",
      valueClass: profitColor,
    },
    {
      label: "총 손익",
      value: loading
        ? "..."
        : `${totalProfit >= 0 ? "+" : ""}${formatNumber(totalProfit)}원`,
      sub: `${totalProfitPercent >= 0 ? "+" : ""}${formatPercent(totalProfitPercent)}`,
      valueClass: profitColor,
    },
    {
      label: "손절 알림",
      value: loading ? "..." : `${stopLossAlerts.length}`,
      sub:
        stopLossAlerts.length > 0
          ? stopLossAlerts.map((h) => h.name).join(", ")
          : "정상",
      valueClass:
        stopLossAlerts.length > 0 ? "text-loss" : "text-profit",
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
            className={`text-xl font-bold tabular-nums ${
              loading
                ? "skeleton rounded w-24 h-7"
                : card.valueClass || "text-text-primary"
            }`}
          >
            {card.value}
          </p>
          <p className="text-xs text-text-dim mt-1 truncate">{card.sub}</p>
        </div>
      ))}
    </div>
  );
}
