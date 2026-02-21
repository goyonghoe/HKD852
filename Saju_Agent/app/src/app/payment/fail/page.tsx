"use client";

import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileContainer from "@/components/layout/MobileContainer";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function PaymentFailPage() {
  const router = useRouter();

  return (
    <>
      <Header showBack />
      <MobileContainer>
        <div className="pt-12 pb-8">
          <Card className="text-center space-y-4 py-8">
            <div className="text-4xl">👹</div>
            <div>
              <h2 className="text-base font-bold text-text-primary font-display">
                결제가 안 됐어
              </h2>
              <p className="text-[13px] text-text-dim mt-1.5 font-hand">
                다시 해봐. 도깨비가 기다리고 있을게.
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <Button onClick={() => router.back()} fullWidth variant="teal" size="lg">
                다시 결제하기
              </Button>
              <Button onClick={() => router.push("/")} fullWidth variant="outline" size="md">
                처음으로 돌아가기
              </Button>
            </div>
          </Card>
        </div>
      </MobileContainer>
      <Footer />
    </>
  );
}
