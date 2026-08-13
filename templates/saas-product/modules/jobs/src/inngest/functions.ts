import { database } from "@saasforge/database";
import { cron } from "inngest";
import { inngest } from "./client";

function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.length < 1 || value.length > 160) {
    throw new Error(`Invalid ${field}.`);
  }
  return value;
}

export const productTask = inngest.createFunction(
  {
    id: "product-task",
    triggers: { event: "product/task.requested" },
    retries: 5,
    idempotency: "event.id",
    concurrency: [{ limit: 10, key: "event.data.organizationId" }],
    onFailure: async ({ error, event }) => {
      const original = event.data.event.data as Record<string, unknown>;
      const organizationId = requiredString(
        original.organizationId,
        "organizationId",
      );
      await database.auditEvent.create({
        data: {
          organizationId,
          actorType: "SYSTEM",
          action: "job.product-task.failed",
          targetType: "inngest_run",
          targetId: event.data.run_id,
          metadata: {
            error: error.message.slice(0, 500),
            functionId: event.data.function_id,
          },
        },
      });
    },
  },
  async ({ event, step }) => {
    const organizationId = requiredString(
      event.data.organizationId,
      "organizationId",
    );
    return step.run("execute-core-value", async () => {
      // Replace this body with the product's unique operation. Re-fetch and
      // authorize tenant-owned resources here; never trust event data alone.
      return { accepted: true, organizationId };
    });
  },
);

export const dailyMaintenance = inngest.createFunction(
  {
    id: "daily-maintenance",
    triggers: [cron("TZ=UTC 37 3 * * *")],
    retries: 3,
  },
  async ({ step }) =>
    step.run("record-maintenance-check", async () => ({
      checkedAt: new Date().toISOString(),
    })),
);

export const functions = [productTask, dailyMaintenance];
