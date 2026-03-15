"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import type { Task, TaskStatus, TaskPriority } from "@/lib/database.types";
import {
  fetchTasks,
  createTask,
  moveTask,
  deleteTask,
  updateTask,
  groupByStatus,
  archiveDoneTasks,
  archiveAllDone,
  archiveTask,
} from "@/lib/tasks";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import type {
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  DropAnimation,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import Column from "./Column";
import TaskCard from "./TaskCard";
import TaskDetailPanel from "./TaskDetailPanel";
import SearchFilter from "./SearchFilter";
import QuickAddFAB from "./QuickAddFAB";
import ExportMenu from "./ExportMenu";
import ImportModal from "./ImportModal";
import TemplateDrawer from "./TemplateDrawer";
import BulkActionBar from "./BulkActionBar";
import PullToRefresh from "../PullToRefresh";
import UndoToast from "../UndoToast";
import OfflineIndicator from "../OfflineIndicator";
import NotificationBell from "./NotificationBell";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { useUndo } from "@/hooks/useUndo";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useNotifications } from "@/hooks/useNotifications";
import { handleRecurringCompletion } from "@/lib/recurrence";
import { useAuth } from "@/lib/auth-context";

const POINTER_ACTIVATION_DISTANCE = 8;
const TOUCH_ACTIVATION_DELAY_MS = 200;
const TOUCH_ACTIVATION_TOLERANCE = 5;

const columns: TaskStatus[] = [
  "backlog",
  "thisweek",
  "today",
  "in_progress",
  "waiting",
  "done",
];

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: "0.4" } },
  }),
};

