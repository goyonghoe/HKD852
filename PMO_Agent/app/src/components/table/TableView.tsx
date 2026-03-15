"use client";

import React, { useMemo, useState, useRef } from "react";
import { KanbanTask, Priority, Division } from "@/lib/kanban/types";
import {
  STATUS_COLORS,
  STATUS_LABELS,
  PRIORITY_CONFIG,
  AGENTS,
  DIVISION_CONFIG,
} from "@/lib/kanban/constants";
import { formatDate, isBlocked } from "@/lib/kanban/helpers";
import { buildTree, flattenTree } from "@/lib/kanban/tree";
import { useKanban } from "@/lib/kanban/context";
import { useVirtualizer } from "@/lib/hooks/useVirtualizer";
import TableRow from "./TableRow";

type SortKey =
  | "id"
  | "title"
  | "priority"
  | "status"
  | "assignee"
  | "sprint"
  | "updated_at";
type SortDir = "asc" | "desc";

interface TableViewProps {
  tasks: KanbanTask[];
}

const PRIORITY_ORDER: Record<Priority, number> = {
  critical: 0,
  high: 1,
  mid: 2,
  low: 3,
};

export default function TableView({ tasks }: TableViewProps) {
  const { expandedIds, toggleExpanded, selectTask } = useKanban();
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const containerRef = useRef<HTMLDivElement>(null);

  const tree = useMemo(() => buildTree(tasks), [tasks]);
  const flatItems = useMemo(
    () => flattenTree(tree, expandedIds),
    [tree, expandedIds],
  );

  const sorted = useMemo(() => {
    const arr = [...flatItems];
    arr.sort((a, b) => {
      // Keep tree structure: only sort root-level items, children stay grouped under parents
      if (a.depth !== b.depth) return 0;
      const tA = a.task;
      const tB = b.task;
      let cmp = 0;
      switch (sortKey) {
        case "id":
          cmp = tA.id.localeCompare(tB.id);
          break;
        case "title":
          cmp = tA.title.localeCompare(tB.title);
          break;
        case "priority":
          cmp = PRIORITY_ORDER[tA.priority] - PRIORITY_ORDER[tB.priority];
          break;
        case "status":
          cmp = tA.status.localeCompare(tB.status);
          break;
        case "assignee":
          cmp = (tA.assignee ?? "").localeCompare(tB.assignee ?? "");
          break;
        case "sprint":
          cmp = (tA.sprint ?? "").localeCompare(tB.sprint ?? "");
          break;
        case "updated_at":
          cmp =
            new Date(tA.updated_at).getTime() -
            new Date(tB.updated_at).getTime();
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [flatItems, sortKey, sortDir]);

  const { virtualItems, totalHeight } = useVirtualizer({
    itemCount: sorted.length,
    itemHeight: 40,
    containerRef,
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortHeader = ({
    label,
    sortKeyProp,
    className = "",
  }: {
    label: string;
    sortKeyProp: SortKey;
    className?: string;
  }) => (
    <button
      onClick={() => handleSort(sortKeyProp)}
      className={`text-left text-2xs font-semibold text-text-dim uppercase tracking-wider hover:text-text-secondary transition-colors flex items-center gap-1 ${className}`}
    >
      {label}
      {sortKey === sortKeyProp && (
        <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="currentColor">
          {sortDir === "asc" ? (
            <path d="M5 2L9 7H1L5 2Z" />
          ) : (
            <path d="M5 8L1 3H9L5 8Z" />
          )}
        </svg>
      )}
    </button>
  );

  return (
    <div className="max-w-[1920px] mx-auto px-5 sm:px-8 py-4">
      <div className="bg-surface border border-surface-border rounded-lg overflow-hidden">
        {/* Table header */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-surface-border bg-surface-light/50 sticky top-0 z-10">
          <div className="w-6" /> {/* Expand chevron */}
          <SortHeader label="ID" sortKeyProp="id" className="w-20" />
          <div className="w-24 shrink-0 hidden sm:block">
            <span className="text-2xs font-semibold text-text-dim uppercase tracking-wider">프로젝트</span>
          </div>
          <SortHeader
            label="제목"
            sortKeyProp="title"
            className="flex-1 min-w-0"
          />
          <SortHeader label="상태" sortKeyProp="status" className="w-20" />
          <SortHeader
            label="우선순위"
            sortKeyProp="priority"
            className="w-16"
          />
          <SortHeader label="담당자" sortKeyProp="assignee" className="w-16" />
          <SortHeader
            label="스프린트"
            sortKeyProp="sprint"
            className="w-20 hidden md:flex"
          />
          <SortHeader
            label="업데이트"
            sortKeyProp="updated_at"
            className="w-16 hidden lg:flex"
          />
        </div>

        {/* Virtual scroll container */}
        <div
          ref={containerRef}
          className="overflow-y-auto max-h-[calc(100vh-240px)]"
        >
          <div style={{ height: totalHeight, position: "relative" }}>
            {(virtualItems.length > 0
              ? virtualItems
              : sorted.map((_, i) => ({ index: i, offsetTop: i * 40 }))
            ).map((vi) => {
              const item = sorted[vi.index];
              if (!item) return null;
              return (
                <div
                  key={item.task.id}
                  style={{
                    position: "absolute",
                    top: vi.offsetTop,
                    left: 0,
                    right: 0,
                    height: 40,
                  }}
                >
                  <TableRow
                    task={item.task}
                    depth={item.depth}
                    hasChildren={item.task.children.length > 0}
                    isExpanded={expandedIds.has(item.task.id)}
                    isTaskBlocked={isBlocked(item.task, tasks)}
                    onToggleExpand={() => toggleExpanded(item.task.id)}
                    onSelect={() => selectTask(item.task.id)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
