"use client";

import { useState, useMemo, useCallback } from "react";
import type { Task } from "@/lib/database.types";

interface MonthViewProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDayClick?: (date: Date) => void;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const priorityDot: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  mid: "bg-blue-500",
  low: "bg-gray-400",
};

export default function MonthView({
  tasks,
  onEditTask,
  onDayClick,
}: MonthViewProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const goToday = useCallback(() => setCurrentDate(new Date()), []);
  const goPrev = useCallback(
    () =>
      setCurrentDate((prev) => {
        const d = new Date(prev);
        d.setMonth(d.getMonth() - 1);
        return d;
      }),
    [],
  );
  const goNext = useCallback(
    () =>
      setCurrentDate((prev) => {
        const d = new Date(prev);
        d.setMonth(d.getMonth() + 1);
        return d;
      }),
    [],
  );

  // Build calendar grid (6 weeks x 7 days)
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const startDay = firstDay.getDay(); // 0=Sun
    const mondayOffset = startDay === 0 ? -6 : 1 - startDay;
    const start = new Date(year, month, 1 + mondayOffset);

    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, [year, month]);

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const task of tasks) {
      if (!task.scheduled_date) continue;
      if (!map[task.scheduled_date]) map[task.scheduled_date] = [];
      map[task.scheduled_date].push(task);
    }
    return map;
  }, [tasks]);

  const todayKey = formatDateKey(new Date());

  return (
    <div className="flex flex-col h-full">
      {/* Navigation */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a]">
        <button
          onClick={goToday}
          className="text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
        >
          Today
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
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          {MONTH_NAMES[month]} {year}
        </span>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-auto">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] sticky top-0 z-10">
          {DAY_LABELS.map((label) => (
            <div
              key={label}
              className="text-center py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-r border-gray-100 dark:border-gray-800 last:border-r-0"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div
          className="grid grid-cols-7 auto-rows-fr"
          style={{ minHeight: "calc(100% - 36px)" }}
        >
          {calendarDays.map((date, i) => {
            const key = formatDateKey(date);
            const isCurrentMonth = date.getMonth() === month;
            const isToday = key === todayKey;
            const dayTasks = tasksByDate[key] || [];

            return (
              <div
                key={i}
                className={`border-r border-b border-gray-100 dark:border-gray-800 min-h-[100px] sm:min-h-[120px] p-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                  !isCurrentMonth
                    ? "bg-gray-50/50 dark:bg-gray-900/30"
                    : "bg-white dark:bg-[#111]"
                } ${i % 7 === 6 ? "border-r-0" : ""}`}
                onClick={() => onDayClick?.(date)}
              >
                <div
                  className={`text-xs font-medium mb-1 ${
                    isToday
                      ? "bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center"
                      : isCurrentMonth
                        ? "text-gray-800 dark:text-gray-200"
                        : "text-gray-400 dark:text-gray-600"
                  }`}
                >
                  {date.getDate()}
                </div>
                <div className="space-y-0.5">
                  {dayTasks.slice(0, 3).map((task) => (
                    <button
                      key={task.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditTask(task);
                      }}
                      className={`block w-full text-left text-[10px] sm:text-[11px] font-medium rounded px-1 py-0.5 truncate cursor-pointer transition-colors ${
                        task.status === "done"
                          ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 line-through"
                          : "bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800/40"
                      }`}
                    >
                      <span
                        className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${priorityDot[task.priority || ""] || "bg-blue-400"}`}
                      />
                      {task.title}
                    </button>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-[10px] text-gray-400 dark:text-gray-500 pl-1">
                      +{dayTasks.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
