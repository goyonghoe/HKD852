"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileContainer from "@/components/layout/MobileContainer";
import WizardContainer from "@/components/saju/wizard/WizardContainer";
import DokkaebiIcon from "@/components/ui/DokkaebiIcon";

export default function HomePage() {
  return (
    <>
      <Header />
      <MobileContainer>
        {/* Hero */}
        <section className="text-center pt-10 pb-6 relative dokkaebi-bg">
          <div className="mb-5 animate-float">
            <DokkaebiIcon size={72} className="mx-auto" />
          </div>

          <h1 className="font-display text-[26px] text-teal mb-3 leading-snug">
            운명의 도깨비
          </h1>
          <p className="font-hand text-[16px] text-text-secondary leading-relaxed">
            니 운명, 내가 봐줄까?
          </p>
          <p className="mt-2 text-[12px] text-text-dim/80">
            입력한 정보는 저장하지 않습니다
          </p>
        </section>

        {/* Wizard */}
        <WizardContainer />

        <div className="h-8" />
      </MobileContainer>
      <Footer />
    </>
  );
}
