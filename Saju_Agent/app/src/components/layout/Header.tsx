"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface HeaderProps {
  showBack?: boolean;
}

export default function Header({ showBack = false }: HeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 bg-cream/80 backdrop-blur-md border-b border-cream-dark">
      <div className="px-5 py-3 flex items-center justify-center relative">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="absolute left-4 text-gray-400 hover:text-gray-600 transition-colors p-1"
            aria-label="뒤로 가기"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl crystal-float">🔮</span>
          <span className="font-bold text-lg text-gradient">AI 사주풀이</span>
        </Link>
      </div>
    </header>
  );
}
