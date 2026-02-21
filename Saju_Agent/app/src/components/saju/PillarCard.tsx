"use client";

import { Pillar } from "@/lib/saju/types";
import { ELEMENT_COLORS } from "@/lib/saju/mappings";

interface PillarCardProps {
  label: string;
  pillar: Pillar | null;
  tenGodLabel?: string;        // 천간 십신
  branchTenGod?: string;       // 지지(본기) 십신
  hiddenStems?: string[];      // 지장간 한자 배열
  twelveStage?: string;        // 12운성
  isVoid?: boolean;            // 공망
  isDayMaster?: boolean;       // "나" 표시
  pillarStars?: string[];      // 해당 주에 걸린 신살 이름들
  pillarRelations?: string[];  // 해당 주의 합/충 관계 축약
}

export default function PillarCard({
  label,
  pillar,
  tenGodLabel,
  branchTenGod,
  hiddenStems,
  twelveStage,
  isVoid = false,
  isDayMaster = false,
  pillarStars,
  pillarRelations,
}: PillarCardProps) {
  if (!pillar) {
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="text-[11px] text-text-dim font-medium">{label}</span>
        <div className="w-full rounded-xl bg-surface-light border border-dashed border-surface-border overflow-hidden">
          {/* 상단 라벨 자리 */}
          <div className="py-1 text-center border-b border-surface-border/50">
            <span className="text-[10px] text-text-dim/30">&nbsp;</span>
          </div>
          {/* 천간 자리 */}
          <div className="py-2 text-center">
            <span className="text-lg font-bold text-text-dim/30">?</span>
            <p className="text-[10px] text-text-dim/30 mt-0.5">&nbsp;</p>
          </div>
          <div className="h-px bg-surface-border/50" />
          {/* 지지 자리 */}
          <div className="py-2 text-center">
            <span className="text-lg font-bold text-text-dim/30">?</span>
            <p className="text-[10px] text-text-dim/30 mt-0.5">몰라</p>
          </div>
          {/* 지장간 자리 */}
          <div className="py-1 text-center border-t border-surface-border/50">
            <span className="text-[9px]">&nbsp;</span>
          </div>
          {/* 12운성 자리 */}
          <div className="py-1 text-center border-t border-surface-border/50">
            <span className="text-[10px] text-text-dim/30">&nbsp;</span>
          </div>
        </div>
        {/* 신살 자리 — 높이 맞춤 */}
        <div className="w-full min-h-[18px] mt-0.5" />
      </div>
    );
  }

  const stemColor = ELEMENT_COLORS[pillar.heavenlyStem.element];
  const branchColor = ELEMENT_COLORS[pillar.earthlyBranch.element];

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[11px] text-text-dim font-medium">{label}</span>
      <div
        className={`w-full rounded-xl bg-surface overflow-hidden relative ${
          isVoid
            ? "border border-dashed border-text-dim/30"
            : "border border-surface-border"
        }`}
      >
        {/* 공망 — 점선 테두리로만 표현 (空 배지 제거) */}

        {/* 상단 라벨: 일주="나", 나머지=십신 */}
        <div className="py-1 text-center border-b border-surface-border/50">
          {isDayMaster ? (
            <span className="text-[10px] font-bold text-gold">나</span>
          ) : tenGodLabel ? (
            <span className="text-[10px] font-medium text-teal">{tenGodLabel}</span>
          ) : (
            <span className="text-[10px] text-text-dim/30">&nbsp;</span>
          )}
        </div>

        {/* 천간: 한자 + 한글(십신) */}
        <div className="py-2 text-center" style={{ backgroundColor: `${stemColor}12` }}>
          <span className="text-lg font-bold" style={{ color: stemColor }}>
            {pillar.heavenlyStem.hanja}
          </span>
          <p className="text-[10px] text-text-dim mt-0.5">
            {pillar.heavenlyStem.korean}
            {tenGodLabel && (
              <span className="text-teal">({tenGodLabel})</span>
            )}
          </p>
        </div>

        <div className="h-px bg-surface-border" />

        {/* 지지: 한자 + 한글(십신) */}
        <div className="py-2 text-center" style={{ backgroundColor: `${branchColor}12` }}>
          <span className="text-lg font-bold" style={{ color: branchColor }}>
            {pillar.earthlyBranch.hanja}
          </span>
          <p className="text-[10px] text-text-dim mt-0.5">
            {pillar.earthlyBranch.korean}
            {branchTenGod && (
              <span className="text-teal">({branchTenGod})</span>
            )}
          </p>
        </div>

        {/* 지장간 — 항상 높이 확보 */}
        <div className="py-1 text-center border-t border-surface-border/50 bg-surface-light/50">
          <span className="text-[9px] text-text-dim tracking-wider">
            {hiddenStems && hiddenStems.length > 0 ? hiddenStems.join("") : "\u00A0"}
          </span>
        </div>

        {/* 12운성 */}
        <div className="py-1 text-center border-t border-surface-border/50">
          {twelveStage ? (
            <span className="text-[10px] font-medium text-gold/80">{twelveStage}</span>
          ) : (
            <span className="text-[10px] text-text-dim/30">&nbsp;</span>
          )}
        </div>
      </div>

      {/* 카드 아래: 신살 + 합 관계 — 항상 min-height 확보 */}
      <div className="w-full min-h-[18px] text-center space-y-0.5 mt-0.5">
        {pillarStars && pillarStars.length > 0 && (
          <div className="flex flex-wrap justify-center gap-0.5">
            {pillarStars.map((star) => (
              <span
                key={star}
                className="text-[8px] px-1 py-0.5 rounded bg-surface-light text-text-secondary border border-surface-border/50"
              >
                {star}
              </span>
            ))}
          </div>
        )}
        {pillarRelations && pillarRelations.length > 0 && (
          <div className="flex flex-wrap justify-center gap-0.5">
            {pillarRelations.map((rel, i) => (
              <span
                key={i}
                className="text-[8px] px-1 py-0.5 rounded bg-teal/10 text-teal border border-teal/20"
              >
                {rel}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
