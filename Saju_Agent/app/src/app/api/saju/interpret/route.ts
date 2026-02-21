import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SajuResult, TeaserReading, FullReading } from "@/lib/saju/types";
import { ELEMENT_NAMES, ELEMENT_DESCRIPTIONS } from "@/lib/saju/mappings";

const interpretSchema = z.object({
  orderId: z.string(),
  type: z.enum(["teaser", "full"]),
  // 데모 모드: 클라이언트에서 sajuResult를 함께 전달
  sajuResult: z.any().optional(),
});

// 데모용 티저 생성
function generateDemoTeaser(result: SajuResult): TeaserReading {
  const el = result.dominantElement;
  const animal = result.zodiacAnimalKorean;
  const elName = ELEMENT_NAMES[el];
  const elDesc = ELEMENT_DESCRIPTIONS[el];

  const personalities: Record<string, string> = {
    wood: `${animal}띠에 ${elName}이 강한 당신은 창의적이고 성장 지향적인 사람이에요! 새로운 것을 시작하는 에너지가 넘치고, 주변 사람들에게 긍정적인 영향을 주는 리더형이죠.`,
    fire: `${animal}띠에 ${elName}가 강한 당신은 열정적이고 에너지가 넘치는 사람이에요! 어디서든 분위기를 밝히는 매력의 소유자이고, 하고 싶은 건 꼭 해내는 추진력이 있어요.`,
    earth: `${animal}띠에 ${elName}가 강한 당신은 든든하고 신뢰감을 주는 사람이에요! 차분하면서도 현실적인 판단력이 뛰어나고, 주변에서 늘 의지하는 존재랍니다.`,
    metal: `${animal}띠에 ${elName}이 강한 당신은 결단력 있고 정의로운 사람이에요! 원칙을 중시하면서도 세련된 감각을 지녔고, 한번 결심하면 끝까지 밀고 나가는 힘이 있어요.`,
    water: `${animal}띠에 ${elName}가 강한 당신은 지혜롭고 유연한 사람이에요! 상황에 맞게 적응하는 능력이 뛰어나고, 깊은 사고력으로 복잡한 문제도 척척 풀어내요.`,
  };

  return {
    personality: personalities[el] || `${animal}띠의 당신은 특별한 매력을 가진 사람이에요!`,
    elementInsight: `${elDesc} — ${elName}이 당신의 사주를 이끌고 있어요. 이 기운을 잘 활용하면 2026년에 좋은 기회가 찾아올 거예요!`,
  };
}

