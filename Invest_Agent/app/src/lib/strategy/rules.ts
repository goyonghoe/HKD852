/**
 * 투자 전략 규칙 엔진 — docs/strategy.md 기반
 */

/** 손절매 10% 룰 (§2.1) */
export const STOP_LOSS_PERCENT = 10;

/** 익절 트레일링 스톱 (§2.2) — 최고점 대비 하락 비율 */
export const TRAILING_STOP_PERCENT = 10;

/** 바벨 전략 비율 (§3.4) */
export const BARBELL_SAFE_RATIO = 0.8;
export const BARBELL_AGGRESSIVE_RATIO = 0.2;

/** 고배당 기준 (§3.2) */
export const HIGH_DIVIDEND_THRESHOLD = 3;

/** PBR 저평가 기준 (§1.1, §4.1) */
export const UNDERVALUED_PBR_THRESHOLD = 1;

export interface HoldingItem {
  code: string;
  name: string;
  buyPrice: number;
  quantity: number;
  buyDate: string;
  stopLossPrice: number;
  highestPrice: number;
  type: "etf" | "stock";
  buyReason: "growth" | "undervalued";
  memo?: string;
}

export interface StopLossAlert {
  code: string;
  name: string;
  buyPrice: number;
  currentPrice: number;
  lossPercent: number;
  stopLossPrice: number;
  triggered: boolean;
}

export interface TrailingStopAlert {
  code: string;
  name: string;
  highestPrice: number;
  currentPrice: number;
  dropPercent: number;
  triggered: boolean;
}

export interface BarbelRatio {
  safeValue: number;
  aggressiveValue: number;
  safePercent: number;
  aggressivePercent: number;
  totalValue: number;
  balanced: boolean;
}

/** 손절 체크 — 매수가 대비 10% 이상 하락 시 알림 (§2.1) */
export function checkStopLoss(
  holding: HoldingItem,
  currentPrice: number
): StopLossAlert {
  const lossPercent =
    ((holding.buyPrice - currentPrice) / holding.buyPrice) * 100;
  // ETF는 손절 기준 미적용 (§2.1 예외)
  const triggered =
    holding.type !== "etf" && lossPercent >= STOP_LOSS_PERCENT;

  return {
    code: holding.code,
    name: holding.name,
    buyPrice: holding.buyPrice,
    currentPrice,
    lossPercent: Math.round(lossPercent * 100) / 100,
    stopLossPrice: holding.stopLossPrice,
    triggered,
  };
}

/** 익절 트레일링 스톱 — 최고점 대비 10% 하락 시 매도 시그널 (§2.2) */
export function checkTrailingStop(
  holding: HoldingItem,
  currentPrice: number
): TrailingStopAlert {
  const effectiveHigh = Math.max(holding.highestPrice, currentPrice);
  const dropPercent =
    ((effectiveHigh - currentPrice) / effectiveHigh) * 100;
  const triggered =
    holding.type !== "etf" &&
    currentPrice > holding.buyPrice &&
    dropPercent >= TRAILING_STOP_PERCENT;

  return {
    code: holding.code,
    name: holding.name,
    highestPrice: effectiveHigh,
    currentPrice,
    dropPercent: Math.round(dropPercent * 100) / 100,
    triggered,
  };
}

/** 바벨 비율 계산 — ETF(80%) vs 개별주식(20%) 권장 (§3.4) */
export function calculateBarbelRatio(
  holdings: HoldingItem[],
  currentPrices: Map<string, number>
): BarbelRatio {
  let safeValue = 0;
  let aggressiveValue = 0;

  for (const h of holdings) {
    const price = currentPrices.get(h.code) ?? h.buyPrice;
    const value = price * h.quantity;
    if (h.type === "etf") {
      safeValue += value;
    } else {
      aggressiveValue += value;
    }
  }

  const totalValue = safeValue + aggressiveValue;
  const safePercent = totalValue > 0 ? (safeValue / totalValue) * 100 : 0;
  const aggressivePercent =
    totalValue > 0 ? (aggressiveValue / totalValue) * 100 : 0;

  return {
    safeValue,
    aggressiveValue,
    safePercent: Math.round(safePercent * 10) / 10,
    aggressivePercent: Math.round(aggressivePercent * 10) / 10,
    totalValue,
    balanced:
      safePercent >= BARBELL_SAFE_RATIO * 100 - 10 &&
      safePercent <= BARBELL_SAFE_RATIO * 100 + 10,
  };
}

/** PBR 저평가 필터 (§4.1) */
export function isUndervaluedByPBR(pbr: number): boolean {
  return pbr > 0 && pbr < UNDERVALUED_PBR_THRESHOLD;
}

/** 과소비 지수 계산 (§5.1) */
export function calculateOverspendIndex(
  monthlyIncome: number,
  monthlySavings: number
): { index: number; level: "safe" | "warning" | "danger" } {
  if (monthlyIncome <= 0) return { index: 0, level: "safe" };
  const index = (monthlyIncome - monthlySavings) / monthlyIncome;
  const level = index >= 0.7 ? "danger" : index >= 0.5 ? "warning" : "safe";
  return { index: Math.round(index * 100) / 100, level };
}
