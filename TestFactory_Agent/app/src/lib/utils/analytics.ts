/**
 * Simple GA4 event tracker.
 * Calls window.gtag if the Google Analytics script is loaded.
 */

declare global {
  interface Window {
    gtag?: (
      command: "event" | "config" | "set",
      targetOrName: string,
      params?: Record<string, unknown>,
    ) => void;
  }
}

/**
 * Send a custom event to Google Analytics 4.
 *
 * @param name  - Event name (e.g. "test_start", "share_kakao", "ad_click")
 * @param params - Optional key-value pairs attached to the event
 */
export function trackEvent(
  name: string,
  params?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;
  if (!window.gtag) return;

  window.gtag("event", name, params);
}

/**
 * Track a page view (useful for SPA route changes).
 */
export function trackPageView(url: string): void {
  if (typeof window === "undefined") return;
  if (!window.gtag) return;

  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (!measurementId) return;

  window.gtag("config", measurementId, {
    page_path: url,
  });
}
