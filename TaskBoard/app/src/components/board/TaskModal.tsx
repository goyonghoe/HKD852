"use client";

import { useState, useEffect } from "react";
import type { Task, TaskStatus, TaskPriority } from "@/lib/database.types";
import {
  updateTask,
  getSubtasks,
  createSubtask,
  deleteTask,
} from "@/lib/tasks";

interface TaskModalProps {
  task: Task;
  allTasks?: Task[];
  onSave: (task: Task) => void;
  onClose: () => void;
}

const statuses: { value: TaskStatus; label: string }[] = [
  { value: "backlog", label: "Backlog" },
  { value: "thisweek", label: "This Week" },
  { value: "today", label: "Today" },
  { value: "in_progress", label: "In Progress" },
  { value: "waiting", label: "Waiting" },
  { value: "done", label: "Done" },
];

const priorities: { value: TaskPriority | ""; label: string }[] = [
  { value: "", label: "None" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "mid", label: "Mid" },
  { value: "low", label: "Low" },
];

type RecurrenceType = "daily" | "weekly" | "monthly" | "";

const recurrenceOptions: { value: RecurrenceType; label: string }[] = [
  { value: "", label: "None" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export default function TaskModal({
  task,
  allTasks = [],
  onSave,
  onClose,
}: TaskModalProps) {
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes || "");
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<TaskPriority | "">(
    task.priority || "",
  );
  const [estimatedHours, setEstimatedHours] = useState(
    task.estimated_hours?.toString() || "",
  );
  const [tagsInput, setTagsInput] = useState(task.tags?.join(", ") || "");
  const [scheduledDate, setScheduledDate] = useState(task.scheduled_date || "");
  const [scheduledStart, setScheduledStart] = useState(
    task.scheduled_start || "",
  );
  const [scheduledEnd, setScheduledEnd] = useState(task.scheduled_end || "");
  const [recurrence, setRecurrence] = useState<RecurrenceType>(
    task.recurrence || "",
  );
  const [saving, setSaving] = useState(false);

  // Blocked by state
  const [blockedBy, setBlockedBy] = useState<string[]>(task.blocked_by ?? []);
  const [blockerSearch, setBlockerSearch] = useState("");
  const [showBlockerDropdown, setShowBlockerDropdown] = useState(false);

  const blockerCandidates = allTasks.filter((t) => {
    if (t.id === task.id || t.status === "done" || blockedBy.includes(t.id))
      return false;
    const q = blockerSearch.toLowerCase().replace(/^#/, "");
    return (
      t.title.toLowerCase().includes(q) || String(t.task_number).includes(q)
    );
  });

  // Subtasks state
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [addingSubtask, setAddingSubtask] = useState(false);

  // Lock body scroll (both axes) when modal is open
  useEffect(() => {
    const orig = {
      overflow: document.body.style.overflow,
      touchAction: document.body.style.touchAction,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
    };
    const scrollY = window.scrollY;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    return () => {
      document.body.style.overflow = orig.overflow;
      document.body.style.touchAction = orig.touchAction;
      document.body.style.position = orig.position;
      document.body.style.top = orig.top;
      document.body.style.width = orig.width;
      window.scrollTo(0, scrollY);
    };
  }, []);

  // Load subtasks
  useEffect(() => {
    if (task.parent_id) return;
    getSubtasks(task.id)
      .then(setSubtasks)
      .catch(() => {});
  }, [task.id, task.parent_id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const updates: Record<string, unknown> = {
        title,
        notes: notes || null,
        status,
        priority: priority || null,
        estimated_hours: estimatedHours ? parseFloat(estimatedHours) : null,
        tags,
        scheduled_date: scheduledDate || null,
        scheduled_start: scheduledStart || null,
        scheduled_end: scheduledEnd || null,
        recurrence: recurrence || null,
        blocked_by: blockedBy,
      };

      // Auto timestamps
      if (status === "in_progress" && task.status !== "in_progress") {
        updates.started_at = new Date().toISOString();
      }
      if (status === "done" && task.status !== "done") {
        updates.completed_at = new Date().toISOString();
      }

      const updated = await updateTask(task.id, updates as Partial<Task>);
      onSave(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleAddSubtask = async () => {
    const trimmed = newSubtaskTitle.trim();
    if (!trimmed) return;
    try {
      const sub = await createSubtask(task.id, trimmed);
      setSubtasks((prev) => [...prev, sub]);
      setNewSubtaskTitle("");
      setAddingSubtask(false);
    } catch {
      // ignore
    }
  };

  const handleToggleSubtaskDone = async (sub: Task) => {
    const newStatus: TaskStatus = sub.status === "done" ? "today" : "done";
    try {
      await updateTask(sub.id, { status: newStatus });
      setSubtasks((prev) =>
        prev.map((s) => (s.id === sub.id ? { ...s, status: newStatus } : s)),
      );
    } catch {
      // ignore
    }
  };

  const handleDeleteSubtask = async (subId: string) => {
    try {
      await deleteTask(subId);
      setSubtasks((prev) => prev.filter((s) => s.id !== subId));
    } catch {
      // ignore
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-end sm:items-center justify-center z-50 overscroll-none"
      onClick={onClose}
      onTouchMove={(e) => {
        // Prevent background scroll on touch
        if (!(e.target as HTMLElement).closest("[data-modal-scroll]")) {
          e.preventDefault();
        }
      }}
    >
      <div
        className="bg-white dark:bg-[#1a1a1a] rounded-t-xl sm:rounded-xl shadow-2xl w-full sm:max-w-lg sm:mx-4 max-h-[85vh] sm:max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="overflow-y-auto overflow-x-hidden flex-1 overscroll-contain touch-pan-y"
          data-modal-scroll
        >
          <div className="p-5 space-y-4">
            {/* Close button */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 dark:text-gray-500">
                Edit Task
              </span>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="Close"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Title */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-lg font-semibold border-none outline-none bg-transparent dark:text-gray-100"
              placeholder="Task title"
            />

            {/* Status & Priority */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  className="w-full text-sm border border-gray-200 dark:border-[#2a2a2a] rounded-lg px-2.5 py-1.5 bg-white dark:bg-[#0f0f0f] dark:text-gray-100"
                >
                  {statuses.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) =>
                    setPriority(e.target.value as TaskPriority | "")
                  }
                  className="w-full text-sm border border-gray-200 dark:border-[#2a2a2a] rounded-lg px-2.5 py-1.5 bg-white dark:bg-[#0f0f0f] dark:text-gray-100"
                >
                  {priorities.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Estimated hours & Tags */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                  Estimated Hours
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  className="w-full text-sm border border-gray-200 dark:border-[#2a2a2a] rounded-lg px-2.5 py-1.5 dark:bg-[#0f0f0f] dark:text-gray-100"
                  placeholder="e.g. 2.5"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                  Tags
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full text-sm border border-gray-200 dark:border-[#2a2a2a] rounded-lg px-2.5 py-1.5 dark:bg-[#0f0f0f] dark:text-gray-100"
                  placeholder="tag1, tag2"
                />
              </div>
            </div>

            {/* Schedule */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                  Date
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full text-sm border border-gray-200 dark:border-[#2a2a2a] rounded-lg px-2.5 py-1.5 dark:bg-[#0f0f0f] dark:text-gray-100"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                  Start
                </label>
                <input
                  type="time"
                  value={scheduledStart}
                  onChange={(e) => setScheduledStart(e.target.value)}
                  className="w-full text-sm border border-gray-200 dark:border-[#2a2a2a] rounded-lg px-2.5 py-1.5 dark:bg-[#0f0f0f] dark:text-gray-100"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                  End
                </label>
                <input
                  type="time"
                  value={scheduledEnd}
                  onChange={(e) => setScheduledEnd(e.target.value)}
                  className="w-full text-sm border border-gray-200 dark:border-[#2a2a2a] rounded-lg px-2.5 py-1.5 dark:bg-[#0f0f0f] dark:text-gray-100"
                />
              </div>
            </div>

            {/* Repeat (Recurrence) */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Repeat</label>
              <select
                value={recurrence}
                onChange={(e) =>
                  setRecurrence(e.target.value as RecurrenceType)
                }
                className="w-full text-sm border border-gray-200 dark:border-[#2a2a2a] rounded-lg px-2.5 py-1.5 bg-white dark:bg-[#0f0f0f] dark:text-gray-100"
              >
                {recurrenceOptions.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full text-sm border border-gray-200 dark:border-[#2a2a2a] rounded-lg px-2.5 py-1.5 dark:bg-[#0f0f0f] dark:text-gray-100 resize-none"
                placeholder="Additional notes..."
              />
            </div>

            {/* Blocked By section */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
              <label className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2 block">
                Blocked By
                {blockedBy.length > 0 && (
                  <span className="ml-1.5 text-gray-400">
                    ({blockedBy.length})
                  </span>
                )}
              </label>

              {/* Selected blockers as chips */}
              {blockedBy.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {blockedBy.map((blockerId) => {
                    const blocker = allTasks.find((t) => t.id === blockerId);
                    return (
                      <span
                        key={blockerId}
                        className="inline-flex items-center gap-1 text-xs bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-full px-2 py-0.5"
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
                        <span className="max-w-[150px] truncate">
                          {blocker?.title ?? blockerId.slice(0, 8)}
                        </span>
                        <button
                          onClick={() =>
                            setBlockedBy((prev) =>
                              prev.filter((id) => id !== blockerId),
                            )
                          }
                          className="text-red-400 hover:text-red-600 dark:hover:text-red-300 ml-0.5"
                        >
                          &times;
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Search dropdown */}
              <div className="relative">
                <input
                  type="text"
                  value={blockerSearch}
                  onChange={(e) => {
                    setBlockerSearch(e.target.value);
                    setShowBlockerDropdown(true);
                  }}
                  onFocus={() => setShowBlockerDropdown(true)}
                  placeholder="Search tasks to add as blocker..."
                  className="w-full text-sm border border-gray-200 dark:border-[#2a2a2a] rounded-lg px-2.5 py-1.5 dark:bg-[#0f0f0f] dark:text-gray-100"
                />
                {showBlockerDropdown && blockerSearch.length > 0 && (
                  <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg shadow-lg max-h-40 overflow-auto">
                    {blockerCandidates.length > 0 ? (
                      blockerCandidates.slice(0, 8).map((candidate) => (
                        <button
                          key={candidate.id}
                          onClick={() => {
                            setBlockedBy((prev) => [...prev, candidate.id]);
                            setBlockerSearch("");
                            setShowBlockerDropdown(false);
                          }}
                          className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
                        >
                          <span className="truncate">{candidate.title}</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
                            {candidate.status}
                          </span>
                        </button>
                      ))
                    ) : (
                      <p className="px-3 py-2 text-xs text-gray-400">
                        No matching tasks
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Subtasks section */}
            {!task.parent_id && (
              <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-gray-500 font-medium">
                    Subtasks
                    {subtasks.length > 0 && (
                      <span className="ml-1.5 text-gray-400">
                        ({subtasks.filter((s) => s.status === "done").length}/
                        {subtasks.length})
                      </span>
                    )}
                  </label>
                  <button
                    onClick={() => setAddingSubtask(true)}
                    className="text-xs text-blue-600 hover:text-blue-700 px-1.5 py-0.5 rounded hover:bg-blue-50"
                  >
                    + Add
                  </button>
                </div>

                {/* Subtask list */}
                <div className="space-y-1.5">
                  {subtasks.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center gap-2 group/sub"
                    >
                      <button
                        onClick={() => handleToggleSubtaskDone(sub)}
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          sub.status === "done"
                            ? "bg-green-500 border-green-500 text-white"
                            : "border-gray-300 hover:border-blue-400"
                        }`}
                      >
                        {sub.status === "done" && (
                          <svg
                            className="w-3 h-3"
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
                        className={`text-sm flex-1 ${
                          sub.status === "done"
                            ? "line-through text-gray-400"
                            : "text-gray-700"
                        }`}
                      >
                        {sub.title}
                      </span>
                      <button
                        onClick={() => handleDeleteSubtask(sub.id)}
                        className="text-xs text-gray-300 hover:text-red-500 opacity-0 group-hover/sub:opacity-100 transition-opacity px-1"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add subtask input */}
                {addingSubtask && (
                  <div className="flex gap-2 mt-2">
                    <input
                      autoFocus
                      type="text"
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddSubtask();
                        if (e.key === "Escape") {
                          setAddingSubtask(false);
                          setNewSubtaskTitle("");
                        }
                      }}
                      placeholder="Subtask title..."
                      className="flex-1 text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-blue-300"
                    />
                    <button
                      onClick={handleAddSubtask}
                      className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setAddingSubtask(false);
                        setNewSubtaskTitle("");
                      }}
                      className="text-xs text-gray-500 px-2 py-1.5 rounded-lg hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions — sticky bottom */}
        <div className="flex justify-end gap-2 p-4 border-t border-gray-100 dark:border-gray-800 shrink-0">
          <button
            onClick={onClose}
            className="text-sm text-gray-600 dark:text-gray-400 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
