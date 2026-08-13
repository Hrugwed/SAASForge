import { describe, expect, it, vi } from "vitest";
import { createAnalytics } from "./index";

describe("analytics module", () => {
  it("normalizes and validates product events", async () => {
    const capture = vi.fn().mockResolvedValue(undefined);
    const analytics = createAnalytics({ capture });
    await analytics.capture({
      name: "product.activated",
      userId: "user_123",
      properties: { source: "onboarding", completed: true },
    });
    expect(capture).toHaveBeenCalledWith(
      expect.objectContaining({ name: "product.activated" }),
    );
    await expect(
      analytics.capture({ name: "Invalid Event Name!", userId: "user_123" }),
    ).rejects.toThrow();
  });
});
