import { HeavenlyStem, EarthlyBranch, Element } from "./types";

export const HEAVENLY_STEMS: HeavenlyStem[] = [
  { name: "gap", hanja: "甲", korean: "갑", element: "wood", yinYang: "yang" },
  { name: "eul", hanja: "乙", korean: "을", element: "wood", yinYang: "yin" },
  { name: "byeong", hanja: "丙", korean: "병", element: "fire", yinYang: "yang" },
  { name: "jeong", hanja: "丁", korean: "정", element: "fire", yinYang: "yin" },
  { name: "mu", hanja: "戊", korean: "무", element: "earth", yinYang: "yang" },
  { name: "gi", hanja: "己", korean: "기", element: "earth", yinYang: "yin" },
  { name: "gyeong", hanja: "庚", korean: "경", element: "metal", yinYang: "yang" },
  { name: "sin", hanja: "辛", korean: "신", element: "metal", yinYang: "yin" },
  { name: "im", hanja: "壬", korean: "임", element: "water", yinYang: "yang" },
  { name: "gye", hanja: "癸", korean: "계", element: "water", yinYang: "yin" },
];

export const EARTHLY_BRANCHES: EarthlyBranch[] = [
  { name: "ja", hanja: "子", korean: "자", element: "water", yinYang: "yang", animal: "rat", animalKorean: "쥐" },
  { name: "chuk", hanja: "丑", korean: "축", element: "earth", yinYang: "yin", animal: "ox", animalKorean: "소" },
  { name: "in", hanja: "寅", korean: "인", element: "wood", yinYang: "yang", animal: "tiger", animalKorean: "호랑이" },
  { name: "myo", hanja: "卯", korean: "묘", element: "wood", yinYang: "yin", animal: "rabbit", animalKorean: "토끼" },
  { name: "jin", hanja: "辰", korean: "진", element: "earth", yinYang: "yang", animal: "dragon", animalKorean: "용" },
  { name: "sa", hanja: "巳", korean: "사", element: "fire", yinYang: "yin", animal: "snake", animalKorean: "뱀" },
  { name: "o", hanja: "午", korean: "오", element: "fire", yinYang: "yang", animal: "horse", animalKorean: "말" },
  { name: "mi", hanja: "未", korean: "미", element: "earth", yinYang: "yin", animal: "sheep", animalKorean: "양" },
  { name: "sin", hanja: "申", korean: "신", element: "metal", yinYang: "yang", animal: "monkey", animalKorean: "원숭이" },
  { name: "yu", hanja: "酉", korean: "유", element: "metal", yinYang: "yin", animal: "rooster", animalKorean: "닭" },
  { name: "sul", hanja: "戌", korean: "술", element: "earth", yinYang: "yang", animal: "dog", animalKorean: "개" },
  { name: "hae", hanja: "亥", korean: "해", element: "water", yinYang: "yin", animal: "pig", animalKorean: "돼지" },
];

export const ELEMENT_NAMES: Record<Element, string> = {
  wood: "목(木)",
  fire: "화(火)",
  earth: "토(土)",
  metal: "금(金)",
  water: "수(水)",
};

export const ELEMENT_COLORS: Record<Element, string> = {
  wood: "#4CAF50",
  fire: "#FF5252",
  earth: "#FFB74D",
  metal: "#B0BEC5",
  water: "#42A5F5",
};

export const ELEMENT_DESCRIPTIONS: Record<Element, string> = {
  wood: "성장과 창의력의 에너지",
  fire: "열정과 활력의 에너지",
  earth: "안정과 신뢰의 에너지",
  metal: "결단력과 정의의 에너지",
  water: "지혜와 유연함의 에너지",
};

export const HOUR_BRANCHES: Record<string, number> = {
  "23": 0, "00": 0,  // 자시
  "01": 1, "02": 1,  // 축시
  "03": 2, "04": 2,  // 인시
  "05": 3, "06": 3,  // 묘시
  "07": 4, "08": 4,  // 진시
  "09": 5, "10": 5,  // 사시
  "11": 6, "12": 6,  // 오시
  "13": 7, "14": 7,  // 미시
  "15": 8, "16": 8,  // 신시
  "17": 9, "18": 9,  // 유시
  "19": 10, "20": 10, // 술시
  "21": 11, "22": 11, // 해시
};

export function getStemByIndex(index: number): HeavenlyStem {
  return HEAVENLY_STEMS[((index % 10) + 10) % 10];
}

export function getBranchByIndex(index: number): EarthlyBranch {
  return EARTHLY_BRANCHES[((index % 12) + 12) % 12];
}
