"use client";

import type { PortfolioHolding } from "@/lib/portfolio/store";
import { formatNumber, formatPercent } from "@/lib/utils/format";
import { STOP_LOSS_PERCENT } from "@/lib/strategy/rules";

interface CurrentPrice {
  code: string;
  price: number;
  change: number;
  changePercent: number;
}

interface HoldingTableProps {
  holdings: PortfolioHolding[];
  prices: Map<string, CurrentPrice>;
  onRemove: (id: string) => void;
}

export default function HoldingTable({
  holdings,
  prices,
  onRemove,
}: HoldingTableProps) {
  if (holdings.length === 0) {
    return (
      <div className="bg-surface border border-surface-border rounded-xl p-8 text-center">
        <p className="text-text-secondary text-sm">
          보유 종목이 없습니다. &quot;종목 추가&quot; 버튼으로 포트폴리오를 구성하세요.
        </p>
        <p className="text-text-dim text-xs mt-2">
          1단계: 지수 ETF 분할 매수부터 시작하세요 (전략 3.1)
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-light">
            <tr>
              <th className="px-3 py-2.5 text-left text-text-secondary font-medium">종목</th>
              <th className="px-3 py-2.5 text-right text-text-secondary font-medium">매수가</th>
              <th className="px-3 py-2.5 text-right text-text-secondary font-medium">현재가</th>
              <th className="px-3 py-2.5 text-right text-text-secondary font-medium">수량</th>
              <th className="px-3 py-2.5 text-right text-text-secondary font-medium">투자금</th>
              <th className="px-3 py-2.5 text-right text-text-secondary font-medium">평가액</th>
              <th className="px-3 py-2.5 text-right text-text-secondary font-medium">수익률</th>
              <th className="px-3 py-2.5 text-right text-text-secondary font-medium">손절가</th>
              <th className="px-3 py-2.5 text-center text-text-secondary font-medium">상태</th>
              <th className="px-3 py-2.5 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {holdings.map((h) => {
              const cp = prices.get(h.code);
              const currentPrice = cp ? cp.price : h.buyPrice;
              const invested = h.buyPrice * h.quantity;
              const currentValue = currentPrice * h.quantity;
              const profit = currentValue - invested;
              const profitPercent =
                invested > 0 ? (profit / invested) * 100 : 0;
              const lossPercent =
                ((h.buyPrice - currentPrice) / h.buyPrice) * 100;
              const isStopLoss =
                h.type !== "etf" && lossPercent >= STOP_LOSS_PERCENT;
              const isTrailingStop =
                h.type !== "etf" &&
                currentPrice > h.buyPrice &&
                h.highestPrice > 0 &&
                ((h.highestPrice - currentPrice) / h.highestPrice) * 100 >= 10;

              const profitColor =
                profit > 0
                  ? "text-profit"
                  : profit < 0
                    ? "text-loss"
                    : "text-text-primary";

              return (
                <tr
                  key={h.id}
                  className={`hover:bg-surface-light/50 transition-colors ${
                    isStopLoss ? "bg-loss-dim" : ""
                  }`}
                >
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div>
                        <span className="text-text-primary font-medium">
                          {h.name}
                        </span>
                        <span className="text-text-dim text-xs ml-1.5">
                          {h.code}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] px-1 py-0.5 rounded ${
                          h.type === "etf"
                            ? "bg-accent-dim text-accent"
                            : "bg-surface-light text-text-dim"
                        }`}
                      >
                        {h.type === "etf" ? "ETF" : "주식"}
                      </span>
                    </div>
                    {h.memo && (
                      <p className="text-[11px] text-text-dim mt-0.5 truncate max-w-[200px]">
                        {h.memo}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-text-secondary">
                    {formatNumber(h.buyPrice)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    <span className={profitColor}>
                      {formatNumber(currentPrice)}
                    </span>
                    {cp && (
                      <span
                        className={`block text-[11px] ${
                          cp.changePercent >= 0 ? "text-profit" : "text-loss"
                        }`}
                      >
                        {cp.changePercent >= 0 ? "+" : ""}
                        {cp.changePercent.toFixed(2)}%
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-text-secondary">
                    {formatNumber(h.quantity)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-text-secondary">
                    {formatNumber(invested)}
                  </td>
                  <td className={`px-3 py-2.5 text-right tabular-nums ${profitColor}`}>
                    {formatNumber(currentValue)}
                  </td>
                  <td className={`px-3 py-2.5 text-right tabular-nums font-medium ${profitColor}`}>
                    {profit >= 0 ? "+" : ""}
                    {formatPercent(profitPercent)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-text-dim">
                    {h.type === "etf" ? (
                      <span className="text-xs">-</span>
                    ) : (
                      formatNumber(h.stopLossPrice)
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {isStopLoss ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-loss-dim text-loss animate-pulse">
                        손절
                      </span>
                    ) : isTrailingStop ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-gold-dim text-gold">
                        익절
                      </span>
                    ) : profit > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-profit-dim text-profit">
                        수익
                      </span>
                    ) : profit < 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-loss-dim text-loss">
                        손실
                      </span>
                    ) : (
                      <span className="text-xs text-text-dim">보합</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      onClick={() => onRemove(h.id)}
                      className="text-text-dim hover:text-loss transition-colors"
                      title="종목 삭제"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-3 py-2 border-t border-surface-border text-xs text-text-dim">
        {holdings.length}종목 보유 | 매수 사유:{" "}
        {holdings.filter((h) => h.buyReason === "undervalued").length}개 저평가,{" "}
        {holdings.filter((h) => h.buyReason === "growth").length}개 성장성
      </div>
    </div>
  );
}
