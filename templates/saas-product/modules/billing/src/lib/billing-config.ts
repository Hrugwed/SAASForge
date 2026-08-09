import { defineBillingCatalog } from "@saasforge/billing";
import { productConfig } from "./product-config";

const configuredPrice = process.env.STRIPE_PRICE_DEFAULT?.trim() || undefined;

export const billingCatalog = defineBillingCatalog({
  pastDueGraceDays: 3,
  plans: [
    {
      key: "default",
      name: "Product plan",
      description: `Configure the validated ${productConfig.name} offer here.`,
      priceLabel: "Set product price",
      stripePriceId: configuredPrice,
      features: [
        "Core product workflow",
        "Secure workspace",
        "Product support",
      ],
      entitlements: { core_workflow: true },
    },
  ],
});

export const billingConfigured = Boolean(
  process.env.STRIPE_SECRET_KEY &&
  process.env.STRIPE_WEBHOOK_SECRET &&
  configuredPrice,
);
