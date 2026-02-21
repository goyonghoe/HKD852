"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import LoadingFortune from "@/components/ui/LoadingFortune";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");

  useEffect(() => {
    if (orderId) {
      router.replace(`/result/full?orderId=${orderId}`);
    } else {
      router.replace("/");
    }
  }, [orderId, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cream gap-4">
      <span className="text-5xl">🎉</span>
      <p className="text-sm text-gray-600 font-medium">결제 완료! 풀이를 준비하고 있어요...</p>
      <LoadingFortune />
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<LoadingFortune fullScreen />}>
      <SuccessContent />
    </Suspense>
  );
}
