"use client";

import { useState, useMemo, useCallback } from "react";
import type { Task } from "@/lib/database.types";

interface YearViewProps {
  tasks: Task[];
  onMonthClick?: (year: number, month: number) => void;
}

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function YearView({ tasks, onMonthClick }: YearViewProps) {
  const [year, setYear] = useState(() => new Date().getFullYear());

  const goToday = useCallback(() => setYear(new Date().getFullYear()), []);
  const goPrev = useCallback(() => setYear((y) => y - 1), []);
  const goNext = useCallback(() => setYear((y) => y + 1), []);

  const todayKey = formatDateKey(new Date());

  // Count tasks per date for heatmap
  const taskCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const task of tasks) {
      if (!task.scheduled_date) continue;
      counts[task.scheduled_date] = (counts[task.scheduled_date] || 0) + 1;
    }
    return counts;
  }, [tasks]);

  function getHeatColor(count: number): string {
    if (count === 0) return "";
    if (count === 1) return "bg-blue-200 dark:bg-blue-900/50";
    if (count === 2) return "bg-blue-300 dark:bg-blue-800/60";
    if (count <= 4) return "bg-blue-400 dark:bg-blue-700/70";
    return "bg-blue-500 dark:bg-blue-600/80";
  }

  // Build mini calendar for each month
  function buildMonthDays(month: number) {
    const firstDay = new Date(year, month, 1);
    const startDay = firstDay.getDay();
    const mondayOffset = startDay === 0 ? -6 : 1 - startDay;
    const start = new Date(year, month, 1 + mondayOffset);
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: { date: Date; inMonth: boolean }[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      days.push({ date: d, inMonth: d.getMonth() === month });
    }

    // Trim trailing rows that are entirely outside the month
    while (days.length > 35 && days.slice(-7).every((d) => !d.inMonth)) {
      days.splice(-7);
    }

    return { days, daysInMonth };
  }

  return (
    <div className="flex flex-col h-full">
      {/* Navigation */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a]">
        <button
          onClick={goToday}
          className="text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
        >
          This Year
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={goPrev}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={goNext}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
        <span className="text-lg font-bold text-gray-800 dark:text-gray-200">
          {year}
        </span>
      </div>

      {/* 12 months grid */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 12 }, (_, month) => {
            const { days } = buildMonthDays(month);
            // Count tasks in this month
            const monthTaskCount = Object.entries(taskCounts)
              .filter(([key]) =>
                key.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`),
              )
              .reduce((sum, [, c]) => sum + c, 0);

            return (
              <div
                key={month}
                className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl p-3 cursor-pointer hover:shadow-md dark:hover:shadow-none hover:border-blue-300 dark:hover:border-blue-700 transition-all"
                onClick={() => onMonthClick?.(year, month)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {MONTH_NAMES[month]}
                  </span>
                  {monthTaskCount > 0 && (
                    <span className="text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full">
                      {monthTaskCount}
                    </span>
                  )}
                </div>

                {/* Mini calendar */}
                <div className="grid grid-cols-7 gap-px">
                  {DAY_LABELS.map((d, i) => (
                    <div
                      key={i}
                      className="text-[9px] text-center text-gray-400 dark:text-gray-600 font-medium pb-0.5"
                    >
                      {d}
                    </div>
                  ))}
                  {days.map(({ date, inMonth }, i) => {
                    const key = formatDateKey(date);
                    const count = taskCounts[key] || 0;
                    const isToday = key === todayKey;

                    return (
                      <div
                        key={i}
                        className={`text-[9px] text-center py-0.5 rounded-sm ${
                          !inMonth
                            ? "text-gray-300 dark:text-gray-700"
                            : isToday
                              ? "bg-blue-600 text-white font-bold"
                              : count > 0
                                ? `${getHeatColor(count)} text-gray-800 dark:text-gray-200 font-medium`
                                : "text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {date.getDate()}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
