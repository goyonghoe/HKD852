"use client";

import type { JournalEntry } from "@/lib/journal/store";

interface JournalTimelineProps {
  entries: JournalEntry[];
  onRemove: (id: string) => void;
}

export default function JournalTimeline({
  entries,
  onRemove,
}: JournalTimelineProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-text-dim text-sm">아직 기록이 없습니다</p>
        <p className="text-text-dim text-xs mt-1">
          매수/매도 시 반드시 기록하세요 (전략 §5.2)
        </p>
      </div>
    );
  }

  // Group by date
  const grouped = entries.reduce<Record<string, JournalEntry[]>>(
    (acc, entry) => {
      const d = entry.date;
      if (!acc[d]) acc[d] = [];
      acc[d].push(entry);
      return acc;
    },
    {}
  );

  const sortedDates = Object.keys(grouped).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="space-y-6">
      {sortedDates.map((date) => (
        <div key={date}>
          {/* Date Header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-2 h-2 rounded-full bg-accent" />
            <span className="text-sm font-medium text-text-secondary">
              {new Date(date).toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "short",
              })}
            </span>
            <div className="flex-1 border-t border-surface-border" />
          </div>

          {/* Entries for this date */}
          <div className="ml-4 space-y-3">
            {grouped[date].map((entry) => (
              <div
                key={entry.id}
                className={`bg-surface border rounded-xl p-4 transition-colors ${
                  entry.type === "buy"
                    ? "border-profit/30 hover:border-profit/50"
                    : "border-loss/30 hover:border-loss/50"
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded ${
                        entry.type === "buy"
                          ? "bg-profit-dim text-profit"
                          : "bg-loss-dim text-loss"
                      }`}
                    >
                      {entry.type === "buy" ? "매수" : "매도"}
                    </span>
                    <span className="text-sm font-medium text-text-primary">
                      {entry.name}
                    </span>
                    <span className="text-[10px] text-text-dim">
                      {entry.code}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        entry.reason === "undervalued"
                          ? "bg-accent/10 text-accent"
                          : "bg-gold/10 text-gold"
                      }`}
                    >
                      {entry.reason === "undervalued" ? "저평가" : "성장성"}
                    </span>
                  </div>
                  <button
                    onClick={() => onRemove(entry.id)}
                    className="text-text-dim hover:text-loss text-xs transition-colors"
                    title="삭제"
                  >
                    삭제
                  </button>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-2">
                  <div>
                    <span className="text-text-dim">
                      {entry.type === "buy" ? "매수가" : "매도가"}
                    </span>
                    <p className="text-text-primary tabular-nums font-medium">
                      {entry.price.toLocaleString()}원
                    </p>
                  </div>
                  <div>
                    <span className="text-text-dim">수량</span>
                    <p className="text-text-primary tabular-nums font-medium">
                      {entry.quantity.toLocaleString()}주
                    </p>
                  </div>
                  <div>
                    <span className="text-text-dim">거래금액</span>
                    <p className="text-text-primary tabular-nums font-medium">
                      {(entry.price * entry.quantity).toLocaleString()}원
                    </p>
                  </div>
                  {entry.type === "buy" && entry.stopLossPrice > 0 && (
                    <div>
                      <span className="text-text-dim">손절가 (§2.1)</span>
                      <p className="text-loss tabular-nums font-medium">
                        {entry.stopLossPrice.toLocaleString()}원
                      </p>
                    </div>
                  )}
                </div>

                {/* Cause Analysis */}
                {entry.causeAnalysis && (
                  <div className="bg-surface-light rounded-lg px-3 py-2 mb-2">
                    <span className="text-[10px] text-accent font-medium">
                      원인 분석 (§5.2)
                    </span>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {entry.causeAnalysis}
                    </p>
                  </div>
                )}

                {/* Memo */}
                {entry.memo && (
                  <p className="text-xs text-text-dim mt-1">{entry.memo}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
