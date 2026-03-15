import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getAllTests } from "@/lib/tests/loader";

export const metadata = {
  title: "심테공장 소개",
  description:
    "심테공장은 성격, 연애, 심리 테스트를 무료로 제공하는 웹서비스입니다. 15종 이상의 재밌는 심리테스트를 즐겨보세요.",
};

export default function AboutPage() {
  const testCount = getAllTests().length;

  return (
    <>
      <Header showBack title="소개" />
      <main className="px-4 py-8">
        {/* Hero */}
        <section className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-5xl">🏭</span>
          </div>
          <h1 className="font-display text-2xl text-text-primary mb-3">
            심테공장
          </h1>
          <p className="text-text-secondary text-base leading-relaxed max-w-[320px] mx-auto">
            재밌는 심리테스트를 만들고 공유하는 공간
          </p>
        </section>

        {/* What we do */}
        <section className="mb-8">
          <h2 className="font-bold text-lg text-text-primary mb-3">
            심테공장이 뭐예요?
          </h2>
          <p className="text-text-secondary text-sm leading-relaxed mb-3">
            심테공장은 성격, 연애, 라이프스타일 등 다양한 주제의 심리테스트를
            무료로 제공하는 웹서비스입니다. 회원가입 없이 누구나 바로 테스트를
            해볼 수 있어요.
          </p>
          <p className="text-text-secondary text-sm leading-relaxed">
            현재 <strong className="text-text-primary">{testCount}종</strong>의
            테스트를 제공하고 있으며, 새로운 테스트가 꾸준히 추가되고 있습니다.
          </p>
        </section>

        {/* Features */}
        <section className="mb-8">
          <h2 className="font-bold text-lg text-text-primary mb-4">
            이런 점이 좋아요
          </h2>
          <div className="flex flex-col gap-3">
            {[
              {
                emoji: "🎯",
                title: "재미있는 결과",
                desc: "딱딱한 심리학 용어 대신, 공감가는 재밌는 결과를 제공해요",
              },
              {
                emoji: "📱",
                title: "모바일 최적화",
                desc: "스마트폰에서 가장 편하게 볼 수 있도록 설계했어요",
              },
              {
                emoji: "💌",
                title: "공유 기능",
                desc: "카카오톡, X(트위터) 등으로 결과를 바로 공유할 수 있어요",
              },
              {
                emoji: "🔒",
                title: "개인정보 수집 없음",
                desc: "회원가입도, 개인정보 입력도 필요 없어요",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex gap-3 p-4 rounded-xl bg-bg-soft"
              >
                <span className="text-2xl flex-shrink-0">{item.emoji}</span>
                <div>
                  <h3 className="font-bold text-sm text-text-primary mb-0.5">
                    {item.title}
                  </h3>
                  <p className="text-text-dim text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Disclaimer */}
        <section className="mb-8 p-4 rounded-xl bg-warning/5 border border-warning/20">
          <h2 className="font-bold text-sm text-text-primary mb-2">
            참고해주세요
          </h2>
          <p className="text-text-dim text-xs leading-relaxed">
            심테공장의 모든 테스트는 재미 목적으로 제작되었으며, 전문적인 심리
            상담이나 진단을 대체하지 않습니다. 심리적 어려움이 있으시면 전문
            상담사에게 도움을 받으시길 권합니다.
          </p>
        </section>

        {/* Contact */}
        <section>
          <h2 className="font-bold text-lg text-text-primary mb-3">문의</h2>
          <p className="text-text-secondary text-sm leading-relaxed">
            테스트 아이디어 제안, 오류 신고, 협업 문의는 아래로 연락해주세요.
          </p>
          <p className="text-primary text-sm font-bold mt-2">
            contact@simtefactory.com
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
