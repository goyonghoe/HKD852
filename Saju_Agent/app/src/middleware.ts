import { NextRequest, NextResponse } from "next/server";

type RateLimitEntry = {
  timestamps: number[];
};

const rateLimitMap = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60_000; // 1분
const CLEANUP_INTERVAL_MS = 5 * 60_000; // 5분
let lastCleanup = Date.now();

function getLimit(pathname: string): number {
  if (pathname.startsWith("/api/saju/interpret")) return 10;
  if (pathname.startsWith("/api/saju/calculate")) return 20;
  if (pathname.startsWith("/api/payment")) return 10;
  return 60;
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function cleanupStaleEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  const cutoff = now - WINDOW_MS;
  rateLimitMap.forEach((entry, key) => {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) {
      rateLimitMap.delete(key);
    }
  });
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const ip = getClientIp(request);
  const limit = getLimit(pathname);
  const key = `${ip}:${pathname}`;
  const now = Date.now();

  cleanupStaleEntries();

  const entry = rateLimitMap.get(key) || { timestamps: [] };
  entry.timestamps = entry.timestamps.filter((t) => t > now - WINDOW_MS);
  entry.timestamps.push(now);
  rateLimitMap.set(key, entry);

  if (entry.timestamps.length > limit) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": "60",
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": "0",
        },
      },
    );
  }

  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Limit", String(limit));
  response.headers.set(
    "X-RateLimit-Remaining",
    String(Math.max(0, limit - entry.timestamps.length)),
  );
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
