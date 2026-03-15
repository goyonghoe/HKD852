"use client";

import { useState } from "react";
import type { TaskStatus, TaskPriority } from "@/lib/database.types";

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: "backlog", label: "Backlog" },
  { value: "thisweek", label: "This Week" },
  { value: "today", label: "Today" },
  { value: "in_progress", label: "In Progress" },
  { value: "waiting", label: "Waiting" },
  { value: "done", label: "Done" },
];

const priorityOptions: { value: TaskPriority; label: string }[] = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "mid", label: "Mid" },
  { value: "low", label: "Low" },
];

interface BulkActionBarProps {
  selectedCount: number;
  onMoveToStatus: (status: TaskStatus) => void;
  onSetPriority: (priority: TaskPriority) => void;
  onAddTag: (tag: string) => void;
  onDelete: () => void;
  onCancel: () => void;
}

export default function BulkActionBar({
  selectedCount,
  onMoveToStatus,
  onSetPriority,
  onAddTag,
  onDelete,
  onCancel,
}: BulkActionBarProps) {
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [tagValue, setTagValue] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#333] rounded-xl shadow-2xl px-4 py-2.5">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-200 mr-1">
        {selectedCount} selected
      </span>

      <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />

      {/* Move to status */}
      <div className="relative">
        <button
          onClick={() => {
            setShowMoveMenu(!showMoveMenu);
            setShowPriorityMenu(false);
            setShowTagInput(false);
            setShowDeleteConfirm(false);
          }}
          className="text-xs px-2.5 py-1.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          Move to...
        </button>
        {showMoveMenu && (
          <div className="absolute bottom-full mb-1 left-0 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[140px]">
            {statusOptions.map((s) => (
              <button
                key={s.value}
                onClick={() => {
                  onMoveToStatus(s.value);
                  setShowMoveMenu(false);
                }}
                className="w-full text-left text-xs px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Set priority */}
      <div className="relative">
        <button
          onClick={() => {
            setShowPriorityMenu(!showPriorityMenu);
            setShowMoveMenu(false);
            setShowTagInput(false);
            setShowDeleteConfirm(false);
          }}
          className="text-xs px-2.5 py-1.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          Set Priority...
        </button>
        {showPriorityMenu && (
          <div className="absolute bottom-full mb-1 left-0 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[120px]">
            {priorityOptions.map((p) => (
              <button
                key={p.value}
                onClick={() => {
                  onSetPriority(p.value);
                  setShowPriorityMenu(false);
                }}
                className="w-full text-left text-xs px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Add tag */}
      <div className="relative">
        <button
          onClick={() => {
            setShowTagInput(!showTagInput);
            setShowMoveMenu(false);
            setShowPriorityMenu(false);
            setShowDeleteConfirm(false);
          }}
          className="text-xs px-2.5 py-1.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          Add Tag...
        </button>
        {showTagInput && (
          <div className="absolute bottom-full mb-1 left-0 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 min-w-[180px]">
            <div className="flex gap-1">
              <input
                autoFocus
                type="text"
                value={tagValue}
                onChange={(e) => setTagValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && tagValue.trim()) {
                    onAddTag(tagValue.trim());
                    setTagValue("");
                    setShowTagInput(false);
                  }
                  if (e.key === "Escape") setShowTagInput(false);
                }}
                placeholder="Tag name..."
                className="flex-1 text-xs border border-gray-200 dark:border-gray-600 rounded px-2 py-1 outline-none focus:border-blue-300 bg-transparent dark:text-gray-100"
              />
              <button
                onClick={() => {
                  if (tagValue.trim()) {
                    onAddTag(tagValue.trim());
                    setTagValue("");
                    setShowTagInput(false);
                  }
                }}
                className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete */}
      <div className="relative">
        {showDeleteConfirm ? (
          <div className="flex items-center gap-1">
            <span className="text-xs text-red-600 dark:text-red-400">
              Delete {selectedCount}?
            </span>
            <button
              onClick={() => {
                onDelete();
                setShowDeleteConfirm(false);
              }}
              className="text-xs px-2 py-1 rounded-md bg-red-600 text-white hover:bg-red-700"
            >
              Yes
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="text-xs px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              No
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setShowDeleteConfirm(true);
              setShowMoveMenu(false);
              setShowPriorityMenu(false);
              setShowTagInput(false);
            }}
            className="text-xs px-2.5 py-1.5 rounded-md bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50"
          >
            Delete
          </button>
        )}
      </div>

      <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />

      <button
        onClick={onCancel}
        className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-1.5 py-1"
      >
        Cancel
      </button>
    </div>
  );
}
