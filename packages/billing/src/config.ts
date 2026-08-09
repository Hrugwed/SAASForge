import { z } from "zod";

const entitlementValueSchema = z.union([
  z.boolean(),
  z.number().int().nonnegative(),
]);

export const billingPlanSchema = z.object({
  key: z.string().regex(/^[a-z][a-z0-9-]{1,39}$/),
  name: z.string().trim().min(2).max(60),
  description: z.string().trim().min(10).max(180),
  priceLabel: z.string().trim().min(2).max(40),
  stripePriceId: z
    .string()
    .regex(/^price_[A-Za-z0-9]+$/)
    .optional(),
  features: z.array(z.string().trim().min(2).max(100)).min(1).max(12),
  entitlements: z.record(z.string().min(1).max(80), entitlementValueSchema),
});

export const billingCatalogSchema = z.object({
  plans: z.array(billingPlanSchema).min(1).max(12),
  pastDueGraceDays: z.number().int().min(0).max(30).default(3),
});

export const checkoutRequestSchema = z
  .object({
    planKey: z.string().regex(/^[a-z][a-z0-9-]{1,39}$/),
  })
  .strict();

export type BillingPlan = z.infer<typeof billingPlanSchema>;
export type BillingCatalogInput = z.input<typeof billingCatalogSchema>;
export type BillingCatalog = z.output<typeof billingCatalogSchema>;
export type EntitlementValue = z.infer<typeof entitlementValueSchema>;

export function defineBillingCatalog(
  input: BillingCatalogInput,
): BillingCatalog {
  const catalog = billingCatalogSchema.parse(input);
  const planKeys = new Set<string>();
  const priceIds = new Set<string>();

  for (const plan of catalog.plans) {
    if (planKeys.has(plan.key)) {
      throw new Error(`Duplicate billing plan key: ${plan.key}`);
    }
    planKeys.add(plan.key);

    if (plan.stripePriceId) {
      if (priceIds.has(plan.stripePriceId)) {
        throw new Error(`Duplicate Stripe Price ID: ${plan.stripePriceId}`);
      }
      priceIds.add(plan.stripePriceId);
    }
  }

  return catalog;
}

export function getPlanByKey(
  catalog: BillingCatalog,
  key: string,
): BillingPlan | null {
  return catalog.plans.find((plan) => plan.key === key) ?? null;
}

export function getPlanByPriceId(
  catalog: BillingCatalog,
  priceId: string,
): BillingPlan | null {
  return catalog.plans.find((plan) => plan.stripePriceId === priceId) ?? null;
}

export function isPlanPurchasable(plan: BillingPlan): boolean {
  return Boolean(plan.stripePriceId);
}
