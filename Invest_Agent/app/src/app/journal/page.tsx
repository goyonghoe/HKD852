"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import JournalForm from "@/components/journal/JournalForm";
import JournalTimeline from "@/components/journal/JournalTimeline";
import { useJournal } from "@/hooks/useJournal";

export default function JournalPage() {
  const {
    filtered,
    filter,
    setFilter,
    add,
    remove,
    totalBuyAmount,
    totalSellAmount,
    entryCount,
  } = useJournal();

  const [showForm, setShowForm] = useState(false);

  return (
    <div className="min-h-screen">
      <Header />

      <main className="max-w-[1440px] mx-auto px-6 py-5 space-y-5">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-text-primary">투자 일지</h2>
            <p className="text-xs text-text-dim mt-0.5">
              매수/매도 기록 + 인과관계 훈련 (전략 §5.2)
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              showForm
                ? "bg-surface border border-surface-border text-text-secondary hover:text-text-primary"
                : "bg-accent hover:bg-accent/90 text-white"
            }`}
          >
            {showForm ? "닫기" : "새 기록"}
          </button>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5">
          {/* Left: Timeline */}
          <div className="space-y-4">
            {/* Filter Tabs */}
            <div className="flex items-center gap-2">
              {(
                [
                  { key: "all", label: "전체" },
                  { key: "buy", label: "매수" },
                  { key: "sell", label: "매도" },
                ] as const
              ).map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filter === f.key
                      ? "bg-accent text-white"
                      : "bg-surface-light text-text-dim hover:text-text-secondary"
                  }`}
                >
                  {f.label}
                </button>
              ))}
              <span className="text-xs text-text-dim ml-2">
                {filtered.length}건
              </span>
            </div>

            {/* Timeline */}
            <div className="bg-surface border border-surface-border rounded-xl p-5">
              <JournalTimeline entries={filtered} onRemove={remove} />
            </div>
          </div>

          {/* Right: Form + Stats */}
          <div className="space-y-4">
            {/* Form */}
            {showForm && (
              <div className="bg-surface border border-surface-border rounded-xl p-5">
                <h3 className="text-sm font-medium text-text-secondary mb-4">
                  거래 기록
                </h3>
                <JournalForm
                  onSubmit={(entry) => {
                    add(entry);
                    setShowForm(false);
                  }}
                />
              </div>
            )}

            {/* Stats */}
            <div className="bg-surface border border-surface-border rounded-xl p-5">
              <h3 className="text-sm font-medium text-text-secondary mb-3">
                거래 통계
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-dim">총 기록 수</span>
                  <span className="text-sm font-medium text-text-primary tabular-nums">
                    {entryCount}건
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-dim">총 매수 금액</span>
                  <span className="text-sm font-medium text-profit tabular-nums">
                    {totalBuyAmount.toLocaleString()}원
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-dim">총 매도 금액</span>
                  <span className="text-sm font-medium text-loss tabular-nums">
                    {totalSellAmount.toLocaleString()}원
                  </span>
                </div>
                <div className="border-t border-surface-border pt-2 flex items-center justify-between">
                  <span className="text-xs text-text-dim">순 투자금</span>
                  <span className="text-sm font-bold text-text-primary tabular-nums">
                    {(totalBuyAmount - totalSellAmount).toLocaleString()}원
                  </span>
                </div>
              </div>
            </div>

            {/* Strategy Tips */}
            <div className="bg-surface border border-surface-border rounded-xl p-5">
              <h3 className="text-sm font-medium text-text-secondary mb-3">
                일지 작성 가이드 (§5.2)
              </h3>
              <ul className="space-y-2 text-xs text-text-dim">
                <li className="flex items-start gap-2">
                  <span className="text-accent shrink-0 mt-0.5">1</span>
                  <span>
                    매수 이유는 반드시{" "}
                    <strong className="text-text-secondary">
                      성장성 또는 저평가
                    </strong>{" "}
                    중 하나로 기록
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent shrink-0 mt-0.5">2</span>
                  <span>
                    매수 시{" "}
                    <strong className="text-text-secondary">
                      목표 손절가
                    </strong>
                    를 반드시 설정 (매수가 -10%)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent shrink-0 mt-0.5">3</span>
                  <span>
                    원인 분석에{" "}
                    <strong className="text-text-secondary">
                      인과관계
                    </strong>
                    를 기록 (상관관계 X)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent shrink-0 mt-0.5">4</span>
                  <span>
                    매도 시에도 반드시 기록 —{" "}
                    <strong className="text-text-secondary">
                      왜 팔았는지
                    </strong>{" "}
                    이유 명시
                  </span>
                </li>
              </ul>
            </div>

            {/* CLI Skill Link */}
            <div className="bg-surface border border-surface-border rounded-xl p-5">
              <h3 className="text-sm font-medium text-text-secondary mb-3">
                CLI 연동
              </h3>
              <div className="space-y-2 text-xs text-text-dim">
                <div className="flex items-center gap-2">
                  <code className="bg-surface-light px-2 py-1 rounded text-accent">
                    /invest-journal
                  </code>
                  <span>CLI에서 빠르게 기록</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="bg-surface-light px-2 py-1 rounded text-accent">
                    /invest-dashboard
                  </code>
                  <span>전체 현황 요약</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
