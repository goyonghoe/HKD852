"use client";

import { useState, Fragment } from "react";
import { DailyBrief } from "@/lib/types";

function RichText({ text }: { text: string }) {
  return (
    <p className="text-base text-zinc-200 leading-relaxed">
      {text.split(/(\*\*[^*]+\*\*)/).map((part, j) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={j} className="text-blue-300 font-semibold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <Fragment key={j}>{part}</Fragment>;
      })}
    </p>
  );
}

export function TrendSummary({ brief }: { brief: DailyBrief }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <section className="mt-4 mb-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left"
      >
        <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-zinc-900 via-zinc-900 to-blue-950/30 p-4 transition-all active:scale-[0.99]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full bg-blue-500" />
              <h2 className="text-sm font-semibold text-blue-400">AI 트렌드</h2>
            </div>
            <svg
              className={`w-4 h-4 text-zinc-500 transition-transform ${expanded ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>

          {expanded && (
            <>
              <RichText text={brief.trendAnalysis} />
              <div className="flex flex-wrap gap-1.5 mt-3">
                {brief.topKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="px-2.5 py-1 text-xs rounded-full bg-blue-500/10 text-blue-300/80 border border-blue-500/15"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </button>
    </section>
  );
}
