"use client";

import { KanbanTask } from "@/lib/kanban/types";
import {
  PRIORITY_CONFIG,
  STATUS_LABELS,
  STATUS_COLORS,
  AGENTS,
} from "@/lib/kanban/constants";
import { formatDateTime, formatTokens } from "@/lib/kanban/helpers";

interface TaskDetailProps {
  task: KanbanTask;
  onClose: () => void;
}

export default function TaskDetail({ task, onClose }: TaskDetailProps) {
  const priorityCfg = PRIORITY_CONFIG[task.priority];
  const agentInfo = AGENTS.find((a) => a.name === task.assignee);
  const statusColor = STATUS_COLORS[task.status] ?? "#C4C4C4";

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-bg-elevated border border-surface-border rounded-2xl max-w-lg lg:max-w-xl w-full max-h-[85vh] overflow-y-auto shadow-modal animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Color strip top */}
        <div
          className="h-1.5 rounded-t-2xl"
          style={{ backgroundColor: statusColor }}
        />

        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-0">
          <div className="flex-1 mr-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-mono text-text-dim">
                {task.id}
              </span>
              <span
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                style={{
                  color: statusColor,
                  backgroundColor: statusColor + "20",
                }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: statusColor }}
                />
                {STATUS_LABELS[task.status]}
              </span>
              <span
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full"
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
            <h2 className="text-lg font-bold text-text-primary leading-snug">
              {task.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-text-dim hover:text-text-secondary transition-colors p-2 rounded-lg hover:bg-surface-light"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pb-5 pt-5 space-y-5">
          {/* Info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4 bg-surface/50 rounded-xl p-4">
            <InfoItem label="담당자">
              {agentInfo ? (
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ backgroundColor: agentInfo.color }}
                  >
                    {agentInfo.initials}
                  </div>
                  <span className="text-sm text-text-primary font-medium">
                    {agentInfo.label}
                  </span>
                </div>
              ) : (
                <span className="text-sm text-text-dim">미배정</span>
              )}
            </InfoItem>
            <InfoItem label="생성자">
              <span className="text-sm text-text-primary">{task.created_by}</span>
            </InfoItem>
            <InfoItem label="생성일">
              <span className="text-sm text-text-primary">{formatDateTime(task.created_at)}</span>
            </InfoItem>
            {task.due_date && (
              <InfoItem label="마감일">
                <span className="text-sm text-text-primary">{formatDateTime(task.due_date)}</span>
              </InfoItem>
            )}
            {task.sprint && (
              <InfoItem label="스프린트">
                <span className="text-sm text-accent font-medium">{task.sprint}</span>
              </InfoItem>
            )}
          </div>

          {/* Description */}
          {task.description && (
            <Section label="설명">
              <p className="text-sm text-text-secondary bg-surface rounded-xl p-4 leading-relaxed">
                {task.description}
              </p>
            </Section>
          )}

          {/* Tags */}
          {task.tags.length > 0 && (
            <Section label="태그">
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-3 py-1.5 rounded-full bg-surface text-text-secondary border border-surface-border/50"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* QA Review */}
          {task.qa_review && (
            <Section label="QA 평가 결과">
              <div className="bg-surface rounded-xl p-5">
                <div className="flex items-center gap-4 mb-4">
                  {/* Score ring */}
                  <div className="relative w-14 h-14">
                    <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                      <circle cx="28" cy="28" r="23" fill="none" stroke="rgba(118,118,191,0.1)" strokeWidth="4"/>
                      <circle
                        cx="28" cy="28" r="23" fill="none"
                        stroke={task.qa_review.score >= 80 ? "#00CA72" : "#E2445C"}
                        strokeWidth="4"
                        strokeDasharray={`${(task.qa_review.score / 100) * 144.5} 144.5`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span
                      className="absolute inset-0 flex items-center justify-center text-base font-bold"
                      style={{ color: task.qa_review.score >= 80 ? "#00CA72" : "#E2445C" }}
                    >
                      {task.qa_review.score}
                    </span>
                  </div>
                  <div className="flex-1">
                    <span
                      className="text-xs font-bold px-3 py-1 rounded-full"
                      style={{
                        color: task.qa_review.score >= 80 ? "#00CA72" : "#E2445C",
                        backgroundColor: task.qa_review.score >= 80 ? "rgba(0,202,114,0.18)" : "rgba(226,68,92,0.18)",
                      }}
                    >
                      {task.qa_review.score >= 80 ? "통과" : "실패"}
                    </span>
                  </div>
                </div>
                {/* CFMC breakdown */}
                <div className="grid grid-cols-4 gap-3 mb-3">
                  {(["completeness", "fidelity", "maintainability", "compliance"] as const).map((key) => (
                    <div key={key} className="text-center">
                      <div className="text-[11px] text-text-dim uppercase mb-1 font-medium">
                        {key[0].toUpperCase()}
                      </div>
                      <div className="text-base font-bold text-text-primary">
                        {task.qa_review!.breakdown[key]}
                      </div>
                      {/* Mini bar */}
                      <div className="h-1.5 bg-bg rounded-full mt-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(task.qa_review!.breakdown[key] / 25) * 100}%`,
                            backgroundColor: task.qa_review!.breakdown[key] >= 20 ? "#00CA72" : "#FDAB3D",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {task.qa_review.feedback && (
                  <p className="text-xs text-text-dim mt-3 leading-relaxed border-t border-surface-border/40 pt-3">
                    {task.qa_review.feedback}
                  </p>
                )}
              </div>
            </Section>
          )}

          {/* RedTeam Review */}
          {task.redteam_review && (
            <Section label="레드팀 리뷰">
              <div className="bg-surface rounded-xl p-5">
                <div className="flex items-center gap-2.5 mb-3">
                  <span
                    className="text-xs font-bold px-3 py-1 rounded-full"
                    style={{
                      color: task.redteam_review.verdict === "APPROVE" ? "#00CA72" : "#E2445C",
                      backgroundColor: task.redteam_review.verdict === "APPROVE" ? "rgba(0,202,114,0.18)" : "rgba(226,68,92,0.18)",
                    }}
                  >
                    {task.redteam_review.verdict === "APPROVE" ? "승인" : "반려"}
                  </span>
                </div>
                <p className="text-sm text-text-secondary mb-3 leading-relaxed">
                  {task.redteam_review.summary}
                </p>
                {task.redteam_review.findings.length > 0 && (
                  <div className="space-y-2 border-t border-surface-border/40 pt-3">
                    {task.redteam_review.findings.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2.5 text-xs text-text-secondary"
                      >
                        <span
                          className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase mt-px"
                          style={{
                            color:
                              f.severity === "critical" || f.severity === "high"
                                ? "#E2445C"
                                : f.severity === "mid"
                                ? "#FDAB3D"
                                : "#C4C4C4",
                            backgroundColor:
                              f.severity === "critical" || f.severity === "high"
                                ? "rgba(226,68,92,0.18)"
                                : f.severity === "mid"
                                ? "rgba(253,171,61,0.18)"
                                : "rgba(196,196,196,0.18)",
                          }}
                        >
                          {f.severity}
                        </span>
                        <span className="leading-relaxed">
                          <span className="text-text-dim">{f.category}:</span>{" "}
                          {f.detail}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Token usage */}
          {task.token_usage && task.token_usage.entries.length > 0 && (
            <Section label="AI 토큰 사용량">
              <div className="bg-surface rounded-xl p-5">
                {/* Total summary */}
                <div className="flex items-center gap-4 mb-4 pb-4 border-b border-surface-border/40">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-accent" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 1.5a6.5 6.5 0 110 13 6.5 6.5 0 010-13zM9 5.5v5l4 2.3-.75 1.3L8 11.5V5.5h1z"/>
                    </svg>
                    <span className="text-lg font-bold text-text-primary">
                      {formatTokens(task.token_usage.total_tokens)}
                    </span>
                    <span className="text-xs text-text-dim">토큰</span>
                  </div>
                  <div className="flex-1" />
                  <div className="flex items-center gap-4 text-xs text-text-dim">
                    <span>
                      In: <span className="text-text-secondary font-medium">{formatTokens(task.token_usage.entries.reduce((s, e) => s + e.input, 0))}</span>
                    </span>
                    <span>
                      Out: <span className="text-text-secondary font-medium">{formatTokens(task.token_usage.entries.reduce((s, e) => s + e.output, 0))}</span>
                    </span>
                  </div>
                </div>

                {/* Per-phase breakdown */}
                <div className="space-y-3">
                  {task.token_usage.entries.map((entry, i) => {
                    const entryTotal = entry.input + entry.output;
                    const pct = task.token_usage!.total_tokens > 0
                      ? (entryTotal / task.token_usage!.total_tokens) * 100
                      : 0;
                    const agentInfo = AGENTS.find((a) => a.name === entry.by);

                    return (
                      <div key={i} className="flex items-center gap-3">
                        {/* Phase label */}
                        <span className="text-xs font-medium text-text-secondary w-12 sm:w-16 shrink-0">
                          {entry.phase}
                        </span>

                        {/* Bar */}
                        <div className="flex-1 h-2 bg-bg rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-accent/70 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        {/* Token count */}
                        <span className="text-xs font-mono text-text-primary w-14 text-right shrink-0">
                          {formatTokens(entryTotal)}
                        </span>

                        {/* Agent avatar */}
                        {agentInfo ? (
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0"
                            style={{ backgroundColor: agentInfo.color }}
                          >
                            {agentInfo.initials}
                          </div>
                        ) : (
                          <span className="text-[10px] text-text-dim w-5 text-center shrink-0">
                            {entry.by.slice(0, 2).toUpperCase()}
                          </span>
                        )}

                        {/* Model badge */}
                        <span className="text-[10px] text-text-dim bg-bg-elevated px-1.5 py-0.5 rounded font-mono shrink-0">
                          {entry.model}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Section>
          )}

          {/* History timeline */}
          <Section label="타임라인">
            <div className="relative pl-5">
              {/* Vertical line */}
              <div className="absolute left-[7px] top-1.5 bottom-1.5 w-px bg-surface-border" />
              <div className="space-y-4">
                {task.history.map((h, i) => (
                  <div key={i} className="relative flex items-start gap-3">
                    {/* Dot */}
                    <div
                      className="absolute -left-5 top-[6px] w-3.5 h-3.5 rounded-full border-[2.5px] border-bg-elevated"
                      style={{
                        backgroundColor: STATUS_COLORS[h.to] ?? "#C4C4C4",
                      }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-text-primary font-medium">
                          {h.from ? STATUS_LABELS[h.from] : "생성"}{" "}
                          <span className="text-text-dim">→</span>{" "}
                          {STATUS_LABELS[h.to]}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 mt-1">
                        <span className="text-[11px] text-text-dim">
                          {formatDateTime(h.at)}
                        </span>
                        <span className="text-[11px] text-text-dim">
                          {h.by}
                        </span>
                      </div>
                      {h.note && (
                        <p className="text-xs text-text-dim/70 mt-1 italic">
                          {h.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-3">
        {label}
      </div>
      {children}
    </div>
  );
}

function InfoItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[11px] text-text-dim uppercase tracking-wider mb-1.5 font-medium">
        {label}
      </div>
      {children}
    </div>
  );
}
