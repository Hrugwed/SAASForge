import { z } from "zod";

export const emailMessageSchema = z.object({
  to: z.email(),
  subject: z.string().trim().min(1).max(160),
  text: z.string().min(1).max(100_000),
  html: z.string().min(1).max(200_000).optional(),
  replyTo: z.email().optional(),
  tags: z.record(z.string().max(40), z.string().max(100)).default({}),
});

export type EmailMessage = z.input<typeof emailMessageSchema>;
export type EmailDelivery = {
  providerMessageId: string;
  acceptedAt: Date;
};

export interface EmailProvider {
  send(message: EmailMessage): Promise<EmailDelivery>;
}

export function createEmailService(provider: EmailProvider) {
  return {
    async send(message: EmailMessage): Promise<EmailDelivery> {
      return provider.send(emailMessageSchema.parse(message));
    },
  };
}

export function renderWelcomeEmail(input: {
  productName: string;
  userName: string;
  dashboardUrl: string;
}) {
  const subject = `Welcome to ${input.productName}`;
  const text = `Hi ${input.userName},\n\nYour ${input.productName} workspace is ready.\n\nOpen it: ${input.dashboardUrl}`;
  return { subject, text };
}
