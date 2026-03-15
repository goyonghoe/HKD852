"use client";

import { useState, useCallback } from "react";
import Button from "@/components/ui/Button";
import { shareToKakao } from "@/lib/share/kakao";

interface ShareButtonsProps {
  shareText: string;
  shareUrl: string;
  testTitle: string;
  imageUrl?: string;
}

export default function ShareButtons({
  shareText,
  shareUrl,
  testTitle,
  imageUrl,
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard write failed
    }
  }, []);

  const handleKakaoShare = useCallback(async () => {
    try {
      await shareToKakao({
        title: testTitle,
        description: shareText,
        imageUrl:
          imageUrl ||
          `${process.env.NEXT_PUBLIC_BASE_URL || ""}/opengraph-image`,
        webUrl: shareUrl,
        buttonTitle: "나도 해보기",
      });
    } catch {
      // Kakao SDK failed — fall back to clipboard copy
      await copyToClipboard(`${shareText}\n${shareUrl}`);
    }
  }, [testTitle, shareText, shareUrl, imageUrl, copyToClipboard]);

  const handleWebShare = useCallback(async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: testTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // User cancelled or share failed silently
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Clipboard also failed
      }
    }
  }, [testTitle, shareText, shareUrl]);

  const handleCopyLink = useCallback(async () => {
    await copyToClipboard(shareUrl);
  }, [shareUrl, copyToClipboard]);

  return (
    <div className="py-4 relative">
      {/* Toast notification */}
      {copied && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full bg-text-primary text-white text-sm font-bold shadow-lg animate-fade-up z-10">
          복사됨!
        </div>
      )}

      <div className="flex flex-col gap-3">
        {/* Kakao share - primary CTA */}
        <Button
          variant="kakao"
          size="lg"
          fullWidth
          onClick={handleKakaoShare}
          className="flex items-center justify-center gap-2 min-h-[56px]"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M10 2C5.029 2 1 5.217 1 9.157c0 2.52 1.667 4.738 4.174 6.017l-1.07 3.88c-.094.34.297.615.59.415l4.543-3.04c.249.023.5.037.763.037 4.971 0 9-3.217 9-7.157C19 5.217 14.971 2 10 2z"
              fill="#3C1E1E"
            />
          </svg>
          <span className="text-lg font-bold">카카오톡으로 공유</span>
        </Button>

        {/* Bottom row: Share + Copy */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="primary"
            size="md"
            fullWidth
            onClick={handleWebShare}
            className="min-h-[52px]"
          >
            공유하기
          </Button>
          <Button
            variant="outline"
            size="md"
            fullWidth
            onClick={handleCopyLink}
            className="min-h-[52px]"
          >
            링크 복사
          </Button>
        </div>
      </div>
    </div>
  );
}
