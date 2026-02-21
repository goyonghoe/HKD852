"use client";

import {
  FourPillars,
  Pillar,
  TenGodsResult,
  TwelveStagesResult,
  GongmangResult,
  SpecialStarsResult,
  BranchRelationsResult,
} from "@/lib/saju/types";
import { HEAVENLY_STEMS, ELEMENT_COLORS } from "@/lib/saju/mappings";
import { getHiddenStemHanjas, getBranchMainGod } from "@/lib/saju/ten-gods";
import Card from "../ui/Card";

const PILLAR_KEYS = ["hour", "day", "month", "year"] as const;
type PillarKey = (typeof PILLAR_KEYS)[number];
const PILLAR_HEADERS = ["시주", "일주", "월주", "년주"];

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
  const dayMasterIdx = HEAVENLY_STEMS.findIndex(
    (s) => s.name === pillars.day.heavenlyStem.name
  );

  const getP = (key: PillarKey): Pillar | null => pillars[key];

  const isVoid = (key: PillarKey) => {
    if (!gongmang || !pillars[key]) return false;
    return gongmang.voidBranches.includes(pillars[key]!.earthlyBranch.hanja);
  };

  const getStemTenGod = (key: PillarKey) => {
    if (key === "day") return undefined;
    const map = { hour: "hourStem", month: "monthStem", year: "yearStem" } as const;
    return tenGods?.positions[map[key as "hour" | "month" | "year"]]?.korean;
  };

  const getBranchGod = (key: PillarKey) => {
    const p = getP(key);
    if (!p) return undefined;
    return getBranchMainGod(dayMasterIdx, p.earthlyBranch.name);
  };

  // 지장간: 한자 + 십신명 결합
  const getHiddenStemDisplay = (key: PillarKey) => {
    const p = getP(key);
    if (!p) return null;
    const stemHanjas = getHiddenStemHanjas(p.earthlyBranch.name);
    const map = { year: "yearBranch", month: "monthBranch", day: "dayBranch", hour: "hourBranch" } as const;
    const gods = tenGods?.hiddenStems[map[key]];
    return stemHanjas.map((h, i) => ({
      stemHanja: h,
      godKorean: gods?.[i]?.korean,
    }));
  };

  const getStage = (key: PillarKey) => twelveStages?.stages[key] ?? null;

  const getPillarStars = (key: string) => {
    if (!specialStars) return undefined;
    const stars = specialStars.stars
      .filter((s) => s.present && s.affectedPillars.includes(key))
      .map((s) => s.korean);
    return stars.length > 0 ? stars : undefined;
  };

  const getPillarRelations = (key: string) => {
    if (!branchRelations) return undefined;
    const rels = branchRelations.relations
      .filter((r) => r.pillars.includes(key))
      .map((r) => `${r.branches[0]}${r.branches[1]}${r.korean}`);
    return rels.length > 0 ? rels : undefined;
  };

  const gongmangDisplay = gongmang ? gongmang.voidBranches.join(" ") : null;

  // ─── Cell styling helpers ───
  const lbl = (isLastRow = false) => {
    let cls = "bg-surface-light/80 flex items-center justify-center px-0.5 border-r border-surface-border/50";
    if (!isLastRow) cls += " border-b border-surface-border/50";
    return cls;
  };

  const dc = (colIdx: number, isLastRow = false) => {
    let cls = "text-center";
    if (colIdx < 3) cls += " border-r border-surface-border/50";
    if (!isLastRow) cls += " border-b border-surface-border/50";
    return cls;
  };

  return (
    <Card>
      <h3 className="text-[13px] font-medium text-text-dim text-center mb-4">
        사주 팔자
      </h3>

      <div className="max-w-[400px] mx-auto">
        {/* ─── 만세력 테이블 ─── */}
        <div className="grid grid-cols-[36px_1fr_1fr_1fr_1fr] border border-surface-border rounded-xl overflow-hidden">

          {/* ─── Row 0: Header (시주/일주/월주/년주) ─── */}
          <div className={`${lbl()} bg-surface-light`} />
          {PILLAR_KEYS.map((key, i) => (
            <div key={key} className={`${dc(i)} bg-surface-light py-1.5`}>
              <span className="text-[11px] font-medium text-text-dim">{PILLAR_HEADERS[i]}</span>
            </div>
          ))}

          {/* ─── Row 1: 십신 ─── */}
          <div className={lbl()}>
            <span className="text-[9px] text-text-dim/70 font-medium">십신</span>
          </div>
          {PILLAR_KEYS.map((key, i) => {
            const p = getP(key);
            return (
              <div key={key} className={`${dc(i)} py-1.5`}>
                {key === "day" ? (
                  <span className="text-[11px] font-bold text-gold">나(일간)</span>
                ) : !p ? (
                  <span className="text-[11px] text-text-dim/30">-</span>
                ) : (
                  <span className="text-[11px] font-medium text-teal">{getStemTenGod(key) || "-"}</span>
                )}
              </div>
            );
          })}

          {/* ─── Row 2: 천간 ─── */}
          <div className={lbl()}>
            <span className="text-[9px] text-text-dim/70 font-medium">천간</span>
          </div>
          {PILLAR_KEYS.map((key, i) => {
            const p = getP(key);
            if (!p) {
              return (
                <div key={key} className={`${dc(i)} py-3`}>
                  <span className="text-xl font-bold text-text-dim/30">?</span>
                </div>
              );
            }
            const color = ELEMENT_COLORS[p.heavenlyStem.element];
            return (
              <div
                key={key}
                className={`${dc(i)} py-3`}
                style={{ backgroundColor: `${color}12` }}
              >
                <span className="text-xl font-bold block leading-none" style={{ color }}>
                  {p.heavenlyStem.hanja}
                </span>
                <span className="text-[10px] text-text-dim mt-0.5 block">
                  {p.heavenlyStem.korean}
                </span>
              </div>
            );
          })}

          {/* ─── Row 3: 지지 ─── */}
          <div className={lbl()}>
            <span className="text-[9px] text-text-dim/70 font-medium">지지</span>
          </div>
          {PILLAR_KEYS.map((key, i) => {
            const p = getP(key);
            if (!p) {
              return (
                <div key={key} className={`${dc(i)} py-3`}>
                  <span className="text-xl font-bold text-text-dim/30">?</span>
                </div>
              );
            }
            const color = ELEMENT_COLORS[p.earthlyBranch.element];
            const branchGod = getBranchGod(key);
            return (
              <div
                key={key}
                className={`${dc(i)} py-3 ${isVoid(key) ? "opacity-60" : ""}`}
                style={{ backgroundColor: `${color}12` }}
              >
                <span className="text-xl font-bold block leading-none" style={{ color }}>
                  {p.earthlyBranch.hanja}
                </span>
                <span className="text-[10px] text-text-dim mt-0.5 block">
                  {p.earthlyBranch.korean}
                  {branchGod && <span className="text-teal ml-0.5">({branchGod.korean})</span>}
                </span>
              </div>
            );
          })}

          {/* ─── Row 4: 지장간 (한자 + 십신명) ─── */}
          <div className={lbl()}>
            <span className="text-[9px] text-text-dim/70 font-medium leading-tight">지장간</span>
          </div>
          {PILLAR_KEYS.map((key, i) => {
            const display = getHiddenStemDisplay(key);
            if (!display) {
              return (
                <div key={key} className={`${dc(i)} py-1.5`}>
                  <span className="text-[9px] text-text-dim/30">-</span>
                </div>
              );
            }
            return (
              <div key={key} className={`${dc(i)} py-1 bg-surface-light/30`}>
                <div className="flex flex-col items-center">
                  {display.map((d, di) => (
                    <span key={di} className="text-[9px] leading-tight">
                      <span className="font-medium text-text-dim">{d.stemHanja}</span>
                      {d.godKorean && <span className="text-teal text-[8px]">{d.godKorean}</span>}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}

          {/* ─── Row 5: 12운성 (한자 + 한글) ─── */}
          <div className={lbl(true)}>
            <span className="text-[8px] text-text-dim/70 font-medium leading-tight">12운성</span>
          </div>
          {PILLAR_KEYS.map((key, i) => {
            const stage = getStage(key);
            return (
              <div key={key} className={`${dc(i, true)} py-1.5`}>
                {stage ? (
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-medium text-gold/80">{stage.hanja}</span>
                    <span className="text-[9px] text-text-dim">{stage.korean}</span>
                  </div>
                ) : (
                  <span className="text-[10px] text-text-dim/30">-</span>
                )}
              </div>
            );
          })}
        </div>

        {/* ─── 신살 & 합충 뱃지 ─── */}
        {(specialStars || branchRelations) && (
          <div className="grid grid-cols-[36px_1fr_1fr_1fr_1fr] gap-0 mt-1.5">
            <div />
            {PILLAR_KEYS.map((key) => {
              const stars = getPillarStars(key);
              const rels = getPillarRelations(key);
              if (!stars && !rels) return <div key={key} className="min-h-[16px]" />;
              return (
                <div key={key} className="text-center space-y-0.5 px-0.5">
                  {stars?.map((star) => (
                    <span
                      key={star}
                      className="inline-block text-[8px] px-1 py-0.5 rounded bg-surface-light text-text-secondary border border-surface-border/50 mr-0.5"
                    >
                      {star}
                    </span>
                  ))}
                  {rels?.map((rel, ri) => (
                    <span
                      key={ri}
                      className="inline-block text-[8px] px-1 py-0.5 rounded bg-teal/10 text-teal border border-teal/20 mr-0.5"
                    >
                      {rel}
                    </span>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* ─── 공망 ─── */}
        {gongmangDisplay && (
          <p className="text-[10px] text-text-dim/60 text-center mt-2">
            공망: {gongmangDisplay} — 이 기운이 비어있어 해당 기둥이 허한 편
          </p>
        )}
      </div>
    </Card>
  );
}
