import { describe, expect, it, vi } from "vitest";
import { createAnalytics } from "./index";
import { createPostHogAnalyticsProvider } from "./server";

describe("PostHog analytics provider", () => {
  it("maps identity, groups, properties, and timestamps", async () => {
    const captureImmediate = vi.fn().mockResolvedValue(undefined);
    const shutdown = vi.fn().mockResolvedValue(undefined);
    const analytics = createAnalytics(
      createPostHogAnalyticsProvider({
        apiKey: "phc_test_key",
        client: { captureImmediate, shutdown },
      }),
    );
    const occurredAt = new Date("2026-01-02T03:04:05.000Z");
    await analytics.capture({
      name: "product.activated",
      userId: "user_123",
      organizationId: "org_123",
      properties: { source: "onboarding" },
      occurredAt,
    });
    expect(captureImmediate).toHaveBeenCalledWith(
      expect.objectContaining({
        distinctId: "user_123",
        groups: { organization: "org_123" },
        properties: expect.objectContaining({
          occurred_at: occurredAt.toISOString(),
        }),
      }),
    );
    await analytics.flush();
    expect(shutdown).toHaveBeenCalledWith(5_000);
  });

  it("supports consent-aware suppression", async () => {
    const capture = vi.fn().mockResolvedValue(undefined);
    const analytics = createAnalytics({ capture }, { isAllowed: () => false });
    await analytics.capture({
      name: "product.viewed",
      anonymousId: "anon_123",
    });
    expect(capture).not.toHaveBeenCalled();
  });
});
