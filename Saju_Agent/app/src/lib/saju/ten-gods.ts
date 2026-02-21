import { FourPillars, Element } from "./types";
import { HEAVENLY_STEMS, EARTHLY_BRANCHES } from "./mappings";
import { TenGodKey, TenGodInfo, TenGodsResult } from "./advanced-types";

// 십신 정보 테이블
const TEN_GOD_TABLE: Record<TenGodKey, { hanja: string; korean: string }> = {
  bigyeon:   { hanja: "比肩", korean: "비견" },
  geopjae:   { hanja: "劫財", korean: "겁재" },
  siksin:    { hanja: "食神", korean: "식신" },
  sanggwan:  { hanja: "傷官", korean: "상관" },
  pyeonjae:  { hanja: "偏財", korean: "편재" },
  jeongjae:  { hanja: "正財", korean: "정재" },
  pyeongwan: { hanja: "偏官", korean: "편관" },
  jeonggwan: { hanja: "正官", korean: "정관" },
  pyeonin:   { hanja: "偏印", korean: "편인" },
  jeongin:   { hanja: "正印", korean: "정인" },
};

// 오행 상생상극 관계
// 나(me)와 상대(other)의 관계: same/produce/produced/control/controlled
type Relation = "same" | "produce" | "produced" | "control" | "controlled";

const ELEMENT_RELATION: Record<Element, Record<Element, Relation>> = {
  wood:  { wood: "same", fire: "produce", earth: "control", metal: "controlled", water: "produced" },
  fire:  { wood: "produced", fire: "same", earth: "produce", metal: "control", water: "controlled" },
  earth: { wood: "controlled", fire: "produced", earth: "same", metal: "produce", water: "control" },
  metal: { wood: "control", fire: "controlled", earth: "produced", metal: "same", water: "produce" },
  water: { wood: "produce", fire: "control", earth: "controlled", metal: "produced", water: "same" },
};

// 지장간 (Hidden Stems) — 각 지지에 숨어있는 천간 인덱스
const HIDDEN_STEMS: Record<string, number[]> = {
  ja:   [9],         // 子 → 癸
  chuk: [5, 9, 7],   // 丑 → 己, 癸, 辛
  in:   [0, 2, 4],   // 寅 → 甲, 丙, 戊
  myo:  [1],         // 卯 → 乙
  jin:  [4, 1, 9],   // 辰 → 戊, 乙, 癸
  sa:   [2, 4, 6],   // 巳 → 丙, 戊, 庚
  o:    [3, 5],      // 午 → 丁, 己
  mi:   [5, 3, 1],   // 未 → 己, 丁, 乙
  sin:  [6, 4, 8],   // 申 → 庚, 戊, 壬
  yu:   [7],         // 酉 → 辛
  sul:  [4, 7, 3],   // 戌 → 戊, 辛, 丁
  hae:  [8, 0],      // 亥 → 壬, 甲
};

function getTenGodKey(myElement: Element, myYinYang: string, otherElement: Element, otherYinYang: string): TenGodKey {
  const relation = ELEMENT_RELATION[myElement][otherElement];
  const samePolarity = myYinYang === otherYinYang;

  switch (relation) {
    case "same":       return samePolarity ? "bigyeon" : "geopjae";
    case "produce":    return samePolarity ? "siksin" : "sanggwan";
    case "control":    return samePolarity ? "pyeonjae" : "jeongjae";
    case "controlled": return samePolarity ? "pyeongwan" : "jeonggwan";
    case "produced":   return samePolarity ? "pyeonin" : "jeongin";
  }
}

function makeTenGodInfo(key: TenGodKey): TenGodInfo {
  return { key, ...TEN_GOD_TABLE[key] };
}

function getGodForStem(dayMasterIdx: number, otherStemIdx: number): TenGodInfo {
  const me = HEAVENLY_STEMS[dayMasterIdx];
  const other = HEAVENLY_STEMS[otherStemIdx];
  const key = getTenGodKey(me.element, me.yinYang, other.element, other.yinYang);
  return makeTenGodInfo(key);
}

function getHiddenStemGods(dayMasterIdx: number, branchName: string): TenGodInfo[] {
  const hiddenIndices = HIDDEN_STEMS[branchName] || [];
  return hiddenIndices.map(idx => getGodForStem(dayMasterIdx, idx));
}

/** 지지의 지장간 천간 한자 배열 반환 */
export function getHiddenStemHanjas(branchName: string): string[] {
  const indices = HIDDEN_STEMS[branchName] || [];
  return indices.map(idx => HEAVENLY_STEMS[idx].hanja);
}

/** 지지의 본기(主氣) 십신 — 지장간 중 첫 번째 (여기가 해당 지지의 주요 십신) */
export function getBranchMainGod(dayMasterIdx: number, branchName: string): TenGodInfo | null {
  const indices = HIDDEN_STEMS[branchName] || [];
  if (indices.length === 0) return null;
  return getGodForStem(dayMasterIdx, indices[0]);
}

export function calculateTenGods(fourPillars: FourPillars): TenGodsResult {
  const dayMasterIdx = HEAVENLY_STEMS.findIndex(s => s.name === fourPillars.day.heavenlyStem.name);

  const yearStemIdx = HEAVENLY_STEMS.findIndex(s => s.name === fourPillars.year.heavenlyStem.name);
  const monthStemIdx = HEAVENLY_STEMS.findIndex(s => s.name === fourPillars.month.heavenlyStem.name);
  const hourStemIdx = fourPillars.hour
    ? HEAVENLY_STEMS.findIndex(s => s.name === fourPillars.hour!.heavenlyStem.name)
    : -1;

  const positions = {
    yearStem: getGodForStem(dayMasterIdx, yearStemIdx),
    monthStem: getGodForStem(dayMasterIdx, monthStemIdx),
    hourStem: hourStemIdx >= 0 ? getGodForStem(dayMasterIdx, hourStemIdx) : null,
  };

  const hiddenStems = {
    yearBranch: getHiddenStemGods(dayMasterIdx, fourPillars.year.earthlyBranch.name),
    monthBranch: getHiddenStemGods(dayMasterIdx, fourPillars.month.earthlyBranch.name),
    dayBranch: getHiddenStemGods(dayMasterIdx, fourPillars.day.earthlyBranch.name),
    hourBranch: fourPillars.hour ? getHiddenStemGods(dayMasterIdx, fourPillars.hour.earthlyBranch.name) : null,
  };

  // 십신 빈도 계산
  const allGods: TenGodKey[] = [
    positions.yearStem.key,
    positions.monthStem.key,
    ...(positions.hourStem ? [positions.hourStem.key] : []),
    ...hiddenStems.yearBranch.map(g => g.key),
    ...hiddenStems.monthBranch.map(g => g.key),
    ...hiddenStems.dayBranch.map(g => g.key),
    ...(hiddenStems.hourBranch?.map(g => g.key) || []),
  ];

  const counts: Record<string, number> = {};
  for (const god of allGods) {
    counts[god] = (counts[god] || 0) + 1;
  }

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const dominant = sorted[0]?.[0] || "bigyeon";
  const dominantCount = sorted[0]?.[1] || 0;
  const present = Array.from(new Set(allGods)).map(k => TEN_GOD_TABLE[k as TenGodKey].korean);

  return {
    positions,
    hiddenStems,
    summary: {
      dominant: TEN_GOD_TABLE[dominant as TenGodKey].korean,
      dominantCount,
      present,
    },
  };
}
