import { defineProductConfig } from "@saasforge/config";

export const productConfig = defineProductConfig({
  name: "SignalDesk",
  description:
    "Turn scattered customer feedback into clear, prioritized product decisions.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3100",
  supportEmail: "support@example.com",
  brand: {
    accent: "#645cff",
    foreground: "#171725",
  },
});

export const enabledModules = {
  auth: true,
  billing: true,
  email: true,
  analytics: true,
} as const;
