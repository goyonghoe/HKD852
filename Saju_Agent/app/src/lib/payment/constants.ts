export const PRODUCT = {
  id: "saju-full-reading",
  name: "AI 사주 상세 풀이",
  amount: 990,
  currency: "KRW",
} as const;

export const PORTONE_CONFIG = {
  storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID!,
  channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY!,
} as const;
