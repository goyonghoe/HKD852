"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { Task, TaskStatus, TaskPriority } from "@/lib/database.types";
import {
  updateTask,
  getSubtasks,
  createSubtask,
  deleteTask,
  archiveTask,
  unarchiveTask,
} from "@/lib/tasks";

interface TaskDetailPanelProps {
  task: Task;
  allTasks: Task[];
  onSave: (task: Task) => void;
  onClose: () => void;
  onDelete: (id: string) => void;
}

const statuses: { value: TaskStatus; label: string; color: string }[] = [
  {
    value: "backlog",
    label: "Backlog",
    color: "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  },
  {
    value: "thisweek",
    label: "This Week",
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  },
  {
    value: "today",
    label: "Today",
    color:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  },
  {
    value: "in_progress",
    label: "In Progress",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  {
    value: "waiting",
    label: "Waiting",
    color:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  },
  {
    value: "done",
    label: "Done",
    color:
      "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  },
];

const priorities: { value: TaskPriority | ""; label: string; color: string }[] =
  [
    {
      value: "",
      label: "None",
      color: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
    },
    {
      value: "critical",
      label: "P0",
      color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
    },
    {
      value: "high",
      label: "P1",
      color:
        "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
    },
    {
      value: "mid",
      label: "P2",
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
    },
    {
      value: "low",
      label: "P3",
      color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    },
  ];

type RecurrenceType = "daily" | "weekly" | "monthly" | "";

const recurrenceOptions: { value: RecurrenceType; label: string }[] = [
  { value: "", label: "None" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const AUTOSAVE_DELAY = 600;

const URL_REGEX = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/g;

function LinkifiedText({ text }: { text: string }) {
  const parts = text.split(URL_REGEX);
  return (
    <>
      {parts.map((part, i) =>
        URL_REGEX.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline break-all"
            onClick={(e) => e.stopPropagation()}
          >
            {part.length > 60 ? part.slice(0, 57) + "..." : part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export default function TaskDetailPanel({
  task,
  allTasks,
  onSave,
  onClose,
  onDelete,
}: TaskDetailPanelProps) {
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
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [notesEditing, setNotesEditing] = useState(false);

  // Blocked by
  const [blockedBy, setBlockedBy] = useState<string[]>(task.blocked_by ?? []);
  const [blockerSearch, setBlockerSearch] = useState("");
  const [showBlockerDropdown, setShowBlockerDropdown] = useState(false);

  // Subtasks
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [addingSubtask, setAddingSubtask] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Reset when task changes
  useEffect(() => {
    setTitle(task.title);
    setNotes(task.notes || "");
    setStatus(task.status);
    setPriority(task.priority || "");
    setEstimatedHours(task.estimated_hours?.toString() || "");
    setTagsInput(task.tags?.join(", ") || "");
    setScheduledDate(task.scheduled_date || "");
    setScheduledStart(task.scheduled_start || "");
    setScheduledEnd(task.scheduled_end || "");
    setRecurrence(task.recurrence || "");
    setBlockedBy(task.blocked_by ?? []);
    setConfirmDelete(false);
    setNotesEditing(false);
  }, [task.id]);

  // Load subtasks
  useEffect(() => {
    if (task.parent_id) return;
    getSubtasks(task.id)
      .then(setSubtasks)
      .catch(() => {});
  }, [task.id, task.parent_id]);

  const doSave = useCallback(
    async (updates: Record<string, unknown>) => {
      setSaving(true);
      try {
        const updated = await updateTask(task.id, updates as Partial<Task>);
        onSave(updated);
      } catch {
        // ignore
      } finally {
        setSaving(false);
      }
    },
    [task.id, onSave],
  );

  const scheduleSave = useCallback(
    (updates: Record<string, unknown>) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => doSave(updates), AUTOSAVE_DELAY);
    },
    [doSave],
  );

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const buildUpdates = useCallback(() => {
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    return {
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
  }, [
    title,
    notes,
    status,
    priority,
    estimatedHours,
    tagsInput,
    scheduledDate,
    scheduledStart,
    scheduledEnd,
    recurrence,
    blockedBy,
  ]);

  // Auto-save on field changes (debounced)
  const handleFieldChange = useCallback(() => {
    scheduleSave(buildUpdates());
  }, [scheduleSave, buildUpdates]);

  // Immediate save for status/priority clicks
  const handleStatusChange = (newStatus: TaskStatus) => {
    setStatus(newStatus);
    const base = buildUpdates() as Record<string, unknown>;
    base.status = newStatus;
    if (newStatus === "in_progress" && task.status !== "in_progress") {
      base.started_at = new Date().toISOString();
    }
    if (newStatus === "done" && task.status !== "done") {
      base.completed_at = new Date().toISOString();
    }
    doSave(base);
  };

  const handlePriorityChange = (newPriority: TaskPriority | "") => {
    setPriority(newPriority);
    const updates = buildUpdates();
    updates.priority = newPriority || null;
    doSave(updates);
  };

  const handleBlockerAdd = (blockerId: string) => {
    const newBlockedBy = [...blockedBy, blockerId];
    setBlockedBy(newBlockedBy);
    setBlockerSearch("");
    setShowBlockerDropdown(false);
    const updates = buildUpdates();
    updates.blocked_by = newBlockedBy;
    doSave(updates);
  };

  const handleBlockerRemove = (blockerId: string) => {
    const newBlockedBy = blockedBy.filter((id) => id !== blockerId);
    setBlockedBy(newBlockedBy);
    const updates = buildUpdates();
    updates.blocked_by = newBlockedBy;
    doSave(updates);
  };

  // Subtask handlers
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

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete(task.id);
  };

  const blockerCandidates = allTasks.filter((t) => {
    if (t.id === task.id || t.status === "done" || blockedBy.includes(t.id))
      return false;
    const q = blockerSearch.toLowerCase().replace(/^#/, "");
    return (
      t.title.toLowerCase().includes(q) || String(t.task_number).includes(q)
    );
  });

  const formatDate = (iso: string | null) => {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      ref={panelRef}
      className="h-full flex flex-col bg-white dark:bg-[#1a1a1a] min-w-[380px]"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-[#2a2a2a] shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400 dark:text-gray-500 font-mono">
            #{task.task_number}
          </span>
          {task.is_archived && (
            <span className="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400 px-1.5 py-0.5 rounded-full font-medium">
              Archived
            </span>
          )}
          {saving && (
            <span className="text-[10px] text-gray-400 dark:text-gray-500">
              saving...
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Archive / Unarchive */}
          <button
            onClick={async () => {
              try {
                if (task.is_archived) {
                  const updated = await unarchiveTask(task.id);
                  onSave(updated);
                } else {
                  const updated = await archiveTask(task.id);
                  onSave(updated);
                }
              } catch {
                /* ignore */
              }
            }}
            className={`p-1.5 rounded-md text-sm transition-colors ${
              task.is_archived
                ? "text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                : "text-gray-400 hover:text-purple-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
            title={task.is_archived ? "Unarchive" : "Archive"}
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
          <button
            onClick={handleDelete}
            className={`p-1.5 rounded-md text-sm transition-colors ${
              confirmDelete
                ? "bg-red-600 text-white hover:bg-red-700"
                : "text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
            title={confirmDelete ? "Click again to confirm" : "Delete task"}
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
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Close (Esc)"
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
                d="M13 5l7 7-7 7M5 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleFieldChange}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          className="w-full text-lg font-semibold border-none outline-none bg-transparent dark:text-gray-100 placeholder-gray-400"
          placeholder="Task title"
        />

        {/* Status chips */}
        <div>
          <label className="text-[11px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium mb-1.5 block">
            Status
          </label>
          <div className="flex flex-wrap gap-1.5">
            {statuses.map((s) => (
              <button
                key={s.value}
                onClick={() => handleStatusChange(s.value)}
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                  status === s.value
                    ? `${s.color} ring-2 ring-offset-1 ring-gray-400/30 dark:ring-offset-[#1a1a1a]`
                    : "bg-gray-50 text-gray-400 dark:bg-[#252525] dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Priority chips */}
        <div>
          <label className="text-[11px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium mb-1.5 block">
            Priority
          </label>
          <div className="flex flex-wrap gap-1.5">
            {priorities.map((p) => (
              <button
                key={p.value}
                onClick={() => handlePriorityChange(p.value)}
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                  priority === p.value
                    ? `${p.color} ring-2 ring-offset-1 ring-gray-400/30 dark:ring-offset-[#1a1a1a]`
                    : "bg-gray-50 text-gray-400 dark:bg-[#252525] dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Fields */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium mb-1 block">
                Date
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => {
                  setScheduledDate(e.target.value);
                }}
                onBlur={handleFieldChange}
                className="w-full text-sm border border-gray-200 dark:border-[#2a2a2a] rounded-lg px-2.5 py-1.5 dark:bg-[#0f0f0f] dark:text-gray-100"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium mb-1 block">
                Hours
              </label>
              <input
                type="number"
                step="0.5"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                onBlur={handleFieldChange}
                className="w-full text-sm border border-gray-200 dark:border-[#2a2a2a] rounded-lg px-2.5 py-1.5 dark:bg-[#0f0f0f] dark:text-gray-100"
                placeholder="e.g. 2.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium mb-1 block">
                Start
              </label>
              <input
                type="time"
                value={scheduledStart}
                onChange={(e) => setScheduledStart(e.target.value)}
                onBlur={handleFieldChange}
                className="w-full text-sm border border-gray-200 dark:border-[#2a2a2a] rounded-lg px-2.5 py-1.5 dark:bg-[#0f0f0f] dark:text-gray-100"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium mb-1 block">
                End
              </label>
              <input
                type="time"
                value={scheduledEnd}
                onChange={(e) => setScheduledEnd(e.target.value)}
                onBlur={handleFieldChange}
                className="w-full text-sm border border-gray-200 dark:border-[#2a2a2a] rounded-lg px-2.5 py-1.5 dark:bg-[#0f0f0f] dark:text-gray-100"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium mb-1 block">
              Tags
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              onBlur={handleFieldChange}
              className="w-full text-sm border border-gray-200 dark:border-[#2a2a2a] rounded-lg px-2.5 py-1.5 dark:bg-[#0f0f0f] dark:text-gray-100"
              placeholder="tag1, tag2"
            />
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium mb-1 block">
              Repeat
            </label>
            <select
              value={recurrence}
              onChange={(e) => {
                const val = e.target.value as RecurrenceType;
                setRecurrence(val);
                const base = buildUpdates() as Record<string, unknown>;
                base.recurrence = val || null;
                doSave(base);
              }}
              className="w-full text-sm border border-gray-200 dark:border-[#2a2a2a] rounded-lg px-2.5 py-1.5 bg-white dark:bg-[#0f0f0f] dark:text-gray-100"
            >
              {recurrenceOptions.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-[11px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium mb-1 block">
            Notes
          </label>
          {notesEditing ? (
            <textarea
              autoFocus
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => {
                setNotesEditing(false);
                handleFieldChange();
              }}
              rows={4}
              className="w-full text-sm border border-blue-300 dark:border-blue-600 rounded-lg px-2.5 py-2 dark:bg-[#0f0f0f] dark:text-gray-100 resize-none outline-none"
              placeholder="Add notes..."
            />
          ) : (
            <div
              onClick={() => setNotesEditing(true)}
              className="w-full text-sm border border-gray-200 dark:border-[#2a2a2a] rounded-lg px-2.5 py-2 dark:bg-[#0f0f0f] dark:text-gray-100 min-h-[6rem] cursor-text whitespace-pre-wrap"
            >
              {notes ? (
                <LinkifiedText text={notes} />
              ) : (
                <span className="text-gray-400 dark:text-gray-500">
                  Add notes...
                </span>
              )}
            </div>
          )}
        </div>

        {/* Blocked By */}
        <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
          <label className="text-[11px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium mb-1.5 block">
            Blocked By
            {blockedBy.length > 0 && (
              <span className="ml-1 normal-case">({blockedBy.length})</span>
            )}
          </label>

          {blockedBy.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {blockedBy.map((blockerId) => {
                const blocker = allTasks.find((t) => t.id === blockerId);
                return (
                  <span
                    key={blockerId}
                    className="inline-flex items-center gap-1 text-xs bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-full px-2 py-0.5"
                  >
                    <span className="max-w-[120px] truncate">
                      {blocker
                        ? `#${blocker.task_number} ${blocker.title}`
                        : blockerId.slice(0, 8)}
                    </span>
                    <button
                      onClick={() => handleBlockerRemove(blockerId)}
                      className="text-red-400 hover:text-red-600 dark:hover:text-red-300 ml-0.5"
                    >
                      &times;
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          <div className="relative">
            <input
              type="text"
              value={blockerSearch}
              onChange={(e) => {
                setBlockerSearch(e.target.value);
                setShowBlockerDropdown(true);
              }}
              onFocus={() => setShowBlockerDropdown(true)}
              onBlur={() =>
                setTimeout(() => setShowBlockerDropdown(false), 150)
              }
              placeholder="Search tasks..."
              className="w-full text-sm border border-gray-200 dark:border-[#2a2a2a] rounded-lg px-2.5 py-1.5 dark:bg-[#0f0f0f] dark:text-gray-100"
            />
            {showBlockerDropdown && blockerSearch.length > 0 && (
              <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg shadow-lg max-h-32 overflow-auto">
                {blockerCandidates.length > 0 ? (
                  blockerCandidates.slice(0, 6).map((c) => (
                    <button
                      key={c.id}
                      onMouseDown={() => handleBlockerAdd(c.id)}
                      className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <span className="text-gray-400 mr-1">
                        #{c.task_number}
                      </span>
                      <span className="truncate">{c.title}</span>
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

        {/* Subtasks */}
        {!task.parent_id && (
          <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium">
                Subtasks
                {subtasks.length > 0 && (
                  <span className="ml-1 normal-case">
                    ({subtasks.filter((s) => s.status === "done").length}/
                    {subtasks.length})
                  </span>
                )}
              </label>
              <button
                onClick={() => setAddingSubtask(true)}
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                + Add
              </button>
            </div>

            <div className="space-y-1">
              {subtasks.map((sub) => (
                <div key={sub.id} className="flex items-center gap-2 group/sub">
                  <button
                    onClick={() => handleToggleSubtaskDone(sub)}
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      sub.status === "done"
                        ? "bg-green-500 border-green-500 text-white"
                        : "border-gray-300 dark:border-gray-600 hover:border-blue-400"
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
                        ? "line-through text-gray-400 dark:text-gray-500"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {sub.title}
                  </span>
                  <button
                    onClick={() => handleDeleteSubtask(sub.id)}
                    className="text-xs text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover/sub:opacity-100 transition-opacity px-1"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>

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
                  className="flex-1 text-sm border border-gray-200 dark:border-[#2a2a2a] rounded-lg px-2.5 py-1.5 dark:bg-[#0f0f0f] dark:text-gray-100 outline-none focus:border-blue-300 dark:focus:border-blue-600"
                />
                <button
                  onClick={handleAddSubtask}
                  className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
            )}
          </div>
        )}

        {/* Metadata */}
        <div className="border-t border-gray-100 dark:border-gray-800 pt-3 text-[11px] text-gray-400 dark:text-gray-500 space-y-1">
          <p>Created: {formatDate(task.created_at)}</p>
          {task.started_at && <p>Started: {formatDate(task.started_at)}</p>}
          {task.completed_at && (
            <p>Completed: {formatDate(task.completed_at)}</p>
          )}
          <p>Updated: {formatDate(task.updated_at)}</p>
          {task.archived_at && <p>Archived: {formatDate(task.archived_at)}</p>}
        </div>
      </div>
    </div>
  );
}
