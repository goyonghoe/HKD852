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
import { getJulianDayNumber } from "./manseryeok";
import {
  calculateElementDistribution,
  getDominantElement,
  getWeakestElement,
} from "./elements";
import { calculateTenGods } from "./ten-gods";
import { calculateSpecialStars } from "./special-stars";
import { calculateGongmang } from "./void-emptiness";
import { calculateBranchRelations } from "./branch-relations";
import { calculateTwelveStages } from "./twelve-stages";

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

// 절입일 근사값 — 각 사주 월의 시작 [양력월, 일]
// 인월(1)=입춘~, 묘월(2)=경칩~, ..., 축월(12)=소한~
const JEOLGI_BOUNDARIES: [number, number, number][] = [
  // [gregorian_month, boundary_day, sajuMonth]
  [12, 7, 11],  // 자월 시작: 대설
  [11, 7, 10],  // 해월 시작: 입동
  [10, 8, 9],   // 술월 시작: 한로
  [9, 8, 8],    // 유월 시작: 백로
  [8, 8, 7],    // 신월 시작: 입추
  [7, 7, 6],    // 미월 시작: 소서
  [6, 6, 5],    // 오월 시작: 망종
  [5, 6, 4],    // 사월 시작: 입하
  [4, 5, 3],    // 진월 시작: 청명
  [3, 6, 2],    // 묘월 시작: 경칩
  [2, 4, 1],    // 인월 시작: 입춘
  [1, 6, 12],   // 축월 시작: 소한
];

/** 양력 날짜 → 사주 월 번호 (1=인월 ~ 12=축월) */
function getSajuMonth(month: number, day: number): number {
  for (const [bMonth, bDay, sajuMonth] of JEOLGI_BOUNDARIES) {
    if (month > bMonth || (month === bMonth && day >= bDay)) {
      return sajuMonth;
    }
  }
  // 1월 1~5일: 대설 이후 소한 이전 = 자월(11)
  return 11;
}

/** 입춘 기준 사주 년도 */
function getSajuYear(year: number, month: number, day: number): number {
  if (month < 2 || (month === 2 && day < 4)) {
    return year - 1;
  }
  return year;
}

/**
 * 월주 계산 (Month Pillar)
 * 절기 근사 기준: 입춘(~2/4)=인월, 경칩(~3/6)=묘월, ...
 */
function getMonthPillar(year: number, month: number, day: number): Pillar {
  const sajuMonth = getSajuMonth(month, day);
  const sajuYear = getSajuYear(year, month, day);

  // 월지: 인월(sajuMonth=1)→寅(index 2), ..., 축월(12)→丑(1)
  const branchIndex = (sajuMonth + 1) % 12;

  // 월간: 년간 기준
  const yearStemIndex = (sajuYear - 4) % 10;
  const monthStemBase = (yearStemIndex % 5) * 2 + 2;
  const stemIndex = (monthStemBase + sajuMonth - 1) % 10;

  return {
    heavenlyStem: getStemByIndex(stemIndex),
    earthlyBranch: getBranchByIndex(branchIndex),
  };
}

/**
 * 일주 계산 (Day Pillar) — 만세력(萬歲曆) 기반
 *
 * Julian Day Number(JDN)를 이용한 천문학적 정확 계산.
 * 기존 Date 객체 기반 diffDays 방식은 기준일 오류 + DST 문제로 폐기.
 *
 * 검증:
 * - 1988-02-17 → 壬寅(임인) ✓
 * - 2000-01-01 → 戊午(무오) ✓
 * - 2000-01-07 → 甲子(갑자) ✓
 */
function getDayPillar(year: number, month: number, day: number): Pillar {
  const jdn = getJulianDayNumber(year, month, day);
  const stemIndex = (jdn + 9) % 10;   // 0=甲 ~ 9=癸
  const branchIndex = (jdn + 1) % 12;  // 0=子 ~ 11=亥

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

  // 절기 기준: 입춘(~2/4) 전은 전년도
  const sajuYear = getSajuYear(year, month, day);
  const yearPillar = getYearPillar(sajuYear);
  const monthPillar = getMonthPillar(year, month, day);
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
  const dayMasterElement = dayPillar.heavenlyStem.element;
  const dominantElement = getDominantElement(elementDistribution, dayMasterElement);
  const weakestElement = getWeakestElement(elementDistribution, dayMasterElement);

  // Advanced calculations
  const tenGods = calculateTenGods(fourPillars);
  const specialStars = calculateSpecialStars(fourPillars);
  const gongmang = calculateGongmang(fourPillars);
  const branchRelations = calculateBranchRelations(fourPillars);
  const twelveStages = calculateTwelveStages(fourPillars);

  return {
    input,
    fourPillars,
    elementDistribution,
    dominantElement,
    weakestElement,
    zodiacAnimal: yearPillar.earthlyBranch.animal,
    zodiacAnimalKorean: yearPillar.earthlyBranch.animalKorean,
    tenGods,
    specialStars,
    gongmang,
    branchRelations,
    twelveStages,
  };
}
