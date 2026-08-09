import { describe, expect, it } from "vitest";
import Stripe from "stripe";
import { createStripeClient, verifyStripeWebhook } from "./server";

describe("Stripe webhook verification", () => {
  const stripe = createStripeClient("sk_test_factory_placeholder");
  const webhookSecret = "whsec_factory_test_secret";
  const payload = JSON.stringify({
    id: "evt_factory_test",
    object: "event",
    api_version: null,
    created: 1_786_208_400,
    data: { object: { id: "sub_factory_test", object: "subscription" } },
    livemode: false,
    pending_webhooks: 1,
    request: null,
    type: "customer.subscription.updated",
  });

  it("accepts a correctly signed raw payload", () => {
    const signature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: webhookSecret,
    });

    expect(
      verifyStripeWebhook({ payload, signature, stripe, webhookSecret }).id,
    ).toBe("evt_factory_test");
  });

  it("rejects a mutated payload", () => {
    const signature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: webhookSecret,
    });

    expect(() =>
      verifyStripeWebhook({
        payload: `${payload} `,
        signature,
        stripe,
        webhookSecret,
      }),
    ).toThrow(Stripe.errors.StripeSignatureVerificationError);
  });
});
