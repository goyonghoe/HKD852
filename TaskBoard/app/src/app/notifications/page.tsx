"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Task } from "@/lib/database.types";
import type { ActivityEntry } from "@/lib/activity";
import { fetchTasks } from "@/lib/tasks";
import { fetchActivityLog } from "@/lib/activity";
import { isTaskDueToday, isTaskOverdue } from "@/lib/notifications";

const PAGE_SIZE = 20;

const ACTION_CONFIG: Record<
  string,
  { color: string; bg: string; icon: string; label: string }
> = {
  created: {
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/40",
    icon: "+",
    label: "생성",
  },
  updated: {
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/40",
    icon: "\u270E",
    label: "수정",
  },
  moved: {
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-100 dark:bg-purple-900/40",
    icon: "\u2192",
    label: "이동",
  },
  completed: {
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-100 dark:bg-yellow-900/40",
    icon: "\u2713",
    label: "완료",
  },
  deleted: {
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-900/40",
    icon: "\u2715",
    label: "삭제",
  },
  restored: {
    color: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-100 dark:bg-teal-900/40",
    icon: "\u21BA",
    label: "복원",
  },
};

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return "방금 전";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}시간 전`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}일 전`;
  const diffWeek = Math.floor(diffDay / 7);
  return `${diffWeek}주 전`;
}

function daysOverdue(scheduledDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const scheduled = new Date(scheduledDate);
  scheduled.setHours(0, 0, 0, 0);
  return Math.floor(
    (today.getTime() - scheduled.getTime()) / (1000 * 60 * 60 * 24),
  );
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

export default function NotificationsPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [tasksData, activityData] = await Promise.all([
        fetchTasks(),
        fetchActivityLog(PAGE_SIZE, 0).catch(() => [] as ActivityEntry[]),
      ]);
      setTasks(tasksData);
      setEntries(activityData);
      setHasMore(activityData.length === PAGE_SIZE);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터 로드 실패");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const data = await fetchActivityLog(PAGE_SIZE, entries.length);
      setEntries((prev) => [...prev, ...data]);
      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      setError(err instanceof Error ? err.message : "활동 기록 로드 실패");
    } finally {
      setLoadingMore(false);
    }
  };

  // Separate due today and overdue tasks
  const dueTodayTasks = tasks.filter(
    (t) => t.status !== "done" && isTaskDueToday(t),
  );
  const overdueTasks = tasks.filter(
    (t) => t.status !== "done" && isTaskOverdue(t),
  );
  const hasDueItems = dueTodayTasks.length > 0 || overdueTasks.length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-400 dark:text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-[#0f0f0f] pb-20 sm:pb-0">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] shrink-0">
        <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
          알림
        </h1>
        <button
          onClick={handleRefresh}
          className={`p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ${refreshing ? "animate-spin" : ""}`}
          title="새로고침"
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
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </header>

      {/* Error bar */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border-b border-red-200 dark:border-red-800 px-4 py-2 text-sm text-red-700 dark:text-red-400">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            x
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {/* Due / Overdue Section */}
        <div className="px-4 sm:px-6 pt-4 pb-2">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            마감 알림
          </h2>

          {!hasDueItems ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-500">
              <svg
                className="w-10 h-10 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm">마감 예정 작업이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Overdue tasks first */}
              {overdueTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => router.push(`/?task=${task.id}`)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-[#222] transition-colors text-left"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {task.title}
                    </p>
                    <p className="text-xs text-red-500 dark:text-red-400">
                      {daysOverdue(task.scheduled_date!)}일 지남
                    </p>
                  </div>
                  <svg
                    className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0"
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
              ))}

              {/* Due today tasks */}
              {dueTodayTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => router.push(`/?task=${task.id}`)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-[#222] transition-colors text-left"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {task.title}
                    </p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">
                      오늘 마감
                    </p>
                  </div>
                  <svg
                    className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0"
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
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-[#2a2a2a] mx-4 sm:mx-6 my-2" />

        {/* Activity Feed Section */}
        <div className="px-4 sm:px-6 pt-2 pb-4">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            활동 기록
          </h2>

          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-500">
              <svg
                className="w-10 h-10 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm">활동 기록이 아직 없습니다</p>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => {
                const config =
                  ACTION_CONFIG[entry.action] ?? ACTION_CONFIG.updated;
                return (
                  <div
                    key={entry.id}
                    className="flex items-start gap-3 px-3 py-2.5 bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#2a2a2a]"
                  >
                    {/* Icon */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${config.bg} ${config.color}`}
                    >
                      {config.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {entry.task_title}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className={`text-xs px-1.5 py-0.5 rounded ${config.bg} ${config.color}`}
                            >
                              {config.label}
                            </span>
                            {entry.field_changed && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {entry.field_changed === "status" ? (
                                  <>
                                    {statusLabel(entry.old_value ?? "")}{" "}
                                    <span className="text-gray-400 dark:text-gray-500">
                                      {"\u2192"}
                                    </span>{" "}
                                    {statusLabel(entry.new_value ?? "")}
                                  </>
                                ) : (
                                  <span>{entry.field_changed}</span>
                                )}
                              </span>
                            )}
                          </div>
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

              {/* Load more */}
              {hasMore && (
                <div className="text-center pt-2">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="px-4 py-2 text-sm rounded-lg bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#222] disabled:opacity-50"
                  >
                    {loadingMore ? "로딩 중..." : "더 보기"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
