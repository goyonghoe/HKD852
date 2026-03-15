import { fetchAllNews } from "@/lib/rss";
import { generateTrendBrief, translateTitles } from "@/lib/gemini";
import { Header } from "@/components/Header";
import { TrendSummary } from "@/components/TrendSummary";
import { HeroCard } from "@/components/NewsCard";
import { RegionalHeadlines } from "@/components/RegionalHeadlines";
import { NewsFeed } from "@/components/NewsFeed";
import { FloatingNav } from "@/components/FloatingNav";

export const revalidate = 21600; // 6시간 ISR

export default async function Home() {
  const rawArticles = await fetchAllNews();

  // 트렌드 분석 + 제목 한글 번역을 병렬 실행
  const [brief, articles] = await Promise.all([
    generateTrendBrief(rawArticles),
    translateTitles(rawArticles),
  ]);

  const lastUpdated = new Date().toISOString();
  const heroArticle = articles[0] || null;
  const restArticles = articles.slice(1);

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header lastUpdated={lastUpdated} />
      <main className="max-w-2xl mx-auto px-4 pb-20">
        {/* 1. AI 트렌드 분석 */}
        {brief && <TrendSummary brief={brief} />}

        {/* 2. 핵심 뉴스 1건 */}
        {heroArticle && (
          <section className="mb-4">
            <h2 className="text-xs font-semibold text-zinc-500 tracking-wider mb-2.5 px-1">
              핵심 뉴스
            </h2>
            <HeroCard article={heroArticle} />
          </section>
        )}

        {/* 3. 글로벌 지역별 헤드라인 */}
        <RegionalHeadlines articles={articles} />

        {/* 4. 전체 뉴스 (제목 위주) */}
        <NewsFeed articles={restArticles} />
      </main>
      <FloatingNav />
    </div>
  );
}
