import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "심테공장 — 재밌는 심리테스트 모음",
    template: "%s | 심테공장",
  },
  description:
    "성격, 연애, 심리 테스트를 무료로 해보세요! 친구와 결과를 공유하고 비교해보세요.",
  openGraph: {
    title: "심테공장 — 재밌는 심리테스트 모음",
    description:
      "성격, 연애, 심리 테스트를 무료로! 친구와 결과를 공유해보세요.",
    type: "website",
    locale: "ko_KR",
    siteName: "심테공장",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#6C5CE7",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen bg-white font-sans text-text-primary antialiased">
        <div className="mx-auto max-w-mobile min-h-screen bg-white relative">
          {children}
        </div>

        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
