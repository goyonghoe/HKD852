"use client";

import { TaskStatus } from "@/lib/kanban/types";
import {
  STATUS_LABELS,
  STATUS_COLORS,
  STATUS_TRANSITIONS,
} from "@/lib/kanban/constants";
import { useState, useRef, useEffect } from "react";

interface StatusSelectorProps {
  currentStatus: TaskStatus;
  onStatusChange: (newStatus: TaskStatus) => void;
  disabled?: boolean;
}

export default function StatusSelector({
  currentStatus,
  onStatusChange,
  disabled,
}: StatusSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const validNext = STATUS_TRANSITIONS[currentStatus] ?? [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const color = STATUS_COLORS[currentStatus] ?? "#C4C4C4";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => !disabled && validNext.length > 0 && setOpen(!open)}
        className={`inline-flex items-center gap-1.5 text-2xs font-semibold px-2 py-1 rounded-full transition-all ${
          !disabled && validNext.length > 0
            ? "hover:opacity-80 cursor-pointer"
            : "cursor-default"
        }`}
        style={{ color, backgroundColor: color + "15" }}
      >
        <div
          className={`w-1.5 h-1.5 rounded-full ${currentStatus === "in_progress" ? "pulse-dot" : ""}`}
          style={{ backgroundColor: color }}
        />
        {STATUS_LABELS[currentStatus]}
        {!disabled && validNext.length > 0 && (
          <svg
            className="w-2.5 h-2.5 ml-0.5"
            fill="none"
            viewBox="0 0 12 12"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              d="M3 4.5L6 7.5L9 4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {open && validNext.length > 0 && (
        <div className="absolute top-full left-0 mt-1 bg-bg-elevated border border-surface-border rounded-lg shadow-panel py-1 z-50 min-w-[140px] animate-fade-in">
          {validNext.map((status) => {
            const c = STATUS_COLORS[status] ?? "#C4C4C4";
            return (
              <button
                key={status}
                onClick={() => {
                  onStatusChange(status);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-surface-light flex items-center gap-2 transition-colors"
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: c }}
                />
                <span className="text-text-primary">
                  {STATUS_LABELS[status]}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
