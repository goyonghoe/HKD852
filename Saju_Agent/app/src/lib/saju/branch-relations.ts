import { FourPillars } from "./types";
import { EARTHLY_BRANCHES } from "./mappings";
import { BranchRelation, BranchRelationsResult, BranchRelationType } from "./advanced-types";

// 육합 (Six Combinations)
const COMBINATIONS: [string, string][] = [
  ["ja", "chuk"],  // 子丑合
  ["in", "hae"],   // 寅亥合
  ["myo", "sul"],  // 卯戌合
  ["jin", "yu"],   // 辰酉合
  ["sa", "sin"],   // 巳申合
  ["o", "mi"],     // 午未合
];

// 육충 (Six Clashes)
const CLASHES: [string, string][] = [
  ["ja", "o"],     // 子午沖
  ["chuk", "mi"],  // 丑未沖
  ["in", "sin"],   // 寅申沖
  ["myo", "yu"],   // 卯酉沖
  ["jin", "sul"],  // 辰戌沖
  ["sa", "hae"],   // 巳亥沖
];

// 형 (Punishments)
const PUNISHMENTS: [string, string][] = [
  ["in", "sa"],    // 寅巳刑 (무례지형)
  ["sa", "sin"],   // 巳申刑
  ["sin", "in"],   // 申寅刑
  ["chuk", "sul"], // 丑戌刑 (무은지형)
  ["sul", "mi"],   // 戌未刑
  ["mi", "chuk"],  // 未丑刑
  ["ja", "myo"],   // 子卯刑 (무례지형)
  ["myo", "ja"],   // 卯子刑
];

// 해 (Harms)
const HARMS: [string, string][] = [
  ["ja", "mi"],    // 子未害
  ["chuk", "o"],   // 丑午害
  ["in", "sa"],    // 寅巳害
  ["myo", "jin"],  // 卯辰害
  ["sin", "hae"],  // 申亥害
  ["yu", "sul"],   // 酉戌害
];

// 반합 (Half-Combination): 삼합의 왕(旺)지 포함 2개
const HALF_COMBINATIONS: [string, string][] = [
  ["in", "o"],     // 寅午 반합 화
  ["o", "sul"],    // 午戌 반합 화
  ["sa", "yu"],    // 巳酉 반합 금
  ["yu", "chuk"],  // 酉丑 반합 금
  ["sin", "ja"],   // 申子 반합 수
  ["ja", "jin"],   // 子辰 반합 수
  ["hae", "myo"],  // 亥卯 반합 목
  ["myo", "mi"],   // 卯未 반합 목
];

type PillarEntry = { name: string; pillar: string };

function getBranchHanja(name: string): string {
  return EARTHLY_BRANCHES.find(b => b.name === name)?.hanja || name;
}

function checkRelation(
  pairs: [string, string][],
  a: string,
  b: string
): boolean {
  return pairs.some(([x, y]) => (a === x && b === y) || (a === y && b === x));
}

export function calculateBranchRelations(fourPillars: FourPillars): BranchRelationsResult {
  const entries: PillarEntry[] = [
    { name: fourPillars.year.earthlyBranch.name, pillar: "year" },
    { name: fourPillars.month.earthlyBranch.name, pillar: "month" },
    { name: fourPillars.day.earthlyBranch.name, pillar: "day" },
  ];
  if (fourPillars.hour) {
    entries.push({ name: fourPillars.hour.earthlyBranch.name, pillar: "hour" });
  }

  const relations: BranchRelation[] = [];

  const relTypes: {
    type: BranchRelationType;
    korean: string;
    hanja: string;
    pairs: [string, string][];
  }[] = [
    { type: "combination", korean: "합", hanja: "合", pairs: COMBINATIONS },
    { type: "clash", korean: "충", hanja: "沖", pairs: CLASHES },
    { type: "punishment", korean: "형", hanja: "刑", pairs: PUNISHMENTS },
    { type: "harm", korean: "해", hanja: "害", pairs: HARMS },
    { type: "halfCombination", korean: "반합", hanja: "半合", pairs: HALF_COMBINATIONS },
  ];

  // 모든 기둥 쌍 검사 (6개 쌍: year-month, year-day, year-hour, month-day, month-hour, day-hour)
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const a = entries[i];
      const b = entries[j];

      for (const rel of relTypes) {
        if (checkRelation(rel.pairs, a.name, b.name)) {
          // 반합이면서 동시에 육합이 존재하면 반합 생략
          if (rel.type === "halfCombination") {
            const hasFull = relations.some(
              r => r.type === "combination" &&
                ((r.pillars[0] === a.pillar && r.pillars[1] === b.pillar) ||
                 (r.pillars[0] === b.pillar && r.pillars[1] === a.pillar))
            );
            if (hasFull) continue;
          }
          relations.push({
            type: rel.type,
            korean: rel.korean,
            hanja: rel.hanja,
            branches: [getBranchHanja(a.name), getBranchHanja(b.name)],
            pillars: [a.pillar, b.pillar],
          });
        }
      }
    }
  }

  return {
    relations,
    hasMajorClash: relations.some(r => r.type === "clash"),
    hasMajorCombination: relations.some(r => r.type === "combination"),
  };
}
