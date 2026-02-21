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
    <div className="bg-white rounded-2xl shadow-lg border border-primary/20 p-5 space-y-4">
      <div className="text-center">
        <span className="text-3xl">✨</span>
        <h3 className="text-base font-bold text-gray-800 mt-2">
          상세 풀이 열어보기
        </h3>
        <p className="text-xs text-gray-400 mt-1">
          AI가 분석한 나만의 깊은 사주 풀이
        </p>
      </div>

      <div className="space-y-2">
        {[
          { icon: "🦋", text: "성격과 기질 분석" },
          { icon: "💼", text: "적성과 진로 가이드" },
          { icon: "💕", text: "연애와 대인관계" },
          { icon: "🌿", text: "건강 포인트" },
          { icon: "⭐", text: "2026년 운세" },
          { icon: "🍀", text: "행운의 색/숫자/방향/계절" },
        ].map(({ icon, text }) => (
          <div key={text} className="flex items-center gap-2 text-xs text-gray-500">
            <span>{icon}</span>
            <span>{text}</span>
          </div>
        ))}
      </div>

      <div className="text-center pt-2">
        <p className="text-2xl font-bold text-gradient">990원</p>
        <p className="text-[10px] text-gray-400 mt-0.5">커피 한 잔보다 저렴해요</p>
      </div>

      <Button
        onClick={handlePayment}
        fullWidth
        size="lg"
        variant="secondary"
        loading={loading}
      >
        지금 확인하기
      </Button>

      <p className="text-center text-[10px] text-gray-300">
        안전결제 · 1회성 · 추가결제 없음
      </p>
    </div>
  );
}
