import { useEffect } from "react";

interface KeyboardShortcutsOptions {
  onQuickAdd: () => void;
  onFocusSearch: () => void;
  onEscape: () => void;
  onRefresh: () => void;
}

export function useKeyboardShortcuts({
  onQuickAdd,
  onFocusSearch,
  onEscape,
  onRefresh,
}: KeyboardShortcutsOptions) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;

      if (e.key === "Escape") {
        onEscape();
        return;
      }

      // Don't fire shortcuts while typing in inputs
      if (isTyping) return;

      if (e.key === "/") {
        e.preventDefault();
        onFocusSearch();
      } else if (e.key === "t" || e.key === "n") {
        e.preventDefault();
        onQuickAdd();
      } else if (e.key === "r") {
        e.preventDefault();
        onRefresh();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onQuickAdd, onFocusSearch, onEscape, onRefresh]);
}
