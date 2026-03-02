"use client";

import { ChangelogEntry } from "@/lib/kanban/types";

interface VersionHistoryProps {
  changelog: ChangelogEntry[];
  currentVersion: string;
  deployedAt: string;
}

export default function VersionHistory({
  changelog,
  currentVersion,
  deployedAt,
}: VersionHistoryProps) {
  const deployedFormatted = new Date(deployedAt).toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-lg font-bold text-text-primary mb-1.5">
            버전 히스토리
          </h2>
          <p className="text-sm text-text-dim">
            기능 변경이 있을 때마다 버전이 기록됩니다
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-accent bg-accent/10 px-3 py-1 rounded-lg inline-block">
            v{currentVersion}
          </div>
          <div className="text-xs text-text-dim mt-1.5">
            마지막 배포: {deployedFormatted}
          </div>
        </div>
      </div>

      <div className="relative pl-6">
        {/* Vertical line */}
        <div className="absolute left-[8px] top-5 bottom-5 w-px bg-surface-border" />

        <div className="space-y-6">
          {changelog.map((entry, i) => {
            const isCurrent = entry.version === currentVersion;
            return (
              <div key={entry.version} className="relative">
                {/* Dot */}
                <div
                  className={`absolute -left-6 top-[22px] w-4 h-4 rounded-full border-[2.5px] border-bg ${
                    isCurrent ? "bg-accent" : "bg-surface-light"
                  }`}
                />

                <div
                  className={`rounded-xl p-5 transition-colors ${
                    isCurrent
                      ? "bg-accent/8 border border-accent/25"
                      : "bg-surface border border-surface-border"
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className={`text-sm font-bold ${
                        isCurrent ? "text-accent" : "text-text-primary"
                      }`}
                    >
                      v{entry.version}
                    </span>
                    {isCurrent && (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-accent/15 text-accent">
                        현재
                      </span>
                    )}
                    <span className="text-xs text-text-dim">
                      {entry.date}
                    </span>
                  </div>

                  {/* Summary */}
                  <p className="text-sm text-text-secondary font-medium mb-3">
                    {entry.summary}
                  </p>

                  {/* Changes */}
                  <ul className="space-y-2">
                    {entry.changes.map((change, j) => (
                      <li
                        key={j}
                        className="flex items-start gap-2.5 text-sm text-text-dim leading-relaxed"
                      >
                        <span
                          className={`mt-[7px] w-1.5 h-1.5 rounded-full shrink-0 ${
                            isCurrent ? "bg-accent/50" : "bg-text-dim/30"
                          }`}
                        />
                        {change}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {changelog.length === 0 && (
        <div className="text-center py-20 text-text-dim text-sm">
          버전 히스토리가 없습니다
        </div>
      )}
    </div>
  );
}
