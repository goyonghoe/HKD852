"use client";

import { useState, useEffect } from "react";

const MESSAGES = [
  "사주를 분석하고 있어요...",
  "오행의 균형을 살피는 중...",
  "당신의 운명을 읽고 있어요...",
  "별자리를 탐색하는 중...",
  "거의 다 됐어요!",
];

interface LoadingFortuneProps {
  fullScreen?: boolean;
}

export default function LoadingFortune({ fullScreen = false }: LoadingFortuneProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const content = (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div className="text-5xl crystal-float">🔮</div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-primary"
            style={{
              animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
      <p className="text-sm text-gray-500 transition-opacity duration-500">
        {MESSAGES[messageIndex]}
      </p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-cream/90 backdrop-blur-sm flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}
