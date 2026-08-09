import { defineProductConfig } from "@saasforge/config";

export const productConfig = defineProductConfig({
  name: "__PRODUCT_NAME__",
  description: "__PRODUCT_DESCRIPTION__",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3100",
  supportEmail: "support@example.com",
  brand: {
    accent: "#645cff",
    foreground: "#171725",
  },
});

export const enabledModules = {
  auth: __AUTH_ENABLED__,
  billing: __BILLING_ENABLED__,
  email: __EMAIL_ENABLED__,
  analytics: __ANALYTICS_ENABLED__,
} as const;
