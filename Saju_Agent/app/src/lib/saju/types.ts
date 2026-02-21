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

export interface SajuInput {
  birthDate: string; // YYYY-MM-DD
  birthTime: string | null; // HH:mm or null
  gender: "male" | "female";
  isLunar: boolean;
}

export interface SajuResult {
  input: SajuInput;
  fourPillars: FourPillars;
  elementDistribution: ElementDistribution;
  dominantElement: Element;
  weakestElement: Element;
  zodiacAnimal: string;
  zodiacAnimalKorean: string;
}

export interface TeaserReading {
  personality: string;
  elementInsight: string;
}

export interface FullReadingSection {
  title: string;
  icon: string;
  content: string;
}

export interface FullReading {
  personality: FullReadingSection;
  career: FullReadingSection;
  love: FullReadingSection;
  health: FullReadingSection;
  fortune2026: FullReadingSection;
  luckyElements: {
    color: string;
    number: string;
    direction: string;
    season: string;
  };
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
