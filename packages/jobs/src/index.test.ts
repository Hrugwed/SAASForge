import { describe, expect, it } from "vitest";
import { createJobs, createMemoryJobProvider } from "./index";

describe("jobs module", () => {
  it("validates tenant context and records idempotent events", async () => {
    const provider = createMemoryJobProvider();
    const jobs = createJobs(provider);
    await jobs.send({
      name: "document/processing.requested",
      idempotencyKey: "document_123-v1",
      organizationId: "org_123",
      data: { documentId: "document_123" },
    });
    expect(provider.events).toHaveLength(1);
    await expect(
      jobs.send({
        name: "invalid event",
        idempotencyKey: "invalid-event",
        organizationId: "",
        data: {},
      }),
    ).rejects.toThrow();
  });
});
