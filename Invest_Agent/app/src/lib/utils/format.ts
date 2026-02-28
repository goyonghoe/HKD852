export function formatNumber(num: number): string {
  return num.toLocaleString("ko-KR");
}

export function formatPrice(price: number): string {
  return price.toLocaleString("ko-KR") + "원";
}

export function formatPercent(value: number): string {
  return value.toFixed(2) + "%";
}

export function parseKrxNumber(value: string): number {
  if (!value || value === "-" || value === "" || value === "N/A") return 0;
  const cleaned = value.replace(/,/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}
