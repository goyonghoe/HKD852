"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Task, TimeLog } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";

// ─── helpers ───────────────────────────────────────────────────────

const STATUS_COLORS: Record<
  string,
  { bg: string; ring: string; label: string }
> = {
  backlog: { bg: "bg-gray-100", ring: "ring-gray-300", label: "Backlog" },
  thisweek: {
    bg: "bg-indigo-100",
    ring: "ring-indigo-300",
    label: "This Week",
  },
  today: { bg: "bg-amber-100", ring: "ring-amber-300", label: "Today" },
  in_progress: {
    bg: "bg-blue-100",
    ring: "ring-blue-300",
    label: "In Progress",
  },
  waiting: { bg: "bg-orange-100", ring: "ring-orange-300", label: "Waiting" },
  done: { bg: "bg-green-100", ring: "ring-green-300", label: "Done" },
};

const STATUS_DONUT_COLORS: Record<string, string> = {
  backlog: "#9ca3af",
  thisweek: "#6366f1",
  today: "#f59e0b",
  in_progress: "#3b82f6",
  waiting: "#f97316",
  done: "#10b981",
};

const PRIORITY_COLORS: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  critical: { bg: "bg-red-500", text: "text-white", label: "Critical" },
  high: { bg: "bg-orange-400", text: "text-white", label: "High" },
  mid: { bg: "bg-yellow-300", text: "text-gray-800", label: "Mid" },
  low: { bg: "bg-gray-300", text: "text-gray-700", label: "Low" },
};

function startOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const start = new Date(d);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

