"use client";

import { useState, useEffect } from "react";
import type { Task, TaskStatus } from "@/lib/database.types";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createSubtask, updateTask } from "@/lib/tasks";

function getDueDateInfo(scheduledDate: string | null, status: string) {
  if (!scheduledDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const due = new Date(scheduledDate + "T00:00:00");
  const isDone = status === "done";

  const month = due.getMonth() + 1;
  const day = due.getDate();
  const compact = `${month}/${day}`;

  if (!isDone && due < today) {
    return {
      label: "Overdue",
      compact,
      dotClass: "bg-red-500",
      textClass: "text-red-600",
      badgeClass: "bg-red-100 text-red-700",
    };
  }
  if (due.getTime() === today.getTime()) {
    return {
      label: "Today",
      compact,
      dotClass: "bg-amber-500",
      textClass: "text-amber-600",
      badgeClass: "bg-amber-100 text-amber-700",
    };
  }
  if (due.getTime() === tomorrow.getTime()) {
    return {
      label: "Tomorrow",
      compact,
      dotClass: null,
      textClass: "text-blue-500",
      badgeClass: null,
    };
  }
  return {
    label: null,
    compact,
    dotClass: null,
    textClass: "text-gray-400",
    badgeClass: null,
  };
}

const priorityBar: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  mid: "bg-blue-500",
  low: "bg-gray-400 dark:bg-gray-600",
};

const statusFlow: TaskStatus[] = [
  "backlog",
  "thisweek",
  "today",
  "in_progress",
  "waiting",
  "done",
];

const recurrenceIcons: Record<string, string> = {
  daily: "D",
  weekly: "W",
  monthly: "M",
};

interface TaskCardProps {
  task: Task;
  allTasks?: Task[];
  onMove: (id: string, status: TaskStatus) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  isOverlay?: boolean;
  selectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onTogglePin?: (task: Task) => void;
}

