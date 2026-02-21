"use client";

import { useState, useRef } from "react";

interface StepNameProps {
  value: string;
  onChange: (name: string) => void;
  onNext: () => void;
  onSkip: () => void;
}

function extractKorean(val: string): string {
  return val.replace(/[^가-힣]/g, "").slice(0, 5);
}

export default function StepName({ value, onChange, onNext, onSkip }: StepNameProps) {
  const [rawValue, setRawValue] = useState(value);
  const composingRef = useRef(false);

  const syncKorean = (raw: string) => {
    const cleaned = extractKorean(raw);
    if (cleaned !== value) {
      onChange(cleaned);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setRawValue(raw);
    // 조합 중이 아닐 때만 즉시 반영
    if (!composingRef.current) {
      syncKorean(raw);
    }
  };

  const handleCompositionStart = () => {
    composingRef.current = true;
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    composingRef.current = false;
    const raw = (e.target as HTMLInputElement).value;
    setRawValue(raw);
    syncKorean(raw);
  };

  const handleBlur = () => {
    const cleaned = extractKorean(rawValue);
    setRawValue(cleaned);
    onChange(cleaned);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !composingRef.current && value.length >= 2) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-[15px] text-text-secondary font-hand text-center leading-relaxed">
        이름도 알려줄래? 없어도 봐줌.
      </p>
      <input
        type="text"
        value={rawValue}
        onChange={handleChange}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="한글 이름 (예: 김개똥)"
        className="w-full px-4 py-4 rounded-xl bg-surface-light border border-surface-border text-text-primary text-[16px] text-center focus:border-teal/30 focus:ring-2 focus:ring-teal/10 outline-none transition-all"
        autoComplete="off"
        autoFocus
      />
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onSkip}
          className="flex-1 py-3.5 rounded-xl text-[14px] font-medium text-text-dim bg-surface-light border border-surface-border hover:border-teal/20 transition-all active:scale-[0.97]"
        >
          건너뛰기
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={value.length < 2}
          className={`flex-1 py-3.5 rounded-xl text-[14px] font-medium transition-all active:scale-[0.97] ${
            value.length >= 2
              ? "bg-teal text-bg border border-teal"
              : "bg-surface-light text-text-dim/40 border border-surface-border cursor-not-allowed"
          }`}
        >
          다음
        </button>
      </div>
    </div>
  );
}
