"use client";

import { KanbanTask } from "@/lib/kanban/types";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/kanban/constants";
import { useState } from "react";

interface DependencySelectorProps {
  label: string;
  taskIds: string[];
  allTasks: KanbanTask[];
  onAdd: (taskId: string) => void;
  onRemove: (taskId: string) => void;
  excludeId: string;
  colorDot?: string;
}

export default function DependencySelector({
  label,
  taskIds,
  allTasks,
  onAdd,
  onRemove,
  excludeId,
  colorDot = "#E2445C",
}: DependencySelectorProps) {
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const linkedTasks = taskIds
    .map((id) => allTasks.find((t) => t.id === id))
    .filter((t): t is KanbanTask => t != null);

  const searchResults = search.trim()
    ? allTasks
        .filter(
          (t) =>
            t.id !== excludeId &&
            !taskIds.includes(t.id) &&
            (t.id.toLowerCase().includes(search.toLowerCase()) ||
              t.title.toLowerCase().includes(search.toLowerCase())),
        )
        .slice(0, 5)
    : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xs font-semibold text-text-dim uppercase tracking-wider">
          {label}
        </span>
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="text-2xs text-accent hover:text-accent-hover font-medium"
        >
          + 추가
        </button>
      </div>

      {linkedTasks.length > 0 && (
        <div className="space-y-1 mb-2">
          {linkedTasks.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-2 px-2 py-1 rounded bg-surface-light group"
            >
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: colorDot }}
              />
              <span className="text-2xs font-mono text-text-dim">{t.id}</span>
              <span className="text-xs text-text-primary flex-1 truncate">
                {t.title}
              </span>
              <span
                className="text-2xs px-1.5 py-0.5 rounded-full"
                style={{
                  color: STATUS_COLORS[t.status],
                  backgroundColor: STATUS_COLORS[t.status] + "15",
                }}
              >
                {STATUS_LABELS[t.status]}
              </span>
              <button
                onClick={() => onRemove(t.id)}
                className="opacity-0 group-hover:opacity-100 text-text-dim hover:text-st-red transition-all"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {showSearch && (
        <div className="relative">
          <input
            type="text"
            placeholder="태스크 ID 또는 제목 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-light border border-surface-border rounded-md px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent/30"
            autoFocus
          />
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-bg-elevated border border-surface-border rounded-lg shadow-panel py-1 z-50 max-h-[200px] overflow-y-auto">
              {searchResults.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    onAdd(t.id);
                    setSearch("");
                    setShowSearch(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-surface-light flex items-center gap-2"
                >
                  <span className="font-mono text-text-dim text-2xs">
                    {t.id}
                  </span>
                  <span className="text-text-primary truncate flex-1">
                    {t.title}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {linkedTasks.length === 0 && !showSearch && (
        <p className="text-2xs text-text-dim italic">없음</p>
      )}
    </div>
  );
}
