"use client";

import { useEffect, useState } from "react";
import { KanbanData, ViewTab } from "@/lib/kanban/types";
import Header from "@/components/layout/Header";
import TabNav from "@/components/layout/TabNav";
import KanbanBoard from "@/components/board/KanbanBoard";
import TaskHistory from "@/components/history/TaskHistory";
import VersionHistory from "@/components/history/VersionHistory";

export default function KanbanPage() {
  const [data, setData] = useState<KanbanData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ViewTab>("board");

  useEffect(() => {
    fetch("/kanban.json")
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.json();
      })
      .then((d: KanbanData) => setData(d))
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-surface flex items-center justify-center">
            <svg className="w-6 h-6 text-st-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <p className="text-st-red font-medium text-[14px] mb-1">데이터 로딩 실패</p>
          <p className="text-[12px] text-text-dim">{error}</p>
          <p className="text-[11px] text-text-dim mt-3">
            <code className="text-accent">/kanban-deploy</code>로 최신 데이터를 배포하세요
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-text-dim text-[13px]">보드 로딩 중...</span>
        </div>
      </div>
    );
  }

  return (
    <main>
      <Header
        taskCount={data.tasks.length}
        lastUpdated={data.updated_at}
        deployedAt={data.deployed_at ?? data.updated_at}
        version={data.version}
        tasks={data.tasks}
        tokenBudget={data.token_budget ?? null}
      />
      <TabNav activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "board" && <KanbanBoard tasks={data.tasks} />}
      {activeTab === "task-history" && <TaskHistory tasks={data.tasks} />}
      {activeTab === "version-history" && (
        <VersionHistory
          changelog={data.changelog ?? []}
          currentVersion={data.version}
          deployedAt={data.deployed_at ?? data.updated_at}
        />
      )}
    </main>
  );
}
