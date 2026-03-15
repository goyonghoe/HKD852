"use client";

import { useState, useRef, useEffect } from "react";
import type { Task } from "@/lib/database.types";
import {
  requestNotificationPermission,
  isNotificationDenied,
  isTaskOverdue,
} from "@/lib/notifications";

interface NotificationBellProps {
  permitted: boolean;
  onPermissionChange: (permitted: boolean) => void;
  dueTasks: Task[];
  onTaskClick: (task: Task) => void;
}

export default function NotificationBell({
  permitted,
  onPermissionChange,
  dueTasks,
  onTaskClick,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const count = dueTasks.length;

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleEnable = async () => {
    const result = await requestNotificationPermission();
    onPermissionChange(result);
  };

  const denied = isNotificationDenied();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        title="Notifications"
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
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-72 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#333] rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-100 dark:border-[#2a2a2a] flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Notifications
            </span>
            {count > 0 && (
              <span className="text-[10px] bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-full font-medium">
                {count} due
              </span>
            )}
          </div>

          {!permitted && !denied && (
            <div className="px-3 py-2.5 border-b border-gray-100 dark:border-[#2a2a2a]">
              <button
                onClick={handleEnable}
                className="w-full text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-md py-1.5 font-medium transition-colors"
              >
                Enable notifications
              </button>
            </div>
          )}

          {denied && (
            <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-[#2a2a2a]">
              Notifications blocked. Enable in browser settings.
            </div>
          )}

          {dueTasks.length === 0 ? (
            <div className="px-3 py-4 text-xs text-gray-400 dark:text-gray-500 text-center">
              No tasks due
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto">
              {dueTasks.slice(0, 5).map((task) => {
                const overdue = isTaskOverdue(task);
                return (
                  <button
                    key={task.id}
                    onClick={() => {
                      onTaskClick(task);
                      setOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-[#252525] border-b border-gray-50 dark:border-[#222] last:border-0 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          overdue
                            ? "bg-red-500"
                            : "bg-yellow-400 dark:bg-yellow-500"
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                          {task.title}
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                          {overdue ? "Overdue" : "Due today"} &middot;{" "}
                          {task.scheduled_date}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
              {dueTasks.length > 5 && (
                <div className="px-3 py-1.5 text-[10px] text-gray-400 dark:text-gray-500 text-center">
                  +{dueTasks.length - 5} more
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
