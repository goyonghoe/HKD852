import { FourPillars } from "./types";
import { HEAVENLY_STEMS, EARTHLY_BRANCHES } from "./mappings";
import { SpecialStar, SpecialStarsResult } from "./advanced-types";

// 역마살: 일지 기준 삼합국의 충 위치
const YEOKMA_TABLE: Record<string, string> = {
  in: "sin", o: "sin", sul: "sin",       // 寅午戌 → 申
  sa: "hae", yu: "hae", chuk: "hae",     // 巳酉丑 → 亥
  sin: "in", ja: "in", jin: "in",        // 申子辰 → 寅
  hae: "sa", myo: "sa", mi: "sa",        // 亥卯未 → 巳
};

// 도화살: 일지 기준 삼합국의 왕지
const DOHWA_TABLE: Record<string, string> = {
  in: "myo", o: "myo", sul: "myo",       // 寅午戌 → 卯
  sa: "o", yu: "o", chuk: "o",           // 巳酉丑 → 午
  sin: "yu", ja: "yu", jin: "yu",        // 申子辰 → 酉
  hae: "ja", myo: "ja", mi: "ja",        // 亥卯未 → 子
};

// 화개살: 일지 기준 삼합국의 고지(묘지)
const HWAGAE_TABLE: Record<string, string> = {
  in: "sul", o: "sul", sul: "sul",       // 寅午戌 → 戌
  sa: "chuk", yu: "chuk", chuk: "chuk",  // 巳酉丑 → 丑
  sin: "jin", ja: "jin", jin: "jin",     // 申子辰 → 辰
  hae: "mi", myo: "mi", mi: "mi",        // 亥卯未 → 未
};

// 천을귀인: 일간 기준
const CHEONEUIL_TABLE: Record<string, string[]> = {
  gap: ["chuk", "mi"],    // 甲 → 丑, 未
  eul: ["ja", "sin"],     // 乙 → 子, 申
  byeong: ["hae", "yu"],  // 丙 → 亥, 酉
  jeong: ["hae", "yu"],   // 丁 → 亥, 酉
  mu: ["chuk", "mi"],     // 戊 → 丑, 未
  gi: ["ja", "sin"],      // 己 → 子, 申
  gyeong: ["chuk", "mi"], // 庚 → 丑, 未
  sin: ["o", "in"],       // 辛 → 午, 寅
  im: ["sa", "myo"],      // 壬 → 巳, 卯
  gye: ["sa", "myo"],     // 癸 → 巳, 卯
};

// 귀문관살: 지지 쌍
const GWIMUN_PAIRS: [string, string][] = [
  ["in", "mi"],   // 寅未
  ["myo", "jin"], // 卯辰
  ["sa", "sul"],  // 巳戌
  ["o", "chuk"],  // 午丑
  ["sin", "yu"],  // 申酉 (일부 유파)
  ["hae", "sul"], // 亥戌 (일부 유파)
];

// 홍염살 (紅艷殺): 일간 기준, 사주 내 지지에 해당 글자가 있으면
const HONGYEOM_TABLE: Record<string, string> = {
  gap: "o",       // 甲 → 午
  eul: "sin",     // 乙 → 申
  byeong: "in",   // 丙 → 寅
  jeong: "mi",    // 丁 → 未
  mu: "jin",      // 戊 → 辰
  gi: "jin",      // 己 → 辰
  gyeong: "sul",  // 庚 → 戌
  sin: "yu",      // 辛 → 酉
  im: "ja",       // 壬 → 子
  gye: "sin",     // 癸 → 申
};

// 백호살 (白虎殺): 일간 기준, 양간→辰 음간→丑
const BAEKHO_TABLE: Record<string, string> = {
  gap: "jin",      // 甲(양) → 辰
  eul: "chuk",     // 乙(음) → 丑
  byeong: "jin",   // 丙(양) → 辰
  jeong: "chuk",   // 丁(음) → 丑
  mu: "jin",       // 戊(양) → 辰
  gi: "chuk",      // 己(음) → 丑
  gyeong: "jin",   // 庚(양) → 辰
  sin: "chuk",     // 辛(음) → 丑
  im: "jin",       // 壬(양) → 辰
  gye: "chuk",     // 癸(음) → 丑
};

// 일덕 (日德): 특정 일주 조합에만 해당
const ILDEOK_PILLARS: [string, string][] = [
  ["gap", "in"],      // 甲寅
  ["byeong", "jin"],  // 丙辰
  ["mu", "jin"],      // 戊辰
  ["gyeong", "jin"],  // 庚辰
  ["im", "sul"],      // 壬戌
];

// 태극귀인 (太極貴人): 일간 기준
const TAEGUK_TABLE: Record<string, string[]> = {
  gap: ["ja", "o"],       // 甲 → 子, 午
  eul: ["ja", "o"],       // 乙 → 子, 午
  byeong: ["myo", "yu"],  // 丙 → 卯, 酉
  jeong: ["myo", "yu"],   // 丁 → 卯, 酉
  mu: ["myo", "yu"],      // 戊 → 卯, 酉
  gi: ["myo", "yu"],      // 己 → 卯, 酉
  gyeong: ["jin", "sul"], // 庚 → 辰, 戌
  sin: ["jin", "sul"],    // 辛 → 辰, 戌
  im: ["in", "sin"],      // 壬 → 寅, 申
  gye: ["in", "sin"],     // 癸 → 寅, 申
};

