import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@saasforge/database";
import Stripe from "stripe";
import { defineBillingCatalog } from "./config";
import {
  BillingSecurityError,
  createStripeBillingService,
  createStripeClient,
  verifyStripeWebhook,
} from "./server";

type StoredWebhook = {
  id: string;
  payloadHash: string;
  status: "PROCESSING" | "PROCESSED" | "FAILED";
  attempts: number;
  updatedAt: Date;
  lastError: string | null;
};

function createWebhookHarness(options: { failCompletionOnce?: boolean } = {}) {
  let stored: StoredWebhook | null = null;
  let failCompletion = options.failCompletionOnce ?? false;
  const processedWebhook = {
    create: vi.fn().mockImplementation(
      async (input: {
        data: {
          attempts: number;
          payloadHash: string;
          status: "PROCESSING";
        };
      }) => {
        if (stored) {
          throw Object.assign(new Error("Unique constraint"), {
            code: "P2002",
          });
        }
        stored = {
          id: "webhook_test",
          payloadHash: input.data.payloadHash,
          status: input.data.status,
          attempts: input.data.attempts,
          updatedAt: new Date(),
          lastError: null,
        };
        return stored;
      },
    ),
    findUnique: vi.fn().mockImplementation(async () => stored),
    updateMany: vi.fn().mockImplementation(async () => {
      if (!stored || stored.status === "PROCESSED") return { count: 0 };
      stored.status = "PROCESSING";
      stored.attempts += 1;
      stored.lastError = null;
      stored.updatedAt = new Date();
      return { count: 1 };
    }),
    update: vi.fn().mockImplementation(
      async (input: {
        data: {
          lastError?: string | null;
          status: "PROCESSED" | "FAILED";
        };
      }) => {
        if (input.data.status === "PROCESSED" && failCompletion) {
          failCompletion = false;
          throw new Error("Completion write interrupted");
        }
        if (!stored) throw new Error("Webhook claim is missing");
        stored.status = input.data.status;
        stored.lastError = input.data.lastError ?? null;
        stored.updatedAt = new Date();
        return stored;
      },
    ),
  };
  const database = { processedWebhook } as unknown as PrismaClient;
  const stripe = createStripeClient("sk_test_factory_placeholder");
  const webhookSecret = "whsec_factory_test_secret";
  const service = createStripeBillingService({
    appUrl: "https://product.example",
    catalog: defineBillingCatalog({
      plans: [
        {
          key: "pro",
          name: "Pro",
          description: "A test plan for webhook processing behavior.",
          priceLabel: "$10 / month",
          stripePriceId: "price_test",
          features: ["Test access"],
          entitlements: { access: true },
        },
      ],
    }),
    database,
    stripe,
    webhookSecret,
  });

  function signedPayload(marker = "original") {
    const payload = JSON.stringify({
      id: "evt_deduplication_test",
      object: "event",
      api_version: null,
      created: 1_786_208_400,
      data: { object: { id: "cus_test", marker, object: "customer" } },
      livemode: false,
      pending_webhooks: 1,
      request: null,
      type: "customer.created",
    });
    return {
      payload,
      signature: stripe.webhooks.generateTestHeaderString({
        payload,
        secret: webhookSecret,
      }),
    };
  }

  return {
    processedWebhook,
    service,
    signedPayload,
    stored: () => stored,
  };
}

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

describe("Stripe webhook retries and deduplication", () => {
  it("returns a completed event as a duplicate without processing it again", async () => {
    const harness = createWebhookHarness();
    const event = harness.signedPayload();

    await expect(harness.service.processWebhook(event)).resolves.toEqual({
      duplicate: false,
      handled: false,
    });
    await expect(harness.service.processWebhook(event)).resolves.toEqual({
      duplicate: true,
      handled: false,
    });

    expect(harness.stored()).toMatchObject({
      attempts: 1,
      status: "PROCESSED",
    });
    expect(harness.processedWebhook.updateMany).not.toHaveBeenCalled();
  });

  it("marks an interrupted attempt failed and claims it for retry", async () => {
    const harness = createWebhookHarness({ failCompletionOnce: true });
    const event = harness.signedPayload();

    await expect(harness.service.processWebhook(event)).rejects.toThrow(
      "Completion write interrupted",
    );
    expect(harness.stored()).toMatchObject({
      attempts: 1,
      lastError: "Completion write interrupted",
      status: "FAILED",
    });

    await expect(harness.service.processWebhook(event)).resolves.toEqual({
      duplicate: false,
      handled: false,
    });
    expect(harness.stored()).toMatchObject({
      attempts: 2,
      lastError: null,
      status: "PROCESSED",
    });
    expect(harness.processedWebhook.updateMany).toHaveBeenCalledTimes(1);
  });

  it("rejects a known event ID when its signed payload changes", async () => {
    const harness = createWebhookHarness();

    await harness.service.processWebhook(harness.signedPayload());

    await expect(
      harness.service.processWebhook(harness.signedPayload("changed")),
    ).rejects.toThrow(BillingSecurityError);
    expect(harness.stored()).toMatchObject({
      attempts: 1,
      status: "PROCESSED",
    });
  });
});
