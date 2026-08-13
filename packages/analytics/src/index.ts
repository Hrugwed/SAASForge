import { z } from "zod";

export const analyticsEventSchema = z
  .object({
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
  })
  .refine((event) => Boolean(event.userId || event.anonymousId), {
    message: "An analytics event requires a userId or anonymousId.",
  });

export type AnalyticsEvent = z.input<typeof analyticsEventSchema>;

export interface AnalyticsProvider {
  capture(event: z.output<typeof analyticsEventSchema>): Promise<void>;
  flush?(): Promise<void>;
}

export function createAnalytics(
  provider: AnalyticsProvider,
  options: {
    isAllowed?: (event: z.output<typeof analyticsEventSchema>) => boolean;
  } = {},
) {
  return {
    async capture(event: AnalyticsEvent): Promise<void> {
      const validated = analyticsEventSchema.parse(event);
      if (options.isAllowed && !options.isAllowed(validated)) return;
      await provider.capture(validated);
    },
    async flush(): Promise<void> {
      await provider.flush?.();
    },
  };
}

export const noopAnalyticsProvider: AnalyticsProvider = {
  async capture() {},
};
