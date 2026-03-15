"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import type { Task } from "@/lib/database.types";

type SortKey =
  | "task_number"
  | "title"
  | "status"
  | "priority"
  | "scheduled_date"
  | "estimated_hours"
  | "tags"
  | "created_at";
type SortDir = "asc" | "desc";

const SORT_STORAGE_KEY = "utb-table-sort";

function loadSortPreference(): { column: SortKey; direction: SortDir } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SORT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.column === "string" &&
      (parsed.direction === "asc" || parsed.direction === "desc")
    ) {
      return parsed as { column: SortKey; direction: SortDir };
    }
  } catch {
    // ignore
  }
  return null;
}

const statusColors: Record<string, string> = {
  backlog: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  thisweek:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400",
  today: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  in_progress:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  waiting:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
  done: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
};

const statusLabels: Record<string, string> = {
  backlog: "Backlog",
  thisweek: "This Week",
  today: "Today",
  in_progress: "In Progress",
  waiting: "Waiting",
  done: "Done",
};

const priorityDotColors: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  mid: "bg-blue-500",
  low: "bg-gray-400",
};

const priorityLabels: Record<string, string> = {
  critical: "Critical",
  high: "High",
  mid: "Mid",
  low: "Low",
};

const priorityOrder: Record<string, number> = {
  critical: 0,
  high: 1,
  mid: 2,
  low: 3,
};

const statusOrder: Record<string, number> = {
  in_progress: 0,
  today: 1,
  thisweek: 2,
  waiting: 3,
  backlog: 4,
  done: 5,
};

function formatDueDate(dateStr: string | null): {
  text: string;
  className: string;
} {
  if (!dateStr)
    return { text: "-", className: "text-gray-400 dark:text-gray-600" };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr + "T00:00:00");
  const diffDays = Math.floor(
    (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays < 0)
    return {
      text: "Overdue",
      className: "text-red-600 dark:text-red-400 font-medium",
    };
  if (diffDays === 0)
    return {
      text: "Today",
      className: "text-amber-600 dark:text-amber-400 font-medium",
    };
  if (diffDays === 1)
    return {
      text: "Tomorrow",
      className: "text-blue-600 dark:text-blue-400",
    };

  const month = date.getMonth() + 1;
  const day = date.getDate();
  return {
    text: `${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}`,
    className: "text-gray-600 dark:text-gray-400",
  };
}

interface TableViewProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onToggleDone: (task: Task) => void;
}

