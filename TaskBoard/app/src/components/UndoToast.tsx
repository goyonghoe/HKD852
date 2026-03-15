"use client";

import { useEffect, useState } from "react";
import type { UndoAction } from "@/hooks/useUndo";

interface UndoToastProps {
  action: UndoAction | null;
  onDismiss: () => void;
}

export default function UndoToast({ action, onDismiss }: UndoToastProps) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (action) {
      setExiting(false);
      // Small delay to trigger CSS transition
      requestAnimationFrame(() => setVisible(true));
    } else {
      setExiting(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setExiting(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [action]);

  if (!visible && !action) return null;

  const handleUndo = async () => {
    if (action) {
      await action.undo();
      onDismiss();
    }
  };

  return (
    <div
      className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-[60] transition-all duration-300 ease-out ${
        action && !exiting
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0 pointer-events-none"
      }`}
    >
      <div className="flex items-center gap-3 bg-gray-900 dark:bg-gray-800 text-white text-sm rounded-xl shadow-2xl px-4 py-3 min-w-[260px]">
        <span className="flex-1">{action?.message}</span>
        <button
          onClick={handleUndo}
          className="text-blue-400 hover:text-blue-300 font-semibold text-sm shrink-0 px-2 py-0.5 rounded-md hover:bg-white/10 transition-colors"
        >
          Undo
        </button>
      </div>
    </div>
  );
}
