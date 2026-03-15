import { GoogleGenerativeAI } from "@google/generative-ai";
import { NewsItem, DailyBrief } from "./types";

function getModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
}

// ── 트렌드 분석 ──────────────────────────────────────────
export async function generateTrendBrief(
  articles: NewsItem[],
): Promise<DailyBrief | null> {
  const model = getModel();
  if (!model || articles.length === 0) return null;

  try {
    const headlines = articles
      .slice(0, 30)
      .map((a, i) => `${i + 1}. [${a.source}] ${a.title}`)
      .join("\n");

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `AI 산업 애널리스트로서, 오늘의 헤드라인을 한 줄 요약하세요.

**작성 규칙:**
1. 핵심 트렌드 1~2문장으로 요약 (최대 80자)
2. 가장 중요한 키워드는 **볼드**로 강조 (1~2개만)
3. 트렌딩 키워드 3~5개

오늘의 AI 헤드라인:
${headlines}

반드시 아래 JSON으로만 응답:
{
  "trendAnalysis": "한두 문장 핵심 요약...",
  "topKeywords": ["키워드1", "키워드2", ...]
}`,
            },
          ],
        },
      ],
      generationConfig: { temperature: 0.4, maxOutputTokens: 300 },
    });

    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);

    return {
      date: new Date().toISOString().split("T")[0],
      trendAnalysis: parsed.trendAnalysis || "",
      topKeywords: Array.isArray(parsed.topKeywords) ? parsed.topKeywords : [],
    };
  } catch (error) {
    console.error("Gemini trend error:", error);
    return null;
  }
}

// ── 뉴스 제목 한글 번역 ─────────────────────────────────
export async function translateTitles(
  articles: NewsItem[],
): Promise<NewsItem[]> {
  const model = getModel();
  if (!model || articles.length === 0) return articles;

  // 이미 한글인 제목은 번역 불필요
  const koreanRegex = /[가-힣]/;
  const needsTranslation = articles
    .map((a, i) => ({ idx: i, title: a.title }))
    .filter((item) => !koreanRegex.test(item.title));

  if (needsTranslation.length === 0) return articles;

  // 최대 60개씩 배치 처리
  const BATCH = 60;
  const translated = new Map<number, string>();

  for (let start = 0; start < needsTranslation.length; start += BATCH) {
    const batch = needsTranslation.slice(start, start + BATCH);
    try {
      const titleList = batch
        .map((item, i) => `${i}: ${item.title}`)
        .join("\n");

      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `아래 영문 AI 뉴스 제목들을 한국어로 번역하세요.

규칙:
- 고유명사(회사명, 제품명, 인물명)는 영문 유지 (예: OpenAI, GPT-5, Elon Musk)
- 간결한 뉴스 헤드라인 스타일
- 의역 가능, 자연스러운 한국어

${titleList}

반드시 JSON으로만 응답: {"0":"번역","1":"번역",...}`,
              },
            ],
          },
        ],
        generationConfig: { temperature: 0.2, maxOutputTokens: 2000 },
      });

      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        batch.forEach((item, i) => {
          const tr = parsed[String(i)];
          if (tr && typeof tr === "string" && tr.length > 0) {
            translated.set(item.idx, tr);
          }
        });
      }
    } catch (error) {
      console.error("Gemini translate error:", error);
    }
  }

  // 핵심 뉴스(1위)의 summary도 번역
  const hero = articles[0];
  let heroSummary = hero?.summary || "";
  if (
    hero &&
    heroSummary &&
    heroSummary !== hero.title &&
    !koreanRegex.test(heroSummary)
  ) {
    try {
      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `아래 영문 뉴스 요약을 자연스러운 한국어로 번역하세요.

규칙:
- 고유명사(회사명, 제품명, 인물명)는 영문 유지
- 자연스러운 한국어 문장
- 원문의 핵심 내용 유지

원문: ${heroSummary}

번역된 한국어 문장만 응답하세요. JSON이나 따옴표 없이 문장만.`,
              },
            ],
          },
        ],
        generationConfig: { temperature: 0.2, maxOutputTokens: 300 },
      });
      const text = result.response.text().trim();
      if (text && text.length > 0) {
        heroSummary = text;
      }
    } catch (error) {
      console.error("Gemini hero summary translate error:", error);
    }
  }

  return articles.map((article, i) => ({
    ...article,
    title: translated.get(i) || article.title,
    ...(i === 0 && heroSummary ? { summary: heroSummary } : {}),
  }));
}
