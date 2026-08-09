import { z } from "zod";

export const analyticsEventSchema = z.object({
  name: z.string().regex(/^[a-z][a-z0-9_.-]{1,79}$/),
  anonymousId: z.string().max(160).optional(),
  userId: z.string().max(160).optional(),
  organizationId: z.string().max(160).optional(),
  properties: z
    .record(
      z.string().max(80),
      z.union([z.string().max(500), z.number(), z.boolean(), z.null()]),
    )
    .default({}),
  occurredAt: z.date().default(() => new Date()),
});

export type AnalyticsEvent = z.input<typeof analyticsEventSchema>;

export interface AnalyticsProvider {
  capture(event: z.output<typeof analyticsEventSchema>): Promise<void>;
}

export function createAnalytics(provider: AnalyticsProvider) {
  return {
    async capture(event: AnalyticsEvent): Promise<void> {
      await provider.capture(analyticsEventSchema.parse(event));
    },
  };
}

export const noopAnalyticsProvider: AnalyticsProvider = {
  async capture() {},
};
