import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileContainer from "@/components/layout/MobileContainer";
import Card from "@/components/ui/Card";

export const metadata = {
  title: "개인정보처리방침 | 운명의 도깨비",
};

export default function PrivacyPage() {
  return (
    <>
      <Header showBack />
      <MobileContainer>
        <Card>
          <h1 className="font-display text-2xl text-teal mb-6">
            개인정보처리방침
          </h1>

          <div className="space-y-6 text-[15px] text-text-secondary leading-relaxed">
            <p>
              HKD852 Studio(이하 &quot;회사&quot;)는 개인정보보호법 및
              정보통신망법에 따라 이용자의 개인정보를 보호하고 이와 관련한
              고충을 처리하기 위하여 다음과 같은 처리방침을 두고 있습니다.
            </p>

            <section>
              <h2 className="text-[17px] font-semibold text-text-primary mb-2">
                1. 수집하는 개인정보 항목
              </h2>
              <table className="w-full text-[14px] border-collapse">
                <thead>
                  <tr className="border-b border-surface-border">
                    <th className="text-left py-2 pr-3 text-text-primary">
                      항목
                    </th>
                    <th className="text-left py-2 text-text-primary">
                      수집 목적
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/50">
                  <tr>
                    <td className="py-2 pr-3">생년월일, 출생시간</td>
                    <td className="py-2">사주 계산 및 풀이 생성</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3">성별</td>
                    <td className="py-2">사주 계산 (음양 구분)</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3">이름 (선택)</td>
                    <td className="py-2">이름 풀이 및 한자 분석</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3">결제정보</td>
                    <td className="py-2">유료 서비스 결제 처리</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section>
              <h2 className="text-[17px] font-semibold text-text-primary mb-2">
                2. 개인정보의 보유 및 이용 기간
              </h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  사주 풀이 데이터: <strong>공유 링크 생성 시 30일</strong>,
                  미공유 시 세션 종료 즉시 삭제
                </li>
                <li>
                  결제 기록: 전자상거래법에 따라 <strong>5년</strong> 보관
                </li>
                <li>이용자는 언제든지 개인정보 삭제를 요청할 수 있습니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-[17px] font-semibold text-text-primary mb-2">
                3. 개인정보의 제3자 제공
              </h2>
              <table className="w-full text-[14px] border-collapse">
                <thead>
                  <tr className="border-b border-surface-border">
                    <th className="text-left py-2 pr-3 text-text-primary">
                      제공받는 자
                    </th>
                    <th className="text-left py-2 text-text-primary">목적</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/50">
                  <tr>
                    <td className="py-2 pr-3">토스페이먼츠</td>
                    <td className="py-2">결제 처리 및 검증</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3">Anthropic (Claude API)</td>
                    <td className="py-2">AI 사주 풀이 생성</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3">Neon (PostgreSQL)</td>
                    <td className="py-2">풀이 결과 및 결제 기록 저장</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section>
              <h2 className="text-[17px] font-semibold text-text-primary mb-2">
                4. 개인정보의 안전성 확보 조치
              </h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>데이터 전송 시 HTTPS(TLS) 암호화 적용</li>
                <li>데이터베이스 접근 권한 최소화 및 암호화 저장</li>
                <li>결제 정보는 토스페이먼츠에서 직접 처리 (PCI DSS 준수)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-[17px] font-semibold text-text-primary mb-2">
                5. 이용자의 권리
              </h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>개인정보 열람, 정정, 삭제, 처리정지 요구권</li>
                <li>위 권리 행사는 아래 연락처로 요청하실 수 있습니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-[17px] font-semibold text-text-primary mb-2">
                6. 개인정보 보호책임자
              </h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>담당: HKD852 Studio 개인정보보호 담당</li>
                <li>이메일: privacy@hkd852.com</li>
              </ul>
            </section>

            <section>
              <h2 className="text-[17px] font-semibold text-text-primary mb-2">
                7. 방침 변경
              </h2>
              <p>
                이 개인정보처리방침은 법령, 정책 또는 서비스 변경에 따라 수정될
                수 있으며, 변경 시 서비스 내 공지합니다.
              </p>
            </section>

            <p className="text-[13px] text-text-dim pt-4 border-t border-surface-border">
              시행일: 2026년 2월 22일
            </p>
          </div>
        </Card>

        <div className="h-4" />

        <p className="text-center text-[13px] text-text-dim">
          <Link
            href="/legal/terms"
            className="text-teal underline underline-offset-4"
          >
            이용약관
          </Link>
        </p>

        <div className="h-8" />
      </MobileContainer>
      <Footer />
    </>
  );
}
