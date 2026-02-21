"use client";

import { useMemo } from "react";

const CURRENT_YEAR = 2026;
const START_YEAR = 1920;

function getDaysInMonth(year: number, month: number): number {
  if (!year || !month) return 31;
  return new Date(year, month, 0).getDate();
}

interface StepBirthdateProps {
  year: string;
  month: string;
  day: string;
  isLunar: boolean;
  onYearChange: (v: string) => void;
  onMonthChange: (v: string) => void;
  onDayChange: (v: string) => void;
  onLunarToggle: () => void;
  onNext: () => void;
}

export default function StepBirthdate({
  year,
  month,
  day,
  isLunar,
  onYearChange,
  onMonthChange,
  onDayChange,
  onLunarToggle,
  onNext,
}: StepBirthdateProps) {
  const daysInMonth = useMemo(
    () => getDaysInMonth(parseInt(year) || 0, parseInt(month) || 0),
    [year, month]
  );
  const effectiveDay = day && parseInt(day) > daysInMonth ? "" : day;
  const isValid = year && month && effectiveDay;

  const selectBase =
    "form-select w-full px-3 py-3.5 rounded-xl bg-surface-light border border-surface-border text-text-primary focus:border-teal/30 focus:ring-2 focus:ring-teal/10 outline-none transition-all text-[15px] pr-8";

  return (
    <div className="space-y-5">
      <p className="text-[15px] text-text-secondary font-hand text-center leading-relaxed">
        태어난 날 알려줘. 음력이면 음력으로.
      </p>

      <div className="flex gap-2">
        <select value={year} onChange={(e) => onYearChange(e.target.value)} className={`flex-[1.2] min-w-0 ${selectBase}`}>
          <option value="">년</option>
          {Array.from({ length: CURRENT_YEAR - START_YEAR + 1 }, (_, i) => CURRENT_YEAR - i).map((y) => (
            <option key={y} value={String(y)}>{y}</option>
          ))}
        </select>
        <select value={month} onChange={(e) => onMonthChange(e.target.value)} className={`flex-[0.8] min-w-0 ${selectBase}`}>
          <option value="">월</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={String(m)}>{m}월</option>
          ))}
        </select>
        <select value={effectiveDay} onChange={(e) => onDayChange(e.target.value)} className={`flex-[0.8] min-w-0 ${selectBase}`}>
          <option value="">일</option>
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
            <option key={d} value={String(d)}>{d}일</option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={onLunarToggle}
          className={`text-[13px] px-4 py-1.5 rounded-full transition-all font-medium ${
            isLunar
              ? "bg-teal text-bg"
              : "bg-surface-light text-text-dim border border-surface-border"
          }`}
        >
          {isLunar ? "음력" : "양력"}
        </button>
        <span className="text-[11px] text-text-dim">탭해서 바꿔봐</span>
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={!isValid}
        className={`w-full py-3.5 rounded-xl text-[15px] font-medium transition-all active:scale-[0.97] ${
          isValid
            ? "bg-teal text-bg border border-teal"
            : "bg-surface-light text-text-dim/40 border border-surface-border cursor-not-allowed"
        }`}
      >
        다음
      </button>
    </div>
  );
}
