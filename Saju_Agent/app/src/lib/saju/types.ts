import type { TenGodsResult, SpecialStarsResult, GongmangResult, BranchRelationsResult, TwelveStagesResult } from "./advanced-types";
export type { TenGodsResult, SpecialStarsResult, GongmangResult, BranchRelationsResult, TwelveStagesResult };

export type Element = "wood" | "fire" | "earth" | "metal" | "water";
export type YinYang = "yin" | "yang";

export interface HeavenlyStem {
  name: string;
  hanja: string;
  korean: string;
  element: Element;
  yinYang: YinYang;
}

export interface EarthlyBranch {
  name: string;
  hanja: string;
  korean: string;
  element: Element;
  yinYang: YinYang;
  animal: string;
  animalKorean: string;
}

export interface Pillar {
  heavenlyStem: HeavenlyStem;
  earthlyBranch: EarthlyBranch;
}

export interface FourPillars {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar | null;
}

export interface ElementDistribution {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
}

export interface HanjaCharacter {
  hanja: string;     // e.g. "英"
  meaning: string;   // e.g. "꽃부리 영"
  strokes: number;   // e.g. 8
}

export interface NameInfo {
  koreanName: string;              // "김영수"
  familyName: string;             // "김"
  givenNameSyllables: string[];   // ["영", "수"]
  selectedHanja?: HanjaCharacter[];
}

export interface SajuInput {
  birthDate: string; // YYYY-MM-DD
  birthTime: string | null; // HH:mm or null
  gender: "male" | "female";
  isLunar: boolean;
  nameInfo?: NameInfo; // optional — backward compatible
}

export interface SajuResult {
  input: SajuInput;
  fourPillars: FourPillars;
  elementDistribution: ElementDistribution;
  dominantElement: Element;
  weakestElement: Element;
  zodiacAnimal: string;
  zodiacAnimalKorean: string;
  // Advanced analysis (optional — backward compatible)
  tenGods?: TenGodsResult;
  specialStars?: SpecialStarsResult;
  gongmang?: GongmangResult;
  branchRelations?: BranchRelationsResult;
  twelveStages?: TwelveStagesResult;
}

export interface TeaserReading {
  personality: string;
  elementInsight: string;
  nameHint?: string;
}

export type ReadingSectionKey =
  | "personality"
  | "wealth"
  | "career"
  | "love"
  | "relationships"
  | "health"
  | "fortune2026"
  | "travel"
  | "talent"
  | "nameFortune"
  | "dokkaebiAdvice";

export interface FullReadingSection {
  key: ReadingSectionKey;
  title: string;
  icon: string;
  content: string;
  preview?: string;
}

export interface FullReading {
  sections: FullReadingSection[];
  luckyElements: {
    color: string;
    number: string;
    direction: string;
    season: string;
  };
}

// V1 하위호환 (기존 DB 캐시)
export interface FullReadingV1 {
  personality: { title: string; icon: string; content: string };
  career: { title: string; icon: string; content: string };
  love: { title: string; icon: string; content: string };
  health: { title: string; icon: string; content: string };
  fortune2026: { title: string; icon: string; content: string };
  luckyElements: { color: string; number: string; direction: string; season: string };
}

export interface OrderRecord {
  id: string;
  paymentId: string | null;
  sajuInput: SajuInput;
  amount: number;
  status: "pending" | "paid" | "refunded";
  readingCache: string | null;
  createdAt: Date;
  paidAt: Date | null;
}
