"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import { usePortfolio } from "@/hooks/usePortfolio";
import ProfitSummary from "@/components/portfolio/ProfitSummary";
import HoldingTable from "@/components/portfolio/HoldingTable";
import AddStockForm from "@/components/portfolio/AddStockForm";
import BarbelChart from "@/components/portfolio/BarbelChart";

export default function PortfolioPage() {
  const [showAddForm, setShowAddForm] = useState(false);
  const { holdings, prices, loading, add, remove, refreshPrices } =
    usePortfolio();

  return (
    <div className="min-h-screen">
      <Header />

      <main className="max-w-[1440px] mx-auto px-6 py-5 space-y-5">
        {/* Summary Cards */}
        <ProfitSummary holdings={holdings} prices={prices} loading={loading} />

        {/* Action Bar */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-text-primary">
            보유 종목
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => refreshPrices()}
              disabled={loading || holdings.length === 0}
              className="px-3 py-1.5 bg-surface border border-surface-border rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface-light transition-colors disabled:opacity-50"
            >
              {loading ? "갱신 중..." : "시세 갱신"}
            </button>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-1.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/80 transition-colors"
            >
              {showAddForm ? "닫기" : "종목 추가"}
            </button>
          </div>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <AddStockForm
            onAdd={add}
            onClose={() => setShowAddForm(false)}
          />
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5">
          <HoldingTable
            holdings={holdings}
            prices={prices}
            onRemove={remove}
          />
          <div className="space-y-4">
            <BarbelChart holdings={holdings} prices={prices} />

            {/* Strategy Tips */}
            <div className="bg-surface border border-surface-border rounded-xl p-4">
              <h3 className="text-sm font-medium text-text-secondary mb-3">
                전략 가이드
              </h3>
              <ul className="space-y-2 text-xs text-text-dim">
                <li className="flex gap-2">
                  <span className="text-loss shrink-0">10%</span>
                  <span>손절매 — 매수가 대비 10% 하락 시 기계적 매도 (ETF 제외)</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-gold shrink-0">10%</span>
                  <span>익절 — 최고점 대비 10% 하락 시 매도 시그널</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent shrink-0">80%</span>
                  <span>바벨 — ETF 80% / 개별주식 20% 비율 유지</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-profit shrink-0">일지</span>
                  <span>매수/매도 시 인과관계 기록 — /invest-journal 활용</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
