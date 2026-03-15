/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' pagead2.googlesyndication.com www.googletagservices.com *.kakaocdn.net *.kakao.com www.googletagmanager.com",
              "style-src 'self' 'unsafe-inline' cdn.jsdelivr.net fonts.googleapis.com",
              "font-src 'self' cdn.jsdelivr.net fonts.gstatic.com",
              "img-src 'self' data: blob: pagead2.googlesyndication.com www.googletagmanager.com *.kakaocdn.net *.kakao.com",
              "frame-src pagead2.googlesyndication.com tpc.googlesyndication.com googleads.g.doubleclick.net *.kakao.com",
              "connect-src 'self' pagead2.googlesyndication.com www.google-analytics.com *.kakao.com *.kakaocdn.net",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
