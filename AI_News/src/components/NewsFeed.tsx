"use client";

import { useState } from "react";
import { NewsItem, Category, CATEGORY_META } from "@/lib/types";
import { NewsListItem } from "./NewsCard";

const ALL_CATEGORIES: (Category | "all")[] = [
  "all",
  "research",
  "industry",
  "regulation",
  "startup",
  "opensource",
];

const CATEGORY_LABELS: Record<string, string> = {
  all: "전체",
  research: "연구",
  industry: "산업",
  regulation: "규제",
  startup: "스타트업",
  opensource: "오픈소스",
};

export function NewsFeed({ articles }: { articles: NewsItem[] }) {
  const [active, setActive] = useState<Category | "all">("all");

  const filtered =
    active === "all" ? articles : articles.filter((a) => a.category === active);

  const counts = articles.reduce(
    (acc, a) => {
      acc[a.category] = (acc[a.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const sourceCount = new Set(articles.map((a) => a.source)).size;

  return (
    <section className="mt-6">
      {/* 카테고리 필터 */}
      <div className="sticky top-[61px] z-40 bg-zinc-950/90 backdrop-blur-lg -mx-4 px-4 py-2.5 border-b border-zinc-800/30">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {ALL_CATEGORIES.map((cat) => {
            const isActive = active === cat;
            const count = cat === "all" ? articles.length : counts[cat] || 0;
            return (
              <button
                key={cat}
                onClick={() => setActive(cat)}
                className={`flex-shrink-0 px-3.5 py-2 rounded-full text-sm font-medium transition-all ${
                  isActive
                    ? "bg-zinc-100 text-zinc-900"
                    : "bg-zinc-800/60 text-zinc-400 active:bg-zinc-700"
                }`}
              >
                {CATEGORY_LABELS[cat]}
                <span className="ml-1 text-zinc-500">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 제목 위주 리스트 */}
      <div className="mt-1">
        <h2 className="text-sm font-semibold text-zinc-500 tracking-wider mt-3 mb-1 px-1">
          전체 뉴스
        </h2>
        {filtered.length > 0 ? (
          filtered.map((article) => (
            <NewsListItem key={article.id} article={article} />
          ))
        ) : (
          <div className="text-center py-12 text-zinc-600 text-base">
            이 카테고리에 해당하는 기사가 없습니다.
          </div>
        )}
      </div>

      {/* 푸터 */}
      <div className="text-center py-8 text-zinc-700 text-sm">
        {sourceCount}개 소스에서 {articles.length}개 기사 수집
      </div>
    </section>
  );
}
