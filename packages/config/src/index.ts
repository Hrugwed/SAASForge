import { z } from "zod";

export const productConfigSchema = z.object({
  name: z.string().trim().min(2).max(40),
  description: z.string().trim().min(20).max(180),
  url: z.url(),
  supportEmail: z.email(),
  brand: z.object({
    accent: z.string().regex(/^#[0-9a-f]{6}$/i),
    foreground: z.string().regex(/^#[0-9a-f]{6}$/i),
  }),
});

export type ProductConfig = z.infer<typeof productConfigSchema>;

export function defineProductConfig(config: ProductConfig): ProductConfig {
  return productConfigSchema.parse(config);
}

const configuredUrl =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const productConfig = defineProductConfig({
  name: "SaaSForge",
  description:
    "A secure product platform with the design, revenue, identity, and operational foundations required to launch focused SaaS products quickly.",
  url: configuredUrl,
  supportEmail: "support@example.com",
  brand: {
    accent: "#ff5a36",
    foreground: "#11130f",
  },
});
