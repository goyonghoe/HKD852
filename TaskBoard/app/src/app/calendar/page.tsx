"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Task } from "@/lib/database.types";
import { fetchTasks } from "@/lib/tasks";
import YearView from "@/components/calendar/YearView";
import MonthView from "@/components/calendar/MonthView";
import WeekView from "@/components/calendar/WeekView";
import DayView from "@/components/calendar/DayView";
import TaskModal from "@/components/board/TaskModal";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

type ViewMode = "year" | "month" | "week" | "day";

const VIEW_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: "year", label: "Year" },
  { value: "month", label: "Month" },
  { value: "week", label: "Week" },
  { value: "day", label: "Day" },
];

export default function CalendarPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [dayViewDate, setDayViewDate] = useState<Date | undefined>(undefined);

  const loadTasks = useCallback(async () => {
    try {
      const data = await fetchTasks();
      setTasks(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useRealtimeSync(loadTasks);

  const handleSaveTask = async (updatedTask: Task) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
    );
    setEditingTask(null);
  };

  const scheduledCount = tasks.filter((t) => t.scheduled_date).length;

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
          캘린더
        </span>
      </div>

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a]">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Ultra Task Board
          </h1>
          <nav className="hidden sm:flex items-center gap-1 text-sm">
            <Link
              href="/tree"
              className="px-2.5 py-1 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Tree
            </Link>
            <Link
              href="/"
              className="px-2.5 py-1 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Board
            </Link>
            <Link
              href="/table"
              className="px-2.5 py-1 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Table
            </Link>
            <Link
              href="/timeline"
              className="px-2.5 py-1 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Timeline
            </Link>
            <Link
              href="/calendar"
              className="px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium"
            >
              Calendar
            </Link>
            <Link
              href="/list"
              className="px-2.5 py-1 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              List
            </Link>
            <Link
              href="/stats"
              className="px-2.5 py-1 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Stats
            </Link>
            <Link
              href="/activity"
              className="px-2.5 py-1 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Activity
            </Link>
            <Link
              href="/wiki"
              className="px-2.5 py-1 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
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

        <div className="flex items-center gap-3">
          {/* View mode tabs */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
            {VIEW_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setViewMode(opt.value)}
                className={`text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${
                  viewMode === opt.value
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">
            {scheduledCount} scheduled
          </span>
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

      {/* Calendar View */}
      <div className="flex-1 overflow-hidden">
        {viewMode === "year" && (
          <YearView
            tasks={tasks}
            onMonthClick={(_year, month) => {
              setViewMode("month");
            }}
          />
        )}
        {viewMode === "month" && (
          <MonthView
            tasks={tasks}
            onEditTask={setEditingTask}
            onDayClick={(date) => {
              setDayViewDate(date);
              setViewMode("day");
            }}
          />
        )}
        {viewMode === "week" && (
          <WeekView tasks={tasks} onEditTask={setEditingTask} />
        )}
        {viewMode === "day" && (
          <DayView
            tasks={tasks}
            onEditTask={setEditingTask}
            initialDate={dayViewDate}
          />
        )}
      </div>

      {/* Edit modal */}
      {editingTask && (
        <TaskModal
          task={editingTask}
          allTasks={tasks}
          onSave={handleSaveTask}
          onClose={() => setEditingTask(null)}
        />
      )}
    </div>
  );
}