type PillarName = "year" | "month" | "day" | "hour";

function getBranchNames(fourPillars: FourPillars): { name: string; pillar: PillarName }[] {
  const result: { name: string; pillar: PillarName }[] = [
    { name: fourPillars.year.earthlyBranch.name, pillar: "year" },
    { name: fourPillars.month.earthlyBranch.name, pillar: "month" },
    { name: fourPillars.day.earthlyBranch.name, pillar: "day" },
  ];
  if (fourPillars.hour) {
    result.push({ name: fourPillars.hour.earthlyBranch.name, pillar: "hour" });
  }
  return result;
}

function checkStarInBranches(
  targetBranchName: string,
  branches: { name: string; pillar: PillarName }[],
  excludePillar?: PillarName
): string[] {
  return branches
    .filter(b => b.name === targetBranchName && b.pillar !== excludePillar)
    .map(b => b.pillar);
}

export function calculateSpecialStars(fourPillars: FourPillars): SpecialStarsResult {
  const dayBranchName = fourPillars.day.earthlyBranch.name;
  const dayStemName = fourPillars.day.heavenlyStem.name;
  const branches = getBranchNames(fourPillars);

  const stars: SpecialStar[] = [];

  // 1. 역마살
  const yeokmaTarget = YEOKMA_TABLE[dayBranchName];
  if (yeokmaTarget) {
    const affected = checkStarInBranches(yeokmaTarget, branches, "day");
    stars.push({
      key: "yeokma",
      korean: "역마살",
      hanja: "驛馬殺",
      present: affected.length > 0,
      affectedPillars: affected,
    });
  }

  // 2. 도화살
  const dohwaTarget = DOHWA_TABLE[dayBranchName];
  if (dohwaTarget) {
    const affected = checkStarInBranches(dohwaTarget, branches, "day");
    stars.push({
      key: "dohwa",
      korean: "도화살",
      hanja: "桃花殺",
      present: affected.length > 0,
      affectedPillars: affected,
    });
  }

  // 3. 화개살
  const hwagaeTarget = HWAGAE_TABLE[dayBranchName];
  if (hwagaeTarget) {
    const affected = checkStarInBranches(hwagaeTarget, branches, "day");
    stars.push({
      key: "hwagae",
      korean: "화개살",
      hanja: "華蓋殺",
      present: affected.length > 0,
      affectedPillars: affected,
    });
  }

  // 4. 천을귀인
  const cheoneuilTargets = CHEONEUIL_TABLE[dayStemName];
  if (cheoneuilTargets) {
    const affected: string[] = [];
    for (const target of cheoneuilTargets) {
      affected.push(...checkStarInBranches(target, branches));
    }
    stars.push({
      key: "cheoneuil",
      korean: "천을귀인",
      hanja: "天乙貴人",
      present: affected.length > 0,
      affectedPillars: Array.from(new Set(affected)),
    });
  }

  // 5. 귀문관살
  const gwimunAffected: string[] = [];
  for (let i = 0; i < branches.length; i++) {
    for (let j = i + 1; j < branches.length; j++) {
      const a = branches[i].name;
      const b = branches[j].name;
      const isGwimun = GWIMUN_PAIRS.some(
        ([x, y]) => (a === x && b === y) || (a === y && b === x)
      );
      if (isGwimun) {
        gwimunAffected.push(branches[i].pillar, branches[j].pillar);
      }
    }
  }
  stars.push({
    key: "gwimun",
    korean: "귀문관살",
    hanja: "鬼門關殺",
    present: gwimunAffected.length > 0,
    affectedPillars: Array.from(new Set(gwimunAffected)),
  });

  // 6. 홍염살
  const hongyeomTarget = HONGYEOM_TABLE[dayStemName];
  if (hongyeomTarget) {
    const affected = checkStarInBranches(hongyeomTarget, branches);
    stars.push({
      key: "hongyeom",
      korean: "홍염살",
      hanja: "紅艷殺",
      present: affected.length > 0,
      affectedPillars: affected,
    });
  }

  // 7. 백호살
  const baekhoTarget = BAEKHO_TABLE[dayStemName];
  if (baekhoTarget) {
    const affected = checkStarInBranches(baekhoTarget, branches);
    stars.push({
      key: "baekho",
      korean: "백호살",
      hanja: "白虎殺",
      present: affected.length > 0,
      affectedPillars: affected,
    });
  }

  // 8. 일덕
  const hasIldeok = ILDEOK_PILLARS.some(
    ([stem, branch]) => dayStemName === stem && dayBranchName === branch
  );
  stars.push({
    key: "ildeok",
    korean: "일덕",
    hanja: "日德",
    present: hasIldeok,
    affectedPillars: hasIldeok ? ["day"] : [],
  });

  // 9. 태극귀인
  const taegukTargets = TAEGUK_TABLE[dayStemName];
  if (taegukTargets) {
    const affected: string[] = [];
    for (const target of taegukTargets) {
      affected.push(...checkStarInBranches(target, branches));
    }
    stars.push({
      key: "taeguk",
      korean: "태극귀인",
      hanja: "太極貴人",
      present: affected.length > 0,
      affectedPillars: Array.from(new Set(affected)),
    });
  }

  return { stars };
}
