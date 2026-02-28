import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "배당 모니터 — KRX 배당수익률 대시보드",
  description: "한국 거래소 배당수익률 모니터링",
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
