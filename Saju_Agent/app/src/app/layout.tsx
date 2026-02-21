import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "운명의 도깨비 — 니 운명, 내가 봐줄까?",
  description:
    "생년월일만 대봐. 도깨비가 니 팔자 까발려줄게. 성격, 적성, 연애, 건강, 2026 운세까지.",
  openGraph: {
    title: "운명의 도깨비 — 니 운명, 까발려줄까?",
    description: "생년월일만 대봐. 도깨비가 니 팔자 봐줄게.",
    type: "website",
    locale: "ko_KR",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0A0910",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-bg">
        <div className="mx-auto max-w-mobile min-h-screen bg-bg relative overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
