import type Stripe from "stripe";
import type { BillingCatalog, BillingPlan } from "./config";
import { getPlanByPriceId } from "./config";

export type NormalizedSubscriptionStatus =
  | "INCOMPLETE"
  | "INCOMPLETE_EXPIRED"
  | "TRIALING"
  | "ACTIVE"
  | "PAST_DUE"
  | "CANCELED"
  | "UNPAID"
  | "PAUSED";

export type ResolvedEntitlement = {
  key: string;
  value: number | null;
  enabled: boolean;
  expiresAt: Date | null;
};

export function normalizeSubscriptionStatus(
  status: Stripe.Subscription.Status,
): NormalizedSubscriptionStatus {
  const statusMap: Record<
    Stripe.Subscription.Status,
    NormalizedSubscriptionStatus
  > = {
    incomplete: "INCOMPLETE",
    incomplete_expired: "INCOMPLETE_EXPIRED",
    trialing: "TRIALING",
    active: "ACTIVE",
    past_due: "PAST_DUE",
    canceled: "CANCELED",
    unpaid: "UNPAID",
    paused: "PAUSED",
  };

  return statusMap[status];
}

export function subscriptionAllowsAccess(input: {
  status: NormalizedSubscriptionStatus;
  currentPeriodEnd: Date | null;
  pastDueGraceDays: number;
  now?: Date;
}): boolean {
  if (input.status === "ACTIVE" || input.status === "TRIALING") {
    return true;
  }

  if (input.status !== "PAST_DUE" || !input.currentPeriodEnd) {
    return false;
  }

  const graceEndsAt = new Date(input.currentPeriodEnd);
  graceEndsAt.setUTCDate(graceEndsAt.getUTCDate() + input.pastDueGraceDays);
  return graceEndsAt > (input.now ?? new Date());
}

export function resolveEntitlements(input: {
  catalog: BillingCatalog;
  priceId: string;
  status: NormalizedSubscriptionStatus;
  currentPeriodEnd: Date | null;
  now?: Date;
}): { plan: BillingPlan | null; entitlements: ResolvedEntitlement[] } {
  const plan = getPlanByPriceId(input.catalog, input.priceId);

  if (!plan) {
    return { plan: null, entitlements: [] };
  }

  const enabled = subscriptionAllowsAccess({
    status: input.status,
    currentPeriodEnd: input.currentPeriodEnd,
    pastDueGraceDays: input.catalog.pastDueGraceDays,
    now: input.now,
  });

  return {
    plan,
    entitlements: Object.entries(plan.entitlements).map(([key, value]) => ({
      key,
      value: typeof value === "number" ? value : null,
      enabled: enabled && value !== false,
      expiresAt: enabled ? input.currentPeriodEnd : null,
    })),
  };
}

export function hasEntitlement(
  entitlement: { enabled: boolean; expiresAt: Date | null } | null | undefined,
  now = new Date(),
): boolean {
  return Boolean(
    entitlement?.enabled &&
    (!entitlement.expiresAt || entitlement.expiresAt > now),
  );
}
