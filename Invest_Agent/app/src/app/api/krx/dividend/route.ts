import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fetchDividendData } from "@/lib/krx/client";
import type { StockItem, MarketType } from "@/lib/krx/types";

const querySchema = z.object({
  market: z.enum(["ALL", "KOSPI", "KOSDAQ"]).optional(),
});

// In-memory cache (30 minutes TTL)
const cache = new Map<
  string,
  { data: StockItem[]; timestamp: number }
>();
const CACHE_TTL = 30 * 60 * 1000;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      market: searchParams.get("market") || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const market: MarketType = parsed.data.market || "ALL";
    const cacheKey = market;

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({
        data: cached.data,
        meta: {
          market,
          totalCount: cached.data.length,
          cached: true,
          fetchedAt: new Date(cached.timestamp).toISOString(),
        },
      });
    }

    // Fetch from Naver Finance
    const data = await fetchDividendData(market);
    cache.set(cacheKey, { data, timestamp: Date.now() });

    return NextResponse.json({
      data,
      meta: {
        market,
        totalCount: data.length,
        cached: false,
        fetchedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      {
        error: "데이터 조회 실패",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
