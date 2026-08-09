import "server-only";

import {
  createStripeBillingService,
  createStripeClient,
} from "@saasforge/billing/server";
import { database } from "@saasforge/database";
import { billingCatalog } from "./billing-config";
import { productConfig } from "./product-config";

let billingService: ReturnType<typeof createStripeBillingService> | undefined;

export function getBillingService() {
  if (billingService) return billingService;
  billingService = createStripeBillingService({
    appUrl: productConfig.url,
    catalog: billingCatalog,
    database,
    stripe: createStripeClient(process.env.STRIPE_SECRET_KEY ?? ""),
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  });
  return billingService;
}