// 데모용 상세 풀이 생성
function generateDemoFullReading(result: SajuResult): FullReading {
  const el = result.dominantElement;
  const weak = result.weakestElement;
  const animal = result.zodiacAnimalKorean;
  const elName = ELEMENT_NAMES[el];
  const weakName = ELEMENT_NAMES[weak];
  const gender = result.input.gender === "female" ? "여성" : "남성";

  return {
    personality: {
      title: "성격과 기질",
      icon: "🦋",
      content: `${animal}띠 ${gender}인 당신의 일주를 보면, ${elName}의 기운이 강하게 자리잡고 있어요.\n\n기본적으로 ${el === "wood" ? "성장과 도전을 즐기는 타입" : el === "fire" ? "열정적이고 표현력이 풍부한 타입" : el === "earth" ? "안정적이고 신뢰감을 주는 타입" : el === "metal" ? "원칙적이고 결단력 있는 타입" : "직관적이고 적응력이 뛰어난 타입"}이에요. 새로운 환경에서도 자신만의 색깔을 잘 드러내는 편이고, 사람들과의 관계에서도 자연스러운 카리스마가 있어요.\n\n다만 ${weakName}의 기운이 약한 편이라, ${weak === "wood" ? "가끔 새로운 시작을 두려워하거나" : weak === "fire" ? "감정 표현이 서툴거나" : weak === "earth" ? "현실적인 판단이 흐려지거나" : weak === "metal" ? "결정을 미루거나" : "유연하게 대처하기 어려운"} 순간이 있을 수 있어요. 의식적으로 ${weakName}의 에너지를 보충하면 더 균형 잡힌 삶을 살 수 있답니다!`,
    },
    career: {
      title: "적성과 진로",
      icon: "💼",
      content: `${elName}이 강한 당신에게 잘 맞는 직업 분야를 알려줄게요!\n\n${el === "wood" ? "교육, 출판, 패션, 스타트업, 환경 관련 분야에서 빛을 발할 수 있어요. 창의력을 발휘할 수 있는 직종이 특히 좋아요." : el === "fire" ? "엔터테인먼트, 마케팅, 요식업, IT/테크, 미디어 분야가 잘 맞아요. 사람들 앞에 서거나 트렌드를 이끄는 일에 강해요." : el === "earth" ? "부동산, 금융, 컨설팅, 요리, 교육 분야에서 성과를 낼 수 있어요. 신뢰를 쌓아가는 직업이 특히 좋아요." : el === "metal" ? "법률, 금융, 보석/패션, 엔지니어링, 의료 분야에 강해요. 전문성을 깊이 파는 직업이 당신에게 딱이에요." : "예술, 물류/무역, 관광/호텔, 심리상담, 연구 분야가 잘 맞아요. 유연한 사고가 필요한 일에서 두각을 나타내요."}\n\n2026년에는 특히 ${el === "wood" ? "새 프로젝트를 시작하거나 이직" : el === "fire" ? "승진이나 사업 확장" : el === "earth" ? "안정적인 투자나 전문성 심화" : el === "metal" ? "리더십 발휘나 독립" : "해외 진출이나 새 분야 학습"}의 기회가 올 수 있어요!`,
    },
    love: {
      title: "대인관계와 연애",
      icon: "💕",
      content: `${animal}띠 ${gender}의 연애 스타일은 ${el === "wood" ? "성장을 함께할 수 있는 파트너" : el === "fire" ? "열정적이고 함께 모험하는 파트너" : el === "earth" ? "안정감과 신뢰를 주는 파트너" : el === "metal" ? "서로를 존중하는 성숙한 파트너" : "깊이 있는 대화가 통하는 파트너"}를 원하는 타입이에요.\n\n연애할 때 ${el === "wood" ? "상대방의 가능성을 보고 응원해주는 것" : el === "fire" ? "함께 새로운 경험을 만들어가는 것" : el === "earth" ? "일상적인 소소한 행복을 함께 나누는 것" : el === "metal" ? "서로의 공간을 존중하면서 깊은 유대를 쌓는 것" : "감정적으로 깊이 교감하는 것"}을 중요하게 생각해요.\n\n궁합이 잘 맞는 상대는 ${weak === "wood" ? "목(木)" : weak === "fire" ? "화(火)" : weak === "earth" ? "토(土)" : weak === "metal" ? "금(金)" : "수(水)"}의 기운이 강한 사람이에요. 당신의 부족한 부분을 채워줄 수 있거든요!`,
    },
    health: {
      title: "건강 포인트",
      icon: "🌿",
      content: `오행으로 보는 건강 포인트를 알려드릴게요!\n\n${elName}이 강한 당신은 ${el === "wood" ? "간, 담낭, 눈" : el === "fire" ? "심장, 소장, 혈관" : el === "earth" ? "위장, 비장, 소화기" : el === "metal" ? "폐, 대장, 피부" : "신장, 방광, 귀"}이 과도하게 활성화될 수 있어요. 과로하지 않도록 주의하세요.\n\n반면 ${weakName}이 약하니까 ${weak === "wood" ? "간 건강과 눈 관리" : weak === "fire" ? "심혈관 건강과 체온 유지" : weak === "earth" ? "소화기 관리와 규칙적인 식사" : weak === "metal" ? "호흡기 관리와 피부 보습" : "수분 섭취와 신장 관리"}에 신경 써주세요.\n\n추천 활동: ${el === "wood" ? "산책, 스트레칭, 명상" : el === "fire" ? "요가, 수영 (열 식히기)" : el === "earth" ? "규칙적인 운동, 명상" : el === "metal" ? "호흡 운동, 등산" : "따뜻한 목욕, 가벼운 조깅"}`,
    },
    fortune2026: {
      title: "2026년 운세",
      icon: "⭐",
      content: `2026년은 병오(丙午)년, 화(火)의 기운이 강한 해예요!\n\n${el === "fire" ? "당신의 주 기운과 같은 해라 에너지가 폭발적으로 높아져요! 하고 싶었던 일을 과감하게 시작하기 좋은 해예요." : el === "wood" ? "목(木)이 화(火)를 생하니, 당신의 노력이 결실을 맺는 해예요! 상반기에 시작한 일이 하반기에 빛을 발할 거예요." : el === "earth" ? "화(火)가 토(土)를 생하니, 안정적인 성장이 기대되는 해예요! 기존에 쌓아온 것들이 단단해지는 시기예요." : el === "metal" ? "화(火)가 금(金)을 극하니, 변화가 많은 해예요. 도전적인 상황이 올 수 있지만, 그 속에서 더 강해질 거예요." : "수(水)가 화(火)를 극하니, 당신이 주도권을 잡을 수 있는 해예요! 자신의 능력을 적극적으로 발휘하세요."}\n\n상반기 (1~6월): ${el === "fire" || el === "wood" ? "새로운 기회가 찾아옵니다. 적극적으로 움직이세요!" : "내면을 다지고 준비하는 시기. 조급해하지 마세요."}\n하반기 (7~12월): ${el === "earth" || el === "fire" ? "노력의 결실이 나타나요. 수확의 시기!" : "관계가 확장되는 시기. 좋은 인연을 만날 수 있어요."}`,
    },
    luckyElements: {
      color: el === "wood" ? "초록색, 연두색" : el === "fire" ? "빨간색, 보라색" : el === "earth" ? "노란색, 베이지색" : el === "metal" ? "흰색, 은색" : "검정색, 파란색",
      number: el === "wood" ? "3, 8" : el === "fire" ? "2, 7" : el === "earth" ? "5, 10" : el === "metal" ? "4, 9" : "1, 6",
      direction: el === "wood" ? "동쪽" : el === "fire" ? "남쪽" : el === "earth" ? "중앙" : el === "metal" ? "서쪽" : "북쪽",
      season: el === "wood" ? "봄 (3~5월)" : el === "fire" ? "여름 (6~8월)" : el === "earth" ? "환절기 (계절 사이)" : el === "metal" ? "가을 (9~11월)" : "겨울 (12~2월)",
    },
  };
}

