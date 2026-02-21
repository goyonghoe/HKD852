import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOrder, updateOrderReading } from "@/lib/db/queries";
import { generateTeaserReading, generateFullReading } from "@/lib/ai/claude-client";
import { SajuResult } from "@/lib/saju/types";

const interpretSchema = z.object({
  orderId: z.string().uuid(),
  type: z.enum(["teaser", "full"]),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, type } = interpretSchema.parse(body);

    const order = await getOrder(orderId);
    if (!order) {
      return NextResponse.json({ error: "주문을 찾을 수 없습니다" }, { status: 404 });
    }

    // TEST MODE: 결제 바이패스 (프로덕션에서는 아래 주석 해제)
    // if (type === "full" && order.status !== "paid") {
    //   return NextResponse.json({ error: "결제가 필요합니다" }, { status: 403 });
    // }

    if (type === "full" && order.readingCache) {
      return NextResponse.json({ reading: JSON.parse(order.readingCache) });
    }

    const sajuResult = order.sajuResult as unknown as SajuResult;
    if (!sajuResult) {
      return NextResponse.json({ error: "사주 결과가 없습니다" }, { status: 400 });
    }

    if (type === "teaser") {
      const reading = await generateTeaserReading(sajuResult);
      return NextResponse.json({ reading });
    }

    const reading = await generateFullReading(sajuResult);
    await updateOrderReading(orderId, JSON.stringify(reading));
    return NextResponse.json({ reading });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("[api/saju/interpret]", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
