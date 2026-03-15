"use client";

import React from "react";
import { KanbanTask } from "@/lib/kanban/types";
import {
  STATUS_COLORS,
  STATUS_LABELS,
  PRIORITY_CONFIG,
  AGENTS,
} from "@/lib/kanban/constants";
import { formatDate } from "@/lib/kanban/helpers";

interface TableRowProps {
  task: KanbanTask;
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
  isTaskBlocked: boolean;
  onToggleExpand: () => void;
  onSelect: () => void;
}

function TableRowInner({
  task,
  depth,
  hasChildren,
  isExpanded,
  isTaskBlocked,
  onToggleExpand,
  onSelect,
}: TableRowProps) {
  const statusColor = STATUS_COLORS[task.status] ?? "#C4C4C4";
  const priorityCfg = PRIORITY_CONFIG[task.priority];
  const agentInfo = AGENTS.find((a) => a.name === task.assignee);

  return (
    <div
      className={`flex items-center gap-2 px-3 h-10 border-b border-surface-border/60 hover:bg-surface-light transition-colors cursor-pointer group contain-layout ${
        isTaskBlocked ? "opacity-50" : ""
      }`}
      onClick={onSelect}
    >
      {/* Expand chevron */}
      <div
        className="w-6 flex items-center justify-center"
        style={{ paddingLeft: depth * 20 }}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
            className="w-4 h-4 flex items-center justify-center text-text-dim hover:text-text-secondary transition-colors"
          >
            <svg
              className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-90" : ""}`}
              fill="none"
              viewBox="0 0 12 12"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M4 2.5L7.5 6L4 9.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ) : (
          <div className="w-4" />
        )}
      </div>

      {/* ID */}
      <span className="w-20 text-2xs font-mono text-text-dim shrink-0">
        {task.id}
      </span>

      {/* Project */}
      <div className="w-24 shrink-0 hidden sm:block">
        {task.project && (
          <span className="text-2xs font-semibold px-1.5 py-0.5 rounded bg-accent/8 text-accent">
            {task.project}
          </span>
        )}
      </div>

      {/* Title */}
      <div className="flex-1 min-w-0 flex items-center gap-1.5">
        <span className="text-xs text-text-primary truncate group-hover:text-accent transition-colors">
          {task.title}
        </span>
        {isTaskBlocked && (
          <svg
            className="w-3 h-3 text-st-red shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        )}
        {task.children.length > 0 && (
          <span className="text-2xs text-text-dim bg-surface-light px-1 py-0.5 rounded shrink-0">
            {task.children.length}
          </span>
        )}
      </div>

      {/* Status */}
      <div className="w-20 shrink-0">
        <span
          className="inline-flex items-center gap-1 text-2xs font-medium px-1.5 py-0.5 rounded-full"
          style={{ color: statusColor, backgroundColor: statusColor + "12" }}
        >
          <div
            className={`w-1.5 h-1.5 rounded-full ${task.status === "in_progress" ? "pulse-dot" : ""}`}
            style={{ backgroundColor: statusColor }}
          />
          {STATUS_LABELS[task.status]}
        </span>
      </div>

      {/* Priority */}
      <div className="w-16 shrink-0">
        <span
          className="inline-flex items-center gap-1 text-2xs font-medium px-1.5 py-0.5 rounded-full"
          style={{
            color: priorityCfg.color,
            backgroundColor: priorityCfg.bgColor,
          }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: priorityCfg.dot }}
          />
          {priorityCfg.label}
        </span>
      </div>

      {/* Assignee */}
      <div className="w-16 shrink-0">
        {agentInfo ? (
          <div className="flex items-center gap-1">
            <div
              className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold text-white"
              style={{ backgroundColor: agentInfo.color }}
            >
              {agentInfo.initials}
            </div>
            <span className="text-2xs text-text-secondary">
              {agentInfo.label}
            </span>
          </div>
        ) : (
          <span className="text-2xs text-text-dim">-</span>
        )}
      </div>

      {/* Sprint */}
      <div className="w-20 shrink-0 hidden md:block">
        <span className="text-2xs text-text-dim">{task.sprint ?? "-"}</span>
      </div>

      {/* Updated */}
      <div className="w-16 shrink-0 hidden lg:block">
        <span className="text-2xs text-text-dim">
          {task.updated_at ? formatDate(task.updated_at) : "-"}
        </span>
      </div>
    </div>
  );
}

const TableRow = React.memo(TableRowInner);
export default TableRow;
