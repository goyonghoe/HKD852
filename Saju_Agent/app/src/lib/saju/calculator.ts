import {
  FourPillars,
  Pillar,
  SajuInput,
  SajuResult,
} from "./types";
import {
  HEAVENLY_STEMS,
  EARTHLY_BRANCHES,
  HOUR_BRANCHES,
  getStemByIndex,
  getBranchByIndex,
} from "./mappings";
import {
  calculateElementDistribution,
  getDominantElement,
  getWeakestElement,
} from "./elements";

/**
 * 년주 계산 (Year Pillar)
 * 천간: (년도 - 4) % 10
 * 지지: (년도 - 4) % 12
 */
function getYearPillar(year: number): Pillar {
  const stemIndex = (year - 4) % 10;
  const branchIndex = (year - 4) % 12;
  return {
    heavenlyStem: getStemByIndex(stemIndex),
    earthlyBranch: getBranchByIndex(branchIndex),
  };
}

/**
 * 월주 계산 (Month Pillar)
 * 절기 기준 간소화: 양력 월 기반 근사치
 * 지지: 인월(1월)부터 시작, (월+1) % 12 + 2
 * 천간: 년간 × 2 + 월 조정
 */
function getMonthPillar(year: number, month: number): Pillar {
  // 월지: 1월=인(寅), 2월=묘(卯), ..., 12월=축(丑)
  const branchIndex = (month + 1) % 12;

  // 월간: 년간에 따른 월간 기둥
  const yearStemIndex = (year - 4) % 10;
  // 갑기(0,5)->병인, 을경(1,6)->무인, 병신(2,7)->경인, 정임(3,8)->임인, 무계(4,9)->갑인
  const monthStemBase = (yearStemIndex % 5) * 2 + 2;
  const stemIndex = (monthStemBase + month - 1) % 10;

  return {
    heavenlyStem: getStemByIndex(stemIndex),
    earthlyBranch: getBranchByIndex(branchIndex),
  };
}

/**
 * 일주 계산 (Day Pillar)
 * 기준일(2000-01-01 = 갑자일)로부터 경과일 계산
 */
function getDayPillar(year: number, month: number, day: number): Pillar {
  // 2000-01-01 is 甲子 (index 0 for both stem and branch, adjusted)
  // Actually 2000-01-01 is 甲辰(갑진) day
  // We use a known reference: 1900-01-01 = 庚子 (stem=6, branch=0) -> index 36 in 60-cycle
  const referenceDate = new Date(1900, 0, 1);
  const targetDate = new Date(year, month - 1, day);
  const diffDays = Math.floor(
    (targetDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // 1900-01-01 = 갑자(甲子) in 60甲子 cycle offset
  // Known: 1900-01-01 is sexagenary day 0 adjusted
  const baseStemIndex = 6; // 庚 = index 6
  const baseBranchIndex = 0; // 子 = index 0

  const stemIndex = (baseStemIndex + diffDays) % 10;
  const branchIndex = (baseBranchIndex + diffDays) % 12;

  return {
    heavenlyStem: getStemByIndex(stemIndex),
    earthlyBranch: getBranchByIndex(branchIndex),
  };
}

/**
 * 시주 계산 (Hour Pillar)
 */
function getHourPillar(
  dayStemIndex: number,
  hour: number
): Pillar {
  const hourStr = hour.toString().padStart(2, "0");
  const branchIndex = HOUR_BRANCHES[hourStr] ?? 0;

  // 시간 천간: 일간 × 2 + 시지 조정
  const hourStemBase = (dayStemIndex % 5) * 2;
  const stemIndex = (hourStemBase + branchIndex) % 10;

  return {
    heavenlyStem: getStemByIndex(stemIndex),
    earthlyBranch: getBranchByIndex(branchIndex),
  };
}

export function calculateSaju(input: SajuInput): SajuResult {
  const [yearStr, monthStr, dayStr] = input.birthDate.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  const yearPillar = getYearPillar(year);
  const monthPillar = getMonthPillar(year, month);
  const dayPillar = getDayPillar(year, month, day);

  let hourPillar: Pillar | null = null;
  if (input.birthTime) {
    const [hourStr] = input.birthTime.split(":");
    const hour = parseInt(hourStr, 10);
    const dayStemIndex = HEAVENLY_STEMS.indexOf(dayPillar.heavenlyStem);
    hourPillar = getHourPillar(dayStemIndex, hour);
  }

  const fourPillars: FourPillars = {
    year: yearPillar,
    month: monthPillar,
    day: dayPillar,
    hour: hourPillar,
  };

  const elementDistribution = calculateElementDistribution(fourPillars);
  const dominantElement = getDominantElement(elementDistribution);
  const weakestElement = getWeakestElement(elementDistribution);

  return {
    input,
    fourPillars,
    elementDistribution,
    dominantElement,
    weakestElement,
    zodiacAnimal: yearPillar.earthlyBranch.animal,
    zodiacAnimalKorean: yearPillar.earthlyBranch.animalKorean,
  };
}
