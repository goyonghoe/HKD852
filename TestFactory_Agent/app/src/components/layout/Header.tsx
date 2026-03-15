import Link from "next/link";
import ShareSiteButton from "./ShareSiteButton";

interface HeaderProps {
  showBack?: boolean;
  title?: string;
}

export default function Header({ showBack = false, title }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-surface-border">
      <div className="mx-auto max-w-mobile flex items-center justify-between h-[56px] px-4">
        {/* Left: Back button or Logo */}
        <div className="flex items-center flex-1 min-w-0">
          {showBack ? (
            <Link
              href="/"
              className="flex items-center justify-center w-11 h-11 -ml-2 rounded-xl text-text-primary hover:bg-bg-soft transition-colors flex-shrink-0"
              aria-label="뒤로 가기"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </Link>
          ) : null}

          {title ? (
            <h1 className="flex-1 text-center font-bold text-text-primary text-lg truncate">
              {title}
            </h1>
          ) : (
            <Link href="/" className="flex items-center gap-2">
              <svg
                width="32"
                height="32"
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="6"
                  y="16"
                  width="28"
                  height="18"
                  rx="3"
                  fill="#6C5CE7"
                />
                <rect
                  x="11"
                  y="8"
                  width="5"
                  height="10"
                  rx="1.5"
                  fill="#A29BFE"
                />
                <rect
                  x="24"
                  y="11"
                  width="5"
                  height="7"
                  rx="1.5"
                  fill="#A29BFE"
                />
                <rect
                  x="10"
                  y="21"
                  width="6"
                  height="5"
                  rx="1.5"
                  fill="#FEE500"
                  opacity="0.9"
                />
                <rect
                  x="18"
                  y="21"
                  width="6"
                  height="5"
                  rx="1.5"
                  fill="#FEE500"
                  opacity="0.9"
                />
                <rect
                  x="26"
                  y="21"
                  width="6"
                  height="5"
                  rx="1.5"
                  fill="#FEE500"
                  opacity="0.7"
                />
                <rect
                  x="16"
                  y="28"
                  width="8"
                  height="6"
                  rx="1.5"
                  fill="#F0EEFF"
                />
                <circle cx="34" cy="14" r="4" fill="#FDCB6E" />
                <circle cx="34" cy="14" r="1.5" fill="#6C5CE7" />
                <circle cx="13" cy="6" r="2" fill="#E2DCFE" opacity="0.6" />
                <circle cx="16" cy="4" r="1.5" fill="#E2DCFE" opacity="0.4" />
              </svg>
              <span className="font-display text-xl text-primary">
                심테공장
              </span>
            </Link>
          )}
        </div>

        {/* Right: Share button (항시 노출) */}
        <div className="flex-shrink-0">
          <ShareSiteButton />
        </div>
      </div>
    </header>
  );
}
