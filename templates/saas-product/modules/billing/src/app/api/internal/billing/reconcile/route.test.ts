import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/billing-service", () => ({
  getBillingService: () => ({
    reconcileSubscriptions: vi.fn().mockResolvedValue({
      checked: 2,
      failed: 0,
      synchronized: 2,
    }),
  }),
}));

import { GET } from "./route";

describe("billing reconciliation route", () => {
  afterEach(() => {
    delete process.env.CRON_SECRET;
  });

  it("fails closed without the product-owned cron secret", async () => {
    const response = await GET(
      new Request("http://localhost/api/internal/billing/reconcile"),
    );
    expect(response.status).toBe(401);
  });

  it("runs with the exact bearer secret", async () => {
    process.env.CRON_SECRET = "test-reconciliation-secret";
    const response = await GET(
      new Request("http://localhost/api/internal/billing/reconcile", {
        headers: { Authorization: "Bearer test-reconciliation-secret" },
      }),
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ synchronized: 2 });
  });
});
