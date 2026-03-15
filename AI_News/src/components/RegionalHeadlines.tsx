import { NewsItem, Region, REGION_META } from "@/lib/types";
import { RegionalListItem } from "./NewsCard";

const REGION_ORDER: Region[] = ["us", "kr", "cn", "jp", "eu"];
const PER_REGION = 4;

export function RegionalHeadlines({ articles }: { articles: NewsItem[] }) {
  const grouped = articles.reduce(
    (acc, article) => {
      if (!acc[article.region]) acc[article.region] = [];
      if (acc[article.region].length < PER_REGION) {
        acc[article.region].push(article);
      }
      return acc;
    },
    {} as Record<Region, NewsItem[]>,
  );

  const hasAny = REGION_ORDER.some((r) => (grouped[r]?.length || 0) > 0);
  if (!hasAny) return null;

  return (
    <section className="mt-6 mb-4">
      <h2 className="text-sm font-semibold text-zinc-500 tracking-wider mb-3 px-1">
        글로벌 AI 헤드라인
      </h2>
      <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/40 divide-y divide-zinc-800/30">
        {REGION_ORDER.map((region) => {
          const items = grouped[region];
          if (!items || items.length === 0) return null;
          const meta = REGION_META[region];

          return (
            <div key={region} className="px-4 py-3">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-base">{meta.flag}</span>
                <span className="text-sm font-medium text-zinc-400">
                  {meta.label}
                </span>
              </div>
              <div>
                {items.map((article) => (
                  <RegionalListItem key={article.id} article={article} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
