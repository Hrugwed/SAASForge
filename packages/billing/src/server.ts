import { createHash, randomUUID } from "node:crypto";
import type { PrismaClient } from "@saasforge/database";
import Stripe from "stripe";
import type { BillingCatalog, BillingPlan } from "./config";
import { getPlanByKey } from "./config";
import {
  normalizeSubscriptionStatus,
  resolveEntitlements,
} from "./entitlements";
import {
  BillingConfigurationError,
  BillingConflictError,
  BillingNotFoundError,
  BillingSecurityError,
} from "./errors";

const managedSubscriptionEvents = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.paused",
  "customer.subscription.resumed",
  "invoice.paid",
  "invoice.payment_failed",
]);

type StripeBillingServiceOptions = {
  appUrl: string;
  catalog: BillingCatalog;
  database: PrismaClient;
  stripe: Stripe;
  webhookSecret: string;
};

type CheckoutInput = {
  organizationId: string;
  planKey: string;
  userEmail: string;
  userId: string;
};

type BillingSyncEvent = { created: number; id: string; type: string };

function requiredStripeSecret(value: string | undefined, name: string): string {
  if (!value) {
    throw new BillingConfigurationError(`${name} is required.`);
  }
  return value;
}

function objectId(value: { id: string } | string | null): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

function unixDate(value: number | null | undefined): Date | null {
  return typeof value === "number" ? new Date(value * 1000) : null;
}

function eventSubscriptionId(event: Stripe.Event): string | null {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    return objectId(session.subscription);
  }

  if (event.type.startsWith("customer.subscription.")) {
    return (event.data.object as Stripe.Subscription).id;
  }

  if (
    event.type === "invoice.paid" ||
    event.type === "invoice.payment_failed"
  ) {
    const invoice = event.data.object as Stripe.Invoice;
    return objectId(invoice.parent?.subscription_details?.subscription ?? null);
  }

  return null;
}

function safeErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "Unknown error";
  return message.slice(0, 500);
}

function isUniqueConstraintError(error: unknown): boolean {
  return Boolean(
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "P2002",
  );
}

export function createStripeClient(secretKey: string): Stripe {
  return new Stripe(requiredStripeSecret(secretKey, "STRIPE_SECRET_KEY"), {
    appInfo: {
      name: "SaaSForge",
      version: "0.1.0",
    },
    maxNetworkRetries: 2,
    timeout: 10_000,
  });
}

export function verifyStripeWebhook(input: {
  payload: string;
  signature: string;
  stripe: Stripe;
  webhookSecret: string;
}): Stripe.Event {
  return input.stripe.webhooks.constructEvent(
    input.payload,
    input.signature,
    requiredStripeSecret(input.webhookSecret, "STRIPE_WEBHOOK_SECRET"),
  );
}

export class StripeBillingService {
  constructor(private readonly options: StripeBillingServiceOptions) {}

  async createCheckout(input: CheckoutInput): Promise<string> {
    const plan = this.requirePurchasablePlan(input.planKey);
    const existingSubscription =
      await this.options.database.subscription.findFirst({
        where: {
          organizationId: input.organizationId,
          provider: "STRIPE",
          status: {
            in: [
              "INCOMPLETE",
              "TRIALING",
              "ACTIVE",
              "PAST_DUE",
              "UNPAID",
              "PAUSED",
            ],
          },
        },
        orderBy: { createdAt: "desc" },
      });

    if (existingSubscription) {
      throw new BillingConflictError(
        "This workspace already has a Stripe subscription. Open the billing portal instead.",
      );
    }

    const customerRecord = await this.options.database.subscription.findFirst({
      where: {
        organizationId: input.organizationId,
        provider: "STRIPE",
        providerCustomerId: { not: null },
      },
      orderBy: { updatedAt: "desc" },
      select: { providerCustomerId: true },
    });

    const metadata = {
      organizationId: input.organizationId,
      planKey: plan.key,
      userId: input.userId,
    };
    const customerId = customerRecord?.providerCustomerId ?? undefined;
    const session = await this.options.stripe.checkout.sessions.create(
      {
        mode: "subscription",
        line_items: [{ price: plan.stripePriceId, quantity: 1 }],
        client_reference_id: input.organizationId,
        customer: customerId,
        customer_email: customerId ? undefined : input.userEmail,
        success_url: `${this.options.appUrl}/dashboard/billing?checkout=success`,
        cancel_url: `${this.options.appUrl}/dashboard/billing?checkout=cancelled`,
        allow_promotion_codes: true,
        billing_address_collection: "auto",
        metadata,
        subscription_data: { metadata },
      },
      { idempotencyKey: `checkout:${input.organizationId}:${randomUUID()}` },
    );

    if (!session.url) {
      throw new BillingConfigurationError(
        "Stripe did not return a hosted Checkout URL.",
      );
    }

    await this.options.database.auditEvent.create({
      data: {
        organizationId: input.organizationId,
        actorType: "USER",
        actorId: input.userId,
        action: "billing.checkout.created",
        targetType: "stripe_checkout_session",
        targetId: session.id,
        metadata: { planKey: plan.key },
      },
    });

    return session.url;
  }

