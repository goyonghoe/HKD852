import { SajuResult } from "../../saju/types";
import { ELEMENT_NAMES } from "../../saju/mappings";

function buildNameSection(saju: SajuResult): string {
  const nameInfo = saju.input.nameInfo;
  if (!nameInfo) return "";

  let nameData = `\n\n## 이름 정보\n- 이름: ${nameInfo.koreanName} (${nameInfo.familyName} + ${nameInfo.givenNameSyllables.join(" + ")})`;

  if (nameInfo.selectedHanja && nameInfo.selectedHanja.length > 0) {
    const hanjaDetails = nameInfo.selectedHanja
      .map(h => `${h.hanja} (${h.meaning}, ${h.strokes}획)`)
      .join(", ");
    nameData += `\n- 한자: ${hanjaDetails}`;
    const totalStrokes = nameInfo.selectedHanja.reduce((sum, h) => sum + h.strokes, 0);
    nameData += `\n- 총 획수: ${totalStrokes}획`;
    const yinYangStrokes = nameInfo.selectedHanja.map(h => h.strokes % 2 === 0 ? "음" : "양").join(", ");
    nameData += `\n- 획수 음양: ${yinYangStrokes}`;
  } else {
    nameData += `\n- 한자: 미선택`;
  }

  return nameData;
}

// ─── 도깨비 시스템 프롬프트 (고정 — system message로 분리) ───

export const DOKKAEBI_SYSTEM_FULL = `너는 "도깨비"야.
수백 년 동안 인간 팔자를 구경해온 시니컬하고 입담 좋은 존재.
불편한 진실도 대놓고 말하지만, 결국은 사람 편인 녀석.

## 너의 말투

반말이 기본이야. 근데 싸구려가 아니라, 세상 다 본 놈의 여유가 묻어나는 반말.

이렇게 말해:
- "이 녀석, 요상하게도 이 조합이 딱 걸렸네."
- "나쁘진 않아. 근데 이 약한 구석이 좀 거슬려."
- "솔직히 이건 별로야. 고칠 수 있긴 한데, 네가 할지가 문제지."
- "쯤 되면 알겠지만, 이건 운이 아니라 네 선택이야."
- "~더라", "~인 거지", "~하긴 해", "~할라고"

이렇게 말하면 안 돼:
- "~요", "~습니다" (존댓말 절대 금지)
- "종합하면", "결론적으로", "~라고 할 수 있습니다" (AI 냄새)
- "재미있게도", "흥미롭게도" (교과서)
- 모든 게 긍정적인 풀이 (최소 3개 섹션은 날카로운 지적)

## 쉬운 말 원칙

10대~30대가 바로 이해할 수 있는 일상어만 써.
- 어려운 사주 용어는 반드시 쉬운 설명을 괄호에:
  "편재(어디서 굴러들어오는 돈)", "역마살(가만있으면 운이 썩는 기운)", "식신(먹고 즐기고 만드는 에너지)", "제왕(에너지 최고조, 무적 모드)"
- 한자는 최소한으로. 꼭 필요할 때만 처음 1회 병기하고 이후 한글만.
- "상생상극", "용신", "격국" 같은 고급 용어는 아예 쓰지 마. 대신 "서로 도와주는 기운", "약한 부분을 채워주는 열쇠" 이런 식으로.

## 해석의 뿌리 (직접 언급은 금지, 원리만 녹여)

너는 사주명리의 고전을 다 아는 도깨비야:
- 적천수(滴天髓) 십간 본성으로 일간의 근본 성격을 해석해
- 궁통보감(窮通寶鑑) 조후용신 원리로 태어난 계절과 오행의 관계를 반영해
- 자평진전(子平真詮) 십신 조합의 길흉을 근거로 재물/직업/관계를 풀어
- 원전 이름은 절대 직접 언급하지 마. 원리만 자연스럽게 녹여.

## 이야기꾼의 원칙 — 사주풀이는 이야기야

너는 수백 년 된 이야기꾼이야. 사주를 데이터 나열이 아니라 한 편의 이야기로 풀어.

### 착 달라붙게 만들어 (Sticky)
- 각 섹션 첫 문장은 **의외성**: 뻔한 분석 금지. 이 사주에서 가장 독특한 포인트부터 시작. "이런 조합은 처음인데..." 느낌
- **구체적으로 말해**: "재물운이 좋다" (X) → "서른 중반에 생각지 못한 데서 돈이 굴러올 구조" (O), "건강 주의" (X) → "술자리 다음 날 간이 비명 지르는 체질" (O)
- **감정이 달라붙는 표현**: 추상적 분석 말고, 읽는 사람이 "어 이거 나인데?" 하고 몸이 반응하는 묘사
- **단순하게**: 한 섹션에 핵심 메시지는 하나. 여러 가지를 우겨넣지 마.

### 이야기에 긴장감을 넣어 (Story)
- **내면의 갈등을 짚어**: 사주 안에는 반드시 모순이 있어. "성격은 앞으로 질주하는데 12운성은 쉬라고 해. 이 갈등이 네 테마" — 이 긴장감이 읽는 사람을 못 놓게 하는 힘이야
- **판돈을 높여**: "이걸 모르면", "이 시기를 놓치면" — 안 하면 뭘 잃는지 알려줘. 도깨비가 진지하게 경고하는 느낌
- **결말은 통찰로**: 마지막은 갈등에 대한 해답. 단순 격려가 아니라 이 사주만의 고유한 해법

### 절대 하지 마
- 양다리: "~일 수도 있고 아닐 수도" 이런 거 하지 마. 단정적으로 말해
- 추상적 일반론으로 분량 채우기
- 데이터에 근거하지 않은 문장
- "ㅋ"는 전체 섹션 통틀어 최대 6회. 남발하면 싸구려.`;

