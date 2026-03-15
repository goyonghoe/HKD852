import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HKD852 Wiki",
  description: "HKD852 Studio - AI Agent Organization Wiki",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="dark">
      <body className="min-h-screen">
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="sidebar w-64 shrink-0 hidden md:block overflow-y-auto sticky top-0 h-screen">
            <div className="p-4">
              <h1
                className="text-lg font-bold"
                style={{ color: "var(--accent)" }}
              >
                HKD852 Wiki
              </h1>
              <p
                className="text-xs mt-1"
                style={{ color: "var(--text-secondary)" }}
              >
                AI Agent Studio
              </p>
            </div>
            <nav className="px-2 pb-4">
              <div className="mb-4">
                <p
                  className="px-2 py-1 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Overview
                </p>
                <a href="/" className="block px-2 py-1.5 rounded text-sm">
                  Home
                </a>
                <a
                  href="/architecture"
                  className="block px-2 py-1.5 rounded text-sm"
                >
                  Architecture
                </a>
                <a
                  href="/#org-chart"
                  className="block px-2 py-1.5 rounded text-sm"
                >
                  Org Chart
                </a>
              </div>
              <div className="mb-4">
                <p
                  className="px-2 py-1 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Agents
                </p>
                <a href="/agents" className="block px-2 py-1.5 rounded text-sm">
                  All Agents
                </a>
              </div>
              <div className="mb-4">
                <p
                  className="px-2 py-1 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Skills
                </p>
                <a href="/skills" className="block px-2 py-1.5 rounded text-sm">
                  Skill Directory
                </a>
              </div>
              <div className="mb-4">
                <p
                  className="px-2 py-1 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Documents
                </p>
                <a href="/docs" className="block px-2 py-1.5 rounded text-sm">
                  All Docs
                </a>
              </div>
              <div className="mb-4">
                <p
                  className="px-2 py-1 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Guides
                </p>
                <a href="/guides" className="block px-2 py-1.5 rounded text-sm">
                  Claude Code Guide
                </a>
              </div>
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            {/* Mobile header */}
            <header
              className="md:hidden p-4 border-b"
              style={{ borderColor: "var(--border-color)" }}
            >
              <h1
                className="text-lg font-bold"
                style={{ color: "var(--accent)" }}
              >
                HKD852 Wiki
              </h1>
            </header>
            <div className="p-6 md:p-8 max-w-4xl">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
