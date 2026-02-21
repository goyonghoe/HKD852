import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOrder } from "@/lib/db/queries";
import { PRODUCT } from "@/lib/payment/constants";

const prepareSchema = z.object({
  orderId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId } = prepareSchema.parse(body);

    const order = await getOrder(orderId);
    if (!order) {
      return NextResponse.json({ error: "주문을 찾을 수 없습니다" }, { status: 404 });
    }

    if (order.status === "paid") {
      return NextResponse.json({ error: "이미 결제된 주문입니다" }, { status: 400 });
    }

    return NextResponse.json({
      orderId: order.id,
      orderName: PRODUCT.name,
      amount: PRODUCT.amount,
      currency: PRODUCT.currency,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("[api/payment/prepare]", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
