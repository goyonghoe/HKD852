import {
  NAVER_STOCK_LIST_URL,
  NAVER_INTEGRATION_URL,
  NAVER_HEADERS,
  PAGE_SIZE,
  CONCURRENCY,
} from "./constants";
import type { StockItem, MarketType, NaverStockListItem } from "./types";

function parseNaverNumber(value: string): number {
  if (!value || value === "N/A" || value === "-") return 0;
  const cleaned = value.replace(/[,원배%]/g, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

async function fetchStockCodes(
  market: "KOSPI" | "KOSDAQ"
): Promise<NaverStockListItem[]> {
  const allStocks: NaverStockListItem[] = [];
  let page = 1;

  while (true) {
    const url = `${NAVER_STOCK_LIST_URL}/${market}?page=${page}&pageSize=${PAGE_SIZE}`;
    const resp = await fetch(url, { headers: NAVER_HEADERS });

    if (!resp.ok) break;

    const json = await resp.json();
    const stocks = json.stocks as NaverStockListItem[] | undefined;

    if (!stocks || stocks.length === 0) break;

    allStocks.push(...stocks);
    page++;

    // Safety: max 50 pages
    if (page > 50) break;
  }

  return allStocks;
}

async function fetchIntegration(
  code: string
): Promise<Record<string, string>> {
  try {
    const url = `${NAVER_INTEGRATION_URL}/${code}/integration`;
    const resp = await fetch(url, { headers: NAVER_HEADERS });

    if (!resp.ok) return {};

    const json = await resp.json();
    const infos: Array<{ code: string; value: string }> =
      json.totalInfos || [];

    const result: Record<string, string> = {};
    for (const info of infos) {
      result[info.code] = info.value;
    }
    return result;
  } catch {
    return {};
  }
}

async function batchFetchIntegrations(
  codes: string[]
): Promise<Map<string, Record<string, string>>> {
  const results = new Map<string, Record<string, string>>();
  const batches: string[][] = [];

  for (let i = 0; i < codes.length; i += CONCURRENCY) {
    batches.push(codes.slice(i, i + CONCURRENCY));
  }

  for (const batch of batches) {
    const promises = batch.map(async (code) => {
      const data = await fetchIntegration(code);
      return { code, data };
    });

    const settled = await Promise.allSettled(promises);
    for (const result of settled) {
      if (result.status === "fulfilled") {
        results.set(result.value.code, result.value.data);
      }
    }
  }

  return results;
}

function buildStockItem(
  listItem: NaverStockListItem,
  integration: Record<string, string>
): StockItem {
  const closePrice = parseNaverNumber(listItem.closePrice);

  return {
    code: listItem.itemCode,
    name: listItem.stockName,
    closePrice,
    eps: parseNaverNumber(integration.eps || "0"),
    per: parseNaverNumber(integration.per || "0"),
    bps: parseNaverNumber(integration.bps || "0"),
    pbr: parseNaverNumber(integration.pbr || "0"),
    dps: parseNaverNumber(integration.dividend || "0"),
    dividendYield: parseNaverNumber(integration.dividendYieldRatio || "0"),
    market: listItem.sosok === "0" ? "KOSPI" : "KOSDAQ",
  };
}

export async function fetchDividendData(
  market: MarketType
): Promise<StockItem[]> {
  const markets: Array<"KOSPI" | "KOSDAQ"> =
    market === "ALL" ? ["KOSPI", "KOSDAQ"] : [market as "KOSPI" | "KOSDAQ"];

  // Step 1: Get all stock codes
  const allListItems: NaverStockListItem[] = [];
  for (const m of markets) {
    const items = await fetchStockCodes(m);
    allListItems.push(...items);
  }

  console.log(`[Naver] Fetched ${allListItems.length} stock codes`);

  // Step 2: Fetch integration data for all stocks
  const codes = allListItems.map((s) => s.itemCode);
  const integrations = await batchFetchIntegrations(codes);

  console.log(`[Naver] Fetched integration data for ${integrations.size} stocks`);

  // Step 3: Build stock items
  const stocks = allListItems.map((item) => {
    const integration = integrations.get(item.itemCode) || {};
    return buildStockItem(item, integration);
  });

  return stocks;
}
