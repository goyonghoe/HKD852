import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllTests, getTestBySlug } from "@/lib/tests/loader";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ResultDisplay from "@/components/test/ResultDisplay";
import ShareButtons from "@/components/share/ShareButtons";
import AdBanner from "@/components/ads/AdBanner";
import AdSenseScript from "@/components/ads/AdSenseScript";

interface Props {
  params: Promise<{ slug: string; resultId: string }>;
}

export async function generateStaticParams() {
  return getAllTests().flatMap((test) =>
    test.results.map((result) => ({
      slug: test.meta.slug,
      resultId: result.id,
    })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, resultId } = await params;
  const test = getTestBySlug(slug);
  if (!test) return {};
  const result = test.results.find((r) => r.id === resultId);
  if (!result) return {};

  const title = `${result.title} - ${test.meta.title}`;
  const description = result.shareText;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      locale: "ko_KR",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ResultPage({ params }: Props) {
  const { slug, resultId } = await params;
  const test = getTestBySlug(slug);
  if (!test) notFound();

  const result = test.results.find((r) => r.id === resultId);
  if (!result) notFound();

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
  const shareUrl = `${baseUrl}/test/${slug}/result/${resultId}`;

  // Find compatibility results
  const bestMatch = test.results.find(
    (r) => r.id === result.compatibility.best,
  );
  const worstMatch = test.results.find(
    (r) => r.id === result.compatibility.worst,
  );

  return (
    <>
      <AdSenseScript />
      <Header showBack />
      <main className="px-4 pb-8">
        <ResultDisplay
          result={result}
          testTitle={test.meta.title}
          testColor={test.meta.color}
        />

        {/* Compatibility */}
        {(bestMatch || worstMatch) && (
          <section className="mt-6 p-5 rounded-2xl bg-bg-soft">
            <h3 className="font-bold text-base text-text-primary mb-3 flex items-center gap-2">
              <span>💞</span> 궁합 분석
            </h3>
            <div className="flex flex-col gap-3">
              {bestMatch && (
                <div className="flex items-center gap-3 text-base bg-white rounded-xl p-3">
                  <span className="text-success font-bold text-sm px-2.5 py-1 rounded-full bg-success/10">
                    최고
                  </span>
                  <span>
                    {bestMatch.emoji} {bestMatch.title}
                  </span>
                </div>
              )}
              {worstMatch && (
                <div className="flex items-center gap-3 text-base bg-white rounded-xl p-3">
                  <span className="text-danger font-bold text-sm px-2.5 py-1 rounded-full bg-danger/10">
                    주의
                  </span>
                  <span>
                    {worstMatch.emoji} {worstMatch.title}
                  </span>
                </div>
              )}
            </div>
          </section>
        )}

        <AdBanner className="my-6" />

        {/* Share */}
        <section className="mt-4 bg-primary/5 rounded-2xl p-5">
          <p className="text-center text-text-primary text-lg font-bold mb-1">
            친구에게도 공유해보세요!
          </p>
          <p className="text-center text-text-dim text-sm mb-4">
            내 결과를 보고 친구도 도전! 🎯
          </p>
          <ShareButtons
            shareText={result.shareText}
            shareUrl={shareUrl}
            testTitle={test.meta.title}
          />
        </section>

        {/* Retry / Home */}
        <div className="flex flex-col gap-3 mt-8">
          <Link
            href={`/test/${slug}`}
            className="w-full text-center rounded-2xl border-2 border-surface-border px-6 py-4 font-bold text-text-secondary hover:bg-bg-soft transition-colors text-base min-h-[52px] flex items-center justify-center"
          >
            🔄 다시 해보기
          </Link>
          <Link
            href="/"
            className="w-full text-center rounded-2xl px-6 py-4 font-bold text-white bg-primary hover:opacity-90 transition-opacity text-base min-h-[52px] flex items-center justify-center"
          >
            🧪 다른 테스트 하러가기
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
