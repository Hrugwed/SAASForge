import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@saasforge/database";
import type Stripe from "stripe";
import { defineBillingCatalog } from "./config";
import {
  BillingSecurityError,
  createStripeBillingService,
  createStripeClient,
} from "./server";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for billing integration tests.");
}
const integration = describe;
const eventPrefix = `evt_integration_${Date.now()}`;
const organizationPrefix = `org_integration_${Date.now()}`;
let database: PrismaClient;

beforeAll(async () => {
  if (!process.env.DATABASE_URL) return;
  ({ database } = await import("@saasforge/database"));
});

afterAll(async () => {
  if (!database) return;
  await database.processedWebhook.deleteMany({
    where: { externalEventId: { startsWith: eventPrefix } },
  });
  await database.organization.deleteMany({
    where: { id: { startsWith: organizationPrefix } },
  });
  await database.$disconnect();
});

function serviceWithStripe(stripe: Stripe) {
  return createStripeBillingService({
    appUrl: "https://product.example",
    catalog: defineBillingCatalog({
      plans: [
        {
          key: "pro",
          name: "Pro",
          description: "A plan used by database integration tests.",
          priceLabel: "$10 / month",
          stripePriceId: "price_integration",
          features: ["Integration access"],
          entitlements: { access: true },
        },
      ],
    }),
    database,
    stripe,
    webhookSecret: "whsec_database_integration",
  });
}

function signedEvent(stripe: Stripe, id: string, marker = "original") {
  const payload = JSON.stringify({
    id,
    object: "event",
    api_version: null,
    created: 1_786_208_400,
    data: { object: { id: "cus_integration", marker, object: "customer" } },
    livemode: false,
    pending_webhooks: 1,
    request: null,
    type: "customer.created",
  });
  return {
    payload,
    signature: stripe.webhooks.generateTestHeaderString({
      payload,
      secret: "whsec_database_integration",
    }),
  };
}

function signedSubscriptionEvent(
  stripe: Stripe,
  input: { created: number; id: string; subscriptionId: string },
) {
  const payload = JSON.stringify({
    id: input.id,
    object: "event",
    api_version: null,
    created: input.created,
    data: { object: { id: input.subscriptionId, object: "subscription" } },
    livemode: false,
    pending_webhooks: 1,
    request: null,
    type: "customer.subscription.updated",
  });
  return {
    payload,
    signature: stripe.webhooks.generateTestHeaderString({
      payload,
      secret: "whsec_database_integration",
    }),
  };
}

function subscriptionSnapshot(input: {
  organizationId: string;
  status: "active" | "canceled";
  subscriptionId: string;
}): Stripe.Subscription {
  return {
    id: input.subscriptionId,
    object: "subscription",
    cancel_at_period_end: input.status === "canceled",
    customer: "cus_integration_ordering",
    items: {
      data: [
        {
          current_period_end: 1_789_000_000,
          current_period_start: 1_786_000_000,
          price: { id: "price_integration" },
        },
      ],
    },
    metadata: { organizationId: input.organizationId },
    status: input.status,
  } as unknown as Stripe.Subscription;
}

integration("Stripe webhook database integration", () => {
  it("persists completion, deduplicates, and rejects changed payloads", async () => {
    const stripe = createStripeClient("sk_test_database_integration");
    const service = serviceWithStripe(stripe);
    const eventId = `${eventPrefix}_dedupe`;

    await expect(
      service.processWebhook(signedEvent(stripe, eventId)),
    ).resolves.toEqual({ duplicate: false, handled: false });
    await expect(
      service.processWebhook(signedEvent(stripe, eventId)),
    ).resolves.toEqual({ duplicate: true, handled: false });
    await expect(
      service.processWebhook(signedEvent(stripe, eventId, "changed")),
    ).rejects.toThrow(BillingSecurityError);

    await expect(
      database.processedWebhook.findUnique({
        where: {
          provider_externalEventId: {
            provider: "STRIPE",
            externalEventId: eventId,
          },
        },
        select: { attempts: true, status: true },
      }),
    ).resolves.toEqual({ attempts: 1, status: "PROCESSED" });
  });

  it("persists failures and atomically claims each retry", async () => {
    const signingStripe = createStripeClient("sk_test_database_integration");
    const eventId = `${eventPrefix}_retry`;
    const payload = JSON.stringify({
      id: eventId,
      object: "event",
      api_version: null,
      created: 1_786_208_400,
      data: {
        object: { id: "sub_integration", object: "subscription" },
      },
      livemode: false,
      pending_webhooks: 1,
      request: null,
      type: "customer.subscription.updated",
    });
    const event = {
      payload,
      signature: signingStripe.webhooks.generateTestHeaderString({
        payload,
        secret: "whsec_database_integration",
      }),
    };
    const stripe = {
      webhooks: signingStripe.webhooks,
      subscriptions: {
        retrieve: vi.fn().mockRejectedValue(new Error("provider unavailable")),
      },
    } as unknown as Stripe;
    const service = serviceWithStripe(stripe);

    await expect(service.processWebhook(event)).rejects.toThrow(
      "provider unavailable",
    );
    await expect(service.processWebhook(event)).rejects.toThrow(
      "provider unavailable",
    );

    await expect(
      database.processedWebhook.findUnique({
        where: {
          provider_externalEventId: {
            provider: "STRIPE",
            externalEventId: eventId,
          },
        },
        select: { attempts: true, lastError: true, status: true },
      }),
    ).resolves.toEqual({
      attempts: 2,
      lastError: "provider unavailable",
      status: "FAILED",
    });
  });

  it("keeps newer subscription and entitlement state when events arrive out of order", async () => {
    const signingStripe = createStripeClient("sk_test_database_integration");
    const organizationId = `${organizationPrefix}_ordering`;
    const subscriptionId = `sub_integration_ordering_${Date.now()}`;
    await database.organization.create({
      data: {
        id: organizationId,
        name: "Integration Ordering",
        slug: `integration-ordering-${Date.now()}`,
        createdAt: new Date(),
      },
    });
    const stripe = {
      webhooks: signingStripe.webhooks,
      subscriptions: {
        retrieve: vi
          .fn()
          .mockResolvedValueOnce(
            subscriptionSnapshot({
              organizationId,
              status: "active",
              subscriptionId,
            }),
          )
          .mockResolvedValueOnce(
            subscriptionSnapshot({
              organizationId,
              status: "canceled",
              subscriptionId,
            }),
          ),
      },
    } as unknown as Stripe;
    const service = serviceWithStripe(stripe);

    await service.processWebhook(
      signedSubscriptionEvent(signingStripe, {
        created: 1_786_208_500,
        id: `${eventPrefix}_ordering_newer`,
        subscriptionId,
      }),
    );
    await service.processWebhook(
      signedSubscriptionEvent(signingStripe, {
        created: 1_786_208_400,
        id: `${eventPrefix}_ordering_older`,
        subscriptionId,
      }),
    );

    await expect(
      database.subscription.findUnique({
        where: { providerSubscriptionId: subscriptionId },
        select: { status: true, providerEventCreatedAt: true },
      }),
    ).resolves.toEqual({
      status: "ACTIVE",
      providerEventCreatedAt: new Date(1_786_208_500_000),
    });
    await expect(
      database.entitlement.findUnique({
        where: { organizationId_key: { organizationId, key: "access" } },
        select: { enabled: true },
      }),
    ).resolves.toEqual({ enabled: true });
  });
});
