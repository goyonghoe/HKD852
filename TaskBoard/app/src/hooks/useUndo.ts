"use client";

import { useState, useRef, useCallback } from "react";

export interface UndoAction {
  message: string;
  undo: () => Promise<void>;
}

export function useUndo(timeout = 5000) {
  const [undoAction, setUndoAction] = useState<UndoAction | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const dismissUndo = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setUndoAction(null);
  }, []);

  const showUndo = useCallback(
    (action: UndoAction) => {
      // Clear any existing timer
      if (timerRef.current) clearTimeout(timerRef.current);
      setUndoAction(action);
      timerRef.current = setTimeout(() => {
        setUndoAction(null);
      }, timeout);
    },
    [timeout],
  );

  return { showUndo, undoAction, dismissUndo };
}
