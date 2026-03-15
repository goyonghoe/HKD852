"use client";

import React, { useMemo, useRef, useState } from "react";
import { KanbanTask } from "@/lib/kanban/types";
import {
  STATUS_COLORS,
  STATUS_LABELS,
  PRIORITY_CONFIG,
  AGENTS,
} from "@/lib/kanban/constants";
import { useKanban } from "@/lib/kanban/context";

interface TimelineViewProps {
  tasks: KanbanTask[];
}

export default function TimelineView({ tasks }: TimelineViewProps) {
  const { selectTask } = useKanban();
  const containerRef = useRef<HTMLDivElement>(null);

  // Compute date range
  const { startDate, endDate, days, sprintGroups } = useMemo(() => {
    const now = new Date();
    let minDate = now;
    let maxDate = new Date(now.getTime() + 30 * 86400000); // 30 days ahead default

    for (const t of tasks) {
      if (t.start_date) {
        const sd = new Date(t.start_date);
        if (sd < minDate) minDate = sd;
      }
      if (t.created_at) {
        const cd = new Date(t.created_at);
        if (cd < minDate) minDate = cd;
      }
      if (t.due_date) {
        const dd = new Date(t.due_date);
        if (dd > maxDate) maxDate = dd;
      }
    }

    // Add padding
    minDate = new Date(minDate.getTime() - 2 * 86400000);
    maxDate = new Date(maxDate.getTime() + 5 * 86400000);

    const daysDiff = Math.ceil(
      (maxDate.getTime() - minDate.getTime()) / 86400000,
    );
    const dayArr = Array.from({ length: daysDiff }, (_, i) => {
      const d = new Date(minDate.getTime() + i * 86400000);
      return d;
    });

    // Group tasks by sprint
    const groups = new Map<string, KanbanTask[]>();
    for (const t of tasks) {
      const key = t.sprint ?? "미지정";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(t);
    }

    return {
      startDate: minDate,
      endDate: maxDate,
      days: dayArr,
      sprintGroups: groups,
    };
  }, [tasks]);

  const dayWidth = 32; // pixels per day
  const rowHeight = 36;
  const headerHeight = 60;
  const totalWidth = days.length * dayWidth;

  const getBarPosition = (task: KanbanTask) => {
    const start = task.start_date
      ? new Date(task.start_date)
      : new Date(task.created_at);
    const end = task.due_date
      ? new Date(task.due_date)
      : task.estimate_hours
        ? new Date(start.getTime() + task.estimate_hours * 3600000)
        : new Date(start.getTime() + 7 * 86400000); // default 7 days

    const left = Math.max(
      0,
      ((start.getTime() - startDate.getTime()) / 86400000) * dayWidth,
    );
    const width = Math.max(
      dayWidth,
      ((end.getTime() - start.getTime()) / 86400000) * dayWidth,
    );
    return { left, width };
  };

  const todayOffset =
    ((Date.now() - startDate.getTime()) / 86400000) * dayWidth;

  let rowIndex = 0;

  return (
    <div className="max-w-[1920px] mx-auto px-5 sm:px-8 py-4">
      <div className="bg-surface border border-surface-border rounded-lg overflow-hidden">
        <div
          ref={containerRef}
          className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-220px)]"
        >
          <div style={{ minWidth: totalWidth + 200, position: "relative" }}>
            {/* Date header */}
            <div
              className="sticky top-0 z-10 flex bg-surface-light/80 backdrop-blur-sm border-b border-surface-border"
              style={{ height: headerHeight }}
            >
              <div className="w-[200px] shrink-0 px-3 flex items-end pb-2 border-r border-surface-border">
                <span className="text-2xs font-semibold text-text-dim uppercase">
                  태스크
                </span>
              </div>
              <div className="flex relative">
                {days.map((d, i) => {
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  const isMonthStart = d.getDate() === 1;
                  return (
                    <div
                      key={i}
                      className={`flex flex-col items-center justify-end pb-1 border-r border-surface-border/30 ${
                        isWeekend ? "bg-surface-light/50" : ""
                      }`}
                      style={{ width: dayWidth }}
                    >
                      {isMonthStart && (
                        <span className="text-2xs font-semibold text-text-primary mb-0.5">
                          {d.getMonth() + 1}월
                        </span>
                      )}
                      <span
                        className={`text-2xs ${isWeekend ? "text-text-dim/50" : "text-text-dim"}`}
                      >
                        {d.getDate()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sprint groups */}
            {Array.from(sprintGroups.entries()).map(
              ([sprintName, sprintTasks]) => {
                const groupStartRow = rowIndex;
                return (
                  <div key={sprintName}>
                    {/* Sprint header row */}
                    <div
                      className="flex border-b border-surface-border bg-surface-light/30"
                      style={{ height: 28 }}
                    >
                      <div className="w-[200px] shrink-0 px-3 flex items-center">
                        <span className="text-2xs font-semibold text-accent">
                          {sprintName}
                        </span>
                        <span className="text-2xs text-text-dim ml-1.5">
                          ({sprintTasks.length})
                        </span>
                      </div>
                    </div>

                    {/* Task rows */}
                    {sprintTasks.map((task) => {
                      const bar = getBarPosition(task);
                      const statusColor =
                        STATUS_COLORS[task.status] ?? "#C4C4C4";
                      const agentInfo = AGENTS.find(
                        (a) => a.name === task.assignee,
                      );
                      rowIndex++;

                      return (
                        <div
                          key={task.id}
                          className="flex border-b border-surface-border/40 hover:bg-surface-light/50 transition-colors cursor-pointer"
                          style={{ height: rowHeight }}
                          onClick={() => selectTask(task.id)}
                        >
                          {/* Task label */}
                          <div className="w-[200px] shrink-0 px-3 flex items-center gap-2 border-r border-surface-border/50">
                            <div
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: statusColor }}
                            />
                            <span className="text-2xs font-mono text-text-dim shrink-0">
                              {task.id}
                            </span>
                            <span className="text-xs text-text-primary truncate">
                              {task.title}
                            </span>
                          </div>

                          {/* Gantt area */}
                          <div className="flex-1 relative">
                            {/* Weekend stripes */}
                            {days.map((d, i) => {
                              if (d.getDay() === 0 || d.getDay() === 6) {
                                return (
                                  <div
                                    key={i}
                                    className="absolute top-0 bottom-0 bg-surface-light/30"
                                    style={{
                                      left: i * dayWidth,
                                      width: dayWidth,
                                    }}
                                  />
                                );
                              }
                              return null;
                            })}

                            {/* Today marker */}
                            <div
                              className="absolute top-0 bottom-0 w-px bg-accent/40"
                              style={{ left: todayOffset }}
                            />

                            {/* Task bar */}
                            <div
                              className="absolute top-[6px] h-[24px] rounded-md flex items-center px-2 group transition-all hover:brightness-110"
                              style={{
                                left: bar.left,
                                width: bar.width,
                                backgroundColor: statusColor + "30",
                                borderLeft: `3px solid ${statusColor}`,
                              }}
                            >
                              <span className="text-2xs text-text-primary truncate font-medium">
                                {task.title}
                              </span>
                            </div>

                            {/* Dependency arrows */}
                            {/* Rendered as simple lines for blocked_by */}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              },
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
