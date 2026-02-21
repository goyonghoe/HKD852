"use client";

import { useState } from "react";
import Button from "../ui/Button";

interface ShareCardProps {
  shareUrl: string;
  title: string;
}

export default function ShareCard({ shareUrl, title }: ShareCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const input = document.createElement("input");
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: "나도 내 사주 속 숨겨진 나를 찾아봐!",
          url: shareUrl,
        });
      } catch {
        // User cancelled
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
      <div className="text-center">
        <span className="text-2xl">📤</span>
        <h3 className="text-sm font-bold text-gray-700 mt-1">
          친구에게 공유하기
        </h3>
        <p className="text-xs text-gray-400 mt-0.5">
          친구도 사주를 확인해보게 해요!
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleNativeShare}
          fullWidth
          variant="primary"
          size="md"
        >
          공유하기
        </Button>
        <Button
          onClick={handleCopyLink}
          fullWidth
          variant="outline"
          size="md"
        >
          {copied ? "복사됨!" : "링크 복사"}
        </Button>
      </div>
    </div>
  );
}
