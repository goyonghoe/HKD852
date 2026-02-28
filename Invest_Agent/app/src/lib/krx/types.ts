export type MarketType = "ALL" | "KOSPI" | "KOSDAQ";

export type SortField =
  | "code"
  | "name"
  | "closePrice"
  | "eps"
  | "per"
  | "bps"
  | "pbr"
  | "dps"
  | "dividendYield";

export type SortDirection = "asc" | "desc";

export interface StockItem {
  code: string;
  name: string;
  closePrice: number;
  eps: number;
  per: number;
  bps: number;
  pbr: number;
  dps: number;
  dividendYield: number;
  market: "KOSPI" | "KOSDAQ";
}

export interface NaverStockListItem {
  itemCode: string;
  stockName: string;
  closePrice: string;
  sosok: string; // "0" = KOSPI, "1" = KOSDAQ
}

export interface NaverIntegrationInfo {
  code: string;
  key: string;
  value: string;
}

export interface DividendApiResponse {
  data: StockItem[];
  meta: {
    market: MarketType;
    totalCount: number;
    cached: boolean;
    fetchedAt: string;
  };
}

export interface DashboardState {
  market: MarketType;
  searchQuery: string;
  sortField: SortField;
  sortDirection: SortDirection;
}
