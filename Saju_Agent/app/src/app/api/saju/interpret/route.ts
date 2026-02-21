import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SajuResult, TeaserReading, FullReading, FullReadingSection } from "@/lib/saju/types";
import { ELEMENT_NAMES } from "@/lib/saju/mappings";

const interpretSchema = z.object({
  orderId: z.string(),
  type: z.enum(["teaser", "full"]),
  sajuResult: z.any().optional(),
});

// ─── 적천수 십간 본성 (데모용) ───
const STEM_IMAGES: Record<string, { nature: string; metaphor: string; tension: string }> = {
  gap: { nature: "큰 나무", metaphor: "하늘을 뚫고 올라가는 대목", tension: "곧은 만큼 유연함이 부족해" },
  eul: { nature: "덩굴", metaphor: "부드럽지만 절대 꺾이지 않는 질김", tension: "방향이 없으면 맥없이 늘어져" },
  byeong: { nature: "태양", metaphor: "만물을 비추는 존재감", tension: "구름 없으면 혼자 타다 꺼져" },
  jeong: { nature: "촛불", metaphor: "어둠 속 한 점 빛의 집중력", tension: "바람(충)에 약해서 보호가 필요해" },
  mu: { nature: "큰 산", metaphor: "묵직한 신뢰감과 포용력", tension: "물 없으면 메마른 황무지가 돼" },
  gi: { nature: "옥토", metaphor: "만물을 키우는 비옥한 밭", tension: "너무 젖으면 진흙탕이 되더라" },
  gyeong: { nature: "원석", metaphor: "거칠지만 단단한 칼의 기질", tension: "불에 달궈져야 진짜 명검이 돼" },
  sin: { nature: "보석", metaphor: "작지만 빛나는 완벽주의", tension: "흙에 묻히면 광채를 잃어" },
  im: { nature: "큰 강", metaphor: "넓게 흐르는 지혜와 포용", tension: "둑 없으면 범람해서 방향을 잃어" },
  gye: { nature: "이슬", metaphor: "약하지만 어디든 스며드는 침투력", tension: "태양 없으면 차갑게 얼어붙어" },
};

// ─── 궁통보감 계절 맥락 (데모용) ───
function getDemoSeasonContext(dayElement: string, monthBranch: string): string {
  const spring = ["in", "myo", "jin"];
  const summer = ["sa", "o", "mi"];
  const autumn = ["sin", "yu", "sul"];

  const isSpring = spring.includes(monthBranch);
  const isSummer = summer.includes(monthBranch);
  const isAutumn = autumn.includes(monthBranch);
  const isWinter = !isSpring && !isSummer && !isAutumn;

  if (isSpring) {
    return { wood: "봄에 기세가 넘치지만 다듬어야 쓸모 있는 시기", fire: "봄에 불이 살아나는 좋은 시기", earth: "나무가 땅을 파고드는 시기라 기반이 흔들려", metal: "봄에 약해지는 시기라 보강 필요", water: "봄에 기운이 빠져나가는 시기" }[dayElement] || "";
  } else if (isSummer) {
    return { wood: "뜨거워서 물 없으면 타버리는 시기", fire: "에너지 폭주 상태라 제어가 핵심", earth: "열기가 땅을 굳히는 시기라 기반이 단단해져", metal: "열기에 녹을 수 있는 시기", water: "증발 위기라 수원 보충이 급한 시기" }[dayElement] || "";
  } else if (isAutumn) {
    return { wood: "날카로운 기운에 잘릴 수 있는 시기", fire: "꺼지기 직전이라 연료가 급한 시기", earth: "에너지가 빠져나가는 시기", metal: "에너지 극강이라 다듬기가 핵심", water: "기운이 불어나는 시기라 방향 잡기가 중요" }[dayElement] || "";
  } else {
    return { wood: "얼어붙어서 태양 없이는 성장 불가", fire: "극한 속 불씨, 연료 없으면 꺼짐", earth: "얼어붙은 땅, 불로 녹여야 살아남", metal: "차갑게 빛나지만 불에 달궈야 쓸모 있음", water: "범람 위기라 둑과 온기가 필수" }[dayElement] || "";
  }
}

