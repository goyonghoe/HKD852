"use client";

import { useState, useRef, useEffect } from "react";
import type { TaskStatus } from "@/lib/database.types";

interface QuickAddFABProps {
  onAdd: (title: string, status: TaskStatus) => void;
  isOpen: boolean;
  onToggle: (open: boolean) => void;
}

export default function QuickAddFAB({
  onAdd,
  isOpen,
  onToggle,
}: QuickAddFABProps) {
  const [title, setTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Small delay to let animation start
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setTitle("");
    }
  }, [isOpen]);

  const handleSubmit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd(trimmed, "today");
    setTitle("");
    onToggle(false);
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => onToggle(false)}
        />
      )}

      {/* Quick add input */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-72 sm:w-80">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-xl border border-gray-200 dark:border-[#2a2a2a] p-3">
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
                if (e.key === "Escape") onToggle(false);
              }}
              placeholder="New task title..."
              className="w-full text-sm border border-gray-200 dark:border-[#2a2a2a] rounded-lg px-3 py-2 focus:outline-none focus:border-blue-300 dark:bg-[#0f0f0f] dark:text-gray-100"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-400">Added to Today</span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => onToggle(false)}
                  className="text-xs text-gray-500 dark:text-gray-400 px-2.5 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!title.trim()}
                  className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 disabled:opacity-40"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FAB button */}
      <button
        onClick={() => onToggle(!isOpen)}
        className={`fixed bottom-5 right-4 sm:right-6 z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all ${
          isOpen
            ? "bg-gray-600 rotate-45"
            : "bg-blue-600 hover:bg-blue-700 hover:shadow-xl"
        }`}
        title="Quick add task (t)"
      >
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>
    </>
  );
}
