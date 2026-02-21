import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 사주풀이 - 내 사주 속 숨겨진 나를 찾아보세요",
  description:
    "생년월일만 입력하면 AI가 분석하는 나만의 사주풀이. 성격, 적성, 연애, 2026 운세까지!",
  openGraph: {
    title: "AI 사주풀이 - 내 사주 속 숨겨진 나",
    description: "생년월일만 입력하면 AI가 분석하는 나만의 사주풀이",
    type: "website",
    locale: "ko_KR",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#7C5CFC",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-cream">
        <div className="mx-auto max-w-mobile min-h-screen bg-cream">
          {children}
        </div>
      </body>
    </html>
  );
}
