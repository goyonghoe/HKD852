"use client";

import { useEffect, useCallback } from "react";
import { ViewMode } from "@/lib/kanban/types";

interface ShortcutConfig {
  onNewTask?: () => void;
  onNavigateUp?: () => void;
  onNavigateDown?: () => void;
  onOpenDetail?: () => void;
  onClosePanel?: () => void;
  onViewChange?: (mode: ViewMode) => void;
}

const VIEW_KEYS: Record<string, ViewMode> = {
  "1": "board",
  "2": "table",
  "3": "timeline",
  "4": "dashboard",
};

export function useKeyboardShortcuts(config: ShortcutConfig) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Skip if user is typing in input/textarea/select
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.target as HTMLElement)?.isContentEditable) return;

      // Don't intercept when modifier keys are held (except shift for nav)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      switch (e.key) {
        case "c":
        case "C":
          e.preventDefault();
          config.onNewTask?.();
          break;
        case "j":
        case "J":
          e.preventDefault();
          config.onNavigateDown?.();
          break;
        case "k":
        case "K":
          e.preventDefault();
          config.onNavigateUp?.();
          break;
        case "Enter":
          e.preventDefault();
          config.onOpenDetail?.();
          break;
        case "Escape":
          e.preventDefault();
          config.onClosePanel?.();
          break;
        default:
          if (VIEW_KEYS[e.key] && config.onViewChange) {
            e.preventDefault();
            config.onViewChange(VIEW_KEYS[e.key]);
          }
          break;
      }
    },
    [config],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
