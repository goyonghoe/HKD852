import type { TestDefinition } from "./types";

// Import all test JSON files statically for SSG
// When adding a new test, just add it to this imports list and the array below
import mbtiAnimal from "@/data/tests/mbti-animal.json";
import stressType from "@/data/tests/stress-type.json";
import loveLanguage from "@/data/tests/love-language.json";
import pastLife from "@/data/tests/past-life.json";
import mentalAge from "@/data/tests/mental-age.json";
import foodType from "@/data/tests/food-type.json";
import burnout from "@/data/tests/burnout.json";
import friendType from "@/data/tests/friend-type.json";
import loveCharm from "@/data/tests/love-charm.json";
import hiddenTalent from "@/data/tests/hidden-talent.json";
import colorPsychology from "@/data/tests/color-psychology.json";
import travelStyle from "@/data/tests/travel-style.json";
import moneyType from "@/data/tests/money-type.json";
import snsPersonality from "@/data/tests/sns-personality.json";
import sleepType from "@/data/tests/sleep-type.json";

const ALL_TESTS = [
  mbtiAnimal,
  stressType,
  loveLanguage,
  pastLife,
  mentalAge,
  foodType,
  burnout,
  friendType,
  loveCharm,
  hiddenTalent,
  colorPsychology,
  travelStyle,
  moneyType,
  snsPersonality,
  sleepType,
] as unknown as TestDefinition[];

export function getAllTests(): TestDefinition[] {
  return ALL_TESTS.sort((a, b) => b.meta.popularity - a.meta.popularity);
}

export function getTestBySlug(slug: string): TestDefinition | undefined {
  return ALL_TESTS.find((t) => t.meta.slug === slug);
}

export function getTestsByCategory(category: string): TestDefinition[] {
  return ALL_TESTS.filter((t) => t.meta.category === category).sort(
    (a, b) => b.meta.popularity - a.meta.popularity,
  );
}

export function getTrendingTests(): TestDefinition[] {
  return ALL_TESTS.filter((t) => t.meta.isTrending).sort(
    (a, b) => b.meta.popularity - a.meta.popularity,
  );
}

export function getRelatedTests(slug: string, limit = 3): TestDefinition[] {
  const current = getTestBySlug(slug);
  if (!current) return getAllTests().slice(0, limit);
  return ALL_TESTS.filter(
    (t) => t.meta.slug !== slug && t.meta.category === current.meta.category,
  )
    .sort((a, b) => b.meta.popularity - a.meta.popularity)
    .slice(0, limit);
}
