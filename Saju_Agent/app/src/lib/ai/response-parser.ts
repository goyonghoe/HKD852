import { TeaserReading, FullReading, FullReadingSection, ReadingSectionKey, FullReadingV1 } from "../saju/types";

function extractJSON(text: string): string {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) return jsonMatch[1].trim();

  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch) return objectMatch[0];

  return text;
}

export function parseTeaserResponse(text: string): TeaserReading {
  try {
    const json = JSON.parse(extractJSON(text));
    return {
      personality: json.personality || "으음... 뭔가 숨겨진 게 많은 녀석이네. 좀 더 들여다봐야겠어.",
      elementInsight: json.elementInsight || "오행이 요상하게 섞여 있어. 자세한 건 까봐야 알지, 뭐.",
      ...(json.nameHint ? { nameHint: json.nameHint } : {}),
    };
  } catch {
    return {
      personality: "으음... 뭔가 숨겨진 게 많은 녀석이네. 좀 더 들여다봐야겠어.",
      elementInsight: "오행이 요상하게 섞여 있어. 자세한 건 까봐야 알지, 뭐.",
    };
  }
}

// v2: 5 섹션 기본 (personality, love, career, fortune2026, dokkaebiAdvice)
const SECTION_KEYS: ReadingSectionKey[] = [
  "personality", "love", "career", "fortune2026", "dokkaebiAdvice",
];

const DEFAULT_SECTIONS: FullReadingSection[] = [
  { key: "personality", title: "네 정체", icon: "👹", content: "도깨비가 잠깐 졸았어. 다시 해봐.", preview: "잠시 대기" },
  { key: "love", title: "연애 패턴", icon: "💀", content: "도깨비가 잠깐 졸았어. 다시 해봐.", preview: "잠시 대기" },
  { key: "career", title: "돈과 직업", icon: "🔥", content: "도깨비가 잠깐 졸았어. 다시 해봐.", preview: "잠시 대기" },
  { key: "fortune2026", title: "2026 올해", icon: "✨", content: "도깨비가 잠깐 졸았어. 다시 해봐.", preview: "잠시 대기" },
  { key: "dokkaebiAdvice", title: "도깨비의 한마디", icon: "🔮", content: "도깨비가 잠깐 졸았어. 다시 해봐.", preview: "잠시 대기" },
];

const DEFAULT_LUCKY = { color: "-", number: "-", direction: "-", season: "-" };

const DEFAULT_FULL_READING: FullReading = {
  sections: DEFAULT_SECTIONS,
  luckyElements: DEFAULT_LUCKY,
};

function migrateV1ToV2(v1: FullReadingV1): FullReading {
  const sections: FullReadingSection[] = [
    { key: "personality", ...v1.personality, preview: "" },
    { key: "career", ...v1.career, preview: "" },
    { key: "love", ...v1.love, preview: "" },
    { key: "health", ...v1.health, preview: "" },
    { key: "fortune2026", ...v1.fortune2026, preview: "" },
  ];
  return { sections, luckyElements: v1.luckyElements };
}

export function parseFullReadingResponse(text: string): FullReading {
  try {
    const json = JSON.parse(extractJSON(text));

    // V2 (배열 기반)
    if (json.sections && Array.isArray(json.sections)) {
      const sections = SECTION_KEYS.map(key => {
        const found = json.sections.find((s: FullReadingSection) => s.key === key);
        return found || DEFAULT_SECTIONS.find(d => d.key === key)!;
      });
      // nameFortune은 이름 입력 시에만 포함 (optional)
      const nameFortune = json.sections.find((s: FullReadingSection) => s.key === "nameFortune");
      if (nameFortune) {
        const adviceIdx = sections.findIndex(s => s.key === "dokkaebiAdvice");
        if (adviceIdx >= 0) {
          sections.splice(adviceIdx, 0, nameFortune);
        } else {
          sections.push(nameFortune);
        }
      }
      return {
        sections,
        luckyElements: json.luckyElements || DEFAULT_LUCKY,
      };
    }

    // V1 (이름 필드) → 자동 마이그레이션
    if (json.personality) {
      return migrateV1ToV2(json as FullReadingV1);
    }

    return DEFAULT_FULL_READING;
  } catch {
    return DEFAULT_FULL_READING;
  }
}
