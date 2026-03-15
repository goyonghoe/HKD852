import Link from "next/link";

export default function Footer() {
  return (
    <footer className="py-8 px-4 text-center border-t border-surface-border mt-4">
      <div className="mx-auto max-w-mobile">
        <div className="flex items-center justify-center gap-4 text-sm text-text-dim mb-3">
          <Link
            href="/about"
            className="hover:text-text-secondary transition-colors"
          >
            소개
          </Link>
          <span className="text-surface-border">|</span>
          <Link
            href="/legal/terms"
            className="hover:text-text-secondary transition-colors"
          >
            이용약관
          </Link>
          <span className="text-surface-border">|</span>
          <Link
            href="/legal/privacy"
            className="hover:text-text-secondary transition-colors"
          >
            개인정보처리방침
          </Link>
        </div>
        <p className="text-xs text-text-dim">
          &copy; 2026 심테공장. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
