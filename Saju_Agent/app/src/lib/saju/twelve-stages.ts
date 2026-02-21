import { FourPillars } from "./types";
import { HEAVENLY_STEMS, EARTHLY_BRANCHES } from "./mappings";
import { TwelveStageKey, TwelveStageInfo, TwelveStagesResult } from "./advanced-types";

// 12운성 순서
const STAGE_ORDER: { key: TwelveStageKey; hanja: string; korean: string }[] = [
  { key: "jangsaeng", hanja: "長生", korean: "장생" },
  { key: "mogyok",    hanja: "沐浴", korean: "목욕" },
  { key: "gwandae",   hanja: "冠帶", korean: "관대" },
  { key: "geonrok",   hanja: "建祿", korean: "건록" },
  { key: "jewang",    hanja: "帝旺", korean: "제왕" },
  { key: "soe",       hanja: "衰",   korean: "쇠" },
  { key: "byeong",    hanja: "病",   korean: "병" },
  { key: "sa",        hanja: "死",   korean: "사" },
  { key: "myo",       hanja: "墓",   korean: "묘" },
  { key: "jeol",      hanja: "絶",   korean: "절" },
  { key: "tae",       hanja: "胎",   korean: "태" },
  { key: "yang",      hanja: "養",   korean: "양" },
];

// 각 천간의 장생 시작 지지 인덱스
// 甲→亥(11), 乙→午(6), 丙→寅(2), 丁→酉(9), 戊→寅(2)
// 己→酉(9), 庚→巳(5), 辛→子(0), 壬→申(8), 癸→卯(3)
const JANGSAENG_START: number[] = [11, 6, 2, 9, 2, 9, 5, 0, 8, 3];

// 양간(甲丙戊庚壬): 순방향, 음간(乙丁己辛癸): 역방향
const IS_YANG_STEM: boolean[] = [true, false, true, false, true, false, true, false, true, false];

function getStage(stemIdx: number, branchIdx: number): TwelveStageInfo {
  const start = JANGSAENG_START[stemIdx];
  const isYang = IS_YANG_STEM[stemIdx];

  let offset: number;
  if (isYang) {
    offset = ((branchIdx - start) % 12 + 12) % 12;
  } else {
    offset = ((start - branchIdx) % 12 + 12) % 12;
  }

  const stage = STAGE_ORDER[offset];
  return { key: stage.key, hanja: stage.hanja, korean: stage.korean };
}

export function calculateTwelveStages(fourPillars: FourPillars): TwelveStagesResult {
  const dayMasterIdx = HEAVENLY_STEMS.findIndex(s => s.name === fourPillars.day.heavenlyStem.name);

  const yearBranchIdx = EARTHLY_BRANCHES.findIndex(b => b.name === fourPillars.year.earthlyBranch.name);
  const monthBranchIdx = EARTHLY_BRANCHES.findIndex(b => b.name === fourPillars.month.earthlyBranch.name);
  const dayBranchIdx = EARTHLY_BRANCHES.findIndex(b => b.name === fourPillars.day.earthlyBranch.name);

  let hourStage: TwelveStageInfo | null = null;
  if (fourPillars.hour) {
    const hourBranchIdx = EARTHLY_BRANCHES.findIndex(b => b.name === fourPillars.hour!.earthlyBranch.name);
    hourStage = getStage(dayMasterIdx, hourBranchIdx);
  }

  return {
    stages: {
      year: getStage(dayMasterIdx, yearBranchIdx),
      month: getStage(dayMasterIdx, monthBranchIdx),
      day: getStage(dayMasterIdx, dayBranchIdx),
      hour: hourStage,
    },
  };
}
