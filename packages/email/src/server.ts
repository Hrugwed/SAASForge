import { Resend } from "resend";
import { z } from "zod";
import type { EmailProvider } from "./index";

const resendConfigSchema = z.object({
  apiKey: z.string().trim().startsWith("re_").min(8),
  from: z.string().trim().min(3).max(320),
});

type ResendClient = Pick<Resend, "emails">;

function retryableProviderError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const status =
    "statusCode" in error && typeof error.statusCode === "number"
      ? error.statusCode
      : null;
  const name = "name" in error ? String(error.name) : "";
  return (
    status === 429 ||
    Boolean(status && status >= 500) ||
    /rate|timeout/i.test(name)
  );
}

async function wait(milliseconds: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

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
  retryDelay?: (milliseconds: number) => Promise<void>;
}): EmailProvider {
  const config = resendConfigSchema.parse(input);
  const client = input.client ?? new Resend(config.apiKey);
  return {
    async send(message) {
      const retryDelay = input.retryDelay ?? wait;
      for (let attempt = 1; attempt <= 3; attempt += 1) {
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
        if (response.data) {
          return {
            providerMessageId: response.data.id,
            acceptedAt: new Date(),
            attempts: attempt,
          };
        }
        if (attempt < 3 && retryableProviderError(response.error)) {
          await retryDelay(200 * 2 ** (attempt - 1));
          continue;
        }
        throw new EmailDeliveryError(
          "The transactional email provider rejected the message.",
          { cause: response.error },
        );
      }
      throw new EmailDeliveryError(
        "The transactional email provider exhausted delivery attempts.",
      );
    },
  };
}
