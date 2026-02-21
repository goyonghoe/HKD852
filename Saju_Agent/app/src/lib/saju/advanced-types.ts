// 십신 (Ten Gods)
export type TenGodKey =
  | "bigyeon"    // 비견 (比肩)
  | "geopjae"    // 겁재 (劫財)
  | "siksin"     // 식신 (食神)
  | "sanggwan"   // 상관 (傷官)
  | "pyeonjae"   // 편재 (偏財)
  | "jeongjae"   // 정재 (正財)
  | "pyeongwan"  // 편관 (偏官)
  | "jeonggwan"  // 정관 (正官)
  | "pyeonin"    // 편인 (偏印)
  | "jeongin";   // 정인 (正印)

export interface TenGodInfo {
  key: TenGodKey;
  hanja: string;
  korean: string;
}

export interface TenGodsResult {
  positions: {
    yearStem: TenGodInfo;
    monthStem: TenGodInfo;
    hourStem: TenGodInfo | null;
  };
  hiddenStems: {
    yearBranch: TenGodInfo[];
    monthBranch: TenGodInfo[];
    dayBranch: TenGodInfo[];
    hourBranch: TenGodInfo[] | null;
  };
  summary: {
    dominant: string;
    dominantCount: number;
    present: string[];
  };
}

// 신살 (Special Stars)
export interface SpecialStar {
  key: string;
  korean: string;
  hanja: string;
  present: boolean;
  affectedPillars: string[];
}

export interface SpecialStarsResult {
  stars: SpecialStar[];
}

// 공망 (Void/Emptiness)
export interface GongmangResult {
  voidBranches: [string, string]; // branch hanja pair
  affectedPillars: string[];
}

// 합충형해 (Branch Relations)
export type BranchRelationType = "combination" | "clash" | "punishment" | "harm" | "halfCombination";

export interface BranchRelation {
  type: BranchRelationType;
  korean: string;
  hanja: string;
  branches: [string, string]; // branch hanja pair
  pillars: [string, string];  // pillar names
}

export interface BranchRelationsResult {
  relations: BranchRelation[];
  hasMajorClash: boolean;
  hasMajorCombination: boolean;
}

// 12운성 (Twelve Life Stages)
export type TwelveStageKey =
  | "jangsaeng"  // 장생 (長生)
  | "mogyok"     // 목욕 (沐浴)
  | "gwandae"    // 관대 (冠帶)
  | "geonrok"    // 건록 (建祿)
  | "jewang"     // 제왕 (帝旺)
  | "soe"        // 쇠 (衰)
  | "byeong"     // 병 (病)
  | "sa"         // 사 (死)
  | "myo"        // 묘 (墓)
  | "jeol"       // 절 (絶)
  | "tae"        // 태 (胎)
  | "yang";      // 양 (養)

export interface TwelveStageInfo {
  key: TwelveStageKey;
  hanja: string;
  korean: string;
}

export interface TwelveStagesResult {
  stages: {
    year: TwelveStageInfo;
    month: TwelveStageInfo;
    day: TwelveStageInfo;
    hour: TwelveStageInfo | null;
  };
}
