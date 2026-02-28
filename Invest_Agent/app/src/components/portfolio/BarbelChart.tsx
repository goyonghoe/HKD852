"use client";

import type { PortfolioHolding } from "@/lib/portfolio/store";
import { formatNumber } from "@/lib/utils/format";
import {
  BARBELL_SAFE_RATIO,
  BARBELL_AGGRESSIVE_RATIO,
} from "@/lib/strategy/rules";

interface CurrentPrice {
  code: string;
  price: number;
  change: number;
  changePercent: number;
}

interface BarbelChartProps {
  holdings: PortfolioHolding[];
  prices: Map<string, CurrentPrice>;
}

export default function BarbelChart({ holdings, prices }: BarbelChartProps) {
  if (holdings.length === 0) return null;

  let etfValue = 0;
  let stockValue = 0;

  for (const h of holdings) {
    const cp = prices.get(h.code);
    const price = cp ? cp.price : h.buyPrice;
    const value = price * h.quantity;
    if (h.type === "etf") {
      etfValue += value;
    } else {
      stockValue += value;
    }
  }

  const total = etfValue + stockValue;
  if (total === 0) return null;

  const etfPercent = (etfValue / total) * 100;
  const stockPercent = (stockValue / total) * 100;

  const targetSafe = BARBELL_SAFE_RATIO * 100;
  const targetAggressive = BARBELL_AGGRESSIVE_RATIO * 100;
  const isBalanced =
    etfPercent >= targetSafe - 10 && etfPercent <= targetSafe + 10;

  return (
    <div className="bg-surface border border-surface-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-text-secondary">
          바벨 전략 비율
        </h3>
        <span
          className={`text-xs px-2 py-0.5 rounded ${
            isBalanced
              ? "bg-profit-dim text-profit"
              : "bg-gold-dim text-gold"
          }`}
        >
          {isBalanced ? "균형" : "조정 필요"}
        </span>
      </div>

      {/* Bar */}
      <div className="relative h-8 rounded-lg overflow-hidden bg-surface-light mb-3">
        <div
          className="absolute inset-y-0 left-0 bg-accent transition-all duration-500"
          style={{ width: `${etfPercent}%` }}
        />
        <div
          className="absolute inset-y-0 right-0 bg-gold transition-all duration-500"
          style={{ width: `${stockPercent}%` }}
        />
        {/* Target marker */}
        <div
          className="absolute inset-y-0 w-0.5 bg-text-primary/40"
          style={{ left: `${targetSafe}%` }}
        />
      </div>

      {/* Legend */}
      <div className="flex justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-accent" />
          <span className="text-text-secondary">
            ETF {etfPercent.toFixed(1)}%
          </span>
          <span className="text-text-dim">
            ({formatNumber(etfValue)}원)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-text-dim">
            ({formatNumber(stockValue)}원)
          </span>
          <span className="text-text-secondary">
            주식 {stockPercent.toFixed(1)}%
          </span>
          <span className="w-3 h-3 rounded bg-gold" />
        </div>
      </div>

      {/* Target */}
      <div className="mt-2 text-center text-[11px] text-text-dim">
        권장: ETF {targetSafe}% / 주식 {targetAggressive}% (바벨 전략 3.4)
      </div>
    </div>
  );
}
