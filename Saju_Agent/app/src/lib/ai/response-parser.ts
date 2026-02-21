import { TeaserReading, FullReading } from "../saju/types";

function extractJSON(text: string): string {
  // Try to find JSON in the response (handle markdown code blocks)
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) return jsonMatch[1].trim();

  // Try to find raw JSON object
  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch) return objectMatch[0];

  return text;
}

export function parseTeaserResponse(text: string): TeaserReading {
  try {
    const json = JSON.parse(extractJSON(text));
    return {
      personality: json.personality || "당신은 독특한 매력을 가진 사람이에요!",
      elementInsight: json.elementInsight || "오행의 조화가 특별한 에너지를 만들고 있어요.",
    };
  } catch {
    return {
      personality: "당신은 독특한 매력을 가진 사람이에요! 자세한 분석은 상세 풀이에서 확인해보세요.",
      elementInsight: "오행의 조화가 특별한 에너지를 만들고 있어요.",
    };
  }
}

const DEFAULT_FULL_READING: FullReading = {
  personality: {
    title: "성격과 기질",
    icon: "sparkles",
    content: "분석 결과를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
  },
  career: {
    title: "적성과 진로",
    icon: "briefcase",
    content: "분석 결과를 불러오는 중 문제가 발생했습니다.",
  },
  love: {
    title: "대인관계와 연애",
    icon: "heart",
    content: "분석 결과를 불러오는 중 문제가 발생했습니다.",
  },
  health: {
    title: "건강 포인트",
    icon: "leaf",
    content: "분석 결과를 불러오는 중 문제가 발생했습니다.",
  },
  fortune2026: {
    title: "2026년 운세",
    icon: "star",
    content: "분석 결과를 불러오는 중 문제가 발생했습니다.",
  },
  luckyElements: {
    color: "-",
    number: "-",
    direction: "-",
    season: "-",
  },
};

export function parseFullReadingResponse(text: string): FullReading {
  try {
    const json = JSON.parse(extractJSON(text));
    return {
      personality: json.personality || DEFAULT_FULL_READING.personality,
      career: json.career || DEFAULT_FULL_READING.career,
      love: json.love || DEFAULT_FULL_READING.love,
      health: json.health || DEFAULT_FULL_READING.health,
      fortune2026: json.fortune2026 || DEFAULT_FULL_READING.fortune2026,
      luckyElements: json.luckyElements || DEFAULT_FULL_READING.luckyElements,
    };
  } catch {
    return DEFAULT_FULL_READING;
  }
}
