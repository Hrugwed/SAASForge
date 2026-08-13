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
    expect(delivery.attempts).toBe(1);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({ from: "SaaSForge <hello@example.com>" }),
      { idempotencyKey: "welcome-user_123" },
    );
  });

  it("retries transient rejection with the same idempotency key", async () => {
    const send = vi
      .fn()
      .mockResolvedValueOnce({
        data: null,
        error: { name: "rate_limit_exceeded", statusCode: 429 },
      })
      .mockResolvedValueOnce({ data: { id: "email_retry" }, error: null });
    const retryDelay = vi.fn().mockResolvedValue(undefined);
    const provider = createResendEmailProvider({
      apiKey: "re_test_key",
      from: "hello@example.com",
      client: { emails: { send } } as never,
      retryDelay,
    });
    const delivery = await createEmailService(provider).send({
      to: "founder@example.com",
      subject: "Hello",
      text: "Hello",
      idempotencyKey: "message-retry-123",
    });
    expect(delivery.attempts).toBe(2);
    expect(send).toHaveBeenCalledTimes(2);
    expect(retryDelay).toHaveBeenCalledWith(200);
    expect(send.mock.calls[0]?.[1]).toEqual(send.mock.calls[1]?.[1]);
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
