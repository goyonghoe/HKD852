"use client";

import { useState, useRef, useCallback } from "react";
import type { TaskStatus } from "@/lib/database.types";
import { createTask, updateTask } from "@/lib/tasks";
import { parseMarkdown, parseJSON } from "@/lib/import";
import type { ParsedTask } from "@/lib/import";

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

type ImportFormat = "markdown" | "json";

const STATUS_LABELS: Record<TaskStatus, string> = {
  in_progress: "In Progress",
  today: "Today",
  thisweek: "This Week",
  backlog: "Backlog",
  waiting: "Waiting",
  done: "Done",
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: "text-red-600 dark:text-red-400",
  high: "text-orange-600 dark:text-orange-400",
  mid: "text-yellow-600 dark:text-yellow-400",
  low: "text-gray-500 dark:text-gray-400",
};

export default function ImportModal({
  open,
  onClose,
  onImported,
}: ImportModalProps) {
  const [text, setText] = useState("");
  const [format, setFormat] = useState<ImportFormat>("markdown");
  const [preview, setPreview] = useState<ParsedTask[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleParse = useCallback(() => {
    if (!text.trim()) {
      setError("Paste or upload content first");
      setPreview(null);
      return;
    }
    try {
      const parsed =
        format === "markdown" ? parseMarkdown(text) : parseJSON(text);
      if (parsed.length === 0) {
        setError("No tasks found in input");
        setPreview(null);
        return;
      }
      setPreview(parsed);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to parse input");
      setPreview(null);
    }
  }, [text, format]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isJSON = file.name.endsWith(".json");
    if (isJSON) setFormat("json");
    else setFormat("markdown");

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      setText(content);
    };
    reader.readAsText(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleImport = async () => {
    if (!preview?.length) return;
    setImporting(true);
    setError(null);

    try {
      let lastParentId: string | null = null;

      for (const task of preview) {
        if (task.isSubtask && lastParentId) {
          // Create as subtask
          const created = await createTask(task.title, task.status);
          const updates: Record<string, unknown> = {
            parent_id: lastParentId,
          };
          if (task.priority) updates.priority = task.priority;
          if (task.tags.length) updates.tags = task.tags;
          if (task.estimated_hours)
            updates.estimated_hours = task.estimated_hours;
          if (task.scheduled_date) updates.scheduled_date = task.scheduled_date;
          await updateTask(created.id, updates);
        } else {
          const created = await createTask(task.title, task.status);
          lastParentId = created.id;

          const updates: Record<string, unknown> = {};
          if (task.priority) updates.priority = task.priority;
          if (task.tags.length) updates.tags = task.tags;
          if (task.estimated_hours)
            updates.estimated_hours = task.estimated_hours;
          if (task.scheduled_date) updates.scheduled_date = task.scheduled_date;

          if (Object.keys(updates).length > 0) {
            await updateTask(created.id, updates);
          }
        }
      }

      onImported();
      handleClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to import tasks");
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setText("");
    setPreview(null);
    setError(null);
    setFormat("markdown");
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col border border-gray-200 dark:border-[#333]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-[#333]">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Import Tasks
          </h2>
          <button
            onClick={handleClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Format selector + file upload */}
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg border border-gray-200 dark:border-[#333] overflow-hidden">
              <button
                onClick={() => setFormat("markdown")}
                className={`px-3 py-1.5 text-sm ${format === "markdown" ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#252525]"}`}
              >
                Markdown
              </button>
              <button
                onClick={() => setFormat("json")}
                className={`px-3 py-1.5 text-sm ${format === "json" ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#252525]"}`}
              >
                JSON
              </button>
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-[#333] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#252525]"
            >
              Upload file
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".md,.txt,.json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Textarea */}
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setPreview(null);
            }}
            placeholder={
              format === "markdown"
                ? "Paste Markdown here...\n\n## Today\n- [ ] My task @high #work (2h)\n  - [ ] Subtask\n- [x] Done task"
                : 'Paste JSON array here...\n\n[{"title": "My task", "status": "today", "priority": "high"}]'
            }
            className="w-full h-48 px-3 py-2 text-sm font-mono rounded-lg border border-gray-200 dark:border-[#333] bg-gray-50 dark:bg-[#141414] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />

          {/* Parse button */}
          {!preview && (
            <button
              onClick={handleParse}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200"
            >
              Preview
            </button>
          )}

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          {/* Preview */}
          {preview && preview.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {preview.length} task{preview.length > 1 ? "s" : ""} found:
              </p>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-[#333] divide-y divide-gray-100 dark:divide-[#333]">
                {preview.map((task, i) => (
                  <div
                    key={i}
                    className={`px-3 py-2 text-sm ${task.isSubtask ? "pl-8" : ""}`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block w-1.5 h-1.5 rounded-full ${task.status === "done" ? "bg-green-500" : "bg-gray-400"}`}
                      />
                      <span className="text-gray-900 dark:text-gray-100">
                        {task.title}
                      </span>
                      {task.priority && (
                        <span
                          className={`text-xs ${PRIORITY_COLORS[task.priority]}`}
                        >
                          @{task.priority}
                        </span>
                      )}
                      {task.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs text-blue-600 dark:text-blue-400"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-0.5 flex gap-3">
                      <span>{STATUS_LABELS[task.status]}</span>
                      {task.estimated_hours && (
                        <span>{task.estimated_hours}h</span>
                      )}
                      {task.scheduled_date && (
                        <span>{task.scheduled_date}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {preview && preview.length > 0 && (
          <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-200 dark:border-[#333]">
            <button
              onClick={() => setPreview(null)}
              className="px-4 py-2 text-sm rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Back
            </button>
            <button
              onClick={handleImport}
              disabled={importing}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importing
                ? "Importing..."
                : `Import ${preview.length} task${preview.length > 1 ? "s" : ""}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