function buildAdvancedSection(saju: SajuResult): string {
  let section = "\n\n## 사주 상세 분석 데이터 (계산 완료 — 해석만 해)";

  // 십신
  if (saju.tenGods) {
    const tg = saju.tenGods;
    section += `\n\n### 십신`;
    section += `\n- 년간 → ${tg.positions.yearStem.korean}(${tg.positions.yearStem.hanja})`;
    section += `\n- 월간 → ${tg.positions.monthStem.korean}(${tg.positions.monthStem.hanja})`;
    section += `\n- 일간 = 본인 (일주)`;
    if (tg.positions.hourStem) {
      section += `\n- 시간 → ${tg.positions.hourStem.korean}(${tg.positions.hourStem.hanja})`;
    }
    // 지장간
    section += `\n- 년지 지장간: ${tg.hiddenStems.yearBranch.map(g => g.korean).join(", ")}`;
    section += `\n- 월지 지장간: ${tg.hiddenStems.monthBranch.map(g => g.korean).join(", ")}`;
    section += `\n- 일지 지장간: ${tg.hiddenStems.dayBranch.map(g => g.korean).join(", ")}`;
    if (tg.hiddenStems.hourBranch) {
      section += `\n- 시지 지장간: ${tg.hiddenStems.hourBranch.map(g => g.korean).join(", ")}`;
    }
    section += `\n- 주요 십신: ${tg.summary.dominant} (${tg.summary.dominantCount}개)`;
    section += `\n- 보유 십신: ${tg.summary.present.join(", ")}`;
  }

  // 신살
  if (saju.specialStars) {
    section += `\n\n### 신살`;
    for (const star of saju.specialStars.stars) {
      if (star.present) {
        section += `\n- ${star.korean}(${star.hanja}): 있음 [${star.affectedPillars.join(", ")}주에서 발현]`;
      } else {
        section += `\n- ${star.korean}: 없음`;
      }
    }
  }

  // 공망
  if (saju.gongmang) {
    section += `\n\n### 공망`;
    section += `\n- 공망 지지: ${saju.gongmang.voidBranches.join(", ")}`;
    if (saju.gongmang.affectedPillars.length > 0) {
      section += `\n- 영향: ${saju.gongmang.affectedPillars.join(", ")}주가 공망에 해당`;
    } else {
      section += `\n- 사주 내 공망 해당 없음`;
    }
  }

  // 합충형해
  if (saju.branchRelations) {
    section += `\n\n### 지지 합충형해`;
    if (saju.branchRelations.relations.length === 0) {
      section += `\n- 특별한 합충형해 없음`;
    }
    for (const rel of saju.branchRelations.relations) {
      section += `\n- ${rel.korean}(${rel.hanja}): ${rel.pillars[0]}지-${rel.pillars[1]}지 (${rel.branches.join("")})`;
    }
  }

  // 12운성
  if (saju.twelveStages) {
    section += `\n\n### 12운성`;
    const st = saju.twelveStages.stages;
    section += `\n- 년지: ${st.year.korean}(${st.year.hanja})`;
    section += `\n- 월지: ${st.month.korean}(${st.month.hanja})`;
    section += `\n- 일지: ${st.day.korean}(${st.day.hanja})`;
    if (st.hour) {
      section += `\n- 시지: ${st.hour.korean}(${st.hour.hanja})`;
    }
  }

  return section;
}

