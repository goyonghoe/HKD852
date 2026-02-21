import { NextRequest, NextResponse } from "next/server";
import { sajuInputSchema } from "@/lib/utils/validation";
import { calculateSaju } from "@/lib/saju/calculator";
import { z } from "zod";
import { randomUUID } from "crypto";

// DB가 설정되어 있으면 사용, 아니면 데모 모드
async function saveToDb(input: z.infer<typeof sajuInputSchema>, sajuResult: ReturnType<typeof calculateSaju>) {
  if (!process.env.DATABASE_URL) return randomUUID();
  try {
    const { createOrder, updateOrderSajuResult } = await import("@/lib/db/queries");
    const { PRODUCT } = await import("@/lib/payment/constants");
    const order = await createOrder(input, PRODUCT.amount);
    await updateOrderSajuResult(order.id, sajuResult);
    return order.id;
  } catch {
    return randomUUID();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = sajuInputSchema.parse(body);

    const sajuResult = calculateSaju(input);
    const orderId = await saveToDb(input, sajuResult);

    return NextResponse.json({ orderId, sajuResult });
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
