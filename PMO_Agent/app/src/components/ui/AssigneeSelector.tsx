"use client";

import { AGENTS } from "@/lib/kanban/constants";
import { useState, useRef, useEffect } from "react";

interface AssigneeSelectorProps {
  value: string | null;
  onChange: (assignee: string | null) => void;
  disabled?: boolean;
}

export default function AssigneeSelector({
  value,
  onChange,
  disabled,
}: AssigneeSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const agentInfo = AGENTS.find((a) => a.name === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => !disabled && setOpen(!open)}
        className={`flex items-center gap-1.5 transition-all ${disabled ? "cursor-default" : "cursor-pointer hover:opacity-80"}`}
      >
        {agentInfo ? (
          <>
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
              style={{ backgroundColor: agentInfo.color }}
            >
              {agentInfo.initials}
            </div>
            <span className="text-xs text-text-primary font-medium">
              {agentInfo.label}
            </span>
          </>
        ) : (
          <>
            <div className="w-5 h-5 rounded-full bg-surface-light border border-dashed border-text-dim/30 flex items-center justify-center">
              <svg
                className="w-2.5 h-2.5 text-text-dim/40"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <span className="text-xs text-text-dim">미배정</span>
          </>
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 bg-bg-elevated border border-surface-border rounded-lg shadow-panel py-1 z-50 min-w-[140px] animate-fade-in">
          <button
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            className={`w-full text-left px-3 py-1.5 text-xs hover:bg-surface-light flex items-center gap-2 transition-colors ${
              !value ? "bg-surface-light" : ""
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-surface-light border border-dashed border-text-dim/30" />
            <span className="text-text-dim">미배정</span>
          </button>
          {AGENTS.map((a) => (
            <button
              key={a.name}
              onClick={() => {
                onChange(a.name);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-surface-light flex items-center gap-2 transition-colors ${
                value === a.name ? "bg-surface-light" : ""
              }`}
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                style={{ backgroundColor: a.color }}
              >
                {a.initials}
              </div>
              <span className="text-text-primary">{a.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
