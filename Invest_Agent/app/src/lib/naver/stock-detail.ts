/**
 * Naver Finance 개별 종목 상세 API 클라이언트
 */

import { NAVER_HEADERS } from "@/lib/krx/constants";

export interface StockDetail {
  code: string;
  name: string;
  closePrice: number;
  change: number;
  changePercent: number;
  marketCap: number;
  per: number;
  pbr: number;
  eps: number;
  bps: number;
  dividend: number;
  dividendYield: number;
  volume: number;
  high52w: number;
  low52w: number;
}

function parseNum(value: string | number | undefined | null): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === "number") return value;
  const cleaned = value.replace(/[,원배%+]/g, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export async function fetchStockDetail(code: string): Promise<StockDetail> {
  // Basic info
  const basicUrl = `https://m.stock.naver.com/api/stock/${code}/basic`;
  const basicRes = await fetch(basicUrl, { headers: NAVER_HEADERS });

  if (!basicRes.ok) {
    throw new Error(`Stock ${code} not found`);
  }

  const basic = await basicRes.json();

  // Integration info (PER, PBR, EPS, etc.)
  const intUrl = `https://m.stock.naver.com/api/stock/${code}/integration`;
  const intRes = await fetch(intUrl, { headers: NAVER_HEADERS });
  const intData: Record<string, string> = {};

  if (intRes.ok) {
    const intJson = await intRes.json();
    const infos: Array<{ code: string; value: string }> =
      intJson.totalInfos || [];
    for (const info of infos) {
      intData[info.code] = info.value;
    }
  }

  return {
    code,
    name: basic.stockName || basic.stockNameEng || code,
    closePrice: parseNum(basic.closePrice),
    change: parseNum(basic.compareToPreviousClosePrice),
    changePercent: parseNum(basic.fluctuationsRatio),
    marketCap: parseNum(basic.marketValue),
    per: parseNum(intData.per),
    pbr: parseNum(intData.pbr),
    eps: parseNum(intData.eps),
    bps: parseNum(intData.bps),
    dividend: parseNum(intData.dividend),
    dividendYield: parseNum(intData.dividendYieldRatio),
    volume: parseNum(basic.accumulatedTradingVolume),
    high52w: parseNum(basic.high52wPrice),
    low52w: parseNum(basic.low52wPrice),
  };
}
