import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@saasforge/database";
import type Stripe from "stripe";
import { defineBillingCatalog } from "./config";
import { createStripeBillingService } from "./server";

describe("Stripe reconciliation", () => {
  it("continues a bounded batch and audits provider failures", async () => {
    const auditCreate = vi.fn().mockResolvedValue({});
    const database = {
      subscription: {
        findMany: vi.fn().mockResolvedValue([
          {
            organizationId: "org_test",
            providerSubscriptionId: "sub_unavailable",
          },
        ]),
      },
      auditEvent: { create: auditCreate },
    } as unknown as PrismaClient;
    const stripe = {
      subscriptions: {
        retrieve: vi.fn().mockRejectedValue(new Error("provider unavailable")),
      },
    } as unknown as Stripe;
    const service = createStripeBillingService({
      appUrl: "https://product.example",
      catalog: defineBillingCatalog({
        plans: [
          {
            key: "pro",
            name: "Pro",
            description: "A test plan used for reconciliation behavior.",
            priceLabel: "$10 / month",
            stripePriceId: "price_test",
            features: ["Test access"],
            entitlements: { access: true },
          },
        ],
      }),
      database,
      stripe,
      webhookSecret: "whsec_test",
    });

    await expect(service.reconcileSubscriptions(1)).resolves.toEqual({
      checked: 1,
      failed: 1,
      synchronized: 0,
    });
    expect(auditCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "billing.reconciliation.failed",
        organizationId: "org_test",
        targetId: "sub_unavailable",
      }),
    });
  });
});
