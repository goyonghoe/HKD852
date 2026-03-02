"use client";

import { KanbanTask } from "@/lib/kanban/types";
import {
  PRIORITY_CONFIG,
  STATUS_COLORS,
  STATUS_LABELS,
  AGENTS,
} from "@/lib/kanban/constants";
import { formatDate, formatTokens } from "@/lib/kanban/helpers";

interface TaskCardProps {
  task: KanbanTask;
  onClick: (task: KanbanTask) => void;
}

export default function TaskCard({ task, onClick }: TaskCardProps) {
  const priorityCfg = PRIORITY_CONFIG[task.priority];
  const agentInfo = AGENTS.find((a) => a.name === task.assignee);
  const statusColor = STATUS_COLORS[task.status] ?? "#C4C4C4";

  const isFailState =
    task.status === "qa_fail" || task.status === "redteam_reject";

  return (
    <button
      onClick={() => onClick(task)}
      className="w-full text-left bg-surface rounded-xl shadow-card hover:shadow-card-hover hover:bg-surface-hover transition-all duration-200 group overflow-hidden"
    >
      <div className="flex">
        {/* Left color strip */}
        <div
          className="w-[6px] shrink-0 rounded-l-xl"
          style={{ backgroundColor: statusColor }}
        />

        <div className="flex-1 p-4 min-w-0">
          {/* Top row: ID + Priority */}
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-mono text-text-dim tracking-wide">
              {task.id}
            </span>
            <div
              className="flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full"
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
            </div>
          </div>

          {/* Title */}
          <h3 className="text-sm font-semibold text-text-primary leading-snug line-clamp-2 mb-3 group-hover:text-accent transition-colors">
            {task.title}
          </h3>

          {/* Fail badge */}
          {isFailState && (
            <div className="mb-3">
              <span
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                style={{
                  color: "#E2445C",
                  backgroundColor: "rgba(226, 68, 92, 0.18)",
                }}
              >
                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M6 1L11 10H1L6 1Z"/>
                </svg>
                {STATUS_LABELS[task.status]}
                {task.status === "qa_fail" && task.qa_review && (
                  <span className="opacity-70 ml-0.5">{task.qa_review.score}</span>
                )}
              </span>
            </div>
          )}

          {/* QA score for qa_passed */}
          {task.status === "qa_passed" && task.qa_review && (
            <div className="mb-3">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                style={{
                  color: "#A25DDC",
                  backgroundColor: "rgba(162, 93, 220, 0.18)",
                }}
              >
                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M10 3L5 9L2 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                QA {task.qa_review.score}
              </span>
            </div>
          )}

          {/* Tags */}
          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {task.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-bg-elevated text-text-dim border border-surface-border/50"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Bottom row: Avatar + Token + Date */}
          <div className="flex items-center justify-between pt-1 border-t border-surface-border/40">
            {agentInfo ? (
              <div className="flex items-center gap-2 mt-2.5">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ backgroundColor: agentInfo.color }}
                >
                  {agentInfo.initials}
                </div>
                <span className="text-xs text-text-secondary font-medium">
                  {agentInfo.label}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-2.5">
                <div className="w-7 h-7 rounded-full bg-surface-light border border-dashed border-text-dim/30 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-text-dim/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                  </svg>
                </div>
                <span className="text-xs text-text-dim">미배정</span>
              </div>
            )}
            <div className="flex items-center gap-2.5 mt-2.5">
              {task.token_usage && task.token_usage.total_tokens > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-text-dim bg-bg-elevated px-1.5 py-0.5 rounded"
                  title={`Input: ${formatTokens(task.token_usage.entries.reduce((s, e) => s + e.input, 0))} / Output: ${formatTokens(task.token_usage.entries.reduce((s, e) => s + e.output, 0))}`}
                >
                  <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 1.5a5.5 5.5 0 110 11 5.5 5.5 0 010-11zM7 4.5v4l3.5 2-.75 1.25L6 9.5V4.5h1z"/>
                  </svg>
                  {formatTokens(task.token_usage.total_tokens)}
                </span>
              )}
              <span className="text-[11px] text-text-dim">
                {formatDate(task.created_at)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
