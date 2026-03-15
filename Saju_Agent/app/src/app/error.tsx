"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileContainer from "@/components/layout/MobileContainer";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <>
      <Header />
      <MobileContainer>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="text-[72px] mb-4">🔥</div>
          <h1 className="font-display text-[28px] text-gold mb-3">
            도깨비가 삐끗했다!
          </h1>
          <p className="text-text-secondary mb-8 text-[15px]">
            잠깐 문제가 생겼어. 다시 해볼까?
          </p>
          <div className="flex gap-3">
            <button
              onClick={reset}
              className="px-6 py-3 bg-teal/10 text-teal border border-teal/20 rounded-xl hover:bg-teal/20 transition-colors font-medium"
            >
              다시 시도
            </button>
            <a
              href="/"
              className="px-6 py-3 bg-surface text-text-secondary border border-white/5 rounded-xl hover:bg-white/5 transition-colors font-medium"
            >
              홈으로 가기
            </a>
          </div>
        </div>
      </MobileContainer>
      <Footer />
    </>
  );
}
