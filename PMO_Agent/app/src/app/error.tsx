"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-lg w-full text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-surface flex items-center justify-center">
          <svg
            className="w-6 h-6 text-st-red"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p className="text-st-red font-medium text-[14px] mb-2">렌더링 오류</p>
        <pre className="text-left text-[11px] text-text-dim bg-surface rounded-lg p-4 mb-4 overflow-x-auto whitespace-pre-wrap break-words max-h-40">
          {error.message}
          {"\n\n"}
          {error.stack}
        </pre>
        <button
          onClick={reset}
          className="px-4 py-2 bg-accent text-white text-sm rounded-lg hover:bg-accent/80 transition-colors"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}
