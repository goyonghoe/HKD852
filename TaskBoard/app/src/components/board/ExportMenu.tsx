"use client";

import { useState, useRef, useEffect } from "react";
import type { Task } from "@/lib/database.types";
import {
  exportTasksCSV,
  exportTasksICS,
  exportTasksMarkdown,
  exportTasksJSON,
  downloadFile,
} from "@/lib/export";

interface ExportMenuProps {
  tasks: Task[];
}

export default function ExportMenu({ tasks }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleCSV = () => {
    const csv = exportTasksCSV(tasks);
    downloadFile(csv, "tasks.csv", "text/csv;charset=utf-8");
    setOpen(false);
  };

  const handleICS = () => {
    const ics = exportTasksICS(tasks);
    downloadFile(ics, "tasks.ics", "text/calendar;charset=utf-8");
    setOpen(false);
  };

  const handleMarkdown = () => {
    const md = exportTasksMarkdown(tasks);
    downloadFile(md, "tasks.md", "text/markdown;charset=utf-8");
    setOpen(false);
  };

  const handleJSON = () => {
    const json = exportTasksJSON(tasks);
    downloadFile(json, "tasks.json", "application/json;charset=utf-8");
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        title="Export"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-lg shadow-lg z-50 py-1">
          <button
            onClick={handleMarkdown}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a2a]"
          >
            Export Markdown
          </button>
          <button
            onClick={handleJSON}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a2a]"
          >
            Export JSON
          </button>
          <button
            onClick={handleCSV}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a2a]"
          >
            Export CSV
          </button>
          <button
            onClick={handleICS}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a2a]"
          >
            Export Calendar (.ics)
          </button>
        </div>
      )}
    </div>
  );
}
