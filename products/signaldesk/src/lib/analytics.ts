import { createAnalytics, noopAnalyticsProvider } from "@saasforge/analytics";

export const analytics = createAnalytics(noopAnalyticsProvider);

// Replace the no-op provider with this product's production adapter at launch.
