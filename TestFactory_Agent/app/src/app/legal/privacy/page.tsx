import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "개인정보처리방침",
  robots: { index: false, follow: false },
};

export default function PrivacyPage() {
  return (
    <>
      <Header showBack title="개인정보처리방침" />
      <main className="px-4 py-8 prose prose-sm max-w-none">
        <h1 className="font-display text-xl mb-4">개인정보처리방침</h1>
        <p className="text-text-secondary text-sm leading-relaxed">
          최종 수정일: 2026년 2월 22일
        </p>

        <h2 className="font-bold text-base mt-6 mb-2">1. 수집하는 개인정보</h2>
        <p className="text-text-secondary text-sm leading-relaxed">
          심테공장은 별도의 회원가입 없이 이용 가능하며, 개인정보를 직접
          수집하지 않습니다. 다만, 서비스 이용 과정에서 다음 정보가 자동으로
          생성되어 수집될 수 있습니다:
        </p>
        <ul className="text-text-secondary text-sm list-disc pl-5 mt-2">
          <li>접속 기기 정보 (브라우저 종류, OS)</li>
          <li>접속 일시</li>
          <li>쿠키 (Google Analytics, Google AdSense 관련)</li>
        </ul>

        <h2 className="font-bold text-base mt-6 mb-2">2. 이용 목적</h2>
        <p className="text-text-secondary text-sm leading-relaxed">
          수집된 정보는 서비스 개선 및 광고 게재 목적으로만 사용됩니다.
        </p>

        <h2 className="font-bold text-base mt-6 mb-2">3. 제3자 서비스</h2>
        <p className="text-text-secondary text-sm leading-relaxed">
          본 사이트는 Google Analytics(방문 통계)와 Google AdSense(광고)를
          사용합니다. 이 서비스들은 쿠키를 통해 데이터를 수집할 수 있으며, 각
          서비스의 개인정보처리방침이 적용됩니다.
        </p>

        <h2 className="font-bold text-base mt-6 mb-2">4. 문의</h2>
        <p className="text-text-secondary text-sm leading-relaxed">
          개인정보 관련 문의는 사이트 운영자에게 연락해주세요.
        </p>
      </main>
      <Footer />
    </>
  );
}
