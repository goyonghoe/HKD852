"use client";

import { ElementDistribution, Element } from "@/lib/saju/types";
import { ELEMENT_COLORS, ELEMENT_NAMES } from "@/lib/saju/mappings";

const ELEMENT_ORDER: Element[] = ["wood", "fire", "earth", "metal", "water"];

interface ElementChartProps {
  distribution: ElementDistribution;
  dominantElement: Element;
}

export default function ElementChart({ distribution, dominantElement }: ElementChartProps) {
  const total = Object.values(distribution).reduce((sum, v) => sum + v, 0) || 1;

  return (
    <div className="bg-surface rounded-2xl border border-surface-border p-5">
      <h3 className="text-[13px] font-medium text-text-dim text-center mb-5">오행 분포</h3>
      <div className="space-y-3 mb-5">
        {ELEMENT_ORDER.map((el) => {
          const count = distribution[el];
          const percent = Math.round((count / total) * 100);
          const isDominant = el === dominantElement;
          const color = ELEMENT_COLORS[el];
          return (
            <div key={el} className="flex items-center gap-3">
              <span className="text-[13px] font-medium w-7 text-right shrink-0" style={{ color: isDominant ? color : `${color}80` }}>
                {ELEMENT_NAMES[el]}
              </span>
              <div className="flex-1 h-5 bg-surface-light rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${Math.max(percent, 4)}%`, backgroundColor: isDominant ? color : `${color}50` }} />
              </div>
              <span className={`text-[13px] w-9 text-right tabular-nums ${isDominant ? "font-bold" : "text-text-dim"}`} style={isDominant ? { color } : undefined}>
                {percent}%
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-center text-[13px] text-text-dim">
        <span className="font-bold" style={{ color: ELEMENT_COLORS[dominantElement] }}>
          {ELEMENT_NAMES[dominantElement]}
        </span>
        의 기운이 가장 강해
      </p>
    </div>
  );
}
