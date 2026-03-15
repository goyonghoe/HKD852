"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ActivityEntry } from "@/lib/activity";
import { fetchActivityLog } from "@/lib/activity";

const PAGE_SIZE = 20;

const ACTION_CONFIG: Record<
  string,
  { color: string; bg: string; icon: string; label: string }
> = {
  created: {
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/40",
    icon: "+",
    label: "Created",
  },
  updated: {
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/40",
    icon: "\u270E",
    label: "Updated",
  },
  moved: {
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-100 dark:bg-purple-900/40",
    icon: "\u2192",
    label: "Moved",
  },
  completed: {
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-100 dark:bg-yellow-900/40",
    icon: "\u2713",
    label: "Completed",
  },
  deleted: {
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-900/40",
    icon: "\u2715",
    label: "Deleted",
  },
  restored: {
    color: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-100 dark:bg-teal-900/40",
    icon: "\u21BA",
    label: "Restored",
  },
};

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  const diffWeek = Math.floor(diffDay / 7);
  return `${diffWeek}w ago`;
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    backlog: "Backlog",
    thisweek: "This Week",
    today: "Today",
    in_progress: "In Progress",
    waiting: "Waiting",
    done: "Done",
  };
  return map[status] || status;
}

export default function ActivityPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInitial = useCallback(async () => {
    try {
      const data = await fetchActivityLog(PAGE_SIZE, 0);
      setEntries(data);
      setHasMore(data.length === PAGE_SIZE);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load activity");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const data = await fetchActivityLog(PAGE_SIZE, entries.length);
      setEntries((prev) => [...prev, ...data]);
      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load more activity",
      );
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-400 dark:text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col pb-20 sm:pb-0">
      {/* Mobile back button */}
      <div className="sm:hidden flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a]">
        <button
          onClick={() => router.back()}
          className="text-blue-600 dark:text-blue-400 text-sm flex items-center gap-1"
        >
          <svg
            className="w-5 h-5"
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
          뒤로
        </button>
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          활동 기록
        </span>
      </div>

      {/* Header */}
      <header className="flex items-center justify-between px-3 sm:px-6 py-3 border-b border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a]">
        <div className="flex items-center gap-2 sm:gap-4">
          <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
            Ultra Task Board
          </h1>
          <nav className="hidden sm:flex items-center gap-1 text-sm">
            <Link
              href="/tree"
              className="px-2 sm:px-2.5 py-1 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Tree
            </Link>
            <Link
              href="/"
              className="px-2 sm:px-2.5 py-1 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Board
            </Link>
            <Link
              href="/table"
              className="px-2 sm:px-2.5 py-1 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Table
            </Link>
            <Link
              href="/timeline"
              className="px-2 sm:px-2.5 py-1 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Timeline
            </Link>
            <Link
              href="/calendar"
              className="px-2 sm:px-2.5 py-1 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Calendar
            </Link>
            <Link
              href="/list"
              className="px-2 sm:px-2.5 py-1 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              List
            </Link>
            <Link
              href="/stats"
              className="px-2 sm:px-2.5 py-1 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Stats
            </Link>
            <Link
              href="/activity"
              className="px-2 sm:px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium"
            >
              Activity
            </Link>
            <Link
              href="/wiki"
              className="px-2 sm:px-2.5 py-1 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Wiki
            </Link>
            <Link
              href="/settings"
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Settings"
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
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </Link>
          </nav>
        </div>
        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          {entries.length} entries
        </div>
      </header>

      {/* Error bar */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border-b border-red-200 dark:border-red-800 px-6 py-2 text-sm text-red-700 dark:text-red-400">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            x
          </button>
        </div>
      )}

      {/* Timeline */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 bg-gray-50 dark:bg-[#0f0f0f]">
        {entries.length === 0 ? (
          <div className="text-center text-gray-400 dark:text-gray-500 py-16">
            <p className="text-lg mb-1">No activity yet</p>
            <p className="text-sm">
              Activity will appear here as you create, update, and complete
              tasks.
            </p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />

              {entries.map((entry) => {
                const config =
                  ACTION_CONFIG[entry.action] ?? ACTION_CONFIG.updated;
                return (
                  <div key={entry.id} className="relative flex gap-4 pb-6">
                    {/* Icon */}
                    <div
                      className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${config.bg} ${config.color}`}
                    >
                      {config.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#2a2a2a] p-3 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span
                            className={`text-xs font-medium px-1.5 py-0.5 rounded ${config.bg} ${config.color}`}
                          >
                            {config.label}
                          </span>
                          <p className="mt-1.5 text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {entry.task_title}
                          </p>
                          {entry.field_changed && (
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              {entry.field_changed === "status" ? (
                                <>
                                  {statusLabel(entry.old_value ?? "")}{" "}
                                  <span className="text-gray-400 dark:text-gray-500">
                                    {"\u2192"}
                                  </span>{" "}
                                  {statusLabel(entry.new_value ?? "")}
                                </>
                              ) : (
                                <>
                                  <span className="font-medium">
                                    {entry.field_changed}
                                  </span>
                                  {entry.old_value && (
                                    <>
                                      {" "}
                                      from{" "}
                                      <span className="line-through">
                                        {entry.old_value}
                                      </span>
                                    </>
                                  )}
                                  {entry.new_value && (
                                    <>
                                      {" "}
                                      to{" "}
                                      <span className="font-medium">
                                        {entry.new_value}
                                      </span>
                                    </>
                                  )}
                                </>
                              )}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0 whitespace-nowrap">
                          {entry.created_at
                            ? relativeTime(entry.created_at)
                            : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="text-center mt-4">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-4 py-2 text-sm rounded-lg bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#222] disabled:opacity-50"
                >
                  {loadingMore ? "Loading..." : "Load more"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
