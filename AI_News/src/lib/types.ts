export type Category =
  | "research"
  | "industry"
  | "regulation"
  | "startup"
  | "opensource";

export type Region = "us" | "kr" | "cn" | "jp" | "eu";

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  category: Category;
  region: Region;
  publishedAt: string;
  score: number;
  engagement: number;
}

export interface DailyBrief {
  date: string;
  trendAnalysis: string;
  topKeywords: string[];
}

export const CATEGORY_META: Record<Category, { label: string; color: string }> =
  {
    research: {
      label: "연구",
      color: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    },
    industry: {
      label: "산업",
      color: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    },
    regulation: {
      label: "규제",
      color: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    },
    startup: {
      label: "스타트업",
      color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    },
    opensource: {
      label: "오픈소스",
      color: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    },
  };

export const REGION_META: Record<Region, { label: string; flag: string }> = {
  us: { label: "미국", flag: "🇺🇸" },
  kr: { label: "한국", flag: "🇰🇷" },
  cn: { label: "중국", flag: "🇨🇳" },
  jp: { label: "일본", flag: "🇯🇵" },
  eu: { label: "유럽", flag: "🇪🇺" },
};
