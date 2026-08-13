import { randomUUID } from "node:crypto";
import { z } from "zod";

export const emailMessageSchema = z.object({
  to: z.email(),
  subject: z.string().trim().min(1).max(160),
  text: z.string().min(1).max(100_000),
  html: z.string().min(1).max(200_000).optional(),
  replyTo: z.email().optional(),
  tags: z
    .record(
      z.string().regex(/^[a-zA-Z0-9_-]{1,40}$/),
      z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/),
    )
    .default({}),
  idempotencyKey: z.string().trim().min(8).max(256),
});

export type EmailMessageInput = z.input<typeof emailMessageSchema>;
export type EmailMessage = z.output<typeof emailMessageSchema>;
export type EmailDelivery = {
  providerMessageId: string;
  acceptedAt: Date;
  attempts: number;
};

export interface EmailProvider {
  send(message: EmailMessage): Promise<EmailDelivery>;
}

export function createEmailService(provider: EmailProvider) {
  return {
    async send(message: EmailMessageInput): Promise<EmailDelivery> {
      return provider.send(emailMessageSchema.parse(message));
    },
  };
}

export const localEmailProvider: EmailProvider = {
  async send() {
    return {
      providerMessageId: `local_${randomUUID()}`,
      acceptedAt: new Date(),
      attempts: 1,
    };
  },
};

export function renderWelcomeEmail(input: {
  productName: string;
  userName: string;
  dashboardUrl: string;
}) {
  const subject = `Welcome to ${input.productName}`;
  const text = `Hi ${input.userName},\n\nYour ${input.productName} workspace is ready.\n\nOpen it: ${input.dashboardUrl}`;
  return { subject, text };
}
