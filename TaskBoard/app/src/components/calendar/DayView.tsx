"use client";

import { useState, useMemo, useCallback } from "react";
import type { Task } from "@/lib/database.types";
import TimeBlock from "./TimeBlock";

interface DayViewProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  initialDate?: Date;
}

const HOUR_HEIGHT = 60;
const START_HOUR = 6;
const END_HOUR = 23;
const HOURS = Array.from(
  { length: END_HOUR - START_HOUR },
  (_, i) => START_HOUR + i,
);

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
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

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

export default function DayView({
  tasks,
  onEditTask,
  initialDate,
}: DayViewProps) {
  const [currentDate, setCurrentDate] = useState(
    () => initialDate || new Date(),
  );

  const dateKey = formatDateKey(currentDate);
  const todayKey = formatDateKey(new Date());
  const isToday = dateKey === todayKey;

  const goToday = useCallback(() => setCurrentDate(new Date()), []);
  const goPrev = useCallback(
    () =>
      setCurrentDate((prev) => {
        const d = new Date(prev);
        d.setDate(d.getDate() - 1);
        return d;
      }),
    [],
  );
  const goNext = useCallback(
    () =>
      setCurrentDate((prev) => {
        const d = new Date(prev);
        d.setDate(d.getDate() + 1);
        return d;
      }),
    [],
  );

  const { allDay, timed } = useMemo(() => {
    const allDay: Task[] = [];
    const timed: Task[] = [];
    for (const task of tasks) {
      if (task.scheduled_date !== dateKey) continue;
      if (task.scheduled_start && task.scheduled_end) {
        timed.push(task);
      } else {
        allDay.push(task);
      }
    }
    return { allDay, timed };
  }, [tasks, dateKey]);

  // Unscheduled tasks for today
  const unscheduled = useMemo(() => {
    if (!isToday) return [];
    return tasks.filter(
      (t) =>
        !t.scheduled_date &&
        (t.status === "today" || t.status === "in_progress"),
    );
  }, [tasks, isToday]);

  const dayLabel = `${DAY_NAMES[currentDate.getDay()]}, ${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;

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
          {dayLabel}
        </span>
        {isToday && (
          <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
            Today
          </span>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        {/* All-day & Unscheduled section */}
        {(allDay.length > 0 || unscheduled.length > 0) && (
          <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 px-4 py-2">
            {allDay.length > 0 && (
              <div className="mb-2">
                <div className="text-[10px] font-medium text-gray-400 dark:text-gray-500 mb-1">
                  ALL DAY
                </div>
                <div className="space-y-1">
                  {allDay.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => onEditTask(task)}
                      className="block w-full text-left text-sm font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-lg px-3 py-2 hover:bg-blue-100 dark:hover:bg-blue-800/40"
                    >
                      {task.title}
                      {task.priority && (
                        <span className="ml-2 text-xs opacity-60">
                          {task.priority}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {unscheduled.length > 0 && (
              <div>
                <div className="text-[10px] font-medium text-gray-400 dark:text-gray-500 mb-1">
                  UNSCHEDULED
                </div>
                <div className="space-y-1">
                  {unscheduled.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => onEditTask(task)}
                      className="block w-full text-left text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg px-3 py-2 hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                      {task.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Time grid */}
        <div className="grid grid-cols-[60px_1fr]">
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

          <div
            className={`relative ${isToday ? "bg-blue-50/20 dark:bg-blue-900/5" : ""}`}
          >
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="border-t border-gray-100 dark:border-gray-800"
                style={{ height: `${HOUR_HEIGHT}px` }}
              />
            ))}

            {/* Current time indicator */}
            {isToday &&
              (() => {
                const now = new Date();
                const nowMin = now.getHours() * 60 + now.getMinutes();
                const offset = nowMin - START_HOUR * 60;
                if (offset < 0 || offset > (END_HOUR - START_HOUR) * 60)
                  return null;
                const topPx = (offset / 60) * HOUR_HEIGHT;
                return (
                  <div
                    className="absolute left-0 right-0 z-20"
                    style={{ top: `${topPx}px` }}
                  >
                    <div className="flex items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1" />
                      <div className="flex-1 h-[2px] bg-red-500" />
                    </div>
                  </div>
                );
              })()}

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
        </div>
      </div>
    </div>
  );
}