  async createPortal(input: {
    organizationId: string;
    userId: string;
  }): Promise<string> {
    const subscription = await this.options.database.subscription.findFirst({
      where: {
        organizationId: input.organizationId,
        provider: "STRIPE",
        providerCustomerId: { not: null },
      },
      orderBy: { updatedAt: "desc" },
      select: { providerCustomerId: true },
    });

    if (!subscription?.providerCustomerId) {
      throw new BillingNotFoundError(
        "No Stripe customer exists for this workspace.",
      );
    }

    const portal = await this.options.stripe.billingPortal.sessions.create({
      customer: subscription.providerCustomerId,
      return_url: `${this.options.appUrl}/dashboard/billing`,
    });

    await this.options.database.auditEvent.create({
      data: {
        organizationId: input.organizationId,
        actorType: "USER",
        actorId: input.userId,
        action: "billing.portal.created",
        targetType: "stripe_customer",
        targetId: subscription.providerCustomerId,
      },
    });

    return portal.url;
  }

  async processWebhook(input: {
    payload: string;
    signature: string;
  }): Promise<{ duplicate: boolean; handled: boolean }> {
    const event = verifyStripeWebhook({
      ...input,
      stripe: this.options.stripe,
      webhookSecret: this.options.webhookSecret,
    });
    const payloadHash = createHash("sha256")
      .update(input.payload)
      .digest("hex");
    const claimed = await this.claimWebhook(event, payloadHash);

    if (!claimed) {
      return {
        duplicate: true,
        handled: managedSubscriptionEvents.has(event.type),
      };
    }

    try {
      const subscriptionId = eventSubscriptionId(event);
      const handled = managedSubscriptionEvents.has(event.type);

      if (handled && subscriptionId) {
        const subscription = await this.options.stripe.subscriptions.retrieve(
          subscriptionId,
          { expand: ["items.data.price.product"] },
        );
        await this.syncSubscription(subscription, event);
      }

      await this.options.database.processedWebhook.update({
        where: {
          provider_externalEventId: {
            provider: "STRIPE",
            externalEventId: event.id,
          },
        },
        data: {
          status: "PROCESSED",
          processedAt: new Date(),
          lastError: null,
        },
      });

      return { duplicate: false, handled };
    } catch (error) {
      await this.options.database.processedWebhook.update({
        where: {
          provider_externalEventId: {
            provider: "STRIPE",
            externalEventId: event.id,
          },
        },
        data: {
          status: "FAILED",
          lastError: safeErrorMessage(error),
        },
      });
      throw error;
    }
  }

  async reconcileSubscriptions(
    limit = 100,
  ): Promise<{ checked: number; failed: number; synchronized: number }> {
    const batchSize = Math.max(1, Math.min(limit, 100));
    const subscriptions = await this.options.database.subscription.findMany({
      where: {
        provider: "STRIPE",
        providerSubscriptionId: { not: null },
      },
      orderBy: { lastSyncedAt: "asc" },
      take: batchSize,
      select: { organizationId: true, providerSubscriptionId: true },
    });
    let failed = 0;
    let synchronized = 0;

    for (const record of subscriptions) {
      if (!record.providerSubscriptionId) continue;
      try {
        const subscription = await this.options.stripe.subscriptions.retrieve(
          record.providerSubscriptionId,
          { expand: ["items.data.price.product"] },
        );
        await this.syncSubscription(subscription, {
          id: `reconcile:${record.providerSubscriptionId}:${Date.now()}`,
          type: "billing.reconciliation",
          created: Math.floor(Date.now() / 1000),
        });
        synchronized += 1;
      } catch (error) {
        failed += 1;
        await this.options.database.auditEvent.create({
          data: {
            organizationId: record.organizationId,
            actorType: "SYSTEM",
            action: "billing.reconciliation.failed",
            targetType: "stripe_subscription",
            targetId: record.providerSubscriptionId,
            metadata: { error: safeErrorMessage(error) },
          },
        });
      }
    }

    return { checked: subscriptions.length, failed, synchronized };
  }

  private requirePurchasablePlan(planKey: string): BillingPlan & {
    stripePriceId: string;
  } {
    const plan = getPlanByKey(this.options.catalog, planKey);
    if (!plan?.stripePriceId) {
      throw new BillingConfigurationError(
        "The selected plan is not connected to a Stripe Price.",
      );
    }
    return plan as BillingPlan & { stripePriceId: string };
  }

