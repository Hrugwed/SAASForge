import { describe, expect, it, vi } from "vitest";
import { createJobs } from "./index";
import { createInngestJobProvider } from "./server";

describe("Inngest job provider", () => {
  it("uses the stable idempotency key as the provider event id", async () => {
    const send = vi.fn().mockResolvedValue({ ids: ["event_123"] });
    const jobs = createJobs(createInngestJobProvider({ send } as never));
    const receipt = await jobs.send({
      name: "report/generate.requested",
      idempotencyKey: "report_123-v1",
      organizationId: "org_123",
      data: { reportId: "report_123" },
    });
    expect(receipt.providerEventId).toBe("event_123");
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "report_123-v1",
        name: "report/generate.requested",
      }),
    );
  });
});
