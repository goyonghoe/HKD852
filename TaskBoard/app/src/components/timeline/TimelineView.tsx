"use client";

import { useMemo, useRef } from "react";
import type { Task, TaskStatus } from "@/lib/database.types";

interface TimelineViewProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
}

const STATUS_ORDER: TaskStatus[] = [
  "in_progress",
  "today",
  "thisweek",
  "backlog",
  "waiting",
  "done",
];

const STATUS_LABELS: Record<TaskStatus, string> = {
  in_progress: "In Progress",
  today: "Today",
  thisweek: "This Week",
  backlog: "Backlog",
  waiting: "Waiting",
  done: "Done",
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  backlog: "bg-gray-400 dark:bg-gray-500",
  thisweek: "bg-indigo-500 dark:bg-indigo-400",
  today: "bg-amber-500 dark:bg-amber-400",
  in_progress: "bg-blue-500 dark:bg-blue-400",
  waiting: "bg-orange-500 dark:bg-orange-400",
  done: "bg-green-500 dark:bg-green-400",
};

const STATUS_BAR_HOVER: Record<TaskStatus, string> = {
  backlog: "hover:bg-gray-500 dark:hover:bg-gray-400",
  thisweek: "hover:bg-indigo-600 dark:hover:bg-indigo-300",
  today: "hover:bg-amber-600 dark:hover:bg-amber-300",
  in_progress: "hover:bg-blue-600 dark:hover:bg-blue-300",
  waiting: "hover:bg-orange-600 dark:hover:bg-orange-300",
  done: "hover:bg-green-600 dark:hover:bg-green-300",
};

const COL_WIDTH = 48;
const LABEL_WIDTH = 200;
const ROW_HEIGHT = 32;

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const msA = new Date(a + "T00:00:00").getTime();
  const msB = new Date(b + "T00:00:00").getTime();
  return Math.round((msB - msA) / 86400000);
}

function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

