"use client";

import { ElementDistribution, Element } from "@/lib/saju/types";
import { ELEMENT_COLORS, ELEMENT_NAMES } from "@/lib/saju/mappings";

const ELEMENT_ICONS: Record<Element, string> = {
  wood: "🌿",
  fire: "🔥",
  earth: "🏔️",
  metal: "⚔️",
  water: "💧",
};

const ELEMENT_ORDER: Element[] = ["wood", "fire", "earth", "metal", "water"];

interface ElementChartProps {
  distribution: ElementDistribution;
  dominantElement: Element;
}

export default function ElementChart({ distribution, dominantElement }: ElementChartProps) {
  const total = Object.values(distribution).reduce((sum, v) => sum + v, 0) || 1;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <h3 className="text-sm font-medium text-gray-400 text-center mb-4">
        나의 오행 분포
      </h3>

      {/* Pentagon-style visual */}
      <div className="flex justify-center gap-2 mb-4">
        {ELEMENT_ORDER.map((el) => {
          const count = distribution[el];
          const percent = Math.round((count / total) * 100);
          const isDominant = el === dominantElement;
          const color = ELEMENT_COLORS[el];

          return (
            <div
              key={el}
              className={`flex flex-col items-center gap-1 flex-1 py-3 rounded-xl transition-all ${
                isDominant ? "ring-2 ring-offset-1" : ""
              }`}
              style={{
                backgroundColor: `${color}12`,
                ...(isDominant ? { boxShadow: `0 0 0 2px ${color}40` } : {}),
              }}
            >
              <span className="text-xl">{ELEMENT_ICONS[el]}</span>
              <span
                className="text-xs font-bold"
                style={{ color }}
              >
                {ELEMENT_NAMES[el]}
              </span>

              {/* Bar */}
              <div className="w-6 h-12 bg-gray-100 rounded-full overflow-hidden flex flex-col-reverse">
                <div
                  className="w-full rounded-full transition-all duration-700"
                  style={{
                    height: `${Math.max(percent, 10)}%`,
                    backgroundColor: color,
                  }}
                />
              </div>

              <span className="text-[10px] text-gray-400 font-medium">
                {percent}%
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-gray-400">
        <span
          className="font-bold"
          style={{ color: ELEMENT_COLORS[dominantElement] }}
        >
          {ELEMENT_ICONS[dominantElement]} {ELEMENT_NAMES[dominantElement]}
        </span>
        의 기운이 가장 강해요!
      </p>
    </div>
  );
}
