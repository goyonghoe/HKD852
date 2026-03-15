import { PRODUCT, TOSS_CONFIG } from "./constants";

interface TossPaymentConfirmation {
  paymentKey: string;
  orderId: string;
  status: string;
  totalAmount: number;
}

/**
 * 토스페이먼츠 결제 승인 API
 * https://docs.tosspayments.com/reference#결제-승인
 */
export async function confirmPayment(
  paymentKey: string,
  orderId: string,
  amount: number,
): Promise<TossPaymentConfirmation> {
  const secretKey = TOSS_CONFIG.secretKey;
  const encoded = Buffer.from(`${secretKey}:`).toString("base64");

  const response = await fetch(
    "https://api.tosspayments.com/v1/payments/confirm",
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${encoded}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    },
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `TossPayments API error: ${response.status} - ${error.message || "Unknown"}`,
    );
  }

  const data = await response.json();

  return {
    paymentKey: data.paymentKey,
    orderId: data.orderId,
    status: data.status,
    totalAmount: data.totalAmount,
  };
}

/**
 * 결제 금액 검증 — 서버에서 고정된 가격과 비교
 */
export function validatePaymentAmount(paidAmount: number): boolean {
  return paidAmount === PRODUCT.amount;
}
