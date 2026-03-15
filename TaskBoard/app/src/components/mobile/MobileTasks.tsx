"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { Task, TaskStatus, TaskPriority } from "@/lib/database.types";
import {
  fetchTasks,
  createTask,
  moveTask,
  deleteTask,
  updateTask,
  groupByStatus,
} from "@/lib/tasks";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { useUndo } from "@/hooks/useUndo";
import { useDarkMode } from "@/hooks/useDarkMode";
import { handleRecurringCompletion } from "@/lib/recurrence";
import MobileHeader from "./MobileHeader";
import UndoToast from "../UndoToast";
import TaskModal from "../board/TaskModal";

const statusLabels: Record<TaskStatus, string> = {
  backlog: "백로그",
  thisweek: "이번 주",
  today: "오늘",
  in_progress: "진행 중",
  waiting: "대기",
  done: "완료",
};

const statusOrder: TaskStatus[] = [
  "in_progress",
  "today",
  "thisweek",
  "waiting",
  "backlog",
  "done",
];

const priorityDot: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  mid: "bg-blue-500",
  low: "bg-gray-400",
};

const priorityPrefix: Record<string, { label: string; color: string }> = {
  critical: { label: "P0", color: "text-red-600 dark:text-red-400" },
  high: { label: "P1", color: "text-orange-600 dark:text-orange-400" },
  mid: { label: "P2", color: "text-blue-600 dark:text-blue-400" },
  low: { label: "P3", color: "text-gray-400 dark:text-gray-500" },
};

const priorityLabels: Record<TaskPriority, string> = {
  critical: "긴급",
  high: "높음",
  mid: "보통",
  low: "낮음",
};

type ViewMode = "board" | "list";
type PriorityFilter = TaskPriority | "all";
type StatusFilter = TaskStatus | "all";

