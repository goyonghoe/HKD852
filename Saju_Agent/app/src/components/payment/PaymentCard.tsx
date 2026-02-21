"use client";

import { useState } from "react";
import Button from "../ui/Button";
import { PRODUCT } from "@/lib/payment/constants";

interface PaymentCardProps {
  orderId: string;
  onPaymentComplete: (paymentId: string) => void;
  onPaymentFail: () => void;
}

export default function PaymentCard({
  orderId,
  onPaymentComplete,
  onPaymentFail,
}: PaymentCardProps) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const PortOne = await import("@portone/browser-sdk/v2");

      const paymentId = `payment-${orderId}-${Date.now()}`;

      const response = await PortOne.requestPayment({
        storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID!,
        channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY!,
        paymentId,
        orderName: PRODUCT.name,
        totalAmount: PRODUCT.amount,
        currency: "CURRENCY_KRW" as const,
        payMethod: "CARD",
      });

      if (response?.code) {
        onPaymentFail();
        return;
      }

      const verifyRes = await fetch("/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, orderId }),
      });

      const verifyData = await verifyRes.json();
      if (verifyData.success) {
        onPaymentComplete(paymentId);
      } else {
        onPaymentFail();
      }
    } catch {
      onPaymentFail();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface rounded-2xl border border-gold/20 p-5 space-y-4 glow-gold">
      <div className="text-center">
        <h3 className="text-base font-bold text-gold font-display">
          운명 전체 까보기
        </h3>
        <p className="text-[13px] text-text-dim mt-1 font-hand">
          도깨비가 끝까지 까줄게
        </p>
      </div>

      <div className="space-y-2">
        {[
          "네가 그런 애야 — 성격과 기질",
          "이런 거 해봐 — 적성과 진로",
          "연애할 때 너 — 대인관계",
          "여기 좀 조심해 — 건강 포인트",
          "2026년, 각오해 — 올해 운세",
          "도깨비가 점지한 행운",
        ].map((text) => (
          <div key={text} className="flex items-center gap-2 text-[13px] text-text-secondary">
            <div className="w-1 h-1 rounded-full bg-gold/40" />
            <span>{text}</span>
          </div>
        ))}
      </div>

      <div className="text-center pt-2">
        <p className="text-2xl font-bold text-gold">990원</p>
        <p className="text-[11px] text-text-dim mt-0.5 font-hand">커피보다 싸잖아 ㅋ</p>
      </div>

      <Button
        onClick={handlePayment}
        fullWidth
        size="lg"
        variant="gold"
        loading={loading}
      >
        운명 까보기 👹
      </Button>

      <p className="text-center text-[11px] text-text-dim">
        안전결제 · 1회성 · 추가결제 없음
      </p>
    </div>
  );
}
