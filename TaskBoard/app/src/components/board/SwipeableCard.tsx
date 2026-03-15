"use client";

import {
  useRef,
  useState,
  useCallback,
  type TouchEvent,
  type ReactNode,
} from "react";
import type { Task, TaskStatus } from "@/lib/database.types";

interface SwipeableCardProps {
  task: Task;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  children: ReactNode;
}

const FULL_THRESHOLD = 100;
const HALF_THRESHOLD = 50;
const MAX_SWIPE = 200;
const DIRECTION_LOCK_RATIO = 1.5; // horizontal must be 1.5x vertical to count

const statusOptions: { status: TaskStatus; label: string; color: string }[] = [
  { status: "backlog", label: "Backlog", color: "bg-gray-500" },
  { status: "thisweek", label: "Week", color: "bg-indigo-500" },
  { status: "today", label: "Today", color: "bg-amber-500" },
  { status: "in_progress", label: "Active", color: "bg-blue-500" },
  { status: "waiting", label: "Wait", color: "bg-orange-500" },
  { status: "done", label: "Done", color: "bg-green-500" },
];

export default function SwipeableCard({
  task,
  onComplete,
  onDelete,
  onStatusChange,
  children,
}: SwipeableCardProps) {
  const [offsetX, setOffsetX] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [actionFired, setActionFired] = useState(false);

  const startX = useRef(0);
  const startY = useRef(0);
  const currentX = useRef(0);
  const directionLocked = useRef<"horizontal" | "vertical" | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const resetSwipe = useCallback((animate = true) => {
    if (animate) {
      setIsAnimating(true);
      setOffsetX(0);
      setTimeout(() => setIsAnimating(false), 300);
    } else {
      setOffsetX(0);
    }
    directionLocked.current = null;
  }, []);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (showStatusMenu) return;
      const touch = e.touches[0];
      startX.current = touch.clientX;
      startY.current = touch.clientY;
      currentX.current = touch.clientX;
      directionLocked.current = null;
      setIsAnimating(false);
      setActionFired(false);
    },
    [showStatusMenu],
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (showStatusMenu || actionFired) return;

      const touch = e.touches[0];
      const dx = touch.clientX - startX.current;
      const dy = touch.clientY - startY.current;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      // Lock direction after minimal movement
      if (!directionLocked.current && (absDx > 8 || absDy > 8)) {
        if (absDx > absDy * DIRECTION_LOCK_RATIO) {
          directionLocked.current = "horizontal";
        } else {
          directionLocked.current = "vertical";
          return;
        }
      }

      if (directionLocked.current !== "horizontal") return;

      // Prevent vertical scroll while swiping horizontally
      e.preventDefault();

      currentX.current = touch.clientX;
      // Clamp with rubber-band feel beyond MAX_SWIPE
      const clamped = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, dx));
      setOffsetX(clamped);
    },
    [showStatusMenu, actionFired],
  );

  const handleTouchEnd = useCallback(() => {
    if (showStatusMenu || actionFired) return;
    if (directionLocked.current !== "horizontal") {
      directionLocked.current = null;
      return;
    }

    const dx = currentX.current - startX.current;
    const absDx = Math.abs(dx);

    if (dx > 0 && absDx >= FULL_THRESHOLD) {
      // Full swipe right -> complete
      setActionFired(true);
      setIsAnimating(true);
      setOffsetX(300);
      setTimeout(() => {
        onComplete(task.id);
        resetSwipe(false);
        setActionFired(false);
      }, 250);
      return;
    }

    if (dx < 0 && absDx >= FULL_THRESHOLD) {
      // Full swipe left -> delete
      setActionFired(true);
      setIsAnimating(true);
      setOffsetX(-300);
      setTimeout(() => {
        onDelete(task.id);
        resetSwipe(false);
        setActionFired(false);
      }, 250);
      return;
    }

    if (dx > 0 && absDx >= HALF_THRESHOLD) {
      // Half swipe right -> show status menu
      setIsAnimating(true);
      setOffsetX(0);
      setTimeout(() => {
        setIsAnimating(false);
        setShowStatusMenu(true);
      }, 200);
      return;
    }

    // Below threshold -> spring back
    resetSwipe(true);
  }, [showStatusMenu, actionFired, task.id, onComplete, onDelete, resetSwipe]);

  const handleStatusSelect = useCallback(
    (status: TaskStatus) => {
      setShowStatusMenu(false);
      if (status !== task.status) {
        onStatusChange(task.id, status);
      }
    },
    [task.id, task.status, onStatusChange],
  );

  const handleDismissMenu = useCallback(() => {
    setShowStatusMenu(false);
  }, []);

  // Determine background based on swipe direction and distance
  const absOffset = Math.abs(offsetX);
  const swipeRight = offsetX > 0;
  const swipeLeft = offsetX < 0;
  const rightProgress = swipeRight
    ? Math.min(absOffset / FULL_THRESHOLD, 1)
    : 0;
  const leftProgress = swipeLeft ? Math.min(absOffset / FULL_THRESHOLD, 1) : 0;

  return (
    <div ref={containerRef} className="relative overflow-hidden rounded-lg">
      {/* Right-swipe background (green / complete) */}
      {swipeRight && absOffset > 4 && (
        <div
          className="absolute inset-0 flex items-center pl-4 rounded-lg transition-colors"
          style={{
            backgroundColor: `rgba(34, 197, 94, ${0.3 + rightProgress * 0.7})`,
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ opacity: 0.4 + rightProgress * 0.6 }}
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {absOffset >= HALF_THRESHOLD && absOffset < FULL_THRESHOLD && (
            <span className="ml-2 text-xs text-white font-medium opacity-80">
              Release for status
            </span>
          )}
          {absOffset >= FULL_THRESHOLD && (
            <span className="ml-2 text-xs text-white font-semibold">Done!</span>
          )}
        </div>
      )}

      {/* Left-swipe background (red / delete) */}
      {swipeLeft && absOffset > 4 && (
        <div
          className="absolute inset-0 flex items-center justify-end pr-4 rounded-lg transition-colors"
          style={{
            backgroundColor: `rgba(239, 68, 68, ${0.3 + leftProgress * 0.7})`,
          }}
        >
          {absOffset >= FULL_THRESHOLD && (
            <span className="mr-2 text-xs text-white font-semibold">
              Delete
            </span>
          )}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ opacity: 0.4 + leftProgress * 0.6 }}
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>
      )}

      {/* Swipeable card content */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isAnimating
            ? "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
            : "none",
          willChange: "transform",
        }}
        className="relative z-10"
      >
        {children}
      </div>

      {/* Status quick-select menu */}
      {showStatusMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-20"
            onClick={handleDismissMenu}
            onTouchEnd={(e) => {
              e.stopPropagation();
              handleDismissMenu();
            }}
          />
          {/* Menu */}
          <div className="absolute inset-x-0 bottom-0 z-30 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-b-lg shadow-lg p-2 animate-slide-up">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Move to:
              </span>
              <button
                onClick={handleDismissMenu}
                className="text-gray-400 hover:text-gray-600 text-sm leading-none px-1"
              >
                x
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {statusOptions.map(({ status, label, color }) => (
                <button
                  key={status}
                  onClick={() => handleStatusSelect(status)}
                  className={`text-xs text-white px-2 py-1 rounded-md transition-opacity ${color} ${
                    status === task.status
                      ? "opacity-40 cursor-default"
                      : "active:opacity-80"
                  }`}
                  disabled={status === task.status}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Inline styles for slide-up animation */}
      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
