import type {
  TestDefinition,
  MbtiScoringConfig,
  ScoreScoringConfig,
} from "./types";

export function calculateResult(
  test: TestDefinition,
  answers: Record<string, string>,
): string {
  switch (test.scoring.type) {
    case "mbti":
      return calculateMbtiResult(test, answers);
    case "score":
      return calculateScoreResult(test, answers);
    case "binary":
      return calculateBinaryResult(test, answers);
  }
}

function calculateMbtiResult(
  test: TestDefinition,
  answers: Record<string, string>,
): string {
  const config = test.scoring as MbtiScoringConfig;
  const scores: Record<string, number> = {};

  for (const dim of config.dimensions) {
    scores[dim.poles[0]] = 0;
    scores[dim.poles[1]] = 0;
  }

  for (const [qId, optId] of Object.entries(answers)) {
    const question = test.questions.find((q) => q.id === qId);
    const option = question?.options.find((o) => o.id === optId);
    if (option?.scores) {
      for (const [key, val] of Object.entries(option.scores)) {
        scores[key] = (scores[key] || 0) + val;
      }
    }
  }

  let resultId = "";
  for (const dim of config.dimensions) {
    const [a, b] = dim.poles;
    resultId += scores[a] >= scores[b] ? a : b;
  }

  return resultId;
}

function calculateScoreResult(
  test: TestDefinition,
  answers: Record<string, string>,
): string {
  const config = test.scoring as ScoreScoringConfig;
  let total = 0;

  for (const [qId, optId] of Object.entries(answers)) {
    const question = test.questions.find((q) => q.id === qId);
    const option = question?.options.find((o) => o.id === optId);
    if (option?.scores?.score) {
      total += option.scores.score;
    }
  }

  const range = config.ranges.find((r) => total >= r.min && total <= r.max);
  return range?.resultId || config.ranges[config.ranges.length - 1].resultId;
}

function calculateBinaryResult(
  test: TestDefinition,
  answers: Record<string, string>,
): string {
  const questionIds = Object.keys(answers);
  const lastQId = questionIds[questionIds.length - 1];
  const lastOptId = answers[lastQId];
  const question = test.questions.find((q) => q.id === lastQId);
  const option = question?.options.find((o) => o.id === lastOptId);
  return option?.resultId || test.results[0].id;
}
