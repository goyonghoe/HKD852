"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { TestDefinition } from "@/lib/tests/types";
import { calculateResult } from "@/lib/tests/scorer";
import ProgressBar from "@/components/ui/ProgressBar";
import QuestionRenderer from "./QuestionRenderer";

interface TestEngineProps {
  test: TestDefinition;
  slug: string;
}

export default function TestEngine({ test, slug }: TestEngineProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isTransitioning, setIsTransitioning] = useState(false);

  const questions = test.questions;
  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;

  const handleAnswer = useCallback(
    (optionId: string) => {
      if (isTransitioning) return;

      const questionId = currentQuestion.id;
      const newAnswers = { ...answers, [questionId]: optionId };
      setAnswers(newAnswers);
      setIsTransitioning(true);

      // Check if this is the last question
      const isLast = currentIndex + 1 >= totalQuestions;

      setTimeout(() => {
        if (isLast) {
          // Calculate result and redirect
          const resultId = calculateResult(
            { ...test, questions: test.questions },
            newAnswers,
          );
          router.push(`/test/${slug}/result/${resultId}`);
        } else {
          setCurrentIndex((prev) => prev + 1);
          setIsTransitioning(false);
        }
      }, 300);
    },
    [
      isTransitioning,
      currentQuestion,
      answers,
      currentIndex,
      totalQuestions,
      test,
      slug,
      router,
    ],
  );

  return (
    <div className="flex flex-col min-h-[calc(100vh-56px)]">
      {/* Progress */}
      <div className="px-4 pt-4">
        <ProgressBar
          current={currentIndex + 1}
          total={totalQuestions}
          color={test.meta.color}
        />
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col justify-center" key={currentIndex}>
        <QuestionRenderer
          question={currentQuestion}
          onAnswer={handleAnswer}
          questionNumber={currentIndex + 1}
          totalQuestions={totalQuestions}
        />
      </div>
    </div>
  );
}
