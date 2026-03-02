"use client";

import { KanbanTask, ColumnConfig } from "@/lib/kanban/types";
import TaskCard from "./TaskCard";

interface KanbanColumnProps {
  column: ColumnConfig;
  tasks: KanbanTask[];
  onTaskClick: (task: KanbanTask) => void;
  compact?: boolean;
}

export default function KanbanColumn({
  column,
  tasks,
  onTaskClick,
  compact,
}: KanbanColumnProps) {
  return (
    <div className={compact ? "flex flex-col" : "flex flex-col lg:min-w-[280px] lg:max-w-[360px] lg:flex-1"}>
      {/* Column header */}
      <div className="flex items-center gap-3 px-3 py-3 mb-2">
        <div
          className="w-3.5 h-3.5 rounded"
          style={{ backgroundColor: column.color }}
        />
        <h2 className="text-sm font-semibold text-text-primary tracking-tight">
          {column.label}
        </h2>
        <span
          className="text-xs font-bold min-w-[22px] h-[22px] flex items-center justify-center rounded-md"
          style={{
            color: column.color,
            backgroundColor: column.color + "18",
          }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        className={`flex-1 rounded-xl p-2.5 space-y-3 overflow-y-auto column-scroll ${compact ? "max-h-[50vh]" : "max-h-[calc(100vh-200px)]"}`}
        style={{ backgroundColor: column.bgColor }}
      >
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-text-dim/30">
            <svg className="w-10 h-10 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <rect x="3" y="3" width="18" height="18" rx="3"/>
            </svg>
            <span className="text-xs">항목 없음</span>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={onTaskClick} />
          ))
        )}
      </div>
    </div>
  );
}