// 도깨비 데모 티저 — 짧고 궁금증 유발 + 계산 데이터 힌트
function generateDemoTeaser(result: SajuResult): TeaserReading {
  const el = result.dominantElement;
  const animal = result.zodiacAnimalKorean;
  const elName = ELEMENT_NAMES[el];
  const dominantGod = result.tenGods?.summary.dominant || "비견";
  const hasYeokma = result.specialStars?.stars.find(s => s.key === "yeokma")?.present;
  const hasDohwa = result.specialStars?.stars.find(s => s.key === "dohwa")?.present;

  // 적천수 본성 기반 성격 묘사
  const dayMaster = result.fourPillars.day.heavenlyStem;
  const stemImage = STEM_IMAGES[dayMaster.name] || { nature: "독특한 기운", metaphor: "예사롭지 않은 구조", tension: "양면이 있어" };

  const personalities: Record<string, string> = {
    wood: `이거 요상하네. ${stemImage.metaphor}인 일간인데 ${dominantGod}(${dominantGod === "비견" ? "나와 같은 기운" : dominantGod === "식신" ? "만들어내는 힘" : "내면의 동력"})이 주도해. ${animal}띠치곤 독특하게도 ${stemImage.tension}. 이 안에 뭐가 더 있는지... 까봐야 알지.`,
    fire: `어? ${stemImage.nature} 같은 일간에 ${dominantGod}(${dominantGod === "비견" ? "나와 같은 기운" : dominantGod === "식신" ? "만들어내는 힘" : "내면의 에너지"})이 타오르는 사주야. ${stemImage.metaphor}이라 ${stemImage.tension}. 이 열기 뒤에 숨은 게 있어... 그건 까봐야지.`,
    earth: `흠, ${stemImage.nature} 같은 일간. ${stemImage.metaphor}인데 ${dominantGod}(${dominantGod === "비견" ? "나와 같은 기운" : dominantGod === "식신" ? "만들어내는 힘" : "핵심 동력"})이 깔려 있어. 겉으론 든든한데, ${stemImage.tension}. 속은... 글쎄.`,
    metal: `이 녀석... ${stemImage.nature} 같은 일간에 ${dominantGod}(${dominantGod === "비견" ? "나와 같은 기운" : dominantGod === "식신" ? "만들어내는 힘" : "핵심 에너지"})이 깔린 사주야. ${stemImage.metaphor}인데, ${stemImage.tension}. 칼이 양날인 거 알아?`,
    water: `이건 첨 보는 조합인데. ${stemImage.nature} 같은 일간에 ${dominantGod}(${dominantGod === "비견" ? "나와 같은 기운" : dominantGod === "식신" ? "만들어내는 힘" : "핵심 흐름"})이 흘러. ${stemImage.metaphor}인데 ${stemImage.tension}. 이 깊이가 양날의 검이야.`,
  };

  const insightBase = hasYeokma
    ? `역마살까지 깔려있네. 가만히 있으면 운이 썩는 타입이야. 더 까보면 알려줄게.`
    : hasDohwa
    ? `도화살 기운이 흐르네. 이성한테 끌리는 뭔가가 있어. 그 정체는 까봐야 보여.`
    : `이 오행 흐름이 좀 독특해. 더 까보면 알려줄게.`;

  const nameInfo = result.input.nameInfo;
  const nameHints: Record<string, string> = {
    wood: `${nameInfo?.koreanName}... 이 이름에 ${elName}의 기운이 더 실려 있네. 자세한 건 까봐야 보여.`,
    fire: `${nameInfo?.koreanName}이라... 이름에서도 불꽃이 느껴져. 사주랑 어떻게 엮이는지는 까봐야 알지.`,
    earth: `${nameInfo?.koreanName}... 묵직한 이름이네. 사주랑 궁합이 어떤지, 그건 까봐야 해.`,
    metal: `${nameInfo?.koreanName}이라. 이름에 칼날 같은 기운이 서렸어. 더 보고 싶으면 까봐.`,
    water: `${nameInfo?.koreanName}... 흐르는 물 같은 이름이야. 사주랑 어울리는지는 까봐야 안다.`,
  };

  return {
    personality: personalities[el] || `${animal}띠... ${dominantGod}이 깔린 독특한 녀석이네.`,
    elementInsight: insightBase,
    ...(nameInfo ? { nameHint: nameHints[el] || `${nameInfo.koreanName}... 이 이름, 뭔가 숨겨진 게 있어. 까봐야 알지.` } : {}),
  };
}

