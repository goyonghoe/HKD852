"use client";

import { formatNumber } from "@/lib/utils/format";

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

interface MarketSummaryProps {
  indices: IndexData[];
  exchangeRate: ExchangeRate | null;
  loading: boolean;
}

function changeColor(val: number): string {
  return val > 0 ? "text-profit" : val < 0 ? "text-loss" : "text-text-primary";
}

function changeSign(val: number): string {
  return val > 0 ? "+" : "";
}

export default function MarketSummary({
  indices,
  exchangeRate,
  loading,
}: MarketSummaryProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-surface border border-surface-border rounded-xl p-5">
            <div className="skeleton rounded w-20 h-4 mb-3" />
            <div className="skeleton rounded w-32 h-8 mb-2" />
            <div className="skeleton rounded w-24 h-4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {indices.map((idx) => {
        const pos52w =
          idx.high52w > idx.low52w
            ? ((idx.closePrice - idx.low52w) / (idx.high52w - idx.low52w)) * 100
            : 50;

        return (
          <div
            key={idx.code}
            className="bg-surface border border-surface-border rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary font-medium">
                {idx.name}
              </span>
              {idx.tradedAt && (
                <span className="text-[10px] text-text-dim">
                  {new Date(idx.tradedAt).toLocaleString("ko-KR", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-2xl font-bold text-text-primary tabular-nums">
                {idx.closePrice.toLocaleString("ko-KR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <span className={`text-sm font-medium tabular-nums ${changeColor(idx.change)}`}>
                {changeSign(idx.change)}
                {idx.change.toLocaleString("ko-KR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span
                className={`text-sm tabular-nums px-1.5 py-0.5 rounded ${
                  idx.changePercent > 0
                    ? "bg-profit-dim text-profit"
                    : idx.changePercent < 0
                      ? "bg-loss-dim text-loss"
                      : "bg-surface-light text-text-secondary"
                }`}
              >
                {changeSign(idx.changePercent)}
                {idx.changePercent.toFixed(2)}%
              </span>
            </div>

            {/* 52-week range bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-text-dim">
                <span>52주 저: {formatNumber(idx.low52w)}</span>
                <span>52주 고: {formatNumber(idx.high52w)}</span>
              </div>
              <div className="relative h-1.5 bg-surface-light rounded-full">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-loss to-profit rounded-full"
                  style={{ width: `${Math.min(100, Math.max(0, pos52w))}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-text-primary rounded-full border border-bg"
                  style={{
                    left: `${Math.min(98, Math.max(2, pos52w))}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                />
              </div>
            </div>

            <div className="mt-2 text-[11px] text-text-dim">
              거래량: {idx.volume}
            </div>
          </div>
        );
      })}

      {/* Exchange Rate Card */}
      <div className="bg-surface border border-surface-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-text-secondary font-medium">
            USD/KRW
          </span>
          <span className="text-[10px] text-text-dim">원/달러</span>
        </div>

        {exchangeRate ? (
          <>
            <div className="text-2xl font-bold text-text-primary tabular-nums mb-1">
              {exchangeRate.usdkrw.toLocaleString("ko-KR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-medium tabular-nums ${changeColor(exchangeRate.change)}`}
              >
                {changeSign(exchangeRate.change)}
                {exchangeRate.change.toFixed(2)}
              </span>
              <span
                className={`text-sm tabular-nums px-1.5 py-0.5 rounded ${
                  exchangeRate.changePercent > 0
                    ? "bg-loss-dim text-loss"
                    : exchangeRate.changePercent < 0
                      ? "bg-profit-dim text-profit"
                      : "bg-surface-light text-text-secondary"
                }`}
              >
                {changeSign(exchangeRate.changePercent)}
                {exchangeRate.changePercent.toFixed(2)}%
              </span>
            </div>
            <div className="mt-3 text-[11px] text-text-dim">
              원화 강세(하락) = 수입 유리 / 원화 약세(상승) = 수출 유리
            </div>
          </>
        ) : (
          <div className="text-text-dim text-sm">데이터 조회 불가</div>
        )}
      </div>
    </div>
  );
}