export function buildFullReadingPrompt(saju: SajuResult): string {
  const { fourPillars, elementDistribution, dominantElement, weakestElement, zodiacAnimalKorean } = saju;
  const gender = saju.input.gender === "male" ? "남자" : "여자";
  const dayMaster = fourPillars.day.heavenlyStem;
  const hasName = !!saju.input.nameInfo;

  return `아래 사주를 풀어줘. 도깨비답게.

## 사주 정보
- 성별: ${gender}
- 띠: ${zodiacAnimalKorean}
- 일간(나를 대표하는 기운): ${dayMaster.hanja} ${dayMaster.korean} (${ELEMENT_NAMES[dayMaster.element]}, ${dayMaster.yinYang === "yang" ? "양" : "음"})
- 년주: ${fourPillars.year.heavenlyStem.hanja}${fourPillars.year.earthlyBranch.hanja} (${fourPillars.year.heavenlyStem.korean}${fourPillars.year.earthlyBranch.korean})
- 월주: ${fourPillars.month.heavenlyStem.hanja}${fourPillars.month.earthlyBranch.hanja} (${fourPillars.month.heavenlyStem.korean}${fourPillars.month.earthlyBranch.korean})
- 일주: ${fourPillars.day.heavenlyStem.hanja}${fourPillars.day.earthlyBranch.hanja} (${fourPillars.day.heavenlyStem.korean}${fourPillars.day.earthlyBranch.korean})
${fourPillars.hour ? `- 시주: ${fourPillars.hour.heavenlyStem.hanja}${fourPillars.hour.earthlyBranch.hanja} (${fourPillars.hour.heavenlyStem.korean}${fourPillars.hour.earthlyBranch.korean})` : "- 시주: 미입력"}
- 오행: 목${elementDistribution.wood} 화${elementDistribution.fire} 토${elementDistribution.earth} 금${elementDistribution.metal} 수${elementDistribution.water}
- 강한 오행: ${ELEMENT_NAMES[dominantElement]}
- 약한 오행: ${ELEMENT_NAMES[weakestElement]}${buildAdvancedSection(saju)}${buildNameSection(saju)}

## 중요 — 데이터 사용 규칙
위 "사주 상세 분석 데이터"는 코드로 정확히 계산된 값이야. 절대 다시 계산하지 마.
이 데이터를 기반으로 해석만 해. 십신, 신살, 공망, 합충형해, 12운성 값은 주어진 그대로 사용해.
${hasName ? `
## 이름풀이 통합 (이름 입력됨 — 반드시 따라)

### nameFortune 섹션 (독립 분석)
- 각 한자의 뜻과 획수를 분석. 획수의 음양(홀수=양, 짝수=음) 파악
- 한자의 오행을 추론하고, 사주 오행과의 관계를 분석
- 한자 미선택이면 한글 음절의 음가로 추론

### 다른 섹션에서 이름 자연스럽게 엮기 (1-2문장씩)
- personality, wealth, career, love 중 자연스러운 곳에서 언급
- dokkaebiAdvice에 이름 포함해서 종합 조언
- 억지로 끼워넣지 말고 자연스러운 경우에만. 최소 3개 섹션에서 언급.
` : ""}
## 포맷 규칙
- 각 섹션의 content에서 **굵게 강조**와 ## 소제목을 사용해.
- 각 섹션은 250~400자. 모든 문장이 사주 데이터에 근거한 구체적 해석.
- preview는 도깨비 입담으로 15자 이내 핵심 키워드.
- 구조: **핵심 한 줄 (도깨비 입담)** → ## 소제목별 3-5문장 → 도깨비의 한마디
- 마지막 문장은 "도깨비의 한마디" 느낌으로 짧고 인상적이게.

## 출력 (JSON만)
{
  "sections": [
    {
      "key": "personality",
      "title": "타고난 성격",
      "icon": "👹",
      "preview": "15자 이내 핵심",
      "content": "**일주 핵심 한 줄 (도깨비 입담)**\\n\\n## 일주 분석\\n일간+일지 조합 해석, 12운성(일지) 의미. 이 사주의 근본적 기질 (3-4문장)\\n\\n## 십신으로 본 나\\n주요 십신 해석. 지장간까지 포함한 깊은 분석 (3-4문장)\\n\\n## 숨은 면모\\n약점, 공망/충 영향, 이면의 성격 (2-3문장)"
    },
    {
      "key": "wealth",
      "title": "재물운",
      "icon": "💰",
      "preview": "15자 이내",
      "content": "**재물 핵심 (도깨비식)**\\n\\n## 정재·편재 분석\\n사주 내 정재/편재 십신 기반, 돈 버는 스타일 (3-4문장)\\n\\n## 합충이 재물에 미치는 영향\\n지지 관계가 재물 흐름에 주는 영향 (2-3문장)\\n\\n## 주의할 점\\n재물 리스크, 공망 영향 (2문장)"
    },
    {
      "key": "career",
      "title": "직업·적성",
      "icon": "🔥",
      "preview": "15자 이내",
      "content": "**적성 핵심**\\n\\n## 식신·상관으로 본 능력\\n십신 기반 적성 분석, 구체 직업 4-5개 (3-4문장)\\n\\n## 12운성으로 본 커리어 에너지\\n일지/월지 12운성 기반 직업 에너지 분석 (2-3문장)\\n\\n## 2026년 커리어\\n올해 기회와 주의점 (2문장)"
    },
    {
      "key": "love",
      "title": "연애·결혼운",
      "icon": "💀",
      "preview": "15자 이내",
      "content": "**연애 스타일 (시니컬하게)**\\n\\n## 도화살 분석\\n도화살 유무와 매력 포인트, 이성 인연 패턴 (3-4문장)\\n\\n## 합으로 본 궁합\\n지지 합 관계가 연애에 미치는 영향 (2-3문장)\\n\\n## 결혼운\\n궁합 타입, 주의할 관계 패턴 (2-3문장)"
    },
    {
      "key": "relationships",
      "title": "대인관계",
      "icon": "🤝",
      "preview": "15자 이내",
      "content": "**관계 핵심**\\n\\n## 비겁·인성으로 본 사회성\\n십신 기반 대인관계 패턴 (3-4문장)\\n\\n## 형·해 분석\\n지지 형해 관계가 인간관계에 주는 영향 (2-3문장)\\n\\n## 조심할 관계\\n주의 인간관계 타입 (2문장)"
    },
    {
      "key": "health",
      "title": "건강 주의보",
      "icon": "⚡",
      "preview": "15자 이내",
      "content": "**건강 핵심**\\n\\n## 오행 과불급 분석\\n강한/약한 오행이 신체에 미치는 영향 (3-4문장)\\n\\n## 12운성 체력 분석\\n일지 12운성 기반 체력/에너지 상태 (2-3문장)\\n\\n## 보충법\\n실천 가능한 건강 조언 (2문장)"
    },
    {
      "key": "fortune2026",
      "title": "2026 올해운",
      "icon": "✨",
      "preview": "15자 이내",
      "content": "**올해 키워드 (도깨비식)**\\n\\n## 2026 병오년과 사주\\n세운 천간지지와 사주의 합충 분석 (3-4문장)\\n\\n## 상반기 (1~6월)\\n세운 흐름, 신살 발동 시기 (2-3문장)\\n\\n## 하반기 (7~12월)\\n흐름 변화, 주의/기회 시기 (2-3문장)"
    },
    {
      "key": "travel",
      "title": "역마·변화운",
      "icon": "🌀",
      "preview": "15자 이내",
      "content": "**변화 핵심**\\n\\n## 역마살 분석\\n역마살 유무와 이동·이직 기운 구체 해석 (3-4문장)\\n\\n## 공망 분석\\n공망에 해당하는 기둥과 그 의미 (2-3문장)\\n\\n## 충 관계가 만드는 변동\\n지지 충이 삶에 가져오는 변화 (2문장)"
    },
    {
      "key": "talent",
      "title": "숨겨진 재능",
      "icon": "🎭",
      "preview": "15자 이내",
      "content": "**재능 핵심**\\n\\n## 화개살·편인으로 본 잠재력\\n화개살(학문/예술 재능) + 편인/식신 조합 분석 (3-4문장)\\n\\n## 지장간 속 숨은 능력\\n지장간 십신에서 발견되는 잠재 능력 (2-3문장)\\n\\n## 이걸 살려봐\\n구체적 분야와 실천 제안 (2문장)"
    }${hasName ? `,
    {
      "key": "nameFortune",
      "title": "이름풀이",
      "icon": "📛",
      "preview": "15자 이내",
      "content": "**이름에 담긴 운명 한 줄**\\n\\n## 한자 해석\\n각 글자의 의미·획수·음양·오행 분석 (3-4문장)\\n\\n## 사주와의 궁합\\n이름의 오행이 사주를 보완/충돌하는지 (2-3문장)\\n\\n## 도깨비의 이름 평\\n이 이름이 주인한테 주는 영향 (2문장)"
    }` : ""},
    {
      "key": "dokkaebiAdvice",
      "title": "도깨비 한마디",
      "icon": "🔮",
      "preview": "15자 이내",
      "content": "**네 팔자 한마디로 정리하면...**\\n\\n## 사주 종합\\n12운성 흐름 + 합충 관계 + 십신 종합으로 본 인생 테마 (3-4문장)\\n\\n## 도깨비의 충고\\n가장 중요한 조언. 신살과 공망을 고려한 핵심 메시지. 이건 진심으로. (2-3문장)"
    }
  ],
  "luckyElements": {
    "color": "색상 1-2개",
    "number": "숫자 2개",
    "direction": "방위 1개",
    "season": "계절 (월 포함)"
  }
}`;
}
