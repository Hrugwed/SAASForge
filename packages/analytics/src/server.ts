import { PostHog } from "posthog-node";
import { z } from "zod";
import type { AnalyticsProvider } from "./index";

const postHogConfigSchema = z.object({
  apiKey: z.string().trim().min(8),
  host: z.url().default("https://us.i.posthog.com"),
});

type PostHogClient = Pick<PostHog, "captureImmediate" | "shutdown">;

export function createPostHogAnalyticsProvider(input: {
  apiKey: string;
  host?: string;
  client?: PostHogClient;
}): AnalyticsProvider {
  const config = postHogConfigSchema.parse(input);
  const client =
    input.client ??
    new PostHog(config.apiKey, {
      host: config.host,
      flushAt: 1,
      flushInterval: 0,
      disableGeoip: true,
    });
  return {
    async capture(event) {
      await client.captureImmediate({
        distinctId: event.userId ?? event.anonymousId!,
        event: event.name,
        properties: {
          ...event.properties,
          ...(event.anonymousId ? { anonymous_id: event.anonymousId } : {}),
          occurred_at: event.occurredAt.toISOString(),
        },
        ...(event.organizationId
          ? { groups: { organization: event.organizationId } }
          : {}),
      });
    },
    async flush() {
      await client.shutdown(5_000);
    },
  };
}
