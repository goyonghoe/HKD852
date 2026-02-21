import Anthropic from "@anthropic-ai/sdk";
import { SajuResult, TeaserReading, FullReading } from "../saju/types";
import { buildTeaserPrompt } from "./prompts/teaser";
import { buildFullReadingPrompt } from "./prompts/full-reading";
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
    max_tokens: 500,
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
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
  return parseFullReadingResponse(text);
}
