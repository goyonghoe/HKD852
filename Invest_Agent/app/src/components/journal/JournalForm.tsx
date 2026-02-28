"use client";

import { useState } from "react";
import type { JournalEntry } from "@/lib/journal/store";

interface JournalFormProps {
  onSubmit: (entry: Omit<JournalEntry, "id" | "createdAt">) => void;
}

export default function JournalForm({ onSubmit }: JournalFormProps) {
  const [type, setType] = useState<"buy" | "sell">("buy");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [reason, setReason] = useState<"growth" | "undervalued">("undervalued");
  const [stopLossPrice, setStopLossPrice] = useState("");
  const [memo, setMemo] = useState("");
  const [causeAnalysis, setCauseAnalysis] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);

  const handleCodeBlur = async () => {
    if (code.length !== 6 || !/^\d{6}$/.test(code)) return;
    setLookupLoading(true);
    try {
      const res = await fetch(`/api/stock/${code}`);
      if (res.ok) {
        const data = await res.json();
        setName(data.name || "");
        if (!price && data.closePrice) {
          setPrice(data.closePrice.toString());
          if (type === "buy") {
            setStopLossPrice(
              Math.floor(data.closePrice * 0.9).toString()
            );
          }
        }
      }
    } catch {
      // ignore
    } finally {
      setLookupLoading(false);
    }
  };

  const handlePriceChange = (val: string) => {
    setPrice(val);
    const p = parseFloat(val);
    if (type === "buy" && p > 0) {
      setStopLossPrice(Math.floor(p * 0.9).toString());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseFloat(price);
    const q = parseInt(quantity);
    if (!code || !name || !p || !q) return;

    onSubmit({
      type,
      code,
      name,
      price: p,
      quantity: q,
      date,
      reason,
      stopLossPrice: type === "buy" ? parseFloat(stopLossPrice) || p * 0.9 : 0,
      memo,
      causeAnalysis,
    });

    // Reset
    setCode("");
    setName("");
    setPrice("");
    setQuantity("");
    setStopLossPrice("");
    setMemo("");
    setCauseAnalysis("");
  };

  const totalAmount = (parseFloat(price) || 0) * (parseInt(quantity) || 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Buy/Sell Toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType("buy")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            type === "buy"
              ? "bg-profit text-white"
              : "bg-surface-light text-text-dim hover:text-text-secondary"
          }`}
        >
          매수
        </button>
        <button
          type="button"
          onClick={() => setType("sell")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            type === "sell"
              ? "bg-loss text-white"
              : "bg-surface-light text-text-dim hover:text-text-secondary"
          }`}
        >
          매도
        </button>
      </div>

      {/* Code + Name */}
      <div className="grid grid-cols-[120px_1fr] gap-2">
        <div>
          <label className="block text-xs text-text-dim mb-1">종목코드</label>
          <div className="relative">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              onBlur={handleCodeBlur}
              placeholder="005930"
              maxLength={6}
              className="w-full bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent"
            />
            {lookupLoading && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            )}
          </div>
        </div>
        <div>
          <label className="block text-xs text-text-dim mb-1">종목명</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="삼성전자"
            className="w-full bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* Price + Quantity + Date */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-xs text-text-dim mb-1">
            {type === "buy" ? "매수가" : "매도가"} (원)
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => handlePriceChange(e.target.value)}
            placeholder="70000"
            className="w-full bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent tabular-nums"
          />
        </div>
        <div>
          <label className="block text-xs text-text-dim mb-1">수량 (주)</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="10"
            min="1"
            className="w-full bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent tabular-nums"
          />
        </div>
        <div>
          <label className="block text-xs text-text-dim mb-1">거래일</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* Reason (§5.2: 성장성 또는 저평가 중 하나 필수) */}
      <div>
        <label className="block text-xs text-text-dim mb-1">
          {type === "buy" ? "매수 사유 (§5.2)" : "매도 사유"}
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setReason("undervalued")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              reason === "undervalued"
                ? "bg-accent text-white"
                : "bg-surface-light text-text-dim hover:text-text-secondary"
            }`}
          >
            저평가 (PBR/PER 기반)
          </button>
          <button
            type="button"
            onClick={() => setReason("growth")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              reason === "growth"
                ? "bg-gold text-white"
                : "bg-surface-light text-text-dim hover:text-text-secondary"
            }`}
          >
            성장성 (매출/이익 증가)
          </button>
        </div>
      </div>

      {/* Stop-loss (buy only) */}
      {type === "buy" && (
        <div>
          <label className="block text-xs text-text-dim mb-1">
            목표 손절가 (§2.1: 매수가 -10%)
          </label>
          <input
            type="number"
            value={stopLossPrice}
            onChange={(e) => setStopLossPrice(e.target.value)}
            placeholder="자동 계산"
            className="w-full bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent tabular-nums"
          />
        </div>
      )}

      {/* Cause Analysis (§5.2: 인과관계 훈련) */}
      <div>
        <label className="block text-xs text-text-dim mb-1">
          원인 분석 — 왜 이 가격인가? (§5.2 인과관계 훈련)
        </label>
        <textarea
          value={causeAnalysis}
          onChange={(e) => setCauseAnalysis(e.target.value)}
          placeholder="예: 반도체 수출 호조 → 실적 기대감 상승 → 주가 반영"
          rows={2}
          className="w-full bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent resize-none"
        />
      </div>

      {/* Memo */}
      <div>
        <label className="block text-xs text-text-dim mb-1">메모</label>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="추가 기록..."
          rows={2}
          className="w-full bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent resize-none"
        />
      </div>

      {/* Total + Submit */}
      <div className="flex items-center justify-between pt-2">
        {totalAmount > 0 && (
          <span className="text-sm text-text-secondary">
            총 거래금액:{" "}
            <strong className="text-text-primary tabular-nums">
              {totalAmount.toLocaleString()}원
            </strong>
          </span>
        )}
        <button
          type="submit"
          disabled={!code || !name || !price || !quantity}
          className={`ml-auto px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
            type === "buy"
              ? "bg-profit hover:bg-profit/90 text-white"
              : "bg-loss hover:bg-loss/90 text-white"
          }`}
        >
          {type === "buy" ? "매수 기록" : "매도 기록"}
        </button>
      </div>
    </form>
  );
}
