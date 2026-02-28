import { NextRequest, NextResponse } from "next/server";
import { fetchStockDetail } from "@/lib/naver/stock-detail";

// In-memory cache: code -> { data, fetchedAt }
const cache = new Map<
  string,
  { data: ReturnType<typeof fetchStockDetail> extends Promise<infer T> ? T : never; fetchedAt: number }
>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  if (!code || !/^\d{6}$/.test(code)) {
    return NextResponse.json(
      { error: "유효한 6자리 종목코드를 입력해주세요" },
      { status: 400 }
    );
  }

  // Check cache
  const cached = cache.get(code);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return NextResponse.json({ ...cached.data, cached: true });
  }

  try {
    const detail = await fetchStockDetail(code);
    cache.set(code, { data: detail, fetchedAt: Date.now() });
    return NextResponse.json({ ...detail, cached: false });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "종목 조회 실패" },
      { status: 404 }
    );
  }
}
