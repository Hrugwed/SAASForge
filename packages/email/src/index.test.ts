import { describe, expect, it, vi } from "vitest";
import { createEmailService, renderWelcomeEmail } from "./index";

describe("email module", () => {
  it("validates messages before delivery", async () => {
    const send = vi.fn().mockResolvedValue({
      providerMessageId: "message_test",
      acceptedAt: new Date(),
    });
    const service = createEmailService({ send });

    await service.send({
      to: "maker@example.com",
      subject: "Welcome",
      text: "Your workspace is ready.",
    });
    expect(send).toHaveBeenCalledOnce();
    await expect(
      service.send({ to: "not-an-email", subject: "Welcome", text: "Ready" }),
    ).rejects.toThrow();
  });

  it("renders provider-neutral welcome content", () => {
    expect(
      renderWelcomeEmail({
        productName: "Signal Desk",
        userName: "Maya",
        dashboardUrl: "https://signal.example/dashboard",
      }).text,
    ).toContain("Signal Desk workspace is ready");
  });
});
