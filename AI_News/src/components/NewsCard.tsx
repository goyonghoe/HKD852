import { NewsItem, CATEGORY_META } from "@/lib/types";

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 0 || isNaN(seconds)) return "";
  if (seconds < 60) return "방금";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}분 전`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}시간 전`;
  return `${Math.floor(seconds / 86400)}일 전`;
}

const SOURCE_COLORS: Record<string, string> = {
  TechCrunch: "text-green-400",
  "The Verge": "text-purple-400",
  VentureBeat: "text-sky-400",
  "MIT Tech Review": "text-red-400",
  "Ars Technica": "text-orange-400",
  "Hacker News": "text-amber-400",
  Lobsters: "text-rose-400",
  "Dev.to": "text-indigo-400",
  TechMeme: "text-lime-400",
  "Product Hunt": "text-orange-300",
  "Google News": "text-blue-400",
};

function getSourceColor(source: string): string {
  if (source.endsWith(" AI")) return "text-cyan-400";
  return SOURCE_COLORS[source] || "text-zinc-400";
}

// ── 핵심 뉴스 카드 (1개) ──────────────────────────────────
export function HeroCard({ article }: { article: NewsItem }) {
  const cat = CATEGORY_META[article.category];
  const ago = timeAgo(article.publishedAt);

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-2xl bg-zinc-900/80 border border-zinc-700/50 p-5 transition-all active:scale-[0.98] hover:border-zinc-600/60"
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`text-sm font-medium ${getSourceColor(article.source)}`}
        >
          {article.source}
        </span>
        <span
          className={`px-2 py-0.5 text-xs rounded-full border ${cat.color}`}
        >
          {cat.label}
        </span>
        {ago && <span className="ml-auto text-sm text-zinc-600">{ago}</span>}
      </div>

      <h3 className="text-xl font-semibold text-zinc-50 leading-snug mb-2">
        {article.title}
      </h3>

      {article.summary !== article.title && (
        <p className="text-base text-zinc-400 leading-relaxed line-clamp-2">
          {article.summary}
        </p>
      )}
    </a>
  );
}

// ── 제목 위주 리스트 아이템 ───────────────────────────────
export function NewsListItem({ article }: { article: NewsItem }) {
  const ago = timeAgo(article.publishedAt);

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 py-3.5 border-b border-zinc-800/40 transition-colors active:bg-zinc-800/30"
    >
      <span className="mt-2.5 w-1.5 h-1.5 flex-shrink-0 rounded-full bg-zinc-600" />
      <div className="min-w-0 flex-1">
        <h4 className="text-base text-zinc-200 leading-snug">
          {article.title}
        </h4>
        <div className="flex items-center gap-2 mt-1.5">
          <span className={`text-sm ${getSourceColor(article.source)}`}>
            {article.source}
          </span>
          {ago && (
            <>
              <span className="text-zinc-700">·</span>
              <span className="text-sm text-zinc-600">{ago}</span>
            </>
          )}
          {article.engagement > 100 && (
            <>
              <span className="text-zinc-700">·</span>
              <span className="text-sm text-zinc-600">
                {article.engagement.toLocaleString()}p
              </span>
            </>
          )}
        </div>
      </div>
    </a>
  );
}

// ── 지역별 제목 리스트 아이템 ─────────────────────────────
export function RegionalListItem({ article }: { article: NewsItem }) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-2.5 py-2 transition-colors active:bg-zinc-800/30"
    >
      <span className="mt-2.5 w-1.5 h-1.5 flex-shrink-0 rounded-full bg-zinc-700" />
      <span className="text-[15px] text-zinc-300 leading-snug line-clamp-1">
        {article.title}
      </span>
    </a>
  );
}
