export const NAVER_STOCK_LIST_URL =
  "https://m.stock.naver.com/api/stocks/marketValue";

export const NAVER_INTEGRATION_URL =
  "https://m.stock.naver.com/api/stock";

export const NAVER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
};

export const PAGE_SIZE = 100;
export const CONCURRENCY = 30;

export const MARKET_MAP: Record<string, string> = {
  ALL: "ALL",
  KOSPI: "KOSPI",
  KOSDAQ: "KOSDAQ",
};

export const MARKET_LABELS: Record<string, string> = {
  ALL: "전체",
  KOSPI: "KOSPI",
  KOSDAQ: "KOSDAQ",
};

export const COLUMN_LABELS: Record<string, string> = {
  code: "종목코드",
  name: "종목명",
  closePrice: "종가",
  eps: "EPS",
  per: "PER",
  bps: "BPS",
  pbr: "PBR",
  dps: "배당금",
  dividendYield: "배당수익률",
};
