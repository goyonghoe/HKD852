"use client";

import { Pillar, Element } from "@/lib/saju/types";
import { ELEMENT_COLORS } from "@/lib/saju/mappings";

const ELEMENT_ICONS: Record<Element, string> = {
  wood: "🌿",
  fire: "🔥",
  earth: "🏔️",
  metal: "⚔️",
  water: "💧",
};

interface PillarCardProps {
  label: string;
  pillar: Pillar | null;
}

export default function PillarCard({ label, pillar }: PillarCardProps) {
  if (!pillar) {
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs text-gray-400">{label}</span>
        <div className="w-[72px] h-24 rounded-xl bg-gray-50 border border-dashed border-gray-200 flex flex-col items-center justify-center gap-1">
          <span className="text-lg">❓</span>
          <span className="text-gray-300 text-[10px]">미입력</span>
        </div>
      </div>
    );
  }

  const stemColor = ELEMENT_COLORS[pillar.heavenlyStem.element];
  const branchColor = ELEMENT_COLORS[pillar.earthlyBranch.element];

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-gray-400">{label}</span>
      <div className="w-[72px] rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
        {/* Heavenly Stem */}
        <div
          className="py-2 text-center relative"
          style={{ backgroundColor: `${stemColor}12` }}
        >
          <span className="absolute top-0.5 right-1 text-[10px]">
            {ELEMENT_ICONS[pillar.heavenlyStem.element]}
          </span>
          <span
            className="text-xl font-bold"
            style={{ color: stemColor }}
          >
            {pillar.heavenlyStem.hanja}
          </span>
          <p className="text-[10px] text-gray-500 mt-0.5">
            {pillar.heavenlyStem.korean}
          </p>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100" />

        {/* Earthly Branch */}
        <div
          className="py-2 text-center relative"
          style={{ backgroundColor: `${branchColor}12` }}
        >
          <span className="absolute top-0.5 right-1 text-[10px]">
            {ELEMENT_ICONS[pillar.earthlyBranch.element]}
          </span>
          <span
            className="text-xl font-bold"
            style={{ color: branchColor }}
          >
            {pillar.earthlyBranch.hanja}
          </span>
          <p className="text-[10px] text-gray-500 mt-0.5">
            {pillar.earthlyBranch.korean}
          </p>
        </div>
      </div>
    </div>
  );
}
