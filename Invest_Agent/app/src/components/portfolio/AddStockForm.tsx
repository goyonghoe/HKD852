"use client";

import { useState } from "react";
import type { PortfolioHolding } from "@/lib/portfolio/store";

interface AddStockFormProps {
  onAdd: (holding: Omit<PortfolioHolding, "id">) => void;
  onClose: () => void;
}

export default function AddStockForm({ onAdd, onClose }: AddStockFormProps) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [buyDate, setBuyDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [type, setType] = useState<"etf" | "stock">("stock");
  const [buyReason, setBuyReason] = useState<"growth" | "undervalued">(
    "undervalued"
  );
  const [memo, setMemo] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);

  const price = parseFloat(buyPrice) || 0;
  const qty = parseInt(quantity) || 0;
  const stopLossPrice = Math.round(price * 0.9);
  const totalCost = price * qty;

  const handleLookup = async () => {
    if (code.length !== 6) return;
    setLookupLoading(true);
    try {
      const res = await fetch(`/api/stock/${code}`);
      if (res.ok) {
        const data = await res.json();
        setName(data.name || "");
        if (!buyPrice) setBuyPrice(String(data.closePrice || ""));
      }
    } catch {
      // silently fail
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name || !price || !qty) return;

    onAdd({
      code,
      name,
      buyPrice: price,
      quantity: qty,
      buyDate,
      stopLossPrice,
      highestPrice: price,
      type,
      buyReason,
      memo,
    });
    onClose();
  };

  const isValid = code.length === 6 && name && price > 0 && qty > 0;

  return (
    <div className="bg-surface border border-surface-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-text-primary">종목 추가</h3>
        <button
          onClick={onClose}
          className="text-text-dim hover:text-text-primary transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Code + Lookup */}
          <div>
            <label className="block text-xs text-text-dim mb-1">종목코드</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="005930"
                className="flex-1 px-3 py-2 bg-surface-light border border-surface-border rounded-lg text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={handleLookup}
                disabled={code.length !== 6 || lookupLoading}
                className="px-3 py-2 bg-accent text-white text-xs rounded-lg disabled:opacity-50 hover:bg-accent/80 transition-colors"
              >
                {lookupLoading ? "..." : "조회"}
              </button>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs text-text-dim mb-1">종목명</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="삼성전자"
              className="w-full px-3 py-2 bg-surface-light border border-surface-border rounded-lg text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs text-text-dim mb-1">유형</label>
            <div className="flex rounded-lg overflow-hidden border border-surface-border">
              <button
                type="button"
                onClick={() => setType("stock")}
                className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                  type === "stock"
                    ? "bg-accent text-white"
                    : "bg-surface-light text-text-secondary hover:text-text-primary"
                }`}
              >
                개별주식
              </button>
              <button
                type="button"
                onClick={() => setType("etf")}
                className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                  type === "etf"
                    ? "bg-accent text-white"
                    : "bg-surface-light text-text-secondary hover:text-text-primary"
                }`}
              >
                ETF
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Buy Price */}
          <div>
            <label className="block text-xs text-text-dim mb-1">매수가 (원)</label>
            <input
              type="number"
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value)}
              placeholder="72000"
              className="w-full px-3 py-2 bg-surface-light border border-surface-border rounded-lg text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent"
            />
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-xs text-text-dim mb-1">수량 (주)</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="10"
              className="w-full px-3 py-2 bg-surface-light border border-surface-border rounded-lg text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent"
            />
          </div>

          {/* Buy Date */}
          <div>
            <label className="block text-xs text-text-dim mb-1">매수일</label>
            <input
              type="date"
              value={buyDate}
              onChange={(e) => setBuyDate(e.target.value)}
              className="w-full px-3 py-2 bg-surface-light border border-surface-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent"
            />
          </div>

          {/* Buy Reason */}
          <div>
            <label className="block text-xs text-text-dim mb-1">매수 사유</label>
            <div className="flex rounded-lg overflow-hidden border border-surface-border">
              <button
                type="button"
                onClick={() => setBuyReason("undervalued")}
                className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${
                  buyReason === "undervalued"
                    ? "bg-profit text-white"
                    : "bg-surface-light text-text-secondary hover:text-text-primary"
                }`}
              >
                저평가
              </button>
              <button
                type="button"
                onClick={() => setBuyReason("growth")}
                className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${
                  buyReason === "growth"
                    ? "bg-gold text-white"
                    : "bg-surface-light text-text-secondary hover:text-text-primary"
                }`}
              >
                성장성
              </button>
            </div>
          </div>
        </div>

        {/* Memo */}
        <div>
          <label className="block text-xs text-text-dim mb-1">메모 (선택)</label>
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="PBR 0.9 저평가 구간 진입"
            className="w-full px-3 py-2 bg-surface-light border border-surface-border rounded-lg text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent"
          />
        </div>

        {/* Summary + Submit */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-sm text-text-secondary">
            {price > 0 && qty > 0 && (
              <>
                <span className="text-text-primary font-medium">
                  {totalCost.toLocaleString("ko-KR")}원
                </span>
                <span className="text-text-dim mx-2">|</span>
                <span>
                  손절가: {stopLossPrice.toLocaleString("ko-KR")}원 (-10%)
                </span>
                {type === "etf" && (
                  <span className="text-xs text-accent ml-2">(ETF 손절 미적용)</span>
                )}
              </>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg disabled:opacity-50 hover:bg-accent/80 transition-colors"
            >
              추가
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
