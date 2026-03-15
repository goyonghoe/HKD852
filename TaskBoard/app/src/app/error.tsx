"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="text-4xl">&#x26A0;&#xFE0F;</div>
        <h2 className="text-lg font-semibold text-[var(--text)]">
          Something went wrong
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          {error.message || "An unexpected error occurred."}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg
            text-sm font-medium text-white bg-[var(--accent)]
            hover:opacity-90 active:scale-95 transition-all min-h-[44px]"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
