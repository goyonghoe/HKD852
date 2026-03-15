"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";

interface UseVirtualizerOptions {
  itemCount: number;
  itemHeight: number;
  overscan?: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

interface VirtualItem {
  index: number;
  offsetTop: number;
}

export function useVirtualizer({
  itemCount,
  itemHeight,
  overscan = 5,
  containerRef,
}: UseVirtualizerOptions) {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    ro.observe(el);

    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setScrollTop(el.scrollTop);
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [containerRef]);

  const virtualItems = useMemo<VirtualItem[]>(() => {
    if (containerHeight === 0) return [];
    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / itemHeight) - overscan,
    );
    const endIndex = Math.min(
      itemCount - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan,
    );

    const items: VirtualItem[] = [];
    for (let i = startIndex; i <= endIndex; i++) {
      items.push({ index: i, offsetTop: i * itemHeight });
    }
    return items;
  }, [scrollTop, containerHeight, itemCount, itemHeight, overscan]);

  const totalHeight = itemCount * itemHeight;

  const scrollToIndex = useCallback(
    (index: number) => {
      containerRef.current?.scrollTo({
        top: index * itemHeight,
        behavior: "smooth",
      });
    },
    [containerRef, itemHeight],
  );

  return { virtualItems, totalHeight, scrollToIndex };
}
