"use client";

import { useState, useMemo } from "react";

interface ReadingSectionProps {
  icon: string;
  title: string;
  content: string;
  preview?: string;
  highlighted?: boolean;
  expandable?: boolean;
  defaultExpanded?: boolean;
}

type ContentBlock =
  | { type: "heading"; text: string }
  | { type: "bold-line"; text: string }
  | { type: "text"; text: string };

function parseContent(raw: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  const lines = raw.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("## ")) {
      blocks.push({ type: "heading", text: trimmed.slice(3) });
    } else if (trimmed.startsWith("**") && trimmed.endsWith("**") && trimmed.length > 4) {
      blocks.push({ type: "bold-line", text: trimmed.slice(2, -2) });
    } else {
      blocks.push({ type: "text", text: trimmed });
    }
  }

  return blocks;
}

function renderInlineBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <span key={i} className="font-bold text-teal">
          {part.slice(2, -2)}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function ReadingSection({
  icon,
  title,
  content,
  preview,
  highlighted = false,
  expandable = false,
  defaultExpanded = true,
}: ReadingSectionProps) {
  const [isExpanded, setIsExpanded] = useState(expandable ? defaultExpanded : true);
  const blocks = useMemo(() => parseContent(content), [content]);

  const borderClass = highlighted ? "border-gold/20 glow-gold" : "border-surface-border";
  const headerBg = highlighted ? "bg-gold/[0.06]" : "bg-surface-light/50";
  const titleColor = highlighted ? "text-gold" : "text-text-primary";

  return (
    <div className={`bg-surface rounded-2xl border overflow-hidden ${borderClass}`}>
      <div
        className={`px-5 py-3.5 flex items-center gap-2.5 ${headerBg} ${expandable ? "cursor-pointer select-none" : ""}`}
        onClick={expandable ? () => setIsExpanded(!isExpanded) : undefined}
      >
        <span className="text-base flex-shrink-0">{icon}</span>
        <h3 className={`text-[15px] font-bold ${titleColor} flex-1 min-w-0`}>{title}</h3>
        {expandable && !isExpanded && preview && (
          <span className="text-[12px] text-text-dim truncate max-w-[120px] flex-shrink-0">{preview}</span>
        )}
        {expandable && (
          <svg
            className={`w-4 h-4 text-text-dim flex-shrink-0 accordion-chevron ${isExpanded ? "open" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </div>
      <div className={`accordion-body ${isExpanded ? "open" : ""}`}>
        <div>
          <div className="px-5 py-5 space-y-3">
            {blocks.map((block, i) => {
              switch (block.type) {
                case "bold-line":
                  return (
                    <p key={i} className="text-[15px] font-bold text-teal leading-relaxed">
                      {block.text}
                    </p>
                  );
                case "heading":
                  return (
                    <p key={i} className="text-[12px] font-semibold text-text-dim tracking-wider uppercase mt-1">
                      {block.text}
                    </p>
                  );
                case "text":
                  return (
                    <p key={i} className="text-[14px] text-text-secondary leading-[1.8]">
                      {renderInlineBold(block.text)}
                    </p>
                  );
              }
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
