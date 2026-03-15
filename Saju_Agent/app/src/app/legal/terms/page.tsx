import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileContainer from "@/components/layout/MobileContainer";
import Card from "@/components/ui/Card";

export const metadata = {
  title: "이용약관 | 운명의 도깨비",
};

export default function TermsPage() {
  return (
    <>
      <Header showBack />
      <MobileContainer>
        <Card>
          <h1 className="font-display text-2xl text-teal mb-6">이용약관</h1>

          <div className="space-y-6 text-[15px] text-text-secondary leading-relaxed">
            <section>
              <h2 className="text-[17px] font-semibold text-text-primary mb-2">
                제1조 (목적)
              </h2>
              <p>
                이 약관은 HKD852 Studio(이하 &quot;회사&quot;)가 제공하는
                &quot;운명의 도깨비&quot; AI 사주풀이 서비스(이하
                &quot;서비스&quot;)의 이용 조건 및 절차에 관한 사항을 규정함을
                목적으로 합니다.
              </p>
            </section>

            <section>
              <h2 className="text-[17px] font-semibold text-text-primary mb-2">
                제2조 (서비스 내용)
              </h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  생년월일, 성별, 이름 정보를 기반으로 한 AI 사주풀이 결과 제공
                </li>
                <li>무료 티저 풀이 및 유료 상세 풀이(990원)</li>
                <li>풀이 결과 공유 기능</li>
              </ul>
            </section>

            <section>
              <h2 className="text-[17px] font-semibold text-text-primary mb-2">
                제3조 (결제 및 환불)
              </h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  상세 풀이 서비스는 건당 990원(부가세 포함)의 유료
                  서비스입니다.
                </li>
                <li>결제는 토스페이먼츠를 통해 신용카드로 처리됩니다.</li>
                <li>
                  디지털 콘텐츠 특성상, 풀이 결과가 제공된 이후에는 환불이
                  제한됩니다(전자상거래법 제17조 제2항 제5호).
                </li>
                <li>
                  결제 후 서비스 장애로 결과를 받지 못한 경우 전액 환불됩니다.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-[17px] font-semibold text-text-primary mb-2">
                제4조 (면책조항)
              </h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  본 서비스는 <strong>오락 및 참고 목적</strong>으로 제공되며,
                  의학적, 법률적, 재정적 조언이 아닙니다.
                </li>
                <li>
                  AI가 생성한 풀이 결과의 정확성을 보장하지 않으며, 중요한
                  결정에 본 서비스를 근거로 사용하지 마십시오.
                </li>
                <li>
                  서비스 이용으로 인한 직접적, 간접적 손해에 대해 회사는 책임을
                  지지 않습니다.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-[17px] font-semibold text-text-primary mb-2">
                제5조 (지적재산권)
              </h2>
              <p>
                서비스에 포함된 콘텐츠, 디자인, 기술의 지적재산권은 회사에
                귀속됩니다. 풀이 결과는 개인적 용도로만 사용할 수 있습니다.
              </p>
            </section>

            <section>
              <h2 className="text-[17px] font-semibold text-text-primary mb-2">
                제6조 (서비스 변경 및 중단)
              </h2>
              <p>
                회사는 운영상, 기술상의 필요에 따라 서비스를 변경하거나 중단할
                수 있으며, 사전에 공지합니다.
              </p>
            </section>

            <section>
              <h2 className="text-[17px] font-semibold text-text-primary mb-2">
                제7조 (분쟁 해결)
              </h2>
              <p>
                서비스 이용과 관련된 분쟁은 대한민국 법률을 준거법으로 하며,
                관할법원은 회사 소재지를 관할하는 법원으로 합니다.
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
            href="/legal/privacy"
            className="text-teal underline underline-offset-4"
          >
            개인정보처리방침
          </Link>
        </p>

        <div className="h-8" />
      </MobileContainer>
      <Footer />
    </>
  );
}
