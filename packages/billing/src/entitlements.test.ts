import { describe, expect, it } from "vitest";
import { defineBillingCatalog } from "./config";
import {
  hasEntitlement,
  normalizeSubscriptionStatus,
  resolveEntitlements,
  subscriptionAllowsAccess,
} from "./entitlements";

const catalog = defineBillingCatalog({
  pastDueGraceDays: 3,
  plans: [
    {
      key: "pro",
      name: "Pro",
      description: "A production plan for focused SaaS products.",
      priceLabel: "$29 / month",
      stripePriceId: "price_testpro",
      features: ["Ten projects"],
      entitlements: { projects: 10, exports: true },
    },
  ],
});

describe("billing entitlements", () => {
  it("normalizes every Stripe subscription state", () => {
    expect(normalizeSubscriptionStatus("incomplete_expired")).toBe(
      "INCOMPLETE_EXPIRED",
    );
    expect(normalizeSubscriptionStatus("active")).toBe("ACTIVE");
    expect(normalizeSubscriptionStatus("paused")).toBe("PAUSED");
  });

  it("fails closed for an unknown Stripe Price", () => {
    const resolved = resolveEntitlements({
      catalog,
      priceId: "price_unknown",
      status: "ACTIVE",
      currentPeriodEnd: new Date("2030-01-01T00:00:00.000Z"),
    });

    expect(resolved.plan).toBeNull();
    expect(resolved.entitlements).toEqual([]);
  });

  it("grants configured limits only for an accessible subscription", () => {
    const resolved = resolveEntitlements({
      catalog,
      priceId: "price_testpro",
      status: "ACTIVE",
      currentPeriodEnd: new Date("2030-01-01T00:00:00.000Z"),
    });

    expect(resolved.entitlements).toContainEqual({
      key: "projects",
      value: 10,
      enabled: true,
      expiresAt: new Date("2030-01-01T00:00:00.000Z"),
    });
  });

  it("uses a bounded grace period for past-due subscriptions", () => {
    expect(
      subscriptionAllowsAccess({
        status: "PAST_DUE",
        currentPeriodEnd: new Date("2026-08-10T00:00:00.000Z"),
        pastDueGraceDays: 3,
        now: new Date("2026-08-12T00:00:00.000Z"),
      }),
    ).toBe(true);
    expect(
      subscriptionAllowsAccess({
        status: "PAST_DUE",
        currentPeriodEnd: new Date("2026-08-10T00:00:00.000Z"),
        pastDueGraceDays: 3,
        now: new Date("2026-08-14T00:00:00.000Z"),
      }),
    ).toBe(false);
  });

  it("checks expiry as well as the enabled flag", () => {
    expect(
      hasEntitlement(
        { enabled: true, expiresAt: new Date("2026-08-10T00:00:00.000Z") },
        new Date("2026-08-11T00:00:00.000Z"),
      ),
    ).toBe(false);
  });
});
