import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllTests, getTestBySlug } from "@/lib/tests/loader";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AdBanner from "@/components/ads/AdBanner";
import AdSenseScript from "@/components/ads/AdSenseScript";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllTests().map((t) => ({ slug: t.meta.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const test = getTestBySlug(slug);
  if (!test) return {};
  return {
    title: test.meta.title,
    description: test.meta.description,
    openGraph: {
      title: test.meta.title,
      description: test.meta.description,
      type: "website",
      locale: "ko_KR",
    },
  };
}

export default async function TestLandingPage({ params }: Props) {
  const { slug } = await params;
  const test = getTestBySlug(slug);
  if (!test) notFound();

  const { meta } = test;

  return (
    <>
      <AdSenseScript />
      <Header showBack />
      <main className="px-4 pb-8">
        {/* Hero */}
        <section className="text-center py-10">
          {/* Big emoji with decorative background */}
          <div className="relative inline-block mb-5">
            <div
              className="w-28 h-28 rounded-3xl flex items-center justify-center mx-auto shadow-lg"
              style={{ backgroundColor: `${meta.color}15` }}
            >
              <span className="text-7xl">{meta.emoji}</span>
            </div>
            {/* Decorative dots */}
            <div
              className="absolute -top-2 -right-2 w-4 h-4 rounded-full sparkle"
              style={{ backgroundColor: `${meta.color}40` }}
            />
            <div
              className="absolute -bottom-1 -left-2 w-3 h-3 rounded-full sparkle-delayed"
              style={{ backgroundColor: `${meta.color}30` }}
            />
          </div>

          <h1 className="font-fun text-3xl text-text-primary mb-3">
            {meta.title}
          </h1>
          <p className="text-text-secondary text-base leading-relaxed mb-6 max-w-[320px] mx-auto">
            {meta.description}
          </p>

          {/* Meta info */}
          <div className="flex items-center justify-center gap-4 text-text-dim text-sm mb-8">
            <span className="flex items-center gap-1">
              <span>⏱</span> 약 {meta.estimatedMinutes}분
            </span>
            <span className="text-surface-border">|</span>
            <span className="flex items-center gap-1">
              <span>📝</span> {meta.questionCount}문항
            </span>
          </div>

          <AdBanner className="mb-6" />

          {/* Start button */}
          <Link
            href={`/test/${slug}/play`}
            className="inline-flex items-center justify-center w-full rounded-2xl px-8 py-5 text-xl font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg min-h-[60px]"
            style={{ backgroundColor: meta.color }}
          >
            테스트 시작하기 →
          </Link>
        </section>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 justify-center mt-2">
          {meta.tags.map((tag) => (
            <span
              key={tag}
              className="text-sm px-4 py-1.5 rounded-full bg-bg-soft text-text-dim font-medium"
            >
              #{tag}
            </span>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
