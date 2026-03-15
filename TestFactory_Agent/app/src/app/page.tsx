import { getAllTests, getTrendingTests } from "@/lib/tests/loader";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import TestCard from "@/components/test/TestCard";
import AdBanner from "@/components/ads/AdBanner";
import AdSenseScript from "@/components/ads/AdSenseScript";

export default function HomePage() {
  const allTests = getAllTests();
  const trending = getTrendingTests();

  return (
    <>
      <AdSenseScript />
      <Header />
      <main className="px-4 pb-8">
        {/* Hero — 귀여운 공장 브랜딩 */}
        <section className="text-center pt-8 pb-6">
          {/* Big factory illustration */}
          <div className="relative inline-block mb-5">
            <svg
              width="140"
              height="130"
              viewBox="0 0 140 130"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="mx-auto"
              aria-hidden="true"
            >
              {/* Steam puffs */}
              <circle
                cx="38"
                cy="18"
                r="6"
                fill="#E2DCFE"
                className="steam-puff"
              />
              <circle
                cx="48"
                cy="10"
                r="5"
                fill="#E2DCFE"
                className="steam-puff-delayed"
              />
              <circle
                cx="30"
                cy="8"
                r="4"
                fill="#E2DCFE"
                className="steam-puff-delayed-2"
              />
              <circle
                cx="95"
                cy="22"
                r="5"
                fill="#E2DCFE"
                className="steam-puff-delayed"
              />
              <circle
                cx="105"
                cy="14"
                r="4"
                fill="#E2DCFE"
                className="steam-puff-delayed-2"
              />

              {/* Chimney 1 */}
              <rect
                x="30"
                y="25"
                width="14"
                height="28"
                rx="4"
                fill="#A29BFE"
              />
              {/* Chimney 2 */}
              <rect
                x="88"
                y="32"
                width="14"
                height="21"
                rx="4"
                fill="#A29BFE"
              />

              {/* Main factory building */}
              <rect
                x="14"
                y="50"
                width="112"
                height="60"
                rx="12"
                fill="#6C5CE7"
              />

              {/* Roof accent */}
              <rect
                x="14"
                y="50"
                width="112"
                height="8"
                rx="4"
                fill="#5A4BD6"
              />

              {/* Windows row 1 */}
              <rect
                x="26"
                y="66"
                width="20"
                height="16"
                rx="5"
                fill="#FEE500"
                opacity="0.9"
              />
              <rect
                x="54"
                y="66"
                width="20"
                height="16"
                rx="5"
                fill="#FEE500"
                opacity="0.85"
              />
              <rect
                x="82"
                y="66"
                width="20"
                height="16"
                rx="5"
                fill="#FEE500"
                opacity="0.8"
              />

              {/* Window shine */}
              <rect
                x="28"
                y="68"
                width="5"
                height="3"
                rx="1.5"
                fill="#FFFFFF"
                opacity="0.4"
              />
              <rect
                x="56"
                y="68"
                width="5"
                height="3"
                rx="1.5"
                fill="#FFFFFF"
                opacity="0.4"
              />
              <rect
                x="84"
                y="68"
                width="5"
                height="3"
                rx="1.5"
                fill="#FFFFFF"
                opacity="0.4"
              />

              {/* Door */}
              <rect
                x="52"
                y="90"
                width="24"
                height="20"
                rx="6"
                fill="#F0EEFF"
              />
              <circle cx="70" cy="100" r="2" fill="#A29BFE" />

              {/* Gear (right side) */}
              <g
                className="gear-spin"
                style={{ transformOrigin: "125px 42px" }}
              >
                <circle cx="125" cy="42" r="12" fill="#FDCB6E" />
                <rect
                  x="122"
                  y="28"
                  width="6"
                  height="28"
                  rx="3"
                  fill="#FDCB6E"
                />
                <rect
                  x="113"
                  y="39"
                  width="24"
                  height="6"
                  rx="3"
                  fill="#FDCB6E"
                />
                <circle cx="125" cy="42" r="5" fill="#6C5CE7" />
              </g>

              {/* Small gear (left) */}
              <g
                className="gear-spin"
                style={{
                  transformOrigin: "10px 58px",
                  animationDirection: "reverse",
                }}
              >
                <circle cx="10" cy="58" r="7" fill="#FF9B9B" opacity="0.6" />
                <circle cx="10" cy="58" r="3" fill="#FFFFFF" opacity="0.4" />
              </g>

              {/* Sparkle decorations */}
              <text x="4" y="32" fontSize="14" className="sparkle">
                ✨
              </text>
              <text x="120" y="70" fontSize="12" className="sparkle-delayed">
                ⭐
              </text>
              <text x="60" y="20" fontSize="10" className="sparkle">
                💜
              </text>
            </svg>
          </div>

          <h1 className="font-display text-4xl text-text-primary mb-3">
            심테공장
          </h1>
          <p className="text-text-secondary text-base leading-relaxed max-w-[300px] mx-auto">
            재밌는 심리테스트 모음!
            <br />
            결과를 친구와 공유해보세요 🎉
          </p>

          {/* Quick stats */}
          <div className="flex items-center justify-center gap-4 mt-5">
            <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary/8 text-primary text-sm font-bold">
              <span>🧪</span> 테스트 {allTests.length}개
            </div>
            <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-secondary/8 text-secondary text-sm font-bold">
              <span>⚡</span> 100% 무료
            </div>
          </div>
        </section>

        {/* Trending */}
        {trending.length > 0 && (
          <section className="mb-6">
            <h2 className="font-bold text-xl text-text-primary mb-4 flex items-center gap-2">
              <span>🔥</span>
              <span>인기 테스트</span>
            </h2>
            <div className="flex flex-col gap-3.5">
              {trending.map((test) => (
                <TestCard key={test.meta.slug} meta={test.meta} />
              ))}
            </div>
          </section>
        )}

        <AdBanner className="my-6" />

        {/* All Tests */}
        <section>
          <h2 className="font-bold text-xl text-text-primary mb-4 flex items-center gap-2">
            <span>📋</span>
            <span>전체 테스트</span>
          </h2>
          <div className="flex flex-col gap-3.5">
            {allTests.map((test) => (
              <TestCard key={test.meta.slug} meta={test.meta} />
            ))}
          </div>
        </section>

        <AdBanner className="mt-6" />
      </main>
      <Footer />
    </>
  );
}
