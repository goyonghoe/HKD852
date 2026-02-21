import { Metadata } from "next";
import { getOrderByShareId, getOrder } from "@/lib/db/queries";
import { SajuResult } from "@/lib/saju/types";
import { ELEMENT_NAMES } from "@/lib/saju/mappings";
import Link from "next/link";

interface SharePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { id } = await params;

  let title = "AI 사주풀이 결과";
  let description = "나도 내 사주 속 숨겨진 나를 찾아보자!";

  try {
    const order = await getOrderByShareId(id) || await getOrder(id);
    if (order?.sajuResult) {
      const result = order.sajuResult as unknown as SajuResult;
      title = `${result.zodiacAnimalKorean}띠의 AI 사주풀이`;
      description = `${ELEMENT_NAMES[result.dominantElement]}이 강한 ${result.zodiacAnimalKorean}띠! 나도 확인해볼까?`;
    }
  } catch {
    // Use defaults
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      locale: "ko_KR",
    },
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const { id } = await params;
  let sajuResult: SajuResult | null = null;
  let hasFullReading = false;

  try {
    const order = await getOrderByShareId(id) || await getOrder(id);
    if (order?.sajuResult) {
      sajuResult = order.sajuResult as unknown as SajuResult;
      hasFullReading = !!order.readingCache;
    }
  } catch {
    // Fallback to generic share
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto max-w-mobile min-h-screen bg-cream">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-cream/80 backdrop-blur-md border-b border-cream-dark">
          <div className="px-5 py-3 flex items-center justify-center">
            <span className="text-2xl">🔮</span>
            <span className="font-bold text-lg text-primary ml-2">AI 사주풀이</span>
          </div>
        </header>

        <div className="px-5 py-6">
          {/* Share Card */}
          <div className="bg-white rounded-2xl shadow-sm p-6 text-center space-y-4">
            {sajuResult ? (
              <>
                <div className="text-5xl">
                  {sajuResult.zodiacAnimal === "rabbit" ? "🐰" :
                   sajuResult.zodiacAnimal === "dragon" ? "🐉" :
                   sajuResult.zodiacAnimal === "snake" ? "🐍" :
                   sajuResult.zodiacAnimal === "horse" ? "🐴" :
                   sajuResult.zodiacAnimal === "sheep" ? "🐑" :
                   sajuResult.zodiacAnimal === "monkey" ? "🐵" :
                   sajuResult.zodiacAnimal === "rooster" ? "🐔" :
                   sajuResult.zodiacAnimal === "dog" ? "🐶" :
                   sajuResult.zodiacAnimal === "pig" ? "🐷" :
                   sajuResult.zodiacAnimal === "rat" ? "🐭" :
                   sajuResult.zodiacAnimal === "ox" ? "🐮" :
                   sajuResult.zodiacAnimal === "tiger" ? "🐯" : "🔮"}
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-800">
                    {sajuResult.zodiacAnimalKorean}띠의 사주풀이
                  </h1>
                  <p className="text-xs text-gray-400 mt-1">
                    {ELEMENT_NAMES[sajuResult.dominantElement]}의 기운이 강한 사람
                  </p>
                </div>
                {hasFullReading && (
                  <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl p-3">
                    <p className="text-xs text-gray-500">
                      이 사람은 상세 사주풀이를 완료했어요!
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="text-5xl crystal-float">🔮</div>
                <h1 className="text-lg font-bold text-gray-800">
                  AI 사주풀이 결과
                </h1>
              </>
            )}

            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center justify-center w-full px-8 py-4 text-lg font-semibold rounded-2xl bg-primary text-white hover:bg-primary-light shadow-md shadow-primary/20 transition-all active:scale-[0.98]"
              >
                나도 내 사주 보기 ✨
              </Link>
            </div>
          </div>

          {/* Info */}
          <div className="mt-6 text-center space-y-1">
            <p className="text-xs text-gray-400">생년월일만 입력하면 AI가 분석해줘요</p>
            <p className="text-xs text-gray-300">무료 미리보기 제공 · 상세 풀이 990원</p>
          </div>
        </div>

        {/* Footer */}
        <footer className="px-5 py-6 text-center text-xs text-gray-400 space-y-1">
          <p>AI 사주풀이는 재미와 참고 목적으로 제공됩니다.</p>
          <p className="pt-2 text-gray-300">&copy; 2026 HKD852 Studio</p>
        </footer>
      </div>
    </div>
  );
}
