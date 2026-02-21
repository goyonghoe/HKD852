"use client";

import { useState, useCallback, useRef } from "react";
import { NameInfo, HanjaCharacter } from "@/lib/saju/types";
import { HANJA_MAPPINGS, splitKoreanName } from "@/lib/saju/hanja-mappings";

interface NameInputProps {
  onNameChange: (nameInfo: NameInfo | undefined) => void;
}

/** 완성된 한글 음절만 추출 */
function extractKorean(val: string): string {
  return val.replace(/[^가-힣]/g, "").slice(0, 5);
}

/** CJK 한자 문자 판별 */
function isCJK(char: string): boolean {
  return /[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF]/.test(char);
}

export default function NameInput({ onNameChange }: NameInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [splitResult, setSplitResult] = useState<{
    familyName: string;
    givenNameSyllables: string[];
  } | null>(null);
  const [selectedHanja, setSelectedHanja] = useState<(HanjaCharacter | null)[]>([]);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [directInput, setDirectInput] = useState("");
  const lastKoreanRef = useRef("");

  const koreanName = lastKoreanRef.current;
  const allSyllables = koreanName.length >= 2 ? koreanName.split("") : [];

  const processName = useCallback((name: string) => {
    if (name.length >= 2) {
      const split = splitKoreanName(name);
      setSplitResult(split);
      if (split) {
        setSelectedHanja(new Array(name.length).fill(null));
        setActiveSlot(null);
        setDirectInput("");
        onNameChange({
          koreanName: name,
          familyName: split.familyName,
          givenNameSyllables: split.givenNameSyllables,
          selectedHanja: undefined,
        });
      }
    } else {
      setSplitResult(null);
      setSelectedHanja([]);
      setActiveSlot(null);
      setDirectInput("");
      onNameChange(undefined);
    }
  }, [onNameChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputValue(raw);
    const korean = extractKorean(raw);
    if (korean !== lastKoreanRef.current) {
      lastKoreanRef.current = korean;
      processName(korean);
    }
  };

  const handleBlur = () => {
    const cleaned = extractKorean(inputValue);
    setInputValue(cleaned);
    lastKoreanRef.current = cleaned;
  };

  const updateParent = useCallback((hanjaArr: (HanjaCharacter | null)[]) => {
    if (!splitResult) return;
    const valid = hanjaArr.filter((h): h is HanjaCharacter => h !== null);
    onNameChange({
      koreanName: lastKoreanRef.current,
      familyName: splitResult.familyName,
      givenNameSyllables: splitResult.givenNameSyllables,
      selectedHanja: valid.length > 0 ? valid : undefined,
    });
  }, [splitResult, onNameChange]);

  const handleHanjaSelect = useCallback((idx: number, hanja: HanjaCharacter | null) => {
    setSelectedHanja(prev => {
      const next = [...prev];
      next[idx] = hanja;
      updateParent(next);
      // 선택 후 다음 빈 슬롯으로 자동 이동
      if (hanja) {
        const nextIdx = next.findIndex((h, i) => i > idx && h === null);
        setActiveSlot(nextIdx >= 0 ? nextIdx : null);
      }
      return next;
    });
    setDirectInput("");
  }, [updateParent]);

  const handleDirectInputChange = (idx: number, value: string) => {
    setDirectInput(value);
    const cjk = Array.from(value).find(isCJK);
    if (cjk) {
      handleHanjaSelect(idx, { hanja: cjk, meaning: "직접 입력", strokes: 0 });
      setDirectInput("");
    }
  };

  const handleSlotTap = (idx: number) => {
    setActiveSlot(activeSlot === idx ? null : idx);
    setDirectInput("");
  };

  const handleSkipAll = useCallback(() => {
    setSelectedHanja(prev => prev.map(() => null));
    setActiveSlot(null);
    setDirectInput("");
    if (splitResult) {
      onNameChange({
        koreanName: lastKoreanRef.current,
        familyName: splitResult.familyName,
        givenNameSyllables: splitResult.givenNameSyllables,
        selectedHanja: undefined,
      });
    }
  }, [splitResult, onNameChange]);

  const handleClear = () => {
    setInputValue("");
    setSplitResult(null);
    setSelectedHanja([]);
    setActiveSlot(null);
    setDirectInput("");
    lastKoreanRef.current = "";
    onNameChange(undefined);
  };

  const inputClass = "w-full px-3 py-3.5 rounded-xl bg-surface-light border border-surface-border text-text-primary focus:border-teal/30 focus:ring-2 focus:ring-teal/10 outline-none transition-all text-[15px]";

  return (
    <div className="space-y-4">
      {/* 한글 이름 입력 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[13px] font-semibold text-text-secondary">
            이름 <span className="text-text-dim font-normal">(없어도 봐줌)</span>
          </label>
          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              className="text-[11px] text-text-dim hover:text-ember transition-colors"
            >
              지우기
            </button>
          )}
        </div>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder="한글 이름 (예: 김영수)"
          className={inputClass}
          autoComplete="off"
        />
        {splitResult && (
          <p className="text-[11px] text-text-dim mt-1.5 font-hand">
            {splitResult.familyName} + {splitResult.givenNameSyllables.join(" + ")}
          </p>
        )}
      </div>

      {/* 한자 선택 — 전체 글자 슬롯 */}
      {allSyllables.length >= 2 && (
        <div className="bg-surface-light/50 rounded-xl border border-surface-border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-text-secondary">
              한자 <span className="text-text-dim font-normal">(몰라도 됨)</span>
            </p>
            <button
              type="button"
              onClick={handleSkipAll}
              className="text-[12px] text-teal hover:text-teal-light transition-colors font-medium"
            >
              전부 건너뛰기
            </button>
          </div>

          {/* 글자별 슬롯 */}
          <div className="flex gap-2 justify-center flex-wrap">
            {allSyllables.map((syllable, idx) => {
              const isActive = activeSlot === idx;
              const selected = selectedHanja[idx];

              return (
                <button
                  key={`${syllable}-${idx}`}
                  type="button"
                  onClick={() => handleSlotTap(idx)}
                  className={`flex flex-col items-center px-4 py-2.5 rounded-xl border min-w-[64px] transition-all active:scale-[0.97] ${
                    isActive
                      ? "border-teal bg-teal/10 ring-1 ring-teal/20"
                      : selected
                        ? "border-teal/30 bg-surface-light"
                        : "border-surface-border bg-surface-light hover:border-teal/20"
                  }`}
                >
                  <span className="text-[11px] text-text-dim">{syllable}</span>
                  {selected ? (
                    <span className="text-xl text-teal mt-0.5 leading-none">{selected.hanja}</span>
                  ) : (
                    <span className="text-[15px] text-text-dim/30 mt-0.5">?</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 선택된 슬롯 확장 패널 */}
          {activeSlot !== null && activeSlot < allSyllables.length && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-teal text-lg font-semibold">{allSyllables[activeSlot]}</span>
                <span className="text-[13px] text-text-dim">에 해당하는 한자</span>
              </div>

              {/* 직접 입력 */}
              <input
                type="text"
                value={directInput}
                onChange={(e) => handleDirectInputChange(activeSlot, e.target.value)}
                placeholder="한자 직접 입력 (예: 金)"
                className="w-full px-3 py-2.5 rounded-lg bg-surface border border-surface-border text-text-primary text-[14px] focus:border-teal/30 focus:ring-1 focus:ring-teal/10 outline-none transition-all"
                autoComplete="off"
              />

              {/* 추천 한자 그리드 */}
              {HANJA_MAPPINGS[allSyllables[activeSlot]] ? (
                <div className="grid grid-cols-3 gap-2">
                  {HANJA_MAPPINGS[allSyllables[activeSlot]].map((option) => {
                    const isSelected = selectedHanja[activeSlot]?.hanja === option.hanja;
                    return (
                      <button
                        key={option.hanja}
                        type="button"
                        onClick={() => handleHanjaSelect(activeSlot, isSelected ? null : option)}
                        className={`p-2.5 rounded-xl border text-center transition-all active:scale-[0.97] ${
                          isSelected
                            ? "bg-teal/15 border-teal/40 ring-1 ring-teal/20"
                            : "bg-surface border-surface-border hover:border-teal/20"
                        }`}
                      >
                        <div className={`text-xl leading-none ${isSelected ? "text-teal" : "text-text-primary"}`}>
                          {option.hanja}
                        </div>
                        <div className="text-[10px] text-text-dim mt-1 leading-tight">
                          {option.meaning}
                        </div>
                        <div className="text-[9px] text-text-dim/60 mt-0.5">
                          {option.strokes}획
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[12px] text-text-dim text-center py-2 font-hand">
                  추천 한자가 없어요. 위에서 직접 입력해주세요.
                </p>
              )}

              {/* 이 글자 건너뛰기 */}
              <button
                type="button"
                onClick={() => handleHanjaSelect(activeSlot, null)}
                className="w-full text-[12px] text-text-dim py-1.5 hover:text-text-secondary transition-colors"
              >
                이 글자 건너뛰기
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
