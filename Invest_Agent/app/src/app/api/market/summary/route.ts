import { NextResponse } from "next/server";
import { NAVER_HEADERS } from "@/lib/krx/constants";

interface IndexData {
  name: string;
  code: string;
  closePrice: number;
  change: number;
  changePercent: number;
  volume: string;
  high: number;
  low: number;
  open: number;
  high52w: number;
  low52w: number;
  tradedAt: string;
}

interface MarketSummaryResponse {
  indices: IndexData[];
  exchangeRate: { usdkrw: number; change: number; changePercent: number } | null;
  fetchedAt: string;
  cached: boolean;
}

// In-memory cache
let cachedData: MarketSummaryResponse | null = null;
let cachedAt = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function parseNum(value: string | number | undefined | null): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === "number") return value;
  const cleaned = value.replace(/[,원배%+천주백만]/g, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

async function fetchIndex(code: string): Promise<IndexData | null> {
  try {
    const [basicRes, intRes] = await Promise.all([
      fetch(`https://m.stock.naver.com/api/index/${code}/basic`, {
        headers: NAVER_HEADERS,
      }),
      fetch(`https://m.stock.naver.com/api/index/${code}/integration`, {
        headers: NAVER_HEADERS,
      }),
    ]);

    if (!basicRes.ok) return null;
    const basic = await basicRes.json();

    let intData: Record<string, string> = {};
    if (intRes.ok) {
      const intJson = await intRes.json();
      for (const info of intJson.totalInfos || []) {
        intData[info.code] = info.value;
      }
    }

    return {
      name: basic.stockName || code,
      code,
      closePrice: parseNum(basic.closePrice),
      change: parseNum(basic.compareToPreviousClosePrice),
      changePercent: parseNum(basic.fluctuationsRatio),
      volume: intData.accumulatedTradingVolume || "0",
      high: parseNum(intData.highPrice || basic.highPrice || "0"),
      low: parseNum(intData.lowPrice || basic.lowPrice || "0"),
      open: parseNum(intData.openPrice || "0"),
      high52w: parseNum(intData.highPriceOf52Weeks || "0"),
      low52w: parseNum(intData.lowPriceOf52Weeks || "0"),
      tradedAt: basic.localTradedAt || "",
    };
  } catch {
    return null;
  }
}

async function fetchExchangeRate(): Promise<{
  usdkrw: number;
  change: number;
  changePercent: number;
} | null> {
  try {
    // Scrape from Naver finance exchange page
    const res = await fetch(
      "https://finance.naver.com/marketindex/exchangeDailyQuote.naver?marketindexCd=FX_USDKRW",
      { headers: { "User-Agent": NAVER_HEADERS["User-Agent"] } }
    );
    if (!res.ok) return null;
    const html = await res.text();

    // Extract values from table
    const values = html.match(/>([0-9,]+\.[0-9]+)</g);
    if (!values || values.length < 2) return null;

    const today = parseNum(values[0].replace(/[><]/g, ""));
    const yesterday = parseNum(values[1].replace(/[><]/g, ""));
    const change = Math.round((today - yesterday) * 100) / 100;
    const changePercent =
      yesterday > 0
        ? Math.round(((today - yesterday) / yesterday) * 10000) / 100
        : 0;

    return { usdkrw: today, change, changePercent };
  } catch {
    return null;
  }
}

export async function GET() {
  // Check cache
  if (cachedData && Date.now() - cachedAt < CACHE_TTL) {
    return NextResponse.json({ ...cachedData, cached: true });
  }

  const [kospi, kosdaq, exchangeRate] = await Promise.all([
    fetchIndex("KOSPI"),
    fetchIndex("KOSDAQ"),
    fetchExchangeRate(),
  ]);

  const indices: IndexData[] = [];
  if (kospi) indices.push(kospi);
  if (kosdaq) indices.push(kosdaq);

  const data: MarketSummaryResponse = {
    indices,
    exchangeRate,
    fetchedAt: new Date().toISOString(),
    cached: false,
  };

  cachedData = data;
  cachedAt = Date.now();

  return NextResponse.json(data);
}
