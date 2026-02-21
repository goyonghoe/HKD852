"use client";

import {
  FourPillars,
  TenGodsResult,
  TwelveStagesResult,
  GongmangResult,
  SpecialStarsResult,
  BranchRelationsResult,
} from "@/lib/saju/types";
import { HEAVENLY_STEMS } from "@/lib/saju/mappings";
import { getHiddenStemHanjas, getBranchMainGod } from "@/lib/saju/ten-gods";
import PillarCard from "./PillarCard";
import Card from "../ui/Card";

const PILLAR_KOREAN: Record<string, string> = {
  year: "년",
  month: "월",
  day: "일",
  hour: "시",
};

interface FourPillarsDisplayProps {
  pillars: FourPillars;
  animated?: boolean;
  tenGods?: TenGodsResult;
  twelveStages?: TwelveStagesResult;
  gongmang?: GongmangResult;
  specialStars?: SpecialStarsResult;
  branchRelations?: BranchRelationsResult;
}

export default function FourPillarsDisplay({
  pillars,
  animated = false,
  tenGods,
  twelveStages,
  gongmang,
  specialStars,
  branchRelations,
}: FourPillarsDisplayProps) {
  // 공망 체크: 지지 한자가 공망 브랜치에 포함되는지
  const isVoid = (pillarKey: "year" | "month" | "day" | "hour") => {
    if (!gongmang || !pillars[pillarKey]) return false;
    const branchHanja = pillars[pillarKey]!.earthlyBranch.hanja;
    return gongmang.voidBranches.includes(branchHanja);
  };

  // 일간 인덱스 (지지 십신, 지장간 십신 계산용)
  const dayMasterIdx = HEAVENLY_STEMS.findIndex(
    (s) => s.name === pillars.day.heavenlyStem.name
  );

  // 지지 본기 십신 (일주 포함 — 모든 기둥에 십신 표시)
  const getBranchTenGod = (pillarKey: "year" | "month" | "day" | "hour") => {
    const p = pillars[pillarKey];
    if (!p) return undefined;
    const god = getBranchMainGod(dayMasterIdx, p.earthlyBranch.name);
    return god?.korean;
  };

  // 지장간 한자
  const getHiddenStems = (pillarKey: "year" | "month" | "day" | "hour") => {
    const p = pillars[pillarKey];
    if (!p) return undefined;
    return getHiddenStemHanjas(p.earthlyBranch.name);
  };

  // 해당 주에 걸린 신살 목록
  const getPillarStars = (pillarKey: string) => {
    if (!specialStars) return undefined;
    const stars = specialStars.stars
      .filter((s) => s.present && s.affectedPillars.includes(pillarKey))
      .map((s) => s.korean);
    return stars.length > 0 ? stars : undefined;
  };

  // 해당 주의 합/충 관계
  const getPillarRelations = (pillarKey: string) => {
    if (!branchRelations) return undefined;
    const rels = branchRelations.relations
      .filter((r) => r.pillars.includes(pillarKey))
      .map((r) => {
        const otherPillar = r.pillars[0] === pillarKey ? r.pillars[1] : r.pillars[0];
        const otherKorean = PILLAR_KOREAN[otherPillar] || otherPillar;
        return `${r.branches[0]}${r.branches[1]}${r.korean}`;
      });
    return rels.length > 0 ? rels : undefined;
  };

  const pillarData = [
    {
      key: "hour" as const,
      label: "시주",
      pillar: pillars.hour,
      delay: 0.45,
      tenGod: tenGods?.positions.hourStem?.korean,
      stage: twelveStages?.stages.hour?.korean,
      isDayMaster: false,
    },
    {
      key: "day" as const,
      label: "일주",
      pillar: pillars.day,
      delay: 0.3,
      tenGod: "비견",
      stage: twelveStages?.stages.day?.korean,
      isDayMaster: true,
    },
    {
      key: "month" as const,
      label: "월주",
      pillar: pillars.month,
      delay: 0.15,
      tenGod: tenGods?.positions.monthStem?.korean,
      stage: twelveStages?.stages.month?.korean,
      isDayMaster: false,
    },
    {
      key: "year" as const,
      label: "년주",
      pillar: pillars.year,
      delay: 0,
      tenGod: tenGods?.positions.yearStem?.korean,
      stage: twelveStages?.stages.year?.korean,
      isDayMaster: false,
    },
  ];

  // 공망 표시 텍스트
  const gongmangDisplay = gongmang
    ? gongmang.voidBranches.join(" ")
    : null;

  return (
    <Card>
      <h3 className="text-[13px] font-medium text-text-dim text-center mb-4">
        사주 팔자
      </h3>
      <div className="grid grid-cols-4 gap-2 max-w-[360px] mx-auto items-start">
        {pillarData.map(({ key, label, pillar, delay, tenGod, stage, isDayMaster }) => (
          <div
            key={label}
            className={`${animated ? "pillar-animate" : ""}`}
            style={animated ? { animationDelay: `${delay}s` } : undefined}
          >
            <PillarCard
              label={label}
              pillar={pillar}
              tenGodLabel={tenGod}
              branchTenGod={getBranchTenGod(key)}
              hiddenStems={getHiddenStems(key)}
              twelveStage={stage}
              isVoid={isVoid(key)}
              isDayMaster={isDayMaster}
              pillarStars={getPillarStars(key)}
              pillarRelations={getPillarRelations(key)}
            />
          </div>
        ))}
      </div>
      {/* 공망 — 쉬운 설명 포함 */}
      {gongmangDisplay && (
        <p className="text-[10px] text-text-dim/60 text-center mt-2">
          공망: {gongmangDisplay} — 이 기운이 비어있어 해당 기둥이 허한 편
        </p>
      )}
    </Card>
  );
}
