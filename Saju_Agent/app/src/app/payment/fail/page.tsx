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
            <span className="text-5xl">😢</span>
            <div>
              <h2 className="text-base font-bold text-gray-700">
                결제가 완료되지 않았어요
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                다시 시도하시면 사주풀이를 확인할 수 있어요
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <Button
                onClick={() => router.back()}
                fullWidth
                variant="primary"
                size="lg"
              >
                다시 결제하기
              </Button>
              <Button
                onClick={() => router.push("/")}
                fullWidth
                variant="outline"
                size="md"
              >
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