export default function MobileTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [expandedColumns, setExpandedColumns] = useState<Set<TaskStatus>>(
    new Set(["in_progress", "today"]),
  );
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [fabOpen, setFabOpen] = useState(false);
  const [fabTitle, setFabTitle] = useState("");

  const searchInputRef = useRef<HTMLInputElement>(null);
  const { showUndo, undoAction, dismissUndo } = useUndo();
  const { isDark, toggle: toggleDarkMode } = useDarkMode();

  const loadTasks = useCallback(async () => {
    try {
      const data = await fetchTasks();
      setTasks(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const { suppress } = useRealtimeSync(loadTasks);

  // --- Derived ---
  const topLevel = tasks.filter((t) => !t.parent_id);
  const filtered = topLevel.filter((t) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !t.title.toLowerCase().includes(q) &&
        !(t.notes || "").toLowerCase().includes(q) &&
        !t.tags?.some((tag) => tag.toLowerCase().includes(q))
      ) {
        return false;
      }
    }
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    return true;
  });

  const grouped = groupByStatus(filtered);

  // --- Handlers ---
  const handleComplete = async (task: Task) => {
    const prevStatus = task.status;
    suppress();
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, status: "done" as TaskStatus } : t,
      ),
    );
    try {
      await moveTask(task.id, "done");
      if (task.recurrence) {
        try {
          const next = await handleRecurringCompletion(task);
          if (next) setTasks((prev) => [...prev, next]);
        } catch {
          // ignore
        }
      }
      showUndo({
        message: "작업 완료",
        undo: async () => {
          setTasks((prev) =>
            prev.map((t) =>
              t.id === task.id ? { ...t, status: prevStatus } : t,
            ),
          );
          await moveTask(task.id, prevStatus);
        },
      });
    } catch {
      loadTasks();
    }
  };

  const handleDelete = async (task: Task) => {
    const deletedTask = task;
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    try {
      await deleteTask(task.id);
      showUndo({
        message: "작업 삭제됨",
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

  const handleQuickAdd = async () => {
    const trimmed = fabTitle.trim();
    if (!trimmed) return;
    try {
      suppress();
      const newTask = await createTask(trimmed, "today");
      setTasks((prev) => [...prev, newTask]);
      setFabTitle("");
      setFabOpen(false);
    } catch {
      // ignore
    }
  };

  const handleSaveTask = (updatedTask: Task) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
    );
    setEditingTask(null);
  };

  const toggleColumn = (status: TaskStatus) => {
    setExpandedColumns((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  };

  // --- Swipe state ---
  const [swipeId, setSwipeId] = useState<string | null>(null);
  const [swipeX, setSwipeX] = useState(0);
  const swipeStartX = useRef(0);
  const swipeStartY = useRef(0);
  const swipeLocked = useRef(false);

  const handleItemTouchStart = (e: React.TouchEvent, id: string) => {
    swipeStartX.current = e.touches[0].clientX;
    swipeStartY.current = e.touches[0].clientY;
    swipeLocked.current = false;
    setSwipeId(id);
    setSwipeX(0);
  };

  const handleItemTouchMove = (e: React.TouchEvent) => {
    if (!swipeId) return;
    const dx = e.touches[0].clientX - swipeStartX.current;
    const dy = e.touches[0].clientY - swipeStartY.current;
    if (!swipeLocked.current) {
      if (Math.abs(dy) > Math.abs(dx)) {
        setSwipeId(null);
        return;
      }
      swipeLocked.current = true;
    }
    setSwipeX(dx);
  };

  const handleItemTouchEnd = () => {
    if (!swipeId) return;
    const task = tasks.find((t) => t.id === swipeId);
    if (task) {
      if (swipeX > 60) {
        handleComplete(task);
      } else if (swipeX < -60) {
        handleDelete(task);
      }
    }
    setSwipeId(null);
    setSwipeX(0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-[var(--text-secondary)]">
        로딩 중...
      </div>
    );
  }

  const renderTaskItem = (task: Task) => {
    const isSwipingRight = swipeId === task.id && swipeX > 30;
    const isSwipingLeft = swipeId === task.id && swipeX < -30;
    const clampedX =
      swipeId === task.id ? Math.max(-100, Math.min(100, swipeX)) : 0;

    return (
      <div
        key={task.id}
        className="relative overflow-hidden"
        onTouchStart={(e) => handleItemTouchStart(e, task.id)}
        onTouchMove={handleItemTouchMove}
        onTouchEnd={handleItemTouchEnd}
      >
        {/* Right swipe bg (complete) */}
        <div
          className="absolute inset-0 bg-[var(--success)] flex items-center pl-4"
          style={{ opacity: isSwipingRight ? Math.min(swipeX / 60, 1) : 0 }}
        >
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span className="text-white text-xs ml-1 font-medium">완료</span>
        </div>

        {/* Left swipe bg (delete) */}
        <div
          className="absolute inset-0 bg-[var(--danger)] flex items-center justify-end pr-4"
          style={{
            opacity: isSwipingLeft ? Math.min(Math.abs(swipeX) / 60, 1) : 0,
          }}
        >
          <span className="text-white text-xs mr-1 font-medium">삭제</span>
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </div>

        {/* Content */}
        <div
          className="flex items-center gap-3 px-4 py-3 bg-[var(--surface)]"
          style={{
            transform:
              swipeId === task.id ? `translateX(${clampedX}px)` : undefined,
            transition: swipeId === task.id ? "none" : "transform 0.2s",
          }}
          onClick={() => setEditingTask(task)}
        >
          {/* Checkbox */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleComplete(task);
            }}
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
              task.status === "done"
                ? "bg-[var(--success)] border-[var(--success)]"
                : "border-gray-300 dark:border-gray-600 hover:border-[var(--success)]"
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

          {/* Title */}
          <div className="flex-1 min-w-0">
            <p
              className={`text-sm font-medium truncate ${
                task.status === "done"
                  ? "line-through text-[var(--text-secondary)]"
                  : "text-[var(--text)]"
              }`}
            >
              {task.priority && priorityPrefix[task.priority] && (
                <span
                  className={`font-bold mr-1 ${priorityPrefix[task.priority].color}`}
                >
                  {priorityPrefix[task.priority].label}
                </span>
              )}
              <span className="text-[var(--text-secondary)] font-normal mr-1">
                #{task.task_number}
              </span>
              {task.title}
            </p>
            {task.scheduled_date && (
              <span className="text-[10px] text-[var(--text-secondary)]">
                {new Date(task.scheduled_date + "T00:00:00").toLocaleDateString(
                  "ko-KR",
                  {
                    month: "short",
                    day: "numeric",
                  },
                )}
              </span>
            )}
          </div>

          {/* Hours */}
          {task.estimated_hours && (
            <span className="text-[10px] text-[var(--text-secondary)] shrink-0">
              {task.estimated_hours}h
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen">
      <MobileHeader title="내 업무">
        <button
          onClick={() => {
            setSearchOpen(!searchOpen);
            if (!searchOpen) {
              setTimeout(() => searchInputRef.current?.focus(), 100);
            }
          }}
          className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-gray-100 dark:hover:bg-gray-800"
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
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
        <button
          onClick={toggleDarkMode}
          className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          {isDark ? (
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
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          ) : (
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
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          )}
        </button>
      </MobileHeader>

      {/* Search bar */}
      {searchOpen && (
        <div className="px-4 py-2 border-b border-[var(--border)] bg-[var(--surface)]">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]"
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
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="검색..."
              className="w-full text-sm pl-9 pr-8 py-2 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* View toggle + filters */}
      <div className="px-4 py-2 border-b border-[var(--border)] bg-[var(--surface)] space-y-2">
        {/* Mode toggle */}
        <div className="flex items-center gap-1 p-0.5 bg-[var(--bg)] rounded-lg w-fit">
          <button
            onClick={() => setViewMode("board")}
            className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
              viewMode === "board"
                ? "bg-[var(--surface)] text-[var(--text)] shadow-sm"
                : "text-[var(--text-secondary)]"
            }`}
          >
            보드
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
              viewMode === "list"
                ? "bg-[var(--surface)] text-[var(--text)] shadow-sm"
                : "text-[var(--text-secondary)]"
            }`}
          >
            리스트
          </button>
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {/* Priority filters */}
          <button
            onClick={() => setPriorityFilter("all")}
            className={`text-[10px] px-2.5 py-1 rounded-full border whitespace-nowrap transition-colors ${
              priorityFilter === "all"
                ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                : "border-[var(--border)] text-[var(--text-secondary)]"
            }`}
          >
            전체
          </button>
          {(["critical", "high", "mid", "low"] as TaskPriority[]).map((p) => (
            <button
              key={p}
              onClick={() =>
                setPriorityFilter(priorityFilter === p ? "all" : p)
              }
              className={`text-[10px] px-2.5 py-1 rounded-full border whitespace-nowrap transition-colors flex items-center gap-1 ${
                priorityFilter === p
                  ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                  : "border-[var(--border)] text-[var(--text-secondary)]"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${priorityDot[p]}`} />
              {priorityLabels[p]}
            </button>
          ))}

          <span className="w-px h-4 bg-[var(--border)] mx-1" />

          {/* Status filters */}
          {statusOrder.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
              className={`text-[10px] px-2.5 py-1 rounded-full border whitespace-nowrap transition-colors ${
                statusFilter === s
                  ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                  : "border-[var(--border)] text-[var(--text-secondary)]"
              }`}
            >
              {statusLabels[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {viewMode === "board" ? (
          /* Board mode: collapsible sections */
          <div className="divide-y divide-[var(--border)]">
            {statusOrder.map((status) => {
              const columnTasks = grouped[status];
              const isExpanded = expandedColumns.has(status);
              return (
                <div key={status}>
                  <button
                    onClick={() => toggleColumn(status)}
                    className="flex items-center justify-between w-full px-4 py-3 bg-[var(--surface)] hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <svg
                        className={`w-3 h-3 text-[var(--text-secondary)] transition-transform ${
                          isExpanded ? "rotate-90" : ""
                        }`}
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
                      <span className="text-sm font-semibold text-[var(--text)]">
                        {statusLabels[status]}
                      </span>
                      <span className="text-xs text-[var(--text-secondary)] bg-[var(--bg)] px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                        {columnTasks.length}
                      </span>
                    </div>
                  </button>
                  {isExpanded && columnTasks.length > 0 && (
                    <div className="divide-y divide-[var(--border)] border-t border-[var(--border)]">
                      {columnTasks.map(renderTaskItem)}
                    </div>
                  )}
                  {isExpanded && columnTasks.length === 0 && (
                    <div className="px-4 py-3 text-center text-xs text-[var(--text-secondary)] border-t border-[var(--border)]">
                      작업 없음
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* List mode: flat grouped list */
          <div>
            {statusOrder.map((status) => {
              const columnTasks = grouped[status];
              if (columnTasks.length === 0) return null;
              return (
                <div key={status}>
                  {/* Sticky header */}
                  <div className="sticky top-0 z-10 px-4 py-2 bg-[var(--bg)] border-b border-[var(--border)]">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                        {statusLabels[status]}
                      </span>
                      <span className="text-[10px] text-[var(--text-secondary)] bg-[var(--surface)] px-1.5 py-0.5 rounded-full">
                        {columnTasks.length}
                      </span>
                    </div>
                  </div>
                  <div className="divide-y divide-[var(--border)]">
                    {columnTasks.map(renderTaskItem)}
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-[var(--text-secondary)]">
                <svg
                  className="w-12 h-12 mb-3 opacity-30"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <p className="text-sm">검색 결과가 없습니다</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FAB overlay */}
      {fabOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setFabOpen(false)}
        />
      )}

      {/* FAB input */}
      {fabOpen && (
        <div className="fixed bottom-24 left-4 right-4 z-50">
          <div className="bg-[var(--surface)] rounded-2xl shadow-xl border border-[var(--border)] p-3">
            <input
              type="text"
              value={fabTitle}
              onChange={(e) => setFabTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleQuickAdd();
                if (e.key === "Escape") setFabOpen(false);
              }}
              placeholder="새 작업 제목..."
              className="w-full text-sm border border-[var(--border)] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[var(--accent)] bg-[var(--bg)] text-[var(--text)]"
              autoFocus
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-[var(--text-secondary)]">
                오늘 할 일에 추가
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setFabOpen(false)}
                  className="text-xs text-[var(--text-secondary)] px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  취소
                </button>
                <button
                  onClick={handleQuickAdd}
                  disabled={!fabTitle.trim()}
                  className="text-xs bg-[var(--success)] text-white px-4 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-40"
                >
                  추가
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setFabOpen(!fabOpen)}
        className={`fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all ${
          fabOpen
            ? "bg-gray-500 rotate-45"
            : "bg-[var(--success)] hover:opacity-90 hover:shadow-xl"
        }`}
      >
        <svg
          className="w-7 h-7 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>

      <UndoToast action={undoAction} onDismiss={dismissUndo} />

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
