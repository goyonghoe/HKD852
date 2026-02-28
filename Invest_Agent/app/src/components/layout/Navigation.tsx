"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "배당수익률" },
  { href: "/screener", label: "스크리너" },
  { href: "/portfolio", label: "포트폴리오" },
  { href: "/briefing", label: "브리핑" },
  { href: "/journal", label: "투자 일지" },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              isActive
                ? "bg-accent text-white font-medium"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-light"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
