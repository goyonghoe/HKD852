"use client";

import { useState, useCallback } from "react";

export default function ShareSiteButton() {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    const title = "심테공장 — 재밌는 심리테스트 모음";
    const text = "재밌는 심리테스트 해보세요! 🧪";

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard failed
    }
  }, []);

  return (
    <div className="relative">
      <button
        onClick={handleShare}
        className="flex items-center justify-center w-11 h-11 rounded-xl text-text-secondary hover:bg-bg-soft hover:text-primary transition-colors"
        aria-label="사이트 공유하기"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
      </button>

      {copied && (
        <div className="absolute top-full right-0 mt-1 px-3 py-1.5 rounded-lg bg-text-primary text-white text-xs font-bold shadow-lg whitespace-nowrap animate-fade-up z-10">
          링크 복사됨!
        </div>
      )}
    </div>
  );
}
