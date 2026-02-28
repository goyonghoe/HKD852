"use client";

import type { StockItem } from "@/lib/krx/types";
import { formatPercent } from "@/lib/utils/format";
import Badge from "@/components/ui/Badge";

interface DividendCalendarProps {
  topDividendStocks: StockItem[];
  loading: boolean;
  pbrUnderOneCount: number;
  pbrUnderOnePercent: number;
  totalStocks: number;
}

export default function DividendCalendar({
  topDividendStocks,
  loading,
  pbrUnderOneCount,
  pbrUnderOnePercent,
  totalStocks,
}: DividendCalendarProps) {
  return (
    <div className="space-y-4">
      {/* PBR Under 1 Signal */}
      <div className="bg-surface border border-surface-border rounded-xl p-5">
        <h3 className="text-sm font-medium text-text-secondary mb-3">
          PBR 저평가 현황 (전략 1.1)
        </h3>
        {loading ? (
          <div className="skeleton rounded w-full h-16" />
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <span className="text-3xl font-bold text-text-primary tabular-nums">
                  {pbrUnderOnePercent.toFixed(1)}%
                </span>
                <p className="text-xs text-text-dim mt-0.5">PBR &lt; 1 비율</p>
              </div>
              <div className="flex-1">
                <div className="relative h-3 bg-surface-light rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-profit to-gold rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, pbrUnderOnePercent)}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-[10px] text-text-dim">
                  <span>0%</span>
                  <span>
                    {pbrUnderOneCount.toLocaleString()} / {totalStocks.toLocaleString()} 종목
                  </span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            <div
              className={`text-xs px-3 py-2 rounded-lg ${
                pbrUnderOnePercent >= 50
                  ? "bg-profit-dim text-profit"
                  : pbrUnderOnePercent >= 30
                    ? "bg-gold-dim text-gold"
                    : "bg-surface-light text-text-secondary"
              }`}
            >
              {pbrUnderOnePercent >= 50
                ? "시장 전체 저평가 상태 — 역발상 매수 기회 (전략 2.3)"
                : pbrUnderOnePercent >= 30
                  ? "적정 수준 — 선별적 저평가 종목 존재"
                  : "고평가 구간 — 신규 매수 신중"}
            </div>
          </div>
        )}
      </div>

      {/* Top Dividend Stocks */}
      <div className="bg-surface border border-surface-border rounded-xl p-5">
        <h3 className="text-sm font-medium text-text-secondary mb-3">
          배당수익률 Top 10
        </h3>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton rounded h-8" />
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {topDividendStocks.slice(0, 10).map((stock, i) => (
              <div
                key={stock.code}
                className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-surface-light/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-dim w-5 text-right tabular-nums">
                    {i + 1}
                  </span>
                  <span className="text-sm text-text-primary font-medium">
                    {stock.name}
                  </span>
                  <span className="text-[10px] text-text-dim">
                    {stock.code}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm tabular-nums text-text-secondary">
                    PBR {stock.pbr > 0 ? stock.pbr.toFixed(2) : "-"}
                  </span>
                  <span className="text-sm font-medium tabular-nums text-profit">
                    {formatPercent(stock.dividendYield)}
                  </span>
                  <Badge yield_={stock.dividendYield} />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 text-[11px] text-text-dim">
          배당 기준일 영업일 기준 이틀 전까지 매수 완료 필요 (전략 3.2)
        </div>
      </div>

      {/* Strategy Checklist */}
      <div className="bg-surface border border-surface-border rounded-xl p-5">
        <h3 className="text-sm font-medium text-text-secondary mb-3">
          오늘의 전략 체크리스트
        </h3>
        <ul className="space-y-2">
          <li className="flex items-start gap-2 text-xs">
            <input type="checkbox" className="mt-0.5 accent-accent" />
            <span className="text-text-secondary">
              매수 타이밍: <strong className="text-accent">하락일(파란 불)</strong>에만 매수 (전략 2.3)
            </span>
          </li>
          <li className="flex items-start gap-2 text-xs">
            <input type="checkbox" className="mt-0.5 accent-accent" />
            <span className="text-text-secondary">
              장 시작 후 1시간(9~10시) <strong className="text-loss">매매 자제</strong> (전략 2.4)
            </span>
          </li>
          <li className="flex items-start gap-2 text-xs">
            <input type="checkbox" className="mt-0.5 accent-accent" />
            <span className="text-text-secondary">
              반드시 <strong className="text-text-primary">지정가 주문</strong> 사용 (전략 2.4)
            </span>
          </li>
          <li className="flex items-start gap-2 text-xs">
            <input type="checkbox" className="mt-0.5 accent-accent" />
            <span className="text-text-secondary">
              레버리지/인버스 상품 <strong className="text-loss">매수 금지</strong> (전략 2.4)
            </span>
          </li>
          <li className="flex items-start gap-2 text-xs">
            <input type="checkbox" className="mt-0.5 accent-accent" />
            <span className="text-text-secondary">
              매수/매도 시 <strong className="text-gold">투자 일지</strong> 기록 (전략 5.2)
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
