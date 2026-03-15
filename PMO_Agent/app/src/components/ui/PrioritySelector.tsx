"use client";

import { Priority } from "@/lib/kanban/types";
import { PRIORITY_CONFIG } from "@/lib/kanban/constants";
import { useState, useRef, useEffect } from "react";

interface PrioritySelectorProps {
  value: Priority;
  onChange: (priority: Priority) => void;
  disabled?: boolean;
}

export default function PrioritySelector({
  value,
  onChange,
  disabled,
}: PrioritySelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cfg = PRIORITY_CONFIG[value];

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
        className={`inline-flex items-center gap-1 text-2xs font-semibold px-2 py-1 rounded-full transition-all ${
          disabled ? "cursor-default" : "hover:opacity-80 cursor-pointer"
        }`}
        style={{ color: cfg.color, backgroundColor: cfg.bgColor }}
      >
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: cfg.dot }}
        />
        {cfg.label}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 bg-bg-elevated border border-surface-border rounded-lg shadow-panel py-1 z-50 min-w-[120px] animate-fade-in">
          {(Object.entries(PRIORITY_CONFIG) as [Priority, typeof cfg][]).map(
            ([key, c]) => (
              <button
                key={key}
                onClick={() => {
                  onChange(key);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-surface-light flex items-center gap-2 transition-colors ${
                  key === value ? "bg-surface-light" : ""
                }`}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: c.dot }}
                />
                <span className="text-text-primary">{c.label}</span>
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
