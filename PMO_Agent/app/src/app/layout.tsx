import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WanChai Kanban — 태스크 대시보드",
  description: "WanChai 게임 개발 칸반 보드",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-bg font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
