// === Test Definition Schema ===

export type TestType = "mbti" | "score" | "binary";

export type TestCategory =
  | "personality"
  | "love"
  | "psychology"
  | "fun"
  | "career"
  | "friendship"
  | "lifestyle";

export interface TestMeta {
  slug: string;
  title: string;
  description: string;
  shortDescription: string;
  thumbnail: string;
  ogImage: string;
  category: TestCategory;
  tags: string[];
  emoji: string;
  color: string;
  colorLight: string;
  estimatedMinutes: number;
  questionCount: number;
  popularity: number;
  createdAt: string;
  isNew?: boolean;
  isTrending?: boolean;
}

// === Questions ===

export interface QuestionOption {
  id: string;
  text: string;
  emoji?: string;
  scores?: Record<string, number>;
  nextQuestionId?: string;
  resultId?: string;
}

export interface Question {
  id: string;
  text: string;
  subtitle?: string;
  emoji?: string;
  options: QuestionOption[];
}

// === Results ===

export interface TestResult {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  description: string;
  traits: string[];
  strengths: string[];
  weaknesses: string[];
  compatibility: {
    best: string;
    worst: string;
  };
  shareText: string;
  percentage?: string;
}

// === Scoring ===

export interface MbtiDimension {
  id: string;
  poles: [string, string];
  labels: [string, string];
}

export interface MbtiScoringConfig {
  type: "mbti";
  dimensions: MbtiDimension[];
}

export interface ScoreRange {
  min: number;
  max: number;
  resultId: string;
}

export interface ScoreScoringConfig {
  type: "score";
  ranges: ScoreRange[];
}

export interface BinaryScoringConfig {
  type: "binary";
}

export type ScoringConfig =
  | MbtiScoringConfig
  | ScoreScoringConfig
  | BinaryScoringConfig;

// === Complete Test Definition ===

export interface TestDefinition {
  version: number;
  meta: TestMeta;
  scoring: ScoringConfig;
  questions: Question[];
  results: TestResult[];
}
