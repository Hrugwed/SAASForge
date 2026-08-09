import { defineProductConfig } from "@saasforge/config";

export const factoryConfig = defineProductConfig({
  name: "SaaSForge",
  description:
    "A private SaaS factory for repeatedly building, validating, and launching focused products from proven modules.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  supportEmail: "support@example.com",
  brand: {
    accent: "#ff5a36",
    foreground: "#11130f",
  },
});
