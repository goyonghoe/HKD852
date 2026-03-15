"use client";

import { useState } from "react";

interface QuickAddInputProps {
  onAdd: (title: string) => void;
  placeholder?: string;
}

export default function QuickAddInput({
  onAdd,
  placeholder = "새 태스크...",
}: QuickAddInputProps) {
  const [value, setValue] = useState("");
  const [active, setActive] = useState(false);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed) {
      onAdd(trimmed);
      setValue("");
      setActive(false);
    }
  };

  if (!active) {
    return (
      <button
        onClick={() => setActive(true)}
        className="w-full text-left px-3 py-2 rounded-md text-xs text-text-dim hover:bg-surface-light hover:text-text-secondary transition-all flex items-center gap-2"
      >
        <svg
          className="w-3.5 h-3.5"
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
        {placeholder}
      </button>
    );
  }

  return (
    <div className="flex gap-1.5">
      <input
        autoFocus
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
          if (e.key === "Escape") {
            setValue("");
            setActive(false);
          }
        }}
        placeholder={placeholder}
        className="flex-1 bg-surface-light border border-surface-border rounded-md px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent/40"
      />
      <button
        onClick={handleSubmit}
        className="px-2.5 py-1.5 bg-accent text-white text-xs font-medium rounded-md hover:bg-accent-hover transition-colors"
      >
        추가
      </button>
      <button
        onClick={() => {
          setValue("");
          setActive(false);
        }}
        className="px-2 py-1.5 text-xs text-text-dim hover:text-text-secondary transition-colors"
      >
        취소
      </button>
    </div>
  );
}
