"use client";

import { useState, useEffect } from "react";
import DokkaebiIcon from "./DokkaebiIcon";

const MESSAGES = [
  "사주팔자 펼치는 중...",
  "오행 흐름 읽고 있어",
  "십신 관계 따져보는 중...",
  "역마살, 도화살 확인 중...",
  "어... 이거 좀 재밌는데?",
  "거의 다 봤어. 잠깐만",
];

interface LoadingFortuneProps {
  fullScreen?: boolean;
}

export default function LoadingFortune({ fullScreen = false }: LoadingFortuneProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const content = (
    <div className="flex flex-col items-center justify-center gap-5 py-16">
      <div className="animate-float">
        <DokkaebiIcon size={64} />
      </div>

      <div className="text-center space-y-3">
        <p className="font-hand text-lg text-teal transition-opacity duration-500">
          {MESSAGES[messageIndex]}
        </p>
        <div className="flex gap-1.5 justify-center">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-teal/60"
              style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-bg/95 backdrop-blur-sm flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}
