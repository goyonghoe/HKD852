"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Task, TaskStatus, TaskPriority } from "@/lib/database.types";
import { fetchTasks, updateTask, deleteTask } from "@/lib/tasks";
import ListView from "@/components/list/ListView";
import TaskModal from "@/components/board/TaskModal";
import SearchFilter from "@/components/board/SearchFilter";
import ExportMenu from "@/components/board/ExportMenu";
import BulkActionBar from "@/components/board/BulkActionBar";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

export default function ListPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Bulk select state
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

  // Auto-sync when data changes on another device/tab
  useRealtimeSync(loadTasks);

  // Exit select mode helper
  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  // Escape key to exit select mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectMode) {
        exitSelectMode();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectMode]);

  const handleSaveTask = (updatedTask: Task) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
    );
    setEditingTask(null);
  };

  const handleToggleDone = async (task: Task) => {
    const newStatus = task.status === "done" ? "today" : "done";
    const updates: Record<string, unknown> = { status: newStatus };
    if (newStatus === "done") {
      updates.completed_at = new Date().toISOString();
    }

    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? ({ ...t, status: newStatus, ...updates } as Task)
          : t,
      ),
    );

    try {
      await updateTask(task.id, updates as Partial<Task>);
    } catch {
      loadTasks();
    }
  };

  // Toggle select for a single task
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Select all visible tasks
  const handleSelectAll = () => {
    const display = filteredTasks ?? tasks;
    if (selectedIds.size === display.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(display.map((t) => t.id)));
    }
  };

  // Toggle pin
  const handleTogglePin = async (task: Task) => {
    const newPinned = !task.is_pinned;
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, is_pinned: newPinned } : t)),
    );
    try {
      await updateTask(task.id, { is_pinned: newPinned });
    } catch {
      loadTasks();
    }
  };

  // Bulk actions
  const handleBulkMoveToStatus = async (status: TaskStatus) => {
    const ids = Array.from(selectedIds);
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (ids.includes(t.id) ? { ...t, status } : t)),
    );
    try {
      await Promise.all(ids.map((id) => updateTask(id, { status })));
    } catch {
      // noop
    }
    exitSelectMode();
    loadTasks();
  };

  const handleBulkSetPriority = async (priority: TaskPriority) => {
    const ids = Array.from(selectedIds);
    setTasks((prev) =>
      prev.map((t) => (ids.includes(t.id) ? { ...t, priority } : t)),
    );
    try {
      await Promise.all(ids.map((id) => updateTask(id, { priority })));
    } catch {
      // noop
    }
    exitSelectMode();
    loadTasks();
  };

  const handleBulkAddTag = async (tag: string) => {
    const ids = Array.from(selectedIds);
    setTasks((prev) =>
      prev.map((t) =>
        ids.includes(t.id) && !t.tags.includes(tag)
          ? { ...t, tags: [...t.tags, tag] }
          : t,
      ),
    );
    try {
      await Promise.all(
        ids.map((id) => {
          const task = tasks.find((t) => t.id === id);
          if (task && !task.tags.includes(tag)) {
            return updateTask(id, { tags: [...task.tags, tag] });
          }
          return Promise.resolve();
        }),
      );
    } catch {
      // noop
    }
    exitSelectMode();
    loadTasks();
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    setTasks((prev) => prev.filter((t) => !ids.includes(t.id)));
    try {
      await Promise.all(ids.map((id) => deleteTask(id)));
    } catch {
      // noop
    }
    exitSelectMode();
    loadTasks();
  };

  const displayTasks = filteredTasks ?? tasks;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-400">
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
          리스트
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
              className="px-2 sm:px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium"
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
        <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          <span>{displayTasks.length} tasks</span>
          {/* Select mode toggle */}
          <button
            onClick={() => {
              if (selectMode) {
                exitSelectMode();
              } else {
                setSelectMode(true);
              }
            }}
            className={`p-1.5 rounded-md transition-colors ${
              selectMode
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
            title={selectMode ? "Exit select mode" : "Select tasks"}
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          </button>
          <ExportMenu tasks={displayTasks} />
        </div>
      </header>

      {/* Search & Filter */}
      <SearchFilter tasks={tasks} onFilteredTasks={setFilteredTasks} />

      {/* Error bar */}
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

      {/* List */}
      <div className="flex-1 overflow-auto">
        <ListView
          tasks={displayTasks}
          onEditTask={setEditingTask}
          onToggleDone={handleToggleDone}
          selectMode={selectMode}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAll}
          onTogglePin={handleTogglePin}
        />
      </div>

      {/* Bulk action bar */}
      {selectMode && selectedIds.size > 0 && (
        <BulkActionBar
          selectedCount={selectedIds.size}
          onMoveToStatus={handleBulkMoveToStatus}
          onSetPriority={handleBulkSetPriority}
          onAddTag={handleBulkAddTag}
          onDelete={handleBulkDelete}
          onCancel={exitSelectMode}
        />
      )}

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
