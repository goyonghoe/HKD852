"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export function FloatingNav() {
  const [showTop, setShowTop] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 500);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 1500);
  }, [router]);

  const handleTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="fixed bottom-6 right-4 z-50 flex flex-col gap-2.5">
      {showTop && (
        <button
          onClick={handleTop}
          aria-label="맨 위로"
          className="w-11 h-11 rounded-full bg-zinc-800/90 backdrop-blur border border-zinc-700/60 flex items-center justify-center shadow-lg shadow-black/30 active:scale-90 transition-all"
        >
          <svg
            className="w-5 h-5 text-zinc-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 15l7-7 7 7"
            />
          </svg>
        </button>
      )}
      <button
        onClick={handleRefresh}
        aria-label="새로고침"
        disabled={refreshing}
        className="w-11 h-11 rounded-full bg-zinc-800/90 backdrop-blur border border-zinc-700/60 flex items-center justify-center shadow-lg shadow-black/30 active:scale-90 transition-all"
      >
        <svg
          className={`w-5 h-5 text-zinc-300 ${refreshing ? "animate-spin" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </button>
    </div>
  );
}
