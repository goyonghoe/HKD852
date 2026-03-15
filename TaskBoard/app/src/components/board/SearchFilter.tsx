"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import type { Task, TaskStatus, TaskPriority } from "@/lib/database.types";

interface SearchFilterProps {
  tasks: Task[];
  onFilteredTasks: (filtered: Task[]) => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
}

const priorityOptions: TaskPriority[] = ["critical", "high", "mid", "low"];
const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: "backlog", label: "Backlog" },
  { value: "thisweek", label: "This Week" },
  { value: "today", label: "Today" },
  { value: "in_progress", label: "In Progress" },
  { value: "waiting", label: "Waiting" },
  { value: "done", label: "Done" },
];

const priorityColors: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border-red-300",
  high: "bg-orange-100 text-orange-700 border-orange-300",
  mid: "bg-blue-100 text-blue-700 border-blue-300",
  low: "bg-gray-100 text-gray-600 border-gray-300",
};

const statusColors: Record<string, string> = {
  backlog: "bg-gray-100 text-gray-600 border-gray-300",
  thisweek: "bg-indigo-100 text-indigo-700 border-indigo-300",
  today: "bg-amber-100 text-amber-700 border-amber-300",
  in_progress: "bg-blue-100 text-blue-700 border-blue-300",
  waiting: "bg-orange-100 text-orange-700 border-orange-300",
  done: "bg-green-100 text-green-700 border-green-300",
};

export default function SearchFilter({
  tasks,
  onFilteredTasks,
  searchInputRef,
}: SearchFilterProps) {
  const [query, setQuery] = useState("");
  const [selectedPriorities, setSelectedPriorities] = useState<
    Set<TaskPriority>
  >(new Set());
  const [selectedStatuses, setSelectedStatuses] = useState<Set<TaskStatus>>(
    new Set(),
  );
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState(false);
  const internalRef = useRef<HTMLInputElement>(null);
  const inputRef = searchInputRef || internalRef;
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Collect all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    tasks.forEach((t) => t.tags?.forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [tasks]);

  const activeFilterCount =
    selectedPriorities.size +
    selectedStatuses.size +
    selectedTags.size +
    (query ? 1 : 0);

  // Apply filters with debounce for search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      let filtered = tasks;

      if (query) {
        const q = query.toLowerCase();
        filtered = filtered.filter((t) => t.title.toLowerCase().includes(q));
      }

      if (selectedPriorities.size > 0) {
        filtered = filtered.filter(
          (t) => t.priority && selectedPriorities.has(t.priority),
        );
      }

      if (selectedStatuses.size > 0) {
        filtered = filtered.filter((t) => selectedStatuses.has(t.status));
      }

      if (selectedTags.size > 0) {
        filtered = filtered.filter((t) =>
          t.tags?.some((tag) => selectedTags.has(tag)),
        );
      }

      onFilteredTasks(filtered);
    }, 150);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [
    query,
    selectedPriorities,
    selectedStatuses,
    selectedTags,
    tasks,
    onFilteredTasks,
  ]);

  const togglePriority = (p: TaskPriority) => {
    setSelectedPriorities((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  };

  const toggleStatus = (s: TaskStatus) => {
    setSelectedStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const clearAll = () => {
    setQuery("");
    setSelectedPriorities(new Set());
    setSelectedStatuses(new Set());
    setSelectedTags(new Set());
  };

  return (
    <div className="px-3 sm:px-6 py-2 border-b border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a]">
      <div className="flex items-center gap-2">
        {/* Search input */}
        <div className="relative flex-1 max-w-sm">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setExpanded(true)}
            placeholder="Search tasks... ( / )"
            className="w-full text-sm pl-8 pr-3 py-1.5 border border-gray-200 dark:border-[#2a2a2a] rounded-lg bg-gray-50 dark:bg-[#0f0f0f] dark:text-gray-100 focus:bg-white dark:focus:bg-[#1a1a1a] focus:border-blue-300 dark:focus:border-blue-600 focus:outline-none transition-colors"
          />
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
            expanded || activeFilterCount > 0
              ? "bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400"
              : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
          }`}
        >
          <span className="flex items-center gap-1">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            Filter
            {activeFilterCount > 0 && (
              <span className="bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </span>
        </button>

        {/* Clear all */}
        {activeFilterCount > 0 && (
          <button
            onClick={clearAll}
            className="text-xs text-gray-400 hover:text-gray-600 px-1.5 py-1"
          >
            Clear
          </button>
        )}
      </div>

      {/* Expanded filter chips */}
      {expanded && (
        <div className="mt-2 space-y-2 pb-1">
          {/* Priority */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-gray-400 w-14 shrink-0">
              Priority
            </span>
            {priorityOptions.map((p) => (
              <button
                key={p}
                onClick={() => togglePriority(p)}
                className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                  selectedPriorities.has(p)
                    ? priorityColors[p]
                    : "border-gray-200 dark:border-gray-700 text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Status */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-gray-400 w-14 shrink-0">Status</span>
            {statusOptions.map((s) => (
              <button
                key={s.value}
                onClick={() => toggleStatus(s.value)}
                className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                  selectedStatuses.has(s.value)
                    ? statusColors[s.value]
                    : "border-gray-200 dark:border-gray-700 text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Tags */}
          {allTags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-gray-400 w-14 shrink-0">Tags</span>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                    selectedTags.has(tag)
                      ? "bg-blue-100 text-blue-700 border-blue-300"
                      : "border-gray-200 dark:border-gray-700 text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
