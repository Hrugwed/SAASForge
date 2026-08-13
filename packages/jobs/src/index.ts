import { z } from "zod";

const jobValueSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.string().max(10_000),
    z.number().finite(),
    z.boolean(),
    z.null(),
    z.array(jobValueSchema).max(100),
    z.record(z.string().max(100), jobValueSchema),
  ]),
);

export const jobEventSchema = z.object({
  name: z.string().regex(/^[a-z][a-z0-9_.\/-]{2,119}$/),
  idempotencyKey: z.string().trim().min(8).max(160),
  organizationId: z.string().trim().min(1).max(160),
  userId: z.string().trim().min(1).max(160).optional(),
  data: z.record(z.string().max(100), jobValueSchema),
  occurredAt: z.date().default(() => new Date()),
});

export type JobEventInput = z.input<typeof jobEventSchema>;
export type JobEvent = z.output<typeof jobEventSchema>;
export type JobReceipt = { providerEventId: string; acceptedAt: Date };

export interface JobProvider {
  send(event: JobEvent): Promise<JobReceipt>;
}

export function createJobs(provider: JobProvider) {
  return {
    async send(event: JobEventInput): Promise<JobReceipt> {
      return provider.send(jobEventSchema.parse(event));
    },
  };
}

export function createMemoryJobProvider(
  events: JobEvent[] = [],
): JobProvider & {
  events: JobEvent[];
} {
  return {
    events,
    async send(event) {
      events.push(event);
      return {
        providerEventId: `local_${event.idempotencyKey}`,
        acceptedAt: new Date(),
      };
    },
  };
}
