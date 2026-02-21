import { NextRequest, NextResponse } from "next/server";
import { paymentVerifySchema } from "@/lib/utils/validation";
import { getOrder, updateOrderPaid } from "@/lib/db/queries";
import { verifyPayment, validatePaymentAmount } from "@/lib/payment/portone";
import { z } from "zod";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId, orderId } = paymentVerifySchema.parse(body);

    const order = await getOrder(orderId);
    if (!order) {
      return NextResponse.json({ error: "주문을 찾을 수 없습니다" }, { status: 404 });
    }

    if (order.status === "paid") {
      return NextResponse.json({ success: true, orderId });
    }

    const verification = await verifyPayment(paymentId);

    if (verification.status !== "PAID") {
      return NextResponse.json({ error: "결제가 완료되지 않았습니다" }, { status: 402 });
    }

    if (!validatePaymentAmount(verification.amount)) {
      return NextResponse.json({ error: "결제 금액이 일치하지 않습니다" }, { status: 400 });
    }

    await updateOrderPaid(orderId, paymentId);

    return NextResponse.json({ success: true, orderId });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("[api/payment/verify]", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
