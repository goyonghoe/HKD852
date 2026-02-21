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
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg gap-4">
      <p className="text-sm text-text-secondary font-hand">도깨비가 운명을 펼치는 중...</p>
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
