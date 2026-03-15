import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomTabBar from "@/components/mobile/BottomTabBar";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "Ultra Task Board",
  description: "Personal task board for Kowloon",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Ultra Task Board",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('taskboard-dark-mode');
                  var isDark = stored !== null
                    ? stored === 'true'
                    : window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (isDark) document.documentElement.classList.add('dark');
                } catch(e) {}
              })();
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js').catch(function() {});
              }
            `,
          }}
        />
      </head>
      <body className="antialiased bg-[var(--bg)] text-[var(--text)] overflow-x-hidden overscroll-none">
        <AuthProvider>
          <div className="pb-14 sm:pb-0">{children}</div>
          <BottomTabBar />
        </AuthProvider>
      </body>
    </html>
  );
}
