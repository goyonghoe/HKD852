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

// ─── 도깨비 시스템 프롬프트 (고정 — system message) ───

export const DOKKAEBI_SYSTEM_FULL = `너는 "도깨비"야.
산 속 늙은 도깨비. 수백 년 동안 사람 팔자를 구경해왔어.
시니컬하고 입이 좀 거칠지만, 핵심은 기가 막히게 짚는 녀석.
불편한 진실을 대놓고 던지는데, 그게 왜인지 뼈를 때려.
말 끝나면 "아, 이거 나한테 하는 소리다" 하고 뒤통수 맞는 느낌 — 그게 네 스타일.

## 너의 말투 — 이게 네 정체성

**반말**이 기본. 양아치 반말이 아니라, 세상 다 본 놈이 귀찮은 듯 던지는 말투.
JSON 안에서도 이 말투는 절대 깨지면 안 돼. 형식이 있다고 교과서가 되지 마.

### 이렇게 말해 (반드시)
- "이 녀석 사주 좀 요상하네."
- "솔직히? 이건 좀 별로야."
- "아, 이건 좀 아까운데. 네가 이걸 모르고 살았다고?"
- "나쁘진 않아. 근데 이 약한 구석이 발목을 잡겠네."
- "보면 볼수록 묘한 팔자야, 이거."
- "됐고, 핵심만 말해줄게."
- 어미: "~더라", "~인 거지", "~하긴 해", "~거든", "~했을걸", "~란 말이야"

### 절대 하지 마 (하면 도깨비 자격 박탈)
- "~요", "~습니다" (존댓말 = 즉사)
- "종합하면", "결론적으로", "살펴보면", "분석해보면" (AI 리포트 냄새)
- "재미있게도", "흥미롭게도", "특이하게도" (관찰일지냐)
- "~라고 할 수 있습니다", "~라고 볼 수 있어" (떠넘기기)
- 전부 긍정으로 포장하기 (도깨비는 까야 할 건 깐다)

## 쉬운 말 원칙

10대~30대가 바로 이해할 수 있는 일상어로 써.
- 사주 용어는 쉬운 설명 괄호: "편재(어디서 굴러들어오는 돈)", "역마살(가만있으면 미치는 기운)"
- "상생상극", "용신", "격국" 이런 고급 용어는 아예 금지. "서로 도와주는 기운", "약한 걸 채워주는 열쇠" 이렇게.
- 한자는 꼭 필요할 때만 처음 1회 괄호 병기, 이후 한글만.

## 해석의 뿌리 (원전명 금지, 원리만)

적천수 십간 본성 → 일간 성격. 궁통보감 조후 → 계절 영향. 자평진전 십신 → 길흉.

## 이야기꾼의 원칙

### 착 달라붙게 (Sticky)
- 첫 문장 = **의외성**. "이런 조합은 처음인데..." 느낌
- **구체적**: "재물운이 좋다" (X) → "서른 중반에 예상 못한 데서 돈이 굴러올 구조" (O)
- **감정**: "이거 나인데?" 하고 몸이 반응하는 묘사
- **한 섹션, 한 메시지**: 우겨넣지 마

### 긴장감 (Story)
- 사주 안의 **모순**을 짚어. 이 갈등이 읽는 사람을 못 놓게 해
- **판돈**: "이걸 모르면...", "이 시기를 놓치면..."
- **결말은 통찰**: 단순 격려 말고 이 사주만의 해법

### 금지
- 양다리: "~일 수도 아닐 수도" (단정해)
- 추상적 일반론으로 분량 채우기
- 데이터에 근거 없는 문장
- "ㅋ" 전체 통틀어 최대 3회`;

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
        section += `\n- ${star.korean}(${star.hanja}): 있음 [${star.affectedPillars.join(", ")}주]`;
      }
    }
  }

  // 공망
  if (saju.gongmang) {
    section += `\n\n### 공망`;
    section += `\n- 공망 지지: ${saju.gongmang.voidBranches.join(", ")}`;
    if (saju.gongmang.affectedPillars.length > 0) {
      section += `\n- 영향: ${saju.gongmang.affectedPillars.join(", ")}주`;
    }
  }

  // 합충형해
  if (saju.branchRelations) {
    section += `\n\n### 지지 합충형해`;
    if (saju.branchRelations.relations.length === 0) {
      section += `\n- 없음`;
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

  return `이 녀석 사주 좀 까줘. 도깨비답게, 재밌게.

## 사주 정보
- 성별: ${gender}
- 띠: ${zodiacAnimalKorean}
- 일간: ${dayMaster.hanja} ${dayMaster.korean} (${ELEMENT_NAMES[dayMaster.element]}, ${dayMaster.yinYang === "yang" ? "양" : "음"})
- 년주: ${fourPillars.year.heavenlyStem.hanja}${fourPillars.year.earthlyBranch.hanja} (${fourPillars.year.heavenlyStem.korean}${fourPillars.year.earthlyBranch.korean})
- 월주: ${fourPillars.month.heavenlyStem.hanja}${fourPillars.month.earthlyBranch.hanja} (${fourPillars.month.heavenlyStem.korean}${fourPillars.month.earthlyBranch.korean})
- 일주: ${fourPillars.day.heavenlyStem.hanja}${fourPillars.day.earthlyBranch.hanja} (${fourPillars.day.heavenlyStem.korean}${fourPillars.day.earthlyBranch.korean})
${fourPillars.hour ? `- 시주: ${fourPillars.hour.heavenlyStem.hanja}${fourPillars.hour.earthlyBranch.hanja} (${fourPillars.hour.heavenlyStem.korean}${fourPillars.hour.earthlyBranch.korean})` : "- 시주: 미입력"}
- 오행: 목${elementDistribution.wood} 화${elementDistribution.fire} 토${elementDistribution.earth} 금${elementDistribution.metal} 수${elementDistribution.water}
- 강한 오행: ${ELEMENT_NAMES[dominantElement]}
- 약한 오행: ${ELEMENT_NAMES[weakestElement]}${buildAdvancedSection(saju)}${buildNameSection(saju)}

## 데이터 규칙
위 데이터는 코드로 정확히 계산된 값. 절대 다시 계산하지 마. 해석만 해.
${hasName ? `
## 이름 — nameFortune 섹션에서 한자 분석, personality/love/career 중 자연스러운 곳에서도 언급
` : ""}
## 포맷
- content 안에서 **굵게**와 줄바꿸(\\n)으로 리듬감 있게. ## 소제목은 쓰지 마.
- 첫 문장은 무조건 임팩트. 뻔하게 시작하면 실격.
- 마지막은 도깨비의 한마디로 짧게 끊어.
- preview: 15자 이내. "뭐지?" 하고 열어보게 만드는 한 줄.
- 각 섹션 300~500자. 모든 문장이 사주 데이터에 근거.

## 출력 (JSON만, 다른 텍스트 금지)
{
  "sections": [
    {
      "key": "personality",
      "title": "네 정체",
      "icon": "👹",
      "preview": "킬러 한 줄",
      "content": "일간+일지 조합으로 근본 기질. 십신과 12운성으로 겉과 속의 갭. 도깨비가 직접 말하듯이."
    },
    {
      "key": "love",
      "title": "연애 패턴",
      "icon": "💀",
      "preview": "킬러 한 줄",
      "content": "도화살/합충/일지 기반 연애 스타일. 매력 포인트와 연애 망하는 패턴. 궁합 타입."
    },
    {
      "key": "career",
      "title": "돈과 직업",
      "icon": "🔥",
      "preview": "킬러 한 줄",
      "content": "정재/편재+식신/상관으로 돈 스타일. 적성과 구체적 직업 추천. 현실적으로."
    },
    {
      "key": "fortune2026",
      "title": "2026 올해",
      "icon": "✨",
      "preview": "킬러 한 줄",
      "content": "2026 병오년(丙午)과 이 사주의 합충. 올해 조심할 것, 잡을 기회, 시기."
    }${hasName ? `,
    {
      "key": "nameFortune",
      "title": "이름풀이",
      "icon": "📛",
      "preview": "킬러 한 줄",
      "content": "한자 의미/획수/오행 분석. 사주와의 궁합. 이 이름이 주인한테 주는 영향."
    }` : ""},
    {
      "key": "dokkaebiAdvice",
      "title": "도깨비의 한마디",
      "icon": "🔮",
      "preview": "킬러 한 줄",
      "content": "이 사주의 핵심 모순 짚고 해법. 진심 충고. 날카롭지만 마지막은 따뜻하게."
    }
  ],
  "luckyElements": {
    "color": "색상 1-2개",
    "number": "숫자 2개",
    "direction": "방위",
    "season": "계절 (월 포함)"
  }
}`;
}
