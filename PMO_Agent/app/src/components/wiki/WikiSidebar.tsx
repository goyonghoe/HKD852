"use client";

import { useState } from "react";

export interface WikiPage {
  slug: string;
  title: string;
}

export interface WikiSection {
  title: string;
  pages: WikiPage[];
}

export interface WikiIndex {
  sections: WikiSection[];
}

interface WikiSidebarProps {
  index: WikiIndex;
  activePage: string;
  onSelect: (slug: string) => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export default function WikiSidebar({
  index,
  activePage,
  onSelect,
  isMobileOpen,
  onMobileClose,
}: WikiSidebarProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleSection = (title: string) => {
    setCollapsed((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const handleSelect = (slug: string) => {
    onSelect(slug);
    onMobileClose();
  };

  const sidebarContent = (
    <nav className="flex flex-col gap-1 px-2 py-3">
      {index.sections.map((section) => {
        const isCollapsed = collapsed[section.title];
        return (
          <div key={section.title} className="mb-1">
            <button
              onClick={() => toggleSection(section.title)}
              className="w-full flex items-center justify-between px-2 py-1.5 rounded text-2xs font-semibold text-text-dim uppercase tracking-wider hover:bg-surface-light transition-colors"
            >
              <span>{section.title}</span>
              <svg
                className={`w-3 h-3 text-text-dim transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {!isCollapsed && (
              <div className="mt-0.5 flex flex-col gap-0.5">
                {section.pages.map((page) => {
                  const isActive = page.slug === activePage;
                  return (
                    <button
                      key={page.slug}
                      onClick={() => handleSelect(page.slug)}
                      className={`w-full text-left px-3 py-1.5 rounded text-xs transition-colors ${
                        isActive
                          ? "bg-accent/10 text-accent font-medium"
                          : "text-text-secondary hover:bg-surface-light hover:text-text-primary"
                      }`}
                    >
                      {page.title}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-surface-border bg-bg-elevated overflow-y-auto">
        <div className="px-4 py-3 border-b border-surface-border">
          <span className="text-xs font-semibold text-text-primary">
            WanChai 위키
          </span>
        </div>
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {isMobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/30"
            onClick={onMobileClose}
          />
          <aside className="md:hidden fixed left-0 top-0 bottom-0 z-50 w-64 flex flex-col bg-bg-elevated border-r border-surface-border overflow-y-auto shadow-modal">
            <div className="px-4 py-3 border-b border-surface-border flex items-center justify-between">
              <span className="text-xs font-semibold text-text-primary">
                WanChai 위키
              </span>
              <button
                onClick={onMobileClose}
                className="p-1 rounded hover:bg-surface-light text-text-dim"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
