"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface HeaderProps {
  showBack?: boolean;
}

export default function Header({ showBack = false }: HeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 bg-bg/90 backdrop-blur-md border-b border-surface-border">
      <div className="px-5 py-3 flex items-center justify-center relative">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="absolute left-4 text-text-secondary hover:text-teal transition-colors p-1"
            aria-label="뒤로 가기"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}
        <Link href="/" className="flex items-center gap-1.5">
          <span className="text-2xl">👹</span>
          <span className="font-display text-xl text-teal tracking-tight">운명의 도깨비</span>
        </Link>
      </div>
    </header>
  );
}