export default function TableView({
  tasks,
  onEditTask,
  onToggleDone,
}: TableViewProps) {
  const [sortColumn, setSortColumn] = useState<SortKey>("task_number");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Load saved sort on mount
  useEffect(() => {
    const saved = loadSortPreference();
    if (saved) {
      setSortColumn(saved.column);
      setSortDir(saved.direction);
    }
  }, []);

  const handleSort = useCallback(
    (column: SortKey) => {
      let newDir: SortDir = "asc";
      if (sortColumn === column) {
        newDir = sortDir === "asc" ? "desc" : "asc";
      } else if (column === "task_number" || column === "created_at") {
        newDir = "desc";
      }
      setSortColumn(column);
      setSortDir(newDir);
      try {
        localStorage.setItem(
          SORT_STORAGE_KEY,
          JSON.stringify({ column, direction: newDir }),
        );
      } catch {
        // ignore
      }
    },
    [sortColumn, sortDir],
  );

  const sorted = useMemo(() => {
    const arr = [...tasks];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortColumn) {
        case "task_number":
          cmp = a.task_number - b.task_number;
          break;
        case "title":
          cmp = a.title.localeCompare(b.title);
          break;
        case "status":
          cmp = (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
          break;
        case "priority": {
          const pa = a.priority ? (priorityOrder[a.priority] ?? 99) : 99;
          const pb = b.priority ? (priorityOrder[b.priority] ?? 99) : 99;
          cmp = pa - pb;
          break;
        }
        case "scheduled_date": {
          const da = a.scheduled_date ?? "";
          const db = b.scheduled_date ?? "";
          cmp = da.localeCompare(db);
          break;
        }
        case "estimated_hours": {
          const ha = a.estimated_hours ?? 0;
          const hb = b.estimated_hours ?? 0;
          cmp = ha - hb;
          break;
        }
        case "tags": {
          const ta = a.tags.join(",");
          const tb = b.tags.join(",");
          cmp = ta.localeCompare(tb);
          break;
        }
        case "created_at":
          cmp = a.created_at.localeCompare(b.created_at);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [tasks, sortColumn, sortDir]);

  const SortArrow = ({ column }: { column: SortKey }) => {
    if (sortColumn !== column) return null;
    return (
      <span className="ml-1 text-blue-500">
        {sortDir === "asc" ? "\u2191" : "\u2193"}
      </span>
    );
  };

  const thClass =
    "px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors whitespace-nowrap";

  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-600 text-sm">
        No tasks found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] border-collapse">
        <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-[#1e1e1e] border-b border-gray-200 dark:border-gray-700">
          <tr>
            {/* Checkbox column */}
            <th className="w-10 px-3 py-2.5 text-center">
              <span className="sr-only">Done</span>
            </th>
            <th className={thClass} onClick={() => handleSort("task_number")}>
              #
              <SortArrow column="task_number" />
            </th>
            <th className={thClass} onClick={() => handleSort("title")}>
              Title
              <SortArrow column="title" />
            </th>
            <th className={thClass} onClick={() => handleSort("status")}>
              Status
              <SortArrow column="status" />
            </th>
            <th className={thClass} onClick={() => handleSort("priority")}>
              Priority
              <SortArrow column="priority" />
            </th>
            <th
              className={thClass}
              onClick={() => handleSort("scheduled_date")}
            >
              Due Date
              <SortArrow column="scheduled_date" />
            </th>
            <th
              className={`${thClass} hidden md:table-cell`}
              onClick={() => handleSort("estimated_hours")}
            >
              Hours
              <SortArrow column="estimated_hours" />
            </th>
            <th
              className={`${thClass} hidden md:table-cell`}
              onClick={() => handleSort("tags")}
            >
              Tags
              <SortArrow column="tags" />
            </th>
            <th
              className={`${thClass} hidden md:table-cell`}
              onClick={() => handleSort("created_at")}
            >
              Created
              <SortArrow column="created_at" />
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {sorted.map((task, idx) => {
            const due = formatDueDate(task.scheduled_date);
            const isDone = task.status === "done";
            return (
              <tr
                key={task.id}
                onClick={() => onEditTask(task)}
                className={`cursor-pointer transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/10 ${
                  idx % 2 === 0
                    ? "bg-white dark:bg-[#1a1a1a]"
                    : "bg-gray-50/50 dark:bg-[#1e1e1e]"
                } ${isDone ? "opacity-60" : ""}`}
              >
                {/* Checkbox */}
                <td className="w-10 px-3 py-2 text-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleDone(task);
                    }}
                    className={`w-4.5 h-4.5 rounded border-2 inline-flex items-center justify-center transition-colors ${
                      isDone
                        ? "bg-green-500 border-green-500 text-white"
                        : "border-gray-300 dark:border-gray-600 hover:border-green-400"
                    }`}
                  >
                    {isDone && (
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </button>
                </td>

                {/* Task number */}
                <td className="px-3 py-2 text-xs text-gray-400 dark:text-gray-500 font-mono tabular-nums">
                  {task.task_number}
                </td>

                {/* Title */}
                <td className="px-3 py-2 max-w-[280px]">
                  <span
                    className={`text-sm truncate block ${
                      isDone
                        ? "line-through text-gray-400 dark:text-gray-500"
                        : "text-gray-900 dark:text-gray-100"
                    }`}
                  >
                    {task.title}
                  </span>
                </td>

                {/* Status */}
                <td className="px-3 py-2">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      statusColors[task.status] ?? ""
                    }`}
                  >
                    {statusLabels[task.status] ?? task.status}
                  </span>
                </td>

                {/* Priority */}
                <td className="px-3 py-2">
                  {task.priority ? (
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          priorityDotColors[task.priority] ?? "bg-gray-400"
                        }`}
                      />
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {priorityLabels[task.priority] ?? task.priority}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-300 dark:text-gray-600">
                      -
                    </span>
                  )}
                </td>

                {/* Due date */}
                <td className={`px-3 py-2 text-xs ${due.className}`}>
                  {due.text}
                </td>

                {/* Estimated hours (hidden on small) */}
                <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 hidden md:table-cell tabular-nums">
                  {task.estimated_hours != null
                    ? `${task.estimated_hours}h`
                    : "-"}
                </td>

                {/* Tags (hidden on small) */}
                <td className="px-3 py-2 hidden md:table-cell">
                  {task.tags.length > 0 ? (
                    <div className="flex items-center gap-1 flex-wrap">
                      {task.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        >
                          {tag}
                        </span>
                      ))}
                      {task.tags.length > 2 && (
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">
                          +{task.tags.length - 2}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-300 dark:text-gray-600">
                      -
                    </span>
                  )}
                </td>

                {/* Created (hidden on small) */}
                <td className="px-3 py-2 text-xs text-gray-400 dark:text-gray-500 hidden md:table-cell whitespace-nowrap">
                  {new Date(task.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
