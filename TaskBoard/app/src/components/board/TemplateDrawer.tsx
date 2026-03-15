"use client";

import { useState, useEffect, useCallback } from "react";
import type { Task, TaskStatus, TaskPriority } from "@/lib/database.types";
import {
  fetchTemplates,
  createTemplate,
  deleteTemplate,
  applyTemplate,
  type TaskTemplate,
  type TemplateItem,
} from "@/lib/templates";

interface TemplateDrawerProps {
  open: boolean;
  onClose: () => void;
  tasks: Task[];
  onApplied: () => void;
}

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: "backlog", label: "Backlog" },
  { value: "thisweek", label: "This Week" },
  { value: "today", label: "Today" },
  { value: "in_progress", label: "In Progress" },
];

const priorityOptions: (TaskPriority | "")[] = [
  "",
  "critical",
  "high",
  "mid",
  "low",
];

export default function TemplateDrawer({
  open,
  onClose,
  tasks,
  onApplied,
}: TemplateDrawerProps) {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [applyStatus, setApplyStatus] = useState<TaskStatus>("today");

  // Create form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<TemplateItem[]>([
    { title: "", priority: null, tags: [], estimated_hours: null },
  ]);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTemplates();
      setTemplates(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load templates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) loadTemplates();
  }, [open, loadTemplates]);

  const handleCreate = async () => {
    const validItems = items.filter((i) => i.title.trim());
    if (!name.trim() || validItems.length === 0) return;

    try {
      await createTemplate(name.trim(), description.trim() || null, validItems);
      setName("");
      setDescription("");
      setItems([
        { title: "", priority: null, tags: [], estimated_hours: null },
      ]);
      setShowCreate(false);
      await loadTemplates();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create template",
      );
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTemplate(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const handleApply = async (id: string) => {
    try {
      await applyTemplate(id, applyStatus);
      onApplied();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply template");
    }
  };

  const handleSaveBoard = async () => {
    const nonDone = tasks.filter((t) => t.status !== "done" && !t.parent_id);
    if (nonDone.length === 0) return;

    const boardItems: TemplateItem[] = nonDone.map((t) => ({
      title: t.title,
      priority: t.priority,
      tags: t.tags ?? [],
      estimated_hours: t.estimated_hours,
    }));

    const today = new Date().toISOString().slice(0, 10);
    try {
      await createTemplate(
        `Board Snapshot ${today}`,
        `Saved from board on ${today}`,
        boardItems,
      );
      await loadTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save board");
    }
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { title: "", priority: null, tags: [], estimated_hours: null },
    ]);
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: string, value: unknown) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)),
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 dark:bg-black/50"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white dark:bg-[#1a1a1a] h-full overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-[#2a2a2a] px-4 py-3 flex items-center justify-between z-10">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Templates
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
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

        <div className="p-4 space-y-4">
          {error && (
            <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded">
              {error}
              <button
                onClick={() => setError(null)}
                className="ml-2 font-medium"
              >
                x
              </button>
            </div>
          )}

          {/* Apply target status */}
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>Apply to:</span>
            <select
              value={applyStatus}
              onChange={(e) => setApplyStatus(e.target.value as TaskStatus)}
              className="text-xs border border-gray-200 dark:border-[#333] rounded px-2 py-1 bg-white dark:bg-[#252525] text-gray-700 dark:text-gray-300"
            >
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="text-xs px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700"
            >
              {showCreate ? "Cancel" : "Create Template"}
            </button>
            <button
              onClick={handleSaveBoard}
              className="text-xs px-3 py-1.5 rounded-md border border-gray-200 dark:border-[#333] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#252525]"
            >
              Save Board as Template
            </button>
          </div>

          {/* Create form */}
          {showCreate && (
            <div className="border border-gray-200 dark:border-[#333] rounded-lg p-3 space-y-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Template name"
                className="w-full text-sm border border-gray-200 dark:border-[#333] rounded px-2.5 py-1.5 bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
                className="w-full text-sm border border-gray-200 dark:border-[#333] rounded px-2.5 py-1.5 bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />

              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Items
                </div>
                {items.map((item, idx) => (
                  <div key={idx} className="flex gap-1.5 items-start">
                    <input
                      value={item.title}
                      onChange={(e) => updateItem(idx, "title", e.target.value)}
                      placeholder="Task title"
                      className="flex-1 text-xs border border-gray-200 dark:border-[#333] rounded px-2 py-1.5 bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                    />
                    <select
                      value={item.priority ?? ""}
                      onChange={(e) =>
                        updateItem(idx, "priority", e.target.value || null)
                      }
                      className="text-xs border border-gray-200 dark:border-[#333] rounded px-1.5 py-1.5 bg-white dark:bg-[#252525] text-gray-700 dark:text-gray-300 w-20"
                    >
                      {priorityOptions.map((p) => (
                        <option key={p} value={p}>
                          {p || "—"}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={item.estimated_hours ?? ""}
                      onChange={(e) =>
                        updateItem(
                          idx,
                          "estimated_hours",
                          e.target.value ? Number(e.target.value) : null,
                        )
                      }
                      placeholder="hrs"
                      className="w-14 text-xs border border-gray-200 dark:border-[#333] rounded px-1.5 py-1.5 bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                    />
                    <input
                      value={(item.tags ?? []).join(", ")}
                      onChange={(e) =>
                        updateItem(
                          idx,
                          "tags",
                          e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        )
                      }
                      placeholder="tags"
                      className="w-20 text-xs border border-gray-200 dark:border-[#333] rounded px-1.5 py-1.5 bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                    />
                    {items.length > 1 && (
                      <button
                        onClick={() => removeItem(idx)}
                        className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-1"
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
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addItem}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  + Add item
                </button>
              </div>

              <button
                onClick={handleCreate}
                disabled={!name.trim() || items.every((i) => !i.title.trim())}
                className="w-full text-xs py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Save Template
              </button>
            </div>
          )}

          {/* Template list */}
          {loading ? (
            <div className="text-xs text-gray-400 dark:text-gray-500 py-4 text-center">
              Loading...
            </div>
          ) : templates.length === 0 ? (
            <div className="text-xs text-gray-400 dark:text-gray-500 py-8 text-center">
              No templates yet
            </div>
          ) : (
            <div className="space-y-2">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="border border-gray-200 dark:border-[#333] rounded-lg p-3"
                >
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {tpl.name}
                      </div>
                      {tpl.description && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {tpl.description}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => handleApply(tpl.id)}
                        className="text-xs px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700"
                      >
                        Apply
                      </button>
                      <button
                        onClick={() => handleDelete(tpl.id)}
                        className="text-xs px-2 py-1 rounded border border-gray-200 dark:border-[#333] text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {(tpl.items as TemplateItem[]).length} item
                    {(tpl.items as TemplateItem[]).length !== 1 ? "s" : ""}
                    <span className="mx-1">·</span>
                    {(tpl.items as TemplateItem[])
                      .slice(0, 3)
                      .map((i) => i.title)
                      .join(", ")}
                    {(tpl.items as TemplateItem[]).length > 3 ? "..." : ""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
