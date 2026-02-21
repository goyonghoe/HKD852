import { NextRequest, NextResponse } from "next/server";
import { getOrder, updateOrderPaid } from "@/lib/db/queries";
import { verifyPayment, validatePaymentAmount } from "@/lib/payment/portone";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId } = body;

    if (!paymentId) {
      return NextResponse.json({ message: "No paymentId" }, { status: 200 });
    }

    const verification = await verifyPayment(paymentId);

    if (verification.status !== "PAID" || !validatePaymentAmount(verification.amount)) {
      return NextResponse.json({ message: "Payment not valid" }, { status: 200 });
    }

    const orderId = body.customData?.orderId || body.orderId;
    if (!orderId) {
      return NextResponse.json({ message: "No orderId" }, { status: 200 });
    }

    const order = await getOrder(orderId);
    if (!order || order.status === "paid") {
      return NextResponse.json({ message: "Already processed" }, { status: 200 });
    }

    await updateOrderPaid(orderId, paymentId);

    return NextResponse.json({ message: "OK" }, { status: 200 });
  } catch (error) {
    console.error("[api/payment/webhook]", error);
    return NextResponse.json({ message: "Error logged" }, { status: 200 });
  }
}
