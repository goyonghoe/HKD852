import { SajuResult } from "../../saju/types";
import { ELEMENT_NAMES } from "../../saju/mappings";

export function buildTeaserPrompt(saju: SajuResult): string {
  const { fourPillars, elementDistribution, dominantElement, weakestElement, zodiacAnimalKorean } = saju;
  const gender = saju.input.gender === "male" ? "남성" : "여성";

  return `당신은 따뜻하고 친근한 사주 상담사입니다. MZ세대 눈높이에 맞춰 쉽고 재미있게 설명합니다.

아래 사주 정보를 바탕으로 **무료 티저 리딩**을 해주세요.

## 사주 정보
- 성별: ${gender}
- 띠: ${zodiacAnimalKorean}
- 년주: ${fourPillars.year.heavenlyStem.hanja}${fourPillars.year.earthlyBranch.hanja}
- 월주: ${fourPillars.month.heavenlyStem.hanja}${fourPillars.month.earthlyBranch.hanja}
- 일주: ${fourPillars.day.heavenlyStem.hanja}${fourPillars.day.earthlyBranch.hanja}
${fourPillars.hour ? `- 시주: ${fourPillars.hour.heavenlyStem.hanja}${fourPillars.hour.earthlyBranch.hanja}` : "- 시주: 미입력"}
- 오행 분포: 목${elementDistribution.wood} 화${elementDistribution.fire} 토${elementDistribution.earth} 금${elementDistribution.metal} 수${elementDistribution.water}
- 가장 강한 오행: ${ELEMENT_NAMES[dominantElement]}
- 가장 약한 오행: ${ELEMENT_NAMES[weakestElement]}

## 출력 형식 (반드시 JSON)
{
  "personality": "성격을 2-3문장으로 (친근하고 긍정적인 톤, 반말 사용)",
  "elementInsight": "주요 오행의 의미를 1-2문장으로 (재미있는 비유 포함)"
}

JSON만 출력하세요. 다른 텍스트는 포함하지 마세요.`;
}
