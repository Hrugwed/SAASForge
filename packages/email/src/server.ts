import { Resend } from "resend";
import { z } from "zod";
import type { EmailProvider } from "./index";

const resendConfigSchema = z.object({
  apiKey: z.string().trim().startsWith("re_").min(8),
  from: z.string().trim().min(3).max(320),
});

type ResendClient = Pick<Resend, "emails">;

export class EmailDeliveryError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "EmailDeliveryError";
  }
}

export function createResendEmailProvider(input: {
  apiKey: string;
  from: string;
  client?: ResendClient;
}): EmailProvider {
  const config = resendConfigSchema.parse(input);
  const client = input.client ?? new Resend(config.apiKey);
  return {
    async send(message) {
      const response = await client.emails.send(
        {
          from: config.from,
          to: message.to,
          subject: message.subject,
          text: message.text,
          ...(message.html ? { html: message.html } : {}),
          ...(message.replyTo ? { replyTo: message.replyTo } : {}),
          tags: Object.entries(message.tags).map(([name, value]) => ({
            name,
            value,
          })),
        },
        { idempotencyKey: message.idempotencyKey },
      );
      if (response.error || !response.data) {
        throw new EmailDeliveryError(
          "The transactional email provider rejected the message.",
          {
            cause: response.error,
          },
        );
      }
      return { providerMessageId: response.data.id, acceptedAt: new Date() };
    },
  };
}
