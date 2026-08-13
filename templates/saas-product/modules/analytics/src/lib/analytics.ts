import "server-only";
import { createAnalytics, noopAnalyticsProvider } from "@saasforge/analytics";
import { createPostHogAnalyticsProvider } from "@saasforge/analytics/server";

let analytics: ReturnType<typeof createAnalytics> | undefined;

export function getAnalytics() {
  if (analytics) return analytics;
  const apiKey = process.env.POSTHOG_API_KEY;
  if (apiKey) {
    analytics = createAnalytics(
      createPostHogAnalyticsProvider({
        apiKey,
        host: process.env.POSTHOG_HOST,
      }),
    );
    return analytics;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "POSTHOG_API_KEY is required when the analytics module is enabled.",
    );
  }
  analytics = createAnalytics(noopAnalyticsProvider);
  return analytics;
}
