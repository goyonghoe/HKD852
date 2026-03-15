"use client";

import { useState, useMemo, useCallback } from "react";
import type { Task } from "@/lib/database.types";
import TimeBlock from "./TimeBlock";

interface WeekViewProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
}

const HOUR_HEIGHT = 56;
const START_HOUR = 8;
const END_HOUR = 22;
const HOURS = Array.from(
  { length: END_HOUR - START_HOUR },
  (_, i) => START_HOUR + i,
);
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatMonthDay(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

export default function WeekView({ tasks, onEditTask }: WeekViewProps) {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));

  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const todayKey = formatDateKey(new Date());

  const goToday = useCallback(() => setWeekStart(getMonday(new Date())), []);
  const goPrev = useCallback(
    () =>
      setWeekStart((prev) => {
        const d = new Date(prev);
        d.setDate(d.getDate() - 7);
        return d;
      }),
    [],
  );
  const goNext = useCallback(
    () =>
      setWeekStart((prev) => {
        const d = new Date(prev);
        d.setDate(d.getDate() + 7);
        return d;
      }),
    [],
  );

  const tasksByDate = useMemo(() => {
    const map: Record<string, { allDay: Task[]; timed: Task[] }> = {};
    for (const d of weekDates) {
      map[formatDateKey(d)] = { allDay: [], timed: [] };
    }
    for (const task of tasks) {
      if (!task.scheduled_date) continue;
      const bucket = map[task.scheduled_date];
      if (!bucket) continue;
      if (task.scheduled_start && task.scheduled_end) {
        bucket.timed.push(task);
      } else {
        bucket.allDay.push(task);
      }
    }
    return map;
  }, [tasks, weekDates]);

  const hasAllDay = useMemo(
    () => Object.values(tasksByDate).some((b) => b.allDay.length > 0),
    [tasksByDate],
  );

  const weekLabel = useMemo(() => {
    const s = weekDates[0];
    const e = weekDates[6];
    const sameMonth = s.getMonth() === e.getMonth();
    const monthNames = [
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
    if (sameMonth) {
      return `${monthNames[s.getMonth()]} ${s.getDate()} - ${e.getDate()}, ${s.getFullYear()}`;
    }
    return `${monthNames[s.getMonth()]} ${s.getDate()} - ${monthNames[e.getMonth()]} ${e.getDate()}, ${s.getFullYear()}`;
  }, [weekDates]);

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
          {weekLabel}
        </span>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-[800px]">
          {/* Day headers */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] sticky top-0 z-10 bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-gray-800">
            <div className="border-r border-gray-100 dark:border-gray-800" />
            {weekDates.map((date, i) => {
              const key = formatDateKey(date);
              const isToday = key === todayKey;
              return (
                <div
                  key={key}
                  className={`text-center py-2 border-r border-gray-100 dark:border-gray-800 ${i === 6 ? "border-r-0" : ""}`}
                >
                  <div
                    className={`text-xs font-medium ${isToday ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}`}
                  >
                    {DAY_LABELS[i]}
                  </div>
                  <div
                    className={`text-sm font-semibold mt-0.5 ${
                      isToday
                        ? "bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center mx-auto"
                        : "text-gray-800 dark:text-gray-200"
                    }`}
                  >
                    {formatMonthDay(date)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* All-day row */}
          {hasAllDay && (
            <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
              <div className="text-[10px] text-gray-400 dark:text-gray-500 text-right pr-2 pt-1 border-r border-gray-100 dark:border-gray-800">
                All day
              </div>
              {weekDates.map((date, i) => {
                const key = formatDateKey(date);
                const allDay = tasksByDate[key]?.allDay || [];
                return (
                  <div
                    key={key}
                    className={`min-h-[32px] p-0.5 border-r border-gray-100 dark:border-gray-800 ${i === 6 ? "border-r-0" : ""}`}
                  >
                    {allDay.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => onEditTask(task)}
                        className="block w-full text-left text-[11px] font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 rounded px-1.5 py-0.5 mb-0.5 truncate hover:bg-blue-200 dark:hover:bg-blue-800/50 cursor-pointer"
                      >
                        {task.title}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {/* Time grid */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)]">
            <div className="border-r border-gray-100 dark:border-gray-800">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="text-[11px] text-gray-400 dark:text-gray-500 text-right pr-2 relative"
                  style={{ height: `${HOUR_HEIGHT}px` }}
                >
                  <span className="absolute -top-[7px] right-2">
                    {String(hour).padStart(2, "0")}:00
                  </span>
                </div>
              ))}
            </div>

            {weekDates.map((date, i) => {
              const key = formatDateKey(date);
              const isToday = key === todayKey;
              const timed = tasksByDate[key]?.timed || [];

              return (
                <div
                  key={key}
                  className={`relative border-r border-gray-100 dark:border-gray-800 ${i === 6 ? "border-r-0" : ""} ${isToday ? "bg-blue-50/30 dark:bg-blue-900/10" : ""}`}
                >
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="border-t border-gray-100 dark:border-gray-800"
                      style={{ height: `${HOUR_HEIGHT}px` }}
                    />
                  ))}
                  {timed.map((task) => {
                    const startMin = timeToMinutes(task.scheduled_start!);
                    const endMin = timeToMinutes(task.scheduled_end!);
                    const startOffset = startMin - START_HOUR * 60;
                    const duration = endMin - startMin;
                    const topPx = (startOffset / 60) * HOUR_HEIGHT;
                    const heightPx = (duration / 60) * HOUR_HEIGHT;
                    return (
                      <TimeBlock
                        key={task.id}
                        task={task}
                        topPx={topPx}
                        heightPx={heightPx}
                        onClick={onEditTask}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
