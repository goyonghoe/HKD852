"use client";

import type { Task } from "@/lib/database.types";

const priorityColors: Record<string, string> = {
  critical:
    "bg-red-50 border-red-300 text-red-800 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300",
  high: "bg-orange-50 border-orange-300 text-orange-800 dark:bg-orange-900/30 dark:border-orange-700 dark:text-orange-300",
  mid: "bg-blue-50 border-blue-300 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300",
  low: "bg-gray-50 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300",
};

const statusDot: Record<string, string> = {
  in_progress: "bg-green-500",
  today: "bg-blue-500",
  thisweek: "bg-purple-500",
  waiting: "bg-yellow-500",
  backlog: "bg-gray-400",
  done: "bg-gray-300",
};

interface TimeBlockProps {
  task: Task;
  topPx: number;
  heightPx: number;
  onClick: (task: Task) => void;
}

export default function TimeBlock({
  task,
  topPx,
  heightPx,
  onClick,
}: TimeBlockProps) {
  const colorClass =
    priorityColors[task.priority || ""] ||
    "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300";
  const dotClass = statusDot[task.status] || "bg-gray-400";
  const isShort = heightPx < 40;

  return (
    <button
      onClick={() => onClick(task)}
      className={`absolute left-1 right-1 rounded-md border px-2 overflow-hidden cursor-pointer transition-shadow hover:shadow-md ${colorClass}`}
      style={{ top: `${topPx}px`, height: `${Math.max(heightPx, 20)}px` }}
      title={`${task.title}\n${task.scheduled_start || ""} - ${task.scheduled_end || ""}`}
    >
      {isShort ? (
        <div className="flex items-center gap-1.5 h-full">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />
          <span className="text-xs font-medium truncate">{task.title}</span>
        </div>
      ) : (
        <div className="py-1">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />
            <span className="text-xs font-medium truncate">{task.title}</span>
          </div>
          {heightPx >= 56 && (
            <div className="text-[10px] opacity-60 mt-0.5 pl-3">
              {task.scheduled_start?.slice(0, 5)} -{" "}
              {task.scheduled_end?.slice(0, 5)}
            </div>
          )}
        </div>
      )}
    </button>
  );
}
