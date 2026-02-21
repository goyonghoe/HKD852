import { Metadata } from "next";
import Link from "next/link";
import { SajuResult, FullReading } from "@/lib/saju/types";
import { ELEMENT_NAMES } from "@/lib/saju/mappings";
import { parseFullReadingResponse } from "@/lib/ai/response-parser";
import FourPillarsDisplay from "@/components/saju/FourPillarsDisplay";
import ElementChart from "@/components/saju/ElementChart";
import ReadingSection from "@/components/saju/ReadingSection";
import LuckyBadge from "@/components/saju/LuckyBadge";

interface SharePageProps {
  params: Promise<{ id: string }>;
}

interface ShareData {
  result: SajuResult;
  reading: FullReading | null;
}

async function getShareData(id: string): Promise<ShareData | null> {
  if (!process.env.DATABASE_URL) return null;

  try {
    const { getOrderByShareId, getOrder } = await import("@/lib/db/queries");
    const order = await getOrderByShareId(id) || await getOrder(id);

    if (!order?.sajuResult) return null;

    let reading: FullReading | null = null;
    if (order.readingCache) {
      try {
        reading = parseFullReadingResponse(order.readingCache);
      } catch (error) {
        console.error("[share] readingCache parse failed:", error);
      }
    }

    return {
      result: order.sajuResult as unknown as SajuResult,
      reading,
    };
  } catch (error) {
    console.error("[share] getShareData failed:", error);
    return null;
  }
}

function getDisplayName(data: ShareData): string | null {
  return data.result.input.nameInfo?.koreanName ?? null;
}

function getHanjaString(data: ShareData): string | null {
  const hanja = data.result.input.nameInfo?.selectedHanja;
  if (!hanja?.length) return null;
  return hanja.map(h => h.hanja).join("");
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { id } = await params;
  let title = "도깨비 - 니 운명, 내가 봐줄까?";
  let description = "야, 너도 운명 까봐 ㅋㅋ";

  const data = await getShareData(id);
  if (data) {
    const animal = data.result.zodiacAnimalKorean;
    const elName = ELEMENT_NAMES[data.result.dominantElement];
    const name = getDisplayName(data);

    if (name) {
      title = `${name}의 운명 — 도깨비`;
      description = data.reading
        ? `도깨비가 ${name}의 운명을 다 까봤어. 너도 볼래?`
        : `도깨비가 ${name}의 사주를 봤어. 너도 까볼래?`;
    } else {
      title = `${animal}띠의 운명 — 도깨비`;
      description = data.reading
        ? `${elName}이 강한 ${animal}띠! 도깨비가 운명을 다 까봤어. 너도 볼래?`
        : `${elName}이 강한 ${animal}띠! 도깨비가 까본 운명, 너도 볼래?`;
    }
  }

  return {
    title,
    description,
    openGraph: { title, description, type: "website", locale: "ko_KR" },
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const { id } = await params;
  const data = await getShareData(id);

  const hasReading = data?.reading != null && data.reading.sections.length > 0;
  const highlightKeys = new Set(["fortune2026", "dokkaebiAdvice"]);

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-mobile min-h-screen bg-bg">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-bg/90 backdrop-blur-md border-b border-surface-border">
          <div className="px-5 py-3 flex items-center justify-center gap-1.5">
            <span className="text-2xl">👹</span>
            <span className="font-display text-xl text-teal tracking-tight">도깨비</span>
          </div>
        </header>

        <div className="px-5 py-6 dokkaebi-bg space-y-4">
          {data ? (
            <>
              {/* Profile card */}
              <div className="bg-surface rounded-2xl border border-surface-border p-6 text-center space-y-3">
                <div className="text-4xl">👹</div>
                <div className="space-y-1">
                  <h1 className="font-display text-xl text-teal">
                    {getDisplayName(data)
                      ? `${getDisplayName(data)}의 운명`
                      : `${data.result.zodiacAnimalKorean}띠의 운명`}
                  </h1>
                  {getDisplayName(data) && getHanjaString(data) && (
                    <p className="text-[14px] text-text-secondary">
                      {getHanjaString(data)}
                    </p>
                  )}
                  <p className="text-[13px] text-text-dim font-hand">
                    {ELEMENT_NAMES[data.result.dominantElement]}의 기운이 강한 녀석이네
                  </p>
                </div>
              </div>

              {/* Four Pillars + Element Chart — always shown */}
              <FourPillarsDisplay
                pillars={data.result.fourPillars}
                tenGods={data.result.tenGods}
                twelveStages={data.result.twelveStages}
                gongmang={data.result.gongmang}
                specialStars={data.result.specialStars}
                branchRelations={data.result.branchRelations}
              />
              <ElementChart
                distribution={data.result.elementDistribution}
                dominantElement={data.result.dominantElement}
              />

              {hasReading ? (
                <>
                  {/* Full reading sections */}
                  <div className="space-y-3">
                    {data!.reading!.sections.map((section) => (
                      <ReadingSection
                        key={section.key}
                        icon={section.icon}
                        title={section.title}
                        content={section.content}
                        preview={section.preview}
                        highlighted={highlightKeys.has(section.key)}
                        expandable
                        defaultExpanded={section.key === "personality"}
                      />
                    ))}
                  </div>

                  {/* Lucky elements */}
                  <div className="bg-surface rounded-2xl border border-gold/20 glow-gold p-5">
                    <h3 className="font-display text-[15px] text-gold text-center mb-4">
                      도깨비가 점지한 행운
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <LuckyBadge type="color" value={data.reading!.luckyElements.color} />
                      <LuckyBadge type="number" value={data.reading!.luckyElements.number} />
                      <LuckyBadge type="direction" value={data.reading!.luckyElements.direction} />
                      <LuckyBadge type="season" value={data.reading!.luckyElements.season} />
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-surface rounded-2xl border border-surface-border p-5 text-center">
                  <p className="text-[13px] text-text-dim font-hand">
                    도깨비가 살짝 봤는데... 자세한 풀이는 직접 까봐야 알려줄 수 있어.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="bg-surface rounded-2xl border border-surface-border p-8 text-center space-y-3">
              <div className="text-4xl">👹</div>
              <h1 className="font-display text-xl text-teal">
                도깨비가 까본 운명
              </h1>
              <p className="text-[13px] text-text-dim font-hand">
                궁금하지? 너도 까봐.
              </p>
            </div>
          )}

          {/* CTA */}
          <div className="pt-2">
            <Link
              href="/"
              className="flex items-center justify-center w-full px-8 py-4 text-base font-bold rounded-2xl bg-teal text-bg hover:bg-teal-light transition-all active:scale-[0.98]"
            >
              나도 운명 까보기 👹
            </Link>
          </div>

          <div className="text-center">
            <p className="text-[13px] text-text-dim font-hand">
              생년월일만 알려줘. 도깨비가 까볼게.
            </p>
          </div>
        </div>

        <footer className="px-5 py-8 text-center space-y-2">
          <p className="text-[11px] text-text-dim font-hand">
            도깨비는 거짓말 안 해. 근데 재미로 봐.
          </p>
          <p className="text-[11px] text-text-dim/60">&copy; 2026 HKD852 Studio</p>
        </footer>
      </div>
    </div>
  );
}
