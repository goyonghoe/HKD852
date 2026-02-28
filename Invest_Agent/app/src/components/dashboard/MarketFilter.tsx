"use client";

import { MARKET_LABELS } from "@/lib/krx/constants";
import type { MarketType } from "@/lib/krx/types";

interface MarketFilterProps {
  value: MarketType;
  onChange: (market: MarketType) => void;
}

const MARKETS: MarketType[] = ["ALL", "KOSPI", "KOSDAQ"];

export default function MarketFilter({ value, onChange }: MarketFilterProps) {
  return (
    <div className="flex rounded-lg overflow-hidden border border-surface-border">
      {MARKETS.map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={`px-4 py-1.5 text-sm font-medium transition-colors ${
            value === m
              ? "bg-accent text-white"
              : "bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-light"
          }`}
        >
          {MARKET_LABELS[m]}
        </button>
      ))}
    </div>
  );
}
