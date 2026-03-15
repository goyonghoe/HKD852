"use client";

import React, { useMemo } from "react";
import { KanbanTask, Division, Priority } from "@/lib/kanban/types";
import {
  DIVISION_CONFIG,
  PRIORITY_CONFIG,
  STATUS_COLORS,
  STATUS_LABELS,
  AGENTS,
  COLUMNS,
} from "@/lib/kanban/constants";
import {
  formatTokens,
  getDivisionStats,
  getColumnCounts,
  getTotalTokensForTasks,
} from "@/lib/kanban/helpers";

interface DashboardViewProps {
  tasks: KanbanTask[];
}

export default function DashboardView({ tasks }: DashboardViewProps) {
  const divisionStats = useMemo(() => getDivisionStats(tasks), [tasks]);
  const columnCounts = useMemo(() => getColumnCounts(tasks), [tasks]);
  const tokenStats = useMemo(() => getTotalTokensForTasks(tasks), [tasks]);

  const agentWorkload = useMemo(() => {
    const map = new Map<
      string,
      { inProgress: number; done: number; total: number }
    >();
    for (const a of AGENTS) {
      map.set(a.name, { inProgress: 0, done: 0, total: 0 });
    }
    for (const t of tasks) {
      if (t.assignee && map.has(t.assignee)) {
        const entry = map.get(t.assignee)!;
        entry.total++;
        if (t.status === "in_progress") entry.inProgress++;
        if (t.status === "final_done") entry.done++;
      }
    }
    return map;
  }, [tasks]);

  const sprintBurndown = useMemo(() => {
    const sprints = new Map<string, { total: number; remaining: number }>();
    for (const t of tasks) {
      if (t.sprint) {
        if (!sprints.has(t.sprint))
          sprints.set(t.sprint, { total: 0, remaining: 0 });
        const s = sprints.get(t.sprint)!;
        s.total++;
        if (t.status !== "final_done") s.remaining++;
      }
    }
    return sprints;
  }, [tasks]);

  const statusDist = useMemo(() => {
    const dist: Record<string, number> = {};
    for (const t of tasks) {
      dist[t.status] = (dist[t.status] ?? 0) + 1;
    }
    return dist;
  }, [tasks]);

  const priorityMatrix = useMemo(() => {
    const matrix: Record<string, Record<string, number>> = {};
    const priorities: Priority[] = ["critical", "high", "mid", "low"];
    const statuses = Object.keys(STATUS_LABELS);
    for (const p of priorities) {
      matrix[p] = {};
      for (const s of statuses) matrix[p][s] = 0;
    }
    for (const t of tasks) {
      if (matrix[t.priority])
        matrix[t.priority][t.status] = (matrix[t.priority][t.status] ?? 0) + 1;
    }
    return matrix;
  }, [tasks]);

  const agentTokens = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of tasks) {
      if (t.token_usage) {
        for (const e of t.token_usage.entries) {
          map.set(e.by, (map.get(e.by) ?? 0) + e.input + e.output);
        }
      }
    }
    return map;
  }, [tasks]);

  const totalDone = tasks.filter((t) => t.status === "final_done").length;
  const overallProgress =
    tasks.length > 0 ? Math.round((totalDone / tasks.length) * 100) : 0;

  return (
    <div className="max-w-[1920px] mx-auto px-5 sm:px-8 py-5">
      {/* Top KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KPICard
          label="전체 진행률"
          value={`${overallProgress}%`}
          accent="#0073EA"
        >
          <div className="w-full h-1.5 bg-surface-border rounded-full overflow-hidden mt-1.5">
            <div
              className="h-full bg-accent rounded-full"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </KPICard>
        <KPICard
          label="전체 태스크"
          value={String(tasks.length)}
          accent="#579BFC"
        />
        <KPICard
          label="진행 중"
          value={String(columnCounts.in_progress ?? 0)}
          accent="#579BFC"
        />
        <KPICard
          label="총 토큰"
          value={formatTokens(tokenStats.total)}
          accent="#A25DDC"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Division Progress */}
        <Widget title="디비전별 진행률">
          <div className="space-y-3">
            {(
              Object.entries(DIVISION_CONFIG) as [
                Division,
                (typeof DIVISION_CONFIG)["game"],
              ][]
            ).map(([key, cfg]) => {
              const stat = divisionStats[key];
              const pct =
                stat.total > 0 ? Math.round((stat.done / stat.total) * 100) : 0;
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: cfg.color }}
                      />
                      <span className="text-xs font-medium text-text-primary">
                        {cfg.labelKo}
                      </span>
                    </div>
                    <span className="text-2xs text-text-dim">
                      {stat.done}/{stat.total} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 bg-surface-border rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: cfg.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Widget>

        {/* Agent Workload */}
        <Widget title="에이전트 워크로드">
          <div className="space-y-2.5">
            {AGENTS.map((a) => {
              const wl = agentWorkload.get(a.name) ?? {
                inProgress: 0,
                done: 0,
                total: 0,
              };
              return (
                <div key={a.name} className="flex items-center gap-2.5">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-bold text-white shrink-0"
                    style={{ backgroundColor: a.color }}
                  >
                    {a.initials}
                  </div>
                  <span className="text-xs text-text-primary w-12 shrink-0">
                    {a.label}
                  </span>
                  <div className="flex-1 flex items-center gap-1 h-4">
                    {wl.inProgress > 0 && (
                      <div
                        className="h-full bg-st-blue/20 rounded flex items-center justify-center px-1"
                        style={{ flex: wl.inProgress }}
                      >
                        <span className="text-2xs text-st-blue font-medium">
                          {wl.inProgress}
                        </span>
                      </div>
                    )}
                    {wl.done > 0 && (
                      <div
                        className="h-full bg-st-green/20 rounded flex items-center justify-center px-1"
                        style={{ flex: wl.done }}
                      >
                        <span className="text-2xs text-st-green font-medium">
                          {wl.done}
                        </span>
                      </div>
                    )}
                    {wl.total === 0 && (
                      <span className="text-2xs text-text-dim">-</span>
                    )}
                  </div>
                  <span className="text-2xs text-text-dim w-8 text-right shrink-0">
                    {wl.total}
                  </span>
                </div>
              );
            })}
          </div>
        </Widget>

        {/* Sprint Burndown */}
        <Widget title="스프린트 번다운">
          <div className="space-y-2.5">
            {Array.from(sprintBurndown.entries())
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([sprint, data]) => {
                const pct =
                  data.total > 0
                    ? Math.round(
                        ((data.total - data.remaining) / data.total) * 100,
                      )
                    : 0;
                return (
                  <div key={sprint}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-accent">
                        {sprint}
                      </span>
                      <span className="text-2xs text-text-dim">
                        남은: {data.remaining}/{data.total}
                      </span>
                    </div>
                    <div className="h-2 bg-surface-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent/60 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            {sprintBurndown.size === 0 && (
              <p className="text-2xs text-text-dim text-center py-4">
                스프린트 데이터 없음
              </p>
            )}
          </div>
        </Widget>

        {/* Status Distribution - donut */}
        <Widget title="상태 분포">
          <div className="flex items-center gap-4">
            <div className="relative w-24 h-24 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {(() => {
                  let offset = 0;
                  const total = tasks.length || 1;
                  return Object.entries(statusDist).map(([status, count]) => {
                    const pct = (count / total) * 100;
                    const circumference = 2 * Math.PI * 40;
                    const dash = (pct / 100) * circumference;
                    const el = (
                      <circle
                        key={status}
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke={STATUS_COLORS[status] ?? "#C4C4C4"}
                        strokeWidth="12"
                        strokeDasharray={`${dash} ${circumference - dash}`}
                        strokeDashoffset={-(offset / 100) * circumference}
                      />
                    );
                    offset += pct;
                    return el;
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-text-primary">
                  {tasks.length}
                </span>
              </div>
            </div>
            <div className="flex-1 space-y-1">
              {Object.entries(statusDist).map(([status, count]) => (
                <div key={status} className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: STATUS_COLORS[status] ?? "#C4C4C4",
                    }}
                  />
                  <span className="text-2xs text-text-secondary flex-1">
                    {STATUS_LABELS[status] ?? status}
                  </span>
                  <span className="text-2xs font-medium text-text-primary">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Widget>

        {/* Priority × Status matrix */}
        <Widget title="우선순위 히트맵">
          <div className="overflow-x-auto">
            <table className="w-full text-2xs">
              <thead>
                <tr>
                  <th className="text-left text-text-dim font-medium pb-1.5 pr-2">
                    -
                  </th>
                  {Object.entries(STATUS_LABELS).map(([s, label]) => (
                    <th
                      key={s}
                      className="text-center text-text-dim font-medium pb-1.5 px-1 whitespace-nowrap"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(["critical", "high", "mid", "low"] as Priority[]).map((p) => (
                  <tr key={p}>
                    <td className="py-1 pr-2">
                      <span
                        className="font-medium"
                        style={{ color: PRIORITY_CONFIG[p].color }}
                      >
                        {PRIORITY_CONFIG[p].label}
                      </span>
                    </td>
                    {Object.keys(STATUS_LABELS).map((s) => {
                      const count = priorityMatrix[p]?.[s] ?? 0;
                      return (
                        <td key={s} className="text-center py-1 px-1">
                          {count > 0 ? (
                            <span
                              className="inline-block w-6 h-5 rounded text-white font-bold flex items-center justify-center text-2xs"
                              style={{
                                backgroundColor:
                                  PRIORITY_CONFIG[p].color +
                                  (count > 3 ? "80" : count > 1 ? "50" : "30"),
                                color:
                                  count > 1 ? "#fff" : PRIORITY_CONFIG[p].color,
                              }}
                            >
                              {count}
                            </span>
                          ) : (
                            <span className="text-text-dim/30">·</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Widget>

        {/* Token Usage by Agent */}
        <Widget title="에이전트별 토큰 사용량">
          <div className="space-y-2">
            {AGENTS.map((a) => {
              const tokens = agentTokens.get(a.name) ?? 0;
              const maxTokens = Math.max(
                ...Array.from(agentTokens.values()),
                1,
              );
              const pct = (tokens / maxTokens) * 100;
              return (
                <div key={a.name} className="flex items-center gap-2.5">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-bold text-white shrink-0"
                    style={{ backgroundColor: a.color }}
                  >
                    {a.initials}
                  </div>
                  <span className="text-xs text-text-primary w-12 shrink-0">
                    {a.label}
                  </span>
                  <div className="flex-1 h-2 bg-surface-border rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: a.color + "80",
                      }}
                    />
                  </div>
                  <span className="text-2xs font-mono text-text-dim w-12 text-right shrink-0">
                    {tokens > 0 ? formatTokens(tokens) : "-"}
                  </span>
                </div>
              );
            })}
          </div>
        </Widget>
      </div>
    </div>
  );
}

function KPICard({
  label,
  value,
  accent,
  children,
}: {
  label: string;
  value: string;
  accent: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="bg-surface border border-surface-border rounded-lg p-3.5">
      <div className="text-2xs text-text-dim uppercase tracking-wider mb-1 font-medium">
        {label}
      </div>
      <div className="text-xl font-bold" style={{ color: accent }}>
        {value}
      </div>
      {children}
    </div>
  );
}

function Widget({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface border border-surface-border rounded-lg p-4">
      <h3 className="text-xs font-semibold text-text-primary mb-3">{title}</h3>
      {children}
    </div>
  );
}
