import type { TestResult } from "@/lib/tests/types";

interface ResultDisplayProps {
  result: TestResult;
  testTitle: string;
  testColor: string;
}

export default function ResultDisplay({
  result,
  testTitle,
  testColor,
}: ResultDisplayProps) {
  return (
    <div className="px-1 py-6">
      {/* Test title */}
      <p className="text-center text-sm text-text-dim mb-6 font-bold">
        {testTitle}
      </p>

      {/* Result card */}
      <div
        className="rounded-3xl p-7 text-center mb-6 relative overflow-hidden"
        style={{ backgroundColor: `${testColor}12` }}
      >
        {/* Decorative dots */}
        <div
          className="absolute top-4 left-4 w-2 h-2 rounded-full sparkle"
          style={{ backgroundColor: `${testColor}40` }}
        />
        <div
          className="absolute top-8 right-6 w-1.5 h-1.5 rounded-full sparkle-delayed"
          style={{ backgroundColor: `${testColor}30` }}
        />
        <div
          className="absolute bottom-6 left-8 w-1.5 h-1.5 rounded-full sparkle"
          style={{ backgroundColor: `${testColor}25` }}
        />

        {/* Emoji */}
        <div className="text-7xl mb-5 animate-result-reveal">
          {result.emoji}
        </div>

        {/* Title */}
        <h1
          className="font-display text-3xl mb-3 animate-result-reveal"
          style={{ color: testColor }}
        >
          {result.title}
        </h1>

        {/* Subtitle */}
        <p className="text-text-secondary font-medium text-base mb-5 animate-fade-up">
          {result.subtitle}
        </p>

        {/* Percentage badge */}
        {result.percentage && (
          <div className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-white/80 text-sm font-bold animate-fade-up shadow-sm">
            <span style={{ color: testColor }}>{result.percentage}</span>
            <span className="text-text-dim">의 사람들이 이 결과</span>
          </div>
        )}
      </div>

      {/* Description */}
      <div className="bg-white rounded-2xl border border-surface-border p-6 mb-4 animate-fade-up shadow-sm">
        <h3 className="font-bold text-text-primary text-lg mb-3 flex items-center gap-2">
          <span>📖</span> 상세 설명
        </h3>
        <p className="text-text-secondary text-base leading-relaxed whitespace-pre-line">
          {result.description}
        </p>
      </div>

      {/* Traits */}
      {result.traits.length > 0 && (
        <div className="bg-white rounded-2xl border border-surface-border p-6 mb-4 animate-fade-up shadow-sm">
          <h3 className="font-bold text-text-primary text-lg mb-3 flex items-center gap-2">
            <span>🏷️</span> 성격 키워드
          </h3>
          <div className="flex flex-wrap gap-2">
            {result.traits.map((trait) => (
              <span
                key={trait}
                className="inline-block px-4 py-2 rounded-full text-sm font-bold"
                style={{
                  backgroundColor: `${testColor}15`,
                  color: testColor,
                }}
              >
                {trait}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-2 gap-3 mb-4 animate-fade-up">
        {/* Strengths */}
        {result.strengths.length > 0 && (
          <div className="bg-white rounded-2xl border border-surface-border p-5 shadow-sm">
            <h3 className="font-bold text-success text-base mb-3 flex items-center gap-1.5">
              <span>💪</span> 강점
            </h3>
            <ul className="space-y-2">
              {result.strengths.map((item) => (
                <li
                  key={item}
                  className="text-sm text-text-secondary flex items-start gap-1.5"
                >
                  <span className="text-success mt-0.5 flex-shrink-0 font-bold">
                    +
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Weaknesses */}
        {result.weaknesses.length > 0 && (
          <div className="bg-white rounded-2xl border border-surface-border p-5 shadow-sm">
            <h3 className="font-bold text-danger text-base mb-3 flex items-center gap-1.5">
              <span>🤔</span> 약점
            </h3>
            <ul className="space-y-2">
              {result.weaknesses.map((item) => (
                <li
                  key={item}
                  className="text-sm text-text-secondary flex items-start gap-1.5"
                >
                  <span className="text-danger mt-0.5 flex-shrink-0 font-bold">
                    -
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Compatibility */}
      {result.compatibility && (
        <div className="bg-white rounded-2xl border border-surface-border p-6 animate-fade-up shadow-sm">
          <h3 className="font-bold text-text-primary text-lg mb-3 flex items-center gap-2">
            <span>💕</span> 궁합
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-4 rounded-xl bg-success/10">
              <p className="text-sm text-text-dim mb-1">최고의 궁합</p>
              <p className="font-bold text-success">
                {result.compatibility.best}
              </p>
            </div>
            <div className="text-center p-4 rounded-xl bg-danger/10">
              <p className="text-sm text-text-dim mb-1">도전적인 궁합</p>
              <p className="font-bold text-danger">
                {result.compatibility.worst}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
