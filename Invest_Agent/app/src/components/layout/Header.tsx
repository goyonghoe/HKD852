"use client";

import Link from "next/link";
import Navigation from "./Navigation";

interface HeaderProps {
  fetchedAt?: string | null;
  cached?: boolean;
}

export default function Header({ fetchedAt, cached }: HeaderProps) {
  const timeStr = fetchedAt
    ? new Date(fetchedAt).toLocaleString("ko-KR", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <header className="sticky top-0 z-50 bg-bg/80 backdrop-blur-md border-b border-surface-border">
      <div className="max-w-[1440px] mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xl font-bold text-text-primary hover:text-accent transition-colors">
            투자 대시보드
          </Link>
          <Navigation />
        </div>
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          {fetchedAt && (
            <>
              <span>{timeStr}</span>
              {cached && (
                <span className="text-xs text-text-dim bg-surface px-1.5 py-0.5 rounded">
                  캐시
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
