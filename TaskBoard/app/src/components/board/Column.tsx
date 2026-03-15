"use client";

import { useState, useEffect } from "react";
import type { Task, TaskStatus } from "@/lib/database.types";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import TaskCard from "./TaskCard";
import SwipeableCard from "./SwipeableCard";

const columnLabels: Record<TaskStatus, string> = {
  backlog: "Backlog",
  thisweek: "This Week",
  today: "Today",
  in_progress: "In Progress",
  waiting: "Waiting",
  done: "Done",
};

const columnColors: Record<TaskStatus, string> = {
  backlog: "border-t-gray-300",
  thisweek: "border-t-indigo-400",
  today: "border-t-amber-400",
  in_progress: "border-t-blue-500",
  waiting: "border-t-orange-400",
  done: "border-t-green-500",
};

function getWipKey(status: TaskStatus): string {
  return `taskboard-wip-${status}`;
}

interface ColumnProps {
  status: TaskStatus;
  tasks: Task[];
  allTasks?: Task[];
  onAddTask: (title: string, status: TaskStatus) => void;
  onMoveTask: (id: string, status: TaskStatus) => void;
  onDeleteTask: (id: string) => void;
  onEditTask: (task: Task) => void;
  selectMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onTogglePin?: (task: Task) => void;
}

function isTaskBlocked(task: Task, allTasks: Task[]): boolean {
  if (!task.blocked_by || task.blocked_by.length === 0) return false;
  return task.blocked_by.some((blockerId) => {
    const blocker = allTasks.find((t) => t.id === blockerId);
    return blocker && blocker.status !== "done";
  });
}

export default function Column({
  status,
  tasks,
  allTasks = [],
  onAddTask,
  onMoveTask,
  onDeleteTask,
  onEditTask,
  selectMode,
  selectedIds,
  onToggleSelect,
  onTogglePin,
}: ColumnProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [wipLimit, setWipLimit] = useState<number | null>(null);
  const [showWipSettings, setShowWipSettings] = useState(false);
  const [wipInput, setWipInput] = useState("");

  // Load WIP limit from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(getWipKey(status));
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed) && parsed > 0) {
          setWipLimit(parsed);
          setWipInput(parsed.toString());
        }
      }
    } catch {
      // localStorage not available
    }
  }, [status]);

  const isOverWip = wipLimit !== null && tasks.length > wipLimit;

  // Make the column itself a drop target (for empty columns)
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  const sortedTasks = [...tasks].sort((a, b) => {
    // Pinned tasks always come first
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return a.sort_order - b.sort_order;
  });
  const taskIds = sortedTasks.map((t) => t.id);

  const handleAdd = () => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    onAddTask(trimmed, status);
    setNewTitle("");
    setIsAdding(false);
  };

  const handleSaveWip = () => {
    const val = wipInput.trim();
    if (!val) {
      setWipLimit(null);
      try {
        localStorage.removeItem(getWipKey(status));
      } catch {
        // ignore
      }
    } else {
      const parsed = parseInt(val, 10);
      if (!isNaN(parsed) && parsed > 0) {
        setWipLimit(parsed);
        try {
          localStorage.setItem(getWipKey(status), parsed.toString());
        } catch {
          // ignore
        }
      }
    }
    setShowWipSettings(false);
  };

  return (
    <div
      className={`flex flex-col bg-gray-50 dark:bg-[#141414] rounded-xl border-t-3 ${columnColors[status]} sm:min-w-[260px] sm:max-w-[300px] w-full transition-colors ${
        isOver ? "bg-blue-50/50 dark:bg-blue-900/20" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <h3
            className={`text-sm font-semibold ${
              isOverWip
                ? "text-red-600 dark:text-red-400"
                : "text-gray-700 dark:text-gray-300"
            }`}
          >
            {columnLabels[status]}
          </h3>
          <span
            className={`text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center ${
              isOverWip
                ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400"
                : "text-gray-400 bg-gray-200 dark:bg-gray-800 dark:text-gray-500"
            }`}
          >
            {tasks.length}
            {wipLimit !== null && `/${wipLimit}`}
          </span>
          {/* WIP settings gear */}
          <button
            onClick={() => {
              setShowWipSettings(!showWipSettings);
              setWipInput(wipLimit?.toString() || "");
            }}
            className="text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400 transition-colors"
            title="Set WIP limit"
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
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-lg leading-none"
          title="Add task"
        >
          +
        </button>
      </div>

      {/* WIP limit settings popover */}
      {showWipSettings && (
        <div className="mx-3 mb-2 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 rounded-lg p-2 shadow-sm">
          <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
            WIP Limit
          </label>
          <div className="flex gap-1.5">
            <input
              autoFocus
              type="number"
              min="0"
              value={wipInput}
              onChange={(e) => setWipInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveWip();
                if (e.key === "Escape") setShowWipSettings(false);
              }}
              placeholder="No limit"
              className="flex-1 text-xs border border-gray-200 dark:border-gray-600 rounded px-2 py-1 outline-none focus:border-blue-300 bg-transparent dark:text-gray-100"
            />
            <button
              onClick={handleSaveWip}
              className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
            >
              Set
            </button>
            <button
              onClick={() => setShowWipSettings(false)}
              className="text-xs text-gray-500 px-1.5 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Over WIP warning banner */}
      {isOverWip && (
        <div className="mx-3 mb-1 text-[10px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded px-2 py-1 text-center font-medium">
          Over WIP limit ({tasks.length}/{wipLimit})
        </div>
      )}

      {/* Task list */}
      <div
        ref={setNodeRef}
        className="flex-1 overflow-y-auto px-2 pb-2 space-y-1.5 column-scroll max-h-[calc(100vh-160px)]"
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {sortedTasks.map((task) => {
            const blocked = isTaskBlocked(task, allTasks);
            return (
              <div key={task.id} className={blocked ? "opacity-60" : ""}>
                <SwipeableCard
                  task={task}
                  onComplete={(id) => onMoveTask(id, "done")}
                  onDelete={onDeleteTask}
                  onStatusChange={onMoveTask}
                >
                  <TaskCard
                    task={task}
                    allTasks={allTasks}
                    onMove={onMoveTask}
                    onDelete={onDeleteTask}
                    onEdit={onEditTask}
                    selectMode={selectMode}
                    isSelected={selectedIds?.has(task.id)}
                    onToggleSelect={onToggleSelect}
                    onTogglePin={onTogglePin}
                  />
                </SwipeableCard>
              </div>
            );
          })}
        </SortableContext>

        {/* Inline add */}
        {isAdding && (
          <div className="bg-white dark:bg-[#1a1a1a] border border-blue-300 dark:border-blue-700 rounded-lg p-2 shadow-sm">
            <input
              autoFocus
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
                if (e.key === "Escape") {
                  setIsAdding(false);
                  setNewTitle("");
                }
              }}
              placeholder="Task title..."
              className="w-full text-sm border-none outline-none bg-transparent placeholder-gray-400 dark:text-gray-100 dark:placeholder-gray-500"
            />
            <div className="flex gap-1 mt-1.5">
              <button
                onClick={handleAdd}
                className="text-xs bg-blue-600 text-white px-2.5 py-1 rounded hover:bg-blue-700"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setNewTitle("");
                }}
                className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
