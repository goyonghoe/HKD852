"use client";

import { usePathname } from "next/navigation";
import BackButton from "./BackButton";

interface MobileHeaderProps {
  title: string;
  children?: React.ReactNode;
}

export default function MobileHeader({ title, children }: MobileHeaderProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header
      className="sm:hidden sticky top-0 z-40
        flex items-center justify-between h-12 px-4
        border-b border-[var(--border)]
        bg-[var(--surface)]/80 backdrop-blur-xl
        pt-[env(safe-area-inset-top)]"
    >
      <div className="flex items-center min-w-0">
        {isHome ? (
          <h1 className="text-base font-semibold text-[var(--text)] truncate">
            {title}
          </h1>
        ) : (
          <BackButton title={title} />
        )}
      </div>

      {children && (
        <div className="flex items-center gap-2 shrink-0">{children}</div>
      )}
    </header>
  );
}
