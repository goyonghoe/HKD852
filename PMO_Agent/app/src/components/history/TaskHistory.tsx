"use client";

import { KanbanTask } from "@/lib/kanban/types";
import { STATUS_LABELS, STATUS_COLORS, AGENTS } from "@/lib/kanban/constants";
import { formatDateTime } from "@/lib/kanban/helpers";

interface TaskHistoryProps {
  tasks: KanbanTask[];
}

interface TimelineEvent {
  taskId: string;
  taskTitle: string;
  from: string | null;
  to: string;
  by: string;
  at: string;
  note?: string;
}

export default function TaskHistory({ tasks }: TaskHistoryProps) {
  const events: TimelineEvent[] = tasks
    .flatMap((task) =>
      task.history.map((h) => ({
        taskId: task.id,
        taskTitle: task.title,
        from: h.from,
        to: h.to,
        by: h.by,
        at: h.at,
        note: h.note,
      }))
    )
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  const grouped: Record<string, TimelineEvent[]> = {};
  for (const event of events) {
    const dateKey = new Date(event.at).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(event);
  }

  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-8 py-8">
      <h2 className="text-lg font-bold text-text-primary mb-1.5">
        태스크 히스토리
      </h2>
      <p className="text-sm text-text-dim mb-8">
        전체 태스크의 상태 변경 이력을 시간순으로 표시합니다
      </p>

      {Object.entries(grouped).map(([date, dayEvents]) => (
        <div key={date} className="mb-8">
          {/* Date header */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-bold text-text-secondary">
              {date}
            </span>
            <div className="flex-1 h-px bg-surface-border" />
            <span className="text-xs text-text-dim font-medium">
              {dayEvents.length}건
            </span>
          </div>

          {/* Events */}
          <div className="relative pl-6">
            <div className="absolute left-[8px] top-2 bottom-2 w-px bg-surface-border" />
            <div className="space-y-4">
              {dayEvents.map((event, i) => {
                const toColor = STATUS_COLORS[event.to] ?? "#C4C4C4";
                const agentInfo = AGENTS.find((a) => a.name === event.by);

                return (
                  <div key={`${event.taskId}-${i}`} className="relative flex gap-3">
                    {/* Dot */}
                    <div
                      className="absolute -left-6 top-[10px] w-4 h-4 rounded-full border-[2.5px] border-bg"
                      style={{ backgroundColor: toColor }}
                    />

                    {/* Content */}
                    <div className="flex-1 bg-surface rounded-xl p-4 hover:bg-surface-hover transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-xs font-mono text-text-dim shrink-0">
                            {event.taskId}
                          </span>
                          <span className="text-sm font-medium text-text-primary truncate">
                            {event.taskTitle}
                          </span>
                        </div>
                        <span className="text-[11px] text-text-dim shrink-0">
                          {formatDateTime(event.at)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 flex-wrap">
                        {/* Status transition */}
                        {event.from ? (
                          <div className="flex items-center gap-1.5">
                            <span
                              className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                              style={{
                                color: STATUS_COLORS[event.from] ?? "#C4C4C4",
                                backgroundColor: (STATUS_COLORS[event.from] ?? "#C4C4C4") + "20",
                              }}
                            >
                              {STATUS_LABELS[event.from]}
                            </span>
                            <svg className="w-3 h-3 text-text-dim/40" viewBox="0 0 12 12" fill="none">
                              <path d="M4.5 2.5L7.5 6L4.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span
                              className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                              style={{
                                color: toColor,
                                backgroundColor: toColor + "20",
                              }}
                            >
                              {STATUS_LABELS[event.to]}
                            </span>
                          </div>
                        ) : (
                          <span
                            className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                            style={{
                              color: toColor,
                              backgroundColor: toColor + "20",
                            }}
                          >
                            생성 → {STATUS_LABELS[event.to]}
                          </span>
                        )}

                        {/* Actor */}
                        {agentInfo ? (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                              style={{ backgroundColor: agentInfo.color }}
                            >
                              {agentInfo.initials}
                            </div>
                            <span className="text-xs text-text-dim font-medium">
                              {agentInfo.label}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-text-dim font-medium">
                            {event.by}
                          </span>
                        )}
                      </div>

                      {/* Note */}
                      {event.note && (
                        <p className="text-xs text-text-dim/70 mt-2 italic leading-relaxed">
                          {event.note}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}

      {events.length === 0 && (
        <div className="text-center py-20 text-text-dim text-sm">
          히스토리가 없습니다
        </div>
      )}
    </div>
  );
}
