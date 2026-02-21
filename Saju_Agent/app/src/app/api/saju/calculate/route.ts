import { NextRequest, NextResponse } from "next/server";
import { sajuInputSchema } from "@/lib/utils/validation";
import { calculateSaju } from "@/lib/saju/calculator";
import { createOrder, updateOrderSajuResult } from "@/lib/db/queries";
import { PRODUCT } from "@/lib/payment/constants";
import { z } from "zod";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = sajuInputSchema.parse(body);

    const sajuResult = calculateSaju(input);

    const order = await createOrder(input, PRODUCT.amount);

    await updateOrderSajuResult(order.id, sajuResult);

    return NextResponse.json({
      orderId: order.id,
      sajuResult,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("[api/saju/calculate]", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
