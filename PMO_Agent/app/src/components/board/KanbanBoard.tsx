"use client";

import { useState } from "react";
import { KanbanTask, Division, Priority } from "@/lib/kanban/types";
import { COLUMNS } from "@/lib/kanban/constants";
import {
  getTasksForColumn,
  filterTasks,
  getUniqueSprints,
} from "@/lib/kanban/helpers";
import KanbanColumn from "./KanbanColumn";
import TaskCard from "./TaskCard";
import TaskDetail from "./TaskDetail";
import FilterBar from "../filters/FilterBar";

interface KanbanBoardProps {
  tasks: KanbanTask[];
}

interface Filters {
  division: Division | "all";
  assignee: string | "all";
  priority: Priority | "all";
  sprint: string | "all";
  search: string;
}

export default function KanbanBoard({ tasks }: KanbanBoardProps) {
  const [filters, setFilters] = useState<Filters>({
    division: "all",
    assignee: "all",
    priority: "all",
    sprint: "all",
    search: "",
  });
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);

  const sprints = getUniqueSprints(tasks);
  const filtered = filterTasks(tasks, filters);

  return (
    <>
      <FilterBar
        filters={filters}
        onFilterChange={setFilters}
        sprints={sprints}
      />

      {/* Board */}
      <div className="max-w-[1920px] mx-auto px-5 sm:px-8 py-6">
        {/* Desktop (1024px+): 5-column horizontal flex */}
        <div className="hidden lg:flex gap-5">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              column={col}
              tasks={getTasksForColumn(filtered, col)}
              onTaskClick={setSelectedTask}
            />
          ))}
        </div>

        {/* Tablet (640~1023px): 2-column grid */}
        <div className="hidden sm:grid lg:hidden grid-cols-2 gap-4">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              column={col}
              tasks={getTasksForColumn(filtered, col)}
              onTaskClick={setSelectedTask}
              compact
            />
          ))}
        </div>

        {/* Mobile (<640px): vertical accordion */}
        <div className="sm:hidden space-y-3">
          {COLUMNS.map((col) => {
            const colTasks = getTasksForColumn(filtered, col);
            return (
              <details
                key={col.id}
                open={col.id !== "final_done"}
                className="bg-surface/30 rounded-xl overflow-hidden border border-surface-border/30"
              >
                <summary className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-surface/50 transition-colors">
                  <div
                    className="w-3.5 h-3.5 rounded"
                    style={{ backgroundColor: col.color }}
                  />
                  <span className="text-sm font-semibold text-text-primary flex-1">
                    {col.label}
                  </span>
                  <span
                    className="text-xs font-bold min-w-[22px] h-[22px] flex items-center justify-center rounded-md"
                    style={{
                      color: col.color,
                      backgroundColor: col.color + "18",
                    }}
                  >
                    {colTasks.length}
                  </span>
                </summary>
                <div className="px-3 pb-3 space-y-2.5">
                  {colTasks.length === 0 ? (
                    <p className="text-xs text-text-dim text-center py-8">
                      항목 없음
                    </p>
                  ) : (
                    colTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onClick={setSelectedTask}
                      />
                    ))
                  )}
                </div>
              </details>
            );
          })}
        </div>

        {/* Empty state */}
        {tasks.length === 0 && (
          <div className="text-center py-28">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-surface flex items-center justify-center">
              <svg
                className="w-8 h-8 text-text-dim/30"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <path d="M8 12h8M12 8v8" />
              </svg>
            </div>
            <p className="text-text-secondary text-base font-medium mb-2">
              태스크가 없습니다
            </p>
            <p className="text-sm text-text-dim">
              <code className="text-accent bg-accent/10 px-2 py-0.5 rounded">/kanban-create</code>로 첫 태스크를 생성하세요
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </>
  );
}

