import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "이용약관",
  robots: { index: false, follow: false },
};

export default function TermsPage() {
  return (
    <>
      <Header showBack title="이용약관" />
      <main className="px-4 py-8 prose prose-sm max-w-none">
        <h1 className="font-display text-xl mb-4">이용약관</h1>
        <p className="text-text-secondary text-sm leading-relaxed">
          최종 수정일: 2026년 2월 22일
        </p>

        <h2 className="font-bold text-base mt-6 mb-2">1. 서비스 소개</h2>
        <p className="text-text-secondary text-sm leading-relaxed">
          심테공장은 무료 심리테스트를 제공하는 웹서비스입니다. 회원가입 없이
          누구나 이용할 수 있습니다.
        </p>

        <h2 className="font-bold text-base mt-6 mb-2">2. 면책 조항</h2>
        <p className="text-text-secondary text-sm leading-relaxed">
          본 서비스에서 제공하는 심리테스트 결과는 재미 목적으로만 제공되며,
          전문적인 심리 상담이나 진단을 대체하지 않습니다. 테스트 결과에 대한
          의존이나 그로 인한 결과에 대해 운영자는 책임을 지지 않습니다.
        </p>

        <h2 className="font-bold text-base mt-6 mb-2">3. 광고</h2>
        <p className="text-text-secondary text-sm leading-relaxed">
          본 서비스는 Google AdSense를 통해 광고를 게재하며, 이를 통해 운영비를
          충당합니다.
        </p>

        <h2 className="font-bold text-base mt-6 mb-2">4. 저작권</h2>
        <p className="text-text-secondary text-sm leading-relaxed">
          본 사이트의 콘텐츠(테스트 문항, 결과 텍스트, 디자인)에 대한 저작권은
          운영자에게 있습니다. 무단 복제 및 배포를 금합니다.
        </p>
      </main>
      <Footer />
    </>
  );
}
