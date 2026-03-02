"use client";

import { getColumnCounts, getTotalTokensForTasks, formatTokens } from "@/lib/kanban/helpers";
import { KanbanTask, TokenBudget } from "@/lib/kanban/types";
import { COLUMNS } from "@/lib/kanban/constants";

interface HeaderProps {
  taskCount: number;
  lastUpdated: string;
  deployedAt: string;
  version: string;
  tasks: KanbanTask[];
  tokenBudget: TokenBudget | null;
}

export default function Header({
  taskCount,
  lastUpdated,
  deployedAt,
  version,
  tasks,
  tokenBudget,
}: HeaderProps) {
  const deployFormatted = deployedAt
    ? new Date(deployedAt).toLocaleString("ko-KR", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

  const counts = getColumnCounts(tasks);
  const tokenStats = getTotalTokensForTasks(tasks);

  return (
    <header className="border-b border-surface-border bg-bg-elevated/90 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-[1920px] mx-auto px-5 sm:px-8 py-4 flex items-center justify-between">
        {/* Left: Logo + Title */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
            <span className="text-accent text-lg font-bold">W</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary tracking-tight">
              WanChai
            </h1>
            <p className="text-xs text-text-dim tracking-wide">
              칸반 보드
            </p>
          </div>
        </div>

        {/* Center: Mini pipeline indicator (Wide screens only) */}
        <div className="hidden xl:flex items-center gap-1.5">
          {COLUMNS.map((col, i) => (
            <div key={col.id} className="flex items-center gap-1.5">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface/60 border border-surface-border/30">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: col.color }}
                />
                <span className="text-xs text-text-secondary font-medium">
                  {col.label}
                </span>
                <span
                  className="text-xs font-bold"
                  style={{ color: col.color }}
                >
                  {counts[col.id] ?? 0}
                </span>
              </div>
              {i < COLUMNS.length - 1 && (
                <svg className="w-3 h-3 text-text-dim/30" viewBox="0 0 12 12" fill="none">
                  <path d="M4.5 2.5L7.5 6L4.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
          ))}
        </div>

        {/* Right: Tokens + Version + Meta */}
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 sm:gap-3.5 text-xs">
          {/* Row 1: Version + Task count (always visible) */}
          <div className="flex items-center gap-3.5">
            <span className="text-accent font-bold bg-accent/10 px-2.5 py-1 rounded-lg">v{version}</span>
            <div className="w-px h-4 bg-surface-border" />
            <span className="text-text-secondary font-medium">
              {taskCount}개
            </span>
          </div>
          {/* Row 2: Tokens + Deploy time (hidden on smallest screens) */}
          <div className="hidden sm:flex items-center gap-3.5">
            {tokenStats.total > 0 && (
              <>
                <div className="w-px h-4 bg-surface-border" />
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface/60 border border-surface-border/30"
                  title={`Input: ${formatTokens(tokenStats.input)} / Output: ${formatTokens(tokenStats.output)}`}
                >
                  <svg className="w-3.5 h-3.5 text-accent" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 1.5a5.5 5.5 0 110 11 5.5 5.5 0 010-11zM7 4.5v4l3.5 2-.75 1.25L6 9.5V4.5h1z"/>
                  </svg>
                  <span className="text-text-secondary font-bold">{formatTokens(tokenStats.total)}</span>
                  {tokenBudget?.monthly_limit && (
                    <span className="text-text-dim">
                      / {formatTokens(tokenBudget.monthly_limit)}
                    </span>
                  )}
                </div>
              </>
            )}
            <div className="w-px h-4 bg-surface-border" />
            <span className="text-text-dim" title="마지막 배포 시각">
              {deployFormatted}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
