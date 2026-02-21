"use client";

import { useState } from "react";
import Button from "../ui/Button";

interface ShareCardProps {
  shareUrl: string;
  title?: string;
}

export default function ShareCard({ shareUrl }: ShareCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const input = document.createElement("input");
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "👹 도깨비가 니 운명 까봤어", text: "👹🔮 야, 너도 운명 까봐 ㅋㅋ 도깨비한테 사주 보면 소름돋음", url: shareUrl });
      } catch { /* cancelled */ }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="bg-surface rounded-2xl border border-surface-border p-5 space-y-4">
      <div className="text-center space-y-1">
        <h3 className="text-[15px] font-bold text-text-primary">친구 운명도 까볼래?</h3>
        <p className="text-[13px] text-text-dim font-hand">도깨비가 기다리고 있어</p>
      </div>
      <div className="flex gap-2">
        <Button onClick={handleNativeShare} fullWidth variant="teal" size="md">공유하기</Button>
        <Button onClick={handleCopyLink} fullWidth variant="outline" size="md">{copied ? "복사됨!" : "링크 복사"}</Button>
      </div>
    </div>
  );
}
