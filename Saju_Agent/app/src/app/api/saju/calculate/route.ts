import { NextRequest, NextResponse } from "next/server";
import { sajuInputSchema } from "@/lib/utils/validation";
import { calculateSaju } from "@/lib/saju/calculator";
import { z } from "zod";
import { randomUUID } from "crypto";

function generateShareId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let id = "";
  for (let i = 0; i < 10; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

// DB가 설정되어 있으면 사용, 아니면 데모 모드
async function saveToDb(input: z.infer<typeof sajuInputSchema>, sajuResult: ReturnType<typeof calculateSaju>) {
  if (!process.env.DATABASE_URL) return { orderId: randomUUID(), shareId: null as string | null };
  try {
    const { createOrder } = await import("@/lib/db/queries");
    const { PRODUCT } = await import("@/lib/payment/constants");
    const shareId = generateShareId();
    const order = await createOrder(input, PRODUCT.amount, sajuResult, shareId);
    return { orderId: order.id, shareId };
  } catch (error) {
    console.error("[api/saju/calculate] DB save failed:", error);
    return { orderId: randomUUID(), shareId: null as string | null };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = sajuInputSchema.parse(body);

    const sajuResult = calculateSaju(input);
    const { orderId, shareId } = await saveToDb(input, sajuResult);

    return NextResponse.json({ orderId, sajuResult, shareId });
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