export default function TaskCard({
  task,
  allTasks = [],
  onMove,
  onDelete,
  onEdit,
  isOverlay,
  selectMode,
  isSelected,
  onToggleSelect,
  onTogglePin,
}: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    disabled: isOverlay,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const currentIdx = statusFlow.indexOf(task.status);
  const canMoveRight = currentIdx < statusFlow.length - 1;
  const canMoveLeft = currentIdx > 0;

  // Blocked status
  const unresolvedBlockers = (task.blocked_by ?? []).filter((blockerId) => {
    const blocker = allTasks.find((t) => t.id === blockerId);
    return blocker && blocker.status !== "done";
  });
  const isBlocked = unresolvedBlockers.length > 0;

  // Subtask state
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [subtaskCount, setSubtaskCount] = useState<{
    done: number;
    total: number;
  } | null>(null);

  // Derive subtask count from allTasks (no extra DB call)
  useEffect(() => {
    if (task.parent_id) return;
    const subs = allTasks.filter((t) => t.parent_id === task.id);
    const done = subs.filter((s) => s.status === "done").length;
    setSubtaskCount(subs.length > 0 ? { done, total: subs.length } : null);
    setSubtasks(subs);
  }, [task.id, task.parent_id, allTasks]);

  const handleToggleSubtasks = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSubtasks(!showSubtasks);
  };

  const handleAddSubtask = async (
    e: React.MouseEvent | React.KeyboardEvent,
  ) => {
    e.stopPropagation();
    const trimmed = newSubtaskTitle.trim();
    if (!trimmed) return;
    try {
      const sub = await createSubtask(task.id, trimmed);
      setSubtasks((prev) => [...prev, sub]);
      setSubtaskCount((prev) => ({
        done: prev?.done || 0,
        total: (prev?.total || 0) + 1,
      }));
      setNewSubtaskTitle("");
      setAddingSubtask(false);
    } catch {
      // ignore
    }
  };

  const handleToggleSubtaskDone = async (e: React.MouseEvent, sub: Task) => {
    e.stopPropagation();
    const newStatus: TaskStatus = sub.status === "done" ? "today" : "done";
    try {
      await updateTask(sub.id, { status: newStatus });
      setSubtasks((prev) =>
        prev.map((s) => (s.id === sub.id ? { ...s, status: newStatus } : s)),
      );
      setSubtaskCount((prev) => {
        if (!prev) return prev;
        const delta = newStatus === "done" ? 1 : -1;
        return { done: prev.done + delta, total: prev.total };
      });
    } catch {
      // ignore
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg shadow-sm hover:shadow-md dark:shadow-none dark:hover:shadow-none transition-all cursor-grab active:cursor-grabbing group select-none flex overflow-hidden ${
        isDragging ? "opacity-30 shadow-none" : ""
      } ${isOverlay ? "shadow-xl rotate-2 scale-105 border-blue-300 dark:border-blue-600" : ""} ${task.is_archived ? "opacity-50" : ""}`}
      onClick={(e) => {
        if (selectMode && onToggleSelect) {
          e.stopPropagation();
          onToggleSelect(task.id);
          return;
        }
        if (!isDragging) onEdit(task);
      }}
    >
      {/* Priority color bar */}
      <div
        className={`w-1 shrink-0 rounded-l-lg ${
          task.priority ? priorityBar[task.priority] : "bg-transparent"
        }`}
      />

      {/* Content */}
      <div className="flex-1 min-w-0 px-3 py-2">
        {/* Title row */}
        <div className="flex items-start gap-1.5">
          {/* Select checkbox */}
          {selectMode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelect?.(task.id);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="shrink-0 mt-0.5"
            >
              <div
                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                  isSelected
                    ? "bg-blue-600 border-blue-600"
                    : "border-gray-300 dark:border-gray-600 hover:border-blue-400"
                }`}
              >
                {isSelected && (
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
              </div>
            </button>
          )}
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-snug flex-1 min-w-0 line-clamp-2">
            <span className="text-gray-400 dark:text-gray-500 font-normal mr-1">
              #{task.task_number}
            </span>
            {task.title}
          </p>
          <div className="flex items-center gap-1 shrink-0">
            {task.is_pinned && onTogglePin && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin(task);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="text-amber-500 hover:text-amber-600"
                title="Unpin"
              >
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </button>
            )}
            {task.recurrence && (
              <span
                className="text-[10px] text-purple-600 bg-purple-50 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800 rounded px-1 py-0.5"
                title={`Repeats ${task.recurrence}`}
              >
                {recurrenceIcons[task.recurrence]}
              </span>
            )}
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-1.5 mt-1 flex-wrap empty:hidden">
          {isBlocked && (
            <span
              className="text-xs px-1.5 py-0.5 rounded border bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-400 dark:border-red-800 flex items-center gap-1"
              title={`Blocked by ${unresolvedBlockers.length} task${unresolvedBlockers.length > 1 ? "s" : ""}`}
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              Blocked
            </span>
          )}
          {task.estimated_hours && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {task.estimated_hours}h
            </span>
          )}
          {task.tags?.length > 0 &&
            task.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30 px-1.5 py-0.5 rounded"
              >
                #{tag}
              </span>
            ))}
          {/* Subtask count badge with progress bar */}
          {subtaskCount && (
            <button
              onClick={handleToggleSubtasks}
              onPointerDown={(e) => e.stopPropagation()}
              className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center gap-1.5"
              title="Toggle subtasks"
            >
              <svg
                className={`w-3 h-3 transition-transform ${showSubtasks ? "rotate-90" : ""}`}
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
              <span className="flex items-center gap-1">
                <span className="w-10 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden inline-block">
                  <span
                    className={`block h-full rounded-full transition-all ${
                      subtaskCount.done === subtaskCount.total
                        ? "bg-green-500"
                        : "bg-blue-500"
                    }`}
                    style={{
                      width: `${(subtaskCount.done / subtaskCount.total) * 100}%`,
                    }}
                  />
                </span>
                {subtaskCount.done}/{subtaskCount.total}
              </span>
            </button>
          )}
        </div>

        {/* Due date row */}
        {(() => {
          const info = getDueDateInfo(task.scheduled_date, task.status);
          if (!info) return null;
          return (
            <div className="flex items-center gap-1.5 mt-1.5 text-xs">
              {info.dotClass && (
                <span
                  className={`w-1.5 h-1.5 rounded-full ${info.dotClass} inline-block`}
                />
              )}
              <span className={info.textClass}>{info.compact}</span>
              {info.badgeClass && (
                <span
                  className={`px-1.5 py-0.5 rounded text-xs font-medium ${info.badgeClass}`}
                >
                  {info.label}
                </span>
              )}
              {!info.badgeClass && info.label && (
                <span className={`text-xs ${info.textClass}`}>
                  {info.label}
                </span>
              )}
            </div>
          );
        })()}

        {/* Action buttons (show on hover, hidden during drag) */}
        {!isOverlay && (
          <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {canMoveLeft && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMove(task.id, statusFlow[currentIdx - 1]);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-1.5 py-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                title={`Move to ${statusFlow[currentIdx - 1]}`}
              >
                &larr;
              </button>
            )}
            {canMoveRight && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMove(task.id, statusFlow[currentIdx + 1]);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-1.5 py-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                title={`Move to ${statusFlow[currentIdx + 1]}`}
              >
                &rarr;
              </button>
            )}
            {/* Add subtask button */}
            {!task.parent_id && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setAddingSubtask(true);
                  setShowSubtasks(true);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="text-xs text-gray-400 hover:text-blue-600 px-1.5 py-0.5 rounded hover:bg-blue-50"
                title="Add subtask"
              >
                + sub
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task.id);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="text-xs text-gray-400 hover:text-red-500 px-1.5 py-0.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30 ml-auto"
            >
              &times;
            </button>
          </div>
        )}

        {/* Expandable subtask list */}
        {showSubtasks && !isOverlay && subtasks.length > 0 && (
          <div
            className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800 space-y-1"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {subtasks.map((sub) => (
              <div key={sub.id} className="flex items-center gap-1.5 text-xs">
                <button
                  onClick={(e) => handleToggleSubtaskDone(e, sub)}
                  className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                    sub.status === "done"
                      ? "bg-green-500 border-green-500 text-white"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  {sub.status === "done" && (
                    <svg
                      className="w-2.5 h-2.5"
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
                <span
                  className={`${sub.status === "done" ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-700 dark:text-gray-300"}`}
                >
                  {sub.title}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Inline subtask add */}
        {addingSubtask && !isOverlay && (
          <div
            className="mt-2 pt-2 border-t border-gray-100"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <input
              autoFocus
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddSubtask(e);
                if (e.key === "Escape") {
                  setAddingSubtask(false);
                  setNewSubtaskTitle("");
                }
              }}
              placeholder="Subtask title..."
              className="w-full text-xs border border-gray-200 rounded px-2 py-1 outline-none focus:border-blue-300"
            />
            <div className="flex gap-1 mt-1">
              <button
                onClick={handleAddSubtask}
                className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded hover:bg-blue-700"
              >
                Add
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setAddingSubtask(false);
                  setNewSubtaskTitle("");
                }}
                className="text-[10px] text-gray-500 px-1.5 py-0.5 rounded hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
      {/* end content */}
    </div>
  );
}
