"use client";

import { useState, useMemo, useCallback } from "react";
import type { Task, TaskStatus } from "@/lib/database.types";

const statusColors: Record<TaskStatus, string> = {
  backlog: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  thisweek:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400",
  today: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  in_progress:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  waiting:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
  done: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
};

const statusLabels: Record<TaskStatus, string> = {
  backlog: "Backlog",
  thisweek: "This Week",
  today: "Today",
  in_progress: "In Progress",
  waiting: "Waiting",
  done: "Done",
};

const priorityDotColors: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  mid: "bg-blue-500",
  low: "bg-gray-400",
};

interface TreeViewProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onToggleDone: (task: Task) => void;
}

interface TreeNode {
  task: Task;
  children: TreeNode[];
}

function buildTree(tasks: Task[]): TreeNode[] {
  const taskMap = new Map<string, Task>();
  const childrenMap = new Map<string, Task[]>();

  for (const task of tasks) {
    taskMap.set(task.id, task);
  }

  // Group children by parent_id
  for (const task of tasks) {
    if (task.parent_id && taskMap.has(task.parent_id)) {
      const siblings = childrenMap.get(task.parent_id) || [];
      siblings.push(task);
      childrenMap.set(task.parent_id, siblings);
    }
  }

  function sortTasks(arr: Task[]): Task[] {
    return [...arr].sort((a, b) => {
      // Pinned first
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return a.sort_order - b.sort_order;
    });
  }

  function buildNode(task: Task): TreeNode {
    const children = childrenMap.get(task.id) || [];
    return {
      task,
      children: sortTasks(children).map(buildNode),
    };
  }

  // Root tasks: no parent_id, or parent not in the current task list
  const roots = tasks.filter((t) => !t.parent_id || !taskMap.has(t.parent_id));

  return sortTasks(roots).map(buildNode);
}

function formatDueDate(task: Task) {
  if (!task.scheduled_date) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(task.scheduled_date + "T00:00:00");
  const month = due.getMonth() + 1;
  const day = due.getDate();
  const compact = `${month}/${day}`;
  const isDone = task.status === "done";

  if (!isDone && due < today) {
    return (
      <span className="text-red-600 dark:text-red-400 font-medium">
        {compact}
      </span>
    );
  }
  if (due.getTime() === today.getTime()) {
    return (
      <span className="text-amber-600 dark:text-amber-400 font-bold">
        {compact}
      </span>
    );
  }
  return <span className="text-gray-500 dark:text-gray-400">{compact}</span>;
}

function TreeRow({
  node,
  depth,
  collapsed,
  onToggleCollapse,
  onEditTask,
  onToggleDone,
}: {
  node: TreeNode;
  depth: number;
  collapsed: Set<string>;
  onToggleCollapse: (id: string) => void;
  onEditTask: (task: Task) => void;
  onToggleDone: (task: Task) => void;
}) {
  const { task, children } = node;
  const hasChildren = children.length > 0;
  const isCollapsed = collapsed.has(task.id);
  const isDone = task.status === "done";

  return (
    <>
      <div
        className="group flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 border-b border-gray-100 dark:border-gray-800/60 hover:bg-gray-50 dark:hover:bg-gray-800/40 cursor-pointer transition-colors"
        style={{ paddingLeft: `${12 + depth * 24}px` }}
        onClick={() => onEditTask(task)}
      >
        {/* Expand/collapse arrow */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) onToggleCollapse(task.id);
          }}
          className={`w-5 h-5 flex items-center justify-center flex-shrink-0 rounded transition-colors ${
            hasChildren
              ? "text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              : "text-transparent"
          }`}
        >
          {hasChildren && (
            <svg
              className={`w-3.5 h-3.5 transition-transform duration-150 ${
                isCollapsed ? "" : "rotate-90"
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
          )}
        </button>

        {/* Done checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleDone(task);
          }}
          className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
            isDone
              ? "bg-green-500 border-green-500"
              : "border-gray-300 dark:border-gray-600 hover:border-blue-400"
          }`}
        >
          {isDone && (
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

        {/* Priority dot */}
        {task.priority && (
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityDotColors[task.priority]}`}
            title={task.priority}
          />
        )}

        {/* Task number */}
        <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 font-mono">
          #{task.task_number}
        </span>

        {/* Title */}
        <span
          className={`text-sm truncate min-w-0 flex-1 ${
            isDone
              ? "text-gray-400 dark:text-gray-500 line-through"
              : "text-gray-900 dark:text-gray-100"
          }`}
        >
          {task.title}
        </span>

        {/* Right side: status badge, due date, tags */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
          {/* Status badge */}
          <span
            className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap ${statusColors[task.status]}`}
          >
            {statusLabels[task.status]}
          </span>

          {/* Due date */}
          <span className="text-xs hidden sm:inline whitespace-nowrap">
            {formatDueDate(task) ?? (
              <span className="text-gray-300 dark:text-gray-700">-</span>
            )}
          </span>

          {/* Tags */}
          <div className="hidden md:flex gap-1 flex-shrink-0">
            {task.tags?.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-[10px] text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30 px-1.5 py-0.5 rounded"
              >
                #{tag}
              </span>
            ))}
            {task.tags?.length > 2 && (
              <span className="text-[10px] text-gray-400 dark:text-gray-500">
                +{task.tags.length - 2}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Children with collapse animation */}
      {hasChildren && !isCollapsed && (
        <div className="animate-[fadeIn_150ms_ease-in-out]">
          {children.map((child) => (
            <TreeRow
              key={child.task.id}
              node={child}
              depth={depth + 1}
              collapsed={collapsed}
              onToggleCollapse={onToggleCollapse}
              onEditTask={onEditTask}
              onToggleDone={onToggleDone}
            />
          ))}
        </div>
      )}
    </>
  );
}

export default function TreeView({
  tasks,
  onEditTask,
  onToggleDone,
}: TreeViewProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const tree = useMemo(() => buildTree(tasks), [tasks]);

  const onToggleCollapse = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Count total including nested
  const hasParentChild = useMemo(() => tasks.some((t) => t.parent_id), [tasks]);

  const expandAll = useCallback(() => {
    setCollapsed(new Set());
  }, []);

  const collapseAll = useCallback(() => {
    const withChildren = new Set<string>();
    for (const t of tasks) {
      if (t.parent_id) {
        withChildren.add(t.parent_id);
      }
    }
    setCollapsed(withChildren);
  }, [tasks]);

  return (
    <div>
      {/* Toolbar */}
      {hasParentChild && (
        <div className="flex items-center gap-2 px-4 py-1.5 border-b border-gray-100 dark:border-gray-800/60 bg-gray-50/50 dark:bg-[#141414]">
          <button
            onClick={expandAll}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Expand all
          </button>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <button
            onClick={collapseAll}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Collapse all
          </button>
        </div>
      )}

      {/* Tree rows */}
      <div>
        {tree.map((node) => (
          <TreeRow
            key={node.task.id}
            node={node}
            depth={0}
            collapsed={collapsed}
            onToggleCollapse={onToggleCollapse}
            onEditTask={onEditTask}
            onToggleDone={onToggleDone}
          />
        ))}
        {tree.length === 0 && (
          <div className="text-center text-sm text-gray-400 dark:text-gray-500 py-12">
            No tasks found
          </div>
        )}
      </div>
    </div>
  );
}
