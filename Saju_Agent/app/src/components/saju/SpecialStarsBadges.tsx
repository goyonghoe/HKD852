"use client";

import { SpecialStarsResult, BranchRelationsResult } from "@/lib/saju/types";

const STAR_ICONS: Record<string, string> = {
  yeokma: "🐎",
  dohwa: "🌸",
  hwagae: "📚",
  cheoneuil: "⭐",
  gwimun: "👻",
  hongyeom: "💋",
  baekho: "🐯",
  ildeok: "🌟",
  taeguk: "☯",
};

const RELATION_LABELS: Record<string, { label: string; color: string }> = {
  combination: { label: "합", color: "text-teal" },
  clash: { label: "충", color: "text-ember" },
  punishment: { label: "형", color: "text-gold" },
  harm: { label: "해", color: "text-text-dim" },
  halfCombination: { label: "반합", color: "text-teal/70" },
};

const PILLAR_KOREAN: Record<string, string> = {
  year: "년",
  month: "월",
  day: "일",
  hour: "시",
};

interface SpecialStarsBadgesProps {
  stars?: SpecialStarsResult;
  branchRelations?: BranchRelationsResult;
}

export default function SpecialStarsBadges({ stars, branchRelations }: SpecialStarsBadgesProps) {
  const presentStars = stars?.stars.filter((s) => s.present) || [];
  const relations = branchRelations?.relations || [];

  if (presentStars.length === 0 && relations.length === 0) return null;

  return (
    <div className="flex flex-wrap justify-center gap-1.5 mt-3">
      {presentStars.map((star) => (
        <span
          key={star.key}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface border border-surface-border text-[11px] text-text-secondary"
        >
          <span>{STAR_ICONS[star.key] || "✦"}</span>
          <span>{star.korean}</span>
        </span>
      ))}
      {relations.map((rel, i) => {
        const style = RELATION_LABELS[rel.type] || RELATION_LABELS.harm;
        const p0 = PILLAR_KOREAN[rel.pillars[0]] || rel.pillars[0];
        const p1 = PILLAR_KOREAN[rel.pillars[1]] || rel.pillars[1];
        return (
          <span
            key={`${rel.type}-${i}`}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface border border-surface-border text-[11px] ${style.color}`}
          >
            <span>{rel.branches[0]}{rel.branches[1]}</span>
            <span>{p0}{p1}</span>
            <span className="font-bold">{style.label}</span>
          </span>
        );
      })}
    </div>
  );
}