// AI 호출 시도 (API키 있으면 사용, 없으면 데모)
async function getReading(type: "teaser" | "full", sajuResult: SajuResult) {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const { generateTeaserReading, generateFullReading } = await import("@/lib/ai/claude-client");
      if (type === "teaser") return await generateTeaserReading(sajuResult);
      return await generateFullReading(sajuResult);
    } catch (e) {
      console.error("[interpret] AI call failed, using demo:", e);
    }
  }

  // 데모 모드
  if (type === "teaser") return generateDemoTeaser(sajuResult);
  return generateDemoFullReading(sajuResult);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, sajuResult: clientResult } = interpretSchema.parse(body);

    let sajuResult: SajuResult | null = clientResult || null;

    // DB에서 가져오기 시도
    if (!sajuResult && process.env.DATABASE_URL) {
      try {
        const { getOrder } = await import("@/lib/db/queries");
        const order = await getOrder(body.orderId);
        if (order?.sajuResult) {
          sajuResult = order.sajuResult as unknown as SajuResult;
        }
      } catch {
        // DB 없으면 무시
      }
    }

    if (!sajuResult) {
      return NextResponse.json({ error: "사주 결과가 없습니다. 다시 시도해주세요." }, { status: 400 });
    }

    const reading = await getReading(type, sajuResult);

    // DB 캐싱 시도 (full만)
    if (type === "full" && process.env.DATABASE_URL) {
      try {
        const { updateOrderReading } = await import("@/lib/db/queries");
        await updateOrderReading(body.orderId, JSON.stringify(reading));
      } catch { /* 캐싱 실패는 무시 */ }
    }

    return NextResponse.json({ reading });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("[api/saju/interpret]", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
