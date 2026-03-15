"use client";

import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";

let channelCounter = 0;

const DEBOUNCE_MS = 300;

/**
 * Subscribe to Supabase Realtime changes on the 'tasks' table.
 * Debounces rapid events to avoid flicker from optimistic updates
 * colliding with realtime-triggered refetches.
 * `suppress()` pauses sync briefly after local mutations.
 */
export function useRealtimeSync(onSync: () => void) {
  const channelName = useRef(`tasks-changes-${++channelCounter}`);
  const suppressedUntil = useRef(0);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const suppress = useCallback(() => {
    suppressedUntil.current = Date.now() + 800;
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel(channelName.current)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        () => {
          if (Date.now() < suppressedUntil.current) return;
          if (debounceTimer.current) clearTimeout(debounceTimer.current);
          debounceTimer.current = setTimeout(() => {
            onSync();
          }, DEBOUNCE_MS);
        },
      )
      .subscribe();

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      supabase.removeChannel(channel);
    };
  }, [onSync]);

  return { suppress };
}
