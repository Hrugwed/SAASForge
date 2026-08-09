import { describe, expect, it } from "vitest";
import {
  checkoutRequestSchema,
  defineBillingCatalog,
  getPlanByKey,
} from "./config";

const plan = {
  key: "pro",
  name: "Pro",
  description: "A production plan for focused SaaS products.",
  priceLabel: "$29 / month",
  stripePriceId: "price_testpro",
  features: ["Ten projects"],
  entitlements: { projects: 10 },
};

describe("billing catalog", () => {
  it("accepts an internal plan key but never a client-provided Stripe Price", () => {
    expect(checkoutRequestSchema.safeParse({ planKey: "pro" }).success).toBe(
      true,
    );
    expect(
      checkoutRequestSchema.safeParse({
        planKey: "pro",
        stripePriceId: "price_attacker",
      }).success,
    ).toBe(false);
  });

  it("rejects duplicate plan keys and Stripe Price IDs", () => {
    expect(() =>
      defineBillingCatalog({ plans: [plan, { ...plan, name: "Other" }] }),
    ).toThrow("Duplicate billing plan key");
    expect(() =>
      defineBillingCatalog({
        plans: [plan, { ...plan, key: "team", name: "Team" }],
      }),
    ).toThrow("Duplicate Stripe Price ID");
  });

  it("looks up plans through the server-owned catalog", () => {
    const catalog = defineBillingCatalog({ plans: [plan] });
    expect(getPlanByKey(catalog, "pro")?.stripePriceId).toBe("price_testpro");
    expect(getPlanByKey(catalog, "missing")).toBeNull();
  });
});
