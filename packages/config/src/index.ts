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