export default function Board() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [templateDrawerOpen, setTemplateDrawerOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const { showUndo, undoAction, dismissUndo } = useUndo();
  const { isDark, toggle: toggleDarkMode } = useDarkMode();
  const { signOut } = useAuth();
  const {
    permitted: notifPermitted,
    setPermitted: setNotifPermitted,
    dueTasks,
  } = useNotifications(tasks);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: POINTER_ACTIVATION_DISTANCE,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: TOUCH_ACTIVATION_DELAY_MS,
        tolerance: TOUCH_ACTIVATION_TOLERANCE,
      },
    }),
    useSensor(KeyboardSensor),
  );

  const loadTasks = useCallback(async () => {
    try {
      const data = await fetchTasks(showArchived);
      setTasks(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [showArchived]);

  // Auto-archive done tasks older than 3 days on mount
  const autoArchiveRan = useRef(false);
  useEffect(() => {
    if (autoArchiveRan.current) return;
    autoArchiveRan.current = true;
    archiveDoneTasks(3)
      .then((count) => {
        if (count > 0) {
          loadTasks();
        }
      })
      .catch(() => {});
  }, [loadTasks]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const { suppress } = useRealtimeSync(loadTasks);

  const handleAddTask = async (title: string, status: TaskStatus) => {
    try {
      suppress();
      const newTask = await createTask(title, status);
      setTasks((prev) => [...prev, newTask]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    }
  };

  const handleMoveTask = async (id: string, newStatus: TaskStatus) => {
    const previousTask = tasks.find((t) => t.id === id);
    const previousStatus = previousTask?.status;

    suppress();
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t)),
    );
    try {
      await moveTask(id, newStatus);

      if (newStatus === "done" && previousTask?.recurrence) {
        try {
          const nextTask = await handleRecurringCompletion(previousTask);
          if (nextTask) {
            setTasks((prev) => [...prev, nextTask]);
          }
        } catch {
          // ignore recurrence errors
        }
      }

      if (newStatus === "done" && previousStatus && previousStatus !== "done") {
        showUndo({
          message: "Task completed",
          undo: async () => {
            setTasks((prev) =>
              prev.map((t) =>
                t.id === id ? { ...t, status: previousStatus } : t,
              ),
            );
            await moveTask(id, previousStatus);
          },
        });
      }
    } catch {
      loadTasks();
    }
  };

  const handleDeleteTask = async (id: string) => {
    const deletedTask = tasks.find((t) => t.id === id);
    if (!deletedTask) return;

    suppress();
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await deleteTask(id);

      showUndo({
        message: "Task deleted",
        undo: async () => {
          const restored = await createTask(
            deletedTask.title,
            deletedTask.status,
          );
          const updates: Partial<Task> = {};
          if (deletedTask.notes) updates.notes = deletedTask.notes;
          if (deletedTask.priority) updates.priority = deletedTask.priority;
          if (deletedTask.estimated_hours)
            updates.estimated_hours = deletedTask.estimated_hours;
          if (deletedTask.tags?.length) updates.tags = deletedTask.tags;
          if (deletedTask.scheduled_date)
            updates.scheduled_date = deletedTask.scheduled_date;
          if (deletedTask.scheduled_start)
            updates.scheduled_start = deletedTask.scheduled_start;
          if (deletedTask.scheduled_end)
            updates.scheduled_end = deletedTask.scheduled_end;
          updates.sort_order = deletedTask.sort_order;

          if (Object.keys(updates).length > 0) {
            await updateTask(restored.id, updates);
          }
          await loadTasks();
        },
      });
    } catch {
      loadTasks();
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
  };

  const handleSaveTask = (updatedTask: Task) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
    );
    setEditingTask(updatedTask);
  };

  // --- Select mode & bulk action handlers ---

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleTogglePin = useCallback(
    async (task: Task) => {
      const newPinned = !task.is_pinned;
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, is_pinned: newPinned } : t,
        ),
      );
      try {
        await updateTask(task.id, { is_pinned: newPinned });
      } catch {
        loadTasks();
      }
    },
    [loadTasks],
  );

  const exitSelectMode = useCallback(() => {
    setSelectMode(false);
    setSelectedIds(new Set());
  }, []);

  const handleBulkMoveToStatus = useCallback(
    async (status: TaskStatus) => {
      const ids = Array.from(selectedIds);
      setTasks((prev) =>
        prev.map((t) => (selectedIds.has(t.id) ? { ...t, status } : t)),
      );
      try {
        await Promise.all(ids.map((id) => moveTask(id, status)));
      } catch {
        // ignore
      }
      exitSelectMode();
      loadTasks();
    },
    [selectedIds, exitSelectMode, loadTasks],
  );

  const handleBulkSetPriority = useCallback(
    async (priority: TaskPriority) => {
      const ids = Array.from(selectedIds);
      setTasks((prev) =>
        prev.map((t) => (selectedIds.has(t.id) ? { ...t, priority } : t)),
      );
      try {
        await Promise.all(ids.map((id) => updateTask(id, { priority })));
      } catch {
        // ignore
      }
      exitSelectMode();
      loadTasks();
    },
    [selectedIds, exitSelectMode, loadTasks],
  );

  const handleBulkAddTag = useCallback(
    async (tag: string) => {
      const ids = Array.from(selectedIds);
      setTasks((prev) =>
        prev.map((t) =>
          selectedIds.has(t.id) && !t.tags?.includes(tag)
            ? { ...t, tags: [...(t.tags || []), tag] }
            : t,
        ),
      );
      try {
        await Promise.all(
          ids.map((id) => {
            const task = tasks.find((t) => t.id === id);
            const currentTags = task?.tags || [];
            if (currentTags.includes(tag)) return Promise.resolve();
            return updateTask(id, { tags: [...currentTags, tag] });
          }),
        );
      } catch {
        // ignore
      }
      exitSelectMode();
      loadTasks();
    },
    [selectedIds, tasks, exitSelectMode, loadTasks],
  );

  const handleBulkDelete = useCallback(async () => {
    const ids = Array.from(selectedIds);
    setTasks((prev) => prev.filter((t) => !selectedIds.has(t.id)));
    try {
      await Promise.all(ids.map((id) => deleteTask(id)));
    } catch {
      // ignore
    }
    exitSelectMode();
    loadTasks();
  }, [selectedIds, exitSelectMode, loadTasks]);

  // Use filtered tasks for display, fall back to all tasks
  const displayTasks = filteredTasks ?? tasks;
  const topLevelTasks = useMemo(
    () => displayTasks.filter((t) => !t.parent_id),
    [displayTasks],
  );
  const grouped = useMemo(() => groupByStatus(topLevelTasks), [topLevelTasks]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onQuickAdd: () => setQuickAddOpen(true),
    onFocusSearch: () => searchInputRef.current?.focus(),
    onEscape: () => {
      if (selectMode) {
        exitSelectMode();
      } else if (editingTask) {
        setEditingTask(null);
      } else if (quickAddOpen) {
        setQuickAddOpen(false);
      } else {
        searchInputRef.current?.blur();
      }
    },
    onRefresh: async () => {
      setRefreshing(true);
      await loadTasks();
      setRefreshing(false);
    },
  });

  // --- Drag-and-drop handlers ---

  const findColumnForTask = useCallback(
    (taskId: string): TaskStatus | null => {
      const task = tasks.find((t) => t.id === taskId);
      return task ? task.status : null;
    },
    [tasks],
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const task = tasks.find((t) => t.id === active.id);
      if (task) setActiveTask(task);
    },
    [tasks],
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      const activeColumn = findColumnForTask(activeId);
      const overColumn = columns.includes(overId as TaskStatus)
        ? (overId as TaskStatus)
        : findColumnForTask(overId);

      if (!activeColumn || !overColumn || activeColumn === overColumn) return;

      setTasks((prev) => {
        const updated = prev.map((t) =>
          t.id === activeId ? { ...t, status: overColumn } : t,
        );
        return updated;
      });
    },
    [findColumnForTask],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveTask(null);

      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      const activeColumn = findColumnForTask(activeId);
      const overColumn = columns.includes(overId as TaskStatus)
        ? (overId as TaskStatus)
        : findColumnForTask(overId);

      if (!activeColumn || !overColumn) return;

      setTasks((prev) => {
        let updated = prev.map((t) =>
          t.id === activeId ? { ...t, status: overColumn } : t,
        );

        const columnTasks = updated
          .filter((t) => t.status === overColumn)
          .sort((a, b) => a.sort_order - b.sort_order);

        const activeIdx = columnTasks.findIndex((t) => t.id === activeId);
        const overIdx = columnTasks.findIndex((t) => t.id === overId);

        if (activeIdx !== -1 && overIdx !== -1 && activeIdx !== overIdx) {
          const reordered = arrayMove(columnTasks, activeIdx, overIdx);
          const orderMap = new Map<string, number>();
          reordered.forEach((t, i) => orderMap.set(t.id, i));

          updated = updated.map((t) =>
            orderMap.has(t.id) ? { ...t, sort_order: orderMap.get(t.id)! } : t,
          );
        }

        const finalTask = updated.find((t) => t.id === activeId);
        if (finalTask) {
          const syncUpdates: Record<string, unknown> = {
            status: finalTask.status,
            sort_order: finalTask.sort_order,
          };
          if (finalTask.status === "in_progress") {
            syncUpdates.started_at = new Date().toISOString();
          } else if (finalTask.status === "done") {
            syncUpdates.completed_at = new Date().toISOString();
          }

          updateTask(activeId, syncUpdates as Partial<Task>).catch(() => {
            loadTasks();
          });

          const columnTasks2 = updated
            .filter((t) => t.status === overColumn && t.id !== activeId)
            .sort((a, b) => a.sort_order - b.sort_order);

          columnTasks2.forEach((t) => {
            const original = prev.find((o) => o.id === t.id);
            if (original && original.sort_order !== t.sort_order) {
              updateTask(t.id, { sort_order: t.sort_order }).catch(() => {});
            }
          });
        }

        return updated;
      });
    },
    [findColumnForTask, loadTasks],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-400 dark:text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col pb-20 sm:pb-0">
      <OfflineIndicator />

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
              className="px-2 sm:px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium"
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
            <button
              onClick={signOut}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Sign out"
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
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </nav>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          <span>{tasks.filter((t) => t.status !== "done").length} active</span>
          <span className="hidden sm:inline">
            {tasks.filter((t) => t.status === "done").length} done
          </span>
          {/* Archive all done */}
          {tasks.filter((t) => t.status === "done" && !t.is_archived).length >
            0 && (
            <button
              onClick={async () => {
                const count = await archiveAllDone();
                if (count > 0) {
                  loadTasks();
                }
              }}
              className="hidden sm:inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Archive all done tasks"
            >
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
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                />
              </svg>
              Archive Done
            </button>
          )}
          {/* Show/hide archived toggle */}
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`p-1.5 rounded-md transition-colors ${
              showArchived
                ? "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30"
                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
            title={showArchived ? "Hide archived" : "Show archived"}
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
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
              />
            </svg>
          </button>
          {/* Select mode toggle */}
          <button
            onClick={() => {
              if (selectMode) {
                exitSelectMode();
              } else {
                setSelectMode(true);
              }
            }}
            className={`p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 ${
              selectMode
                ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30"
                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            }`}
            title="Select mode"
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
          <ExportMenu tasks={tasks} />
          <button
            onClick={() => setImportOpen(true)}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title="Import"
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
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
          </button>
          <button
            onClick={() => setTemplateDrawerOpen(true)}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title="Templates"
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
                d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zm10 0a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z"
              />
            </svg>
          </button>
          <NotificationBell
            permitted={notifPermitted}
            onPermissionChange={setNotifPermitted}
            dueTasks={dueTasks}
            onTaskClick={handleEditTask}
          />
          <button
            onClick={toggleDarkMode}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title="Toggle dark mode"
          >
            {isDark ? (
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
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ) : (
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
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
          </button>
          <button
            onClick={async () => {
              setRefreshing(true);
              await loadTasks();
              setRefreshing(false);
            }}
            className={`p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ${refreshing ? "animate-spin" : ""}`}
            title="Refresh (r)"
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
        </div>
      </header>

      <SearchFilter
        tasks={tasks}
        onFilteredTasks={setFilteredTasks}
        searchInputRef={searchInputRef}
      />

      {showArchived && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border-b border-purple-200 dark:border-purple-800 px-6 py-1.5 text-xs text-purple-700 dark:text-purple-400 flex items-center gap-2">
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
              d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
            />
          </svg>
          Showing archived tasks ({tasks.filter((t) => t.is_archived).length}{" "}
          archived)
          <button
            onClick={() => setShowArchived(false)}
            className="ml-auto text-purple-500 hover:text-purple-700 dark:hover:text-purple-300"
          >
            Hide
          </button>
        </div>
      )}

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

      <div className="flex-1 flex overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className={`flex-1 overflow-x-auto transition-all duration-300`}>
            <PullToRefresh onRefresh={loadTasks}>
              <div className="p-2 sm:p-4">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:h-full sm:min-w-max board-columns">
                  {columns.map((status) => (
                    <Column
                      key={status}
                      status={status}
                      tasks={grouped[status]}
                      allTasks={tasks}
                      onAddTask={handleAddTask}
                      onMoveTask={handleMoveTask}
                      onDeleteTask={handleDeleteTask}
                      onEditTask={handleEditTask}
                      selectMode={selectMode}
                      selectedIds={selectedIds}
                      onToggleSelect={handleToggleSelect}
                      onTogglePin={handleTogglePin}
                    />
                  ))}
                </div>
              </div>
            </PullToRefresh>
          </div>

          <DragOverlay dropAnimation={dropAnimation}>
            {activeTask ? (
              <TaskCard
                task={activeTask}
                onMove={() => {}}
                onDelete={() => {}}
                onEdit={() => {}}
                isOverlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Right detail panel */}
        <div
          className={`hidden sm:block transition-all duration-300 border-l border-gray-200 dark:border-[#2a2a2a] overflow-hidden ${
            editingTask ? "w-[400px] shrink-0" : "w-0 border-l-0"
          }`}
        >
          {editingTask && (
            <TaskDetailPanel
              task={editingTask}
              allTasks={tasks}
              onSave={handleSaveTask}
              onClose={() => setEditingTask(null)}
              onDelete={(id) => {
                handleDeleteTask(id);
                setEditingTask(null);
              }}
            />
          )}
        </div>
      </div>

      <QuickAddFAB
        onAdd={handleAddTask}
        isOpen={quickAddOpen}
        onToggle={setQuickAddOpen}
      />

      {selectMode && (
        <BulkActionBar
          selectedCount={selectedIds.size}
          onMoveToStatus={handleBulkMoveToStatus}
          onSetPriority={handleBulkSetPriority}
          onAddTag={handleBulkAddTag}
          onDelete={handleBulkDelete}
          onCancel={exitSelectMode}
        />
      )}

      <UndoToast action={undoAction} onDismiss={dismissUndo} />

      <TemplateDrawer
        open={templateDrawerOpen}
        onClose={() => setTemplateDrawerOpen(false)}
        tasks={tasks}
        onApplied={loadTasks}
      />

      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={loadTasks}
      />
    </div>
  );
}
