import Anthropic from "@anthropic-ai/sdk";
import { SajuResult, TeaserReading, FullReading } from "../saju/types";
import { buildTeaserPrompt, DOKKAEBI_SYSTEM_TEASER } from "./prompts/teaser";
import { buildFullReadingPrompt, DOKKAEBI_SYSTEM_FULL } from "./prompts/full-reading";
import { parseTeaserResponse, parseFullReadingResponse } from "./response-parser";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function generateTeaserReading(
  sajuResult: SajuResult
): Promise<TeaserReading> {
  const prompt = buildTeaserPrompt(sajuResult);

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    system: DOKKAEBI_SYSTEM_TEASER,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
  return parseTeaserResponse(text);
}

export async function generateFullReading(
  sajuResult: SajuResult
): Promise<FullReading> {
  const prompt = buildFullReadingPrompt(sajuResult);

  const message = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 4000,
    system: DOKKAEBI_SYSTEM_FULL,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
  return parseFullReadingResponse(text);
}
