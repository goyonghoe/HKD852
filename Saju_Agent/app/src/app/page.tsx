"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileContainer from "@/components/layout/MobileContainer";
import BirthInputForm from "@/components/saju/BirthInputForm";

export default function HomePage() {
  return (
    <>
      <Header />
      <MobileContainer>
        {/* Hero Section */}
        <section className="text-center pt-6 pb-8 relative">
          {/* Floating decorations */}
          <div className="absolute top-2 left-4 text-2xl opacity-40 crystal-float" style={{ animationDelay: "0.3s" }}>✨</div>
          <div className="absolute top-8 right-6 text-xl opacity-30 crystal-float" style={{ animationDelay: "0.8s" }}>⭐</div>
          <div className="absolute bottom-4 left-8 text-lg opacity-25 crystal-float" style={{ animationDelay: "1.2s" }}>🌙</div>

          <div className="text-5xl mb-4 crystal-float">🔮</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">
            내 사주 속 <span className="text-gradient">숨겨진 나</span>를 찾아봐!
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            생년월일만 입력하면<br />
            AI가 분석해주는 나만의 사주풀이
          </p>
        </section>

        {/* Birth Input Form */}
        <BirthInputForm />

        {/* Feature Cards */}
        <section className="mt-8 space-y-3">
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { icon: "🤖", title: "AI 분석", desc: "최신 AI가 읽어주는 사주" },
              { icon: "📖", title: "상세 풀이", desc: "성격·진로·연애·건강·운세" },
              { icon: "☕", title: "990원", desc: "커피보다 저렴한 가격" },
            ].map(({ icon, title, desc }) => (
              <div
                key={title}
                className="bg-white rounded-xl p-3 text-center shadow-sm"
              >
                <span className="text-2xl">{icon}</span>
                <p className="text-xs font-bold text-gray-700 mt-1.5">{title}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mt-8 space-y-3">
          <h2 className="text-sm font-bold text-gray-600 text-center">
            자주 묻는 질문
          </h2>
          {[
            {
              q: "무료로 볼 수 있는 건 뭔가요?",
              a: "사주 팔자, 오행 분포, 성격 미리보기까지 무료! 상세 풀이만 990원이에요.",
            },
            {
              q: "태어난 시간을 몰라도 되나요?",
              a: "네! 시간 없이도 년주·월주·일주로 충분히 분석해드려요.",
            },
            {
              q: "결과를 저장하거나 공유할 수 있나요?",
              a: "상세 풀이를 결제하면 공유 링크가 생성돼요. 친구에게 보내보세요!",
            },
          ].map(({ q, a }) => (
            <div key={q} className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-xs font-bold text-gray-700">{q}</p>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{a}</p>
            </div>
          ))}
        </section>

        <div className="h-6" />
      </MobileContainer>
      <Footer />
    </>
  );
}
