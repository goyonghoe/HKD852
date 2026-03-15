"use client";

import type { Question } from "@/lib/tests/types";

interface QuestionRendererProps {
  question: Question;
  onAnswer: (optionId: string) => void;
  questionNumber: number;
  totalQuestions: number;
}

export default function QuestionRenderer({
  question,
  onAnswer,
  questionNumber,
  totalQuestions,
}: QuestionRendererProps) {
  return (
    <div className="animate-question-in px-5 py-6">
      {/* Question header */}
      <div className="text-center mb-8">
        {question.emoji && (
          <div className="text-6xl mb-5">{question.emoji}</div>
        )}
        <p className="text-sm text-text-dim mb-3 font-bold">
          Q{questionNumber} / {totalQuestions}
        </p>
        <h2 className="font-fun text-2xl text-text-primary leading-relaxed text-balance">
          {question.text}
        </h2>
        {question.subtitle && (
          <p className="text-base text-text-secondary mt-3">
            {question.subtitle}
          </p>
        )}
      </div>

      {/* Options */}
      <div className="flex flex-col gap-3">
        {question.options.map((option) => (
          <button
            key={option.id}
            onClick={() => onAnswer(option.id)}
            className="w-full text-left px-5 py-4.5 rounded-2xl border-2 border-surface-border
                       bg-white font-medium text-text-primary
                       hover:border-primary hover:bg-primary-bg
                       active:scale-[0.98] active:animate-option-pulse
                       transition-all duration-200 min-h-[56px]"
          >
            <div className="flex items-center gap-3">
              {option.emoji && (
                <span className="text-2xl flex-shrink-0">{option.emoji}</span>
              )}
              <span className="text-base leading-snug">{option.text}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
