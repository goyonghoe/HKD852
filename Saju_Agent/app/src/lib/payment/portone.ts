import { PRODUCT } from "./constants";

interface PaymentVerification {
  paymentId: string;
  status: string;
  amount: number;
}

/**
 * PortOne V2 서버 API로 결제 검증
 * https://developers.portone.io/api/rest-v2
 */
export async function verifyPayment(paymentId: string): Promise<PaymentVerification> {
  const response = await fetch(
    `https://api.portone.io/payments/${encodeURIComponent(paymentId)}`,
    {
      headers: {
        Authorization: `PortOne ${process.env.PORTONE_API_SECRET}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`PortOne API error: ${response.status}`);
  }

  const data = await response.json();

  return {
    paymentId: data.id,
    status: data.status,
    amount: data.amount?.total ?? 0,
  };
}

/**
 * 결제 금액 검증 — 서버에서 고정된 가격과 비교
 */
export function validatePaymentAmount(paidAmount: number): boolean {
  return paidAmount === PRODUCT.amount;
}
