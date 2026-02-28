/**
 * 포트폴리오 localStorage CRUD
 */

export interface PortfolioHolding {
  id: string;
  code: string;
  name: string;
  buyPrice: number;
  quantity: number;
  buyDate: string;
  stopLossPrice: number;
  highestPrice: number;
  type: "etf" | "stock";
  buyReason: "growth" | "undervalued";
  memo: string;
}

const STORAGE_KEY = "invest_portfolio";

function generateId(): string {
  return `h_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export function getHoldings(): PortfolioHolding[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PortfolioHolding[];
  } catch {
    return [];
  }
}

export function addHolding(
  holding: Omit<PortfolioHolding, "id">
): PortfolioHolding {
  const holdings = getHoldings();
  const newHolding: PortfolioHolding = { ...holding, id: generateId() };
  holdings.push(newHolding);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
  return newHolding;
}

export function removeHolding(id: string): void {
  const holdings = getHoldings().filter((h) => h.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
}

export function updateHolding(
  id: string,
  updates: Partial<Omit<PortfolioHolding, "id">>
): void {
  const holdings = getHoldings().map((h) =>
    h.id === id ? { ...h, ...updates } : h
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
}

export function updateHighestPrice(id: string, price: number): void {
  const holdings = getHoldings().map((h) =>
    h.id === id && price > h.highestPrice
      ? { ...h, highestPrice: price }
      : h
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
}