function formatWeekLabel(d: Date): string {
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${m}/${day}`;
}

// ─── component ─────────────────────────────────────────────────────

export default function Dashboard() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [tasksRes, logsRes] = await Promise.all([
        supabase
          .from("tasks")
          .select("*")
          .order("sort_order", { ascending: true }),
        supabase
          .from("time_logs")
          .select("*")
          .order("logged_at", { ascending: false }),
      ]);
      if (tasksRes.error) throw tasksRes.error;
      if (logsRes.error) throw logsRes.error;
      setTasks(tasksRes.data as Task[]);
      setTimeLogs(logsRes.data as TimeLog[]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── derived data ──

  const now = useMemo(() => new Date(), []);
  const weekStart = useMemo(() => startOfWeek(now), [now]);

  const activeTasks = useMemo(
    () => tasks.filter((t) => t.status !== "done"),
    [tasks],
  );

  const completedThisWeek = useMemo(
    () =>
      tasks.filter(
        (t) =>
          t.status === "done" &&
          t.completed_at &&
          new Date(t.completed_at) >= weekStart,
      ),
    [tasks, weekStart],
  );

  const completionRate = useMemo(() => {
    const createdThisWeek = tasks.filter(
      (t) =>
        new Date(t.created_at) >= weekStart ||
        (t.completed_at && new Date(t.completed_at) >= weekStart),
    );
    if (createdThisWeek.length === 0) return 0;
    const doneCount = createdThisWeek.filter((t) => t.status === "done").length;
    return Math.round((doneCount / createdThisWeek.length) * 100);
  }, [tasks, weekStart]);

  const avgHours = useMemo(() => {
    const withActual = tasks.filter(
      (t) => t.actual_hours != null && t.actual_hours > 0,
    );
    if (withActual.length === 0) return null;
    const total = withActual.reduce((sum, t) => sum + (t.actual_hours ?? 0), 0);
    return (total / withActual.length).toFixed(1);
  }, [tasks]);

  // Status distribution
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of tasks) {
      counts[t.status] = (counts[t.status] || 0) + 1;
    }
    return counts;
  }, [tasks]);

  // Weekly completion trend (last 4 weeks)
  const weeklyTrend = useMemo(() => {
    const weeks: { label: string; count: number; start: Date }[] = [];
    for (let i = 3; i >= 0; i--) {
      const ws = new Date(weekStart);
      ws.setDate(ws.getDate() - i * 7);
      const we = new Date(ws);
      we.setDate(we.getDate() + 7);
      const count = tasks.filter(
        (t) =>
          t.status === "done" &&
          t.completed_at &&
          new Date(t.completed_at) >= ws &&
          new Date(t.completed_at) < we,
      ).length;
      weeks.push({ label: formatWeekLabel(ws), count, start: ws });
    }
    return weeks;
  }, [tasks, weekStart]);

  const maxWeekly = useMemo(
    () => Math.max(...weeklyTrend.map((w) => w.count), 1),
    [weeklyTrend],
  );

  // Estimation accuracy
  const estimationAccuracy = useMemo(() => {
    const valid = timeLogs.filter(
      (l) => l.estimated_hours > 0 && l.actual_hours > 0,
    );
    if (valid.length === 0) return null;
    const avgRatio = valid.reduce((sum, l) => sum + l.ratio, 0) / valid.length;
    return avgRatio.toFixed(1);
  }, [timeLogs]);

  // Priority breakdown
  const priorityCounts = useMemo(() => {
    const counts: Record<string, number> = {
      critical: 0,
      high: 0,
      mid: 0,
      low: 0,
    };
    for (const t of activeTasks) {
      const p = t.priority ?? "low";
      counts[p] = (counts[p] || 0) + 1;
    }
    return counts;
  }, [activeTasks]);

  const maxPriority = useMemo(
    () => Math.max(...Object.values(priorityCounts), 1),
    [priorityCounts],
  );

  // ── Burndown data (Mon–Sun of current week) ──
  const burndownData = useMemo(() => {
    const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    // Tasks that existed at start of week (created before week end)
    const totalAtWeekStart = tasks.filter(
      (t) =>
        new Date(t.created_at) < new Date(weekStart.getTime() + 7 * 86400000),
    ).length;

    // For each day, count remaining = total - completed by end of that day
    const actual: number[] = [];
    for (let i = 0; i < 7; i++) {
      const dayEnd = new Date(weekStart);
      dayEnd.setDate(dayEnd.getDate() + i + 1);
      dayEnd.setHours(0, 0, 0, 0);

      const completedByDay = tasks.filter(
        (t) =>
          t.status === "done" &&
          t.completed_at &&
          new Date(t.completed_at) >= weekStart &&
          new Date(t.completed_at) < dayEnd,
      ).length;

      actual.push(totalAtWeekStart - completedByDay);
    }

    // Ideal: linear from totalAtWeekStart to 0
    const ideal = dayLabels.map((_, i) => totalAtWeekStart * (1 - (i + 1) / 7));

    // Only show actual up to today
    const todayIdx = Math.min(
      Math.max(0, Math.floor((now.getTime() - weekStart.getTime()) / 86400000)),
      6,
    );

    return { dayLabels, total: totalAtWeekStart, actual, ideal, todayIdx };
  }, [tasks, weekStart, now]);

  // ── Velocity data (last 8 weeks) ──
  const velocityData = useMemo(() => {
    const weeks: { label: string; count: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const ws = new Date(weekStart);
      ws.setDate(ws.getDate() - i * 7);
      const we = new Date(ws);
      we.setDate(we.getDate() + 7);
      const count = tasks.filter(
        (t) =>
          t.status === "done" &&
          t.completed_at &&
          new Date(t.completed_at) >= ws &&
          new Date(t.completed_at) < we,
      ).length;
      weeks.push({ label: formatWeekLabel(ws), count });
    }
    const avg =
      weeks.length > 0
        ? weeks.reduce((s, w) => s + w.count, 0) / weeks.length
        : 0;
    return { weeks, avg, max: Math.max(...weeks.map((w) => w.count), 1) };
  }, [tasks, weekStart]);

  // ── Completion time distribution ──
  const completionTimeDist = useMemo(() => {
    const buckets = [
      { label: "<1h", min: 0, max: 1 },
      { label: "1-4h", min: 1, max: 4 },
      { label: "4-8h", min: 4, max: 8 },
      { label: "1-3d", min: 8, max: 72 },
      { label: "3-7d", min: 72, max: 168 },
      { label: ">7d", min: 168, max: Infinity },
    ];
    const counts = buckets.map(() => 0);

    for (const t of tasks) {
      if (t.status === "done" && t.completed_at) {
        const hours =
          (new Date(t.completed_at).getTime() -
            new Date(t.created_at).getTime()) /
          3600000;
        for (let i = 0; i < buckets.length; i++) {
          if (hours >= buckets[i].min && hours < buckets[i].max) {
            counts[i]++;
            break;
          }
        }
      }
    }

    const max = Math.max(...counts, 1);
    return { buckets, counts, max };
  }, [tasks]);

  // Tags
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of tasks) {
      for (const tag of t.tags ?? []) {
        counts[tag] = (counts[tag] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);
  }, [tasks]);

  const maxTagCount = useMemo(
    () => (tagCounts.length > 0 ? tagCounts[0][1] : 1),
    [tagCounts],
  );

  // Filtered by tag
  const filteredByTag = useMemo(() => {
    if (!selectedTag) return null;
    return tasks.filter((t) => t.tags?.includes(selectedTag));
  }, [tasks, selectedTag]);

  // ── Donut chart segments ──

  const donutSegments = useMemo(() => {
    const total = tasks.length || 1;
    const entries = Object.entries(STATUS_DONUT_COLORS);
    let offset = 0;
    return entries
      .filter(([status]) => (statusCounts[status] || 0) > 0)
      .map(([status, color]) => {
        const count = statusCounts[status] || 0;
        const pct = (count / total) * 100;
        const seg = { status, color, pct, offset, count };
        offset += pct;
        return seg;
      });
  }, [tasks.length, statusCounts]);

  // ── render ──

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-[#111] pb-20 sm:pb-0">
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
          통계
        </span>
      </div>

      {/* Header */}
      <header className="flex items-center justify-between px-3 sm:px-6 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a]">
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
              className="px-2 sm:px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium"
            >
              Stats
            </Link>
            <Link
              href="/activity"
              className="px-2 sm:px-2.5 py-1 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
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
          {tasks.length} total tasks
        </div>
      </header>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 px-6 py-2 text-sm text-red-700 dark:text-red-400">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-500 hover:text-red-700 dark:hover:text-red-300"
          >
            x
          </button>
        </div>
      )}

      {/* Dashboard content */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <SummaryCard
            label="Active Tasks"
            value={activeTasks.length}
            sub="not done"
            accent="text-blue-600"
          />
          <SummaryCard
            label="Completed This Week"
            value={completedThisWeek.length}
            sub={`since ${formatWeekLabel(weekStart)}`}
            accent="text-green-600"
          />
          <SummaryCard
            label="Completion Rate"
            value={`${completionRate}%`}
            sub="this week"
            accent="text-indigo-600"
          />
          <SummaryCard
            label="Avg Time"
            value={avgHours ? `${avgHours}h` : "--"}
            sub="per task (actual)"
            accent="text-amber-600"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Status Distribution */}
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] p-5">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Status Distribution
            </h2>
            <div className="flex items-center gap-6">
              {/* Donut */}
              <div className="relative w-36 h-36 shrink-0">
                <svg viewBox="0 0 42 42" className="w-full h-full -rotate-90">
                  <circle
                    cx="21"
                    cy="21"
                    r="15.915"
                    fill="none"
                    stroke="#f3f4f6"
                    strokeWidth="5"
                  />
                  {donutSegments.map((seg) => (
                    <circle
                      key={seg.status}
                      cx="21"
                      cy="21"
                      r="15.915"
                      fill="none"
                      stroke={seg.color}
                      strokeWidth="5"
                      strokeDasharray={`${seg.pct} ${100 - seg.pct}`}
                      strokeDashoffset={`${-seg.offset}`}
                      className="transition-all duration-500"
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-gray-800 dark:text-gray-200">
                    {tasks.length}
                  </span>
                </div>
              </div>
              {/* Legend */}
              <div className="flex flex-col gap-1.5 text-sm">
                {Object.entries(STATUS_COLORS).map(([status, meta]) => {
                  const count = statusCounts[status] || 0;
                  if (count === 0) return null;
                  return (
                    <div key={status} className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: STATUS_DONUT_COLORS[status] }}
                      />
                      <span className="text-gray-600 dark:text-gray-400">
                        {meta.label}
                      </span>
                      <span className="font-medium text-gray-800 dark:text-gray-200 ml-auto">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Weekly Completion Trend */}
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] p-5">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Weekly Completion Trend
            </h2>
            <div className="flex items-end gap-3 h-40">
              {weeklyTrend.map((w) => (
                <div
                  key={w.label}
                  className="flex-1 flex flex-col items-center justify-end h-full"
                >
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {w.count}
                  </span>
                  <div
                    className="w-full bg-green-400 rounded-t-md transition-all duration-500"
                    style={{
                      height: `${Math.max((w.count / maxWeekly) * 100, 4)}%`,
                      minHeight: "4px",
                    }}
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {w.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Estimation Accuracy */}
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] p-5">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Estimation Accuracy
            </h2>
            {estimationAccuracy ? (
              <div>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-3xl font-bold text-gray-800 dark:text-gray-200">
                    {estimationAccuracy}x
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    avg ratio
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {Number(estimationAccuracy) > 1
                    ? `You typically take ${estimationAccuracy}x longer than estimated`
                    : Number(estimationAccuracy) < 1
                      ? `You typically finish ${(1 / Number(estimationAccuracy)).toFixed(1)}x faster than estimated`
                      : "Your estimates are spot on!"}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Faster
                  </span>
                  <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        Number(estimationAccuracy) <= 1
                          ? "bg-green-400"
                          : Number(estimationAccuracy) <= 1.5
                            ? "bg-yellow-400"
                            : "bg-red-400"
                      }`}
                      style={{
                        width: `${Math.min(Number(estimationAccuracy) * 50, 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Slower
                  </span>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  Based on{" "}
                  {
                    timeLogs.filter(
                      (l) => l.estimated_hours > 0 && l.actual_hours > 0,
                    ).length
                  }{" "}
                  time logs
                </p>
              </div>
            ) : (
              <div className="text-sm text-gray-400 dark:text-gray-500 py-8 text-center">
                No time log data available yet.
                <br />
                <span className="text-xs">
                  Add estimated & actual hours to tasks to see accuracy.
                </span>
              </div>
            )}
          </div>

          {/* Priority Breakdown */}
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] p-5">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Priority Breakdown
            </h2>
            <div className="flex flex-col gap-3">
              {(["critical", "high", "mid", "low"] as const).map((p) => {
                const count = priorityCounts[p] || 0;
                const meta = PRIORITY_COLORS[p];
                return (
                  <div key={p} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-16">
                      {meta.label}
                    </span>
                    <div className="flex-1 h-5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${meta.bg} rounded-full transition-all duration-500 flex items-center justify-end pr-2`}
                        style={{
                          width: `${Math.max((count / maxPriority) * 100, count > 0 ? 8 : 0)}%`,
                        }}
                      >
                        {count > 0 && (
                          <span className={`text-xs font-medium ${meta.text}`}>
                            {count}
                          </span>
                        )}
                      </div>
                    </div>
                    {count === 0 && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        0
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
              Active tasks only ({activeTasks.length} total)
            </p>
          </div>
        </div>

        {/* Burndown, Velocity, Completion Time */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-4 sm:mt-6">
          {/* Sprint Burndown */}
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] p-5">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Sprint Burndown
            </h2>
            {burndownData.total > 0 ? (
              <div className="relative">
                <svg
                  viewBox="0 0 320 180"
                  className="w-full"
                  preserveAspectRatio="xMidYMid meet"
                >
                  {/* Grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
                    <line
                      key={ratio}
                      x1="40"
                      y1={20 + ratio * 130}
                      x2="310"
                      y2={20 + ratio * 130}
                      stroke="#e5e7eb"
                      strokeWidth="0.5"
                      className="dark:stroke-gray-700"
                    />
                  ))}
                  {/* Y-axis labels */}
                  {[0, 0.5, 1].map((ratio) => (
                    <text
                      key={ratio}
                      x="35"
                      y={24 + ratio * 130}
                      textAnchor="end"
                      className="text-[10px] fill-gray-400 dark:fill-gray-500"
                    >
                      {Math.round(burndownData.total * (1 - ratio))}
                    </text>
                  ))}
                  {/* X-axis labels */}
                  {burndownData.dayLabels.map((label, i) => (
                    <text
                      key={label}
                      x={40 + (i * 270) / 6}
                      y="170"
                      textAnchor="middle"
                      className="text-[10px] fill-gray-400 dark:fill-gray-500"
                    >
                      {label}
                    </text>
                  ))}
                  {/* Ideal line */}
                  <polyline
                    fill="none"
                    stroke="#d1d5db"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                    className="dark:stroke-gray-600"
                    points={`40,20 ${burndownData.ideal
                      .map(
                        (v, i) =>
                          `${40 + (i * 270) / 6},${20 + (1 - v / burndownData.total) * 130}`,
                      )
                      .join(" ")}`}
                  />
                  {/* Actual line */}
                  <polyline
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    points={`40,20 ${burndownData.actual
                      .slice(0, burndownData.todayIdx + 1)
                      .map(
                        (v, i) =>
                          `${40 + (i * 270) / 6},${20 + (1 - v / burndownData.total) * 130}`,
                      )
                      .join(" ")}`}
                  />
                  {/* Actual dots */}
                  {burndownData.actual
                    .slice(0, burndownData.todayIdx + 1)
                    .map((v, i) => (
                      <circle
                        key={i}
                        cx={40 + (i * 270) / 6}
                        cy={20 + (1 - v / burndownData.total) * 130}
                        r="3"
                        fill="#3b82f6"
                      />
                    ))}
                </svg>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <span className="w-4 h-0.5 bg-blue-500 inline-block rounded" />
                    Actual
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-4 h-0.5 bg-gray-300 dark:bg-gray-600 inline-block rounded border-dashed" />
                    Ideal
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500 py-8 text-center">
                No tasks this week.
              </p>
            )}
          </div>

          {/* Velocity */}
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] p-5">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Velocity (Last 8 Weeks)
            </h2>
            <div className="flex flex-col gap-2">
              {velocityData.weeks.map((w) => (
                <div key={w.label} className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 w-10 shrink-0">
                    {w.label}
                  </span>
                  <div className="flex-1 h-5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden relative">
                    <div
                      className="h-full bg-indigo-400 dark:bg-indigo-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max((w.count / velocityData.max) * 100, w.count > 0 ? 8 : 0)}%`,
                      }}
                    />
                    {/* Avg line */}
                    {velocityData.avg > 0 && (
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-red-400 dark:bg-red-500"
                        style={{
                          left: `${(velocityData.avg / velocityData.max) * 100}%`,
                        }}
                      />
                    )}
                  </div>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300 w-6 text-right">
                    {w.count}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-indigo-400 dark:bg-indigo-500 rounded inline-block" />
                Completed
              </span>
              <span className="flex items-center gap-1">
                <span className="w-0.5 h-3 bg-red-400 dark:bg-red-500 inline-block" />
                Avg ({velocityData.avg.toFixed(1)})
              </span>
            </div>
          </div>

          {/* Completion Time Distribution */}
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] p-5 lg:col-span-2">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Completion Time Distribution
            </h2>
            {completionTimeDist.counts.some((c) => c > 0) ? (
              <div className="flex items-end gap-3 h-36">
                {completionTimeDist.buckets.map((bucket, i) => {
                  const count = completionTimeDist.counts[i];
                  return (
                    <div
                      key={bucket.label}
                      className="flex-1 flex flex-col items-center justify-end h-full"
                    >
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {count > 0 ? count : ""}
                      </span>
                      <div
                        className="w-full bg-emerald-400 dark:bg-emerald-500 rounded-t-md transition-all duration-500"
                        style={{
                          height: `${Math.max((count / completionTimeDist.max) * 100, count > 0 ? 4 : 0)}%`,
                          minHeight: count > 0 ? "4px" : "0px",
                        }}
                      />
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {bucket.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500 py-8 text-center">
                No completed tasks with timing data yet.
              </p>
            )}
          </div>
        </div>

        {/* Tag Cloud */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] p-5 mt-4 sm:mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Tags
            </h2>
            {selectedTag && (
              <button
                onClick={() => setSelectedTag(null)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                Clear filter
              </button>
            )}
          </div>
          {tagCounts.length > 0 ? (
            <>
              <div className="flex flex-wrap gap-2">
                {tagCounts.map(([tag, count]) => {
                  const scale = 0.75 + (count / maxTagCount) * 0.5;
                  const isActive = selectedTag === tag;
                  return (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(isActive ? null : tag)}
                      className={`px-2.5 py-1 rounded-full border transition-all ${
                        isActive
                          ? "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                          : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                      style={{ fontSize: `${scale}rem` }}
                    >
                      {tag}
                      <span className="ml-1 text-xs opacity-60">{count}</span>
                    </button>
                  );
                })}
              </div>
              {filteredByTag && (
                <div className="mt-4 border-t border-gray-100 dark:border-gray-800 pt-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    {filteredByTag.length} tasks tagged &ldquo;{selectedTag}
                    &rdquo;
                  </p>
                  <div className="flex flex-col gap-1 max-h-48 overflow-auto">
                    {filteredByTag.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center gap-2 text-sm py-1"
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{
                            backgroundColor:
                              STATUS_DONUT_COLORS[t.status] || "#9ca3af",
                          }}
                        />
                        <span
                          className={
                            t.status === "done"
                              ? "text-gray-400 dark:text-gray-500 line-through"
                              : "text-gray-700 dark:text-gray-300"
                          }
                        >
                          {t.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">
              No tags used yet. Add tags to tasks to see them here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── sub-components ────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub: string;
  accent: string;
}) {
  return (
    <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] p-4">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${accent}`}>{value}</p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>
    </div>
  );
}
