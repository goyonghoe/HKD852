import { GoogleGenerativeAI } from "@google/generative-ai";
import { SajuResult, TeaserReading, FullReading } from "../saju/types";
import { buildTeaserPrompt, DOKKAEBI_SYSTEM_TEASER } from "./prompts/teaser";
import {
  buildFullReadingPrompt,
  DOKKAEBI_SYSTEM_FULL,
} from "./prompts/full-reading";
import {
  parseTeaserResponse,
  parseFullReadingResponse,
} from "./response-parser";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function generateTeaserReading(
  sajuResult: SajuResult,
): Promise<TeaserReading> {
  const prompt = buildTeaserPrompt(sajuResult);

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-pro",
    systemInstruction: DOKKAEBI_SYSTEM_TEASER,
  });

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens: 500,
      responseMimeType: "application/json",
    },
  });

  const text = result.response.text();
  return parseTeaserResponse(text);
}

export async function generateFullReading(
  sajuResult: SajuResult,
): Promise<FullReading> {
  const prompt = buildFullReadingPrompt(sajuResult);

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-pro",
    systemInstruction: DOKKAEBI_SYSTEM_FULL,
  });

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
    },
  });

  const text = result.response.text();
  return parseFullReadingResponse(text);
}
