import { FourPillars } from "./types";
import { HEAVENLY_STEMS, EARTHLY_BRANCHES } from "./mappings";
import { GongmangResult } from "./advanced-types";

/**
 * 공망 (空亡) 계산
 * 60갑자 순환에서 일주 기준, 10일 묶음(旬) 내에서 사용되지 않는 2개의 지지
 */
export function calculateGongmang(fourPillars: FourPillars): GongmangResult {
  const dayStemIdx = HEAVENLY_STEMS.findIndex(s => s.name === fourPillars.day.heavenlyStem.name);
  const dayBranchIdx = EARTHLY_BRANCHES.findIndex(b => b.name === fourPillars.day.earthlyBranch.name);

  // 현재 일주가 속한 旬의 시작 지지 인덱스
  const startBranch = ((dayBranchIdx - dayStemIdx) % 12 + 12) % 12;

  // 旬에서 빠진 2개 지지 (10개 사용 후 남은 2개)
  const void1Idx = (startBranch + 10) % 12;
  const void2Idx = (startBranch + 11) % 12;

  const void1 = EARTHLY_BRANCHES[void1Idx];
  const void2 = EARTHLY_BRANCHES[void2Idx];

  // 사주 내 다른 기둥에 공망 지지가 있는지 확인
  const affectedPillars: string[] = [];
  const pillarsToCheck: { name: string; pillar: string }[] = [
    { name: fourPillars.year.earthlyBranch.name, pillar: "year" },
    { name: fourPillars.month.earthlyBranch.name, pillar: "month" },
    // 일지는 기준이므로 제외
  ];
  if (fourPillars.hour) {
    pillarsToCheck.push({ name: fourPillars.hour.earthlyBranch.name, pillar: "hour" });
  }

  for (const p of pillarsToCheck) {
    if (p.name === void1.name || p.name === void2.name) {
      affectedPillars.push(p.pillar);
    }
  }

  return {
    voidBranches: [void1.hanja, void2.hanja],
    affectedPillars,
  };
}
