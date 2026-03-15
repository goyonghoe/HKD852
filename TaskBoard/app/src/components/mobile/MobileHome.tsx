"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { Task, TaskStatus } from "@/lib/database.types";
import { fetchTasks, createTask, moveTask } from "@/lib/tasks";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { useUndo } from "@/hooks/useUndo";
import { useDarkMode } from "@/hooks/useDarkMode";
import { handleRecurringCompletion } from "@/lib/recurrence";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import MobileHeader from "./MobileHeader";
import UndoToast from "../UndoToast";
import TaskModal from "../board/TaskModal";

const PULL_DAMPING_FACTOR = 0.4;
const PULL_MAX_DISTANCE = 120;
const PULL_REFRESH_THRESHOLD = 80;
const PULL_ROTATION_MULTIPLIER = 3;
const SWIPE_MAX_DISTANCE = 100;
const SWIPE_COMPLETE_THRESHOLD = 60;

const priorityDot: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  mid: "bg-blue-500",
  low: "bg-gray-400",
};

export default function MobileHome() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [fabTitle, setFabTitle] = useState("");
  const [scheduledOpen, setScheduledOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const fabInputRef = useRef<HTMLInputElement>(null);
  const { showUndo, undoAction, dismissUndo } = useUndo();
  const { isDark, toggle: toggleDarkMode } = useDarkMode();
  const { signOut } = useAuth();

  // Pull-to-refresh state
  const scrollRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const [pullDistance, setPullDistance] = useState(0);

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

  useRealtimeSync(loadTasks);

  // --- Pull to refresh ---
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const el = scrollRef.current;
    if (!el || el.scrollTop > 0) return;
    startY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (refreshing) return;
      const el = scrollRef.current;
      if (!el || el.scrollTop > 0) {
        setPullDistance(0);
        return;
      }
      const diff = e.touches[0].clientY - startY.current;
      if (diff > 0) {
        setPullDistance(
          Math.min(diff * PULL_DAMPING_FACTOR, PULL_MAX_DISTANCE),
        );
      }
    },
    [refreshing],
  );

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= PULL_REFRESH_THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullDistance(PULL_REFRESH_THRESHOLD);
      await loadTasks();
      setRefreshing(false);
    }
    setPullDistance(0);
  }, [pullDistance, refreshing, loadTasks]);

  // --- Derived data ---
  const topLevel = tasks.filter((t) => !t.parent_id);
  const todayTasks = topLevel.filter(
    (t) => t.status === "today" || t.status === "in_progress",
  );
  const scheduledTasks = topLevel
    .filter((t) => t.status === "thisweek")
    .sort((a, b) => {
      const pOrder = { critical: 0, high: 1, mid: 2, low: 3 };
      const pa = a.priority ? (pOrder[a.priority] ?? 4) : 4;
      const pb = b.priority ? (pOrder[b.priority] ?? 4) : 4;
      return pa - pb;
    });

  const activeTasks = topLevel.filter((t) => t.status !== "done");
  const todayCount = topLevel.filter((t) => t.status === "today").length;
  const inProgressCount = topLevel.filter(
    (t) => t.status === "in_progress",
  ).length;

  // Weekly completion rate
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const doneThisWeek = topLevel.filter(
    (t) =>
      t.status === "done" &&
      t.completed_at &&
      new Date(t.completed_at) >= weekStart,
  ).length;
  const totalThisWeek = topLevel.filter((t) =>
    t.status === "done"
      ? t.completed_at && new Date(t.completed_at) >= weekStart
      : t.status !== "backlog",
  ).length;
  const completionRate =
    totalThisWeek > 0 ? Math.round((doneThisWeek / totalThisWeek) * 100) : 0;

  // --- Handlers ---
  const handleComplete = async (task: Task) => {
    const prevStatus = task.status;
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

  const handleQuickAdd = async () => {
    const trimmed = fabTitle.trim();
    if (!trimmed) return;
    try {
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
    if (dx > 0) {
      setSwipeX(Math.min(dx, SWIPE_MAX_DISTANCE));
    }
  };

  const handleItemTouchEnd = () => {
    if (swipeX > SWIPE_COMPLETE_THRESHOLD && swipeId) {
      const task = tasks.find((t) => t.id === swipeId);
      if (task) handleComplete(task);
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
    const isCompleting =
      swipeId === task.id && swipeX > SWIPE_COMPLETE_THRESHOLD;
    return (
      <div
        key={task.id}
        className="relative overflow-hidden rounded-xl"
        onTouchStart={(e) => handleItemTouchStart(e, task.id)}
        onTouchMove={handleItemTouchMove}
        onTouchEnd={handleItemTouchEnd}
      >
        {/* Swipe background */}
        <div
          className="absolute inset-0 bg-[var(--success)] flex items-center pl-4 rounded-xl"
          style={{
            opacity:
              swipeId === task.id
                ? Math.min(swipeX / SWIPE_COMPLETE_THRESHOLD, 1)
                : 0,
          }}
        >
          <svg
            className="w-6 h-6 text-white"
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
        </div>

        {/* Task content */}
        <div
          className={`flex items-center gap-3 px-4 py-3 bg-[var(--surface)] transition-colors ${
            isCompleting ? "bg-green-50 dark:bg-green-900/20" : ""
          }`}
          style={{
            transform:
              swipeId === task.id ? `translateX(${swipeX}px)` : undefined,
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
            className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center shrink-0 hover:border-[var(--success)] transition-colors"
          >
            {/* empty circle */}
          </button>

          {/* Title + meta */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--text)] truncate">
              {task.title}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              {task.status === "in_progress" && (
                <span className="text-[10px] text-[var(--accent)] font-medium">
                  진행 중
                </span>
              )}
              {task.estimated_hours && (
                <span className="text-[10px] text-[var(--text-secondary)]">
                  {task.estimated_hours}h
                </span>
              )}
            </div>
          </div>

          {/* Priority dot */}
          {task.priority && (
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${priorityDot[task.priority]}`}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen">
      <MobileHeader title="Ultra Task Board">
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
        <button
          onClick={signOut}
          className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-gray-100 dark:hover:bg-gray-800"
          title="로그아웃"
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
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
        </button>
      </MobileHeader>

      {/* Scrollable body */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto pb-20"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Pull indicator */}
        {(pullDistance > 0 || refreshing) && (
          <div
            className="flex items-center justify-center transition-all"
            style={{
              height: `${refreshing ? PULL_REFRESH_THRESHOLD : pullDistance}px`,
            }}
          >
            <div
              className={`w-5 h-5 border-2 border-gray-300 border-t-[var(--accent)] rounded-full ${
                refreshing ? "animate-spin" : ""
              }`}
              style={{
                transform: refreshing
                  ? undefined
                  : `rotate(${pullDistance * PULL_ROTATION_MULTIPLIER}deg)`,
                opacity: Math.min(pullDistance / PULL_REFRESH_THRESHOLD, 1),
              }}
            />
          </div>
        )}

        <div className="px-4 py-4 space-y-5">
          {/* Summary card */}
          <div className="bg-[var(--surface)] rounded-2xl p-4 shadow-sm border border-[var(--border)]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[var(--text)]">
                오늘 요약
              </h2>
              <span className="text-xs text-[var(--text-secondary)]">
                {new Date().toLocaleDateString("ko-KR", {
                  month: "long",
                  day: "numeric",
                  weekday: "short",
                })}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="text-center">
                <p className="text-xl font-bold text-[var(--text)]">
                  {activeTasks.length}
                </p>
                <p className="text-[10px] text-[var(--text-secondary)]">
                  활성 작업
                </p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-[var(--accent)]">
                  {todayCount}
                </p>
                <p className="text-[10px] text-[var(--text-secondary)]">
                  오늘 할 일
                </p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-[var(--warning)]">
                  {inProgressCount}
                </p>
                <p className="text-[10px] text-[var(--text-secondary)]">
                  진행 중
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-[var(--text-secondary)]">
                  이번 주 완료율
                </span>
                <span className="text-[10px] font-medium text-[var(--text)]">
                  {completionRate}%
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--success)] rounded-full transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick access menu */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { href: "/calendar", icon: "📅", label: "캘린더" },
              { href: "/stats", icon: "📊", label: "통계" },
              { href: "/wiki", icon: "📖", label: "위키" },
              { href: "/settings", icon: "⚙️", label: "설정" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] active:scale-95 transition-transform"
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-[10px] font-medium text-[var(--text-secondary)]">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>

          {/* Today tasks */}
          <section>
            <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2 px-1">
              오늘 할 일 ({todayTasks.length})
            </h3>
            {todayTasks.length === 0 ? (
              <div className="bg-[var(--surface)] rounded-2xl p-6 border border-[var(--border)] text-center">
                <p className="text-sm text-[var(--text-secondary)]">
                  오늘 할 일이 없습니다
                </p>
                <button
                  onClick={() => setFabOpen(true)}
                  className="mt-2 text-sm text-[var(--accent)] font-medium"
                >
                  + 작업 추가하기
                </button>
              </div>
            ) : (
              <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden divide-y divide-[var(--border)]">
                {todayTasks.map(renderTaskItem)}
              </div>
            )}
          </section>

          {/* Scheduled tasks */}
          <section>
            <button
              onClick={() => setScheduledOpen(!scheduledOpen)}
              className="flex items-center gap-1.5 w-full text-left px-1 mb-2"
            >
              <svg
                className={`w-3 h-3 text-[var(--text-secondary)] transition-transform ${
                  scheduledOpen ? "rotate-90" : ""
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
              <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                예정된 작업 ({scheduledTasks.length})
              </h3>
            </button>
            {scheduledOpen && scheduledTasks.length > 0 && (
              <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden divide-y divide-[var(--border)]">
                {scheduledTasks.map(renderTaskItem)}
              </div>
            )}
            {scheduledOpen && scheduledTasks.length === 0 && (
              <div className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border)] text-center">
                <p className="text-sm text-[var(--text-secondary)]">
                  이번 주 예정된 작업이 없습니다
                </p>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* FAB overlay */}
      {fabOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setFabOpen(false)}
        />
      )}

      {/* FAB quick add input */}
      {fabOpen && (
        <div className="fixed bottom-24 left-4 right-4 z-50">
          <div className="bg-[var(--surface)] rounded-2xl shadow-xl border border-[var(--border)] p-3">
            <input
              ref={fabInputRef}
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

      {/* FAB button */}
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
