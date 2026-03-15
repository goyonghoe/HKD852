import Link from "next/link";
import type { TestMeta } from "@/lib/tests/types";

interface TestCardProps {
  meta: TestMeta;
}

export default function TestCard({ meta }: TestCardProps) {
  const hasBadge = meta.isTrending || meta.isNew;

  return (
    <Link href={`/test/${meta.slug}`} className="block">
      <div
        className="rounded-2xl bg-white p-5 shadow-sm
                    hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5
                    card-hover relative overflow-hidden border border-surface-border"
      >
        {/* Accent color top bar */}
        <div
          className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
          style={{ backgroundColor: meta.color }}
        />

        {/* Badges — 타이틀과 완전 분리된 별도 행 */}
        {hasBadge && (
          <div className="flex gap-1.5 mb-3">
            {meta.isTrending && (
              <span className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-bold">
                🔥 인기
              </span>
            )}
            {meta.isNew && (
              <span className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                ✨ NEW
              </span>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex items-center gap-4">
          {/* Emoji */}
          <div
            className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
            style={{ backgroundColor: `${meta.color}18` }}
          >
            {meta.emoji}
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-text-primary text-lg mb-1 leading-snug">
              {meta.title}
            </h3>
            <p className="text-sm text-text-secondary line-clamp-2 mb-2.5">
              {meta.shortDescription}
            </p>

            {/* Meta tags */}
            <div className="flex items-center gap-2.5 text-sm text-text-dim">
              <span className="inline-flex items-center gap-1">
                ⏱ {meta.estimatedMinutes}분
              </span>
              <span className="text-surface-border">·</span>
              <span className="inline-flex items-center gap-1">
                📝 {meta.questionCount}문항
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
