"use client";

import { useRouter } from "next/navigation";

interface BackButtonProps {
  title: string;
}

export default function BackButton({ title }: BackButtonProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="sm:hidden inline-flex items-center gap-1.5
        text-[var(--text)] hover:text-[var(--accent)]
        transition-colors duration-150 -ml-1"
      aria-label="뒤로 가기"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="15 18 9 12 15 6" />
      </svg>
      <span className="text-base font-semibold truncate max-w-48">{title}</span>
    </button>
  );
}