  private async claimWebhook(
    event: Stripe.Event,
    payloadHash: string,
  ): Promise<boolean> {
    try {
      await this.options.database.processedWebhook.create({
        data: {
          provider: "STRIPE",
          externalEventId: event.id,
          eventType: event.type,
          livemode: event.livemode,
          status: "PROCESSING",
          payloadHash,
          attempts: 1,
        },
      });
      return true;
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error;
    }

    const existing = await this.options.database.processedWebhook.findUnique({
      where: {
        provider_externalEventId: {
          provider: "STRIPE",
          externalEventId: event.id,
        },
      },
    });

    if (!existing) return false;
    if (existing.payloadHash !== payloadHash) {
      throw new BillingSecurityError(
        "A Stripe event ID was received with a different payload.",
      );
    }
    if (existing.status === "PROCESSED") return false;

    const staleBefore = new Date(Date.now() - 5 * 60 * 1000);
    const retry = await this.options.database.processedWebhook.updateMany({
      where: {
        id: existing.id,
        OR: [
          { status: "FAILED" },
          { status: "PROCESSING", updatedAt: { lte: staleBefore } },
        ],
      },
      data: {
        status: "PROCESSING",
        attempts: { increment: 1 },
        lastError: null,
      },
    });

    return retry.count === 1;
  }

  private async syncSubscription(
    stripeSubscription: Stripe.Subscription,
    event: BillingSyncEvent,
  ): Promise<void> {
    const existing = await this.options.database.subscription.findUnique({
      where: { providerSubscriptionId: stripeSubscription.id },
    });
    const organizationId =
      stripeSubscription.metadata.organizationId ?? existing?.organizationId;

    if (!organizationId) return;
    if (existing && existing.organizationId !== organizationId) {
      throw new BillingSecurityError(
        "Stripe subscription ownership cannot be moved between workspaces.",
      );
    }

    const organization = await this.options.database.organization.findUnique({
      where: { id: organizationId },
      select: { id: true },
    });
    if (!organization) return;

    const item = stripeSubscription.items.data[0];
    if (!item) {
      throw new BillingConfigurationError(
        "Stripe subscription does not contain a billable item.",
      );
    }

    const priceId = item.price.id;
    const status = normalizeSubscriptionStatus(stripeSubscription.status);
    const currentPeriodStart = unixDate(item.current_period_start);
    const currentPeriodEnd = unixDate(item.current_period_end);
    const resolved = resolveEntitlements({
      catalog: this.options.catalog,
      priceId,
      status,
      currentPeriodEnd,
    });
    const customerId = objectId(stripeSubscription.customer);
    if (!customerId) {
      throw new BillingConfigurationError(
        "Stripe subscription does not contain a customer.",
      );
    }
    const providerEventCreatedAt = unixDate(event.created);
    if (!providerEventCreatedAt) {
      throw new BillingConfigurationError(
        "Stripe event does not contain a creation timestamp.",
      );
    }

    await this.options.database.$transaction(async (transaction) => {
      const current = await transaction.subscription.findUnique({
        where: { providerSubscriptionId: stripeSubscription.id },
      });
      let subscription;

      if (current) {
        const updated = await transaction.subscription.updateMany({
          where: {
            id: current.id,
            OR: [
              { providerEventCreatedAt: null },
              { providerEventCreatedAt: { lte: providerEventCreatedAt } },
            ],
          },
          data: {
            providerCustomerId: customerId,
            planKey: resolved.plan?.key,
            priceId,
            status,
            currentPeriodStart,
            currentPeriodEnd,
            cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
            providerEventCreatedAt,
            lastSyncedAt: new Date(),
          },
        });
        if (updated.count === 0) return;
        subscription = { ...current, id: current.id };
      } else {
        subscription = await transaction.subscription.create({
          data: {
            organizationId,
            provider: "STRIPE",
            providerCustomerId: customerId,
            providerSubscriptionId: stripeSubscription.id,
            planKey: resolved.plan?.key,
            priceId,
            status,
            currentPeriodStart,
            currentPeriodEnd,
            cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
            providerEventCreatedAt,
            lastSyncedAt: new Date(),
          },
        });
      }

      await transaction.entitlement.updateMany({
        where: { organizationId },
        data: { enabled: false, expiresAt: null },
      });

      for (const entitlement of resolved.entitlements) {
        await transaction.entitlement.upsert({
          where: {
            organizationId_key: {
              organizationId,
              key: entitlement.key,
            },
          },
          create: {
            organizationId,
            subscriptionId: subscription.id,
            ...entitlement,
          },
          update: {
            subscriptionId: subscription.id,
            value: entitlement.value,
            enabled: entitlement.enabled,
            expiresAt: entitlement.expiresAt,
          },
        });
      }

      await transaction.auditEvent.create({
        data: {
          organizationId,
          actorType: "SYSTEM",
          action: "billing.subscription.synced",
          targetType: "stripe_subscription",
          targetId: stripeSubscription.id,
          metadata: {
            eventId: event.id,
            eventType: event.type,
            planKey: resolved.plan?.key ?? null,
            priceId,
            status,
          },
        },
      });
    });
  }
}

export function createStripeBillingService(
  options: StripeBillingServiceOptions,
): StripeBillingService {
  return new StripeBillingService({
    ...options,
    appUrl: options.appUrl.replace(/\/$/, ""),
    webhookSecret: requiredStripeSecret(
      options.webhookSecret,
      "STRIPE_WEBHOOK_SECRET",
    ),
  });
}

export {
  BillingConfigurationError,
  BillingConflictError,
  BillingNotFoundError,
  BillingSecurityError,
};
