"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { Task } from "@/lib/database.types";
import {
  isNotificationPermitted,
  checkDueTasks,
  notifyDueTasks,
} from "@/lib/notifications";

const CHECK_INTERVAL = 15 * 60 * 1000; // 15 minutes

export function useNotifications(tasks: Task[]) {
  const [permitted, setPermitted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setPermitted(isNotificationPermitted());
  }, []);

  const dueTasks = checkDueTasks(tasks);

  const runCheck = useCallback(() => {
    if (!isNotificationPermitted()) return;
    notifyDueTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    // Initial check
    runCheck();

    // Set up periodic check
    intervalRef.current = setInterval(runCheck, CHECK_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [runCheck]);

  return { permitted, setPermitted, dueTasks };
}