export default function TimelineView({ tasks, onEditTask }: TimelineViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Generate date range: today-3 to today+10 (14 days)
  const { dates, todayStr } = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayStr = toDateStr(today);
    const dates: Date[] = [];
    for (let i = -3; i <= 10; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
    return { dates, todayStr };
  }, []);

  const startDateStr = toDateStr(dates[0]);

  // Group tasks by status, separate dated vs undated
  const { groupedDated, undatedTasks } = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      in_progress: [],
      today: [],
      thisweek: [],
      backlog: [],
      waiting: [],
      done: [],
    };
    const undated: Task[] = [];

    for (const task of tasks) {
      const hasDate =
        task.scheduled_date || task.scheduled_start || task.scheduled_end;
      if (hasDate) {
        grouped[task.status].push(task);
      } else {
        undated.push(task);
      }
    }

    // Filter out empty groups
    const groupedDated: { status: TaskStatus; tasks: Task[] }[] = [];
    for (const status of STATUS_ORDER) {
      if (grouped[status].length > 0) {
        // Sort tasks by their earliest date
        grouped[status].sort((a, b) => {
          const aDate = a.scheduled_start || a.scheduled_date || "9999";
          const bDate = b.scheduled_start || b.scheduled_date || "9999";
          return aDate.localeCompare(bDate);
        });
        groupedDated.push({ status, tasks: grouped[status] });
      }
    }

    return { groupedDated, undatedTasks: undated };
  }, [tasks]);

  // Calculate bar position for a task
  const getBarStyle = (task: Task) => {
    const start = task.scheduled_start || task.scheduled_date;
    const end = task.scheduled_end || task.scheduled_date;
    if (!start) return null;

    const startOffset = daysBetween(startDateStr, start);
    const endOffset = end ? daysBetween(startDateStr, end) : startOffset;

    // Clamp to visible range
    const visibleStart = Math.max(0, startOffset);
    const visibleEnd = Math.min(dates.length - 1, endOffset);

    if (visibleStart > dates.length - 1 || visibleEnd < 0) return null;

    const left = visibleStart * COL_WIDTH;
    const width = Math.max((visibleEnd - visibleStart + 1) * COL_WIDTH - 4, 8);
    const isSingleDay = start === (end || start);

    return { left, width, isSingleDay };
  };

  const totalGridWidth = dates.length * COL_WIDTH;

  // Count all rows for vertical lines
  let totalRows = 0;
  for (const group of groupedDated) {
    totalRows += 1 + group.tasks.length; // header + tasks
  }
  if (undatedTasks.length > 0) {
    totalRows += 1 + undatedTasks.length;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable container */}
      <div className="flex-1 overflow-auto" ref={scrollRef}>
        <div className="flex min-w-max">
          {/* Left: Fixed labels */}
          <div
            className="flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a1a] sticky left-0 z-10"
            style={{ width: LABEL_WIDTH }}
          >
            {/* Date header spacer */}
            <div className="h-14 border-b border-gray-200 dark:border-gray-700 flex items-end px-3 pb-1">
              <span className="text-xs text-gray-400 dark:text-gray-500">
                Tasks
              </span>
            </div>

            {/* Task labels */}
            {groupedDated.map(({ status, tasks: groupTasks }) => (
              <div key={status}>
                {/* Group header */}
                <div
                  className="flex items-center px-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50"
                  style={{ height: ROW_HEIGHT }}
                >
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {STATUS_LABELS[status]}
                    <span className="ml-1.5 text-gray-400 dark:text-gray-500 font-normal">
                      {groupTasks.length}
                    </span>
                  </span>
                </div>
                {/* Task rows */}
                {groupTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center px-3 border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    style={{ height: ROW_HEIGHT }}
                    onClick={() => onEditTask(task)}
                  >
                    <span className="text-xs text-gray-700 dark:text-gray-300 truncate">
                      <span className="text-gray-400 dark:text-gray-500">
                        #{task.task_number}
                      </span>{" "}
                      {task.title}
                    </span>
                  </div>
                ))}
              </div>
            ))}

            {/* No Date section */}
            {undatedTasks.length > 0 && (
              <div>
                <div
                  className="flex items-center px-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50"
                  style={{ height: ROW_HEIGHT }}
                >
                  <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                    No Date
                    <span className="ml-1.5 font-normal">
                      {undatedTasks.length}
                    </span>
                  </span>
                </div>
                {undatedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center px-3 border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    style={{ height: ROW_HEIGHT }}
                    onClick={() => onEditTask(task)}
                  >
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      <span className="text-gray-400 dark:text-gray-500">
                        #{task.task_number}
                      </span>{" "}
                      {task.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Date grid + bars */}
          <div className="flex-1">
            {/* Date header */}
            <div
              className="flex border-b border-gray-200 dark:border-gray-700 h-14 sticky top-0 bg-white dark:bg-[#1a1a1a] z-10"
              style={{ width: totalGridWidth }}
            >
              {dates.map((d) => {
                const ds = toDateStr(d);
                const isToday = ds === todayStr;
                const isWE = isWeekend(d);
                const dayNames = [
                  "Sun",
                  "Mon",
                  "Tue",
                  "Wed",
                  "Thu",
                  "Fri",
                  "Sat",
                ];
                return (
                  <div
                    key={ds}
                    className={`flex flex-col items-center justify-end pb-1 border-r border-gray-100 dark:border-gray-800 ${
                      isToday
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : isWE
                          ? "bg-gray-50 dark:bg-gray-900/30"
                          : ""
                    }`}
                    style={{ width: COL_WIDTH }}
                  >
                    <span
                      className={`text-[10px] leading-tight ${
                        isToday
                          ? "text-blue-600 dark:text-blue-400 font-semibold"
                          : "text-gray-400 dark:text-gray-500"
                      }`}
                    >
                      {dayNames[d.getDay()]}
                    </span>
                    <span
                      className={`text-xs leading-tight ${
                        isToday
                          ? "text-blue-700 dark:text-blue-300 font-bold"
                          : "text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {d.getDate()}
                    </span>
                    <span
                      className={`text-[9px] leading-tight ${
                        isToday
                          ? "text-blue-500 dark:text-blue-400"
                          : "text-gray-400 dark:text-gray-500"
                      }`}
                    >
                      {(d.getMonth() + 1).toString().padStart(2, "0")}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Grid body */}
            <div className="relative" style={{ width: totalGridWidth }}>
              {/* Background columns (today highlight, weekends) */}
              <div className="absolute inset-0 flex pointer-events-none">
                {dates.map((d) => {
                  const ds = toDateStr(d);
                  const isToday = ds === todayStr;
                  const isWE = isWeekend(d);
                  return (
                    <div
                      key={ds}
                      className={`border-r border-gray-100 dark:border-gray-800 ${
                        isToday
                          ? "bg-blue-50/50 dark:bg-blue-900/10"
                          : isWE
                            ? "bg-gray-50/50 dark:bg-gray-900/20"
                            : ""
                      }`}
                      style={{ width: COL_WIDTH, height: "100%" }}
                    />
                  );
                })}
              </div>

              {/* Task rows with bars */}
              {groupedDated.map(({ status, tasks: groupTasks }) => (
                <div key={status}>
                  {/* Group header row */}
                  <div
                    className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/30"
                    style={{ height: ROW_HEIGHT }}
                  />
                  {/* Task bars */}
                  {groupTasks.map((task) => {
                    const bar = getBarStyle(task);
                    return (
                      <div
                        key={task.id}
                        className="relative border-b border-gray-100 dark:border-gray-800"
                        style={{ height: ROW_HEIGHT }}
                      >
                        {bar && (
                          <button
                            onClick={() => onEditTask(task)}
                            className={`absolute top-1 rounded-sm transition-colors cursor-pointer ${STATUS_COLORS[task.status]} ${STATUS_BAR_HOVER[task.status]} ${
                              bar.isSingleDay ? "rounded-full" : ""
                            }`}
                            style={{
                              left: bar.left + 2,
                              width: bar.width,
                              height: ROW_HEIGHT - 8,
                            }}
                            title={`#${task.task_number} ${task.title}`}
                          >
                            {!bar.isSingleDay && bar.width > 40 && (
                              <span className="text-[10px] text-white px-1.5 truncate block leading-snug">
                                {task.title}
                              </span>
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* No Date rows (empty grid area) */}
              {undatedTasks.length > 0 && (
                <div>
                  <div
                    className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/30"
                    style={{ height: ROW_HEIGHT }}
                  />
                  {undatedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="relative border-b border-gray-100 dark:border-gray-800"
                      style={{ height: ROW_HEIGHT }}
                    >
                      {/* No bar for undated tasks */}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {tasks.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
          No tasks to display
        </div>
      )}
    </div>
  );
}
