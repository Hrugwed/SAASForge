import { describe, expect, it, vi } from "vitest";
import { createEmailService } from "./index";
import { createResendEmailProvider, EmailDeliveryError } from "./server";

describe("Resend email provider", () => {
  it("maps validated messages and forwards the idempotency key", async () => {
    const send = vi
      .fn()
      .mockResolvedValue({ data: { id: "email_123" }, error: null });
    const provider = createResendEmailProvider({
      apiKey: "re_test_key",
      from: "SaaSForge <hello@example.com>",
      client: { emails: { send } } as never,
    });
    const delivery = await createEmailService(provider).send({
      to: "founder@example.com",
      subject: "Workspace ready",
      text: "Your workspace is ready.",
      tags: { message_type: "welcome" },
      idempotencyKey: "welcome-user_123",
    });
    expect(delivery.providerMessageId).toBe("email_123");
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({ from: "SaaSForge <hello@example.com>" }),
      { idempotencyKey: "welcome-user_123" },
    );
  });

  it("returns a sanitized provider error", async () => {
    const provider = createResendEmailProvider({
      apiKey: "re_test_key",
      from: "hello@example.com",
      client: {
        emails: {
          send: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "provider detail" },
          }),
        },
      } as never,
    });
    await expect(
      createEmailService(provider).send({
        to: "founder@example.com",
        subject: "Hello",
        text: "Hello",
        idempotencyKey: "message-123",
      }),
    ).rejects.toThrow(EmailDeliveryError);
  });
});
