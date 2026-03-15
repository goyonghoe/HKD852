"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import type { Task, TaskStatus } from "@/lib/database.types";

type SortKey =
  | "title"
  | "status"
  | "priority"
  | "estimated_hours"
  | "scheduled_date"
  | "created_at";
type SortDir = "asc" | "desc";

const SORT_STORAGE_KEY = "utb-list-sort";

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
    // ignore malformed data
  }
  return null;
}

const priorityColors: Record<string, string> = {
  critical: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
  mid: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  low: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

const statusColors: Record<string, string> = {
  backlog: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  thisweek:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400",
  today: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  in_progress:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  waiting:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
  done: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
};

const statusLabels: Record<TaskStatus, string> = {
  backlog: "Backlog",
  thisweek: "This Week",
  today: "Today",
  in_progress: "In Progress",
  waiting: "Waiting",
  done: "Done",
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

interface ListViewProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onToggleDone: (task: Task) => void;
  selectMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onSelectAll?: () => void;
  onTogglePin?: (task: Task) => void;
}

export default function ListView({
  tasks,
  onEditTask,
  onToggleDone,
  selectMode,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onTogglePin,
}: ListViewProps) {
  const [sortKey, setSortKey] = useState<SortKey>(() => {
    const saved = loadSortPreference();
    return saved ? saved.column : "status";
  });
  const [sortDir, setSortDir] = useState<SortDir>(() => {
    const saved = loadSortPreference();
    return saved ? saved.direction : "asc";
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        SORT_STORAGE_KEY,
        JSON.stringify({ column: sortKey, direction: sortDir }),
      );
    } catch {
      // storage full or unavailable
    }
  }, [sortKey, sortDir]);

  const handleSort = useCallback((key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return prev;
      }
      setSortDir("asc");
      return key;
    });
  }, []);

  const sorted = useMemo(() => {
    const arr = [...tasks];
    const dir = sortDir === "asc" ? 1 : -1;

    arr.sort((a, b) => {
      // Pinned tasks always first
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;

      switch (sortKey) {
        case "title":
          return dir * a.title.localeCompare(b.title);
        case "status":
          return (
            dir *
            ((statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99))
          );
        case "priority": {
          const pa = a.priority ? (priorityOrder[a.priority] ?? 99) : 99;
          const pb = b.priority ? (priorityOrder[b.priority] ?? 99) : 99;
          return dir * (pa - pb);
        }
        case "estimated_hours":
          return dir * ((a.estimated_hours ?? 0) - (b.estimated_hours ?? 0));
        case "scheduled_date": {
          const da = a.scheduled_date ?? "";
          const db = b.scheduled_date ?? "";
          return dir * da.localeCompare(db);
        }
        case "created_at":
          return dir * a.created_at.localeCompare(b.created_at);
        default:
          return 0;
      }
    });

    return arr;
  }, [tasks, sortKey, sortDir]);

  const allSelected =
    selectMode &&
    selectedIds &&
    tasks.length > 0 &&
    selectedIds.size === tasks.length;

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <th
      className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-3 py-2 cursor-pointer hover:text-gray-800 dark:hover:text-gray-200 select-none"
      onClick={() => handleSort(field)}
    >
      <span className="flex items-center gap-1">
        {label}
        {sortKey === field && (
          <span className="text-blue-600">
            {sortDir === "asc" ? "\u2191" : "\u2193"}
          </span>
        )}
      </span>
    </th>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#141414] sticky top-0">
          <tr>
            {/* Select all checkbox */}
            {selectMode ? (
              <th className="w-10 px-3 py-2">
                <button
                  onClick={onSelectAll}
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                    allSelected
                      ? "bg-blue-600 border-blue-600"
                      : "border-gray-300 dark:border-gray-600 hover:border-blue-400"
                  }`}
                >
                  {allSelected && (
                    <svg
                      className="w-3 h-3 text-white"
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
              </th>
            ) : (
              <th className="w-10 px-3 py-2"></th>
            )}
            {/* Pin column */}
            <th className="w-8 px-1 py-2">
              <svg
                className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </th>
            <SortHeader label="Title" field="title" />
            <SortHeader label="Status" field="status" />
            <SortHeader label="Priority" field="priority" />
            <SortHeader label="Est. Hours" field="estimated_hours" />
            <SortHeader label="Due Date" field="scheduled_date" />
            <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-3 py-2">
              Tags
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {sorted.map((task) => (
            <tr
              key={task.id}
              className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors ${
                selectMode && selectedIds?.has(task.id)
                  ? "bg-blue-50/50 dark:bg-blue-900/10"
                  : ""
              }`}
              onClick={() => {
                if (selectMode && onToggleSelect) {
                  onToggleSelect(task.id);
                } else {
                  onEditTask(task);
                }
              }}
            >
              {/* Checkbox / Done toggle */}
              <td className="px-3 py-2.5">
                {selectMode ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSelect?.(task.id);
                    }}
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                      selectedIds?.has(task.id)
                        ? "bg-blue-600 border-blue-600"
                        : "border-gray-300 dark:border-gray-600 hover:border-blue-400"
                    }`}
                  >
                    {selectedIds?.has(task.id) && (
                      <svg
                        className="w-3 h-3 text-white"
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
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleDone(task);
                    }}
                    className={`w-4.5 h-4.5 rounded border-2 flex items-center justify-center transition-colors ${
                      task.status === "done"
                        ? "bg-green-500 border-green-500"
                        : "border-gray-300 dark:border-gray-600 hover:border-blue-400"
                    }`}
                  >
                    {task.status === "done" && (
                      <svg
                        className="w-3 h-3 text-white"
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
                )}
              </td>

              {/* Pin */}
              <td className="px-1 py-2.5 text-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePin?.(task);
                  }}
                  className={`transition-colors ${
                    task.is_pinned
                      ? "text-amber-500"
                      : "text-gray-300 dark:text-gray-600 hover:text-amber-400"
                  }`}
                  title={task.is_pinned ? "Unpin" : "Pin to top"}
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill={task.is_pinned ? "currentColor" : "none"}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    />
                  </svg>
                </button>
              </td>

              {/* Title */}
              <td className="px-3 py-2.5">
                <span
                  className={`text-sm ${
                    task.status === "done"
                      ? "text-gray-400 dark:text-gray-500 line-through"
                      : "text-gray-900 dark:text-gray-100"
                  }`}
                >
                  {task.title}
                </span>
              </td>

              {/* Status */}
              <td className="px-3 py-2.5">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${statusColors[task.status]}`}
                >
                  {statusLabels[task.status]}
                </span>
              </td>

              {/* Priority */}
              <td className="px-3 py-2.5">
                {task.priority && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${priorityColors[task.priority]}`}
                  >
                    {task.priority}
                  </span>
                )}
              </td>

              {/* Est Hours */}
              <td className="px-3 py-2.5 text-xs text-gray-500 dark:text-gray-400">
                {task.estimated_hours ? `${task.estimated_hours}h` : "-"}
              </td>

              {/* Due Date */}
              <td className="px-3 py-2.5 text-xs">
                {(() => {
                  if (!task.scheduled_date)
                    return (
                      <span className="text-gray-500 dark:text-gray-400">
                        -
                      </span>
                    );

                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const due = new Date(task.scheduled_date + "T00:00:00");
                  const isDone = task.status === "done";

                  const month = due.getMonth() + 1;
                  const day = due.getDate();
                  const compact = `${month}/${day}`;

                  if (!isDone && due < today) {
                    return (
                      <span className="text-red-600 dark:text-red-400 font-medium">
                        {compact}
                      </span>
                    );
                  }
                  if (due.getTime() === today.getTime()) {
                    return (
                      <span className="text-amber-600 dark:text-amber-400 font-bold">
                        {compact}
                      </span>
                    );
                  }
                  return (
                    <span className="text-gray-500 dark:text-gray-400">
                      {compact}
                    </span>
                  );
                })()}
              </td>

              {/* Tags */}
              <td className="px-3 py-2.5">
                <div className="flex gap-1 flex-wrap">
                  {task.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30 px-1.5 py-0.5 rounded"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </td>
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr>
              <td
                colSpan={8}
                className="text-center text-sm text-gray-400 dark:text-gray-500 py-12"
              >
                No tasks found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
