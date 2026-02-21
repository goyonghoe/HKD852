"use client";

import { useState, useCallback } from "react";
import { HanjaCharacter } from "@/lib/saju/types";
import { HANJA_MAPPINGS } from "@/lib/saju/hanja-mappings";

function isCJK(char: string): boolean {
  return /[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF]/.test(char);
}

interface StepHanjaProps {
  syllables: string[];
  selectedHanja: (HanjaCharacter | null)[];
  onHanjaChange: (hanja: (HanjaCharacter | null)[]) => void;
  onNext: () => void;
  onSkip: () => void;
}

export default function StepHanja({
  syllables,
  selectedHanja,
  onHanjaChange,
  onNext,
  onSkip,
}: StepHanjaProps) {
  const [activeSlot, setActiveSlot] = useState<number>(0);
  const [directInput, setDirectInput] = useState("");

  const handleSelect = useCallback(
    (idx: number, hanja: HanjaCharacter | null) => {
      const next = [...selectedHanja];
      next[idx] = hanja;
      onHanjaChange(next);
      setDirectInput("");
      // 선택 후 다음 빈 슬롯
      if (hanja) {
        const nextIdx = next.findIndex((h, i) => i > idx && h === null);
        if (nextIdx >= 0) {
          setActiveSlot(nextIdx);
        } else {
          setActiveSlot(-1);
        }
      }
    },
    [selectedHanja, onHanjaChange]
  );

  const handleDirectInputChange = (idx: number, value: string) => {
    setDirectInput(value);
    const cjk = Array.from(value).find(isCJK);
    if (cjk) {
      handleSelect(idx, { hanja: cjk, meaning: "직접 입력", strokes: 0 });
      setDirectInput("");
    }
  };

  const hasAnyHanja = selectedHanja.some((h) => h !== null);

  return (
    <div className="space-y-5">
      <p className="text-[15px] text-text-secondary font-hand text-center leading-relaxed">
        한자까지 알면 더 깊이 볼 수 있어.
      </p>

      {/* 슬롯 */}
      <div className="flex gap-2 justify-center">
        {syllables.map((syllable, idx) => {
          const isActive = activeSlot === idx;
          const selected = selectedHanja[idx];
          return (
            <button
              key={`${syllable}-${idx}`}
              type="button"
              onClick={() => {
                setActiveSlot(idx);
                setDirectInput("");
              }}
              className={`flex flex-col items-center px-5 py-3 rounded-xl border min-w-[64px] transition-all active:scale-[0.97] ${
                isActive
                  ? "border-teal bg-teal/10 ring-1 ring-teal/20"
                  : selected
                    ? "border-teal/30 bg-surface-light"
                    : "border-surface-border bg-surface-light hover:border-teal/20"
              }`}
            >
              <span className="text-[12px] text-text-dim">{syllable}</span>
              {selected ? (
                <span className="text-2xl text-teal mt-0.5 leading-none">{selected.hanja}</span>
              ) : (
                <span className="text-[18px] text-text-dim/30 mt-0.5">?</span>
              )}
            </button>
          );
        })}
      </div>

      {/* 확장 패널 */}
      {activeSlot >= 0 && activeSlot < syllables.length && (
        <div className="bg-surface-light/50 rounded-xl border border-surface-border p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-teal text-lg font-semibold">{syllables[activeSlot]}</span>
            <span className="text-[13px] text-text-dim">에 해당하는 한자</span>
          </div>

          <input
            type="text"
            value={directInput}
            onChange={(e) => handleDirectInputChange(activeSlot, e.target.value)}
            placeholder="한자 직접 입력 (예: 金)"
            className="w-full px-3 py-2.5 rounded-lg bg-surface border border-surface-border text-text-primary text-[14px] focus:border-teal/30 focus:ring-1 focus:ring-teal/10 outline-none transition-all"
            autoComplete="off"
          />

          {HANJA_MAPPINGS[syllables[activeSlot]] ? (
            <div className="grid grid-cols-3 gap-2">
              {HANJA_MAPPINGS[syllables[activeSlot]].map((option) => {
                const isSelected = selectedHanja[activeSlot]?.hanja === option.hanja;
                return (
                  <button
                    key={option.hanja}
                    type="button"
                    onClick={() => handleSelect(activeSlot, isSelected ? null : option)}
                    className={`p-2.5 rounded-xl border text-center transition-all active:scale-[0.97] ${
                      isSelected
                        ? "bg-teal/15 border-teal/40 ring-1 ring-teal/20"
                        : "bg-surface border-surface-border hover:border-teal/20"
                    }`}
                  >
                    <div className={`text-xl leading-none ${isSelected ? "text-teal" : "text-text-primary"}`}>
                      {option.hanja}
                    </div>
                    <div className="text-[10px] text-text-dim mt-1 leading-tight">{option.meaning}</div>
                    <div className="text-[9px] text-text-dim/60 mt-0.5">{option.strokes}획</div>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-[12px] text-text-dim text-center py-2 font-hand">
              추천 한자가 없어요. 위에서 직접 입력해주세요.
            </p>
          )}

          <button
            type="button"
            onClick={() => handleSelect(activeSlot, null)}
            className="w-full text-[12px] text-text-dim py-1.5 hover:text-text-secondary transition-colors"
          >
            이 글자 건너뛰기
          </button>
        </div>
      )}

      {/* 하단 버튼 */}
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
          className={`flex-1 py-3.5 rounded-xl text-[14px] font-medium transition-all active:scale-[0.97] ${
            hasAnyHanja
              ? "bg-teal text-bg border border-teal"
              : "bg-teal/60 text-bg/70 border border-teal/40"
          }`}
        >
          다음
        </button>
      </div>
    </div>
  );
}