// 도깨비 데모 상세 풀이 — 11섹션, 계산된 사주 데이터 활용
function generateDemoFullReading(result: SajuResult): FullReading {
  const el = result.dominantElement;
  const weak = result.weakestElement;
  const animal = result.zodiacAnimalKorean;
  const elName = ELEMENT_NAMES[el];
  const weakName = ELEMENT_NAMES[weak];

  // 이름 정보
  const nameInfo = result.input.nameInfo;

  // 계산된 데이터 추출
  const dayMaster = result.fourPillars.day.heavenlyStem;
  const dominantGod = result.tenGods?.summary.dominant || "비견";
  const presentGods = result.tenGods?.summary.present?.join(", ") || "";
  const yearStemGod = result.tenGods?.positions.yearStem.korean || "";
  const monthStemGod = result.tenGods?.positions.monthStem.korean || "";
  const hourStemGod = result.tenGods?.positions.hourStem?.korean || "";

  const hasYeokma = result.specialStars?.stars.find(s => s.key === "yeokma")?.present || false;
  const hasDohwa = result.specialStars?.stars.find(s => s.key === "dohwa")?.present || false;
  const hasHwagae = result.specialStars?.stars.find(s => s.key === "hwagae")?.present || false;
  const hasCheoneuil = result.specialStars?.stars.find(s => s.key === "cheoneuil")?.present || false;
  const hasGwimun = result.specialStars?.stars.find(s => s.key === "gwimun")?.present || false;
  const yeokmaAffected = result.specialStars?.stars.find(s => s.key === "yeokma")?.affectedPillars || [];
  const dohwaAffected = result.specialStars?.stars.find(s => s.key === "dohwa")?.affectedPillars || [];

  const dayStage = result.twelveStages?.stages.day;
  const monthStage = result.twelveStages?.stages.month;
  const yearStage = result.twelveStages?.stages.year;
  const hourStage = result.twelveStages?.stages.hour;

  const clashes = result.branchRelations?.relations.filter(r => r.type === "clash") || [];
  const combinations = result.branchRelations?.relations.filter(r => r.type === "combination") || [];
  const punishments = result.branchRelations?.relations.filter(r => r.type === "punishment") || [];
  const harms = result.branchRelations?.relations.filter(r => r.type === "harm") || [];
  const hasMajorClash = result.branchRelations?.hasMajorClash || false;

  const voidBranches = result.gongmang?.voidBranches || [];
  const voidPillars = result.gongmang?.affectedPillars || [];

  // 12운성 에너지 텍스트
  const stageEnergy: Record<string, string> = {
    jangsaeng: "장생(새 생명의 에너지)", mogyok: "목욕(정화·변신)", gwandae: "관대(화려한 전성기 직전)",
    geonrok: "건록(안정적 전성기)", jewang: "제왕(에너지 최고조, 무적 모드)",
    soe: "쇠(내리막 시작)", byeong: "병(기운이 약해지는 시기)", sa: "사(에너지 소멸)",
    myo: "묘(잠복기)", jeol: "절(완전한 단절)", tae: "태(새로운 가능성의 씨앗)", yang: "양(기운이 자라는 중)",
  };
  const dayStageText = dayStage ? (stageEnergy[dayStage.key] || dayStage.korean) : "미계산";
  const monthStageText = monthStage ? (stageEnergy[monthStage.key] || monthStage.korean) : "미계산";

  // 합충 텍스트
  const clashText = clashes.length > 0
    ? clashes.map(c => `${c.pillars[0]}지-${c.pillars[1]}지 ${c.korean}`).join(", ")
    : "없음";
  const comboText = combinations.length > 0
    ? combinations.map(c => `${c.pillars[0]}지-${c.pillars[1]}지 ${c.korean}`).join(", ")
    : "없음";

  // 적천수 일간 본성 + 궁통보감 계절 맥락
  const stemImage = STEM_IMAGES[dayMaster.name] || { nature: "독특한 기운", metaphor: "예사롭지 않은 구조", tension: "양면이 있어" };
  const seasonContext = getDemoSeasonContext(dayMaster.element, result.fourPillars.month.earthlyBranch.name);

  // --- 각 섹션 ---

  const personalityContent = `**${dayMaster.hanja}${result.fourPillars.day.earthlyBranch.hanja}(${dayMaster.korean}${result.fourPillars.day.earthlyBranch.korean}) 일주 — "${stemImage.nature}" 같은 녀석이 ${dominantGod}을 쥐고 있어**

## 네 근본
${stemImage.metaphor} — 이게 네 근본이야. 일간 ${dayMaster.korean}(${ELEMENT_NAMES[dayMaster.element]}, ${dayMaster.yinYang === "yang" ? "양" : "음"})은 ${stemImage.nature}의 기질이라 ${stemImage.tension}. 일지 12운성이 **${dayStageText}**이니까 ${dayStage?.key === "jewang" || dayStage?.key === "geonrok" ? "에너지가 충만한 상태라 자기 주장이 강하고 뚝심이 있어." : dayStage?.key === "jangsaeng" || dayStage?.key === "gwandae" ? "성장 기운이 타오르는 중이라 가능성은 넘치는데 아직 완성형은 아니야." : dayStage?.key === "soe" || dayStage?.key === "byeong" ? "겉으로는 차분해 보여도 속으로는 에너지를 비축하고 있는 상태야." : "독특한 에너지 흐름을 가지고 있어. 남들과 다른 리듬으로 사는 녀석이야."}

## 태어난 계절의 영향
${seasonContext ? `${seasonContext}. ` : ""}${animal}띠치곤 독특하게도 이 계절적 맥락이 성격에 그대로 녹아 있어. ${dayMaster.element === "water" || dayMaster.element === "wood" ? "겉으로는 시원시원해 보여도 속으로는 계산이 빠른 타입" : dayMaster.element === "fire" ? "열정이 넘치지만 불을 어디에 쓸지가 인생의 숙제" : dayMaster.element === "earth" ? "누구보다 듬직한데 변화 앞에선 불안한 모순" : "날카롭지만 정작 본인은 상처받기 쉬운 양면"}이야.

## 사주 속 나
사주에서 **${dominantGod}**이 가장 강하게 깔려 있어.${yearStemGod ? ` 년간에 ${yearStemGod},` : ""}${monthStemGod ? ` 월간에 ${monthStemGod}` : ""}${hourStemGod ? `, 시간에 ${hourStemGod}` : ""} — 이 조합이 네 성격의 근본을 만들어. ${presentGods ? `보유 십신은 ${presentGods}으로` : "십신 구성으로 볼 때"} ${dominantGod === "비견" || dominantGod === "겁재" ? "자기 중심이 확고하고 독립심이 강한 타입이야." : dominantGod === "식신" || dominantGod === "상관" ? "표현력과 창작 에너지가 넘치는 타입이야." : dominantGod === "편재" || dominantGod === "정재" ? "현실 감각이 뛰어나고 돈의 흐름을 읽는 타입이야." : dominantGod === "편관" || dominantGod === "정관" ? "책임감이 강하고 조직에서 두각을 나타내는 타입이야." : "학습력이 뛰어나고 직관이 예리한 타입이야."}

## 숨은 면모
${weakName}이 약한 게 아킬레스건이야.${voidPillars.length > 0 ? ` 게다가 **비어있는 기운**이 ${voidPillars.join(", ")}주에 걸려 있어서 그쪽 기운이 허하더라.` : ""}${hasGwimun ? " **생각이 복잡해지는 기운**까지 있으니 가끔 머릿속이 꼬이는 경향이 있어." : ""} 겉으로는 ${elName}답게 강해 보여도, 이 약한 구석을 아는 사람은 아프게 찌를 수 있으니 조심해.${nameInfo ? ` 참고로 **${nameInfo.koreanName}**이라는 이름 기운이 이 성격을 ${el === weak ? "더 치우치게" : "어느 정도 보완해"} 주더라.` : ""}`;

  const wealthContent = `**${dominantGod === "편재" || dominantGod === "정재" ? "재물 십신이 주도하는 사주 — 돈 복이 타고났어" : dominantGod === "식신" || dominantGod === "상관" ? "식상(만들어내는 힘)이 재물을 끌어당기는 구조" : "재물은 노력형 — 근데 방향이 맞으면 크게 와"}**

## 돈 버는 스타일
${presentGods.includes("편재") ? "사주에 **편재(偏財, 뜻밖의 수입)**가 있어. 생각지도 못한 곳에서 돈이 굴러오는 기운이라 투자 수익, 사업 소득 쪽에서 재물이 올 확률이 높아." : presentGods.includes("정재") ? "사주에 **정재(正財, 꾸준한 노동 수입)**가 있어. 월급, 안정적 수입, 착실한 저축이 네 재물 패턴이야." : `직접적인 재물 십신은 약한 편이야. 대신 **${dominantGod}**을 통해 간접적으로 재물이 따라오는 구조야.`}${combinations.length > 0 ? ` 지지에 **합(合, 끌어당기는 기운)**이 있어서 인간관계를 통한 재물 기회가 열려 있어.` : ""}

## 돈 흐름의 변수
${clashes.length > 0 ? `**충(沖, 부딪히는 기운)이 ${clashText}** — 재물 흐름에 갑작스러운 변동이 올 수 있어. 예상치 못한 지출이나 수입 변화에 대비해야 해.` : "충(沖)은 없어서 재물 흐름이 비교적 안정적인 편이야."}${voidPillars.length > 0 ? ` 공망이 ${voidPillars.join(", ")}주에 걸려 있어서 ${voidPillars.includes("year") ? "조상 재산이나 유산은 기대하기 힘들어" : voidPillars.includes("month") ? "직장 수입에 변동이 잦을 수 있어" : "예상 밖 곳에서 재물이 새나갈 수 있어"}.` : ""}

## 주의할 점
${weakName}이 약하니까 ${weak === "water" ? "**유동성 관리**가 핵심이야. 현금 흐름을 항상 체크해." : weak === "metal" ? "**결단력이 느려서 투자 타이밍**을 놓치기 쉬워. 분석은 거기까지, 실행해." : weak === "wood" ? "**장기 계획 없이 돈 쓰면** 금방 바닥나. 3년 단위로 생각해." : weak === "fire" ? "**소극적인 재테크**만 하면 기회가 안 와. 가끔은 과감해져봐." : "**변화를 두려워하면** 재물도 정체돼. 새로운 수입원을 찾아봐."}${nameInfo?.selectedHanja ? ` 이름 획수 흐름으로 봤을 때 재물 쪽에 ${nameInfo.selectedHanja.reduce((s, h) => s + h.strokes, 0) % 2 === 0 ? "안정적인 기운" : "변동적인 기운"}이 깔려 있어.` : ""}`;

  const careerContent = `**${dominantGod === "식신" || dominantGod === "상관" ? "창작과 표현으로 먹고사는 사주" : dominantGod === "편관" || dominantGod === "정관" ? "조직의 중심에서 빛나는 사주" : dominantGod === "편인" || dominantGod === "정인" ? "전문성으로 승부하는 사주" : "독자적 행보가 맞는 사주"}**

## 타고난 재능
${presentGods.includes("식신") ? "**식신(食神, 만들고 즐기는 에너지)**이 있어서 뭔가를 만들어내는 일에 재능이 있어. 콘텐츠, 교육, 요식업, 디자인 쪽이 딱이야." : presentGods.includes("상관") ? "**상관(傷官, 틀을 깨는 에너지)**이 있어서 기존 틀을 깨는 일에 강해. 마케팅, 미디어, IT, 예술 쪽에서 두각을 나타내." : `직접적인 식상은 약한 편이지만, **${dominantGod}**이 강하니까 ${dominantGod === "비견" || dominantGod === "겁재" ? "독립 사업이나 경쟁이 치열한 분야" : dominantGod === "편재" || dominantGod === "정재" ? "금융, 투자, 유통, 무역" : dominantGod === "편관" || dominantGod === "정관" ? "공무원, 법률, 경영, 관리직" : "연구, 상담, 교육, 학술"}에서 빛나.`}

## 커리어 에너지 상태
월지 12운성이 **${monthStageText}**이라 ${monthStage?.key === "jewang" || monthStage?.key === "geonrok" ? "사회적 활동 에너지가 최고조야. 지금이 커리어 황금기." : monthStage?.key === "jangsaeng" || monthStage?.key === "gwandae" || monthStage?.key === "yang" ? "아직 성장 중이야. 실력을 더 쌓으면 폭발할 시기가 와." : "지금은 내실을 다지는 시기야. 조용히 준비하면 반전이 와."} 일지가 ${dayStageText}이니까 ${dayStage?.key === "jewang" || dayStage?.key === "geonrok" ? "본인의 직업 만족도는 높은 편이야." : "일에 대한 에너지를 잘 관리해야 해."}

## 2026년 커리어
올해 병오년은 불 에너지가 강해.${el === "fire" ? " 네 기운이랑 같아서 **승진, 확장, 도약**의 기회야." : el === "metal" ? " 쇠인 너한테 불이 쇠를 녹이는 기운이라 **변화와 시련**이 올 수 있어. 근데 그게 성장의 기회야." : el === "wood" ? " 나무가 불을 키워주는 기운이라 **네 노력이 결실**을 맺는 해야." : el === "water" ? " 물이 불을 다스리는 기운이라 **네가 주도권을 잡을 수 있는** 해야." : " 열기가 땅을 단단하게 만드는 기운이라 **안정적인 성장**이 기대되는 해야."}${nameInfo ? ` **${nameInfo.koreanName}**이라는 이름이 커리어에서 ${dominantGod === "식신" || dominantGod === "상관" ? "창작·표현" : dominantGod === "편관" || dominantGod === "정관" ? "조직·관리" : "독립·전문"} 방향을 더 밀어주더라.` : ""}`;

  const loveContent = `**${hasDohwa ? "도화살 보유 — 이성 매력이 타고난 사주" : "은근한 매력으로 승부하는 타입"}**

## 이성 매력
${hasDohwa ? `**이성한테 끌리는 분위기**가 ${dohwaAffected.join(", ")}주에서 발현되고 있어. 의식하든 아니든 이성한테 끌리는 분위기가 있어. ${dohwaAffected.includes("year") ? "어릴 때부터 인기가 있었을 거야." : dohwaAffected.includes("month") ? "사회생활하면서 이성한테 관심받는 일이 잦아." : "자기도 모르게 묘한 매력을 풍기는 타입이야."}` : "도화살은 없어서 화려한 연애전선보다는 **깊이 있는 관계**가 맞는 사주야. 처음엔 별 감흥 없다가 알면 알수록 매력이 나오는 타입."}${hasCheoneuil ? " 귀인 운이 있어서 **좋은 인연을 만날 확률**이 높아." : ""}

## 인연 패턴
${combinations.length > 0 ? `지지에 **합(合)** ${comboText}이 있어서 사주 자체가 인연을 끌어당기는 구조야. ${weakName}이 강한 사람이랑 만나면 시너지가 최고야.` : "지지에 합이 없어서 인연이 **노력으로 만들어지는** 타입이야. 대신 한 번 맺은 관계는 흔들리지 않아."}

## 결혼운
${clashes.length > 0 ? `충(沖)이 있어서 **결혼 전후로 큰 변화**가 동반될 수 있어. 이사, 이직, 가정 환경 변화 등.` : "충이 없어서 결혼 후 비교적 **안정적인 가정**을 꾸릴 사주야."} ${dominantGod === "비견" || dominantGod === "겁재" ? "자존심 세우기보다 양보하는 연습이 필요해." : dominantGod === "편관" || dominantGod === "정관" ? "상대를 통제하려는 경향이 있어 주의해." : "감정 표현을 아끼지 마. 마음속으로만 사랑하면 상대가 몰라."}${nameInfo ? ` 이름 기운으로 봤을 때 **${nameInfo.koreanName}**은 연애에서 ${hasDohwa ? "매력 발산이 강한" : "은근한 끌림을 주는"} 이름이야.` : ""}`;

  const relationshipsContent = `**${dominantGod === "비견" || dominantGod === "겁재" ? "동료 에너지가 강한 사교형" : dominantGod === "편인" || dominantGod === "정인" ? "은둔 고수형 — 신뢰를 얻는 스타일" : "상황에 따라 변하는 카멜레온형"}**

## 네 사교 스타일
${presentGods.includes("비견") ? "**비견(比肩, 나와 같은 기운)**이 있어서 같은 레벨의 사람들과 잘 어울려. 경쟁심도 있지만 그게 서로를 성장시켜." : presentGods.includes("겁재") ? "**겁재(劫財, 경쟁자 에너지)**가 있어서 경쟁적인 환경에서 빛나. 근데 양보하는 법도 배워야 해." : ""} ${presentGods.includes("정인") ? "**정인(正印, 든든한 후원)**이 있어서 윗사람한테 인정받기 쉬워. 멘토 운이 좋아." : presentGods.includes("편인") ? "**편인(偏印, 남다른 시각)**이 있어서 특이한 인연을 끌어당겨. 비주류에서 진짜 친구를 만나는 타입." : ""}

## 관계에서 상처받는 포인트
${punishments.length > 0 ? `**형(刑, 찌르는 기운)**이 있어서 가까운 사이에서 상처받을 수 있어. ${punishments.map(p => `${p.pillars[0]}지-${p.pillars[1]}지`).join(", ")}에서 발생하니까 ${punishments[0].pillars.includes("year") ? "가족 관계" : punishments[0].pillars.includes("month") ? "직장 동료" : "가까운 사람"}과의 갈등에 주의해.` : "형(刑)은 없어서 인간관계에서 큰 상처를 받을 일은 적어."} ${harms.length > 0 ? `**해(害, 은근히 갉아먹는 기운)**가 ${harms.map(h => `${h.pillars[0]}지-${h.pillars[1]}지`).join(", ")}에 있어서 은근한 갈등이 쌓일 수 있어.` : ""}

## 조심할 관계
${dominantGod === "비견" || dominantGod === "겁재" ? "경쟁 상대가 적이 되지 않게 관리해. 이기는 것보다 같이 가는 게 결국 이득이야." : dominantGod === "편관" || dominantGod === "정관" ? "권위적으로 보이면 사람이 떠나. 힘이 있어도 부드럽게 써." : "너무 맞추다 보면 자기 자신을 잃어. 가끔은 NO라고 말하는 연습 해."}`;

  const healthContent = `**${elName} 과잉 + ${weakName} 부족 — 이 조합이 건강의 핵심**

## 몸이 보내는 신호
${el === "wood" ? "**나무 기운**이 과하면 간, 담낭, 눈에 무리가 와. 야근이 잦거나 스트레스가 쌓이면 간 수치부터 올라가는 체질이야. 눈 피로와 두통도 주의해." : el === "fire" ? "**불 기운**이 세면 심장, 혈관, 소장 쪽이 취약해. 매운 음식, 카페인, 음주를 줄이고 심박수 관리가 필수야." : el === "earth" ? "**흙 기운**이 과하면 위장, 비장이 불편해져. 폭식이나 불규칙한 식사가 제일 안 좋아. 소화 기능이 네 건강의 바로미터야." : el === "metal" ? "**쇠 기운**이 세면 폐, 대장, 피부가 예민해져. 건조한 환경 피하고 보습 관리 철저히. 호흡기 질환에 특히 취약해." : "**물 기운**이 넘치면 신장, 방광, 생식기 쪽이 약해질 수 있어. 찬 음식, 찬 바닥 조심하고 몸을 따뜻하게 유지해."}

## 체력 상태
일지 12운성이 **${dayStageText}**이라 ${dayStage?.key === "jewang" || dayStage?.key === "geonrok" ? "기본 체력은 좋은 편이야. 대신 과신하다 무리하기 쉬우니 관리가 중요해." : dayStage?.key === "jangsaeng" || dayStage?.key === "gwandae" || dayStage?.key === "yang" ? "체력이 점점 올라가는 시기야. 지금 운동 습관을 들이면 평생 가." : dayStage?.key === "soe" || dayStage?.key === "byeong" ? "체력이 예전 같지 않을 수 있어. 무리하지 말고 회복에 집중해." : "에너지 변동이 큰 체질이야. 컨디션 관리를 루틴화하는 게 중요해."}${hasMajorClash ? " **충(沖)**이 있어서 갑작스러운 건강 변화에 주의해야 해." : ""}

## 보충법
${weakName} 보충이 핵심이야.${weak === "water" ? " **수영, 반신욕, 충분한 수분 섭취**가 제일 좋아. 겨울엔 특히 몸을 따뜻하게." : weak === "fire" ? " **유산소 운동, 햇빛 쬐기, 따뜻한 음식**으로 열을 보충해." : weak === "wood" ? " **스트레칭, 숲속 산책, 녹색 채소** 위주 식단이 맞아." : weak === "metal" ? " **등산, 호흡 운동, 매운맛 적당히** 챙겨." : " **규칙적인 생활, 잡곡밥, 제철 음식**이 네 보약이야."}`;

  const fortune2026Content = `**2026 병오(丙午)년 — ${el === "fire" ? "네 기운과 같은 해, 에너지 폭발" : el === "metal" ? "시련이 곧 성장인 해" : el === "wood" ? "씨앗이 꽃피는 해" : el === "water" ? "주도권을 잡는 해" : "기반이 단단해지는 해"}**

## 네 사주의 계절적 맥락부터
${seasonContext ? `원래 네 사주는 **${seasonContext}**. ` : ""}${stemImage.nature} 같은 일간이 올해 강한 불 기운을 만나면서 ${dayMaster.element === "water" ? "둑 없는 물에 불이 만난 거야. 주도권을 잡을 수 있지만 균형이 관건" : dayMaster.element === "wood" ? "나무에 불이 붙은 형국이야. 네 노력이 환하게 타오를 수 있는데, 타다 남은 재가 되지 않게 조절" : dayMaster.element === "fire" ? "불에 불을 더한 거야. 에너지 폭발은 좋은데, 폭주하면 태워먹어" : dayMaster.element === "metal" ? "불이 쇠를 달구는 형국이야. 아프지만 이게 바로 명검이 되는 과정" : "불이 흙을 구워서 벽돌로 만드는 해야. 기반이 단단해지는 시기"}이야.

## 2026 병오년과 사주의 관계
올해 천간 **병(丙, 태양의 불)**과 지지 **오(午, 정오의 불)**가 네 사주와 만나면서 ${el === "fire" ? "같은 불 기운이라 에너지가 200%야. 밀어붙일 건 밀어붙이는 황금기." : el === "metal" ? "불이 쇠를 녹이는 기운이라 도전과 시련의 해야. 근데 쇠는 불에 달궈져야 진짜 칼이 돼." : el === "wood" ? "나무가 불을 키워주는 기운이라 네가 쏟은 노력이 결실을 맺어. 무언가를 수확하는 해야." : el === "water" ? "물이 불을 다스리는 기운이라 네가 흐름을 통제할 수 있어. 주도권을 쥘 수 있는 해." : "열기가 땅을 단단하게 만드는 기운이라 안정적인 성장이 기대돼. 기반을 다지는 해야."}${clashes.length > 0 ? ` 사주 내 충(沖)이 올해 세운과 만나면 **예상 못한 변동**이 올 수 있어.` : ""}

## 상반기 (1~6월)
${hasYeokma ? `역마살이 세운의 불 에너지를 만나 **이동·변화의 기운**이 특히 강해. 이직, 이사, 새 프로젝트 시작의 최적기야.` : `상반기는 ${el === "fire" || el === "wood" ? "에너지가 올라가는 시기라 새로운 시도에 유리해" : "내실을 다지는 시기야. 조용히 준비하면 하반기에 빛나"}.`}${hasCheoneuil ? " **천을귀인** 덕에 귀인의 도움이 올 수 있어. 손 내밀면 잡아줄 사람이 있어." : ""}

## 하반기 (7~12월)
${el === "fire" ? "과열 주의. 상반기에 밀어붙였으면 하반기는 **속도 조절**이 핵심이야. 달리기만 하면 탈진해." : el === "metal" ? "상반기의 시련을 지나면 **한 단계 성장한 네가** 있을 거야. 연말에 성과가 나와." : `하반기에 ${hasDohwa ? "**새로운 인연이 들어오는** 시기야. 도화살 기운이 활성화돼" : "**지금까지 쌓아온 것들의 성과**가 보이기 시작해"}.`}${voidPillars.length > 0 ? ` 공망이 걸린 ${voidPillars.join(", ")}주 방면은 올해도 허한 편이니 기대보단 현실에 집중해.` : ""}`;

  const travelContent = `**${hasYeokma ? "역마살 보유 — 움직여야 운이 트이는 사주" : "변화보다 안정 선호 — 근데 가끔은 필요해"}**

## 움직여야 사는 타입?
${hasYeokma ? `**가만히 있으면 답답해 죽는 기운**이 ${yeokmaAffected.join(", ")}주에서 발현되고 있어. ${yeokmaAffected.includes("year") ? "어릴 때부터 이동이 잦았거나, 고향을 떠나는 운명이야." : yeokmaAffected.includes("month") ? "직장이나 사회생활에서 이동·변화가 잦아. 한 곳에 오래 머물면 답답해지는 타입." : "인생 후반기에 큰 변화나 이동이 올 수 있어."} 해외 출장, 이사, 이직 — 움직이는 게 오히려 운을 열어.` : `역마살은 없어서 **안정적인 환경**에서 실력을 발휘하는 타입이야. 급격한 변화보다 점진적 이동이 맞아. 그래도 1년에 한 번은 새로운 곳을 가봐. 막힌 기운이 풀려.`}

## 비어있는 자리
${voidPillars.length > 0 ? `공망 지지가 **${voidBranches.join(", ")}**이고, ${voidPillars.join(", ")}주가 해당돼. ${voidPillars.includes("year") ? "년주 공망은 조상 기운이 허해서 자수성가형이야. 물려받을 건 기대하지 마." : voidPillars.includes("month") ? "월주 공망은 직업 변동이 잦을 수 있어. 한 곳에 정착하기 어렵지만, 그게 오히려 폭넓은 경험이 돼." : voidPillars.includes("hour") ? "시주 공망은 말년이 허할 수 있어. 젊을 때 노후 준비를 단단히 해둬." : "공망이 걸린 자리의 기운이 허하니까 그 방면은 기대를 낮추고 현실적으로 접근해."}` : "사주 내 공망 해당이 없어서 **네 기둥이 다 실해**. 어디 한 곳이 비어있지 않아서 균형 잡힌 삶을 살 가능성이 높아."}

## 인생의 급커브
${clashes.length > 0 ? `**충(沖)** ${clashText} — 이 충돌이 삶에 급격한 변화를 가져올 수 있어. ${clashes[0].pillars.includes("year") && clashes[0].pillars.includes("month") ? "가정과 사회의 갈등" : clashes[0].pillars.includes("day") ? "배우자나 가까운 관계에서의 변동" : "예상치 못한 방향의 전환"}이 올 수 있으니 마음의 준비를 해둬.` : "충(沖)은 없어서 갑작스러운 대변동보다는 **점진적 변화**가 네 패턴이야."}`;

  const talentContent = `**${hasHwagae ? "화개살 보유 — 학문과 예술의 별이 빛나는 사주" : "숨겨진 재능이 발굴을 기다리고 있어"}**

## 숨겨진 가능성
${hasHwagae ? "**공부하고 만드는 데 빠지는 기운**이 있어. 종교, 철학, 예술, 학문 분야에서 남다른 깊이를 보여주는 사주야. 대중보다 한 단계 깊이 파고드는 능력이 있어." : "화개살은 없지만,"} ${presentGods.includes("편인") ? "**남들과 다른 시각**이 있어서 남들과 다른 각도로 세상을 봐. 창의적 분야에서 독보적인 포지션을 만들 수 있어." : presentGods.includes("식신") ? "**만들고 즐기는 에너지**가 있어서 뭔가를 만들어내는 일에 천부적 재능이 있어. 음식, 콘텐츠, 디자인 — 만드는 모든 것에 재능이 묻어나." : `**${dominantGod}** 중심 사주라 ${dominantGod === "비견" || dominantGod === "겁재" ? "독립적인 활동에서 재능이 빛나" : "맡은 분야에서 꾸준히 깊이를 쌓아가는 장인형 재능이 있어"}.`}

## 아직 안 터진 재능
${result.tenGods?.hiddenStems.dayBranch ? `일지 지장간에 **${result.tenGods.hiddenStems.dayBranch.map(g => g.korean).join(", ")}**이 숨어 있어. ${result.tenGods.hiddenStems.dayBranch.some(g => g.key === "siksin" || g.key === "sanggwan") ? "표면 아래에 강력한 창작 에너지가 잠자고 있어. 취미로라도 뭔가를 만들어봐." : result.tenGods.hiddenStems.dayBranch.some(g => g.key === "pyeonin" || g.key === "jeongin") ? "내면에 깊은 학습력과 직관이 숨어 있어. 공부나 연구를 하면 남다른 성과가 나와." : "다양한 능력이 내면에 잠재되어 있어. 새로운 도전을 해봐야 어떤 게 터지는지 알 수 있어."}` : "지장간 분석이 어려운 상태지만, 네 ${elName}의 깊은 곳에 아직 발견되지 않은 재능이 있어."}

## 이걸 살려봐
${hasHwagae ? "명상, 글쓰기, 예술 활동을 꾸준히 해봐. 화개살이 있는 사주는 **깊이 파고들수록** 빛이 나." : dominantGod === "식신" || dominantGod === "상관" ? "콘텐츠 제작이든 요리든, **뭔가를 만들어서 세상에 내놓는 연습**을 해. 네 재능의 출구가 필요해." : "**하나의 분야에 3년만 집중**해봐. 네 잠재력은 시간이 걸려야 터지는 타입이야."}`;

  const dokkaebiAdviceContent = `**${stemImage.nature} — 그게 네 본질이야. 한마디로 "${stemImage.metaphor}"**

## 사주 종합
${stemImage.nature} 같은 일간 ${dayMaster.korean}(${ELEMENT_NAMES[dayMaster.element]})에 12운성 ${dayStageText}, 주요 십신 **${dominantGod}** — 이 조합이 네 인생의 기본 색깔이야.${seasonContext ? ` ${seasonContext}는 상태에서` : ""} ${combinations.length > 0 ? `지지에 합(合)이 있어서 인연과 기회가 자연스럽게 열리는 구조이고,` : ""} ${clashes.length > 0 ? `충(沖)이 있어서 삶에 굵직한 변곡점이 찾아올 사주야.` : "큰 파도보다는 꾸준한 물살이 네 인생 패턴이야."} ${hasYeokma ? "가만있으면 답답한 기운이 깔려있으니 한 곳에 머물면 운이 막혀." : ""} ${hasHwagae ? "공부하고 만드는 기운이 있으니 깊이 파고드는 일에서 빛날 수 있어." : ""} ${voidPillars.length > 0 ? `비어있는 기운이 ${voidPillars.join(", ")}주에 있어서 그 방면은 기대를 내려놓고 현실에 집중하는 게 맞아.` : ""}

## 평생 숙제
${stemImage.tension} — 이게 네 인생에서 계속 반복되는 테마야. ${dayMaster.element === "water" ? "물은 흘러야 살아있어. 고이면 썩어." : dayMaster.element === "wood" ? "나무는 자라야 하는데, 방향이 없으면 가지만 벌려." : dayMaster.element === "fire" ? "불은 태워야 존재하는데, 뭘 태울지 모르면 자기를 태워." : dayMaster.element === "metal" ? "쇠는 벼려져야 쓸모 있는데, 벼림을 피하면 녹슬어." : "흙은 품어야 하는데, 너무 품으면 자기가 묻혀."} 이걸 알면 네 인생의 절반은 풀린 거야.

## 도깨비의 충고
${el === "wood" ? "이것저것 벌리지 말고 **딱 하나에 올인**해봐. 그 하나가 숲이 되는 거야." : el === "fire" ? "**80%로 꾸준히 가는 게 답**이야. 100% 쏟다 쓰러지는 것보다 훨씬 나아. 쉬는 것도 실력이야." : el === "earth" ? "**안전지대 밖으로 딱 한 발만.** 그 한 발이 새 세상을 열어." : el === "metal" ? "**네가 틀릴 수도 있다**는 걸 인정해봐. 그 순간 세계가 두 배로 넓어져." : "**생각 3, 실행 7.** 완벽한 계획 없이 시작해도 네 머리가 알아서 보정해줘. 일단 질러."} ${weakName}이 약한 건 약점이 아니라 **보충하면 되는 거야**. 수백 년 살아본 도깨비가 하나만 더 말해줄게 —${nameInfo ? ` **${nameInfo.koreanName}**이라는 이름을 달고 사는` : ""} 네 사주, ${dominantGod}이 이끄는 인생은 ${dominantGod === "비견" || dominantGod === "겁재" ? "자기 힘으로 일어서는 자수성가형" : dominantGod === "식신" || dominantGod === "상관" ? "만드는 것으로 세상을 바꾸는 창작형" : dominantGod === "편재" || dominantGod === "정재" ? "현실을 움켜쥐는 실리형" : dominantGod === "편관" || dominantGod === "정관" ? "중심에 서서 이끄는 리더형" : "배우고 성장하는 것 자체가 무기인 학자형"}이야. 이건 진심이야.`;

  // 이름풀이 (이름 입력 시에만)
  const nameFortuneContent = nameInfo ? `**이 이름, ${elName}의 기운과 ${nameInfo.selectedHanja ? "한자가 어떻게 엮이는지" : "음가가 어떻게 맞물리는지"} 봐봤어**

## 이름 뜯어보기
${nameInfo.selectedHanja && nameInfo.selectedHanja.length > 0 ? nameInfo.selectedHanja.map(h => `**${h.hanja}**(${h.meaning}, ${h.strokes}획${h.strokes % 2 === 0 ? " 음" : " 양"})`).join(" + ") + ". " + (nameInfo.selectedHanja.reduce((sum, h) => sum + h.strokes, 0) % 2 === 0 ? "총 획수가 짝수(음)라 안정적이고 수용적인 에너지야." : "총 획수가 홀수(양)이라 적극적이고 진취적인 에너지야.") + ` 글자 조합이 ${el === "wood" || el === "fire" ? "양적인 기운" : "음적인 기운"}과 어우러져서 전체적으로 ${elName} 사주와의 조화가 ${weak === "water" || weak === "metal" ? "아쉬운" : "괜찮은"} 편이야.` : `한자 미선택이라 음가로 분석한다. "${nameInfo.givenNameSyllables.join("")}" 발음이 주는 기운은 ${el === "wood" ? "부드럽고 확장적" : el === "fire" ? "밝고 활기찬" : el === "earth" ? "묵직하고 안정적인" : el === "metal" ? "맑고 단정한" : "깊고 지적인"} 느낌이야.`}

## 이름이랑 사주가 맞아?
${elName}이 강한 사주에 이 이름이 얹혀 있으니 ${nameInfo.selectedHanja ? `한자의 오행이 ${weakName}을 보충해주는지가 관건인데... ${weak === "water" ? "물 기운의 한자가 더 있었으면 완벽했어." : weak === "fire" ? "불 기운이 더 필요했는데 아쉬운 부분이야." : weak === "wood" ? "나무 기운의 보충이 약한 게 살짝 아쉬워." : weak === "metal" ? "쇠 기운이 좀 더 있었으면 좋겠지만 나쁘지 않아." : "전체적으로 밸런스가 괜찮은 편이야."}` : `음가로 봤을 때 ${weakName} 보충은 약한 편이야. 아호나 영어 이름으로 보완하는 것도 방법이야.`}

## 도깨비가 보는 이름값
${nameInfo.koreanName}... ${nameInfo.selectedHanja ? "한자까지 골라온 성의는 인정." : "한자는 모르지만 소리가 나쁘진 않아."} 이름값을 하려면 **${dominantGod}의 기운을 살리는 방향**으로 살아봐. 이름이 사주를 100% 바꿀 순 없지만, 방향은 잡아줄 수 있어.` : "";

  const defaultSection = (preview: string) => ({
    preview,
    content: `**${animal}띠, ${elName}이 강한 독특한 녀석**\n\n도깨비도 좀 더 봐야 알겠어. 다시 시도해봐.`,
  });

  const sections: FullReadingSection[] = [
    { key: "personality", title: "타고난 성격", icon: "👹", preview: `${dominantGod}이 이끄는 ${animal}띠`, content: personalityContent },
    { key: "wealth", title: "재물운", icon: "💰", preview: presentGods.includes("편재") ? "편재형 재물운" : presentGods.includes("정재") ? "정재형 안정 수입" : "노력형 재물운", content: wealthContent },
    { key: "career", title: "직업·적성", icon: "🔥", preview: dominantGod === "식신" || dominantGod === "상관" ? "창작형 적성" : dominantGod === "편관" || dominantGod === "정관" ? "리더형 적성" : "전문가형 적성", content: careerContent },
    { key: "love", title: "연애·결혼운", icon: "💀", preview: hasDohwa ? "도화살 매력 보유" : "은근한 매력형", content: loveContent },
    { key: "relationships", title: "대인관계", icon: "🤝", preview: dominantGod === "비견" || dominantGod === "겁재" ? "경쟁적 사교형" : "신뢰 기반 관계형", content: relationshipsContent },
    { key: "health", title: "건강 주의보", icon: "⚡", preview: el === "wood" ? "간·눈 주의" : el === "fire" ? "심장·혈관 주의" : el === "earth" ? "소화기 주의" : el === "metal" ? "폐·피부 주의" : "신장·냉기 주의", content: healthContent },
    { key: "fortune2026", title: "2026 올해운", icon: "✨", preview: el === "fire" ? "에너지 폭발의 해" : el === "metal" ? "시련=성장의 해" : "기회의 해", content: fortune2026Content },
    { key: "travel", title: "역마·변화운", icon: "🌀", preview: hasYeokma ? "역마살 활성화" : "안정 선호 체질", content: travelContent },
    { key: "talent", title: "숨겨진 재능", icon: "🎭", preview: hasHwagae ? "화개살 학문·예술" : "잠재력 발굴 중", content: talentContent },
    ...(nameInfo && nameFortuneContent ? [{ key: "nameFortune" as const, title: "이름풀이", icon: "📛", preview: `${nameInfo.koreanName} 이름 분석`, content: nameFortuneContent }] : []),
    { key: "dokkaebiAdvice", title: "도깨비 한마디", icon: "🔮", preview: `${dominantGod} 인생의 핵심`, content: dokkaebiAdviceContent },
  ];

  return {
    sections,
    luckyElements: {
      color: el === "wood" ? "초록, 연두" : el === "fire" ? "빨강, 보라" : el === "earth" ? "노랑, 베이지" : el === "metal" ? "흰색, 은색" : "검정, 파랑",
      number: el === "wood" ? "3, 8" : el === "fire" ? "2, 7" : el === "earth" ? "5, 10" : el === "metal" ? "4, 9" : "1, 6",
      direction: el === "wood" ? "동쪽" : el === "fire" ? "남쪽" : el === "earth" ? "중앙" : el === "metal" ? "서쪽" : "북쪽",
      season: el === "wood" ? "봄 (3~5월)" : el === "fire" ? "여름 (6~8월)" : el === "earth" ? "환절기" : el === "metal" ? "가을 (9~11월)" : "겨울 (12~2월)",
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
      return NextResponse.json({ error: "사주 결과가 없어. 다시 해봐." }, { status: 400 });
    }

    const reading = await getReading(type, sajuResult);

    // DB 캐싱 + shareId 조회 (full만)
    let shareId: string | null = null;
    if (type === "full" && process.env.DATABASE_URL) {
      try {
        const { updateOrderReading, getOrder } = await import("@/lib/db/queries");
        await updateOrderReading(body.orderId, JSON.stringify(reading));
        const order = await getOrder(body.orderId);
        shareId = order?.shareId ?? null;
      } catch (error) {
        console.error("[api/saju/interpret] Cache save failed:", error);
      }
    }

    return NextResponse.json({ reading, shareId });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("[api/saju/interpret]", error);
    return NextResponse.json({ error: "도깨비가 잠깐 졸았어. 다시 해봐." }, { status: 500 });
  }
}
